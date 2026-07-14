/**
 * Service de simulação de maquilhagem da MF2.
 */
import { AppError } from "../middlewares/error.middleware.js";
import { FacePhoto } from "../models/face-photo.model.js";
import {
    MakeupSimulation,
    MAKEUP_SIMULATION_STATUSES,
} from "../models/makeup-simulation.model.js";
import { MakeupSimulationQuota } from "../models/makeup-simulation-quota.model.js";
import mongoose from "mongoose";
import { AiConsultationSession } from "../models/ai-consultation-session.model.js";
import {
    AiJob,
    AI_JOB_STATUSES,
    AI_JOB_TYPES,
} from "../models/ai-job.model.js";
import { FaceReport, FACE_REPORT_LIFECYCLE } from "../models/face-report.model.js";
import { FaceConsent } from "../models/face-consent.model.js";
import { FaceAnalysis } from "../models/face-analysis.model.js";
import { ProductRecommendation } from "../models/product-recommendation.model.js";
import { Product } from "../models/product.model.js";
import { ReportUnlock, REPORT_UNLOCK_STATUS } from "../models/report-unlock.model.js";
import { enqueueAiJob } from "./ai-job.service.js";
import { readEncryptedFacePhotoFile } from "./face-secure-storage.service.js";
import { editCosmeticPhotoWithOpenAi } from "../providers/openai-cosmetic-edit.provider.js";
import {
    readEncryptedMakeupOutput,
    writeEncryptedMakeupOutput,
} from "./makeup-simulation-storage.service.js";
import { enqueueFileDeletionJobs } from "./file-deletion-job.service.js";
import {
    GENERATIVE_COSMETIC_VISUALIZATION_NOTICE_VERSION,
    GENERATIVE_MAKEUP_NOTICE_VERSION,
} from "../constants/purpose-grants.js";
import { assertFaceConsentAllowsConfiguredProvider } from "./face-photo.service.js";
import { claimFaceDataWrite } from "./face-data-write-barrier.service.js";
import { hashCanonicalSnapshot } from "./consultation-report.service.js";
import { resolveProductVariant } from "./product-variant.service.js";
import { env } from "../config/env.js";

const MAKEUP_OUTPUT_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const MAKEUP_DAILY_LIMIT = 3;
const MAKEUP_QUOTA_WINDOW_MS = 24 * 60 * 60 * 1000;
const REUSABLE_MAKEUP_STATUSES = Object.freeze([
    MAKEUP_SIMULATION_STATUSES.QUEUED,
    MAKEUP_SIMULATION_STATUSES.PROCESSING,
    MAKEUP_SIMULATION_STATUSES.COMPLETED,
    MAKEUP_SIMULATION_STATUSES.FAILED_RETRYABLE,
]);

function buildActiveGenerationKey(fingerprint) {
    return `cosmetic:${fingerprint}`;
}

async function ensureMakeupQuotaLedger(userId) {
    try {
        await MakeupSimulationQuota.updateOne(
            { userId },
            { $setOnInsert: { userId, reservations: [] } },
            { upsert: true },
        );
    } catch (error) {
        // A primeira utilização pode disputar o mesmo upsert. O índice único
        // escolhe um vencedor e os restantes pedidos usam esse ledger.
        if (error?.code !== 11000) throw error;
    }
}

async function findReusableMakeupSimulation(
    userId,
    activeGenerationKey,
    now,
    noticeVersion,
    session = null,
) {
    let query = MakeupSimulation.findOne({
        userId,
        schemaVersion: { $gte: 2 },
        activeGenerationKey,
        status: { $in: REUSABLE_MAKEUP_STATUSES },
        "generativeConsent.noticeVersion": noticeVersion,
        "generativeConsent.acceptedAt": { $type: "date" },
        "generativeConsent.revokedAt": null,
        $or: [{ expiresAt: null }, { expiresAt: { $gt: now } }],
    }).sort({ createdAt: -1 });
    if (session) query = query.session(session);
    return query;
}

async function reserveMakeupQuota(userId, simulationId, now, session) {
    const since = new Date(now.getTime() - MAKEUP_QUOTA_WINDOW_MS);
    const recentReservations = {
        $filter: {
            input: { $ifNull: ["$reservations", []] },
            as: "reservation",
            cond: { $gte: ["$$reservation.createdAt", since] },
        },
    };
    const quota = await MakeupSimulationQuota.findOneAndUpdate(
        {
            userId,
            $expr: {
                $lt: [{ $size: recentReservations }, MAKEUP_DAILY_LIMIT],
            },
        },
        [
            {
                $set: {
                    reservations: {
                        $concatArrays: [
                            recentReservations,
                            [{ simulationId, createdAt: now }],
                        ],
                    },
                    updatedAt: now,
                },
            },
        ],
        { new: true, session, updatePipeline: true },
    );
    if (!quota) {
        throw new AppError(429, "Limite diário de pré-visualizações atingido");
    }
}

