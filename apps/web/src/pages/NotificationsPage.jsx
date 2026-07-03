/**
 * Inbox de notificacoes internas do cliente.
 */
import { useState } from "react";
import { apiRequest } from "../services/apiClient.js";

export function NotificationsPage() {
    const [notifications, setNotifications] = useState([]);
    const [status, setStatus] = useState("idle");
    const [message, setMessage] = useState("");

    async function loadNotifications() {
        setStatus("loading");
        setMessage("");

        try {
            const data = await apiRequest("/me/notifications");
            setNotifications(data.notifications);
            setStatus(data.notifications.length === 0 ? "empty" : "success");
        } catch (err) {
            setMessage(err.message);
            setStatus("error");
        }
    }

    async function markAsRead(notificationId) {
        try {
            const data = await apiRequest(
                `/me/notifications/${notificationId}/read`,
                { method: "PATCH" },
            );
            setNotifications((items) =>
                items.map((item) =>
                    item.id === notificationId ? data.notification : item,
                ),
            );
        } catch (err) {
            setMessage(err.message);
            setStatus("error");
        }
    }

    return (
        <section>
            <h1>Notificações</h1>
            <button onClick={loadNotifications} disabled={status === "loading"}>
                {status === "loading" ? "A carregar..." : "Ver notificações"}
            </button>
            {status === "error" && <p role="alert">{message}</p>}
            {status === "empty" && <p>Sem notificações.</p>}
            {status === "success" && (
                <ul>
                    {notifications.map((notification) => (
                        <li key={notification.id}>
                            <article>
                                <h2>{notification.title}</h2>
                                <p>{notification.message}</p>
                                <p>{notification.isRead ? "Lida" : "Por ler"}</p>
                                {!notification.isRead && (
                                    <button onClick={() => markAsRead(notification.id)}>
                                        Marcar como lida
                                    </button>
                                )}
                            </article>
                        </li>
                    ))}
                </ul>
            )}
        </section>
    );
}
