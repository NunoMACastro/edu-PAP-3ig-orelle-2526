/**
 * Adapter HTTP único do novo fluxo de consulta cosmética.
 *
 * Todos os pedidos permanecem same-origin através de `apiClient`; cookies,
 * CSRF, timeout e erros públicos continuam centralizados nesse cliente.
 */
import {
    apiDownload,
    apiRequest,
    FILE_REQUEST_TIMEOUT_MS,
} from "../../services/apiClient.js";
import {
    isRecord,
    normalizeGoalsPayload,
    normalizeSession,
    pickEnvelopeValue,
    unwrapApiEnvelope,
} from "./consultationModel.js";

/** Preserva opções de cancelamento sem permitir que callers mudem o método. */
function requestOptions(signal, options = {}) {
    return signal ? { ...options, signal } : options;
}

/** Normaliza um objeto de capacidades sem promover indisponibilidade a sucesso. */
export function normalizeCapabilities(payload) {
    const value = pickEnvelopeValue(payload, ["capabilities", "ai"]);
    if (!isRecord(value)) return { available: false };

    return {
        ...value,
        available:
            value.available === true ||
            value.configured === true ||
            value.status === "available",
    };
}

/** Normaliza respostas de relatório mantendo o teaser separado do conteúdo. */
export function normalizeReport(payload) {
    const value = pickEnvelopeValue(payload, ["report", "faceReport"]);
    if (!isRecord(value)) return null;

    return {
        ...value,
        id: String(value.id ?? value.reportId ?? value._id ?? ""),
        teaser: isRecord(value.teaser)
            ? value.teaser
            : value.locked === true
              ? value
              : {},
    };
}

/** Normaliza uma coleção em envelopes `items`, `history` ou `reviews`. */
export function normalizeCollection(payload, keys) {
    const value = pickEnvelopeValue(payload, keys);
    return Array.isArray(value) ? value : [];
}

export async function getConsultationCapabilities({ signal } = {}) {
    const payload = await apiRequest(
        "/ai-consultation/capabilities",
        requestOptions(signal),
    );
    return normalizeCapabilities(payload);
}

export async function getConsultationGoals({ signal } = {}) {
    const payload = await apiRequest(
        "/ai-consultation/goals",
        requestOptions(signal),
    );
    return normalizeGoalsPayload(payload);
}

export async function createConsultationSession(selection, { signal } = {}) {
    const payload = await apiRequest(
        "/ai-consultation/sessions",
        requestOptions(signal, {
            method: "POST",
            body: JSON.stringify(selection),
        }),
    );
    return normalizeSession(payload);
}

export async function getCurrentConsultationSession({ signal } = {}) {
    const payload = await apiRequest(
        "/ai-consultation/sessions/current",
        requestOptions(signal),
    );
    return normalizeSession(payload);
}

export async function getConsultationSession(sessionId, { signal } = {}) {
    const payload = await apiRequest(
        `/ai-consultation/sessions/${encodeURIComponent(sessionId)}`,
        requestOptions(signal),
    );
    return normalizeSession(payload);
}

export async function startConsultationAnalysis(
    sessionId,
    { acknowledgePhotoWarnings = false } = {},
    { signal } = {},
) {
    const payload = await apiRequest(
        `/ai-consultation/sessions/${encodeURIComponent(sessionId)}/analysis`,
        requestOptions(signal, {
            method: "POST",
            body: JSON.stringify({ acknowledgePhotoWarnings }),
        }),
    );
    return normalizeSession(payload);
}

export async function answerConsultationQuestion(
    sessionId,
    answer,
    { signal } = {},
) {
    const payload = await apiRequest(
        `/ai-consultation/sessions/${encodeURIComponent(sessionId)}/answers`,
        requestOptions(signal, {
            method: "POST",
            body: JSON.stringify(answer),
        }),
    );
    return normalizeSession(payload);
}

