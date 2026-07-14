/**
 * Orquestra catálogo, OpenAI e persistência imutável do relatório v2.
 *
 * Chamadas remotas acontecem fora da transação. O commit revalida sessão,
 * produtos, preços, variantes e ownership antes de publicar o rascunho.
 */
import { createHash } from "node:crypto";
import mongoose from "mongoose";
import { AppError } from "../middlewares/error.middleware.js";
import {
    AiConsultationSession,
    AI_CONSULTATION_FLOW_STATES,
} from "../models/ai-consultation-session.model.js";
import { FaceAnalysis } from "../models/face-analysis.model.js";
import { FaceConsent } from "../models/face-consent.model.js";
import { AiConsultationReview } from "../models/ai-consultation-review.model.js";
import {
    FaceReport,
    FACE_REPORT_LIFECYCLE,
} from "../models/face-report.model.js";
import { Product } from "../models/product.model.js";
import { ProductRecommendation } from "../models/product-recommendation.model.js";
import { Profile } from "../models/profile.model.js";
import { generateCosmeticReportWithOpenAi } from "../providers/openai-report.provider.js";
import {
    filterProductsBlockedByProfile,
    getProductRestrictionConflict,
} from "./recommendation-restrictions.service.js";
import {
    buildProductVariantKey,
    buildVariantSnapshot,
    resolveProductVariant,
    resolveVariantPriceCents,
} from "./product-variant.service.js";
import { assertFaceConsentAllowsConfiguredProvider } from "./face-photo.service.js";
import {
    buildGoalSlotPlan,
    PROFILE_RESTRICTIONS_CONFIRMATION,
} from "../constants/ai-consultation-goals.js";
import {
    CATALOG_RANKING_POLICY_VERSION,
    selectDeterministicRecommendations,
} from "./catalog-ranking.service.js";
import { buildCosmeticVisualizationSpec } from "./cosmetic-visual-intent.service.js";
import { assertRecommendationFairness } from "./ai-fairness-guard.service.js";
import { buildDeterministicRecommendationGuidance } from "./recommendation-guidance.service.js";
import { buildResolvedMakeupFacts } from "./makeup-plan.service.js";
import { buildAllowedRoutineSlots } from "./report-routine-slots.service.js";

const PRODUCT_SELECT = [
    "name",
    "brandName",
    "description",
    "ingredientNames",
    "inciIngredients",
    "skinTypes",
    "imageUrl",
    "priceCents",
    "stock",
    "aiEligible",
    "concernTags",
    "routineSteps",
    "attributes",
    "makeup",
    "variants",
].join(" ");
const TARGET_CANDIDATES_PER_OBJECTIVE = 3;
const NO_RESTRICTION_ANSWERS = new Set([
    "nenhuma",
    "nenhumas",
    "nao",
    "nao tenho",
    "nao tenho alergias",
    "nao tenho alergias conhecidas",
    "nao tenho nenhuma",
    "nao tenho restricoes",
    "sem alergias",
    "sem alergias ou restricoes",
    "sem restricoes",
    "nada a assinalar",
    "none",
    "no known allergies",
]);

/** Normaliza texto humano sem apagar os separadores entre várias restrições. */
function normalizeRestrictionStatement(value) {
    return String(value ?? "")
        .trim()
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/^[\s.,;:!?]+|[\s.,;:!?]+$/gu, "")
        .replace(/\s+/g, " ");
}

/**
 * Impede que uma restrição nova escrita na conversa seja apenas entregue ao
 * modelo e ignorada pelo filtro determinístico. Como texto livre não pode ser
 * convertido em alergia clínica com segurança, o utilizador tem de a registar
 * primeiro no perfil estruturado.
 *
 * @param {object} facts - Factos cifrados já decifrados da consulta.
 * @param {object} profile - Perfil cosmético autoritativo.
 * @returns {void}
 * @throws {AppError} Quando a resposta contém termos não reconciliados.
 */
