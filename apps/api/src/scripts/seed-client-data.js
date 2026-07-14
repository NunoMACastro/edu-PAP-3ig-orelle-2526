/**
 * Cenários determinísticos de clientes para a demonstração académica local.
 *
 * Este módulo só acrescenta documentos em falta às contas `.test` conhecidas.
 * Não limpa coleções, não repõe alterações manuais e não chama providers
 * externos. Os retratos são ilustrações sintéticas geradas localmente e passam
 * pelo mesmo pipeline de normalização, cifragem e storage privado da aplicação.
 */
import { createHash } from "node:crypto";
import { mkdir, unlink } from "node:fs/promises";
import path from "node:path";
import mongoose from "mongoose";
import sharp from "sharp";
import { env } from "../config/env.js";
import {
    AI_CONSULTATION_GOAL_CODES,
    AI_CONSULTATION_GOALS_VERSION,
} from "../constants/ai-consultation-goals.js";
import {
    NOTIFICATION_TYPES,
    ORDER_STATUS,
    PAYMENT_MODE,
    PAYMENT_STATUS,
} from "../constants/domain.constants.js";
import { FACE_ANALYSIS_CONSENT_PURPOSE } from "../constants/face-consent.js";
import { ROLES } from "../constants/roles.js";
import { FACE_PHOTO_UPLOAD_DIR } from "../middlewares/face-photo-upload.middleware.js";
import { AiConsultationAuditLog } from "../models/ai-consultation-audit-log.model.js";
import {
    AiConsultationReview,
} from "../models/ai-consultation-review.model.js";
import {
    AiConsultationSession,
    AI_CONSULTATION_FLOW_STATES,
    AI_CONSULTATION_STATUS,
} from "../models/ai-consultation-session.model.js";
import { AiInteractionHistory } from "../models/ai-interaction-history.model.js";
import { Cart } from "../models/cart.model.js";
import { DailyRoutine } from "../models/daily-routine.model.js";
import { FaceAnalysis } from "../models/face-analysis.model.js";
import { FaceConsent } from "../models/face-consent.model.js";
import { FacePhoto } from "../models/face-photo.model.js";
import {
    FaceReport,
    FACE_REPORT_LIFECYCLE,
} from "../models/face-report.model.js";
import { Notification } from "../models/notification.model.js";
import { Order } from "../models/order.model.js";
import { Preference } from "../models/preference.model.js";
import { Product } from "../models/product.model.js";
import { ProductRecommendation } from "../models/product-recommendation.model.js";
import { Profile } from "../models/profile.model.js";
import {
    ReportUnlock,
    REPORT_UNLOCK_STATUS,
} from "../models/report-unlock.model.js";
import { Review, REVIEW_STATUSES } from "../models/review.model.js";
import { RoutineAlertPreference } from "../models/routine-alert-preference.model.js";
import { SkinComparison } from "../models/skin-comparison.model.js";
import { User } from "../models/user.model.js";
import { Voucher, VOUCHER_STATUS } from "../models/voucher.model.js";
import {
    removeEncryptedFacePhotoFiles,
} from "../services/face-secure-storage.service.js";
import { saveFacePhotos } from "../services/face-photo.service.js";
import { assertDevelopmentSeedsAllowed } from "./seed-safety.js";

const SEED_NAMESPACE = "orelle:demo:v1";
const DAY_MS = 24 * 60 * 60 * 1000;
const DEMO_CLIENT_EMAILS = Object.freeze([
    "cliente@orelle.test",
    "cliente.maria@orelle.test",
    "cliente.ines@orelle.test",
    "cliente.joao@orelle.test",
    "cliente.sofia@orelle.test",
]);
const REQUIRED_SUPPORT_EMAILS = Object.freeze([
    "admin@orelle.test",
    "consultor@orelle.test",
    "consultor.skincare@orelle.test",
]);
const DEMO_LIMITATIONS = Object.freeze([
    "Resultado sintético exclusivo da demonstração académica local.",
    "A orientação é cosmética e não substitui avaliação médica.",
]);
const DEFAULT_PHOTO_QUALITY = Object.freeze({
    status: "pass",
    warnings: [],
    profileVersion: "face-photo-quality-v1",
});
const SEEDED_CLIENT_STORAGE_KEYS = new Set();

/**
 * Produz um hash SHA-256 hexadecimal para fingerprints e chaves estáveis.
 *
 * @param {string} value - Namespace lógico do valor.
 * @returns {string} Hash hexadecimal com 64 caracteres.
 */
function stableHash(value) {
    return createHash("sha256").update(`${SEED_NAMESPACE}:${value}`).digest("hex");
}

/**
 * Converte um namespace estável num ObjectId determinístico de desenvolvimento.
 *
 * @param {string} value - Identidade lógica do documento.
 * @returns {mongoose.Types.ObjectId} ObjectId reproduzível entre replays.
 */
export function stableSeedObjectId(value) {
    return new mongoose.Types.ObjectId(stableHash(value).slice(0, 24));
}

/**
 * Normaliza a referência temporal para o início do dia UTC corrente.
 *
 * @param {Date} [now=new Date()] - Relógio injetável para testes.
 * @returns {Date} Início do dia UTC.
 */
export function getSeedReferenceDate(now = new Date()) {
    return new Date(
        Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
    );
}

/** Cria uma data histórica relativa, mantendo uma hora legível e estável. */
function daysBefore(referenceDate, days, hour = 10) {
    return new Date(referenceDate.getTime() - days * DAY_MS + hour * 60 * 60 * 1000);
}

/**
 * Executa uma unidade de seed numa transação do replica set local.
 *
 * @param {(session: import("mongoose").ClientSession) => Promise<unknown>} work - Escritas do cenário.
 * @returns {Promise<unknown>} Resultado devolvido pelo callback confirmado.
 */
async function inTransaction(work) {
    const session = await mongoose.startSession();
    try {
        return await session.withTransaction(() => work(session));
    } finally {
        await session.endSession();
    }
}

/**
 * Insere um documento em falta sem atualizar o documento existente.
 *
 * O filtro inclui sempre o owner exato quando existem campos cifrados, para os
 * setters contextuais autenticarem corretamente o AAD. `timestamps: false`
 * impede que um replay transforme atividade antiga em atividade recente.
 */
async function ensureDocument(Model, filter, document, session) {
    await Model.updateOne(
        filter,
        { $setOnInsert: document },
        {
            upsert: true,
            runValidators: true,
            setDefaultsOnInsert: true,
            timestamps: false,
            session,
        },
    );
    return Model.findOne(filter).session(session);
}

/** Devolve um snapshot de produto coerente com carrinho, ordem e recomendação. */
function productSnapshot(product) {
    return {
        productId: product._id,
        name: product.name,
        brandName: product.brandName,
        imageUrl: product.imageUrl,
        priceCents: product.priceCents,
    };
}