/** Edita uma resposta existente sem alterar o restante plano da consulta. */
export async function editConsultationAnswer(
    sessionId,
    slotCode,
    answer,
    { signal } = {},
) {
    const payload = await apiRequest(
        `/ai-consultation/sessions/${encodeURIComponent(sessionId)}/answers/${encodeURIComponent(slotCode)}`,
        requestOptions(signal, {
            method: "PATCH",
            body: JSON.stringify(answer),
        }),
    );
    return normalizeSession(payload);
}

export async function submitConsultationSession(sessionId, { signal } = {}) {
    const payload = await apiRequest(
        `/ai-consultation/sessions/${encodeURIComponent(sessionId)}/submit`,
        requestOptions(signal, { method: "POST" }),
    );
    return normalizeSession(payload);
}

export async function retryConsultationSession(sessionId, { signal } = {}) {
    const payload = await apiRequest(
        `/ai-consultation/sessions/${encodeURIComponent(sessionId)}/retry`,
        requestOptions(signal, { method: "POST" }),
    );
    return normalizeSession(payload);
}

export async function cancelConsultationSession(sessionId, { signal } = {}) {
    const payload = await apiRequest(
        `/ai-consultation/sessions/${encodeURIComponent(sessionId)}`,
        requestOptions(signal, { method: "DELETE" }),
    );
    return normalizeSession(payload);
}

export async function getFaceConsent({ signal } = {}) {
    const payload = await apiRequest("/face-consent", requestOptions(signal));
    const value = unwrapApiEnvelope(payload);
    return isRecord(value) ? value : { consent: null };
}

export async function acceptFaceConsent(input, { signal } = {}) {
    const payload = await apiRequest(
        "/face-consent",
        requestOptions(signal, {
            method: "POST",
            body: JSON.stringify(input),
        }),
    );
    return pickEnvelopeValue(payload, ["consent"]);
}

export async function uploadFacePhotos(files, { signal } = {}) {
    const formData = new FormData();
    formData.append("frontal", files.frontal);
    formData.append("perfil", files.perfil);
    const payload = await apiRequest(
        "/face-photos",
        requestOptions(signal, {
            method: "POST",
            body: formData,
            timeoutMs: FILE_REQUEST_TIMEOUT_MS,
        }),
    );
    return normalizeCollection(payload, ["photos", "items"]);
}

/**
 * Descarrega temporariamente uma fotografia da análise do próprio titular.
 *
 * O endpoint nunca expõe paths privados; o caller deve criar e revogar o
 * respetivo object URL enquanto a pré-visualização estiver montada.
 */
export async function downloadOwnedConsultationPhoto(
    analysisId,
    kind,
    { signal } = {},
) {
    const normalizedKind = kind === "perfil" ? "perfil" : "frontal";
    const response = await apiDownload(
        `/me/skin-analyses/${encodeURIComponent(analysisId)}/image/${normalizedKind}`,
        requestOptions(signal),
    );
    return response.blob;
}

export async function getConsultationReport(reportId, { signal } = {}) {
    const payload = await apiRequest(
        `/face-reports/${encodeURIComponent(reportId)}`,
        requestOptions(signal),
    );
    return normalizeReport(payload);
}

export async function finalizeConsultationReport(reportId, { signal } = {}) {
    const payload = await apiRequest(
        `/face-reports/${encodeURIComponent(reportId)}/finalize`,
        requestOptions(signal, { method: "POST" }),
    );
    return normalizeReport(payload);
}

export async function requestConsultationReportReview(
    reportId,
    reviewInput,
    { signal } = {},
) {
    const payload = await apiRequest(
        `/face-reports/${encodeURIComponent(reportId)}/review-request`,
        requestOptions(signal, {
            method: "POST",
            body: JSON.stringify(reviewInput),
        }),
    );
    const report = await getConsultationReport(reportId, { signal });
    const review = pickEnvelopeValue(payload, ["review"]);
    return isRecord(review)
        ? {
              ...report,
              review: {
                  ...(isRecord(report?.review) ? report.review : {}),
                  ...review,
              },
          }
        : report;
}

