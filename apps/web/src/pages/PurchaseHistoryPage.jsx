// client/src/pages/PurchaseHistoryPage.jsx
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

/**
 * Página que mostra o histórico de compras do cliente autenticado.
 * @returns {JSX.Element} Interface do histórico pessoal.
 */
export function PurchaseHistoryPage() {
    const [orders, setOrders] = useState([]);
    const [status, setStatus] = useState("loading");
    const [error, setError] = useState("");

    useEffect(() => {
        /**
         * Carrega encomendas pessoais sem enviar userId no pedido.
         * @returns {Promise<void>}
         */
        async function loadOrders() {
            try {
                // A rota /me usa a sessão; não há seleção de utilizador no browser.
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

    if (status === "loading") return <p>A carregar histórico...</p>;
    if (status === "error") return <p role="alert">{error}</p>;

    return (
        <main>
            <h1>Histórico de compras</h1>
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
                    </article>
                ))
            )}
        </main>
    );
}