async function requeueRetryableMakeupSimulation(
    simulation,
    userId,
    now,
    session,
) {
    if (simulation.status !== MAKEUP_SIMULATION_STATUSES.FAILED_RETRYABLE) {
        return simulation;
    }
    const job = await AiJob.findOneAndUpdate(
        {
            _id: simulation.jobId,
            userId,
            type: AI_JOB_TYPES.GENERATE_MAKEUP_PREVIEW,
            status: AI_JOB_STATUSES.FAILED_RETRYABLE,
            manualRetryCount: { $lt: 2 },
        },
        {
            $set: {
                status: AI_JOB_STATUSES.QUEUED,
                availableAt: now,
                attempts: 0,
                maxAttempts: 1,
                "lastError.code": null,
                "lastError.retryable": false,
                "lastError.at": null,
            },
            $inc: { manualRetryCount: 1 },
        },
        { new: true, session },
    );
    if (!job) {
        const replay = await AiJob.findOne({
            _id: simulation.jobId,
            userId,
            type: AI_JOB_TYPES.GENERATE_MAKEUP_PREVIEW,
            status: {
                $in: [AI_JOB_STATUSES.QUEUED, AI_JOB_STATUSES.PROCESSING],
            },
        }).session(session);
        if (!replay) {
            throw new AppError(409, "A pré-visualização não pode ser repetida");
        }
    }
    await MakeupSimulation.updateOne(
        {
            _id: simulation._id,
            status: MAKEUP_SIMULATION_STATUSES.FAILED_RETRYABLE,
        },
        {
            $set: {
                status: MAKEUP_SIMULATION_STATUSES.QUEUED,
                failedAt: null,
                safeErrorCode: null,
            },
        },
        { session },
    );
    return MakeupSimulation.findById(simulation._id).session(session);
}

function toV2SimulationDto(simulation) {
    return {
        id: simulation._id.toString(),
        reportId: simulation.reportId.toString(),
        status: simulation.status,
        intensity: simulation.intensity ?? "balanced",
        effectCodes: simulation.effectCodes ?? [],
        omittedEffects: simulation.omittedEffects ?? [],
        feedback: simulation.feedback ?? null,
        jobId: simulation.jobId?.toString?.() ?? null,
        provider: simulation.requestedModel
            ? {
                  name: "openai",
                  requestedModel: simulation.requestedModel,
                  effectiveModel: simulation.effectiveModel ?? null,
                  requestId: simulation.providerRequestId ?? null,
                  promptVersion: simulation.promptVersion ?? null,
                  schemaVersion: simulation.responseSchemaVersion ?? null,
              }
            : null,
        expiresAt: simulation.expiresAt,
        imageUrl:
            simulation.status === MAKEUP_SIMULATION_STATUSES.COMPLETED
                ? `/api/cosmetic-visualizations/${simulation._id.toString()}/image`
                : null,
        warning:
            "Pré-visualização gerada por IA — o resultado real poderá variar.",
        createdAt: simulation.createdAt,
        updatedAt: simulation.updatedAt,
    };
}

function assertCompleteImageProvenance(provenance) {
    const requiredValues = [
        provenance?.requestedModel,
        provenance?.effectiveModel,
        provenance?.requestId,
        provenance?.promptVersion,
        provenance?.schemaVersion,
        provenance?.requestedSize,
        provenance?.quality,
        provenance?.format,
        provenance?.outputWidth,
        provenance?.outputHeight,
    ];
    if (
        provenance?.provider !== "openai" ||
        requiredValues.some(
            (value, index) =>
                index < requiredValues.length - 2
                    ? typeof value !== "string" || !value.trim()
                    : !Number.isInteger(value) || value < 1,
        )
    ) {
        throw new AppError(502, "Proveniência da edição OpenAI incompleta");
    }
}

function sourcePhotoReplacedError() {
    return new AppError(
        409,
        "A fotografia usada na pré-visualização foi substituída.",
        { code: "MAKEUP_SOURCE_PHOTO_REPLACED", retryable: false },
    );
}

/** Confirma que a fotografia congelada da simulação continua operacional. */
async function assertActiveMakeupSourcePhoto(simulation, session = null) {
    let query = FacePhoto.exists({
        _id: simulation.facePhotoId,
        userId: simulation.userId,
        kind: "frontal",
        status: "active",
    });
    if (session) query = query.session(session);
    if (!(await query)) throw sourcePhotoReplacedError();
}

/**
 * Publica o output sob a mesma barreira transacional usada pela substituição.
 *
 * Se a substituição confirmar primeiro, a fotografia já não está ativa e a
 * publicação falha. Se esta transação confirmar primeiro, a substituição
 * seguinte encontra o output e encaminha-o para o outbox antes de invalidar o
 * documento. Não existe, portanto, uma ordem em que o derivado sobreviva ao
 * commit que retirou a fotografia original.
 */