export function assertConsultationRestrictionsCoveredByProfile(
    facts,
    profile,
) {
    const statement = normalizeRestrictionStatement(
        facts?.allergies_restrictions,
    );
    if (
        statement ===
        PROFILE_RESTRICTIONS_CONFIRMATION.CONFIRMED
    ) {
        return;
    }
    if (
        statement ===
        PROFILE_RESTRICTIONS_CONFIRMATION.NEEDS_UPDATE
    ) {
        throw new AppError(
            409,
            "Atualiza as alergias e restrições no perfil antes de continuar.",
            { code: "PROFILE_RESTRICTIONS_UPDATE_REQUIRED" },
        );
    }
    if (!statement || NO_RESTRICTION_ANSWERS.has(statement)) return;

    const declaredTerms = statement
        .split(/[,;\n]+/u)
        .map(normalizeRestrictionStatement)
        .filter(Boolean);
    const profileTerms = new Set(
        [
            ...(profile?.allergies ?? []),
            ...(profile?.avoidIngredients ?? []),
            ...(profile?.lightMedicalRestrictions ?? []),
        ]
            .map(normalizeRestrictionStatement)
            .filter(Boolean),
    );
    if (
        declaredTerms.length === 0 ||
        declaredTerms.some((term) => !profileTerms.has(term))
    ) {
        throw new AppError(
            409,
            "Atualiza as alergias e restrições no perfil antes de gerar o relatório.",
            { code: "PROFILE_RESTRICTIONS_UPDATE_REQUIRED" },
        );
    }
}

