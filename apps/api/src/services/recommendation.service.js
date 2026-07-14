/**
 * Service de recomendações personalizadas e enriquecidas.
 *
 * Junta análise facial, relatório, perfil, restrições, catálogo com stock e
 * contexto seguro da avaliação guiada sem expor dados internos ao frontend.
 */
import mongoose from "mongoose";
import { AppError } from "../middlewares/error.middleware.js";
import { FaceAnalysis } from "../models/face-analysis.model.js";
import { FaceReport } from "../models/face-report.model.js";
import {
    AiConsultationSession,
    AI_CONSULTATION_STATUS,
} from "../models/ai-consultation-session.model.js";
import { Product } from "../models/product.model.js";
import { ProductRecommendation } from "../models/product-recommendation.model.js";
import {
    ReportUnlock,
    REPORT_UNLOCK_STATUS,
} from "../models/report-unlock.model.js";
import { Profile } from "../models/profile.model.js";
import {
    assertRecommendationFairness,
    buildFairnessSafeRankingInputs,
} from "./ai-fairness-guard.service.js";
import { listRecommendationHistoryContext } from "./ai-interaction-history.service.js";
import { assertLatestReportUnlockedForRecommendations } from "./report-unlock.service.js";
import { assertAbortSignalActive } from "../utils/abort-signal.util.js";
import {
    buildPublicSourceLabels,
    buildRecommendationReason,
} from "./recommendation-reason.service.js";
import { filterProductsBlockedByProfile } from "./recommendation-restrictions.service.js";
import { resolveEffectiveRecommendationExplanation } from "../utils/recommendation-presentation.util.js";

const SIGNAL_LABELS = Object.freeze(["moderado", "moderada", "alto", "alta"]);
const PRODUCT_SELECT = "name brandName description ingredientNames skinTypes imageUrl priceCents stock";
const GUIDED_CONTEXT_MAX_BOOST = 0.24;
const GUIDED_CONTEXT_SIGNAL_BOOST = 0.08;

const GUIDED_KEYWORDS = Object.freeze({
    hidratar: ["hidrat", "conforto", "hialuronico"],
    luminosidade: ["luminos", "vitamina c", "mancha"],
    oleosidade: ["oleos", "sebo", "matificante", "mista"],
    sensibilidade: ["sensivel", "suave", "calmante"],
    acne: ["acne", "imperfeicao"],
    rugas: ["ruga", "anti-idade", "idade"],
});

const GUIDED_STOP_WORDS = new Set([
    "avaliacao",
    "cosmetica",
    "objetivo",
    "principal",
    "prioridade",
    "momento",
    "rotina",
    "valor",
    "para",
    "com",
    "mais",
    "menos",
    "pele",
]);

/**
 * Normaliza texto para comparação leve.
 *
 * @function normalizeSearchText
 * @param {unknown} value - Valor original.
 * @returns {string} Texto normalizado.
 */
function normalizeSearchText(value) {
    return String(value ?? "")
        .trim()
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
}

/**
 * Converte produto populado para DTO publico.
 *
 * @function toProductSnapshot
 * @param {object} product - Produto Mongoose ou mock equivalente.
 * @returns {object} Produto publico.
 */
function toProductSnapshot(product) {
    return {
        id: product._id.toString(),
        name: product.name,
        brandName: product.brandName,
        description: product.description,
        ingredientNames: product.ingredientNames,
        skinTypes: product.skinTypes,
        imageUrl: product.imageUrl,
        priceCents: product.priceCents,
        stock: product.stock,
    };
}

/**
 * Converte recomendacao para DTO publico.
 *
 * @function toRecommendationDto
 * @param {object} recommendation - Documento populado.
 * @returns {object} Recomendacao publica.
 */
