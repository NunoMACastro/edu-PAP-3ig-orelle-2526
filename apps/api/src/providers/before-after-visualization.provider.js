import { AppError } from "../middlewares/error.middleware.js";

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

    return {
        beforePanel: simulation.preview.beforePanel,
        afterPanel: {
            ...simulation.preview.afterPanel,
            description: `${simulation.preview.afterPanel.description} Produtos considerados: ${productNames.join(", ")}.`,
        },
        summary:
            "Visualização antes/depois baseada na simulação de maquilhagem e nas recomendações personalizadas ativas.",
        recommendedProductNames: productNames,
        limitations: [
            ...simulation.preview.limitations,
            "Visualização imediata; não mede evolução após uso prolongado.",
            "Produtos não são adicionados automaticamente ao carrinho.",
        ],
    };
}