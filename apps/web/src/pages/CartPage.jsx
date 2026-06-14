import { useEffect, useState } from "react";
import { apiRequest } from "../services/apiClient.js";

/**
 * Formata valores guardados em cêntimos para euro em pt-PT.
 * @param {number} cents - Valor em cêntimos.
 * @returns {string} Valor formatado como moeda.
 */
function formatPrice(cents) {
    return new Intl.NumberFormat("pt-PT", { style: "currency", currency: "EUR" }).format(cents / 100);
}

/**
 * Página que permite consultar, atualizar e remover itens do carrinho.
 * @returns {JSX.Element} Interface do carrinho autenticado.
 */
export function CartPage() {
    const [cart, setCart] = useState(null);
    const [status, setStatus] = useState("loading");
    const [error, setError] = useState("");

    /**
     * Carrega o carrinho do utilizador autenticado.
     * @returns {Promise<void>}
     */
    async function loadCart() {
        setStatus("loading");
        setError("");
        try {
            // A sessão via cookie identifica o cliente; a UI não envia userId.
            const data = await apiRequest("/cart", { credentials: "include" });
            setCart(data.cart);
            setStatus("success");
        } catch (err) {
            setError(err.message || "Não foi possível carregar o carrinho.");
            setStatus("error");
        }
    }

    /**
     * Atualiza a quantidade de um produto no carrinho.
     * @param {string} productId - Produto a atualizar.
     * @param {number} quantity - Nova quantidade pretendida.
     * @returns {Promise<void>}
     */
    async function updateQuantity(productId, quantity) {
        setError("");
        try {
            const data = await apiRequest(`/cart/items/${productId}`, {
                method: "PATCH",
                credentials: "include",
                body: JSON.stringify({ quantity }),
            });
            setCart(data.cart);
        } catch (err) {
            setError(err.message || "Não foi possível atualizar a quantidade.");
        }
    }

    /**
     * Remove um produto do carrinho.
     * @param {string} productId - Produto a remover.
     * @returns {Promise<void>}
     */
    async function removeItem(productId) {
        setError("");
        try {
            const data = await apiRequest(`/cart/items/${productId}`, {
                method: "DELETE",
                credentials: "include",
            });
            setCart(data.cart);
        } catch (err) {
            setError(err.message || "Não foi possível remover o produto.");
        }
    }

    useEffect(() => {
        loadCart();
    }, []);

    if (status === "loading") return <p>A carregar carrinho...</p>;
    if (status === "error") return <p role="alert">{error}</p>;

    const items = cart?.items || [];

    return (
        <main>
            <h1>Carrinho</h1>
            {error ? <p role="alert">{error}</p> : null}
            {items.length === 0 ? (
                <p>O carrinho está vazio.</p>
            ) : (
                <section>
                    {items.map((item) => (
                        <article key={item.productId}>
                            <h2>{item.name}</h2>
                            <p>Preço unitário: {formatPrice(item.unitPriceCents)}</p>
                            <label>
                                Quantidade
                                <input
                                    type="number"
                                    min="1"
                                    max="99"
                                    value={item.quantity}
                                    onChange={(event) => updateQuantity(item.productId, Number(event.target.value))}
                                />
                            </label>
                            <p>Total da linha: {formatPrice(item.lineTotalCents)}</p>
                            <button type="button" onClick={() => removeItem(item.productId)}>
                                Remover
                            </button>
                        </article>
                    ))}
                    <strong>Total: {formatPrice(cart.totalCents)}</strong>
                </section>
            )}
        </main>
    );
}