function toRecommendationDto(recommendation) {
    // Revalidar no DTO impede que recomendacoes antigas ou criadas fora do fluxo atual violem RNF24.
    const effectiveExplanation =
        resolveEffectiveRecommendationExplanation(recommendation);
    const fairness = assertRecommendationFairness({
        reasonCodes: recommendation.reasonCodes,
        sourceSignals: recommendation.sourceSignals,
        explanation: effectiveExplanation,
        limitations: recommendation.limitations,
    });

    return {
        id: recommendation._id.toString(),
        analysisMode: recommendation.analysisMode,
        analysisIsDemo: recommendation.analysisIsDemo,
        analysisProviderVersion: recommendation.analysisProviderVersion,
        product: toProductSnapshot(recommendation.productId),
        score: recommendation.score,
        reasonCodes: recommendation.reasonCodes,
        explanation: effectiveExplanation,
        machineExplanation: recommendation.explanation,
        sourceLabels: buildPublicSourceLabels(recommendation.sourceSignals),
        limitations: recommendation.limitations,
        fairnessStatus: fairness.status,
        fairnessPolicyVersion: fairness.policyVersion,
        protectedAttributesChecked: fairness.protectedAttributes,
        fairnessLimitations: fairness.limitations,
        status: recommendation.status,
        feedback: recommendation.feedback,
        consultantNote: recommendation.consultantNote,
        createdAt: recommendation.createdAt,
        updatedAt: recommendation.updatedAt,
    };
}

/**
 * Cria texto pesquisável do produto.
 *
 * @function buildProductSearchText
 * @param {object} product - Produto candidato.
 * @returns {string} Texto normalizado.
 */
function buildProductSearchText(product) {
    return normalizeSearchText(
        [
            product.name,
            product.description,
            ...(product.ingredientNames ?? []),
            ...(product.skinTypes ?? []),
        ].join(" "),
    );
}

/**
 * Extrai termos guiados permitidos para reforço de ranking.
 *
 * @function resolveGuidedKeywords
 * @param {{key?: string, label?: string, value?: string}} signal - Sinal seguro do histórico IA.
 * @returns {string[]} Termos normalizados para comparar com produto.
 */
function resolveGuidedKeywords(signal) {
    const sourceText = normalizeSearchText(
        [signal?.key, signal?.label, signal?.value].join(" "),
    );
    const keywords = new Set();

    for (const [intent, intentKeywords] of Object.entries(GUIDED_KEYWORDS)) {
        const normalizedIntent = normalizeSearchText(intent);
        const matchesIntent =
            sourceText.includes(normalizedIntent) ||
            intentKeywords.some((keyword) =>
                sourceText.includes(normalizeSearchText(keyword)),
            );

        if (matchesIntent) {
            keywords.add(normalizedIntent);
            intentKeywords.forEach((keyword) =>
                keywords.add(normalizeSearchText(keyword)),
            );
        }
    }

    sourceText
        .split(/[^a-z0-9]+/u)
        .filter((token) => token.length >= 4 && !GUIDED_STOP_WORDS.has(token))
        .forEach((token) => keywords.add(token));

    return [...keywords].filter(Boolean);
}

/**
 * Constrói um sinal público controlado para a avaliação guiada.
 *
 * @function buildGuidedSourceSignal
 * @param {{label?: string, value?: string}} signal - Sinal seguro do histórico IA.
 * @returns {string} Sinal técnico com prefixo público permitido.
 */
function buildGuidedSourceSignal(signal) {
    const rawValue = String(signal?.value ?? signal?.label ?? "resposta guiada")
        .replace(/[<>]/g, "")
        .slice(0, 60);

    return `guidedContext:${rawValue}`;
}

/**
 * Avalia compatibilidade cosmetica entre produto e analise.
 *
 * @function scoreProductForAnalysis
 * @param {object} product - Produto candidato.
 * @param {object} analysis - Analise facial concluida.
 * @returns {{score: number, reasonCodes: string[], sourceSignals: string[]}|null} Ranking ou null.
 */
