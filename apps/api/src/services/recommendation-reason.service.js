/**
 * Service de motivos publicos para recomendacoes.
 *
 * O texto nasce dos sinais ja validados pelo ranking; o frontend apenas o
 * apresenta, sem inventar explicacoes.
 */
import { AppError } from "../middlewares/error.middleware.js";

const REASON_TEXT = Object.freeze({
    skin_type_match: "compatível com o tipo de pele estimado",
    oiliness_support: "adequado para pele com tendência de oleosidade",
    acne_support: "apoia uma rotina cosmética orientada a pele com acne",
    spots_support: "apoia uma rotina cosmética orientada a manchas",
    wrinkles_support: "apoia uma rotina cosmética orientada a rugas",
});

/**
 * Constroi explicacao publica de uma recomendacao.
 *
 * @function buildRecommendationReason
 * @param {{reasonCodes: string[], sourceSignals: string[], product: object}} input - Sinais validados.
 * @returns {{reasonCodes: string[], sourceSignals: string[], explanation: string}} Motivo publico.
 */
export function buildRecommendationReason({ reasonCodes, sourceSignals, product }) {
    const validCodes = [...new Set(reasonCodes)].filter((code) => REASON_TEXT[code]);
    const validSignals = [...new Set(sourceSignals)].filter(Boolean);

    if (validCodes.length === 0 || validSignals.length === 0) {
        throw new AppError(400, "Recomendacao sem motivo cosmetico suficiente");
    }

    const readableReasons = validCodes.map((code) => REASON_TEXT[code]);
    const explanation = `${product.name} foi recomendado porque e ${readableReasons.join(
        " e ",
    )}. Esta sugestao e cosmetica e deve ser lida com as limitacoes do relatorio.`;

    return {
        reasonCodes: validCodes,
        sourceSignals: validSignals,
        explanation,
    };
}