async function publishMakeupSimulationOutput(simulation, generated, stored) {
    const databaseSession = await mongoose.startSession();
    let updated;
    try {
        await databaseSession.withTransaction(async () => {
            await claimFaceDataWrite(simulation.userId, databaseSession);
            const activeConsent = await FaceConsent.findOne({
                _id: simulation.consentId,
                userId: simulation.userId,
                version: "face-analysis-v2",
                revokedAt: null,
                "externalProviderConsent.provider": "openai",
                "externalProviderConsent.revokedAt": null,
            }).session(databaseSession);
            if (!activeConsent) {
                throw new AppError(
                    403,
                    "Consentimento revogado antes da publicação",
                );
            }
            assertFaceConsentAllowsConfiguredProvider(activeConsent);
            await assertActiveMakeupSourcePhoto(simulation, databaseSession);

            const completedAt = new Date();
            updated = await MakeupSimulation.findOneAndUpdate(
                {
                    _id: simulation._id,
                    userId: simulation.userId,
                    facePhotoId: simulation.facePhotoId,
                    consentId: simulation.consentId,
                    schemaVersion: { $gte: 2 },
                    status: MAKEUP_SIMULATION_STATUSES.PROCESSING,
                    "generativeConsent.revokedAt": null,
                },
                {
                    $set: {
                        status: MAKEUP_SIMULATION_STATUSES.COMPLETED,
                        requestedModel: generated.provenance.requestedModel,
                        effectiveModel: generated.provenance.effectiveModel,
                        providerRequestId: generated.provenance.requestId,
                        promptVersion: generated.provenance.promptVersion,
                        responseSchemaVersion:
                            generated.provenance.schemaVersion,
                        requestedWidth: Number(
                            generated.provenance.requestedSize.split("x")[0],
                        ),
                        requestedHeight: Number(
                            generated.provenance.requestedSize.split("x")[1],
                        ),
                        outputWidth: generated.provenance.outputWidth,
                        outputHeight: generated.provenance.outputHeight,
                        outputQuality: generated.provenance.quality,
                        outputFormat: generated.provenance.format,
                        outputStorageKey: stored.storageKey,
                        outputEncryption: stored.encryption,
                        outputMimeType: stored.mimeType,
                        outputSizeBytes: stored.sizeBytes,
                        completedAt,
                        expiresAt: new Date(
                            completedAt.getTime() + MAKEUP_OUTPUT_TTL_MS,
                        ),
                    },
                },
                { new: true, session: databaseSession },
            );
            if (!updated) {
                throw new AppError(
                    409,
                    "Simulação alterada concorrentemente",
                );
            }
        });
        return updated;
    } finally {
        await databaseSession.endSession();
    }
}

function normalizeLegacyVisualizationSpec(spec) {
    if (Array.isArray(spec?.objectives)) return spec;
    const regions = Array.isArray(spec?.regions) ? spec.regions : [];
    return {
        version: "legacy-makeup-v2",
        enabled: spec?.enabled === true,
        objectives: spec?.enabled
            ? [
                  {
                      code: "makeup",
                      priority: "primary",
                      effect: "apply_confirmed_catalog_makeup",
                      regions,
                  },
              ]
            : [],
        allowedIntensities: ["balanced"],
        defaultIntensity: "balanced",
        makeup: {
            requestedRegions: regions,
            effectiveRegions: regions,
            requiresVariantConfirmation: true,
        },
        variantRecommendationIds: [],
        visualRecommendationIds: [],
        preserve: spec?.preserve ?? [],
        omittedEffects: [],
        limitations: [],
    };
}

/**
 * Impede que um relatório cujo objetivo principal é maquilhagem consuma quota
 * ou faça rede quando o plano perdeu regiões ou variantes executáveis.
 */
function assertPrimaryMakeupVisualizationExecutable(
    report,
    visualizationSpec,
    { legacy = false } = {},
) {
    if (legacy) return;
    const primaryGoal = report.objectives?.find(
        ({ priority }) => priority === "primary",
    )?.code;
    if (primaryGoal !== "makeup") return;

    const makeupObjective = visualizationSpec.objectives?.find(
        ({ code, effect }) =>
            code === "makeup" && effect === "apply_confirmed_catalog_makeup",
    );
    const effectiveRegions = visualizationSpec.makeup?.effectiveRegions ?? [];
    const recommendationIds =
        visualizationSpec.visualRecommendationIds ??
        visualizationSpec.variantRecommendationIds ?? [];
    if (
        !makeupObjective ||
        effectiveRegions.length === 0 ||
        recommendationIds.length === 0
    ) {
        throw new AppError(
            409,
            "A pré-visualização não tem camadas de maquilhagem executáveis. Inicia uma nova consulta para completar estas escolhas.",
            { code: "PRIMARY_MAKEUP_VISUALIZATION_INCOMPLETE" },
        );
    }
}

