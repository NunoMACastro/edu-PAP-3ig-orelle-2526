/**
 * Servico de produtos administrativos.
 *
 * O BK-MF0-07 cria produtos apenas atraves de rotas protegidas por admin. Este
 * service recebe dados ja validados e acrescenta o administrador criador.
 */
import { Product } from "../models/product.model.js";

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
