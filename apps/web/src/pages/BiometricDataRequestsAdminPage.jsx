/**
 * Painel RF41 para revisao de pedidos de privacidade biometrica.
 */
import { useEffect, useState } from "react";
import { apiRequest } from "../services/apiClient.js";

/**
 * Formata listas curtas de recursos para leitura no painel.
 *
 * @function formatResources
 * @param {string[]} resources - Recursos pedidos pelo cliente.
 * @returns {string} Recursos formatados sem dados sensiveis.
 */
function formatResources(resources = []) {
    return resources.join(", ") || "sem recursos";
}

/**
 * Painel de revisao de pedidos de eliminacao/anonymizacao de dados faciais.
 *
 * @function BiometricDataRequestsAdminPage
 * @returns {import("react").JSX.Element} Lista minimizada de pedidos e acoes de decisao.
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
     * Envia a decisao do revisor para a API.
     *
     * @async
     * @function decideRequest
     * @param {string} requestId - Pedido biometrico a decidir.
     * @param {"approved"|"rejected"} decision - Decisao escolhida no painel.
     * @returns {Promise<void>} Recarrega a lista apos decisao.
     */
    async function decideRequest(requestId, decision) {
        setStatus("loading");
        setMessage("");

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
            await loadRequests();
        } catch (err) {
            setMessage(err.message);
            setStatus("error");
        }
    }

    return (
        <section>
            <h1>Pedidos de privacidade biométrica</h1>
            <button onClick={loadRequests} disabled={status === "loading"}>
                {status === "loading" ? "A carregar..." : "Atualizar pedidos"}
            </button>

            {status === "loading" && <p role="status">A carregar pedidos...</p>}
            {status === "empty" && <p>Sem pedidos para rever.</p>}
            {status === "error" && <p role="alert">{message}</p>}

            {requests.length > 0 && (
                <ul>
                    {requests.map((item) => (
                        <li key={item.id}>
                            <strong>
                                {item.action} · {item.status}
                            </strong>
                            <p>Pedido: {item.id}</p>
                            <p>Utilizador: {item.requesterId}</p>
                            <p>Recursos: {formatResources(item.resources)}</p>
                            <p>Motivo: {item.reason || "Sem motivo indicado."}</p>
                            {item.status === "pending" && (
                                <p>
                                    <button
                                        onClick={() =>
                                            decideRequest(item.id, "approved")
                                        }
                                        disabled={status === "loading"}
                                    >
                                        Aprovar
                                    </button>
                                    <button
                                        onClick={() =>
                                            decideRequest(item.id, "rejected")
                                        }
                                        disabled={status === "loading"}
                                    >
                                        Rejeitar
                                    </button>
                                </p>
                            )}
                        </li>
                    ))}
                </ul>
            )}
        </section>
    );
}