function assertConfirmedMakeupRegionsCovered(
    report,
    visualizationSpec,
    recommendationSnapshot,
    { legacy = false } = {},
) {
    if (legacy) return;
    const primaryGoal = report.objectives?.find(
        ({ priority }) => priority === "primary",
    )?.code;
    if (primaryGoal !== "makeup") return;
    const confirmedRegions = new Set(
        recommendationSnapshot.flatMap(({ visualRoles = [] }) => visualRoles),
    );
    const missingRegions = (
        visualizationSpec.makeup?.effectiveRegions ?? []
    ).filter((region) => !confirmedRegions.has(region));
    const confirmedFunctions = new Set(
        recommendationSnapshot.flatMap(({ makeupFunctions = [] }) => makeupFunctions),
    );
    const missingFunctions = (
        visualizationSpec.makeup?.effectiveFunctions ?? []
    ).filter((value) => !confirmedFunctions.has(value));
    if (missingRegions.length > 0 || missingFunctions.length > 0) {
        throw new AppError(
            409,
            "Os produtos confirmados já não cobrem todas as regiões e funções de maquilhagem. Revê as variantes antes de gerar.",
            { code: "PRIMARY_MAKEUP_VARIANT_COVERAGE_INCOMPLETE" },
        );
    }
}

function validateVariantSelections(
    recommendations,
    productsById,
    visualIds,
    requiredIds,
    variantSelections,
) {
    if ([...requiredIds].some((id) => !visualIds.has(id))) {
        throw new AppError(409, "Contrato visual com variantes incoerentes");
    }
    const selections = new Map(
        variantSelections.map((item) => [item.recommendationId, item.variantId]),
    );
    if (
        selections.size !== requiredIds.size ||
        [...selections.keys()].some((id) => !requiredIds.has(id))
    ) {
        throw new AppError(
            400,
            "Confirma exatamente as variantes necessárias à pré-visualização",
        );
    }

    return recommendations
        .filter((recommendation) => visualIds.has(recommendation._id.toString()))
        .map((recommendation) => {
            const product = productsById.get(recommendation.productId.toString());
            if (!product) throw new AppError(409, "Produto recomendado indisponível");
            const recommendationId = recommendation._id.toString();
            const mustConfirmVariant = requiredIds.has(recommendationId);
            const variantId = mustConfirmVariant
                ? selections.get(recommendationId)
                : recommendation.variantId;
            const variant = variantId
                ? resolveProductVariant(product, variantId)
                : null;
            if (
                (mustConfirmVariant && !variant) ||
                (variant && variant.stock <= 0) ||
                (!variant && (product.variants?.length ?? 0) > 0) ||
                (!variant && Number(product.stock) <= 0)
            ) {
                throw new AppError(409, "Variante confirmada sem stock atual");
            }
            const roles = [...new Set([
                ...(product.makeup?.regions ?? []),
                ...(product.routineSteps ?? []),
            ])].filter((step) =>
                ["complexion", "cheeks", "eyes", "brows", "lips"].includes(step),
            );
            if (
                product.concernTags?.includes("sun_protection") &&
                !roles.includes("complexion")
            ) {
                roles.push("complexion");
            }
            return {
                recommendationId,
                productId: product._id.toString(),
                productName: product.name,
                variantId: variant?.variantId ?? null,
                variantLabel: variant?.label ?? null,
                colorHex: variant?.colorHex ?? null,
                finish: variant?.finish ?? product.attributes?.finish ?? null,
                coverage:
                    variant?.coverage ?? product.attributes?.coverage ?? null,
                visualRoles: roles,
                makeupFunctions: product.makeup?.functions ?? [],
                applicationAreas: product.makeup?.applicationAreas ?? [],
                styleTags: product.makeup?.styleTags ?? [],
                wearProfiles: product.makeup?.wearProfiles ?? [],
            };
        });
}

