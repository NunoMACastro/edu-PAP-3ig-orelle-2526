import { AppError } from "../middlewares/error.middleware.js";
import { DailyRoutine } from "../models/daily-routine.model.js";
import { ProductRecommendation } from "../models/product-recommendation.model.js";

const VALID_ROUTINE_STATUSES = ["accepted", "active"];
const REQUIRED_PERIODS = ["manha", "noite"];

function toProductSnapshot(product) {
    return {
        productId: product._id,
        name: product.name,
        brandName: product.brandName,
        imageUrl: product.imageUrl,
        priceCents: product.priceCents,
    };
}

function buildStep(recommendation, period, order) {
    const product = recommendation.productId;
    const periodLabel = period === "manha" ? "Rotina de manhã" : "Rotina de noite";

    return {
        period,
        order,
        title: `${periodLabel}: ${product.name}`,
        instructions:
            period === "manha"
                ? "Aplicar após limpeza suave e antes de proteção solar escolhida pelo cliente."
                : "Aplicar após remover impurezas do dia, respeitando tolerância da pele.",
        reason: recommendation.explanation,
        product: toProductSnapshot(product),
    };
}

function toDailyRoutineDto(routine) {
    return {
        id: routine._id.toString(),
        source: routine.source,
        steps: routine.steps,
        createdAt: routine.createdAt,
        updatedAt: routine.updatedAt,
    };
}

function hasRequiredPeriods(steps) {
    const periods = new Set(steps.map((step) => step.period));
    return REQUIRED_PERIODS.every((period) => periods.has(period));
}

export async function generateDailyRoutineForUser(userId) {
    const recommendations = await ProductRecommendation.find({
        userId,
        status: { $in: VALID_ROUTINE_STATUSES },
    })
        .sort({ status: 1, score: -1, createdAt: -1 })
        .limit(6)
        .populate("productId", "name brandName imageUrl priceCents stock");

    const availableRecommendations = recommendations.filter(
        (recommendation) => recommendation.productId?.stock > 0,
    );

    if (availableRecommendations.length < REQUIRED_PERIODS.length) {
        throw new AppError(
            400,
            "Pelo menos duas recomendações válidas são obrigatórias para gerar rotina de manhã e noite",
        );
    }

    const steps = availableRecommendations.map((recommendation, index) =>
        buildStep(recommendation, index % 2 === 0 ? "manha" : "noite", index + 1),
    );

    if (!hasRequiredPeriods(steps)) {
        throw new AppError(400, "A rotina precisa de passos de manhã e noite");
    }

    const routine = await DailyRoutine.findOneAndUpdate(
        { userId, source: "recommendations" },
        {
            $set: {
                steps,
                sourceRecommendationIds: availableRecommendations.map(
                    (recommendation) => recommendation._id,
                ),
                sourcePurchaseIds: [],
            },
        },
        { upsert: true, new: true, runValidators: true },
    );

    return { routine: toDailyRoutineDto(routine) };
}

export async function getMyDailyRoutine(userId) {
    const routine = await DailyRoutine.findOne({ userId }).sort({ updatedAt: -1 });

    if (!routine) {
        return { routine: null };
    }

    return { routine: toDailyRoutineDto(routine) };
}