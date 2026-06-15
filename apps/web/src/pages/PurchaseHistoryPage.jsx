import { useEffect, useState } from "react";
import { apiRequest } from "../services/apiClient.js";

/**
 * Formata valores em cêntimos para moeda euro.
 * @param {number} cents - Valor em cêntimos.
 * @returns {string} Valor formatado em pt-PT.
 */
function euros(cents) {
    return new Intl.NumberFormat("pt-PT", { style: "currency", currency: "EUR" }).format(cents / 100);
}

export function PurchaseHistoryPage() {
    const [orders, setOrders] = useState([]);
    const [status, setStatus] = useState("loading");
    const [reorderingOrderId, setReorderingOrderId] = useState("");
    const [notice, setNotice] = useState("");
    const [error, setError] = useState("");

    useEffect(() => {
        /**
         * Carrega as encomendas do próprio cliente.
         * @returns {Promise<void>}
         */
        async function loadOrders() {
            try {
                const data = await apiRequest("/me/orders", { credentials: "include" });
                setOrders(data.orders);
                setStatus("success");
            } catch (err) {
                setError(err.message || "Não foi possível carregar o histórico.");
                setStatus("error");
            }
        }

        loadOrders();
    }, []);

    /**
     * Pede ao backend para recriar no carrinho os produtos disponíveis da encomenda.
     * @param {string} orderId - Encomenda antiga do cliente.
     * @returns {Promise<void>}
     */
    async function reorder(orderId) {
        setError("");
        setNotice("");
        setReorderingOrderId(orderId);

        try {
            // Esta ação não paga nem cria encomenda; apenas atualiza o carrinho.
            const data = await apiRequest(`/me/orders/${orderId}/reorder`, {
                method: "POST",
                credentials: "include",
            });
            const skippedCount = Array.isArray(data.skipped) ? data.skipped.length : 0;
            setNotice(
                skippedCount === 0
                    ? "Produtos adicionados ao carrinho."
                    : `Produtos disponíveis adicionados. ${skippedCount} produto(s) não foram adicionados.`,
            );
        } catch (err) {
            setError(err.message || "Não foi possível recomprar.");
        } finally {
            setReorderingOrderId("");
        }
    }

        loadOrders();
    }, []);

    if (status === "loading") return <p>A carregar histórico...</p>;
    if (status === "error") return <p role="alert">{error}</p>;

    return (
        <main>
            <h1>Histórico de compras</h1>
            {notice ? <p>{notice}</p> : null}
            {error ? <p role="alert">{error}</p> : null}
            {orders.length === 0 ? (
                <p>Ainda não existem compras.</p>
            ) : (
                orders.map((order) => (
                    <article key={order.id}>
                        <h2>{new Date(order.createdAt).toLocaleDateString("pt-PT")}</h2>
                        <p>Estado: {order.orderStatus}</p>
                        <p>Total: {euros(order.totalCents)}</p>
                        <ul>
                            {order.items.map((item) => (
                                <li key={item.productId}>
                                    {item.quantity} x {item.name} - {euros(item.lineTotalCents)}
                                </li>
                            ))}
                        </ul>
                        <button
                            type="button"
                            onClick={() => reorder(order.id)}
                            disabled={reorderingOrderId === order.id}
                        >
                            {reorderingOrderId === order.id ? "A adicionar..." : "Recomprar"}
                        </button>
                    </article>
                ))
            )}
        </main>
    );
}