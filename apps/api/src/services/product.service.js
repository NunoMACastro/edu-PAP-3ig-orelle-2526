/**
 * Servico de produtos administrativos.
 *
 * O BK-MF0-07 cria produtos apenas atraves de rotas protegidas por admin. Este
 * service recebe dados ja validados e acrescenta o administrador criador.
 */
import { PAYMENT_STATUS } from "../constants/domain.constants.js";
import { AppError } from "../middlewares/error.middleware.js";
import { Category } from "../models/category.model.js";
import { Order } from "../models/order.model.js";
import { Product } from "../models/product.model.js";
import { Review } from "../models/review.model.js";

const FEATURED_PRODUCTS_LIMIT = 6;
const FEATURED_SALES_CANDIDATE_LIMIT = FEATURED_PRODUCTS_LIMIT * 4;

/** Converte variantes internas em dados comerciais públicos e estáveis. */
function toProductVariantsResponse(product) {
    return (product.variants ?? []).map((variant) => ({
        variantId: variant.variantId,
        label: variant.label,
        colorHex: variant.colorHex ?? null,
        undertone: variant.undertone ?? null,
        finish: variant.finish ?? null,
        coverage: variant.coverage ?? null,
        imageUrl: variant.imageUrl ?? null,
        priceCents: variant.priceCents ?? null,
        stock: variant.stock,
    }));
}

/** Converte a metadata curada sem expor campos internos de ranking. */
function toProductAiMetadataResponse(product) {
    return {
        aiEligible: Boolean(product.aiEligible),
        concernTags: product.concernTags ?? [],
        routineSteps: product.routineSteps ?? [],
        inciIngredients: product.inciIngredients ?? [],
        attributes: {
            texture: product.attributes?.texture ?? null,
            finish: product.attributes?.finish ?? null,
            coverage: product.attributes?.coverage ?? null,
            fragranceFree: product.attributes?.fragranceFree ?? null,
            spf: product.attributes?.spf ?? null,
            uvaRating: product.attributes?.uvaRating ?? null,
            waterResistantMinutes:
                product.attributes?.waterResistantMinutes ?? null,
        },
        makeup: {
            functions: product.makeup?.functions ?? [],
            regions: product.makeup?.regions ?? [],
            applicationAreas: product.makeup?.applicationAreas ?? [],
            styleTags: product.makeup?.styleTags ?? [],
            wearProfiles: product.makeup?.wearProfiles ?? [],
        },
        variants: toProductVariantsResponse(product),
    };
}

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
        ...toProductAiMetadataResponse(product),
        createdBy: product.createdBy?.toString?.() ?? null,
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

/** Escapa texto usado numa expressão regular MongoDB criada pelo servidor. */
function escapeRegularExpression(value) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Lista uma página do catálogo administrativo com ordenação determinística.
 *
 * @param {{page: number, pageSize: number, search: string, aiEligibility: string, stock: string}} filters - Filtros validados pelo controller.
 * @returns {Promise<{products: object[], pagination: {page: number, pageSize: number, total: number, totalPages: number}}>} Página segura do catálogo.
 */
export async function listAdminProducts(filters) {
    const { page, pageSize, search, aiEligibility, stock } = filters;
    const query = {};

    if (search) {
        const pattern = new RegExp(escapeRegularExpression(search), "i");
        query.$or = [{ name: pattern }, { brandName: pattern }];
    }
    if (aiEligibility !== "all") {
        query.aiEligible = aiEligibility === "eligible";
    }
    if (stock === "available") query.stock = { $gt: 0 };
    if (stock === "empty") query.stock = 0;

    const [total, products] = await Promise.all([
        Product.countDocuments(query),
        Product.find(query)
            .sort({ name: 1, _id: 1 })
            .skip((page - 1) * pageSize)
            .limit(pageSize),
    ]);

    return {
        products: products.map(toProductResponse),
        pagination: {
            page,
            pageSize,
            total,
            totalPages: total === 0 ? 0 : Math.ceil(total / pageSize),
        },
    };
}

