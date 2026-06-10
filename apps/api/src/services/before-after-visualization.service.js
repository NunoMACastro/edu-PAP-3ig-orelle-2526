import { AppError } from "../middlewares/error.middleware.js";
import { BeforeAfterVisualization } from "../models/before-after-visualization.model.js";
import { FaceConsent } from "../models/face-consent.model.js";
import { MakeupSimulation } from "../models/makeup-simulation.model.js";
import { ProductRecommendation } from "../models/product-recommendation.model.js";
import { createBeforeAfterVisualizationPreview } from "../providers/before-after-visualization.provider.js";

const VISUALIZATION_RECOMMENDATION_STATUSES = ["accepted", "active"];

function toVisualizationDto(visualization) {
    return {
        id: visualization._id.toString(),
        beforePanel: visualization.beforePanel,
        afterPanel: visualization.afterPanel,
        summary: visualization.summary,
        recommendedProductNames: visualization.recommendedProductNames,
        limitations: visualization.limitations,
        createdAt: visualization.createdAt,
    };
}

export async function createBeforeAfterVisualizationForUser(userId, simulationId) {
    const consent = await FaceConsent.findOne({ userId, revokedAt: null });

    if (!consent) {
        throw new AppError(403, "Consentimento facial em falta");
    }

    const simulation = await MakeupSimulation.findOne({ _id: simulationId, userId });

    if (!simulation) {
        throw new AppError(404, "Simulação não encontrada");
    }

    const recommendations = await ProductRecommendation.find({
        userId,
        status: { $in: VISUALIZATION_RECOMMENDATION_STATUSES },
    })
        .sort({ status: 1, score: -1 })
        .limit(5)
        .populate("productId", "name brandName imageUrl priceCents stock");

    if (recommendations.length === 0) {
        throw new AppError(400, "Recomendações válidas são obrigatórias");
    }

    const preview = createBeforeAfterVisualizationPreview({ simulation, recommendations });
    const visualization = await BeforeAfterVisualization.findOneAndUpdate(
        { userId, simulationId: simulation._id },
        {
            $set: {
                sourceRecommendationIds: recommendations.map((recommendation) => recommendation._id),
                beforePanel: preview.beforePanel,
                afterPanel: preview.afterPanel,
                summary: preview.summary,
                recommendedProductNames: preview.recommendedProductNames,
                limitations: preview.limitations,
            },
        },
        { upsert: true, new: true, runValidators: true },
    );

    return { visualization: toVisualizationDto(visualization) };
}