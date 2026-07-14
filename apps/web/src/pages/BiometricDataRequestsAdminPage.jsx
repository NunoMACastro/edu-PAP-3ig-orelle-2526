/**
 * Painel de revisão administrativa dos pedidos de privacidade biométrica.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { ErrorSummary } from "../components/ErrorSummary.jsx";
import { AdminIconButton, AdminPageHeader } from "../components/AdminUi.jsx";
import { EmptyState, Skeleton } from "../components/OrelleUi.jsx";
import { FeedbackMessage } from "../components/FeedbackMessage.jsx";
import { SubmitButton } from "../components/SubmitButton.jsx";
import { apiRequest } from "../services/apiClient.js";
import {
    getPrivacyActionLabel,
    getPrivacyResourceLabel,
    getPrivacyScopeLabel,
    getPrivacyStatusLabel,
} from "../services/presentationLabels.js";
import {
    canRetryPrivacyRequest,
    formatPrivacyDate,
    getPrivacyDecisionConfirmation,
    PRIVACY_ENDPOINTS,
    PRIVACY_RETRY_CONFIRMATION,
    validatePrivacyDecisionDraft,
} from "../services/privacyManagement.js";

/**
 * Substitui um pedido pelo DTO devolvido pela API sem alterar a ordenação.
 *
 * @param {object[]} requests - Lista atual.
 * @param {object} updatedRequest - Pedido atualizado.
 * @returns {object[]} Nova lista.
 */
function replaceRequest(requests, updatedRequest) {
    return requests.map((request) =>
        request.id === updatedRequest.id ? updatedRequest : request,
    );
}

/**
 * Painel com lista, detalhe, decisão confirmada e retry explícito.
 *
 * Os IDs da API são usados apenas internamente depois de o revisor escolher um
 * pedido da listagem. Nunca é pedido ou apresentado um ObjectId manual.
 *
 * @returns {JSX.Element} Workflow administrativo de privacidade.
 */
