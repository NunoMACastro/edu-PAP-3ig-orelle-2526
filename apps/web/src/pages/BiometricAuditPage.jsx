/**
 * Pagina RF44 para auditoria administrativa de acessos biometricos.
 */
import { useCallback, useEffect, useState } from "react";
import { AdminIconButton, AdminLoadMore, AdminPageHeader } from "../components/AdminUi.jsx";
import { EmptyState, Skeleton } from "../components/OrelleUi.jsx";
import { apiRequest } from "../services/apiClient.js";
import {
    getBiometricAuditEventLabel,
    getBiometricAuditOutcomeLabel,
    getBiometricAuditResourceLabel,
    getUserRoleLabel,
} from "../services/presentationLabels.js";

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
        <li className="admin-audit-row">
            <header>
                <strong>{getBiometricAuditEventLabel(event.action)}</strong>
                <span>{getBiometricAuditOutcomeLabel(event.result)}</span>
                <time dateTime={event.createdAt ?? undefined}>{formatDateTime(event.createdAt)}</time>
            </header>
            <dl>
                <div><dt>Ator</dt><dd>{event.actorLabel ?? getUserRoleLabel(event.actorRole)}</dd></div>
                <div><dt>Titular</dt><dd>{event.subjectLabel ?? "Titular protegido"}</dd></div>
                <div><dt>Recurso</dt><dd>{getBiometricAuditResourceLabel(event.resourceType)}</dd></div>
                <div><dt>Alerta</dt><dd>{event.alertRaised ? "Sim" : "Não"}</dd></div>
            </dl>
            {event.reason ? <p>{event.reason}</p> : null}
        </li>
    );
}

/** Junta páginas por ID sem repetir eventos quando o cursor avança. */
function appendUniqueEvents(current, incoming) {
    const knownIds = new Set(current.map(({ id }) => id));
    return [
        ...current,
        ...incoming.filter(({ id }) => !knownIds.has(id)),
    ];
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
    const [logsPageInfo, setLogsPageInfo] = useState({
        nextCursor: null,
        hasMore: false,
    });
    const [alertsPageInfo, setAlertsPageInfo] = useState({
        nextCursor: null,
        hasMore: false,
    });
    const [logsMoreStatus, setLogsMoreStatus] = useState("idle");
    const [alertsMoreStatus, setAlertsMoreStatus] = useState("idle");

    /**
     * Carrega logs e alertas atraves dos endpoints administrativos reais.
     *
     * @async
     * @function loadAudit
     * @returns {Promise<void>} Atualiza estado visual e listas minimizadas.
     */
    const loadAudit = useCallback(async () => {
        setStatus("loading");
        setMessage("");

        try {
            // O cookie HttpOnly segue por `apiRequest`; a UI nao guarda token.
            const [logsData, alertsData] = await Promise.all([
                apiRequest("/admin/biometric-audit/logs?limit=20"),
                apiRequest("/admin/biometric-audit/alerts?limit=10"),
            ]);
            const nextLogs = logsData.logs ?? [];
            const nextAlerts = alertsData.alerts ?? [];

            setLogs(nextLogs);
            setAlerts(nextAlerts);
            setLogsPageInfo(logsData.pageInfo ?? { nextCursor: null, hasMore: false });
            setAlertsPageInfo(alertsData.pageInfo ?? { nextCursor: null, hasMore: false });
            setStatus(nextLogs.length || nextAlerts.length ? "success" : "empty");
        } catch (err) {
            setMessage(err.message);
            setStatus("error");
        }
    }, []);

    /** Carrega a página seguinte de uma coleção sem apagar resultados válidos. */
    async function loadMore(kind) {
        const isLogs = kind === "logs";
        const pageInfo = isLogs ? logsPageInfo : alertsPageInfo;
        const setMoreStatus = isLogs ? setLogsMoreStatus : setAlertsMoreStatus;
        if (!pageInfo.hasMore || !pageInfo.nextCursor) return;

        setMoreStatus("loading");
        setMessage("");
        try {
            const limit = isLogs ? 20 : 10;
            const data = await apiRequest(
                `/admin/biometric-audit/${kind}?limit=${limit}&cursor=${encodeURIComponent(pageInfo.nextCursor)}`,
            );
            const nextItems = Array.isArray(data[kind]) ? data[kind] : [];
            if (isLogs) {
                setLogs((current) => appendUniqueEvents(current, nextItems));
                setLogsPageInfo(data.pageInfo ?? { nextCursor: null, hasMore: false });
            } else {
                setAlerts((current) => appendUniqueEvents(current, nextItems));
                setAlertsPageInfo(data.pageInfo ?? { nextCursor: null, hasMore: false });
            }
            setMoreStatus("success");
        } catch (err) {
            setMessage(err.message);
            setMoreStatus("error");
        }
    }

    useEffect(() => {
        void loadAudit();
    }, [loadAudit]);

    return (
        <section className="admin-page admin-audit-page">
            <AdminPageHeader eyebrow="Definições" title="Auditoria" description="Consulta eventos e alertas biométricos minimizados, sem expor fotografias ou dados brutos." actions={<AdminIconButton icon="refresh" label="Atualizar auditoria" onClick={loadAudit} disabled={status === "loading"} />} />

            {status === "loading" && <Skeleton lines={5} label="A carregar auditoria" />}
            {status === "empty" && <EmptyState title="Sem eventos recentes" description="Não existem acessos biométricos ou alertas para apresentar." />}
            {message && <p role="alert">{message}</p>}

            {(status === "success" || status === "empty") && (
                <>
                    <section className={`admin-panel admin-audit-alerts ${alerts.length === 0 ? "admin-audit-alerts--empty" : ""}`}>
                        <header>
                            <div><p>Monitorização</p><h2>Alertas</h2></div>
                            <span>{alerts.length} {alerts.length === 1 ? "alerta" : "alertas"}</span>
                        </header>
                        {alerts.length === 0 ? (
                            <p>Não existem alertas biométricos recentes.</p>
                        ) : (
                            <ul className="admin-audit-list admin-audit-list--alerts">
                                {alerts.map((alert) => <AuditEventItem key={alert.id} event={alert} />)}
                            </ul>
                        )}
                        <AdminLoadMore
                            hasMore={alertsPageInfo.hasMore}
                            loading={alertsMoreStatus === "loading"}
                            onLoad={() => void loadMore("alerts")}
                        >
                            Carregar mais alertas
                        </AdminLoadMore>
                    </section>

                    <section className="admin-panel admin-audit-events">
                        <header>
                            <div><p>Histórico minimizado</p><h2>Eventos recentes</h2></div>
                            <span>{logs.length} {logs.length === 1 ? "evento" : "eventos"}</span>
                        </header>
                        {logs.length === 0 ? (
                            <EmptyState title="Sem eventos recentes" description="Os acessos auditáveis aparecem automaticamente nesta lista." />
                        ) : (
                            <ul className="admin-audit-list">
                                {logs.map((log) => <AuditEventItem key={log.id} event={log} />)}
                            </ul>
                        )}
                        <AdminLoadMore
                            hasMore={logsPageInfo.hasMore}
                            loading={logsMoreStatus === "loading"}
                            onLoad={() => void loadMore("logs")}
                        >
                            Carregar mais eventos
                        </AdminLoadMore>
                    </section>
                </>
            )}
        </section>
    );
}