/** Obtém um produto existente antes de validar a invariável de stock. */
export async function getAdminProductForCuration(productId) {
    const product = await Product.findById(productId);
    if (!product) throw new AppError(404, "Produto não encontrado");
    return toProductResponse(product);
}

/**
 * Substitui apenas metadata de recomendação, com CAS sobre o stock agregado.
 * Uma atualização concorrente de stock obriga o administrador a recarregar.
 */
export async function updateProductAiMetadata(
    productId,
    expectedStock,
    metadata,
) {
    const product = await Product.findOneAndUpdate(
        { _id: productId, stock: expectedStock },
        { $set: metadata },
        { new: true, runValidators: true },
    );
    if (product) return toProductResponse(product);

    const exists = await Product.exists({ _id: productId });
    if (!exists) throw new AppError(404, "Produto não encontrado");
    throw new AppError(
        409,
        "O stock do produto mudou. Recarrega a curadoria antes de guardar.",
        { code: "PRODUCT_STOCK_CHANGED" },
    );
}

/**
 * Converte um produto para o contrato publico do catalogo.
 *
 * @function toPublicProductResponse
 * @param {object} product - Documento Mongoose ou mock equivalente.
 * @returns {{id: string, name: string, brandName: string, description: string, ingredientNames: string[], skinTypes: string[], imageUrl: string, priceCents: number, stock: number, categoryIds: string[]}} Produto sem campos administrativos.
 */
export function toPublicProductResponse(product) {
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
        ...toProductAiMetadataResponse(product),
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
 * @throws {AppError} Quando o intervalo de preco recebido e incoerente.
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
 * Lista produtos recentes com stock para preencher a montra publica.
 *
 * @async
 * @function listRecentProductsWithStock
 * @param {string[]} excludedProductIds - IDs ja escolhidos para evitar duplicados.
 * @param {number} limit - Numero maximo de produtos a devolver.
 * @returns {Promise<object[]>} Produtos recentes com stock.
 */
async function listRecentProductsWithStock(excludedProductIds, limit) {
    if (limit <= 0) return [];

    const query = { stock: { $gt: 0 } };

    if (excludedProductIds.length > 0) {
        query._id = { $nin: excludedProductIds };
    }

    return Product.find(query).sort({ createdAt: -1 }).limit(limit);
}

/**
 * Lista produtos em destaque para a home, priorizando os mais vendidos com stock.
 *
 * A agregacao usa apenas encomendas pagas. Unidades vendidas e receita servem
 * so para ordenar internamente; a resposta publica continua a usar o DTO do
 * catalogo e nao expõe metricas comerciais.
 *
 * @async
 * @function listFeaturedCatalogProducts
 * @returns {Promise<object[]>} Produtos publicos em destaque.
 */
export async function listFeaturedCatalogProducts() {
    const salesRanking = await Order.aggregate([
        { $match: { "payment.status": PAYMENT_STATUS.SIMULATED_PAID } },
        { $unwind: "$items" },
        {
            $group: {
                _id: "$items.productId",
                unitsSold: { $sum: "$items.quantity" },
                revenueCents: { $sum: "$items.lineTotalCents" },
            },
        },
        { $sort: { unitsSold: -1, revenueCents: -1 } },
        { $limit: FEATURED_SALES_CANDIDATE_LIMIT },
    ]);
    const soldProductIds = salesRanking.map((product) => product._id.toString());
    let featuredProducts = [];

    if (soldProductIds.length > 0) {
        const productsWithStock = await Product.find({
            _id: { $in: soldProductIds },
            stock: { $gt: 0 },
        });
        const productsById = new Map(
            productsWithStock.map((product) => [product._id.toString(), product]),
        );

        featuredProducts = soldProductIds
            .map((productId) => productsById.get(productId))
            .filter(Boolean)
            .slice(0, FEATURED_PRODUCTS_LIMIT);
    }

    const fallbackProducts = await listRecentProductsWithStock(
        soldProductIds,
        FEATURED_PRODUCTS_LIMIT - featuredProducts.length,
    );

    return [...featuredProducts, ...fallbackProducts]
        .slice(0, FEATURED_PRODUCTS_LIMIT)
        .map(toPublicProductResponse);
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
