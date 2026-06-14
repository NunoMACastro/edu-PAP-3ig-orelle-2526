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
 * Handler HTTP que devolve o carrinho do utilizador autenticado.
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
 * Handler HTTP que adiciona um item ao carrinho do utilizador autenticado.
 */
export async function addCartItemController(req, res, next) {
    try {
        const payload = validateCartItemPayload(req.body);
        const cart = await addItemToCart(req.user.id, payload);
        return res.status(200).json({ cart });
    } catch (err) {
        return next(err);
    }
}

/**
 * Handler HTTP que atualiza a quantidade de um item no carrinho.
 */
export async function updateCartItemController(req, res, next) {
    try {
        const { productId } = validateCartProductParam(req.params);
        const payload = validateCartQuantityPayload(req.body);
        const cart = await updateCartItemQuantity(req.user.id, productId, payload);
        return res.status(200).json({ cart });
    } catch (err) {
        return next(err);
    }
}

/**
 * Handler HTTP que remove um item do carrinho.
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