/** Seleciona a primeira variante, quando o produto a possui. */
function resolveSeedVariant(product) {
    const variant = product.variants?.[0] ?? null;
    return {
        variantId: variant?.variantId ?? null,
        priceCents: variant?.priceCents ?? product.priceCents,
        stock: variant?.stock ?? product.stock,
        snapshot: {
            variantId: variant?.variantId ?? null,
            label: variant?.label ?? null,
            colorHex: variant?.colorHex ?? null,
            undertone: variant?.undertone ?? null,
            finish: variant?.finish ?? null,
            coverage: variant?.coverage ?? null,
            imageUrl: variant?.imageUrl ?? null,
        },
    };
}

/** Constrói um item de encomenda exclusivamente a partir do catálogo seedado. */
function orderItem(product, quantity = 1) {
    const variant = resolveSeedVariant(product);
    return {
        productId: product._id,
        variantId: variant.variantId,
        name: product.name,
        variantSnapshot: variant.snapshot,
        unitPriceCents: variant.priceCents,
        quantity,
        lineTotalCents: variant.priceCents * quantity,
    };
}

/** Constrói um item de carrinho exclusivamente a partir do catálogo seedado. */
function cartItem(product, quantity = 1) {
    const variant = resolveSeedVariant(product);
    return {
        productId: product._id,
        variantId: variant.variantId,
        quantity,
        priceSnapshotCents: variant.priceCents,
        productNameSnapshot: product.name,
        variantSnapshot: variant.snapshot,
    };
}

/**
 * Cria perfil e preferências quando ainda não existem.
 *
 * @param {object} input - Dados controlados do cenário.
 * @returns {Promise<void>}
 */
async function seedIdentity({ scenario, user, profile, products, referenceDate }) {
    await inTransaction(async (session) => {
        const timestamp = daysBefore(referenceDate, profile.daysAgo ?? 175, 9);
        await ensureDocument(
            Profile,
            { userId: user._id },
            {
                _id: stableSeedObjectId(`${scenario}:profile`),
                userId: user._id,
                nome: profile.nome,
                idade: profile.idade,
                tipoDePele: profile.tipoDePele,
                genero: profile.genero,
                objetivos: profile.objetivos,
                profilePhotoUrl: "",
                profilePhotoMode: "stub_url",
                profilePhotoUpdatedAt: null,
                allergies: profile.allergies ?? [],
                avoidIngredients: profile.avoidIngredients ?? [],
                lightMedicalRestrictions: profile.lightMedicalRestrictions ?? [],
                createdAt: timestamp,
                updatedAt: timestamp,
            },
            session,
        );
        await ensureDocument(
            Preference,
            { userId: user._id },
            {
                _id: stableSeedObjectId(`${scenario}:preference`),
                userId: user._id,
                favoriteBrandNames: [...new Set(products.map(({ brandName }) => brandName))],
                favoriteProductIds: products.slice(0, 4).map(({ _id }) => _id),
                createdAt: timestamp,
                updatedAt: timestamp,
            },
            session,
        );
    });
}

/** Cria ou reutiliza o consentimento facial ativo do cenário. */
async function ensureFaceConsent({ scenario, user, referenceDate, generativeEdit = false }) {
    return inTransaction((session) =>
        ensureDocument(
            FaceConsent,
            { userId: user._id },
            {
                _id: stableSeedObjectId(`${scenario}:face-consent`),
                userId: user._id,
                acceptedAt: daysBefore(referenceDate, 170, 11),
                version: "face-analysis-v2",
                purpose: FACE_ANALYSIS_CONSENT_PURPOSE,
                revokedAt: null,
                externalProviderConsent: {
                    provider: "openai",
                    noticeVersion: env.openAiNoticeVersion,
                    acceptedAt: daysBefore(referenceDate, 170, 11),
                    revokedAt: null,
                },
                purposes: {
                    openAiAnalysis: true,
                    generativeEdit,
                    consultantPhotoAccess: false,
                },
                createdAt: daysBefore(referenceDate, 170, 11),
                updatedAt: daysBefore(referenceDate, 170, 11),
            },
            session,
        ),
    );
}

/** Gera um retrato ilustrado de alto contraste, sem usar uma pessoa real. */
function syntheticPortraitSvg({ kind, scenario }) {
    const isProfile = kind === "perfil";
    const accent = scenario === "joao" ? "#6f8f88" : "#a77d72";
    const faceX = isProfile ? 535 : 480;
    return Buffer.from(`
        <svg width="960" height="960" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <pattern id="grid" width="24" height="24" patternUnits="userSpaceOnUse">
                    <rect width="24" height="24" fill="#d9cfc4"/>
                    <rect width="12" height="12" fill="#c1b2a3"/>
                    <rect x="12" y="12" width="12" height="12" fill="#c1b2a3"/>
                </pattern>
            </defs>
            <rect width="960" height="960" fill="url(#grid)"/>
            <circle cx="480" cy="480" r="360" fill="#f4eee8" opacity="0.92"/>
            <ellipse cx="${faceX}" cy="455" rx="205" ry="270" fill="#d6aa8c"/>
            <path d="M${faceX - 190} 390 Q${faceX} 120 ${faceX + 190} 390 L${faceX + 150} 270 Q${faceX} 120 ${faceX - 150} 270Z" fill="#4b3934"/>
            ${isProfile
                ? `<ellipse cx="600" cy="438" rx="26" ry="18" fill="#2f2927"/><path d="M690 465 L755 500 L690 525" fill="none" stroke="#9b725f" stroke-width="18"/><path d="M615 610 Q690 645 745 600" fill="none" stroke="#7f4f4d" stroke-width="14"/>`
                : `<ellipse cx="410" cy="438" rx="24" ry="17" fill="#2f2927"/><ellipse cx="550" cy="438" rx="24" ry="17" fill="#2f2927"/><path d="M480 465 L455 535 L505 535" fill="none" stroke="#9b725f" stroke-width="16"/><path d="M395 615 Q480 670 565 615" fill="none" stroke="#7f4f4d" stroke-width="14"/>`}
            <rect x="315" y="745" width="330" height="90" rx="45" fill="${accent}"/>
            <text x="480" y="805" text-anchor="middle" font-family="Arial" font-size="34" fill="#fff">DEMO SINTÉTICA</text>
        </svg>
    `);
}

