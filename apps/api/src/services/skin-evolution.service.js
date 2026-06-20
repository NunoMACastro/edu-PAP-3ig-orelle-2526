/**
 * Service de evolução temporal da pele da MF2.
 */
import { FaceAnalysis } from "../models/face-analysis.model.js";

const SCORE_BY_LABEL = new Map([
    ["baixo", 1],
    ["baixa", 1],
    ["moderado", 2],
    ["moderada", 2],
    ["alto", 3],
    ["alta", 3],
]);

const TRACKED_FINDINGS = ["acne", "manchas", "rugas", "oleosidade"];

/**
 * Converte uma label cosmética guardada para a escala numérica do gráfico.
 *
 * @function toScore
 * @param {object|undefined|null} finding - Resultado cosmético guardado na análise.
 * @returns {number|null} Pontuação de 1 a 3 ou null quando a label não é mapeável.
 */
function toScore(finding) {
    return SCORE_BY_LABEL.get(finding?.label) ?? null;
}

/**
 * Converte uma análise facial concluída num ponto temporal de evolução.
 *
 * @function toEvolutionPoint
 * @param {object} analysis - Documento de análise facial concluída.
 * @returns {object} Ponto público com scores cosméticos.
 */
function toEvolutionPoint(analysis) {
    // Cada finding acompanhado no gráfico recebe uma chave terminada em "Score".
    const scores = Object.fromEntries(
        TRACKED_FINDINGS.map((key) => [`${key}Score`, toScore(analysis.findings?.[key])]),
    );

    return {
        analysisId: analysis._id.toString(),
        createdAt: analysis.createdAt,
        skinType: analysis.findings?.skinType?.label ?? "nao_conclusivo",
        ...scores,
    };
}

/**
 * Obtém pontos públicos de evolução do utilizador autenticado.
 *
 * @async
 * @function getMySkinEvolution
 * @param {string} userId - Utilizador autenticado.
 * @returns {Promise<object>} DTO publico de evolucao.
 */
export async function getMySkinEvolution(userId) {
    const analyses = await FaceAnalysis.find({ userId, status: "completed" })
        .select("findings createdAt")
        .sort({ createdAt: 1 })
        .limit(30);

    return {
        points: analyses.map(toEvolutionPoint),
        scale: {
            1: "baixo",
            2: "moderado",
            3: "alto",
        },
        limitations: [
            "Pontuações cosméticas derivadas das labels guardadas.",
            "Não substitui avaliação médica.",
            "Resultados dependem da qualidade das fotografias usadas nas análises anteriores.",
        ],
    };
}
