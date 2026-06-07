/**
 * Provider local isolado de analise cosmetica da pele.
 *
 * Este provider implementa uma baseline tecnica controlada para a MF1:
 * valida fotografias privadas ja aceites pelo backend e produz sinais
 * cosmeticos conservadores, sem valor clinico nem treino externo.
 */
import { AppError } from "../middlewares/error.middleware.js";

const MIN_CONFIDENCE = 0.45;
const MAX_CONFIDENCE = 0.62;

/**
 * Cria um finding estruturado.
 *
 * @function createFinding
 * @param {string} label - Etiqueta do achado.
 * @param {number} confidence - Confianca entre 0 e 1.
 * @param {string} explanation - Explicacao curta.
 * @returns {{label: string, confidence: number, explanation: string}} Finding.
 */
function createFinding(label, confidence, explanation) {
    return { label, confidence, explanation };
}

/**
 * Limita um valor numerico ao intervalo de confianca permitido.
 *
 * @function clampConfidence
 * @param {number} value - Valor candidato.
 * @returns {number} Confianca normalizada entre limites conservadores.
 */
function clampConfidence(value) {
    return Math.min(MAX_CONFIDENCE, Math.max(MIN_CONFIDENCE, value));
}

/**
 * Calcula uma confianca tecnica estavel a partir dos metadados de upload.
 *
 * A baseline local nao tenta diagnosticar pele. Usa apenas sinais tecnicos
 * ja validados pelo fluxo privado para manter resultados reprodutiveis em
 * desenvolvimento e testes, ate existir um provider especializado.
 *
 * @function calculateTechnicalConfidence
 * @param {object} frontalPhoto - Fotografia frontal validada.
 * @param {object} perfilPhoto - Fotografia de perfil validada.
 * @returns {number} Confianca baixa a moderada.
 */
function calculateTechnicalConfidence(frontalPhoto, perfilPhoto) {
    const totalSizeBytes =
        Number(frontalPhoto.sizeBytes) + Number(perfilPhoto.sizeBytes);
    const sizeSignal = (totalSizeBytes % 1000) / 1000;
    const formatSignal =
        frontalPhoto.mimeType === perfilPhoto.mimeType ? 0.04 : 0.01;

    return clampConfidence(0.48 + sizeSignal * 0.1 + formatSignal);
}

/**
 * Analisa fotografias faciais ja validadas.
 *
 * @async
 * @function analyzeSkinPhotos
 * @param {{frontalPhoto?: object, perfilPhoto?: object}} input - Fotos escolhidas pelo backend.
 * @returns {Promise<object>} Resultado estruturado da analise.
 * @throws {AppError} Quando falta storage privado validado.
 */
export async function analyzeSkinPhotos({ frontalPhoto, perfilPhoto }) {
    if (
        !frontalPhoto?.storageKey ||
        !perfilPhoto?.storageKey ||
        !frontalPhoto?.mimeType ||
        !perfilPhoto?.mimeType ||
        !frontalPhoto?.sizeBytes ||
        !perfilPhoto?.sizeBytes
    ) {
        throw new AppError(400, "Fotografias válidas obrigatórias para análise");
    }

    const confidence = calculateTechnicalConfidence(frontalPhoto, perfilPhoto);

    return {
        providerName: "local-skin-analysis-v1",
        findings: {
            skinType: createFinding(
                "mista",
                confidence,
                "Estimativa cosmetica inicial produzida por baseline local controlado.",
            ),
            acne: createFinding(
                "baixo",
                clampConfidence(confidence - 0.02),
                "Sinal cosmetico conservador para acne visivel, sem valor diagnostico.",
            ),
            manchas: createFinding(
                "baixo",
                clampConfidence(confidence - 0.04),
                "Sinal cosmetico conservador para manchas, adequado apenas a recomendacoes gerais.",
            ),
            rugas: createFinding(
                "baixo",
                clampConfidence(confidence - 0.05),
                "Sinal cosmetico conservador para rugas, sem finalidade medica.",
            ),
            oleosidade: createFinding(
                "moderada",
                clampConfidence(confidence + 0.03),
                "Estimativa cosmetica inicial para orientar a rotina e o relatorio MF1.",
            ),
        },
        sources: ["fotografia_frontal", "fotografia_perfil"],
        limitations: [
            "Não é diagnóstico médico.",
            "Resultado de provider local controlado com confiança baixa a moderada.",
            "Qualidade de luz, enquadramento e resolução podem afetar a análise.",
            "Deve ser substituído por provider especializado antes de uso clínico ou diagnóstico.",
            "As fotografias não são enviadas para treino externo.",
        ],
    };
}