export async function revokeConsultationReviewPhotoAccess(
    reportId,
    { signal } = {},
) {
    await apiRequest(
        `/face-reports/${encodeURIComponent(reportId)}/review-photo-access`,
        requestOptions(signal, { method: "DELETE" }),
    );
    const report = await getConsultationReport(reportId, { signal });
    return {
        ...report,
        review: {
            ...(isRecord(report?.review) ? report.review : {}),
            photoAccess: { granted: false },
        },
    };
}

export async function withdrawConsultationReportReview(reportId, { signal } = {}) {
    await apiRequest(
        `/face-reports/${encodeURIComponent(reportId)}/review-request`,
        requestOptions(signal, { method: "DELETE" }),
    );
    return getConsultationReport(reportId, { signal });
}

export async function unlockConsultationReport(
    reportId,
    idempotencyKey,
    { signal } = {},
) {
    const payload = await apiRequest(
        `/face-reports/${encodeURIComponent(reportId)}/unlock/simulate-payment`,
        requestOptions(signal, {
            method: "POST",
            headers: { "Idempotency-Key": idempotencyKey },
        }),
    );
    const value = unwrapApiEnvelope(payload);
    return {
        report: normalizeReport(payload),
        voucher: isRecord(value) ? value.voucher ?? null : null,
    };
}

export async function createMakeupSimulation(
    reportId,
    consentInput,
    { signal } = {},
) {
    const payload = await apiRequest(
        `/face-reports/${encodeURIComponent(reportId)}/makeup-simulations`,
        requestOptions(signal, {
            method: "POST",
            body: JSON.stringify(consentInput),
        }),
    );
    return pickEnvelopeValue(payload, ["simulation", "makeupSimulation", "job"]);
}

export async function revokeMakeupSimulationConsent(
    simulationId,
    { signal } = {},
) {
    const payload = await apiRequest(
        `/makeup-simulations/${encodeURIComponent(simulationId)}/consent`,
        requestOptions(signal, { method: "DELETE" }),
    );
    return pickEnvelopeValue(payload, ["consent"]);
}

export async function getMakeupSimulation(simulationId, { signal } = {}) {
    const payload = await apiRequest(
        `/makeup-simulations/${encodeURIComponent(simulationId)}`,
        requestOptions(signal),
    );
    return pickEnvelopeValue(payload, ["simulation"]);
}

export async function downloadMakeupSimulationImage(
    simulationId,
    { signal } = {},
) {
    const response = await apiDownload(
        `/makeup-simulations/${encodeURIComponent(simulationId)}/image`,
        requestOptions(signal),
    );
    return response.blob;
}

export async function createCosmeticVisualization(
    reportId,
    input,
    { signal } = {},
) {
    const payload = await apiRequest(
        `/face-reports/${encodeURIComponent(reportId)}/cosmetic-visualizations`,
        requestOptions(signal, {
            method: "POST",
            body: JSON.stringify(input),
        }),
    );
    return pickEnvelopeValue(payload, ["visualization"]);
}

export async function getCosmeticVisualization(visualizationId, { signal } = {}) {
    const payload = await apiRequest(
        `/cosmetic-visualizations/${encodeURIComponent(visualizationId)}`,
        requestOptions(signal),
    );
    return pickEnvelopeValue(payload, ["visualization"]);
}

export async function revokeCosmeticVisualizationConsent(
    visualizationId,
    { signal } = {},
) {
    const payload = await apiRequest(
        `/cosmetic-visualizations/${encodeURIComponent(visualizationId)}/consent`,
        requestOptions(signal, { method: "DELETE" }),
    );
    return pickEnvelopeValue(payload, ["consent"]);
}

