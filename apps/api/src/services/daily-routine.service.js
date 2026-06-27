/**
 * Service de rotinas diárias da MF2.
 */
import { AppError } from "../middlewares/error.middleware.js";
import { DailyRoutine } from "../models/daily-routine.model.js";
import { ProductRecommendation } from "../models/product-recommendation.model.js";

const PRODUCT_SELECT = "name brandName imageUrl priceCents stock";
const VALID_RECOMMENDATION_STATUSES = ["active", "accepted"];

/**
 * Guarda um resumo estável do produto usado num passo da rotina.
 *
 * @function toProductSnapshot
 * @param {object} product - Produto populado a partir da recomendação.
 * @returns {object} Snapshot do produto no momento em que a rotina é gerada.
 */
function toProductSnapshot(product) {
    return {
        productId: product._id,
        name: product.name,
        brandName: product.brandName,
        imageUrl: product.imageUrl,
        priceCents: product.priceCents,
    };
}

/**
 * Converte a rotina persistida para o DTO público usado pelo frontend.
 *
 * @function toRoutineDto
 * @param {object|null} routine - Documento Mongoose ou null.
 * @returns {object|null} Rotina pública ou null quando ainda não existe rotina.
 */
function toRoutineDto(routine) {
    if (!routine) return null;

    return {
        id: routine._id.toString(),
        source: routine.source,
        steps: routine.steps.map((step) => ({
            period: step.period,
            title: step.title,
            instructions: step.instructions,
            recommendationId: step.recommendationId.toString(),
            product: {
                id: step.productSnapshot.productId.toString(),
                name: step.productSnapshot.name,
                brandName: step.productSnapshot.brandName,
                imageUrl: step.productSnapshot.imageUrl,
                priceCents: step.productSnapshot.priceCents,
            },
        })),
        limitations: routine.limitations,
        updatedAt: routine.updatedAt,
    };
}

/**
 * Cria passos alternados entre manhã e noite a partir das recomendações disponíveis.
 *
 * @function buildRoutineSteps
 * @param {object[]} recommendations - Recomendações já filtradas e populadas com produto.
 * @returns {object[]} Passos de rotina prontos para persistência.
 */
function buildRoutineSteps(recommendations) {
    const selected = recommendations.slice(0, 4);

    return selected.map((recommendation, index) => {
        // A alternância simples garante uma rotina mínima com momentos de manhã e de noite.
        const period = index % 2 === 0 ? "manha" : "noite";
        const product = recommendation.productId;

        return {
            period,
            title:
                period === "manha"
                    ? `Manhã: aplicar ${product.name}`
                    : `Noite: aplicar ${product.name}`,
            instructions:
                period === "manha"
                    ? "Usar depois da limpeza suave e antes da proteção solar, respeitando a tolerância da pele."
                    : "Usar depois de remover impurezas, sem prometer resultado clínico.",
            recommendationId: recommendation._id,
            productSnapshot: toProductSnapshot(product),
        };
    });
}

/**
 * Gera rotina diaria baseada em recomendacoes ativas/aceites.
 *
 * @async
 * @function generateDailyRoutineForUser
 * @param {string} userId - Utilizador autenticado.
 * @returns {Promise<object>} Rotina publica.
 */
export async function generateDailyRoutineForUser(userId) {
    const recommendations = await ProductRecommendation.find({
        userId,
        status: { $in: VALID_RECOMMENDATION_STATUSES },
    })
        .sort({ status: 1, score: -1 })
        .limit(6)
        .populate("productId", PRODUCT_SELECT);

    const availableRecommendations = recommendations.filter(
        (recommendation) => recommendation.productId?.stock > 0,
    );

    if (availableRecommendations.length < 2) {
        throw new AppError(400, "Pelo menos duas recomendações válidas são obrigatórias");
    }

    const steps = buildRoutineSteps(availableRecommendations);
    const periods = new Set(steps.map((step) => step.period));

    if (!periods.has("manha") || !periods.has("noite")) {
        throw new AppError(400, "Rotina deve conter passos de manhã e noite");
    }

    const routine = await DailyRoutine.findOneAndUpdate(
        { userId },
        {
            $set: {
                source: "recommendations",
                steps,
                limitations: [
                    "DERIVADO: rotina gerada a partir de recomendações enquanto compras reais não existem na MF2.",
                    "Não substitui aconselhamento médico ou dermatológico.",
                    "Recomendações rejeitadas pelo utilizador não entram na rotina.",
                ],
            },
        },
        { upsert: true, new: true, runValidators: true },
    );

    return toRoutineDto(routine);
}

/**
 * Obtem rotina atual do utilizador autenticado.
 *
 * @async
 * @function getDailyRoutineForUser
 * @param {string} userId - Utilizador autenticado.
 * @returns {Promise<object|null>} Rotina publica ou null.
 */
export async function getDailyRoutineForUser(userId) {
    const routine = await DailyRoutine.findOne({ userId });
    return toRoutineDto(routine);
}
