/**
 * Operação administrativa de encomendas com pagamento exclusivamente simulado.
 */
import { useEffect, useState } from "react";
import { AdminIconButton, AdminPageHeader, AdminStatusBadge } from "../components/AdminUi.jsx";
import { EmptyState, Skeleton } from "../components/OrelleUi.jsx";
import { apiRequest } from "../services/apiClient.js";

const ORDER_STATUS_LABELS = Object.freeze({
    pendente: "Pendente",
    enviado: "Enviada",
    entregue: "Entregue",
    cancelled: "Cancelada",
});

const PAYMENT_STATUS_LABELS = Object.freeze({
    awaiting_simulation: "A aguardar confirmação",
    simulated_paid: "Encomenda confirmada",
    simulated_failed: "Confirmação não concluída",
    cancelled_legacy: "Cancelada",
});

/**
 * Formata um valor inteiro em cêntimos para apresentação humana.
 *
 * @param {number} value - Montante em cêntimos.
 * @returns {string} Valor EUR em pt-PT.
 */
function formatMoney(value) {
    return new Intl.NumberFormat("pt-PT", {
        style: "currency",
        currency: "EUR",
    }).format(Number(value ?? 0) / 100);
}

/**
 * Devolve o passo seguinte depois de uma mutação confirmada pela API.
 *
 * @param {string} status - Estado logístico persistido.
 * @returns {string|null} Próximo estado admissível.
 */
function getFollowingStatus(status) {
    if (status === "enviado") return "entregue";
    return null;
}

/**
 * Lista encomendas e permite apenas a transição proposta pelo backend.
 *
 * @returns {JSX.Element} UI administrativa acessível de logística.
 */
export function AdminOrdersPage() {
    const [orders, setOrders] = useState([]);
    const [loadStatus, setLoadStatus] = useState("loading");
    const [loadError, setLoadError] = useState("");
    const [actionByOrder, setActionByOrder] = useState({});

    /**
     * Carrega a listagem sem apagar conteúdo anterior se o refresh falhar.
     *
     * @param {AbortSignal} [signal] - Cancelamento associado ao ciclo da página.
     * @returns {Promise<void>}
     */
    async function loadOrders(signal) {
        setLoadStatus("loading");
        setLoadError("");

        try {
            const data = await apiRequest("/admin/orders", { signal });
            setOrders(Array.isArray(data.orders) ? data.orders : []);
            setLoadStatus("success");
        } catch (error) {
            if (error.code === "REQUEST_ABORTED") return;
            setLoadError(error.message);
            setLoadStatus("error");
        }
    }

    useEffect(() => {
        const controller = new AbortController();
        loadOrders(controller.signal);
        return () => controller.abort();
    }, []);

    /**
     * Avança uma encomenda usando exclusivamente o próximo estado recebido.
     *
     * @param {object} order - Linha selecionada pelo administrador.
     * @returns {Promise<void>}
     */
    async function advanceOrder(order) {
        if (!order.nextStatus) return;

        setActionByOrder((current) => ({
            ...current,
            [order.id]: { status: "loading", message: "", error: "" },
        }));

        try {
            const data = await apiRequest(`/admin/orders/${order.id}/status`, {
                method: "PATCH",
                body: JSON.stringify({ status: order.nextStatus }),
            });
            setOrders((current) =>
                current.map((item) =>
                    item.id === order.id
                        ? {
                              ...item,
                              ...data.order,
                              nextStatus: getFollowingStatus(data.order.status),
                          }
                        : item,
                ),
            );
            setActionByOrder((current) => ({
                ...current,
                [order.id]: {
                    status: "success",
                    message: "Estado logístico atualizado e cliente notificado.",
                    error: "",
                },
            }));
        } catch (error) {
            setActionByOrder((current) => ({
                ...current,
                [order.id]: {
                    status: "error",
                    message: "",
                    error: error.message,
                },
            }));
        }
    }

    return (
        <section className="admin-page admin-orders-page">
            <AdminPageHeader eyebrow="Operações" title="Encomendas" description="Acompanha as confirmações e avança a logística com uma ação por linha." actions={<AdminIconButton icon="refresh" label="Atualizar encomendas" onClick={() => loadOrders()} disabled={loadStatus === "loading"} />} />
            <aside className="admin-operation-note"><strong>Confirmação sem cobrança</strong><span>Estas encomendas não originam movimentos financeiros. A logística só avança após a confirmação.</span></aside>

            {loadStatus === "error" ? <p role="alert">{loadError}</p> : null}
            {loadStatus === "loading" && orders.length === 0 ? (
                <Skeleton lines={5} label="A carregar encomendas" />
            ) : null}
            {loadStatus !== "loading" && orders.length === 0 ? (
                <EmptyState title="Ainda não existem encomendas" description="As encomendas aparecem automaticamente depois de serem confirmadas." />
            ) : null}

            {orders.length > 0 ? (
                <div className="admin-order-list" role="list" aria-label="Encomendas recentes">
                    {orders.map((order) => {
                        const action = actionByOrder[order.id] ?? {
                            status: "idle",
                            message: "",
                            error: "",
                        };
                        const busy = action.status === "loading";

                        return (
                            <article key={order.id} className="admin-order-row" role="listitem" aria-busy={busy}>
                                    <div className="admin-order-row__customer"><h2>{order.customerEmail || "Titular eliminado"}</h2><span>{order.itemCount} {order.itemCount === 1 ? "unidade" : "unidades"}</span></div>
                                    <div className="admin-order-row__status"><AdminStatusBadge tone={order.status === "entregue" ? "success" : order.status === "cancelled" ? "danger" : "neutral"}>{ORDER_STATUS_LABELS[order.status] ?? "Estado indisponível"}</AdminStatusBadge><small>{PAYMENT_STATUS_LABELS[order.payment?.status] ?? "Estado da confirmação indisponível"}</small></div>
                                    <strong className="admin-order-row__total">{formatMoney(order.totalCents)}</strong>
                                    <details className="admin-order-row__details"><summary>Ver produtos</summary><ul aria-label="Produtos da encomenda">
                                        {order.items.map((item, index) => (
                                            <li key={`${item.name}-${index}`}>
                                                {item.quantity} × {item.name} —{" "}
                                                {formatMoney(item.lineTotalCents)}
                                            </li>
                                        ))}
                                    </ul></details>

                                    {order.nextStatus ? (
                                        <AdminIconButton
                                            icon="arrow-right"
                                            label={`Marcar como ${ORDER_STATUS_LABELS[order.nextStatus]?.toLowerCase() ?? "estado indisponível"}`}
                                            onClick={() => advanceOrder(order)}
                                            disabled={busy}
                                            aria-describedby={`order-action-${order.id}`}
                                        />
                                    ) : (
                                        <span className="admin-order-row__complete">Sem ações pendentes</span>
                                    )}

                                    <div id={`order-action-${order.id}`}>
                                        {action.status === "error" ? (
                                            <p role="alert">{action.error}</p>
                                        ) : null}
                                        {action.status === "success" ? (
                                            <p role="status">{action.message}</p>
                                        ) : null}
                                    </div>
                            </article>
                        );
                    })}
                </div>
            ) : null}
        </section>
    );
}