function scoreProductForAnalysis(product, analysis) {
    const reasonCodes = [];
    const sourceSignals = [];
    let score = 0;
    const findings = analysis.findings;
    const productText = buildProductSearchText(product);
    const skinType = findings.skinType?.label;

    if (skinType && product.skinTypes.includes(skinType)) {
        score += 0.45;
        reasonCodes.push("skin_type_match");
        sourceSignals.push(`skinType:${skinType}`);
    }

    if (
        SIGNAL_LABELS.includes(findings.oleosidade?.label) &&
        (product.skinTypes.includes("oleosa") || product.skinTypes.includes("mista"))
    ) {
        score += 0.25;
        reasonCodes.push("oiliness_support");
        sourceSignals.push(`oleosidade:${findings.oleosidade.label}`);
    }

    if (SIGNAL_LABELS.includes(findings.acne?.label) && productText.includes("acne")) {
        score += 0.15;
        reasonCodes.push("acne_support");
        sourceSignals.push(`acne:${findings.acne.label}`);
    }

    if (SIGNAL_LABELS.includes(findings.manchas?.label) && productText.includes("mancha")) {
        score += 0.1;
        reasonCodes.push("spots_support");
        sourceSignals.push(`manchas:${findings.manchas.label}`);
    }

    if (SIGNAL_LABELS.includes(findings.rugas?.label) && productText.includes("ruga")) {
        score += 0.1;
        reasonCodes.push("wrinkles_support");
        sourceSignals.push(`rugas:${findings.rugas.label}`);
    }

    if (reasonCodes.length === 0) return null;

    return {
        score: Math.min(Number(score.toFixed(2)), 1),
        reasonCodes,
        sourceSignals,
    };
}

/**
 * Converte contexto guiado em reforço de ranking para um produto.
 *
 * @function scoreGuidedContextForProduct
 * @param {object} product - Produto candidato.
 * @param {{safeSignals?: {key: string, label: string, value: string}[]}[]} historyContext - Contexto seguro.
 * @returns {{scoreBoost: number, reasonCodes: string[], sourceSignals: string[]}} Reforço calculado.
 */
function scoreGuidedContextForProduct(product, historyContext) {
    const productText = buildProductSearchText(product);
    const sourceSignals = [];

    for (const historyItem of historyContext) {
        for (const signal of historyItem.safeSignals ?? []) {
            const keywords = resolveGuidedKeywords(signal);
            const matched = keywords.some((keyword) => productText.includes(keyword));

            if (matched) {
                // O reforço é pequeno para a sessão guiada complementar a análise, não a substituir.
                sourceSignals.push(buildGuidedSourceSignal(signal));
            }
        }
    }

    const uniqueSignals = [...new Set(sourceSignals)].slice(0, 4);

    return {
        scoreBoost: Math.min(
            uniqueSignals.length * GUIDED_CONTEXT_SIGNAL_BOOST,
            GUIDED_CONTEXT_MAX_BOOST,
        ),
        reasonCodes: uniqueSignals.length > 0 ? ["guided_context_match"] : [],
        sourceSignals: uniqueSignals,
    };
}

/**
 * Obtem a ultima analise concluida e relatorio correspondente.
 *
 * @async
 * @function getLatestAnalysisAndReport
 * @param {string} userId - Utilizador autenticado.
 * @returns {Promise<{analysis: object, report: object}>} Contrato de recomendacao.
 * @throws {AppError} Quando falta analise facial concluida ou relatorio associado.
 */
async function getLatestAnalysisAndReport(userId, { session, signal } = {}) {
    assertAbortSignalActive(signal, "Geração de recomendações cancelada.");
    let analysisQuery = FaceAnalysis.findOne({ userId, status: "completed" }).sort({
        createdAt: -1,
    });
    if (session) analysisQuery = analysisQuery.session(session);
    const analysis = await analysisQuery;
    assertAbortSignalActive(signal, "Geração de recomendações cancelada.");

    if (!analysis) {
        throw new AppError(400, "Análise facial concluída obrigatória");
    }

    let reportQuery = FaceReport.findOne({
        userId,
        analysisId: analysis._id,
        privacyStatus: { $nin: ["deleted", "anonymized"] },
    }).sort({ createdAt: -1 });
    if (session) reportQuery = reportQuery.session(session);
    const report = await reportQuery;
    assertAbortSignalActive(signal, "Geração de recomendações cancelada.");

    if (!report) {
        throw new AppError(400, "Relatório da análise mais recente obrigatório");
    }

    return { analysis, report };
}