/** Cria ou reutiliza uma pré-visualização cosmética para um relatório aberto. */
export async function createCosmeticVisualizationForReport(
    userId,
    input,
    consent,
    { legacy = false } = {},
) {
    const expectedNotice = legacy
        ? GENERATIVE_MAKEUP_NOTICE_VERSION
        : GENERATIVE_COSMETIC_VISUALIZATION_NOTICE_VERSION;
    if (
        !consent?._id ||
        consent.revokedAt ||
        consent.version !== "face-analysis-v2" ||
        consent.externalProviderConsent?.provider !== "openai" ||
        consent.externalProviderConsent?.revokedAt ||
        input.generativeEditNoticeVersion !== expectedNotice
        || input.generativeEditAccepted !== true
    ) {
        throw new AppError(403, "Consentimento de edição generativa obrigatório");
    }
    assertFaceConsentAllowsConfiguredProvider(consent);

    const [report, unlock] = await Promise.all([
        FaceReport.findOne({
            _id: input.reportId,
            userId,
            schemaVersion: 2,
            lifecycleStatus: FACE_REPORT_LIFECYCLE.UNLOCKED,
            privacyStatus: "active",
        }),
        ReportUnlock.findOne({
            reportId: input.reportId,
            userId,
            status: REPORT_UNLOCK_STATUS.UNLOCKED,
        }),
    ]);
    if (!report || !unlock) throw new AppError(423, "Relatório ainda bloqueado");
    const visualizationSpec = normalizeLegacyVisualizationSpec(
        report.visualizationSpec ?? report.simulationSpec,
    );
    if (!visualizationSpec.enabled) {
        throw new AppError(409, "Relatório sem efeitos visuais aplicáveis");
    }
    assertPrimaryMakeupVisualizationExecutable(report, visualizationSpec, {
        legacy,
    });

    const analysis = await FaceAnalysis.findOne({
        _id: report.analysisId,
        userId,
        status: "completed",
    }).select("photoIds");
    if (!analysis) throw new AppError(409, "Análise do relatório indisponível");
    const [analysisPhoto, recommendations, consultation] = await Promise.all([
        FacePhoto.findOne({
            _id: { $in: analysis.photoIds },
            userId,
            kind: "frontal",
            status: "active",
        }),
        ProductRecommendation.find({
            _id: { $in: report.finalRecommendationIds },
            userId,
            reportId: report._id,
            schemaVersion: 2,
        }).sort({ selectionRank: 1 }),
        AiConsultationSession.findOne({
            _id: report.consultationSessionId,
            userId,
        }).select("_id"),
    ]);
    if (!analysisPhoto) throw new AppError(409, "Fotografia frontal ativa obrigatória");

    const products = await Product.find({
        _id: { $in: recommendations.map(({ productId }) => productId) },
        aiEligible: true,
    }).select("name attributes makeup concernTags routineSteps variants priceCents stock");
    const productsById = new Map(
        products.map((product) => [product._id.toString(), product]),
    );
    let requiredIds = new Set(
        (visualizationSpec.variantRecommendationIds ?? []).map(String),
    );
    let visualIds = new Set(
        (
            visualizationSpec.visualRecommendationIds ??
            visualizationSpec.variantRecommendationIds ??
            []
        ).map(String),
    );
    let variantSelections = input.variantSelections ?? [];
    if (legacy && requiredIds.size === 0) {
        const legacyRecommendations = recommendations.filter(
            ({ variantId }) => Boolean(variantId),
        );
        requiredIds = new Set(
            legacyRecommendations.map(({ _id }) => _id.toString()),
        );
        visualIds = new Set(requiredIds);
        variantSelections = legacyRecommendations.map((recommendation) => ({
            recommendationId: recommendation._id.toString(),
            variantId: recommendation.variantId,
        }));
    }
    const recommendationSnapshot = validateVariantSelections(
        recommendations,
        productsById,
        visualIds,
        requiredIds,
        variantSelections,
    );
    assertConfirmedMakeupRegionsCovered(
        report,
        visualizationSpec,
        recommendationSnapshot,
        { legacy },
    );
    const intensity = legacy ? "balanced" : input.intensity;
    const fingerprint = hashCanonicalSnapshot({
        userId: userId.toString(),
        reportId: report._id.toString(),
        facePhotoId: analysisPhoto._id.toString(),
        intensity,
        objectives: visualizationSpec.objectives,
        variants: recommendationSnapshot.map(
            ({ recommendationId, variantId }) => ({
                recommendationId,
                variantId,
            }),
        ),
        promptVersion: env.openAiImagePromptVersion,
        schemaVersion: env.openAiImageSchemaVersion,
        quality: env.openAiImageQuality,
        format: "png",
        sizePolicy: "ratio-budget-1024x1536-min512-max1536-multiple16-v1",
    });
    const activeGenerationKey = buildActiveGenerationKey(fingerprint);
    const now = new Date();
    if (
        await MakeupSimulation.exists({
            userId,
            reportId: report._id,
            schemaVersion: { $gte: 2 },
            status: MAKEUP_SIMULATION_STATUSES.COMPLETED,
            expiresAt: { $lte: now },
        })
    ) {
        await expireMakeupSimulationOutputs(now, { userId, reportId: report._id });
    }

    await ensureMakeupQuotaLedger(userId);
    const simulationId = new mongoose.Types.ObjectId();
    const session = await mongoose.startSession();
    let simulation;
    try {
        try {
            await session.withTransaction(async () => {
                simulation = await findReusableMakeupSimulation(
                    userId,
                    activeGenerationKey,
                    now,
                    expectedNotice,
                    session,
                );
                if (simulation) {
                    simulation = await requeueRetryableMakeupSimulation(
                        simulation,
                        userId,
                        now,
                        session,
                    );
                    return;
                }
                await reserveMakeupQuota(userId, simulationId, now, session);
                [simulation] = await MakeupSimulation.create(
                    [
                        {
                            _id: simulationId,
                            schemaVersion: 3,
                            visualizationKind: legacy ? "legacy_makeup" : "cosmetic",
                            userId,
                            reportId: report._id,
                            facePhotoId: analysisPhoto._id,
                            consentId: consent._id,
                            generativeConsent: {
                                noticeVersion: expectedNotice,
                                acceptedAt: now,
                                revokedAt: null,
                            },
                            recommendationIds: recommendationSnapshot.map(
                                ({ recommendationId }) => recommendationId,
                            ),
                            status: MAKEUP_SIMULATION_STATUSES.QUEUED,
                            activeGenerationKey,
                            intensity,
                            effectCodes: visualizationSpec.objectives.map(
                                ({ effect }) => effect,
                            ),
                            omittedEffects:
                                visualizationSpec.omittedEffects ?? [],
                            simulationSpec: visualizationSpec,
                            recommendationSnapshot,
                        },
                    ],
                    { session },
                );
                const aiJob = await enqueueAiJob(
                    {
                        type: AI_JOB_TYPES.GENERATE_MAKEUP_PREVIEW,
                        userId,
                        consultationSessionId: consultation?._id ?? null,
                        resourceType: "cosmetic_visualization",
                        resourceId: simulation._id.toString(),
                        deduplicationKey: `cosmetic:${simulation._id.toString()}`,
                        // Um timeout de geração pode consumir o deadline completo.
                        // A repetição fica explícita na UI para não multiplicar
                        // silenciosamente pedidos longos ao provider.
                        maxAttempts: 1,
                    },
                    { session },
                );
                simulation.jobId = aiJob._id;
                await simulation.save({ session });
            });
        } catch (error) {
            if (error?.code !== 11000) throw error;
            simulation = await findReusableMakeupSimulation(
                userId,
                activeGenerationKey,
                new Date(),
                expectedNotice,
            );
            if (!simulation) throw error;
        }
        return toV2SimulationDto(simulation);
    } finally {
        await session.endSession();
    }
}

