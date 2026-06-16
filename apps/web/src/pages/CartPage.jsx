/**
 * Pagina de carrinho de compras da MF3.
 */
import { useState } from "react";
import { apiRequest } from "../services/apiClient.js";

/**
 * Mostra e edita o carrinho autenticado.
 *
 * @function CartPage
 * @returns {JSX.Element} UI de carrinho com estados principais.
 */
export function CartPage() {
    const [cart, setCart] = useState(null);
    const [productId, setProductId] = useState("");
    const [quantity, setQuantity] = useState(1);
    const [status, setStatus] = useState("idle");
    const [error, setError] = useState("");

    /**
     * Carrega carrinho da API.
     *
     * @async
     * @function loadCart
     * @returns {Promise<void>}
     */
    async function loadCart() {
        setStatus("loading");
        setError("");

        try {
            const data = await apiRequest("/cart");
            setCart(data.cart);
            setStatus(data.cart.items.length === 0 ? "empty" : "success");
        } catch (err) {
            setError(err.message);
            setStatus("error");
        }
    }

    /**
     * Adiciona produto ao carrinho sem enviar preco ou userId.
     *
     * @async
     * @function handleAddItem
     * @param {import("react").FormEvent<HTMLFormElement>} event - Evento submit.
     * @returns {Promise<void>}
     */
    async function handleAddItem(event) {
        event.preventDefault();
        setStatus("loading");
        setError("");

        try {
            const data = await apiRequest("/cart/items", {
                method: "POST",
                body: JSON.stringify({ productId, quantity: Number(quantity) }),
            });
            setCart(data.cart);
            setStatus(data.cart.items.length === 0 ? "empty" : "success");
        } catch (err) {
            setError(err.message);
            setStatus("error");
        }
    }

    /**
     * Atualiza a quantidade de um produto no carrinho.
     *
     * @async
     * @function updateQuantity
     * @param {string} itemProductId - Produto a atualizar.
     * @param {number} nextQuantity - Nova quantidade.
     * @returns {Promise<void>}
     */
    async function updateQuantity(itemProductId, nextQuantity) {
        setError("");

        try {
            const data = await apiRequest(`/cart/items/${itemProductId}`, {
                method: "PATCH",
                body: JSON.stringify({ quantity: nextQuantity }),
            });
            setCart(data.cart);
            setStatus(data.cart.items.length === 0 ? "empty" : "success");
        } catch (err) {
            setError(err.message);
            setStatus("error");
        }
    }

    /**
     * Remove produto do carrinho.
     *
     * @async
     * @function removeItem
     * @param {string} itemProductId - Produto a remover.
     * @returns {Promise<void>}
     */
    async function removeItem(itemProductId) {
        setError("");

        try {
            const data = await apiRequest(`/cart/items/${itemProductId}`, {
                method: "DELETE",
            });
            setCart(data.cart);
            setStatus(data.cart.items.length === 0 ? "empty" : "success");
        } catch (err) {
            setError(err.message);
            setStatus("error");
        }
    }

    return (
        <section>
            <h1>Carrinho</h1>
            <button onClick={loadCart} disabled={status === "loading"}>
                {status === "loading" ? "A carregar..." : "Ver carrinho"}
            </button>
            <form onSubmit={handleAddItem}>
                <label>
                    ID do produto
                    <input
                        value={productId}
                        onChange={(event) => setProductId(event.target.value)}
                    />
                </label>
                <label>
                    Quantidade
                    <input
                        type="number"
                        min="1"
                        max="99"
                        value={quantity}
                        onChange={(event) => setQuantity(event.target.value)}
                    />
                </label>
                <button type="submit" disabled={status === "loading"}>
                    Adicionar
                </button>
            </form>

            {status === "error" && <p role="alert">{error}</p>}
            {status === "empty" && <p>O carrinho está vazio.</p>}
            {cart?.items?.length > 0 && (
                <article>
                    <h2>Total: {(cart.totalCents / 100).toFixed(2)} EUR</h2>
                    <ul>
                        {cart.items.map((item) => (
                            <li key={item.productId}>
                                <strong>{item.name}</strong>
                                <p>
                                    {item.quantity} x{" "}
                                    {(item.priceSnapshotCents / 100).toFixed(2)} EUR
                                </p>
                                <button
                                    onClick={() =>
                                        updateQuantity(
                                            item.productId,
                                            item.quantity + 1,
                                        )
                                    }
                                >
                                    +
                                </button>
                                <button
                                    onClick={() =>
                                        updateQuantity(
                                            item.productId,
                                            Math.max(1, item.quantity - 1),
                                        )
                                    }
                                >
                                    -
                                </button>
                                <button onClick={() => removeItem(item.productId)}>
                                    Remover
                                </button>
                            </li>
                        ))}
                    </ul>
                </article>
            )}
        </section>
    );
}