/**
 * Obtém perfil cosmético obrigatório para recomendações.
 *
 * @async
 * @function getRecommendationProfile
 * @param {string} userId - Utilizador autenticado.
 * @returns {Promise<object>} Perfil do cliente.
 * @throws {AppError} Quando o perfil ainda não existe.
 */
async function getRecommendationProfile(userId, { session, signal } = {}) {
    assertAbortSignalActive(signal, "Geração de recomendações cancelada.");
    let profileQuery = Profile.findOne({ userId });
    if (session) profileQuery = profileQuery.session(session);
    const profile = await profileQuery;
    assertAbortSignalActive(signal, "Geração de recomendações cancelada.");

    if (!profile) {
        throw new AppError(400, "Perfil cosmético obrigatório");
    }

    return profile;
}

/**
 * Carrega contexto seguro da última sessão guiada submetida pelo próprio cliente.
 *
 * @async
 * @function getGuidedContextForRecommendations
 * @param {string} userId - Utilizador autenticado.
 * @param {{historyLimit?: number}} options - Opções sem IDs técnicos.
 * @returns {Promise<{consultationSessionId: string|null, historyContext: object[]}>} Sessão resolvida e contexto seguro.
 * @throws {AppError} Quando uma sessão submetida não tem histórico durável.
 */
async function getGuidedContextForRecommendations(userId, options) {
    assertAbortSignalActive(
        options.signal,
        "Geração de recomendações cancelada.",
    );
    let consultationQuery = AiConsultationSession.findOne({
        userId,
        status: AI_CONSULTATION_STATUS.SUBMITTED,
    })
        .sort({ submittedAt: -1, updatedAt: -1 })
        .select("_id");
    if (options.session) consultationQuery = consultationQuery.session(options.session);
    const consultationSession = await consultationQuery;
    assertAbortSignalActive(
        options.signal,
        "Geração de recomendações cancelada.",
    );

    if (!consultationSession) {
        return { consultationSessionId: null, historyContext: [] };
    }

    const consultationSessionId = consultationSession._id.toString();

    const historyContext = await listRecommendationHistoryContext(userId, {
        sessionId: consultationSessionId,
        limit: options.historyLimit,
        session: options.session,
    });
    assertAbortSignalActive(
        options.signal,
        "Geração de recomendações cancelada.",
    );

    if (historyContext.length === 0) {
        // Erro controlado: o ID pode não existir ou pode pertencer a outro utilizador.
        throw new AppError(404, "Sessão guiada sem histórico acessível");
    }

    return { consultationSessionId, historyContext };
}

/**
 * Gera recomendacoes personalizadas do utilizador autenticado.
 *
 * @async
 * @function generateRecommendationsForUser
 * @param {string} userId - Utilizador autenticado.
 * @param {{historyLimit?: number, allowLockedReport?: boolean, session?: import("mongoose").ClientSession|null, signal?: AbortSignal}} [options={}] - Contexto guiado, transação externa e cancelamento.
 * @returns {Promise<object[]|{recommendations: object[], access: object}>} Recomendacoes geradas ou gate bloqueado.
 * @throws {AppError} Quando ainda falta base cosmetica para gerar recomendacoes.
 */
