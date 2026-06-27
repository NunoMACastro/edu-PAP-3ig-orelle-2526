/**
 * Service do carrinho de compras.
 */
import { AppError } from "../middlewares/error.middleware.js";
import { Cart } from "../models/cart.model.js";
import { Product } from "../models/product.model.js";

/**
 * Converte item de carrinho para DTO publico.
 *
 * @function toCartItemResponse
 * @param {object} item - Item Mongoose ou mock equivalente.
 * @returns {object} Item seguro para frontend.
 */
function toCartItemResponse(item) {
    const lineTotalCents = item.priceSnapshotCents * item.quantity;

    return {
        productId: item.productId.toString(),
        name: item.productNameSnapshot,
        quantity: item.quantity,
        priceSnapshotCents: item.priceSnapshotCents,
        lineTotalCents,
    };
}

/**
 * Converte carrinho para DTO publico.
 *
 * @function toCartResponse
 * @param {object|null} cart - Documento de carrinho ou null.
 * @returns {{items: object[], totalQuantity: number, totalCents: number}} DTO.
 */
export function toCartResponse(cart) {
    const items = cart?.items?.map(toCartItemResponse) ?? [];

    return {
        items,
        totalQuantity: items.reduce((sum, item) => sum + item.quantity, 0),
        totalCents: items.reduce((sum, item) => sum + item.lineTotalCents, 0),
    };
}

/**
 * Carrega o carrinho do utilizador autenticado.
 *
 * @async
 * @function getMyCart
 * @param {string} userId - ID de sessao.
 * @returns {Promise<object>} Carrinho publico.
 */
export async function getMyCart(userId) {
    const cart = await Cart.findOne({ userId });
    return toCartResponse(cart);
}

/**
 * Procura produto vendavel para carrinho.
 *
 * @async
 * @function findPurchasableProduct
 * @param {string} productId - ID do produto.
 * @param {number} quantity - Quantidade pedida.
 * @returns {Promise<object>} Produto existente.
 * @throws {AppError} Quando produto nao existe ou stock nao chega.
 */
async function findPurchasableProduct(productId, quantity) {
    const product = await Product.findById(productId);

    if (!product) {
        throw new AppError(404, "Produto nao encontrado");
    }

    if (product.stock < quantity) {
        throw new AppError(409, "Stock insuficiente para a quantidade pedida");
    }

    return product;
}

/**
 * Devolve carrinho existente ou cria um carrinho vazio para o utilizador.
 *
 * @async
 * @function findOrCreateCart
 * @param {string} userId - ID autenticado.
 * @returns {Promise<object>} Carrinho Mongoose.
 */
async function findOrCreateCart(userId) {
    const cart = await Cart.findOne({ userId });

    if (cart) return cart;

    return Cart.create({ userId, items: [] });
}

/**
 * Adiciona produto ao carrinho autenticado, sem aceitar preco ou userId do frontend.
 *
 * @async
 * @function addItemToCart
 * @param {string} userId - ID autenticado.
 * @param {{productId: string, quantity: number}} input - Produto e quantidade.
 * @returns {Promise<object>} Carrinho atualizado.
 */
export async function addItemToCart(userId, input) {
    const cart = await findOrCreateCart(userId);
    const existingItem = cart.items.find(
        (item) => item.productId.toString() === input.productId,
    );
    const nextQuantity = (existingItem?.quantity ?? 0) + input.quantity;
    const product = await findPurchasableProduct(input.productId, nextQuantity);

    if (existingItem) {
        existingItem.quantity = nextQuantity;
        existingItem.priceSnapshotCents = product.priceCents;
        existingItem.productNameSnapshot = product.name;
    } else {
        cart.items.push({
            productId: product._id,
            quantity: input.quantity,
            priceSnapshotCents: product.priceCents,
            productNameSnapshot: product.name,
        });
    }

    await cart.save();
    return toCartResponse(cart);
}

/**
 * Atualiza quantidade de um item ja presente no carrinho.
 *
 * @async
 * @function updateCartItemQuantity
 * @param {string} userId - ID autenticado.
 * @param {string} productId - Produto a atualizar.
 * @param {number} quantity - Nova quantidade.
 * @returns {Promise<object>} Carrinho atualizado.
 */
export async function updateCartItemQuantity(userId, productId, quantity) {
    const cart = await Cart.findOne({ userId });

    if (!cart) {
        throw new AppError(404, "Produto nao encontrado no carrinho");
    }

    const item = cart.items.find(
        (cartItem) => cartItem.productId.toString() === productId,
    );

    if (!item) {
        throw new AppError(404, "Produto nao encontrado no carrinho");
    }

    const product = await findPurchasableProduct(productId, quantity);

    item.quantity = quantity;
    item.priceSnapshotCents = product.priceCents;
    item.productNameSnapshot = product.name;

    await cart.save();
    return toCartResponse(cart);
}

/**
 * Remove item do carrinho autenticado.
 *
 * @async
 * @function removeCartItem
 * @param {string} userId - ID autenticado.
 * @param {string} productId - Produto a remover.
 * @returns {Promise<object>} Carrinho atualizado.
 */
export async function removeCartItem(userId, productId) {
    const cart = await Cart.findOne({ userId });

    if (!cart) {
        return toCartResponse(null);
    }

    cart.items = cart.items.filter(
        (item) => item.productId.toString() !== productId,
    );
    await cart.save();

    return toCartResponse(cart);
}

/**
 * Limpa o carrinho depois de criar encomenda.
 *
 * @async
 * @function clearCart
 * @param {string} userId - ID autenticado.
 * @returns {Promise<void>}
 */
export async function clearCart(userId) {
    await Cart.deleteOne({ userId });
}
