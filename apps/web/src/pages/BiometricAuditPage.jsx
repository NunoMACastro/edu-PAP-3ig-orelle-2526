import React, { useEffect, useState } from "react";
import { apiRequest } from "../services/apiClient.js";

/**
 * Mostra auditoria biométrica para administradores.
 *
 * @function BiometricAuditPage
 * @returns {JSX.Element} Lista de eventos e alertas minimizados.
 */
export function BiometricAuditPage() {
    const [logs, setLogs] = useState([]);
    const [alerts, setAlerts] = useState([]);
    const [status, setStatus] = useState("loading");
    const [error, setError] = useState("");

    useEffect(() => {
        async function loadAudit() {
            try {
                // Os dois pedidos usam o mesmo cookie HttpOnly através de `apiRequest`.
                const [logsData, alertsData] = await Promise.all([
                    apiRequest("/admin/biometric-audit/logs"),
                    apiRequest("/admin/biometric-audit/alerts"),
                ]);
                setLogs(logsData.logs ?? []);
                setAlerts(alertsData.alerts ?? []);
                setStatus("success");
            } catch (err) {
                setError(err.message);
                setStatus("error");
            }
        }

        loadAudit();
    }, []);

    return (
        <section>
            <h1>Auditoria biométrica</h1>
            {status === "loading" && <p role="status">A carregar auditoria...</p>}
            {status === "error" && <p role="alert">{error}</p>}
            {status === "success" && (
                <>
                    <h2>Alertas</h2>
                    {alerts.length === 0 && <p>Sem alertas recentes.</p>}
                    <ul>
                        {/* A UI mostra metadados de auditoria, não imagens nem relatórios completos. */}
                        {alerts.map((alert) => (
                            <li key={alert.id}>
                                <strong>{alert.action}</strong>
                                <p>Ator: {alert.actorId}</p>
                                <p>Recurso: {alert.resourceType}</p>
                            </li>
                        ))}
                    </ul>

                    <h2>Eventos recentes</h2>
                    <ul>
                        {/* O resultado permite defesa PAP sem revelar dados biométricos do sujeito. */}
                        {logs.map((log) => (
                            <li key={log.id}>
                                <strong>{log.action}</strong>
                                <p>Resultado: {log.result}</p>
                                <p>Alerta: {log.alertRaised ? "sim" : "não"}</p>
                            </li>
                        ))}
                    </ul>
                </>
            )}
        </section>
    );
}