/** Cria o par temporário no shape recebido pelo serviço real de upload. */
async function createSyntheticUploadedPair(scenario) {
    await mkdir(FACE_PHOTO_UPLOAD_DIR, { recursive: true, mode: 0o700 });
    const uploadedFiles = [];
    try {
        for (const kind of ["frontal", "perfil"]) {
            const filePath = path.join(
                FACE_PHOTO_UPLOAD_DIR,
                `seed-${scenario}-${process.pid}-${kind}.png`,
            );
            const output = await sharp(syntheticPortraitSvg({ kind, scenario }))
                .png()
                .toFile(filePath);
            uploadedFiles.push({
                kind,
                file: {
                    fieldname: kind,
                    originalname: `retrato-sintetico-${kind}.png`,
                    mimetype: "image/png",
                    path: filePath,
                    filename: path.basename(filePath),
                    size: output.size,
                },
            });
        }
        return uploadedFiles;
    } catch (error) {
        await Promise.all(
            uploadedFiles.map(({ file }) => unlink(file.path).catch(() => undefined)),
        );
        throw error;
    }
}

/**
 * Garante exatamente um par facial ativo sem substituir trabalho manual.
 *
 * Um estado parcial é recusado por poder representar corrupção ou uma operação
 * interrompida que não deve ser escondida por um seed automático.
 */
async function ensureSyntheticFacePhotoPair({ scenario, user, consent }) {
    const existing = await FacePhoto.find({ userId: user._id, status: "active" }).sort({ kind: 1 });
    if (existing.length === 2 && new Set(existing.map(({ kind }) => kind)).size === 2) {
        return existing;
    }
    if (existing.length !== 0) {
        throw new Error(`Par facial demo incompleto para ${user.email}`);
    }

    const uploadedFiles = await createSyntheticUploadedPair(scenario);
    try {
        await saveFacePhotos(user._id.toString(), uploadedFiles, consent);
    } finally {
        await Promise.all(
            uploadedFiles.map(({ file }) => unlink(file.path).catch(() => undefined)),
        );
    }
    const photos = await FacePhoto.find({ userId: user._id, status: "active" })
        .select("+storageKey")
        .sort({ kind: 1 });
    for (const photo of photos) {
        if (photo.storageKey) SEEDED_CLIENT_STORAGE_KEYS.add(photo.storageKey);
    }
    return photos;
}

/** Constrói findings cosméticos com evolução controlada de 1 a 3. */
function buildFindings({ skinType, acne, spots, wrinkles, oiliness }) {
    const finding = (label, explanation) => ({
        label,
        confidence: 0.82,
        explanation,
    });
    return {
        skinType: finding(skinType, "Estimativa cosmética sintética para a demonstração local."),
        acne: finding(acne, "Sinal cosmético estimado sem finalidade clínica."),
        manchas: finding(spots, "Variação visual estimada em dados sintéticos."),
        rugas: finding(wrinkles, "Observação cosmética demonstrativa."),
        oleosidade: finding(oiliness, "Equilíbrio aparente estimado para a rotina demo."),
    };
}

/** Constrói metadados comuns e explicitamente marcados como demonstração. */
function providerMetadata(scenario, index, generatedAt) {
    return {
        provider: "openai",
        requestedModel: env.openAiAnalysisModel,
        effectiveModel: env.openAiAnalysisModel,
        requestId: `seed-${scenario}-${index}`,
        promptVersion: env.openAiPromptVersion,
        responseSchemaVersion: env.openAiSchemaVersion,
        generatedAt,
    };
}

/** Texto e fontes públicas que passam pelos guards de explicabilidade/fairness. */
function recommendationExplanation(product) {
    return {
        reasonCodes: ["skin_type_match", "guided_context_match"],
        sourceSignals: ["skinType:mista", "guidedContext:hidratar"],
        explanation: `${product.name} foi recomendado por ser compatível com o tipo de pele estimado e com o objetivo cosmético indicado.`,
        limitations: [
            "A sugestão é cosmética e deve ser confirmada pelo cliente antes da compra.",
            "A recomendação não adiciona produtos automaticamente ao carrinho.",
        ],
    };
}

/**
 * Cria uma consulta completa com análise, relatório, recomendações e revisão.
 *
 * IDs conhecidos permitem construir o grafo cíclico sem updates destrutivos.
 */
