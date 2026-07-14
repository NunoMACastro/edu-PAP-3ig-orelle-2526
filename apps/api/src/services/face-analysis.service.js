/**
 * Service de analise facial cosmética.
 */
import { createHash } from "node:crypto";
import mongoose from "mongoose";
import { isTransactionalMongoReady } from "../config/db.js";
import { env } from "../config/env.js";
import { AppError } from "../middlewares/error.middleware.js";
import {
    FACE_ANALYSIS_CONSENT_PURPOSE,
    FACE_IMAGE_PURPOSE_POLICY,
} from "../constants/face-consent.js";
import { FaceAnalysis } from "../models/face-analysis.model.js";
import { FaceConsent } from "../models/face-consent.model.js";
import { FacePhoto } from "../models/face-photo.model.js";
import { analyzeSkinPhotos } from "../providers/skin-analysis.provider.js";
import {
    assertPerformanceBudgetActive,
    FACE_ANALYSIS_BUDGET_MS,
    FACE_ANALYSIS_OPERATION,
    runWithPerformanceBudget,
} from "./performance-budget.service.js";
import { readEncryptedFacePhotoFile } from "./face-secure-storage.service.js";
import { assertFaceConsentAllowsConfiguredProvider } from "./face-photo.service.js";
import { claimFaceDataWrite } from "./face-data-write-barrier.service.js";
import { assertAbortSignalActive } from "../utils/abort-signal.util.js";

export { FACE_ANALYSIS_BUDGET_MS };

/**
 * Encontra a fotografia ativa mais recente de um tipo.
 *
 * @function latestByKind
 * @param {object[]} photos - Fotografias ordenadas por data descrescente.
 * @param {"frontal"|"perfil"} kind - Tipo pretendido.
 * @returns {object|undefined} Fotografia mais recente.
 */
function latestByKind(photos, kind) {
    return photos.find((photo) => photo.kind === kind);
}

/**
 * Converte analise para resposta segura.
 *
 * @function toFaceAnalysisResponse
 * @param {object} analysis - Documento Mongoose ou mock equivalente.
 * @returns {{id: string, mode: string, isDemo: boolean, providerName: string, providerVersion: string, findings: object, sources: string[], limitations: string[], performance: object|undefined, status: string, createdAt: Date|undefined, imageUse: object}} Analise publica.
 */
function toFaceAnalysisResponse(analysis) {
    return {
        id: analysis._id.toString(),
        mode: analysis.mode,
        isDemo: analysis.isDemo,
        providerName: analysis.providerName,
        providerVersion: analysis.providerVersion,
        findings: analysis.findings,
        photoQuality: analysis.photoQuality,
        sources: analysis.sources,
        limitations: analysis.limitations,
        safetyFlags: analysis.safetyFlags ?? [],
        performance: analysis.performance,
        status: analysis.status,
        provenance: analysis.provenance,
        createdAt: analysis.createdAt,
        imageUse: { ...FACE_IMAGE_PURPOSE_POLICY },
    };
}

/**
 * Prepara uma fotografia cifrada para provider interno ou externo.
 *
 * @async
 * @function preparePhotoForProvider
 * @param {object} photo - Documento `FacePhoto` com `storageKey` e `encryption` selecionados.
 * @param {AbortSignal|undefined} signal - Cancelamento cooperativo.
 * @returns {Promise<{storageKey: string, mimeType: string, sizeBytes: number, imageBase64: string}>} Entrada temporária para provider.
 */
async function preparePhotoForProvider(photo, signal) {
    assertAbortSignalActive(signal, "Análise facial cancelada.");
    const imageBuffer = await readEncryptedFacePhotoFile(photo, { signal });
    assertAbortSignalActive(signal, "Análise facial cancelada.");

    return {
        storageKey: photo.storageKey,
        mimeType: photo.mimeType,
        sizeBytes: photo.sizeBytes,
        // A imagem fica em memória apenas durante a chamada ao provider e nunca é devolvida ao frontend.
        imageBase64: imageBuffer.toString("base64"),
    };
}

/** Fingerprint opaco e determinístico; não contém respostas ou bytes. */
export function buildFaceAnalysisInputFingerprint({
    consultationSessionId,
    consentId,
    photoIds,
    objectives,
}) {
    return createHash("sha256")
        .update(String(consultationSessionId ?? "legacy"))
        .update("\0")
        .update(String(consentId))
        .update("\0")
        .update([...photoIds].map(String).sort().join(","))
        .update("\0")
        .update([...objectives].map(String).sort().join(","))
        .digest("hex");
}

