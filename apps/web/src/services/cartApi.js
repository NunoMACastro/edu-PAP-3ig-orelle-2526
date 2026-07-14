/**
 * Operações HTTP do carrinho autenticado.
 *
 * Este módulo mantém o contrato comercial num único ponto. Não guarda estado
 * no browser nem antecipa alterações antes de a API confirmar o novo DTO.
 */
import { apiRequest } from "./apiClient.js";

/** Carrega o carrinho do cliente autenticado. */
export async function getCart({ signal } = {}) {
    const payload = await apiRequest("/cart", { signal });
    return payload.cart;
}

/** Adiciona ou incrementa uma combinação produto-variante. */
export async function addCartItem(line, { signal } = {}) {
    const payload = await apiRequest("/cart/items", {
        method: "POST",
        body: JSON.stringify(line),
        signal,
    });
    return payload.cart;
}

/** Substitui a quantidade de uma combinação produto-variante. */
export async function updateCartItem(productId, variantId, quantity, { signal } = {}) {
    const payload = await apiRequest(
        `/cart/items/${encodeURIComponent(productId)}`,
        {
            method: "PATCH",
            body: JSON.stringify({
                quantity,
                ...(variantId ? { variantId } : {}),
            }),
            signal,
        },
    );
    return payload.cart;
}

/** Remove uma combinação produto-variante do carrinho. */
export async function deleteCartItem(productId, variantId, { signal } = {}) {
    const variantQuery = variantId
        ? `?variantId=${encodeURIComponent(variantId)}`
        : "";
    const payload = await apiRequest(
        `/cart/items/${encodeURIComponent(productId)}${variantQuery}`,
        { method: "DELETE", signal },
    );
    return payload.cart;
}
