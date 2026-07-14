/**
 * Pagina de historico de compras e recompra.
 */
import { useEffect, useRef, useState } from "react";
import { EmptyState, PageHero, Skeleton } from "../components/OrelleUi.jsx";
import { apiRequest } from "../services/apiClient.js";

const ORDER_STATUS_LABELS = Object.freeze({
    pendente: "Pendente",
    enviado: "Enviada",
    entregue: "Entregue",
    cancelled: "Cancelada",
    cancelled_legacy: "Cancelada",
});

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
    const [actionError, setActionError] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [reorderBusyId, setReorderBusyId] = useState("");
    const loadInFlightRef = useRef(false);
    const reorderInFlightRef = useRef(false);

    useEffect(() => {
        let active = true;
        setIsLoading(true);
        setStatus("loading");
        apiRequest("/me/orders")
            .then((data) => {
                if (!active) return;
                setOrders(data.orders);
                setStatus(data.orders.length === 0 ? "empty" : "success");
            })
            .catch((requestError) => {
                if (!active) return;
                setError(requestError.message);
                setStatus("error");
            })
            .finally(() => {
                if (active) setIsLoading(false);
            });
        return () => { active = false; };
    }, []);

    /**
     * Carrega historico pessoal.
     *
     * @async
     * @function loadOrders
     * @returns {Promise<void>}
     */
    async function loadOrders() {
        if (loadInFlightRef.current) return;
        loadInFlightRef.current = true;
        setIsLoading(true);
        setError("");
        setActionError("");
        setMessage("");

        try {
            const data = await apiRequest("/me/orders");
            setOrders(data.orders);
            setStatus(data.orders.length === 0 ? "empty" : "success");
        } catch (err) {
            setError(err.message);
            if (orders.length === 0) setStatus("error");
        } finally {
            loadInFlightRef.current = false;
            setIsLoading(false);
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
        if (reorderInFlightRef.current) return;
        reorderInFlightRef.current = true;
        setReorderBusyId(orderId);
        setActionError("");
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
            setActionError(err.message);
        } finally {
            reorderInFlightRef.current = false;
            setReorderBusyId("");
        }
    }

    return (
        <section className="client-list-page purchase-history">
            <PageHero eyebrow="Compras" title="As tuas encomendas" description="Consulta o percurso de cada encomenda e volta a escolher os teus favoritos." />
            <button type="button" onClick={loadOrders} disabled={isLoading}>
                {isLoading ? "A atualizar..." : "Atualizar encomendas"}
            </button>

            {message && <p>{message}</p>}
            {status === "error" && <p role="alert">{error}</p>}
            {status !== "error" && error && (
                <p role="alert">{error} As compras carregadas permanecem visíveis.</p>
            )}
            {actionError && <p role="alert">{actionError}</p>}
            {status === "idle" || (isLoading && orders.length === 0) ? <Skeleton lines={4} /> : null}
            {status === "empty" && <EmptyState title="Ainda não existem encomendas" description="Quando encontrares os produtos certos para ti, o respetivo acompanhamento aparece aqui." />}
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
                                <p>
                                    Estado:{" "}
                                    {ORDER_STATUS_LABELS[order.status] ??
                                        "Estado indisponível"}
                                </p>
                                <p>Total: {(order.totalCents / 100).toFixed(2)} EUR</p>
                                <ul>
                                    {order.items.map((item) => (
                                        <li key={item.productId}>
                                            {item.name} x {item.quantity}
                                        </li>
                                    ))}
                                </ul>
                                <button
                                    type="button"
                                    onClick={() => reorder(order.id)}
                                    disabled={reorderBusyId === order.id}
                                    aria-label={`Recomprar encomenda de ${new Date(order.createdAt).toLocaleDateString("pt-PT")}`}
                                >
                                    {reorderBusyId === order.id ? "A adicionar..." : "Recomprar"}
                                </button>
                            </article>
                        </li>
                    ))}
                </ol>
            )}
        </section>
    );
}