export async function generateRecommendationsForUser(userId, options = {}) {
    assertAbortSignalActive(options.signal, "Geração de recomendações cancelada.");
    const { analysis, report } = await getLatestAnalysisAndReport(userId, options);
    if (!options.allowLockedReport) {
        const accessResult = await assertLatestReportUnlockedForRecommendations(
            userId,
            report,
        );

        if (accessResult.locked) {
            return accessResult;
        }
    }

    const profile = await getRecommendationProfile(userId, options);
    const { consultationSessionId, historyContext } = await getGuidedContextForRecommendations(
        userId,
        options,
    );
    const fairnessSafeRankingInputs = buildFairnessSafeRankingInputs({
        profile,
        historyContext,
    });

    let productsQuery = Product.find({ stock: { $gt: 0 } })
        .select(PRODUCT_SELECT)
        .limit(60);
    if (options.session) productsQuery = productsQuery.session(options.session);
    const products = await productsQuery;
    assertAbortSignalActive(options.signal, "Geração de recomendações cancelada.");
    const allowedProducts = filterProductsBlockedByProfile(
        products,
        fairnessSafeRankingInputs.restrictionProfile,
    );

    const rankedProducts = allowedProducts
        .map((product) => {
            const baseRanking = scoreProductForAnalysis(product, analysis);
            if (!baseRanking) return null;

            const guidedRanking = scoreGuidedContextForProduct(
                product,
                fairnessSafeRankingInputs.historyContext,
            );

            return {
                product,
                score: Math.min(
                    Number(
                        (baseRanking.score + guidedRanking.scoreBoost).toFixed(2),
                    ),
                    1,
                ),
                reasonCodes: [
                    ...baseRanking.reasonCodes,
                    ...guidedRanking.reasonCodes,
                ],
                sourceSignals: [
                    ...baseRanking.sourceSignals,
                    "report:relatorio_cosmetico",
                    ...guidedRanking.sourceSignals,
                ],
                usedGuidedContext: guidedRanking.sourceSignals.length > 0,
            };
        })
        .filter(Boolean)
        .sort((a, b) => b.score - a.score)
        .slice(0, 5);

    if (rankedProducts.length < 3) {
        throw new AppError(404, "Catálogo sem produtos compatíveis suficientes");
    }

    const databaseSession =
        options.session ??
        (mongoose.connection.readyState === 1 ? await mongoose.startSession() : null);
    const ownsDatabaseSession = Boolean(databaseSession && !options.session);
    let recommendations = [];

    const persistRecommendationsAndReview = async () => {
        assertAbortSignalActive(
            options.signal,
            "Geração de recomendações cancelada.",
        );
        const persistedRecommendations = [];

        // Operações paralelas dentro da mesma ClientSession não são suportadas pelo
        // driver. A sequência mantém uma única fronteira transacional previsível.
        for (const {
                product,
                score,
                reasonCodes,
                sourceSignals,
                usedGuidedContext,
            } of rankedProducts) {
            assertAbortSignalActive(
                options.signal,
                "Geração de recomendações cancelada.",
            );
            const reason = buildRecommendationReason({
                reasonCodes,
                sourceSignals,
                product,
                profile,
            });
            const limitations = [
                ...new Set([
                    ...reason.limitations,
                    ...(report.limitations ?? []),
                    usedGuidedContext
                        ? "Respostas guiadas ajustaram a prioridade, mas não compram produtos pelo cliente."
                        : "Sem sessão guiada válida, a recomendação usa análise, relatório, perfil e catálogo.",
                ]),
            ];

            assertRecommendationFairness({
                reasonCodes: reason.reasonCodes,
                sourceSignals: reason.sourceSignals,
                explanation: reason.explanation,
                limitations,
            });

            const recommendation = await ProductRecommendation.findOneAndUpdate(
                {
                    userId,
                    analysisId: analysis._id,
                    productId: product._id,
                },
                {
                    $set: {
                        schemaVersion: 1,
                        reportId: report._id,
                        analysisMode: analysis.mode,
                        analysisIsDemo: analysis.isDemo,
                        analysisProviderVersion: analysis.providerVersion,
                        score,
                        reasonCodes: reason.reasonCodes,
                        explanation: reason.explanation,
                        sourceSignals: reason.sourceSignals,
                        limitations,
                        machineResult: {
                            score,
                            reasonCodes: reason.reasonCodes,
                            explanation: reason.explanation,
                            sourceSignals: reason.sourceSignals,
                            limitations,
                            generatedAt: new Date(),
                            version: "recommendation-engine-v2",
                        },
                    },
                    $setOnInsert: {
                        status: "active",
                        feedback: null,
                        consultantNote: null,
                        humanOverride: null,
                    },
                },
                {
                    upsert: true,
                    new: true,
                    runValidators: true,
                    ...(databaseSession ? { session: databaseSession } : {}),
                },
            ).populate("productId", PRODUCT_SELECT);
            assertAbortSignalActive(
                options.signal,
                "Geração de recomendações cancelada.",
            );

            persistedRecommendations.push(recommendation);
        }

        assertAbortSignalActive(
            options.signal,
            "Geração de recomendações cancelada.",
        );
        // Última barreira antes do commit da transação própria ou do retorno à
        // transação externa usada pela geração do FaceReport.
        assertAbortSignalActive(
            options.signal,
            "Geração de recomendações cancelada.",
        );
        recommendations = persistedRecommendations;
    };

    try {
        if (ownsDatabaseSession) {
            await databaseSession.withTransaction(persistRecommendationsAndReview);
        } else {
            await persistRecommendationsAndReview();
        }
    } finally {
        if (ownsDatabaseSession) await databaseSession.endSession();
    }

    assertAbortSignalActive(options.signal, "Geração de recomendações cancelada.");
    return recommendations.map(toRecommendationDto);
}

