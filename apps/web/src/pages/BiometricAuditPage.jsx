/**
 * Pagina RF44 para auditoria administrativa de acessos biometricos.
 */
import { useEffect, useState } from "react";
import { apiRequest } from "../services/apiClient.js";

/**
 * Formata datas vindas da API sem bloquear caso o valor esteja ausente.
 *
 * @function formatDateTime
 * @param {string|Date|undefined|null} value - Data do evento.
 * @returns {string} Data legivel para o painel.
 */
function formatDateTime(value) {
    if (!value) return "Sem data";

    return new Intl.DateTimeFormat("pt-PT", {
        dateStyle: "short",
        timeStyle: "short",
    }).format(new Date(value));
}

/**
 * Mostra um evento de auditoria minimizado.
 *
 * @function AuditEventItem
 * @param {{event: object}} props - Evento devolvido pela API.
 * @returns {import("react").JSX.Element} Item de lista sem dados biometricos brutos.
 */
function AuditEventItem({ event }) {
    return (
        <li>
            <strong>
                {event.action} · {event.result}
            </strong>
            <p>Ator: {event.actorId}</p>
            <p>Role: {event.actorRole}</p>
            <p>Sujeito: {event.subjectUserId ?? "N/A"}</p>
            <p>
                Recurso: {event.resourceType}
                {event.resourceId ? ` · ${event.resourceId}` : ""}
            </p>
            <p>Alerta: {event.alertRaised ? "sim" : "não"}</p>
            <p>Data: {formatDateTime(event.createdAt)}</p>
            {event.reason && <p>Motivo: {event.reason}</p>}
        </li>
    );
}

/**
 * Painel administrativo de logs e alertas biometricos.
 *
 * @function BiometricAuditPage
 * @returns {import("react").JSX.Element} Auditoria minimizada para administradores.
 */
export function BiometricAuditPage() {
    const [logs, setLogs] = useState([]);
    const [alerts, setAlerts] = useState([]);
    const [status, setStatus] = useState("idle");
    const [message, setMessage] = useState("");

    /**
     * Carrega logs e alertas atraves dos endpoints administrativos reais.
     *
     * @async
     * @function loadAudit
     * @returns {Promise<void>} Atualiza estado visual e listas minimizadas.
     */
    async function loadAudit() {
        setStatus("loading");
        setMessage("");

        try {
            // O cookie HttpOnly segue por `apiRequest`; a UI nao guarda token.
            const [logsData, alertsData] = await Promise.all([
                apiRequest("/admin/biometric-audit/logs"),
                apiRequest("/admin/biometric-audit/alerts"),
            ]);
            const nextLogs = logsData.logs ?? [];
            const nextAlerts = alertsData.alerts ?? [];

            setLogs(nextLogs);
            setAlerts(nextAlerts);
            setStatus(nextLogs.length || nextAlerts.length ? "success" : "empty");
        } catch (err) {
            setMessage(err.message);
            setStatus("error");
        }
    }

    useEffect(() => {
        loadAudit();
    }, []);

    return (
        <section>
            <h1>Auditoria biométrica</h1>
            <button onClick={loadAudit} disabled={status === "loading"}>
                {status === "loading" ? "A carregar..." : "Atualizar auditoria"}
            </button>

            {status === "loading" && <p role="status">A carregar auditoria...</p>}
            {status === "empty" && <p>Sem eventos de auditoria recentes.</p>}
            {status === "error" && <p role="alert">{message}</p>}

            {(status === "success" || status === "empty") && (
                <>
                    <h2>Alertas</h2>
                    {alerts.length === 0 ? (
                        <p>Sem alertas recentes.</p>
                    ) : (
                        <ul>
                            {alerts.map((alert) => (
                                <AuditEventItem key={alert.id} event={alert} />
                            ))}
                        </ul>
                    )}

                    <h2>Eventos recentes</h2>
                    {logs.length === 0 ? (
                        <p>Sem eventos recentes.</p>
                    ) : (
                        <ul>
                            {logs.map((log) => (
                                <AuditEventItem key={log.id} event={log} />
                            ))}
                        </ul>
                    )}
                </>
            )}
        </section>
    );
}