async function seedConsultationChain({
    scenario,
    user,
    consultant,
    products,
    photos,
    consent,
    index,
    daysAgo,
    findings,
    reviewStatus,
    lifecycleStatus,
    flowState,
    isOpen,
    unlocked,
    referenceDate,
}) {
    const sessionId = stableSeedObjectId(`${scenario}:consultation:${index}`);
    const analysisId = stableSeedObjectId(`${scenario}:analysis:${index}`);
    const reportId = stableSeedObjectId(`${scenario}:report:${index}`);
    const reviewId = stableSeedObjectId(`${scenario}:consultation-review:${index}`);
    const unlockId = stableSeedObjectId(`${scenario}:unlock:${index}`);
    const recommendationIds = products.map((_, productIndex) =>
        stableSeedObjectId(`${scenario}:recommendation:${index}:${productIndex}`),
    );
    const createdAt = daysBefore(referenceDate, daysAgo, 10);
    const completedAt = daysBefore(referenceDate, Math.max(daysAgo - 1, 0), 15);
    const contentHash = stableHash(`${scenario}:report-content:${index}`);
    const goalSelection = {
        primaryGoal: AI_CONSULTATION_GOAL_CODES.HYDRATION,
        secondaryGoals: [AI_CONSULTATION_GOAL_CODES.SUN_PROTECTION],
    };

    return inTransaction(async (mongoSession) => {
        await ensureDocument(
            AiConsultationSession,
            { _id: sessionId, userId: user._id },
            {
                _id: sessionId,
                schemaVersion: 2,
                userId: user._id,
                analysisId,
                reportId,
                photoIds: photos.map(({ _id }) => _id),
                consentId: consent._id,
                scriptVersion: AI_CONSULTATION_GOALS_VERSION,
                goalSelection,
                conversation: { turns: [], currentQuestion: null, missingSlotCodes: [] },
                facts: {
                    main_goal: "hidratar",
                    skin_comfort: "3/5",
                    usage_preferences: "textura_leve, rotina_curta",
                },
                answers: [],
                flowState,
                status: isOpen
                    ? AI_CONSULTATION_STATUS.ACTIVE
                    : AI_CONSULTATION_STATUS.COMPLETED,
                isOpen,
                revision: 7,
                logicalOperations: 7,
                currentReviewId: reviewId,
                submittedAt: createdAt,
                completedAt: isOpen ? null : completedAt,
                createdAt,
                updatedAt: completedAt,
            },
            mongoSession,
        );

        await ensureDocument(
            FaceAnalysis,
            { _id: analysisId, userId: user._id },
            {
                _id: analysisId,
                schemaVersion: 2,
                userId: user._id,
                photoIds: photos.map(({ _id }) => _id),
                consentId: consent._id,
                consultationSessionId: sessionId,
                inputFingerprint: stableHash(`${scenario}:analysis-input:${index}`),
                providerName: "openai",
                providerVersion: env.openAiAnalysisModel,
                mode: "openai",
                isDemo: true,
                findings,
                photoQuality: DEFAULT_PHOTO_QUALITY,
                sources: ["fotografia_frontal_sintetica", "fotografia_perfil_sintetica"],
                limitations: DEMO_LIMITATIONS,
                safetyFlags: [],
                performance: { durationMs: 850 + index * 75, budgetMs: 10_000 },
                provenance: {
                    requestedModel: env.openAiAnalysisModel,
                    effectiveModel: env.openAiAnalysisModel,
                    requestId: `seed-${scenario}-analysis-${index}`,
                    promptVersion: env.openAiPromptVersion,
                    schemaVersion: env.openAiSchemaVersion,
                },
                status: "completed",
                createdAt,
                updatedAt: createdAt,
            },
            mongoSession,
        );

        const recommendationTotal = products.reduce(
            (total, product) => total + resolveSeedVariant(product).priceCents,
            0,
        );
        const reportRoutine = products.slice(0, 3).map((product, productIndex) => ({
            period: productIndex % 2 === 0 ? "manha" : "noite",
            title: `Aplicar ${product.name}`,
            reason: "Passo cosmético organizado a partir das recomendações demo.",
        }));
        await ensureDocument(
            FaceReport,
            { userId: user._id, consultationSessionId: sessionId, version: 1 },
            {
                _id: reportId,
                userId: user._id,
                analysisId,
                consultationSessionId: sessionId,
                schemaVersion: 2,
                version: 1,
                lifecycleStatus,
                objectives: [
                    { code: AI_CONSULTATION_GOAL_CODES.HYDRATION, priority: "primary" },
                    { code: AI_CONSULTATION_GOAL_CODES.SUN_PROTECTION, priority: "secondary" },
                ],
                analysisMode: "openai",
                analysisIsDemo: true,
                analysisProviderVersion: env.openAiAnalysisModel,
                cosmeticSummary: "A pele sintética apresenta necessidades de hidratação e proteção diária equilibrada.",
                routineSuggestions: reportRoutine,
                sources: ["fotografias sintéticas", "respostas guiadas demo"],
                limitations: DEMO_LIMITATIONS,
                photoQuality: DEFAULT_PHOTO_QUALITY,
                answerSummary: "Objetivo principal de hidratação com preferência por uma rotina curta.",
                machineResult: {
                    observations: ["Necessidade cosmética de conforto e hidratação."],
                    answerSummary: "Preferência por texturas leves e proteção diária.",
                    objectivesAssessment: "Objetivos compatíveis com o catálogo local.",
                    routine: reportRoutine,
                    recommendations: recommendationIds.map((id) => id.toString()),
                    limitations: DEMO_LIMITATIONS,
                    safetyFlags: [],
                },
                humanOverride:
                    reviewStatus === "adjusted"
                        ? { assessment: "Rotina ajustada para introdução gradual dos produtos." }
                        : null,
                simulationSpec: { enabled: false, regions: [], lookDescription: null, preserve: [] },
                candidateAllowlist: products.map(({ _id }) => _id.toString()),
                providerMetadata: providerMetadata(scenario, index, completedAt),
                finalRecommendationIds: recommendationIds,
                reviewId,
                contentHash: unlocked ? contentHash : null,
                frozenAt: unlocked ? completedAt : null,
                privacyStatus: "active",
                createdAt,
                updatedAt: completedAt,
            },
            mongoSession,
        );

        for (const [productIndex, product] of products.entries()) {
            const variant = resolveSeedVariant(product);
            const explanation = recommendationExplanation(product);
            await ensureDocument(
                ProductRecommendation,
                {
                    userId: user._id,
                    reportId,
                    reportVersion: 1,
                    productId: product._id,
                    variantId: variant.variantId,
                },
                {
                    _id: recommendationIds[productIndex],
                    userId: user._id,
                    analysisId,
                    reportId,
                    schemaVersion: 2,
                    reportVersion: 1,
                    analysisMode: "openai",
                    analysisIsDemo: true,
                    analysisProviderVersion: env.openAiAnalysisModel,
                    productId: product._id,
                    variantId: variant.variantId,
                    productSnapshot: {
                        ...productSnapshot(product),
                        variantId: variant.variantId,
                    },
                    selectionRank: productIndex + 1,
                    candidateAllowlistHash: stableHash(`${scenario}:allowlist:${index}`),
                    score: Number((0.92 - productIndex * 0.08).toFixed(2)),
                    ...explanation,
                    machineResult: {
                        score: Number((0.92 - productIndex * 0.08).toFixed(2)),
                        reasonCodes: explanation.reasonCodes,
                        explanation: explanation.explanation,
                    },
                    humanOverride: reviewStatus === "adjusted" && productIndex === 0
                        ? { explanation: `${explanation.explanation} Introduzir gradualmente.` }
                        : null,
                    status: productIndex === 0 ? "accepted" : "active",
                    feedback:
                        unlocked && productIndex === 0
                            ? { value: "util", submittedAt: completedAt }
                            : null,
                    consultantNote: reviewStatus === "pending"
                        ? null
                        : "Recomendação revista no cenário académico local.",
                    createdAt,
                    updatedAt: completedAt,
                },
                mongoSession,
            );
        }

        const recommendationSnapshots = products.map((product, productIndex) => {
            const variant = resolveSeedVariant(product);
            return {
                recommendationId: recommendationIds[productIndex],
                productId: product._id,
                variantId: variant.variantId,
                unitPriceCents: variant.priceCents,
                stockAtFreeze: variant.stock,
                availableAtFreeze: variant.stock > 0,
            };
        });
        const depositCents = Math.round(recommendationTotal * 0.1);
        const unlock = await ensureDocument(
            ReportUnlock,
            { userId: user._id, reportId },
            {
                _id: unlockId,
                userId: user._id,
                analysisId,
                reportId,
                schemaVersion: 2,
                reportVersion: 1,
                contentHash: unlocked ? contentHash : null,
                recommendationIds,
                recommendedTotalCents: recommendationTotal,
                depositCents,
                availableRecommendationCount: recommendationSnapshots.filter(
                    ({ availableAtFreeze }) => availableAtFreeze,
                ).length,
                recommendationSnapshots,
                status: unlocked ? REPORT_UNLOCK_STATUS.UNLOCKED : REPORT_UNLOCK_STATUS.LOCKED,
                simulatedPayment: unlocked
                    ? {
                          status: "simulated_paid",
                          amountCents: depositCents,
                          confirmedAt: completedAt,
                          reference: `SEED-REPORT-${stableHash(`${scenario}:${index}`).slice(0, 12).toUpperCase()}`,
                      }
                    : { status: "not_started", amountCents: 0, confirmedAt: null, reference: null },
                unlockedAt: unlocked ? completedAt : null,
                frozenAt: unlocked ? completedAt : null,
                zeroFeeReason: null,
                createdAt,
                updatedAt: completedAt,
            },
            mongoSession,
        );

        const review = await ensureDocument(
            AiConsultationReview,
            { userId: user._id, reportId },
            {
                _id: reviewId,
                schemaVersion: 2,
                userId: user._id,
                consultationSessionId: sessionId,
                reportId,
                reportVersion: 1,
                recommendationIds,
                status: reviewStatus,
                summary: "Revisão humana do relatório cosmético sintético.",
                sourceLabels: ["relatório demo", "fotografias sintéticas"],
                limitations: DEMO_LIMITATIONS,
                publicInsight: reviewStatus === "pending"
                    ? null
                    : "A rotina proposta é adequada para uma introdução gradual.",
                internalNote: reviewStatus === "pending"
                    ? null
                    : "Dados exclusivamente sintéticos e locais.",
                reviewedBy: reviewStatus === "pending" ? null : consultant._id,
                reviewedAt: reviewStatus === "pending" ? null : completedAt,
                requestedAt: createdAt,
                auditTrail: reviewStatus === "pending"
                    ? []
                    : [{
                          actorId: consultant._id,
                          actorRole: ROLES.CONSULTOR,
                          action: reviewStatus,
                          occurredAt: completedAt,
                      }],
                machineResult: {
                    assessment: "Relatório cosmético demo preparado para revisão.",
                    routine: reportRoutine,
                },
                humanOverride: reviewStatus === "adjusted"
                    ? { assessment: "Introdução gradual recomendada pelo consultor." }
                    : null,
                createdAt,
                updatedAt: completedAt,
            },
            mongoSession,
        );

        for (const [eventIndex, eventType] of [
            "consultation_submitted",
            "answer_summary_ready",
            "recommendation_context_ready",
        ].entries()) {
            await ensureDocument(
                AiInteractionHistory,
                { userId: user._id, sessionId, eventType },
                {
                    _id: stableSeedObjectId(`${scenario}:history:${index}:${eventIndex}`),
                    userId: user._id,
                    sessionId,
                    eventType,
                    purpose: "Histórico minimizado da consulta cosmética demo",
                    safeSummary: `Etapa ${eventIndex + 1} concluída na consulta sintética.`,
                    safeSignals: [
                        { key: "main_goal", label: "Objetivo cosmético principal", value: "hidratar" },
                        { key: "skin_comfort", label: "Conforto da pele", value: "3/5" },
                    ],
                    source: eventIndex === 2 ? "recommendation_engine" : "guided_consultation",
                    createdAt: new Date(createdAt.getTime() + eventIndex * 60 * 60 * 1000),
                    updatedAt: new Date(createdAt.getTime() + eventIndex * 60 * 60 * 1000),
                },
                mongoSession,
            );
        }

        if (reviewStatus !== "pending") {
            await ensureDocument(
                AiConsultationAuditLog,
                { _id: stableSeedObjectId(`${scenario}:review-audit:${index}`) },
                {
                    _id: stableSeedObjectId(`${scenario}:review-audit:${index}`),
                    actorId: consultant._id,
                    actorRole: ROLES.CONSULTOR,
                    action: "decision",
                    reviewId: review._id,
                    resultCount: null,
                    requestId: `seed-review-${scenario}-${index}`,
                    occurredAt: completedAt,
                },
                mongoSession,
            );
        }

        return {
            sessionId,
            analysisId,
            reportId,
            reviewId,
            unlockId: unlock._id,
            recommendationIds,
            products,
            createdAt,
            completedAt,
        };
    });
}

