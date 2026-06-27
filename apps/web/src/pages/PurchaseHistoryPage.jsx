/**
 * Pagina de historico de compras e recompra.
 */
import { useState } from "react";
import { apiRequest } from "../services/apiClient.js";

/**
 * Lista encomendas pessoais e permite recomprar para o carrinho.
 *
 * @function PurchaseHistoryPage
 * @returns {JSX.Element} UI de historico e recompra.
 */
export function PurchaseHistoryPage() {
    const [orders, setOrders] = useState([]);
    const [status, setStatus] = useState("idle");
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    /**
     * Carrega historico pessoal.
     *
     * @async
     * @function loadOrders
     * @returns {Promise<void>}
     */
    async function loadOrders() {
        setStatus("loading");
        setError("");
        setMessage("");

        try {
            const data = await apiRequest("/me/orders");
            setOrders(data.orders);
            setStatus(data.orders.length === 0 ? "empty" : "success");
        } catch (err) {
            setError(err.message);
            setStatus("error");
        }
    }

    /**
     * Adiciona produtos de encomenda anterior ao carrinho.
     *
     * @async
     * @function reorder
     * @param {string} orderId - Encomenda original.
     * @returns {Promise<void>}
     */
    async function reorder(orderId) {
        setError("");
        setMessage("");

        try {
            const data = await apiRequest(`/me/orders/${orderId}/reorder`, {
                method: "POST",
            });
            setMessage(
                data.skipped.length === 0
                    ? "Produtos adicionados ao carrinho."
                    : "Produtos disponíveis adicionados; alguns ficaram indisponíveis.",
            );
        } catch (err) {
            setError(err.message);
            setStatus("error");
        }
    }

    return (
        <section>
            <h1>Histórico de compras</h1>
            <button onClick={loadOrders} disabled={status === "loading"}>
                {status === "loading" ? "A carregar..." : "Ver compras"}
            </button>

            {message && <p>{message}</p>}
            {status === "error" && <p role="alert">{error}</p>}
            {status === "empty" && <p>Ainda não existem encomendas.</p>}
            {status === "success" && (
                <ol>
                    {orders.map((order) => (
                        <li key={order.id}>
                            <article>
                                <h2>
                                    {new Date(order.createdAt).toLocaleDateString(
                                        "pt-PT",
                                    )}
                                </h2>
                                <p>Estado: {order.status}</p>
                                <p>Total: {(order.totalCents / 100).toFixed(2)} EUR</p>
                                <ul>
                                    {order.items.map((item) => (
                                        <li key={item.productId}>
                                            {item.name} x {item.quantity}
                                        </li>
                                    ))}
                                </ul>
                                <button onClick={() => reorder(order.id)}>
                                    Recomprar
                                </button>
                            </article>
                        </li>
                    ))}
                </ol>
            )}
        </section>
    );
}
