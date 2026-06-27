/**
 * Service de avaliacoes de produto da MF1.
 */
import { AppError } from "../middlewares/error.middleware.js";
import { Product } from "../models/product.model.js";
import { Review } from "../models/review.model.js";

const PUBLISHED_REVIEW_STATUS = "published";

/**
 * Converte uma review para resposta publica.
 *
 * @function toReviewResponse
 * @param {object} review - Documento Mongoose ou mock equivalente.
 * @returns {{id: string, productId: string, rating: number, comment: string, status: string, createdAt: Date|undefined}} Review segura.
 */
function toReviewResponse(review) {
    return {
        id: review._id.toString(),
        productId: review.productId.toString(),
        rating: review.rating,
        comment: review.comment,
        status: review.status,
        createdAt: review.createdAt,
    };
}

/**
 * Deteta erro de indice unico do MongoDB.
 *
 * @function isDuplicateReviewError
 * @param {unknown} err - Erro recebido do Mongoose.
 * @returns {boolean} Verdadeiro quando o erro e duplicacao.
 */
function isDuplicateReviewError(err) {
    return err?.code === 11000;
}

/**
 * Cria uma avaliacao para o produto usando ownership da sessao.
 *
 * @async
 * @function createProductReview
 * @param {string} productId - Produto avaliado.
 * @param {string} userId - Utilizador autenticado.
 * @param {{rating: number, comment: string}} input - Review validada.
 * @returns {Promise<object>} Review criada.
 */
export async function createProductReview(productId, userId, input) {
    const exists = await Product.exists({ _id: productId });

    if (!exists) {
        throw new AppError(404, "Produto não encontrado");
    }

    try {
        const review = await Review.create({
            productId,
            userId,
            rating: input.rating,
            comment: input.comment,
        });

        return toReviewResponse(review);
    } catch (err) {
        if (isDuplicateReviewError(err)) {
            throw new AppError(409, "Já avaliaste este produto");
        }

        throw err;
    }
}

/**
 * Lista reviews publicadas de um produto.
 *
 * @async
 * @function listProductReviews
 * @param {string} productId - Produto alvo.
 * @returns {Promise<object[]>} Reviews publicadas.
 */
export async function listProductReviews(productId) {
    const reviews = await Review.find({ productId, status: PUBLISHED_REVIEW_STATUS })
        .sort({ createdAt: -1 })
        .limit(30);

    return reviews.map(toReviewResponse);
}