/** Cria encomendas históricas sem movimentar ou repor o stock atual. */
async function seedOrders({ scenario, user, products, definitions, referenceDate }) {
    return inTransaction(async (session) => {
        const orderIds = [];
        for (const [index, definition] of definitions.entries()) {
            const items = definition.productIndexes.map((productIndex, itemIndex) =>
                orderItem(products[productIndex % products.length], itemIndex === 0 ? 2 : 1),
            );
            const subtotalCents = items.reduce((total, item) => total + item.lineTotalCents, 0);
            const discountCents = definition.discountCents ?? 0;
            const totalCents = subtotalCents - discountCents;
            const createdAt = daysBefore(referenceDate, definition.daysAgo, 14);
            const order = await ensureDocument(
                Order,
                { userId: user._id, checkoutKey: `seed-${scenario}-${index + 1}` },
                {
                    _id: stableSeedObjectId(`${scenario}:order:${index}`),
                    userId: user._id,
                    checkoutKey: `seed-${scenario}-${index + 1}`,
                    items,
                    totalCents,
                    subtotalCents,
                    discountCents,
                    voucher: { voucherId: null, code: null, amountCents: 0 },
                    status: definition.status,
                    payment: {
                        mode: PAYMENT_MODE.SIMULATED,
                        status: definition.paymentStatus,
                        simulationReference:
                            definition.paymentStatus === PAYMENT_STATUS.AWAITING_SIMULATION
                                ? null
                                : `SEED-ORDER-${stableHash(`${scenario}:${index}`).slice(0, 12).toUpperCase()}`,
                        simulatedAt:
                            definition.paymentStatus === PAYMENT_STATUS.AWAITING_SIMULATION
                                ? null
                                : createdAt,
                        message: definition.paymentStatus === PAYMENT_STATUS.SIMULATED_PAID
                            ? "Pagamento académico simulado com sucesso."
                            : definition.paymentStatus === PAYMENT_STATUS.SIMULATED_FAILED
                              ? "Pagamento académico simulado sem sucesso."
                              : "Pagamento académico aguarda simulação.",
                    },
                    stockReserved: definition.paymentStatus === PAYMENT_STATUS.SIMULATED_PAID,
                    createdAt,
                    updatedAt: createdAt,
                },
                session,
            );
            orderIds.push(order._id);
        }
        return orderIds;
    });
}

/** Cria um carrinho apenas quando o cliente ainda não possui um. */
async function seedCart({ scenario, user, products, indexes, referenceDate }) {
    return inTransaction((session) =>
        ensureDocument(
            Cart,
            { userId: user._id },
            {
                _id: stableSeedObjectId(`${scenario}:cart`),
                userId: user._id,
                items: indexes.map((productIndex, index) =>
                    cartItem(products[productIndex % products.length], index + 1),
                ),
                createdAt: daysBefore(referenceDate, 4, 16),
                updatedAt: daysBefore(referenceDate, 4, 16),
            },
            session,
        ),
    );
}

