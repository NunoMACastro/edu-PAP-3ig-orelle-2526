/**
 * Servico de produtos administrativos.
 *
 * O BK-MF0-07 cria produtos apenas atraves de rotas protegidas por admin. Este
 * service recebe dados ja validados e acrescenta o administrador criador.
 */
import { AppError } from "../middlewares/error.middleware.js";
import { Category } from "../models/category.model.js";
import { Product } from "../models/product.model.js";
import { Review } from "../models/review.model.js";

/**
 * Converte um produto Mongoose em resposta JSON.
 *
 * @function toProductResponse
 * @param {object} product - Documento Mongoose ou mock equivalente.
 * @returns {{id: string, name: string, brandName: string, description: string, ingredientNames: string[], skinTypes: string[], imageUrl: string, priceCents: number, stock: number, categoryIds: string[], createdBy: string, createdAt: Date|undefined, updatedAt: Date|undefined}} Produto seguro.
 */
function toProductResponse(product) {
    return {
        id: product._id.toString(),
        name: product.name,
        brandName: product.brandName,
        description: product.description,
        ingredientNames: product.ingredientNames,
        skinTypes: product.skinTypes,
        imageUrl: product.imageUrl,
        priceCents: product.priceCents,
        stock: product.stock,
        categoryIds: product.categoryIds.map((id) => id.toString()),
        createdBy: product.createdBy.toString(),
        createdAt: product.createdAt,
        updatedAt: product.updatedAt,
    };
}

/**
 * Cria um produto no catalogo.
 *
 * @async
 * @function createProduct
 * @param {Record<string, unknown>} input - Dados validados do produto.
 * @param {string} adminUserId - ID do administrador autenticado.
 * @returns {Promise<object>} Produto criado.
 */
export async function createProduct(input, adminUserId) {
    const product = await Product.create({
        ...input,
        createdBy: adminUserId,
    });

    return toProductResponse(product);
}

/**
 * Converte um produto para o contrato publico do catalogo.
 *
 * @function toPublicProductResponse
 * @param {object} product - Documento Mongoose ou mock equivalente.
 * @returns {{id: string, name: string, brandName: string, description: string, ingredientNames: string[], skinTypes: string[], imageUrl: string, priceCents: number, stock: number, categoryIds: string[]}} Produto sem campos administrativos.
 */
function toPublicProductResponse(product) {
    return {
        id: product._id.toString(),
        name: product.name,
        brandName: product.brandName,
        description: product.description,
        ingredientNames: product.ingredientNames,
        skinTypes: product.skinTypes,
        imageUrl: product.imageUrl,
        priceCents: product.priceCents,
        stock: product.stock,
        categoryIds: product.categoryIds.map((id) => id.toString()),
    };
}

/**
 * Escapa texto recebido do cliente antes de o usar numa RegExp.
 *
 * @function escapeRegexText
 * @param {string} value - Texto de pesquisa normalizado.
 * @returns {string} Texto seguro para RegExp literal.
 */
function escapeRegexText(value) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Lista produtos publicos do catalogo com filtros validados.
 *
 * @async
 * @function listCatalogProducts
 * @param {{search?: string, brandName?: string, skinType?: string, categoryId?: string, minPriceCents?: number, maxPriceCents?: number}} filters - Filtros normalizados.
 * @returns {Promise<object[]>} Produtos publicos.
 */
export async function listCatalogProducts(filters) {
    const query = {};

    if (filters.search) {
        query.$text = { $search: filters.search };
    }

    if (filters.brandName) {
        query.brandName = new RegExp(escapeRegexText(filters.brandName), "i");
    }

    if (filters.skinType) {
        query.skinTypes = filters.skinType;
    }

    if (filters.categoryId) {
        const categoryExists = await Category.exists({ _id: filters.categoryId });

        if (!categoryExists) {
            throw new AppError(400, "Categoria invalida");
        }

        query.categoryIds = filters.categoryId;
    }

    if (
        filters.minPriceCents !== undefined ||
        filters.maxPriceCents !== undefined
    ) {
        query.priceCents = {};

        if (filters.minPriceCents !== undefined) {
            query.priceCents.$gte = filters.minPriceCents;
        }

        if (filters.maxPriceCents !== undefined) {
            query.priceCents.$lte = filters.maxPriceCents;
        }
    }

    const products = await Product.find(query)
        .sort({ createdAt: -1 })
        .limit(40);

    return products.map(toPublicProductResponse);
}

/**
 * Calcula resumo publico das reviews publicadas de um produto.
 *
 * @async
 * @function getReviewSummary
 * @param {string} productId - ID do produto.
 * @returns {Promise<{averageRating: number, totalReviews: number}>} Resumo de notas.
 */
async function getReviewSummary(productId) {
    const reviews = await Review.find({ productId, status: "published" })
        .select("rating")
        .limit(200);

    if (reviews.length === 0) {
        return { averageRating: 0, totalReviews: 0 };
    }

    const total = reviews.reduce((sum, review) => sum + review.rating, 0);

    return {
        averageRating: Number((total / reviews.length).toFixed(2)),
        totalReviews: reviews.length,
    };
}

/**
 * Obtem o detalhe publico de um produto.
 *
 * @async
 * @function getCatalogProductDetails
 * @param {string} productId - ID validado do produto.
 * @returns {Promise<object>} Produto publico detalhado.
 * @throws {AppError} Quando o produto nao existe.
 */
export async function getCatalogProductDetails(productId) {
    const product = await Product.findById(productId);

    if (!product) {
        throw new AppError(404, "Produto não encontrado");
    }

    return {
        ...toPublicProductResponse(product),
        reviewSummary: await getReviewSummary(productId),
        relatedProducts: [],
    };
}
