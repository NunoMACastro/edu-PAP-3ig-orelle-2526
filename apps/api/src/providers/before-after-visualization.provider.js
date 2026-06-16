/**
 * Provider local para visualização antes/depois segura.
 */
import { AppError } from "../middlewares/error.middleware.js";
import { createSafeSvgPreviewImage } from "./makeup-simulation.provider.js";

/**
 * Cria o preview seguro que compara a simulação com produtos recomendados.
 *
 * @function createBeforeAfterVisualizationPreview
 * @param {{simulation: object, recommendations: object[]}} input - Simulação existente e recomendações ativas.
 * @returns {object} Dados públicos da comparação antes/depois.
 * @throws {AppError} Quando a simulação ou as recomendações não são válidas.
 */
export function createBeforeAfterVisualizationPreview({ simulation, recommendations }) {
    if (!simulation?.preview) {
        throw new AppError(400, "Simulação válida obrigatória");
    }

    if (!Array.isArray(recommendations) || recommendations.length === 0) {
        throw new AppError(400, "Recomendações válidas são obrigatórias");
    }

    const productNames = recommendations
        .map((recommendation) => recommendation.productId?.name)
        .filter(Boolean)
        .slice(0, 5);
    const afterAccentColor = simulation.preview.afterPanel?.accentColor ?? "#64748b";
    // O painel "antes" reutiliza o preview seguro existente para nunca devolver paths privados.
    const beforeImageUrl =
        simulation.preview.visual?.beforeImageUrl ??
        createSafeSvgPreviewImage({
            title: "Antes",
            subtitle: "Fotografia privada validada",
            accentColor: simulation.preview.beforePanel?.accentColor ?? "#94a3b8",
        });
    const afterImageUrl = createSafeSvgPreviewImage({
        title: "Depois",
        subtitle: productNames.join(" + "),
        accentColor: afterAccentColor,
        variant: "after",
    });

    return {
        beforePanel: simulation.preview.beforePanel,
        afterPanel: {
            ...simulation.preview.afterPanel,
            description: `${simulation.preview.afterPanel.description} Produtos considerados: ${productNames.join(", ")}.`,
        },
        summary:
            "Visualização antes/depois baseada na simulação de maquilhagem e nas recomendações personalizadas ativas.",
        visualComparison: {
            type: "safe_svg_before_after",
            beforeImageUrl,
            afterImageUrl,
            altText: "Comparação visual segura antes/depois baseada em simulação baseline.",
        },
        recommendedProductNames: productNames,
        limitations: [
            ...simulation.preview.limitations,
            "Visualização imediata; não mede evolução após uso prolongado.",
            "Produtos não são adicionados automaticamente ao carrinho.",
        ],
    };
}
