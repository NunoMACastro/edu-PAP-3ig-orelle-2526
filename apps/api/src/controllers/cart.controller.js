/**
 * Controllers do carrinho de compras.
 */
import {
    addItemToCart,
    getMyCart,
    removeCartItem,
    updateCartItemQuantity,
} from "../services/cart.service.js";
import {
    validateCartItemPayload,
    validateCartProductParam,
    validateCartQuantityPayload,
} from "../validators/cart.validator.js";

/**
 * Lista carrinho do utilizador autenticado.
 *
 * @async
 * @function getMyCartController
 * @param {import("express").Request & {user: {id: string}}} req - Pedido autenticado.
 * @param {import("express").Response} res - Resposta Express.
 * @param {import("express").NextFunction} next - Middleware de erro.
 * @returns {Promise<import("express").Response|void>} Resposta 200.
 */
export async function getMyCartController(req, res, next) {
    try {
        const cart = await getMyCart(req.user.id);
        return res.status(200).json({ cart });
    } catch (err) {
        return next(err);
    }
}

/**
 * Adiciona item ao carrinho.
 *
 * @async
 * @function addItemToCartController
 * @param {import("express").Request & {user: {id: string}}} req - Pedido autenticado.
 * @param {import("express").Response} res - Resposta Express.
 * @param {import("express").NextFunction} next - Middleware de erro.
 * @returns {Promise<import("express").Response|void>} Resposta 200.
 */
export async function addItemToCartController(req, res, next) {
    try {
        const input = validateCartItemPayload(req.body);
        const cart = await addItemToCart(req.user.id, input);

        return res.status(200).json({ cart });
    } catch (err) {
        return next(err);
    }
}

/**
 * Atualiza quantidade de um item do carrinho.
 *
 * @async
 * @function updateCartItemQuantityController
 * @param {import("express").Request & {user: {id: string}}} req - Pedido autenticado.
 * @param {import("express").Response} res - Resposta Express.
 * @param {import("express").NextFunction} next - Middleware de erro.
 * @returns {Promise<import("express").Response|void>} Resposta 200.
 */
export async function updateCartItemQuantityController(req, res, next) {
    try {
        const { productId } = validateCartProductParam(req.params);
        const { quantity } = validateCartQuantityPayload(req.body);
        const cart = await updateCartItemQuantity(req.user.id, productId, quantity);

        return res.status(200).json({ cart });
    } catch (err) {
        return next(err);
    }
}

/**
 * Remove item do carrinho.
 *
 * @async
 * @function removeCartItemController
 * @param {import("express").Request & {user: {id: string}}} req - Pedido autenticado.
 * @param {import("express").Response} res - Resposta Express.
 * @param {import("express").NextFunction} next - Middleware de erro.
 * @returns {Promise<import("express").Response|void>} Resposta 200.
 */
export async function removeCartItemController(req, res, next) {
    try {
        const { productId } = validateCartProductParam(req.params);
        const cart = await removeCartItem(req.user.id, productId);

        return res.status(200).json({ cart });
    } catch (err) {
        return next(err);
    }
}