/** Alias legacy com intensidade e variantes históricas. */
export async function createMakeupSimulationForReport(userId, input, consent) {
    return createCosmeticVisualizationForReport(userId, input, consent, {
        legacy: true,
    });
}

/** Handler durável que não copia fotografias ou base64 para AiJob. */
export async function generateMakeupPreviewForJob(
    job,
    {
        provider = editCosmeticPhotoWithOpenAi,
        storageWriter = writeEncryptedMakeupOutput,
        signal,
    } = {},
) {
    const simulation = await MakeupSimulation.findOneAndUpdate(
        {
            _id: job.resourceId,
            userId: job.userId,
            schemaVersion: { $gte: 2 },
            status: {
                $in: [
                    MAKEUP_SIMULATION_STATUSES.QUEUED,
                    MAKEUP_SIMULATION_STATUSES.FAILED_RETRYABLE,
                ],
            },
        },
        {
            $set: {
                status: MAKEUP_SIMULATION_STATUSES.PROCESSING,
                safeErrorCode: null,
                failedAt: null,
            },
        },
        { new: true },
    ).select("+simulationSpec +recommendationSnapshot");
    if (!simulation) {
        const existing = await MakeupSimulation.findOne({
            _id: job.resourceId,
            userId: job.userId,
            schemaVersion: { $gte: 2 },
        });
        if (existing?.status === MAKEUP_SIMULATION_STATUSES.COMPLETED) {
            return {
                resourceType: "cosmetic_visualization",
                resourceId: existing._id.toString(),
                flowState: "completed",
            };
        }
        throw new AppError(409, "Simulação já não pode ser processada");
    }

    let stored = null;
    try {
        const [photo, activeConsent] = await Promise.all([
            FacePhoto.findOne({
                _id: simulation.facePhotoId,
                userId: simulation.userId,
                kind: "frontal",
                status: "active",
            }).select(
                "+storageKey +encryption +encryption.iv +encryption.authTag",
            ),
            FaceConsent.findOne({
                _id: simulation.consentId,
                userId: simulation.userId,
                version: "face-analysis-v2",
                revokedAt: null,
                "externalProviderConsent.provider": "openai",
                "externalProviderConsent.revokedAt": null,
            }),
        ]);
        if (!photo) throw new AppError(409, "Fotografia da simulação indisponível");
        if (!activeConsent) {
            throw new AppError(403, "Consentimento generativo deixou de estar ativo");
        }
        assertFaceConsentAllowsConfiguredProvider(activeConsent);
        if (simulation.generativeConsent?.revokedAt) {
            throw new AppError(403, "Consentimento generativo revogado");
        }
        const sourceImage = await readEncryptedFacePhotoFile(photo, { signal });
        const generated = await provider({
            sourceImage,
            sourceMimeType: photo.mimeType,
            visualizationSpec: simulation.simulationSpec,
            simulationSpec: simulation.simulationSpec,
            recommendations: simulation.recommendationSnapshot,
            intensity: simulation.intensity,
            operationId: simulation._id.toString(),
            signal,
        });
        assertCompleteImageProvenance(generated?.provenance);
        const consentAfterProvider = await FaceConsent.findOne({
            _id: simulation.consentId,
            userId: simulation.userId,
            version: "face-analysis-v2",
            revokedAt: null,
            "externalProviderConsent.provider": "openai",
            "externalProviderConsent.revokedAt": null,
        });
        if (!consentAfterProvider) {
            throw new AppError(403, "Consentimento revogado durante a edição");
        }
        assertFaceConsentAllowsConfiguredProvider(consentAfterProvider);
        // Evita escrever um novo ficheiro quando a substituição confirmou
        // enquanto o provider externo ainda estava a processar a imagem.
        await assertActiveMakeupSourcePhoto(simulation);
        stored = await storageWriter(generated.imageBuffer, {
            userId: simulation.userId,
            simulationId: simulation._id,
            expectedDimensions: {
                width: generated.provenance.outputWidth,
                height: generated.provenance.outputHeight,
            },
        });
        const updated = await publishMakeupSimulationOutput(
            simulation,
            generated,
            stored,
        );
        return {
            resourceType: "cosmetic_visualization",
            resourceId: updated._id.toString(),
            flowState: "completed",
        };
    } catch (error) {
        if (stored?.storageKey) {
            await enqueueFileDeletionJobs([
                {
                    sourceType: "makeup_failed_publish",
                    sourceId: simulation._id,
                    ownerId: simulation.userId,
                    storageKey: stored.storageKey,
                },
            ]);
        }
        const retryable = Boolean(error?.details?.retryable);
        await MakeupSimulation.updateOne(
            { _id: simulation._id, status: MAKEUP_SIMULATION_STATUSES.PROCESSING },
            {
                $set: {
                    status: retryable
                        ? MAKEUP_SIMULATION_STATUSES.FAILED_RETRYABLE
                        : MAKEUP_SIMULATION_STATUSES.FAILED_TERMINAL,
                    failedAt: new Date(),
                    safeErrorCode:
                        String(error?.details?.code ?? error?.code ?? "IMAGE_FAILED")
                            .slice(0, 80),
                },
                ...(!retryable ? { $unset: { activeGenerationKey: "" } } : {}),
            },
        );
        throw error;
    }
}

