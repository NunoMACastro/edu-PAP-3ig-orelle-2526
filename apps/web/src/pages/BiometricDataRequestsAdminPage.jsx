// apps/web/src/pages/BiometricDataRequestsAdminPage.jsx
import React, { useEffect, useState } from "react";
import { apiRequest } from "../services/apiClient.js";

/**
 * Painel de revisão de pedidos de eliminação/anonymização de dados faciais.
 *
 * @function BiometricDataRequestsAdminPage
 * @returns {JSX.Element} Lista minimizada de pedidos e ações de decisão.
 */
export function BiometricDataRequestsAdminPage() {
    const [requests, setRequests] = useState([]);
    const [status, setStatus] = useState("idle");
    const [message, setMessage] = useState("");

    /**
     * Carrega pedidos minimizados do painel.
     *
     * @async
     * @function loadRequests
     * @returns {Promise<void>} Atualiza a lista e o estado visual.
     */
    async function loadRequests() {
        setStatus("loading");
        setMessage("");

        try {
            const data = await apiRequest("/admin/biometric-data-requests");
            const nextRequests = data.requests ?? [];

            setRequests(nextRequests);
            setStatus(nextRequests.length ? "success" : "empty");
        } catch (err) {
            setMessage(err.message);
            setStatus("error");
        }
    }

    useEffect(() => {
        loadRequests();
    }, []);

    /**
     * Envia decisão do revisor para a API.
     *
     * @async
     * @function decideRequest
     * @param {string} requestId - Pedido biométrico a decidir.
     * @param {"approved"|"rejected"} decision - Decisão escolhida no painel.
     * @returns {Promise<void>} Recarrega a lista após decisão.
     */
    async function decideRequest(requestId, decision) {
        setStatus("loading");

        try {
            await apiRequest(
                `/admin/biometric-data-requests/${requestId}/decision`,
                {
                    method: "PATCH",
                    body: JSON.stringify({
                        decision,
                        decisionReason:
                            decision === "approved"
                                ? "Pedido aprovado no painel MF5."
                                : "Pedido rejeitado após revisão.",
                    }),
                },
            );
            // Recarregar evita ações repetidas sobre pedidos já decididos.
            await loadRequests();
        } catch (err) {
            setMessage(err.message);
            setStatus("error");
        }
    }

    return (
        <section className="panel">
            <h2>Pedidos de privacidade biométrica</h2>

            {status === "loading" && <p role="status">A carregar pedidos...</p>}
            {status === "empty" && <p>Sem pedidos para rever.</p>}
            {status === "error" && <p role="alert">{message}</p>}

            <ul className="data-list">
                {requests.map((request) => (
                    <li key={request.id} className="data-list-item">
                        <strong>{request.action}</strong>
                        <p>Recursos: {request.resources.join(", ")}</p>
                        <p>Estado: {request.status}</p>
                        <p>Motivo: {request.reason || "Sem motivo indicado."}</p>
                        {request.status === "pending" && (
                            <p className="button-row">
                                <button onClick={() => decideRequest(request.id, "approved")}>
                                    Aprovar
                                </button>
                                <button onClick={() => decideRequest(request.id, "rejected")}>
                                    Rejeitar
                                </button>
                            </p>
                        )}
                    </li>
                ))}
            </ul>
        </section>
    );
}