/** Serialização estável usada apenas para hashes de integridade. */
export function stableStringify(value) {
    if (Array.isArray(value)) {
        return `[${value.map(stableStringify).join(",")}]`;
    }
    if (value && typeof value === "object") {
        return `{${Object.keys(value)
            .sort()
            .map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`)
            .join(",")}}`;
    }
    return JSON.stringify(value);
}

/** SHA-256 hexadecimal de um snapshot canónico. */
export function hashCanonicalSnapshot(value) {
    return createHash("sha256").update(stableStringify(value)).digest("hex");
}

function normalizeGoalSelection(goalSelection = {}) {
    const primaryGoal = String(
        goalSelection.primaryGoal ?? goalSelection.primary ?? "",
    ).trim();
    const secondaryGoals = [
        ...new Set(
            (goalSelection.secondaryGoals ?? goalSelection.secondary ?? [])
                .map((goal) => String(goal).trim())
                .filter(Boolean),
        ),
    ].slice(0, 2);

    if (!primaryGoal) {
        throw new AppError(409, "Sessão sem objetivo principal");
    }
    return { primaryGoal, secondaryGoals };
}

function toCandidateProduct(product) {
    return {
        productId: product._id.toString(),
        name: product.name,
        brandName: product.brandName,
        description: product.description,
        ingredientNames:
            product.inciIngredients?.length > 0
                ? product.inciIngredients
                : product.ingredientNames,
        skinTypes: product.skinTypes,
        concernTags: product.concernTags,
        routineSteps: product.routineSteps,
        attributes: product.attributes ?? {},
        makeup: product.makeup ?? {},
        priceCents: product.priceCents,
        stock: product.stock,
        available: product.stock > 0,
        variants: (product.variants ?? [])
            .filter((variant) => variant.stock > 0)
            .map((variant) => ({
            variantId: variant.variantId,
            label: variant.label,
            colorHex: variant.colorHex ?? null,
            undertone: variant.undertone ?? null,
            finish: variant.finish ?? null,
            coverage: variant.coverage ?? null,
            priceCents: variant.priceCents ?? product.priceCents,
            stock: variant.stock,
            available: variant.stock > 0,
        })),
    };
}

function lowestProductPrice(product) {
    const variantPrices = (product.variants ?? [])
        .filter((variant) => variant.stock > 0)
        .map((variant) => resolveVariantPriceCents(product, variant));
    return variantPrices.length > 0
        ? Math.min(...variantPrices)
        : product.priceCents;
}

/** Rejeita candidatos sem metadata mínima para uma seleção verificável. */
function hasCompleteAiCatalogMetadata(product) {
    return Boolean(
        product?.aiEligible === true &&
            product.stock > 0 &&
            String(product.name ?? "").trim() &&
            String(product.brandName ?? "").trim() &&
            Number.isInteger(product.priceCents) &&
            product.priceCents >= 0 &&
            Array.isArray(product.concernTags) &&
            product.concernTags.length > 0 &&
            Array.isArray(product.skinTypes) &&
            product.skinTypes.length > 0 &&
            Array.isArray(product.routineSteps) &&
            ((product.variants?.length ?? 0) === 0 ||
                product.variants.some((variant) => variant.stock > 0)),
    );
}

/**
 * Compara candidatos mantendo disponibilidade, objetivo principal, tipo de
 * pele e preço como critérios estáveis de relevância.
 *
 * @param {object} left - Primeiro produto candidato.
 * @param {object} right - Segundo produto candidato.
 * @param {string} primaryGoal - Objetivo principal congelado da consulta.
 * @param {string|undefined} skinType - Tipo de pele do perfil.
 * @returns {number} Ordem compatível com `Array.prototype.sort`.
 */
function compareCatalogCandidates(left, right, primaryGoal, skinType) {
    const availability = Number(right.stock > 0) - Number(left.stock > 0);
    if (availability !== 0) return availability;
    const primaryMatch =
        Number(right.concernTags.includes(primaryGoal)) -
        Number(left.concernTags.includes(primaryGoal));
    if (primaryMatch !== 0) return primaryMatch;
    const skinMatch =
        Number(right.skinTypes.includes(skinType)) -
        Number(left.skinTypes.includes(skinType));
    if (skinMatch !== 0) return skinMatch;
    const priceDifference = left.priceCents - right.priceCents;
    if (priceDifference !== 0) return priceDifference;
    return String(left.name).localeCompare(String(right.name), "pt");
}

/**
 * Reserva candidatos por objetivo e completa a allowlist por ranking.
 * Produtos multiobjetivo contam para todos os objetivos sem serem duplicados.
 *
 * @param {object[]} products - Produtos filtrados por restrições e orçamento.
 * @param {{goalCodes: string[], primaryGoal: string, skinType?: string, limit?: number}} options - Contexto da seleção.
 * @returns {object[]} Candidatos únicos e equilibrados.
 */
export function selectBalancedCatalogCandidates(
    products,
    {
        goalCodes,
        primaryGoal,
        skinType,
        limit = Number.POSITIVE_INFINITY,
    },
) {
    const ranked = [...products].sort((left, right) =>
        compareCatalogCandidates(left, right, primaryGoal, skinType),
    );
    const selected = [];
    const selectedProducts = new Set();

    const addCandidate = (candidate) => {
        if (!candidate || selectedProducts.has(candidate)) return false;
        selected.push(candidate);
        selectedProducts.add(candidate);
        return true;
    };

    for (const goalCode of goalCodes) {
        while (
            selected.length < limit &&
            selected.filter((product) =>
                product.concernTags.includes(goalCode),
            ).length < TARGET_CANDIDATES_PER_OBJECTIVE
        ) {
            const candidate = ranked.find(
                (product) =>
                    !selectedProducts.has(product) &&
                    product.concernTags.includes(goalCode),
            );
            if (!addCandidate(candidate)) break;
        }
    }

    for (const candidate of ranked) {
        if (selected.length >= limit) break;
        addCandidate(candidate);
    }

    return selected;
}

/**
 * Pré-filtra candidatos por metadata, stock, restrições e orçamento declarado.
 */
export async function buildCatalogCandidateAllowlist({
    goalSelection,
    facts = {},
    profile,
    session,
}) {
    const { primaryGoal, secondaryGoals } = normalizeGoalSelection(goalSelection);
    const goalCodes = [primaryGoal, ...secondaryGoals];
    let query = Product.find({
        aiEligible: true,
        concernTags: { $in: goalCodes },
    })
        .select(PRODUCT_SELECT);
    if (session) query = query.session(session);
    const products = await query;
    const budgetCents = Number(facts?.budget_cents ?? 0);
    const allowed = filterProductsBlockedByProfile(products, profile).filter(
        (product) =>
            hasCompleteAiCatalogMetadata(product) &&
            (!Number.isFinite(budgetCents) ||
                budgetCents <= 0 ||
                lowestProductPrice(product) <= budgetCents),
    );

    const ranked = selectBalancedCatalogCandidates(allowed, {
        goalCodes,
        primaryGoal,
        skinType: profile?.tipoDePele,
    })
        .map(toCandidateProduct);

    return {
        candidates: ranked,
        allowlistHash: hashCanonicalSnapshot(ranked),
        objectives: [
            { code: primaryGoal, priority: "primary" },
            ...secondaryGoals.map((code) => ({ code, priority: "secondary" })),
        ],
    };
}

function buildAllowedSelectionMap(candidates) {
    const allowed = new Map();
    for (const candidate of candidates) {
        if (candidate.variants.length === 0) {
            allowed.set(buildProductVariantKey(candidate.productId), candidate);
            continue;
        }
        for (const variant of candidate.variants) {
            allowed.set(
                buildProductVariantKey(candidate.productId, variant.variantId),
                { ...candidate, selectedVariant: variant },
            );
        }
    }
    return allowed;
}

/** Recusa IDs inventados, variantes ausentes e produtos duplicados. */
export function validateOpenAiRecommendationSelections(
    selections,
    candidates,
    _budgetCents = 0,
) {
    if (!Array.isArray(selections)) {
        throw new AppError(502, "Resposta OpenAI com recomendações inválidas");
    }

    const allowed = buildAllowedSelectionMap(candidates);
    const seenProducts = new Set();
    return selections.map((selection, index) => {
        const productId = String(selection?.productId ?? "");
        const variantId = selection?.variantId
            ? String(selection.variantId).trim().toLowerCase()
            : null;
        const key = buildProductVariantKey(productId, variantId);
        const candidate = allowed.get(key);
        if (!candidate || seenProducts.has(productId)) {
            throw new AppError(502, "Resposta OpenAI fora da allowlist do catálogo");
        }
        seenProducts.add(productId);

        return {
            ...selection,
            productId,
            variantId,
            selectionRank: index + 1,
            candidate,
        };
    });
}

function buildProductSnapshot(product, variant) {
    return {
        productId: product._id.toString(),
        name: product.name,
        brandName: product.brandName,
        description: product.description,
        ingredientNames:
            product.inciIngredients?.length > 0
                ? product.inciIngredients
                : product.ingredientNames,
        imageUrl: variant?.imageUrl ?? product.imageUrl,
        priceCents: resolveVariantPriceCents(product, variant),
        stock: variant?.stock ?? product.stock,
        available: (variant?.stock ?? product.stock) > 0,
        concernTags: product.concernTags,
        routineSteps: product.routineSteps,
        attributes: product.attributes ?? {},
        makeup: product.makeup ?? {},
        variant: buildVariantSnapshot(variant),
        capturedAt: new Date(),
    };
}

async function loadCurrentProductsForSelections(selections, session) {
    const productIds = selections.map(({ productId }) => productId);
    const products = await Product.find({ _id: { $in: productIds } })
        .select(PRODUCT_SELECT)
        .session(session);
    const byId = new Map(
        products.map((product) => [product._id.toString(), product]),
    );

    return selections.map((selection) => {
        const product = byId.get(selection.productId);
        if (!product || !product.aiEligible) {
            throw new AppError(409, "Produto recomendado deixou de estar elegível");
        }
        const variant = resolveProductVariant(product, selection.variantId);
        return { selection, product, variant };
    });
}

function buildMachineResult(result, analysis, selections) {
    const safetyFlags = [...new Set(analysis.safetyFlags ?? [])];
    const guidanceByPair = new Map(
        (result.recommendationGuidance ?? []).map((item) => [
            buildProductVariantKey(item.productId, item.variantId),
            item,
        ]),
    );
    return {
        objectivesAssessment: result.assessment,
        observations: result.observations,
        answerSummary: result.answerSummary,
        photoQuality: analysis.photoQuality,
        routine: result.routine,
        recommendations: selections.map(({ selection }) => ({
            productId: selection.productId,
            variantId: selection.variantId,
            reason: selection.explanation,
            usage:
                guidanceByPair.get(
                    buildProductVariantKey(
                        selection.productId,
                        selection.variantId,
                    ),
                )?.usage ?? null,
            cautions:
                guidanceByPair.get(
                    buildProductVariantKey(
                        selection.productId,
                        selection.variantId,
                    ),
                )?.cautions ?? [],
            score: selection.score,
        })),
        limitations: [
            ...new Set([
                ...result.limitations,
                ...(safetyFlags.length > 0
                    ? [
                          "Foram assinalados sinais que justificam cautela e eventual avaliação por um profissional de saúde.",
                      ]
                    : []),
            ]),
        ],
        safetyFlags,
    };
}

/** Handler do job `generate_report`; devolve apenas IDs e estado público. */
export async function generateConsultationReportForJob(
    job,
    { reportProvider = generateCosmeticReportWithOpenAi, signal } = {},
) {
    const consultationSessionId = job?.consultationSessionId;
    if (!consultationSessionId || !job?.userId) {
        throw new AppError(500, "Job de relatório incompleto");
    }

    const consultation = await AiConsultationSession.findOne({
        _id: consultationSessionId,
        userId: job.userId,
        isOpen: true,
    });
    if (!consultation?.analysisId) {
        throw new AppError(409, "Sessão sem análise facial concluída");
    }

    const reportVersion = Math.max(1, Number(consultation.revision) + 1);
    const existing = await FaceReport.findOne({
        userId: job.userId,
        consultationSessionId,
        version: reportVersion,
        schemaVersion: 2,
    });
    if (existing) {
        return {
            reportId: existing._id.toString(),
            flowState:
                existing.lifecycleStatus ===
                FACE_REPORT_LIFECYCLE.REVIEW_PENDING
                    ? AI_CONSULTATION_FLOW_STATES.REVIEW_PENDING
                    : AI_CONSULTATION_FLOW_STATES.DRAFT_READY,
        };
    }

    const [analysis, profile, activeConsentBeforeProvider] = await Promise.all([
        FaceAnalysis.findOne({
            _id: consultation.analysisId,
            userId: job.userId,
            status: "completed",
            mode: "openai",
            isDemo: false,
        }),
        Profile.findOne({ userId: job.userId }),
        FaceConsent.findOne({
            _id: consultation.consentId,
            userId: job.userId,
            version: "face-analysis-v2",
            revokedAt: null,
            "purposes.openAiAnalysis": true,
            "externalProviderConsent.provider": "openai",
            "externalProviderConsent.revokedAt": null,
        }),
    ]);
    if (!analysis) throw new AppError(409, "Análise OpenAI concluída obrigatória");
    if (!profile) throw new AppError(409, "Perfil cosmético obrigatório");
    if (!activeConsentBeforeProvider) {
        throw new AppError(403, "Consentimento OpenAI v2 ativo obrigatório");
    }
    assertFaceConsentAllowsConfiguredProvider(activeConsentBeforeProvider);
    assertConsultationRestrictionsCoveredByProfile(
        consultation.facts,
        profile,
    );
    const effectiveFacts = buildResolvedMakeupFacts(consultation.facts ?? {});

    const allowlist = await buildCatalogCandidateAllowlist({
        goalSelection: consultation.goalSelection,
        facts: effectiveFacts,
        profile,
    });
    const ranking = selectDeterministicRecommendations(allowlist.candidates, {
        objectives: allowlist.objectives,
        facts: effectiveFacts,
        skinType: profile.tipoDePele,
    });
    const selected = ranking.selected.map((selection) => ({
        ...selection,
        candidate: selection,
    }));
    const routineSlots = buildAllowedRoutineSlots(selected);
    const providerResult = await reportProvider({
        objectives: allowlist.objectives,
        photoQuality: analysis.photoQuality,
        findings: analysis.findings,
        safetyFlags: analysis.safetyFlags ?? [],
        facts: effectiveFacts,
        profileConstraints: {
            skinType: profile.tipoDePele,
            allergies: profile.allergies,
            avoidIngredients: profile.avoidIngredients,
            restrictions: profile.lightMedicalRestrictions,
        },
        candidates: allowlist.candidates,
        selectedRecommendations: selected.map(
            ({ productId, variantId, selectionRank }) => ({
                productId,
                variantId,
                selectionRank,
            }),
        ),
        routineSlots,
        signal,
    });
    const normalizedGoals = normalizeGoalSelection(consultation.goalSelection);
    const slotsByCode = new Map(
        buildGoalSlotPlan(
            normalizedGoals.primaryGoal,
            normalizedGoals.secondaryGoals,
        ).map((slot) => [slot.code, slot]),
    );
    const missingSlotLimitations = [
        ...new Set(consultation.conversation?.missingSlotCodes ?? []),
    ].map((slotCode) => {
        const label = slotsByCode.get(slotCode)?.label ?? slotCode;
        return `Informação não recolhida na consulta: ${label}.`;
    });
    const deterministicGuidance =
        buildDeterministicRecommendationGuidance(selected);
    const reportValue = {
        ...providerResult.value,
        recommendationGuidance: deterministicGuidance,
        limitations: [
            ...new Set([
                ...(providerResult.value.limitations ?? []),
                ...missingSlotLimitations,
                ...ranking.limitations,
            ]),
        ],
    };

    const databaseSession = await mongoose.startSession();
    let report;
    let publishedFlowState = AI_CONSULTATION_FLOW_STATES.DRAFT_READY;
    try {
        await databaseSession.withTransaction(async () => {
            const currentProducts = await loadCurrentProductsForSelections(
                selected,
                databaseSession,
            );
            // Estas queries usam a mesma ClientSession transacional. O driver
            // não suporta operações paralelas numa sessão, pelo que cada
            // leitura termina antes de iniciar a seguinte.
            const activeConsent = await FaceConsent.findOne({
                _id: consultation.consentId,
                userId: job.userId,
                version: "face-analysis-v2",
                revokedAt: null,
                "purposes.openAiAnalysis": true,
                "externalProviderConsent.provider": "openai",
                "externalProviderConsent.revokedAt": null,
            }).session(databaseSession);
            const currentProfile = await Profile.findOne({
                userId: job.userId,
            }).session(databaseSession);
            if (!activeConsent) {
                throw new AppError(403, "Consentimento OpenAI deixou de estar ativo");
            }
            assertFaceConsentAllowsConfiguredProvider(activeConsent);
            if (!currentProfile) {
                throw new AppError(409, "Perfil cosmético deixou de estar disponível");
            }
            assertConsultationRestrictionsCoveredByProfile(
                consultation.facts,
                currentProfile,
            );
            // Revalida a allowlist com os valores efetivamente persistidos.
            for (const { selection, product, variant } of currentProducts) {
                const candidate = selection.candidate;
                if (
                    resolveVariantPriceCents(product, variant) !==
                        (candidate.suggestedVariant?.priceCents ??
                            candidate.priceCents) ||
                    (variant?.stock ?? product.stock) !==
                        (candidate.suggestedVariant?.stock ?? candidate.stock)
                ) {
                    throw new AppError(
                        409,
                        "Catálogo mudou durante a geração; repete o relatório",
                    );
                }
                if (getProductRestrictionConflict(product, currentProfile).blocked) {
                    throw new AppError(
                        409,
                        "Restrições do perfil mudaram durante a geração",
                    );
                }
            }
            const availableSelectionTotal = currentProducts.reduce(
                (sum, { product, variant }) =>
                    sum +
                    ((variant?.stock ?? product.stock) > 0
                        ? resolveVariantPriceCents(product, variant)
                        : 0),
                0,
            );
            const currentBudgetCents = Number(
                consultation.facts?.budget_cents ?? 0,
            );
            if (
                Number.isFinite(currentBudgetCents) &&
                currentBudgetCents > 0 &&
                availableSelectionTotal > currentBudgetCents
            ) {
                throw new AppError(
                    409,
                    "Recomendações excedem o orçamento atual da consulta",
                );
            }

            const machineResult = buildMachineResult(
                reportValue,
                analysis,
                currentProducts,
            );
            const recommendationPlans = currentProducts.map((entry) => ({
                ...entry,
                recommendationId: new mongoose.Types.ObjectId(),
            }));
            const visualizationSpec = buildCosmeticVisualizationSpec({
                objectives: allowlist.objectives,
                facts: effectiveFacts,
                recommendations: recommendationPlans.map(
                    ({ recommendationId, selection }) => ({
                        recommendationId: recommendationId.toString(),
                        variantId: selection.variantId,
                        visualRoles: selection.visualRoles,
                        makeupFunctions: selection.makeupFunctions,
                        makeup: selection.makeup ?? {},
                        concernTags: selection.concernTags,
                    }),
                ),
            });
            const reportInputHash = hashCanonicalSnapshot({
                objectives: allowlist.objectives,
                photoQuality: analysis.photoQuality,
                findings: analysis.findings,
                safetyFlags: analysis.safetyFlags ?? [],
                facts: effectiveFacts,
                profileConstraints: {
                    skinType: currentProfile.tipoDePele,
                    allergies: currentProfile.allergies,
                    avoidIngredients: currentProfile.avoidIngredients,
                    restrictions: currentProfile.lightMedicalRestrictions,
                },
                selectedRecommendations: selected.map(
                    ({ productId, variantId, selectionRank }) => ({
                        productId,
                        variantId,
                        selectionRank,
                    }),
                ),
                routineSlots,
            });
            const reportOutputHash = hashCanonicalSnapshot(reportValue);
            [report] = await FaceReport.create(
                [
                    {
                        schemaVersion: 2,
                        version: reportVersion,
                        userId: job.userId,
                        analysisId: analysis._id,
                        consultationSessionId,
                        analysisMode: "openai",
                        analysisIsDemo: false,
                        analysisProviderVersion: analysis.providerVersion,
                        lifecycleStatus: FACE_REPORT_LIFECYCLE.DRAFT_READY,
                        objectives: allowlist.objectives,
                        cosmeticSummary: reportValue.assessment,
                        routineSuggestions: reportValue.routine,
                        sources: analysis.sources,
                        limitations: machineResult.limitations,
                        photoQuality: analysis.photoQuality,
                        answerSummary: reportValue.answerSummary,
                        machineResult,
                        humanOverride: null,
                        visualizationSpec,
                        // Alias de leitura temporário para clientes v2.
                        simulationSpec: visualizationSpec,
                        candidateAllowlist: {
                            hash: allowlist.allowlistHash,
                            candidates: allowlist.candidates,
                        },
                        providerMetadata: {
                            provider: "openai",
                            requestedModel:
                                providerResult.provenance.requestedModel,
                            effectiveModel:
                                providerResult.provenance.effectiveModel,
                            requestId: providerResult.provenance.requestId,
                            promptVersion:
                                providerResult.provenance.promptVersion,
                            responseSchemaVersion:
                                providerResult.provenance.schemaVersion,
                            rankingPolicyVersion:
                                CATALOG_RANKING_POLICY_VERSION,
                            attemptCount: providerResult.attemptCount,
                            generatedAt: new Date(),
                        },
                        reportInputHash,
                        reportOutputHash,
                        privacyStatus: "active",
                    },
                ],
                { session: databaseSession },
            );

            const recommendationDocs = [];
            for (const {
                recommendationId,
                selection,
                product,
                variant,
            } of recommendationPlans) {
                const guidance = reportValue.recommendationGuidance.find(
                    (item) =>
                        buildProductVariantKey(item.productId, item.variantId) ===
                        buildProductVariantKey(
                            selection.productId,
                            selection.variantId,
                        ),
                );
                assertRecommendationFairness({
                    reasonCodes: selection.reasonCodes,
                    sourceSignals: selection.sourceSignals,
                    explanation: selection.explanation,
                    limitations: machineResult.limitations,
                });
                const [recommendation] = await ProductRecommendation.create(
                    [
                        {
                            _id: recommendationId,
                            schemaVersion: 2,
                            reportVersion,
                            userId: job.userId,
                            analysisId: analysis._id,
                            reportId: report._id,
                            analysisMode: "openai",
                            analysisIsDemo: false,
                            analysisProviderVersion: analysis.providerVersion,
                            productId: product._id,
                            variantId: variant?.variantId ?? null,
                            productSnapshot: buildProductSnapshot(product, variant),
                            selectionRank: selection.selectionRank,
                            candidateAllowlistHash: allowlist.allowlistHash,
                            score: selection.score,
                            reasonCodes: selection.reasonCodes,
                            explanation: selection.explanation,
                            sourceSignals: selection.sourceSignals,
                            limitations: machineResult.limitations,
                            machineResult: {
                                reason: selection.explanation,
                                usage: guidance?.usage ?? null,
                                cautions: guidance?.cautions ?? [],
                                score: selection.score,
                                rankingPolicyVersion:
                                    CATALOG_RANKING_POLICY_VERSION,
                                generatedAt: new Date(),
                                provider: providerResult.provenance,
                            },
                            humanOverride: null,
                            status: "active",
                        },
                    ],
                    { session: databaseSession },
                );
                recommendationDocs.push(recommendation);
            }

            report.finalRecommendationIds = recommendationDocs.map(
                ({ _id }) => _id,
            );
            await report.save({ session: databaseSession });

            let successorReview = null;
            if (consultation.currentReviewId) {
                const clarificationReview = await AiConsultationReview.findOne({
                    _id: consultation.currentReviewId,
                    userId: job.userId,
                    consultationSessionId,
                    status: "cancelled",
                    clarificationResolvedAt: { $ne: null },
                }).session(databaseSession);
                if (clarificationReview) {
                    [successorReview] = await AiConsultationReview.create(
                        [
                            {
                                schemaVersion: 2,
                                userId: job.userId,
                                consultationSessionId,
                                reportId: report._id,
                                reportVersion,
                                recommendationIds: recommendationDocs.map(
                                    ({ _id }) => _id,
                                ),
                                status: "pending",
                                summary: `Relatório cosmético v${reportVersion} atualizado após esclarecimento do cliente.`,
                                sourceLabels: [
                                    "Análise OpenAI",
                                    "Consulta guiada",
                                    "Esclarecimento do cliente",
                                    "Catálogo validado",
                                ],
                                limitations: machineResult.limitations,
                                machineResult,
                                humanOverride: null,
                                requestedAt: new Date(),
                            },
                        ],
                        { session: databaseSession },
                    );
                    report.reviewId = successorReview._id;
                    report.lifecycleStatus =
                        FACE_REPORT_LIFECYCLE.REVIEW_PENDING;
                    await report.save({ session: databaseSession });
                    publishedFlowState =
                        AI_CONSULTATION_FLOW_STATES.REVIEW_PENDING;
                }
            }

            const sessionUpdate = await AiConsultationSession.updateOne(
                {
                    _id: consultation._id,
                    userId: job.userId,
                    revision: consultation.revision,
                    flowState: {
                        $in: [
                            AI_CONSULTATION_FLOW_STATES.GENERATING_REPORT,
                            AI_CONSULTATION_FLOW_STATES.FAILED_RETRYABLE,
                        ],
                    },
                },
                {
                    $set: {
                        reportId: report._id,
                        flowState: publishedFlowState,
                        currentJobId: null,
                        currentReviewId: successorReview?._id ?? null,
                    },
                },
                { session: databaseSession },
            );
            if (sessionUpdate.modifiedCount !== 1) {
                throw new AppError(409, "Sessão mudou durante a geração do relatório");
            }
        });
    } catch (error) {
        if (error?.code === 11000) {
            const winner = await FaceReport.findOne({
                userId: job.userId,
                consultationSessionId,
                version: reportVersion,
                schemaVersion: 2,
            });
            if (winner) {
                report = winner;
                publishedFlowState =
                    winner.lifecycleStatus ===
                    FACE_REPORT_LIFECYCLE.REVIEW_PENDING
                        ? AI_CONSULTATION_FLOW_STATES.REVIEW_PENDING
                        : AI_CONSULTATION_FLOW_STATES.DRAFT_READY;
            }
            else throw error;
        } else {
            throw error;
        }
    } finally {
        await databaseSession.endSession();
    }

    return {
        reportId: report._id.toString(),
        flowState: publishedFlowState,
    };
}