/** Revoga apenas futuras operações generativas desta simulação. */
export async function revokeMakeupSimulationConsent(userId, simulationId) {
    const now = new Date();
    const session = await mongoose.startSession();
    let simulation;
    try {
        await session.withTransaction(async () => {
            simulation = await MakeupSimulation.findOneAndUpdate(
                {
                    _id: simulationId,
                    userId,
                    schemaVersion: { $gte: 2 },
                    "generativeConsent.revokedAt": null,
                },
                [
                    {
                        $set: {
                            "generativeConsent.revokedAt": now,
                            activeGenerationKey: "$$REMOVE",
                            status: {
                                $cond: [
                                    {
                                        $eq: [
                                            "$status",
                                            MAKEUP_SIMULATION_STATUSES.COMPLETED,
                                        ],
                                    },
                                    MAKEUP_SIMULATION_STATUSES.COMPLETED,
                                    MAKEUP_SIMULATION_STATUSES.CANCELLED,
                                ],
                            },
                        },
                    },
                ],
                { new: true, session },
            );
            if (!simulation) return;

            await AiJob.updateOne(
                {
                    _id: simulation.jobId,
                    userId,
                    type: AI_JOB_TYPES.GENERATE_MAKEUP_PREVIEW,
                    status: {
                        $in: [
                            AI_JOB_STATUSES.QUEUED,
                            AI_JOB_STATUSES.PROCESSING,
                            AI_JOB_STATUSES.FAILED_RETRYABLE,
                        ],
                    },
                },
                {
                    $set: {
                        status: AI_JOB_STATUSES.CANCELLED,
                        cancelledAt: now,
                        terminalAt: now,
                        "lease.token": null,
                        "lease.workerId": null,
                        "lease.expiresAt": null,
                    },
                },
                { session },
            );
        });
    } finally {
        await session.endSession();
    }
    if (!simulation) {
        throw new AppError(409, "Consentimento generativo já não está ativo");
    }
    return { id: simulation._id.toString(), revokedAt: now };
}

/**
 * Obtém o estado sanitizado de uma simulação pertencente ao titular.
 * @returns {Promise<object>} DTO sem storage key ou cifra.
 */
export async function getMakeupSimulationForUser(userId, simulationId) {
    const simulation = await MakeupSimulation.findOne({
        _id: simulationId,
        userId,
        schemaVersion: { $gte: 2 },
    }).select("+omittedEffects +feedback");
    if (!simulation) throw new AppError(404, "Simulação não encontrada");
    return toV2SimulationDto(simulation);
}

