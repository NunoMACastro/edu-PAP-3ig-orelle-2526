/**
 * Painel RNF13/RF41 para revisão de pedidos de privacidade biométrica.
 */
import { useEffect, useState } from "react";
import { FeedbackMessage } from "../components/FeedbackMessage.jsx";
import { apiRequest } from "../services/apiClient.js";

/**
 * Formata listas curtas de recursos para leitura no painel.
 *
 * @function formatResources
 * @param {string[]} resources - Recursos pedidos pelo cliente.
 * @returns {string} Recursos formatados sem dados sensíveis.
 */
function formatResources(resources = []) {
    return resources.join(", ") || "sem recursos";
}

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
     * Envia a decisão do revisor para a API.
     *
     * @async
     * @function decideRequest
     * @param {string} requestId - Pedido biométrico a decidir.
     * @param {"approved"|"rejected"} decision - Decisão escolhida no painel.
     * @returns {Promise<void>} Recarrega a lista após decisão.
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
                                ? "Pedido aprovado no painel de privacidade."
                                : "Pedido rejeitado após revisão.",
                    }),
                },
            );
            await loadRequests();
        } catch (err) {
            // A mensagem vem do backend e não inclui fotografias, relatórios ou paths internos.
            setMessage(err.message);
            setStatus("error");
        }
    }

    const isBusy = status === "loading";

    return (
        <section>
            <h1>Pedidos de privacidade biométrica</h1>
            <button onClick={loadRequests} disabled={isBusy}>
                {isBusy ? "A carregar..." : "Atualizar pedidos"}
            </button>

            {isBusy && <p role="status">A carregar pedidos...</p>}
            {status === "empty" && <p>Sem pedidos para rever.</p>}
            {status === "error" && (
                <FeedbackMessage type="error">{message}</FeedbackMessage>
            )}

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
                                        type="button"
                                        disabled={isBusy}
                                        onClick={() => decideRequest(item.id, "approved")}
                                    >
                                        {isBusy ? "A aprovar..." : "Aprovar"}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => decideRequest(item.id, "rejected")}
                                        disabled={isBusy}
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