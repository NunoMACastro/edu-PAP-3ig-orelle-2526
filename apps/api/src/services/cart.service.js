import { Cart } from "../models/cart.model.js";
import { Product } from "../models/product.model.js";
import { AppError } from "../middlewares/error.middleware.js";

/**
 * Converte um documento Cart num DTO seguro para a UI.
 * @param {{ _id: object, items: Array<object>, updatedAt: Date }} cart - Documento de carrinho.
 * @returns {{ id: string, items: Array<object>, totalItems: number, totalCents: number, updatedAt: Date }}
 */
function serializeCart(cart) {
    const items = cart.items.map((item) => ({
        productId: item.productId.toString(),
        name: item.productNameSnapshot,
        quantity: item.quantity,
        unitPriceCents: item.priceSnapshotCents,
        lineTotalCents: item.quantity * item.priceSnapshotCents,
    }));

    return {
        id: cart._id.toString(),
        items,
        totalItems: items.reduce((sum, item) => sum + item.quantity, 0),
        totalCents: items.reduce((sum, item) => sum + item.lineTotalCents, 0),
        updatedAt: cart.updatedAt,
    };
}

/**
 * Obtém o carrinho ativo do cliente ou cria um carrinho vazio.
 * @param {string} userId - ID do utilizador autenticado.
 * @returns {Promise<object>} Documento de carrinho.
 */
async function getOrCreateCart(userId) {
    return Cart.findOneAndUpdate(
        { userId },
        { $setOnInsert: { userId, items: [] } },
        { new: true, upsert: true },
    );
}

/**
 * Procura um produto que pode ser comprado pelo cliente.
 * @param {string} productId - ID do produto a consultar.
 * @returns {Promise<object>} Produto ativo com preço e stock.
 * @throws {AppError} Quando o produto não existe ou está inativo.
 */
async function findPurchasableProduct(productId) {
    const product = await Product.findById(productId).select("name priceCents stock isActive");

    if (!product || product.isActive === false) {
        throw new AppError(404, "Produto não encontrado");
    }

    return product;
}

/**
 * Devolve o carrinho do cliente autenticado.
 * @param {string} userId - ID vindo da sessão.
 * @returns {Promise<object>} DTO do carrinho.
 */
export async function getMyCart(userId) {
    const cart = await getOrCreateCart(userId);
    return serializeCart(cart);
}

/**
 * Adiciona um produto ao carrinho, somando quantidades se o item já existir.
 * @param {string} userId - ID vindo da sessão.
 * @param {{ productId: string, quantity: number }} payload - Produto e quantidade pretendidos.
 * @returns {Promise<object>} DTO atualizado do carrinho.
 * @throws {AppError} Quando o produto não existe ou não há stock suficiente.
 */
export async function addItemToCart(userId, { productId, quantity }) {
    const product = await findPurchasableProduct(productId);

    if (product.stock < quantity) {
        throw new AppError(409, "Stock insuficiente para a quantidade pedida");
    }

    const cart = await getOrCreateCart(userId);
    const existing = cart.items.find((item) => item.productId.toString() === productId);

    if (existing) {
        const nextQuantity = existing.quantity + quantity;
        if (product.stock < nextQuantity) {
            throw new AppError(409, "Stock insuficiente para atualizar o carrinho");
        }
        // O preço é sempre atualizado a partir da base de dados, nunca do browser.
        existing.quantity = nextQuantity;
        existing.priceSnapshotCents = product.priceCents;
        existing.productNameSnapshot = product.name;
    } else {
        cart.items.push({
            productId: product._id,
            quantity,
            priceSnapshotCents: product.priceCents,
            productNameSnapshot: product.name,
        });
    }

    await cart.save();
    return serializeCart(cart);
}

/**
 * Atualiza a quantidade de um produto já presente no carrinho.
 * @param {string} userId - ID vindo da sessão.
 * @param {string} productId - ID do produto a alterar.
 * @param {{ quantity: number }} payload - Nova quantidade.
 * @returns {Promise<object>} DTO atualizado do carrinho.
 * @throws {AppError} Quando o item não existe no carrinho ou não há stock suficiente.
 */
export async function updateCartItemQuantity(userId, productId, { quantity }) {
    const product = await findPurchasableProduct(productId);

    if (product.stock < quantity) {
        throw new AppError(409, "Stock insuficiente para atualizar o carrinho");
    }

    const cart = await getOrCreateCart(userId);
    const item = cart.items.find((cartItem) => cartItem.productId.toString() === productId);

    if (!item) {
        throw new AppError(404, "Produto não está no carrinho");
    }

    item.quantity = quantity;
    item.priceSnapshotCents = product.priceCents;
    item.productNameSnapshot = product.name;

    await cart.save();
    return serializeCart(cart);
}

/**
 * Remove um produto do carrinho do cliente.
 * @param {string} userId - ID vindo da sessão.
 * @param {string} productId - ID do produto a remover.
 * @returns {Promise<object>} DTO atualizado do carrinho.
 */
export async function removeCartItem(userId, productId) {
    const cart = await getOrCreateCart(userId);
    cart.items = cart.items.filter((item) => item.productId.toString() !== productId);
    await cart.save();
    return serializeCart(cart);
}

/**
 * Esvazia o carrinho do cliente após o checkout criar a encomenda.
 * @param {string} userId - ID vindo da sessão.
 * @returns {Promise<object>} DTO do carrinho vazio.
 */
export async function clearCart(userId) {
    const cart = await getOrCreateCart(userId);
    cart.items = [];
    await cart.save();
    return serializeCart(cart);
}