export function BiometricDataRequestsAdminPage() {
    const [requests, setRequests] = useState([]);
    const [selectedRequestId, setSelectedRequestId] = useState(null);
    const [listStatus, setListStatus] = useState("loading");
    const [listMessage, setListMessage] = useState("");
    const [actionStatus, setActionStatus] = useState("idle");
    const [actionMessage, setActionMessage] = useState("");
    const [actionError, setActionError] = useState(null);
    const [decisionDraft, setDecisionDraft] = useState({
        decision: "approved",
        decisionReason: "",
        confirmation: "",
    });
    const [retryDraft, setRetryDraft] = useState({
        decisionReason: "",
        confirmation: "",
    });
    const actionInFlightRef = useRef(false);

    const selectedRequest = useMemo(
        () => requests.find((request) => request.id === selectedRequestId) ?? null,
        [requests, selectedRequestId],
    );

    /**
     * Carrega a listagem canónica, preservando a seleção se ainda existir.
     *
     * @param {AbortSignal} [signal] - Cancelamento de desmontagem.
     * @returns {Promise<void>} Atualiza a lista sem apagar feedback de ações.
     */
    async function loadRequests(signal) {
        setListStatus("loading");
        setListMessage("");

        try {
            const data = await apiRequest(PRIVACY_ENDPOINTS.adminRequests, { signal });
            const nextRequests = data.requests ?? [];
            setRequests(nextRequests);
            setSelectedRequestId((current) =>
                nextRequests.some((request) => request.id === current)
                    ? current
                    : (nextRequests[0]?.id ?? null),
            );
            setListStatus(nextRequests.length ? "success" : "empty");
        } catch (error) {
            if (error.code === "REQUEST_ABORTED") return;
            setListStatus("error");
            setListMessage(error.message);
        }
    }

    useEffect(() => {
        const controller = new AbortController();
        loadRequests(controller.signal);
        return () => controller.abort();
    }, []);

    useEffect(() => {
        setDecisionDraft({
            decision: "approved",
            decisionReason: "",
            confirmation: "",
        });
        setRetryDraft({ decisionReason: "", confirmation: "" });
        setActionMessage("");
        setActionError(null);
        setActionStatus("idle");
    }, [selectedRequestId]);

    /**
     * Atualiza os campos editáveis da decisão.
     *
     * @param {import("react").ChangeEvent<HTMLSelectElement|HTMLTextAreaElement|HTMLInputElement>} event - Campo.
     * @returns {void}
     */
    function updateDecisionDraft(event) {
        const { name, value } = event.target;
        setDecisionDraft((current) => {
            const next = { ...current, [name]: value };
            if (name === "decision") next.confirmation = "";
            return next;
        });
    }

    /**
     * Aplica uma decisão através do PATCH canónico depois da confirmação escrita.
     *
     * @param {import("react").FormEvent<HTMLFormElement>} event - Submissão.
     * @returns {Promise<void>} Atualiza apenas o pedido afetado.
     */
    async function submitDecision(event) {
        event.preventDefault();
        if (!selectedRequest || actionInFlightRef.current) return;

        const validation = validatePrivacyDecisionDraft(decisionDraft);
        if (!validation.isValid) {
            setActionStatus("error");
            setActionMessage("");
            setActionError(Object.values(validation.errors).join(" "));
            return;
        }

        actionInFlightRef.current = true;
        setActionStatus("loading");
        setActionMessage("");
        setActionError(null);

        try {
            const data = await apiRequest(
                `${PRIVACY_ENDPOINTS.adminRequests}/${selectedRequest.id}`,
                {
                    method: "PATCH",
                    body: JSON.stringify({
                        decision: decisionDraft.decision,
                        decisionReason: decisionDraft.decisionReason,
                    }),
                },
            );
            setRequests((current) => replaceRequest(current, data.request));
            setDecisionDraft((current) => ({ ...current, confirmation: "" }));
            setActionStatus("success");
            setActionMessage("Decisão aplicada e registada no pedido.");
        } catch (error) {
            setActionStatus("error");
            setActionError(error);
        } finally {
            actionInFlightRef.current = false;
        }
    }

    /**
     * Atualiza a nota e a confirmação do retry sem permitir mudar recursos/ação.
     *
     * @param {import("react").ChangeEvent<HTMLTextAreaElement|HTMLInputElement>} event - Campo.
     * @returns {void}
     */
    function updateRetryDraft(event) {
        const { name, value } = event.target;
        setRetryDraft((current) => ({ ...current, [name]: value }));
    }

    /**
     * Reprocessa de forma explícita um pedido falhado.
     *
     * @param {import("react").FormEvent<HTMLFormElement>} event - Submissão.
     * @returns {Promise<void>} Reflete o replay idempotente devolvido pela API.
     */
    async function retryRequest(event) {
        event.preventDefault();
        if (actionInFlightRef.current) return;

        if (
            !selectedRequest ||
            !canRetryPrivacyRequest(selectedRequest) ||
            retryDraft.confirmation !== PRIVACY_RETRY_CONFIRMATION
        ) {
            setActionStatus("error");
            setActionMessage("");
            setActionError(
                `Para reprocessar um pedido falhado, escreve ${PRIVACY_RETRY_CONFIRMATION} exatamente como apresentado.`,
            );
            return;
        }

        actionInFlightRef.current = true;
        setActionStatus("loading");
        setActionMessage("");
        setActionError(null);

        try {
            const data = await apiRequest(
                `${PRIVACY_ENDPOINTS.adminRequests}/${selectedRequest.id}/retry`,
                {
                    method: "POST",
                    body: JSON.stringify({
                        decisionReason: retryDraft.decisionReason,
                    }),
                },
            );
            setRequests((current) => replaceRequest(current, data.request));
            setRetryDraft({ decisionReason: "", confirmation: "" });
            setActionStatus("success");
            setActionMessage("Pedido reprocessado e estado atualizado.");
        } catch (error) {
            setActionStatus("error");
            setActionError(error);
        } finally {
            actionInFlightRef.current = false;
        }
    }

    const decisionValidation = validatePrivacyDecisionDraft(decisionDraft);
    const expectedDecisionConfirmation = getPrivacyDecisionConfirmation(
        decisionDraft.decision,
    );
    const isActionBusy = actionStatus === "loading";
    const canDecide = selectedRequest?.status === "pending";

    return (
        <section className="admin-page admin-privacy-page">
            <AdminPageHeader eyebrow="Definições" title="Privacidade" description="Revê pedidos pela listagem e confirma por escrito cada operação destrutiva." actions={<AdminIconButton icon="refresh" label="Atualizar pedidos" onClick={() => loadRequests()} disabled={listStatus === "loading"} />} />

            {listStatus === "loading" ? <Skeleton lines={5} label="A carregar pedidos" /> : null}
            {listStatus === "empty" ? <EmptyState title="Sem pedidos para rever" description="Os novos pedidos de privacidade aparecem automaticamente nesta área." /> : null}
            {listStatus === "error" ? (
                <FeedbackMessage type="error">{listMessage}</FeedbackMessage>
            ) : null}

            {requests.length ? (
                <div className="privacy-admin-grid">
                    <nav aria-label="Pedidos de privacidade disponíveis">
                        <ul className="privacy-request-list privacy-request-list--selector">
                            {requests.map((request) => (
                                <li key={request.id}>
                                    <button
                                        type="button"
                                        className="privacy-request-selector"
                                        aria-pressed={request.id === selectedRequestId}
                                        onClick={() => setSelectedRequestId(request.id)}
                                    >
                                        <strong>
                                            {getPrivacyActionLabel(request.action)}
                                        </strong>
                                        <span>
                                            {getPrivacyStatusLabel(request.status)}
                                        </span>
                                        <span>{formatPrivacyDate(request.createdAt)}</span>
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </nav>

                    {selectedRequest ? (
                        <article className="privacy-request-detail" aria-live="polite">
                            <h2>Detalhe do pedido selecionado</h2>
                            <dl className="privacy-detail-list">
                                <div>
                                    <dt>Ação</dt>
                                    <dd>
                                        {getPrivacyActionLabel(
                                            selectedRequest.action,
                                        )}
                                    </dd>
                                </div>
                                <div>
                                    <dt>Âmbito</dt>
                                    <dd>
                                        {getPrivacyScopeLabel(
                                            selectedRequest.scope,
                                        )}
                                    </dd>
                                </div>
                                <div>
                                    <dt>Estado</dt>
                                    <dd>
                                        {getPrivacyStatusLabel(
                                            selectedRequest.status,
                                        )}
                                    </dd>
                                </div>
                                <div>
                                    <dt>Recursos</dt>
                                    <dd>
                                        {(selectedRequest.resources ?? [])
                                            .map(getPrivacyResourceLabel)
                                            .join(", ")}
                                    </dd>
                                </div>
                                <div>
                                    <dt>Motivo do titular</dt>
                                    <dd>{selectedRequest.reason || "Não foi indicado motivo."}</dd>
                                </div>
                                <div>
                                    <dt>Tentativas</dt>
                                    <dd>{selectedRequest.attempts ?? 0}</dd>
                                </div>
                                <div>
                                    <dt>Última atualização</dt>
                                    <dd>
                                        {formatPrivacyDate(
                                            selectedRequest.completedAt ??
                                                selectedRequest.lastAttemptAt ??
                                                selectedRequest.reviewedAt,
                                        )}
                                    </dd>
                                </div>
                            </dl>

                            {selectedRequest.decisionError ? (
                                <FeedbackMessage type="warning">
                                    A última tentativa não foi concluída. Tenta
                                    reprocessar o pedido quando a ação estiver disponível.
                                </FeedbackMessage>
                            ) : null}

                            {canDecide ? (
                                <form
                                    aria-describedby={
                                        actionError
                                            ? "privacy-admin-action-error"
                                            : undefined
                                    }
                                    onSubmit={submitDecision}
                                >
                                    <label>
                                        Decisão
                                        <select
                                            name="decision"
                                            value={decisionDraft.decision}
                                            onChange={updateDecisionDraft}
                                            disabled={isActionBusy}
                                        >
                                            <option value="approved">Aprovar</option>
                                            <option value="rejected">Rejeitar</option>
                                        </select>
                                    </label>
                                    <label>
                                        Motivo da decisão
                                        <textarea
                                            name="decisionReason"
                                            value={decisionDraft.decisionReason}
                                            onChange={updateDecisionDraft}
                                            maxLength={500}
                                            disabled={isActionBusy}
                                            required={decisionDraft.decision === "rejected"}
                                            placeholder="Regista a justificação da decisão."
                                        />
                                    </label>
                                    <label>
                                        Escreve {expectedDecisionConfirmation} para confirmar
                                        <input
                                            name="confirmation"
                                            value={decisionDraft.confirmation}
                                            onChange={updateDecisionDraft}
                                            autoComplete="off"
                                            spellCheck="false"
                                            disabled={isActionBusy}
                                            required
                                        />
                                    </label>
                                    <SubmitButton
                                        isBusy={isActionBusy}
                                        disabled={!decisionValidation.isValid}
                                        busyText="A aplicar decisão..."
                                    >
                                        Aplicar decisão
                                    </SubmitButton>
                                </form>
                            ) : null}

                            {canRetryPrivacyRequest(selectedRequest) ? (
                                <form
                                    className="privacy-retry-form"
                                    aria-describedby={
                                        actionError
                                            ? "privacy-admin-action-error"
                                            : undefined
                                    }
                                    onSubmit={retryRequest}
                                >
                                    <h3>Reprocessar falha</h3>
                                    <p>
                                        O reprocessamento mantém a ação e os recursos
                                        originais, mesmo que seja repetido.
                                    </p>
                                    <label>
                                        Nota de reprocessamento opcional
                                        <textarea
                                            name="decisionReason"
                                            value={retryDraft.decisionReason}
                                            onChange={updateRetryDraft}
                                            maxLength={500}
                                            disabled={isActionBusy}
                                        />
                                    </label>
                                    <label>
                                        Escreve {PRIVACY_RETRY_CONFIRMATION} para confirmar
                                        <input
                                            name="confirmation"
                                            value={retryDraft.confirmation}
                                            onChange={updateRetryDraft}
                                            autoComplete="off"
                                            spellCheck="false"
                                            disabled={isActionBusy}
                                            required
                                        />
                                    </label>
                                    <SubmitButton
                                        className="button--danger"
                                        isBusy={isActionBusy}
                                        disabled={
                                            retryDraft.confirmation !==
                                            PRIVACY_RETRY_CONFIRMATION
                                        }
                                        busyText="A reprocessar..."
                                    >
                                        Reprocessar pedido
                                    </SubmitButton>
                                </form>
                            ) : null}

                            {actionStatus !== "error" ? (
                                <FeedbackMessage type="success">
                                    {actionMessage}
                                </FeedbackMessage>
                            ) : null}
                            <ErrorSummary
                                error={actionError}
                                id="privacy-admin-action-error"
                            />
                        </article>
                    ) : null}
                </div>
            ) : null}
        </section>
    );
}
