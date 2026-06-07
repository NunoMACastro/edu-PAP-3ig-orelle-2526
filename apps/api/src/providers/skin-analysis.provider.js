/**
 * Provider local isolado de analise cosmética da pele.
 *
 * Este provider e um fallback honesto: confirma que existem fotografias
 * privadas validadas e devolve conclusoes inconclusivas, sem interpretar
 * pixeis nem simular um motor externo.
 */
import { AppError } from "../middlewares/error.middleware.js";

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

    return {
        providerName: "local-fallback-skin-analysis-v1",
        findings: {
            skinType: createFinding(
                "nao_conclusivo",
                0.25,
                "Fallback local sem interpretação real de píxeis.",
            ),
            acne: createFinding(
                "nao_conclusivo",
                0.25,
                "Sem provider especializado ativo, a app não afirma severidade de acne.",
            ),
            manchas: createFinding(
                "nao_conclusivo",
                0.25,
                "A fotografia deve ser analisada por provider especializado para medir manchas.",
            ),
            rugas: createFinding(
                "nao_conclusivo",
                0.25,
                "A app evita afirmar sinais que o fallback local não consegue medir.",
            ),
            oleosidade: createFinding(
                "nao_conclusivo",
                0.25,
                "Sem análise visual real, a oleosidade fica marcada como inconclusiva.",
            ),
        },
        sources: ["fotografia_frontal", "fotografia_perfil"],
        limitations: [
            "Não é diagnóstico médico.",
            "Provider local fallback: valida pré-condições, mas não interpreta píxeis da imagem.",
            "Sem provider especializado ativo, os sinais visuais ficam inconclusivos.",
            "As fotografias não são enviadas para treino externo.",
        ],
    };
}