/** Cria avaliações únicas por cliente/produto e preserva moderação posterior. */
async function seedReviews({ scenario, user, admin, products, count, referenceDate }) {
    await inTransaction(async (session) => {
        for (let index = 0; index < count; index += 1) {
            const hidden = index === count - 1 && scenario === "maria";
            const createdAt = daysBefore(referenceDate, 100 - index * 12, 17);
            await ensureDocument(
                Review,
                { userId: user._id, productId: products[index]._id },
                {
                    _id: stableSeedObjectId(`${scenario}:product-review:${index}`),
                    productId: products[index]._id,
                    userId: user._id,
                    rating: Math.max(3, 5 - (index % 3)),
                    comment: hidden
                        ? "Avaliação sintética escondida para demonstrar a moderação administrativa."
                        : "Produto integrado de forma simples na rotina cosmética de demonstração.",
                    status: hidden ? REVIEW_STATUSES.HIDDEN : REVIEW_STATUSES.PUBLISHED,
                    moderationReason: hidden ? "Conteúdo ocultado no cenário académico." : null,
                    moderatedBy: hidden ? admin._id : null,
                    moderatedAt: hidden ? daysBefore(referenceDate, 3, 12) : null,
                    createdAt,
                    updatedAt: hidden ? daysBefore(referenceDate, 3, 12) : createdAt,
                },
                session,
            );
        }
    });
}

/** Cria notificações com IDs estáveis para evitar duplicação no replay. */
async function seedNotifications({ scenario, user, count, referenceDate }) {
    const templates = [
        [NOTIFICATION_TYPES.NEW_PRODUCT, "Novidade no catálogo", "Descobre os novos produtos disponíveis na demonstração."],
        [NOTIFICATION_TYPES.PROMOTION, "Seleção personalizada", "Consulta uma seleção cosmética preparada para o teu perfil."],
        [NOTIFICATION_TYPES.ORDER_STATUS, "Encomenda atualizada", "O estado de uma encomenda simulada foi atualizado."],
        [NOTIFICATION_TYPES.ROUTINE_ALERT, "Rotina noturna", "Está na hora da tua rotina cosmética noturna."],
    ];
    await inTransaction(async (session) => {
        for (let index = 0; index < count; index += 1) {
            const [type, title, message] = templates[index % templates.length];
            const isRead = index >= Math.ceil(count / 2);
            const createdAt = daysBefore(referenceDate, index + 1, 18);
            await ensureDocument(
                Notification,
                { _id: stableSeedObjectId(`${scenario}:notification:${index}`) },
                {
                    _id: stableSeedObjectId(`${scenario}:notification:${index}`),
                    userId: user._id,
                    type,
                    title,
                    message,
                    isRead,
                    readAt: isRead ? new Date(createdAt.getTime() + 2 * 60 * 60 * 1000) : null,
                    metadata: { source: "demo_seed", scenario },
                    createdAt,
                    updatedAt: createdAt,
                },
                session,
            );
        }
    });
}

/** Cria a rotina atual a partir das recomendações desbloqueadas mais recentes. */
async function seedRoutine({ scenario, user, chain, referenceDate }) {
    const steps = chain.recommendationIds.map((recommendationId, index) => ({
        period: index % 2 === 0 ? "manha" : "noite",
        title: index % 2 === 0
            ? `Manhã: aplicar ${chain.products[index].name}`
            : `Noite: aplicar ${chain.products[index].name}`,
        instructions: index % 2 === 0
            ? "Aplicar depois da limpeza e antes da proteção solar."
            : "Aplicar depois da limpeza, respeitando a tolerância cosmética.",
        recommendationId,
        productSnapshot: productSnapshot(chain.products[index]),
    }));
    await inTransaction(async (session) => {
        await ensureDocument(
            DailyRoutine,
            { userId: user._id },
            {
                _id: stableSeedObjectId(`${scenario}:routine`),
                userId: user._id,
                source: "recommendations",
                steps,
                limitations: DEMO_LIMITATIONS,
                createdAt: daysBefore(referenceDate, 25, 9),
                updatedAt: daysBefore(referenceDate, 2, 9),
            },
            session,
        );
        await ensureDocument(
            RoutineAlertPreference,
            { userId: user._id },
            {
                _id: stableSeedObjectId(`${scenario}:routine-alert-preference`),
                userId: user._id,
                enabled: true,
                eveningTime: "21:00",
                lastNotificationKey: null,
                createdAt: daysBefore(referenceDate, 25, 9),
                updatedAt: daysBefore(referenceDate, 2, 9),
            },
            session,
        );
    });
}

/** Cria uma comparação temporal entre a primeira e a última análise. */
async function seedSkinComparison({ scenario, user, firstChain, lastChain, referenceDate }) {
    return inTransaction((session) =>
        ensureDocument(
            SkinComparison,
            {
                userId: user._id,
                baselineAnalysisId: firstChain.analysisId,
                followUpAnalysisId: lastChain.analysisId,
            },
            {
                _id: stableSeedObjectId(`${scenario}:skin-comparison`),
                userId: user._id,
                baselineAnalysisId: firstChain.analysisId,
                followUpAnalysisId: lastChain.analysisId,
                daysBetween: 150,
                metricDeltas: { acneScore: -1, manchasScore: -1, rugasScore: 0, oleosidadeScore: -1 },
                summary: "A evolução sintética demonstra maior equilíbrio e conforto cosmético.",
                limitations: DEMO_LIMITATIONS,
                createdAt: daysBefore(referenceDate, 25, 16),
                updatedAt: daysBefore(referenceDate, 25, 16),
            },
            session,
        ),
    );
}

/** Cria um voucher ativo ligado ao último relatório desbloqueado. */
async function seedVoucher({ scenario, user, chain, referenceDate }) {
    const unlock = await ReportUnlock.findById(chain.unlockId);
    return inTransaction((session) =>
        ensureDocument(
            Voucher,
            { userId: user._id, sourceReportUnlockId: chain.unlockId },
            {
                _id: stableSeedObjectId(`${scenario}:voucher`),
                userId: user._id,
                code: `ORELLE-DEMO-${stableHash(`${scenario}:voucher`).slice(0, 8).toUpperCase()}`,
                amountCents: unlock.depositCents,
                remainingCents: unlock.depositCents,
                sourceReportUnlockId: chain.unlockId,
                appliedOrderIds: [],
                status: VOUCHER_STATUS.ACTIVE,
                createdAt: daysBefore(referenceDate, 24, 10),
                updatedAt: daysBefore(referenceDate, 24, 10),
            },
            session,
        ),
    );
}