export async function downloadCosmeticVisualizationImage(
    visualizationId,
    { signal } = {},
) {
    const response = await apiDownload(
        `/cosmetic-visualizations/${encodeURIComponent(visualizationId)}/image`,
        requestOptions(signal),
    );
    return response.blob;
}

export async function submitCosmeticVisualizationFeedback(
    visualizationId,
    feedback,
    { signal } = {},
) {
    const payload = await apiRequest(
        `/cosmetic-visualizations/${encodeURIComponent(visualizationId)}/feedback`,
        requestOptions(signal, {
            method: "PUT",
            body: JSON.stringify(feedback),
        }),
    );
    return pickEnvelopeValue(payload, ["visualization"]);
}

export async function submitConsultationRecommendationFeedback(
    recommendationId,
    value,
    { signal } = {},
) {
    const payload = await apiRequest(
        `/recommendations/${encodeURIComponent(recommendationId)}/feedback`,
        requestOptions(signal, {
            method: "POST",
            body: JSON.stringify({ value }),
        }),
    );
    return pickEnvelopeValue(payload, ["recommendation"]);
}

/**
 * Descarrega uma imagem autenticada anunciada pela própria API sem aceitar
 * origens externas nem duplicar o prefixo `/api` do cliente same-origin.
 */
export async function downloadAuthenticatedReportImage(
    imageUrl,
    { signal } = {},
) {
    const value = String(imageUrl ?? "").trim();
    if (!value.startsWith("/api/")) {
        throw new Error("A referência da imagem do relatório é inválida.");
    }
    const response = await apiDownload(
        value.slice("/api".length),
        requestOptions(signal),
    );
    return response.blob;
}

export async function listConsultationHistory({ signal } = {}) {
    const payload = await apiRequest(
        "/ai-consultation/sessions?limit=20",
        requestOptions(signal),
    );
    return normalizeCollection(payload, ["items", "sessions"]);
}

export async function listConsultationReviews({ signal } = {}) {
    const payload = await apiRequest(
        "/consultant/ai-consultation-reviews",
        requestOptions(signal),
    );
    return normalizeCollection(payload, ["reviews", "items"]);
}

export async function getConsultationReview(reviewId, { signal } = {}) {
    const payload = await apiRequest(
        `/consultant/ai-consultation-reviews/${encodeURIComponent(reviewId)}`,
        requestOptions(signal),
    );
    const value = pickEnvelopeValue(payload, ["review"]);
    return isRecord(value) ? value : null;
}

export async function decideConsultationReview(
    reviewId,
    decisionInput,
    { signal } = {},
) {
    const payload = await apiRequest(
        `/consultant/ai-consultation-reviews/${encodeURIComponent(reviewId)}/decision`,
        requestOptions(signal, {
            method: "POST",
            body: JSON.stringify(decisionInput),
        }),
    );
    const value = pickEnvelopeValue(payload, ["review"]);
    return isRecord(value) ? value : null;
}

export async function downloadConsultationReviewPhoto(
    reviewId,
    view,
    { signal } = {},
) {
    const allowedView = view === "perfil" ? "perfil" : "frontal";
    const response = await apiDownload(
        `/consultant/ai-consultation-reviews/${encodeURIComponent(
            reviewId,
        )}/photos/${allowedView}`,
        requestOptions(signal),
    );
    return response.blob;
}

/**
 * Cria uma chave opaca e segura, reutilizada pelos retries desta montagem.
 */
export function createPaymentIdempotencyKey(
    reportId,
    randomUUID = globalThis.crypto?.randomUUID?.bind(globalThis.crypto),
) {
    const normalizedReportId = String(reportId ?? "").trim();
    if (!normalizedReportId) {
        throw new Error("Não foi possível identificar o relatório.");
    }
    if (typeof randomUUID !== "function") {
        throw new Error("O browser não disponibiliza um gerador aleatório seguro.");
    }
    return `report.${normalizedReportId}.${randomUUID()}`;
}