/**
 * Cria uma sessão apenas quando existe uma ligação real com garantias
 * transacionais. Testes unitários isolados continuam a poder usar mocks sem
 * MongoDB; um runtime ligado a standalone falha fechado.
 *
 * @returns {Promise<import("mongoose").ClientSession|null>} Sessão ou null em teste isolado.
 */
async function createFaceAnalysisSession() {
    if (mongoose.connection.readyState !== 1) return null;
    if (!isTransactionalMongoReady()) {
        throw new AppError(
            503,
            "Análise facial requer MongoDB com suporte transacional",
        );
    }
    return mongoose.startSession();
}

/**
 * Persiste a análise sob a mesma barreira transacional usada por revogação,
 * privacidade e eliminação de conta. O consentimento é relido imediatamente
 * antes do insert e o sinal é verificado depois do write, ainda antes do
 * callback transacional poder confirmar o commit.
 *
 * @param {object} input - Dados da persistência.
 * @param {string} input.userId - Titular autenticado.
 * @param {object} input.analysisPayload - Resultado validado do provider.
 * @param {AbortSignal|undefined} input.signal - Cancelamento composto.
 * @param {Function|undefined} input.afterPersist - Hook interno para testes de rollback.
 * @returns {Promise<object>} Documento confirmado.
 */
export async function persistFaceAnalysisAtomically({
    userId,
    analysisPayload,
    signal,
    afterPersist,
}) {
    assertAbortSignalActive(signal, "Análise facial cancelada.");
    const session = await createFaceAnalysisSession();

    const persist = async (activeSession) => {
        assertAbortSignalActive(signal, "Análise facial cancelada.");
        let consentId = analysisPayload.consentId;

        if (activeSession) {
            await claimFaceDataWrite(userId, activeSession);
            assertAbortSignalActive(signal, "Análise facial cancelada.");
            const activeConsent = await FaceConsent.findOne({
                userId,
                purpose: FACE_ANALYSIS_CONSENT_PURPOSE,
                revokedAt: null,
            }).session(activeSession);

            if (!activeConsent) {
                throw new AppError(403, "Consentimento facial em falta");
            }
            assertFaceConsentAllowsConfiguredProvider(activeConsent);
            const activePhotos = await FacePhoto.find({
                _id: { $in: analysisPayload.photoIds },
                userId,
                status: "active",
            }).session(activeSession);
            const activeKinds = new Set(
                activePhotos.map((photo) => photo.kind),
            );
            if (
                activePhotos.length !== 2 ||
                activeKinds.size !== 2 ||
                !activeKinds.has("frontal") ||
                !activeKinds.has("perfil")
            ) {
                throw new AppError(
                    409,
                    "As fotografias usadas na análise já foram substituídas.",
                );
            }
            consentId = activeConsent._id;
            assertAbortSignalActive(signal, "Análise facial cancelada.");
        }

        const payload = { ...analysisPayload, consentId };
        const createdAnalysis = activeSession
            ? (await FaceAnalysis.create([payload], { session: activeSession }))[0]
            : await FaceAnalysis.create(payload);

        if (afterPersist) {
            await afterPersist({ analysis: createdAnalysis, session: activeSession });
        }
        assertAbortSignalActive(signal, "Análise facial cancelada.");
        return createdAnalysis;
    };

    if (!session) return persist(null);

    try {
        let createdAnalysis;
        await session.withTransaction(async () => {
            createdAnalysis = await persist(session);
            assertAbortSignalActive(signal, "Análise facial cancelada.");
        });
        return createdAnalysis;
    } finally {
        await session.endSession();
    }
}

/**
 * Cria uma analise para o utilizador autenticado.
 *
 * @async
 * @function createFaceAnalysisForUser
 * @param {string} userId - Utilizador autenticado.
 * @param {{signal?: AbortSignal, afterPersist?: Function}} [options] - Cancelamento e hook transacional interno de teste.
 * @returns {Promise<object>} Analise criada.
 */