/** Cenário principal com utilização transversal da aplicação. */
async function seedMainClient(context) {
    const { users, products, referenceDate } = context;
    const user = users.get("cliente@orelle.test");
    const consultant = users.get("consultor@orelle.test");
    const admin = users.get("admin@orelle.test");
    await seedIdentity({
        scenario: "principal",
        user,
        products,
        referenceDate,
        profile: {
            nome: "Cliente Demo",
            idade: 32,
            tipoDePele: "mista",
            genero: "prefiro_nao_dizer",
            objetivos: ["hidratar", "proteger", "equilibrar a rotina"],
            allergies: [],
            avoidIngredients: ["perfume intenso"],
            lightMedicalRestrictions: [],
        },
    });
    const consent = await ensureFaceConsent({ scenario: "principal", user, referenceDate });
    const photos = await ensureSyntheticFacePhotoPair({ scenario: "principal", user, consent });
    const chainDefinitions = [
        { daysAgo: 175, values: ["alto", "moderado", "baixo", "alta"], reviewStatus: "approved" },
        { daysAgo: 100, values: ["moderado", "moderado", "baixo", "moderada"], reviewStatus: "adjusted" },
        { daysAgo: 25, values: ["baixo", "baixo", "baixo", "baixa"], reviewStatus: "approved" },
    ];
    const chains = [];
    for (const [index, definition] of chainDefinitions.entries()) {
        chains.push(await seedConsultationChain({
            scenario: "principal",
            user,
            consultant,
            products: products.slice(index * 3, index * 3 + 3),
            photos,
            consent,
            index,
            daysAgo: definition.daysAgo,
            findings: buildFindings({
                skinType: "mista",
                acne: definition.values[0],
                spots: definition.values[1],
                wrinkles: definition.values[2],
                oiliness: definition.values[3],
            }),
            reviewStatus: definition.reviewStatus,
            lifecycleStatus: FACE_REPORT_LIFECYCLE.UNLOCKED,
            flowState: AI_CONSULTATION_FLOW_STATES.UNLOCKED,
            isOpen: false,
            unlocked: true,
            referenceDate,
        }));
    }
    await seedSkinComparison({
        scenario: "principal",
        user,
        firstChain: chains[0],
        lastChain: chains[2],
        referenceDate,
    });
    await seedRoutine({ scenario: "principal", user, chain: chains[2], referenceDate });
    await seedVoucher({ scenario: "principal", user, chain: chains[2], referenceDate });
    await seedOrders({
        scenario: "principal",
        user,
        products,
        referenceDate,
        definitions: [
            { daysAgo: 150, productIndexes: [0, 1], status: ORDER_STATUS.ENTREGUE, paymentStatus: PAYMENT_STATUS.SIMULATED_PAID },
            { daysAgo: 120, productIndexes: [2], status: ORDER_STATUS.ENTREGUE, paymentStatus: PAYMENT_STATUS.SIMULATED_PAID },
            { daysAgo: 90, productIndexes: [3, 4], status: ORDER_STATUS.ENTREGUE, paymentStatus: PAYMENT_STATUS.SIMULATED_PAID },
            { daysAgo: 60, productIndexes: [5], status: ORDER_STATUS.ENVIADO, paymentStatus: PAYMENT_STATUS.SIMULATED_PAID },
            { daysAgo: 30, productIndexes: [6, 7], status: ORDER_STATUS.PENDENTE, paymentStatus: PAYMENT_STATUS.SIMULATED_PAID },
            { daysAgo: 5, productIndexes: [8], status: ORDER_STATUS.PENDENTE, paymentStatus: PAYMENT_STATUS.AWAITING_SIMULATION },
        ],
    });
    await seedCart({ scenario: "principal", user, products, indexes: [9, 10], referenceDate });
    await seedReviews({ scenario: "principal", user, admin, products, count: 6, referenceDate });
    await seedNotifications({ scenario: "principal", user, count: 8, referenceDate });
}

/** Cenário de cliente recorrente focado na experiência comercial. */
async function seedReturningClient(context) {
    const { users, products, referenceDate } = context;
    const user = users.get("cliente.maria@orelle.test");
    const admin = users.get("admin@orelle.test");
    await seedIdentity({
        scenario: "maria",
        user,
        products: products.slice(4, 12),
        referenceDate,
        profile: {
            nome: "Maria Costa",
            idade: 38,
            tipoDePele: "seca",
            genero: "feminino",
            objetivos: ["hidratar", "luminosidade"],
            allergies: [],
            avoidIngredients: [],
            lightMedicalRestrictions: [],
            daysAgo: 160,
        },
    });
    await seedOrders({
        scenario: "maria",
        user,
        products,
        referenceDate,
        definitions: [
            { daysAgo: 110, productIndexes: [4, 5], status: ORDER_STATUS.ENTREGUE, paymentStatus: PAYMENT_STATUS.SIMULATED_PAID },
            { daysAgo: 70, productIndexes: [6], status: ORDER_STATUS.ENTREGUE, paymentStatus: PAYMENT_STATUS.SIMULATED_PAID },
            { daysAgo: 40, productIndexes: [7, 8], status: ORDER_STATUS.ENVIADO, paymentStatus: PAYMENT_STATUS.SIMULATED_PAID },
            { daysAgo: 12, productIndexes: [9], status: ORDER_STATUS.CANCELLED, paymentStatus: PAYMENT_STATUS.SIMULATED_FAILED },
        ],
    });
    await seedReviews({ scenario: "maria", user, admin, products: products.slice(6), count: 5, referenceDate });
    await seedNotifications({ scenario: "maria", user, count: 5, referenceDate });
}

/** Cenário de consulta aberta antes do upload facial. */
async function seedPhotoCollectionClient(context) {
    const { users, products, referenceDate } = context;
    const user = users.get("cliente.ines@orelle.test");
    await seedIdentity({
        scenario: "ines",
        user,
        products: products.slice(8, 14),
        referenceDate,
        profile: {
            nome: "Inês Martins",
            idade: 27,
            tipoDePele: "sensivel",
            genero: "feminino",
            objetivos: ["acalmar sensibilidade", "proteger"],
            allergies: [],
            avoidIngredients: ["álcool desnaturado"],
            lightMedicalRestrictions: [],
            daysAgo: 45,
        },
    });
    const consent = await ensureFaceConsent({ scenario: "ines", user, referenceDate });
    await inTransaction(async (session) => {
        const openSession = await AiConsultationSession.findOne({ userId: user._id, isOpen: true }).session(session);
        if (openSession) return;
        const createdAt = daysBefore(referenceDate, 1, 20);
        await ensureDocument(
            AiConsultationSession,
            { _id: stableSeedObjectId("ines:consultation:open"), userId: user._id },
            {
                _id: stableSeedObjectId("ines:consultation:open"),
                schemaVersion: 2,
                userId: user._id,
                analysisId: null,
                reportId: null,
                photoIds: [],
                consentId: consent._id,
                scriptVersion: AI_CONSULTATION_GOALS_VERSION,
                goalSelection: {
                    primaryGoal: AI_CONSULTATION_GOAL_CODES.SENSITIVITY,
                    secondaryGoals: [AI_CONSULTATION_GOAL_CODES.SUN_PROTECTION],
                },
                conversation: { turns: [], currentQuestion: null, missingSlotCodes: [] },
                facts: {},
                answers: [],
                flowState: AI_CONSULTATION_FLOW_STATES.COLLECTING_PHOTOS,
                status: AI_CONSULTATION_STATUS.ACTIVE,
                isOpen: true,
                revision: 0,
                logicalOperations: 0,
                createdAt,
                updatedAt: createdAt,
            },
            session,
        );
    });
    await seedCart({ scenario: "ines", user, products, indexes: [12, 13, 14], referenceDate });
    await seedNotifications({ scenario: "ines", user, count: 3, referenceDate });
}