/**
 * Lista recomendacoes do proprio utilizador.
 *
 * @async
 * @function listRecommendationsForUser
 * @param {string} userId - Utilizador autenticado.
 * @returns {Promise<object[]|{recommendations: object[], access: object}>} Recomendacoes publicas ou gate bloqueado.
 */
export async function listRecommendationsForUser(userId) {
    const recommendations = await ProductRecommendation.find({ userId })
        .sort({ createdAt: -1 })
        .limit(30)
        .populate("productId", PRODUCT_SELECT);

    if (recommendations.length > 0) {
        const accessResult = await assertLatestReportUnlockedForRecommendations(
            userId,
            { _id: recommendations[0].reportId },
        );

        if (accessResult.locked) {
            return accessResult;
        }
    }

    const reportIds = [
        ...new Set(
            recommendations
                .map(({ reportId }) => reportId?.toString?.())
                .filter(Boolean),
        ),
    ];
    const unlockedReports = await ReportUnlock.find({
        userId,
        reportId: { $in: reportIds },
        status: REPORT_UNLOCK_STATUS.UNLOCKED,
    })
        .select("reportId")
        .lean();
    const unlockedReportIds = new Set(
        unlockedReports.map(({ reportId }) => reportId.toString()),
    );

    return recommendations
        .filter(({ reportId }) =>
            unlockedReportIds.has(reportId?.toString?.()),
        )
        .map(toRecommendationDto);
}

/**
 * Regista feedback do cliente numa recomendacao.
 *
 * @async
 * @function submitRecommendationFeedback
 * @param {string} userId - Utilizador autenticado.
 * @param {{recommendationId: string, feedback: "util"|"nao_relevante"}} input - Feedback validado.
 * @returns {Promise<object>} Recomendacao atualizada.
 * @throws {AppError} Quando a recomendacao nao pertence ao utilizador.
 */
export async function submitRecommendationFeedback(userId, input) {
    const existingRecommendation = await ProductRecommendation.findById(
        input.recommendationId,
    );

    if (
        !existingRecommendation ||
        existingRecommendation.userId.toString() !== String(userId)
    ) {
        throw new AppError(404, "Recomendação não encontrada");
    }

    const accessResult = await assertLatestReportUnlockedForRecommendations(
        userId,
        { _id: existingRecommendation.reportId },
    );

    if (accessResult.locked) {
        throw new AppError(423, "Relatório bloqueado por pagamento académico simulado");
    }

    const nextStatus = input.feedback === "util" ? "accepted" : "dismissed";
    const recommendation = await ProductRecommendation.findOneAndUpdate(
        { _id: input.recommendationId, userId },
        {
            $set: {
                status: nextStatus,
                feedback: {
                    value: input.feedback,
                    submittedAt: new Date(),
                },
            },
        },
        { new: true, runValidators: true },
    ).populate("productId", PRODUCT_SELECT);

    if (!recommendation) {
        throw new AppError(404, "Recomendação não encontrada");
    }

    return toRecommendationDto(recommendation);
}