export async function createFaceAnalysisForUser(
    userId,
    {
        signal: requestSignal,
        afterPersist,
        objectives = [],
        expectedPhotoIds = null,
        providerOptions,
        consultationSessionId = null,
        budgetMs: configuredBudgetMs = env.openAiAnalysisTimeoutMs,
    } = {},
) {
    const { value: analysis, durationMs, budgetMs } =
        await runWithPerformanceBudget({
            operation: FACE_ANALYSIS_OPERATION,
            budgetMs: configuredBudgetMs,
            signal: requestSignal,
            task: async ({ signal }) => {
                assertAbortSignalActive(signal, "Análise facial cancelada.");
                const consent = await FaceConsent.findOne({
                    userId,
                    purpose: FACE_ANALYSIS_CONSENT_PURPOSE,
                    revokedAt: null,
                });

                if (!consent) {
                    throw new AppError(403, "Consentimento facial em falta");
                }
                assertAbortSignalActive(signal, "Análise facial cancelada.");

                assertFaceConsentAllowsConfiguredProvider(consent);

                const photos = await FacePhoto.find({
                    userId,
                    status: "active",
                })
                    .sort({ createdAt: -1 })
                    .select("+storageKey +encryption +encryption.iv +encryption.authTag");
                assertAbortSignalActive(signal, "Análise facial cancelada.");

                const frontalPhoto = latestByKind(photos, "frontal");
                const perfilPhoto = latestByKind(photos, "perfil");

                if (!frontalPhoto || !perfilPhoto) {
                    throw new AppError(
                        400,
                        "Fotografias frontal e de perfil obrigatórias",
                    );
                }

                if (Array.isArray(expectedPhotoIds)) {
                    const expected = new Set(expectedPhotoIds.map(String));
                    const actual = new Set(
                        [frontalPhoto._id, perfilPhoto._id].map(String),
                    );
                    if (
                        expected.size !== 2 ||
                        actual.size !== 2 ||
                        [...expected].some((id) => !actual.has(id))
                    ) {
                        throw new AppError(
                            409,
                            "As fotografias da consulta foram substituídas.",
                        );
                    }
                }

                const photoIds = [frontalPhoto._id, perfilPhoto._id];
                const inputFingerprint = buildFaceAnalysisInputFingerprint({
                    consultationSessionId,
                    consentId: consent._id,
                    photoIds,
                    objectives,
                });
                const existingAnalysis = await FaceAnalysis.findOne({
                    userId,
                    schemaVersion: 2,
                    inputFingerprint,
                    status: { $in: ["completed", "inconclusive"] },
                }).select("+inputFingerprint");
                if (existingAnalysis) {
                    return toFaceAnalysisResponse(existingAnalysis);
                }

                const result = await analyzeSkinPhotos({
                    frontalPhoto: await preparePhotoForProvider(frontalPhoto, signal),
                    perfilPhoto: await preparePhotoForProvider(perfilPhoto, signal),
                    requestedPurpose: FACE_ANALYSIS_CONSENT_PURPOSE,
                    allowModelLearning: false,
                    objectives,
                    signal,
                }, providerOptions);

                assertPerformanceBudgetActive(signal);

                let createdAnalysis;
                try {
                    createdAnalysis = await persistFaceAnalysisAtomically({
                        userId,
                        signal,
                        afterPersist,
                        analysisPayload: {
                        schemaVersion: 2,
                        userId,
                        photoIds,
                        consentId: consent._id,
                        consultationSessionId,
                        inputFingerprint,
                        mode: result.mode,
                        isDemo: result.isDemo,
                        providerName: result.providerName,
                        providerVersion: result.providerVersion,
                        findings: result.findings,
                        photoQuality: result.photoQuality,
                        sources: result.sources,
                        limitations: result.limitations,
                        safetyFlags: result.safetyFlags ?? [],
                        provenance: result.provenance,
                        status:
                            result.photoQuality?.status === "inconclusive"
                                ? "inconclusive"
                                : "completed",
                        },
                    });
                } catch (error) {
                    if (error?.code !== 11000) throw error;
                    createdAnalysis = await FaceAnalysis.findOne({
                        userId,
                        schemaVersion: 2,
                        inputFingerprint,
                        status: { $in: ["completed", "inconclusive"] },
                    }).select("+inputFingerprint");
                    if (!createdAnalysis) throw error;
                }

                assertPerformanceBudgetActive(signal);

                return toFaceAnalysisResponse(createdAnalysis);
            },
        });

    return {
        ...analysis,
        performance: {
            durationMs,
            budgetMs,
        },
    };
}