/**
 * Lê e decifra um output próprio concluído e ainda não expirado.
 * @returns {Promise<{buffer: Buffer, mimeType: string}>} WebP privado.
 */
export async function readMakeupSimulationImageForUser(userId, simulationId) {
    const simulation = await MakeupSimulation.findOne({
        _id: simulationId,
        userId,
        schemaVersion: { $gte: 2 },
        status: MAKEUP_SIMULATION_STATUSES.COMPLETED,
        expiresAt: { $gt: new Date() },
    }).select(
        "+outputStorageKey +outputEncryption +outputEncryption.iv +outputEncryption.authTag",
    );
    if (!simulation) throw new AppError(404, "Imagem da simulação indisponível");
    return {
        buffer: await readEncryptedMakeupOutput(simulation),
        mimeType: simulation.outputMimeType ?? "image/webp",
    };
}

/** Lista paths privados apenas para workflows destrutivos transacionais. */
export async function listMakeupSimulationFilesForOwner(userId, { session } = {}) {
    let query = MakeupSimulation.find({
        userId,
        schemaVersion: { $gte: 2 },
        outputStorageKey: { $ne: null },
    })
        .select("+outputStorageKey")
        .lean();
    if (session) query = query.session(session);
    return query;
}

/**
 * Expira outputs sem deixar paths órfãos: o outbox e a remoção do path do
 * documento confirmam na mesma transação.
 */
export async function expireMakeupSimulationOutputs(
    now = new Date(),
    { userId = null, reportId = null } = {},
) {
    const session = await mongoose.startSession();
    let expired = 0;
    try {
        await session.withTransaction(async () => {
            const simulations = await MakeupSimulation.find({
                schemaVersion: { $gte: 2 },
                status: MAKEUP_SIMULATION_STATUSES.COMPLETED,
                expiresAt: { $lte: now },
                ...(userId ? { userId } : {}),
                ...(reportId ? { reportId } : {}),
            })
                .select("+outputStorageKey")
                .session(session)
                .lean();
            const withFiles = simulations.filter(({ outputStorageKey }) =>
                Boolean(outputStorageKey),
            );
            await enqueueFileDeletionJobs(
                withFiles.map((simulation) => ({
                    sourceType: "makeup_expiry",
                    sourceId: simulation._id,
                    ownerId: simulation.userId,
                    storageKey: simulation.outputStorageKey,
                })),
                { session, availableAt: now },
            );
            const result = await MakeupSimulation.updateMany(
                { _id: { $in: simulations.map(({ _id }) => _id) } },
                {
                    $set: { status: MAKEUP_SIMULATION_STATUSES.EXPIRED },
                    $unset: {
                        outputStorageKey: "",
                        outputEncryption: "",
                        providerRequestId: "",
                        activeGenerationKey: "",
                    },
                },
                { session },
            );
            expired = result.modifiedCount;
        });
        return { expired };
    } finally {
        await session.endSession();
    }
}

/** Alias público genérico para estado, imagem e revogação. */
export const getCosmeticVisualizationForUser = getMakeupSimulationForUser;
export const readCosmeticVisualizationImageForUser =
    readMakeupSimulationImageForUser;
export const revokeCosmeticVisualizationConsent =
    revokeMakeupSimulationConsent;

/** Guarda feedback visual estruturado por substituição idempotente. */
export async function submitCosmeticVisualizationFeedback(
    userId,
    visualizationId,
    feedback,
) {
    const visualization = await MakeupSimulation.findOne({
        _id: visualizationId,
        userId,
        schemaVersion: { $gte: 2 },
        status: MAKEUP_SIMULATION_STATUSES.COMPLETED,
        expiresAt: { $gt: new Date() },
        "generativeConsent.revokedAt": null,
    }).select("consentId");
    if (!visualization) {
        throw new AppError(409, "A pré-visualização já não aceita feedback");
    }
    const activeConsent = await FaceConsent.exists({
        _id: visualization.consentId,
        userId,
        version: "face-analysis-v2",
        revokedAt: null,
        "externalProviderConsent.provider": "openai",
        "externalProviderConsent.revokedAt": null,
    });
    if (!activeConsent) {
        throw new AppError(403, "Consentimento inativo para feedback visual");
    }
    const updated = await MakeupSimulation.findOneAndUpdate(
        {
            _id: visualizationId,
            userId,
            schemaVersion: { $gte: 2 },
            status: MAKEUP_SIMULATION_STATUSES.COMPLETED,
            expiresAt: { $gt: new Date() },
            "generativeConsent.revokedAt": null,
            consentId: visualization.consentId,
        },
        {
            $set: {
                feedback: {
                    value: feedback.value,
                    reasons: feedback.reasons,
                    submittedAt: new Date(),
                },
            },
        },
        { new: true },
    );
    if (!updated) {
        throw new AppError(
            409,
            "A pré-visualização já não aceita feedback",
        );
    }
    return getMakeupSimulationForUser(userId, visualizationId);
}