/** Cenário completo que permanece pendente na fila do consultor. */
async function seedPendingReviewClient(context) {
    const { users, products, referenceDate } = context;
    const user = users.get("cliente.joao@orelle.test");
    const consultant = users.get("consultor@orelle.test");
    await seedIdentity({
        scenario: "joao",
        user,
        products: products.slice(10, 18),
        referenceDate,
        profile: {
            nome: "João Silva",
            idade: 35,
            tipoDePele: "oleosa",
            genero: "masculino",
            objetivos: ["reduzir oleosidade", "equilibrar a rotina"],
            allergies: [],
            avoidIngredients: [],
            lightMedicalRestrictions: [],
            daysAgo: 80,
        },
    });
    const consent = await ensureFaceConsent({ scenario: "joao", user, referenceDate });
    const photos = await ensureSyntheticFacePhotoPair({ scenario: "joao", user, consent });
    await seedConsultationChain({
        scenario: "joao",
        user,
        consultant,
        products: products.slice(12, 15),
        photos,
        consent,
        index: 0,
        daysAgo: 2,
        findings: buildFindings({
            skinType: "oleosa",
            acne: "moderado",
            spots: "baixo",
            wrinkles: "baixo",
            oiliness: "alta",
        }),
        reviewStatus: "pending",
        lifecycleStatus: FACE_REPORT_LIFECYCLE.REVIEW_PENDING,
        flowState: AI_CONSULTATION_FLOW_STATES.REVIEW_PENDING,
        isOpen: true,
        unlocked: false,
        referenceDate,
    });
    await seedNotifications({ scenario: "joao", user, count: 4, referenceDate });
}

/** Cenário intencionalmente sem perfil para demonstrar onboarding. */
async function seedOnboardingClient(context) {
    const user = context.users.get("cliente.sofia@orelle.test");
    await seedNotifications({
        scenario: "sofia",
        user,
        count: 2,
        referenceDate: context.referenceDate,
    });
}

/** Resolve utilizadores e catálogo obrigatórios sem inventar fallback parcial. */
async function loadSeedContext(referenceDate) {
    const emails = [...DEMO_CLIENT_EMAILS, ...REQUIRED_SUPPORT_EMAILS];
    const [users, products] = await Promise.all([
        User.find({ email: { $in: emails } }),
        Product.find({}).sort({ name: 1, _id: 1 }),
    ]);
    const usersByEmail = new Map(users.map((user) => [user.email, user]));
    const missingEmails = emails.filter((email) => !usersByEmail.has(email));
    if (missingEmails.length > 0) {
        throw new Error(`Seed de clientes exige contas demo em falta: ${missingEmails.join(", ")}`);
    }
    if (products.length < 18) {
        throw new Error("Seed de clientes exige pelo menos 18 produtos locais");
    }
    return { users: usersByEmail, products, referenceDate };
}

/** Produz apenas contagens não sensíveis para startup e testes. */
async function buildClientSeedSummary(context) {
    const clientIds = DEMO_CLIENT_EMAILS.map((email) => context.users.get(email)._id);
    const ownerFilter = { $in: clientIds };
    const [
        profiles,
        preferences,
        consultations,
        analyses,
        reports,
        recommendations,
        orders,
        reviews,
        notifications,
        activeFacePhotos,
    ] = await Promise.all([
        Profile.countDocuments({ userId: ownerFilter }),
        Preference.countDocuments({ userId: ownerFilter }),
        AiConsultationSession.countDocuments({ userId: ownerFilter }),
        FaceAnalysis.countDocuments({ userId: ownerFilter }),
        FaceReport.countDocuments({ userId: ownerFilter }),
        ProductRecommendation.countDocuments({ userId: ownerFilter }),
        Order.countDocuments({ userId: ownerFilter }),
        Review.countDocuments({ userId: ownerFilter }),
        Notification.countDocuments({ userId: ownerFilter }),
        FacePhoto.countDocuments({ userId: ownerFilter, status: "active" }),
    ]);
    return {
        scenarios: DEMO_CLIENT_EMAILS.length,
        profiles,
        preferences,
        consultations,
        analyses,
        reports,
        recommendations,
        orders,
        reviews,
        notifications,
        activeFacePhotos,
    };
}

/**
 * Prepara os cinco cenários de cliente exclusivamente no runtime development.
 *
 * @param {{referenceDate?: Date}} [options] - Relógio controlável para testes.
 * @returns {Promise<object>} Contagens sanitizadas dos dados preparados.
 */
export async function seedDemoClientData({ referenceDate = getSeedReferenceDate() } = {}) {
    assertDevelopmentSeedsAllowed();
    const context = await loadSeedContext(referenceDate);
    await seedMainClient(context);
    await seedReturningClient(context);
    await seedPhotoCollectionClient(context);
    await seedPendingReviewClient(context);
    await seedOnboardingClient(context);
    return buildClientSeedSummary(context);
}

/**
 * Remove apenas os ficheiros sintéticos criados por este processo de runtime.
 *
 * O MongoDB de `dev:local` é efémero; sem este cleanup, os bytes cifrados
 * ficariam órfãos depois do shutdown. O conjunto vive apenas em memória e não
 * inclui fotografias que o utilizador tenha carregado ou substituído depois.
 *
 * @returns {Promise<void>} Resolve depois de remover ou confirmar a ausência.
 */
export async function cleanupDemoClientSeedFiles() {
    const files = [...SEEDED_CLIENT_STORAGE_KEYS].map((storageKey) => ({
        storageKey,
    }));
    await removeEncryptedFacePhotoFiles(files);
    SEEDED_CLIENT_STORAGE_KEYS.clear();
}
