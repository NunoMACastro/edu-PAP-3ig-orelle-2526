/**
 * Inbox de notificações internas do cliente.
 */
import { useEffect } from "react";
import { EmptyState, PageHero, Skeleton } from "../components/OrelleUi.jsx";
import { collectionResourceStatus } from "../hooks/asyncOperation.js";
import { useAsyncAction } from "../hooks/useAsyncAction.js";
import { useAsyncResource } from "../hooks/useAsyncResource.js";
import { apiRequest } from "../services/apiClient.js";

/**
 * Apresenta a inbox de notificacoes do cliente autenticado.
 *
 * @function NotificationsPage
 * @returns {JSX.Element} UI de notificacoes pessoais.
 */
export function NotificationsPage() {
    const notificationsResource = useAsyncResource(
        async ({ signal }) => {
            const data = await apiRequest("/me/notifications", { signal });
            return Array.isArray(data.notifications) ? data.notifications : [];
        },
        {
            initialData: [],
            statusFromData: collectionResourceStatus,
        },
    );
    const readAction = useAsyncAction(async ({ signal }, notificationId) => {
        const data = await apiRequest(
            `/me/notifications/${notificationId}/read`,
            { method: "PATCH", signal },
        );
        return data.notification;
    });
    const notifications = notificationsResource.data;
    const loadNotificationsResource = notificationsResource.load;

    useEffect(() => {
        void loadNotificationsResource();
    }, [loadNotificationsResource]);

    /**
     * Carrega as notificacoes pessoais e ajusta o estado visual da pagina.
     *
     * @async
     * @function loadNotifications
     * @returns {Promise<void>}
     */
    async function loadNotifications() {
        await notificationsResource.load();
    }

    /**
     * Marca uma notificacao propria como lida e substitui o item atualizado.
     *
     * @async
     * @function markAsRead
     * @param {string} notificationId - Notificacao alvo.
     * @returns {Promise<void>}
     */
    async function markAsRead(notificationId) {
        const result = await readAction.run(notificationId);
        if (!result.ok) return;

        notificationsResource.setData((items) =>
            items.map((item) =>
                item.id === notificationId ? result.data : item,
            ),
        );
    }

    return (
        <section className="client-list-page notifications-page">
            <PageHero eyebrow="Conta" title="Notificações" description="Atualizações relevantes sobre a tua experiência Orélle, organizadas num só lugar." />
            <button
                type="button"
                onClick={loadNotifications}
                disabled={notificationsResource.status === "loading"}
            >
                {notificationsResource.status === "loading"
                    ? "A carregar..."
                    : "Atualizar"}
            </button>
            {notificationsResource.status === "error" ? (
                <p role="alert">{notificationsResource.error.message}</p>
            ) : null}
            {readAction.status === "error" ? (
                <p role="alert">{readAction.error.message}</p>
            ) : null}
            {notificationsResource.status === "loading" && notifications.length === 0 ? <Skeleton lines={4} /> : null}
            {notificationsResource.status === "empty" ? <EmptyState title="Estás a par de tudo" description="Não tens novas notificações neste momento." /> : null}
            {notifications.length > 0 ? (
                <ul aria-busy={notificationsResource.status === "loading"}>
                    {notifications.map((notification) => (
                        <li key={notification.id}>
                            <article>
                                <h2>{notification.title}</h2>
                                <p>{notification.message}</p>
                                <p>{notification.isRead ? "Lida" : "Por ler"}</p>
                                {!notification.isRead && (
                                    <button
                                        type="button"
                                        onClick={() => markAsRead(notification.id)}
                                        disabled={readAction.status === "loading"}
                                    >
                                        Marcar como lida
                                    </button>
                                )}
                            </article>
                        </li>
                    ))}
                </ul>
            ) : null}
        </section>
    );
}
