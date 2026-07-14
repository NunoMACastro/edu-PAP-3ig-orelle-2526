/**
 * Área do titular para pedidos de privacidade e eliminação terminal da conta.
 */
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ErrorSummary } from "../components/ErrorSummary.jsx";
import { FeedbackMessage } from "../components/FeedbackMessage.jsx";
import { SubmitButton } from "../components/SubmitButton.jsx";
import { EmptyState, PageHero, SectionCard, Skeleton } from "../components/OrelleUi.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { apiRequest } from "../services/apiClient.js";
import {
    getPrivacyActionLabel,
    getPrivacyResourceLabel,
    getPrivacyScopeLabel,
    getPrivacyStatusLabel,
} from "../services/presentationLabels.js";
import {
    ACCOUNT_ERASURE_CONFIRMATION,
    formatPrivacyDate,
    PRIVACY_ACTION_OPTIONS,
    PRIVACY_ENDPOINTS,
    PRIVACY_RESOURCE_OPTIONS,
    validateAccountErasureForm,
} from "../services/privacyManagement.js";

/**
 * Alterna um recurso numa lista sem criar duplicados.
 *
 * @param {string[]} resources - Recursos atualmente selecionados.
 * @param {string} value - Recurso a adicionar ou remover.
 * @param {boolean} checked - Estado final do checkbox.
 * @returns {string[]} Próxima lista de recursos.
 */
function toggleResourceValue(resources, value, checked) {
    if (checked) return [...new Set([...resources, value])];
    return resources.filter((resource) => resource !== value);
}

/**
 * Resume um pedido sem mostrar identificadores internos.
 *
 * @param {{request: object}} props - Pedido minimizado pertencente ao titular.
 * @returns {JSX.Element} Cartão de histórico legível.
 */
function PrivacyRequestCard({ request }) {
    return (
        <li>
            <article className="privacy-request-card">
                <div className="privacy-request-card__heading">
                    <strong>{getPrivacyActionLabel(request.action)}</strong>
                    <span className="status-chip">
                        {getPrivacyStatusLabel(request.status)}
                    </span>
                </div>
                <p>
                    <strong>Âmbito:</strong> {getPrivacyScopeLabel(request.scope)}
                </p>
                <p>
                    <strong>Dados:</strong>{" "}
                    {(request.resources ?? [])
                        .map(getPrivacyResourceLabel)
                        .join(", ")}
                </p>
                <p>
                    <strong>Criado:</strong> {formatPrivacyDate(request.createdAt)}
                </p>
                {request.reason ? (
                    <p>
                        <strong>Motivo:</strong> {request.reason}
                    </p>
                ) : null}
                {request.decisionReason ? (
                    <p>
                        <strong>Decisão:</strong> {request.decisionReason}
                    </p>
                ) : null}
                {request.decisionError ? (
                    <FeedbackMessage type="warning">
                        O pedido encontrou uma falha operacional e pode ser
                        reprocessado pela equipa responsável.
                    </FeedbackMessage>
                ) : null}
            </article>
        </li>
    );
}

/**
 * Permite ao cliente criar/listar pedidos de privacidade e eliminar a conta.
 *
 * @returns {JSX.Element} Área de privacidade sem IDs técnicos ou ownership no body.
 */
export function BiometricDataRequestPage() {
    const { user, forgetSession } = useAuth();
    const navigate = useNavigate();
    const [requests, setRequests] = useState([]);
    const [listStatus, setListStatus] = useState("loading");
    const [listMessage, setListMessage] = useState("");
    const [form, setForm] = useState({
        action: "delete",
        resources: ["photos", "reports"],
        reason: "",
    });
    const [createStatus, setCreateStatus] = useState("idle");
    const [createMessage, setCreateMessage] = useState("");
    const [createError, setCreateError] = useState(null);
    const [erasureForm, setErasureForm] = useState({
        password: "",
        confirmation: "",
    });
    const [erasureStatus, setErasureStatus] = useState("idle");
    const [erasureMessage, setErasureMessage] = useState("");
    const [erasureError, setErasureError] = useState(null);
    const createInFlightRef = useRef(false);
    const erasureInFlightRef = useRef(false);

    /**
     * Carrega exclusivamente o histórico do titular autenticado.
     *
     * @param {AbortSignal} [signal] - Cancelamento de desmontagem.
     * @returns {Promise<void>} Atualiza a lista preservando os formulários.
     */
    async function loadRequests(signal) {
        setListStatus("loading");
        setListMessage("");

        try {
            const data = await apiRequest(PRIVACY_ENDPOINTS.myRequests, { signal });
            const nextRequests = data.requests ?? [];
            setRequests(nextRequests);
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

    /**
     * Atualiza um campo simples do pedido.
     *
     * @param {import("react").ChangeEvent<HTMLSelectElement|HTMLTextAreaElement>} event - Alteração.
     * @returns {void}
     */
    function updateRequestField(event) {
        const { name, value } = event.target;
        setForm((current) => ({ ...current, [name]: value }));
    }

    /**
     * Atualiza a seleção explícita de recursos.
     *
     * @param {import("react").ChangeEvent<HTMLInputElement>} event - Checkbox alterado.
     * @returns {void}
     */
    function updateResource(event) {
        const { value, checked } = event.target;
        setForm((current) => ({
            ...current,
            resources: toggleResourceValue(current.resources, value, checked),
        }));
    }

    /**
     * Cria um pedido no endpoint canónico, sem enviar userId/requesterId.
     *
     * @param {import("react").FormEvent<HTMLFormElement>} event - Submissão.
     * @returns {Promise<void>} Atualiza histórico e feedback.
     */
    async function submitPrivacyRequest(event) {
        event.preventDefault();
        if (createInFlightRef.current) return;

        if (form.resources.length === 0) {
            setCreateStatus("error");
            setCreateMessage("");
            setCreateError("Escolhe pelo menos um tipo de dado para o pedido.");
            return;
        }

        createInFlightRef.current = true;
        setCreateStatus("loading");
        setCreateMessage("");
        setCreateError(null);

        try {
            const data = await apiRequest(PRIVACY_ENDPOINTS.myRequests, {
                method: "POST",
                body: JSON.stringify({
                    action: form.action,
                    resources: form.resources,
                    reason: form.reason,
                }),
            });

            setRequests((current) => [data.request, ...current]);
            setListStatus("success");
            setForm((current) => ({ ...current, reason: "" }));
            setCreateStatus("success");
            setCreateMessage("Pedido registado e disponível no teu histórico.");
        } catch (error) {
            setCreateStatus("error");
            setCreateError(error);
        } finally {
            createInFlightRef.current = false;
        }
    }

    /**
     * Atualiza a confirmação irreversível sem normalizar a palavra literal.
     *
     * @param {import("react").ChangeEvent<HTMLInputElement>} event - Campo alterado.
     * @returns {void}
     */
    function updateErasureField(event) {
        const { name, value } = event.target;
        setErasureForm((current) => ({ ...current, [name]: value }));
    }

    /**
     * Elimina a própria conta apenas após password e confirmação literal.
     *
     * @param {import("react").FormEvent<HTMLFormElement>} event - Submissão destrutiva.
     * @returns {Promise<void>} Limpa a sessão local e encaminha para login.
     */
    async function eraseAccount(event) {
        event.preventDefault();
        if (erasureInFlightRef.current) return;
        const validation = validateAccountErasureForm(erasureForm);

        if (!validation.isValid) {
            setErasureStatus("error");
            setErasureMessage("");
            setErasureError(Object.values(validation.errors).join(" "));
            return;
        }

        erasureInFlightRef.current = true;
        setErasureStatus("loading");
        setErasureMessage("");
        setErasureError(null);

        try {
            const data = await apiRequest(PRIVACY_ENDPOINTS.eraseAccount, {
                method: "DELETE",
                body: JSON.stringify(erasureForm),
            });

            forgetSession(data.message);
            navigate("/login", {
                replace: true,
                state: { accountDeletedMessage: data.message },
            });
        } catch (error) {
            setErasureStatus("error");
            setErasureError(error);
        } finally {
            erasureInFlightRef.current = false;
        }
    }

    const isClient = user?.role === "cliente";
    const erasureValidation = validateAccountErasureForm(erasureForm);

    return (
        <div className="privacy-page">
            <PageHero eyebrow="Conta e segurança" title="Privacidade e dados faciais" description="Controla as fotografias, os relatórios e os pedidos associados à tua conta." />
            <SectionCard title="Dados faciais" description="Pede a eliminação ou anonimização dos dados escolhidos.">

                <form
                    aria-describedby={
                        createMessage || createError
                            ? "privacy-create-feedback"
                            : undefined
                    }
                    onSubmit={submitPrivacyRequest}
                >
                    <label>
                        Tipo de pedido
                        <select
                            name="action"
                            value={form.action}
                            onChange={updateRequestField}
                            disabled={!isClient || createStatus === "loading"}
                        >
                            {PRIVACY_ACTION_OPTIONS.map((option) => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                    </label>

                    {PRIVACY_RESOURCE_OPTIONS.map((option) => (
                        <label key={option.value}>
                            <input
                                type="checkbox"
                                value={option.value}
                                checked={form.resources.includes(option.value)}
                                onChange={updateResource}
                                disabled={!isClient || createStatus === "loading"}
                            />
                            {option.label}
                        </label>
                    ))}

                    <label>
                        Motivo opcional
                        <textarea
                            name="reason"
                            value={form.reason}
                            onChange={updateRequestField}
                            maxLength={500}
                            disabled={!isClient || createStatus === "loading"}
                            placeholder="Ex.: Quero remover uma análise facial antiga."
                        />
                    </label>

                    <SubmitButton
                        isBusy={createStatus === "loading"}
                        disabled={!isClient || form.resources.length === 0}
                        busyText="A criar pedido..."
                    >
                        Criar pedido de privacidade
                    </SubmitButton>
                </form>

                {createStatus !== "error" ? (
                    <FeedbackMessage id="privacy-create-feedback" type="success">
                        {createMessage}
                    </FeedbackMessage>
                ) : null}
                <ErrorSummary
                    error={createError}
                    id="privacy-create-feedback"
                />
            </SectionCard>

            <SectionCard title="Histórico de pedidos" description="Acompanha cada pedido sem códigos técnicos.">
                <div className="section-group-header privacy-section-heading">
                    <div>
                        <h2 id="privacy-history-title" className="visually-hidden">Histórico de pedidos</h2>
                    </div>
                    <button
                        type="button"
                        className="button--secondary"
                        onClick={() => loadRequests()}
                        disabled={listStatus === "loading"}
                    >
                        {listStatus === "loading" ? "A atualizar..." : "Atualizar"}
                    </button>
                </div>

                {listStatus === "loading" ? <Skeleton lines={3} label="A carregar pedidos" /> : null}
                {listStatus === "empty" ? <EmptyState title="Ainda não criaste pedidos" description="Se precisares de controlar dados faciais ou relatórios, podes iniciar um pedido acima." /> : null}
                {listStatus === "error" ? (
                    <FeedbackMessage type="error">{listMessage}</FeedbackMessage>
                ) : null}
                {requests.length ? (
                    <ul className="privacy-request-list">
                        {requests.map((request) => (
                            <PrivacyRequestCard key={request.id} request={request} />
                        ))}
                    </ul>
                ) : null}
            </SectionCard>

            <details className="danger-zone"><summary>Zona de risco — eliminar conta</summary><section aria-labelledby="erase-account-title">
                <h2 id="erase-account-title">Eliminar a conta definitivamente</h2>
                <FeedbackMessage type="warning">
                    Esta ação é irreversível. Revoga as sessões, elimina os dados
                    pessoais ligados à conta e não permite reativação posterior.
                </FeedbackMessage>

                <form
                    aria-describedby={
                        erasureMessage || erasureError
                            ? "account-erasure-feedback"
                            : undefined
                    }
                    onSubmit={eraseAccount}
                >
                    <label>
                        Password atual
                        <input
                            name="password"
                            type="password"
                            autoComplete="current-password"
                            value={erasureForm.password}
                            onChange={updateErasureField}
                            disabled={erasureStatus === "loading"}
                            required
                        />
                    </label>
                    <label>
                        Escreve {ACCOUNT_ERASURE_CONFIRMATION} para confirmar
                        <input
                            name="confirmation"
                            type="text"
                            autoComplete="off"
                            value={erasureForm.confirmation}
                            onChange={updateErasureField}
                            disabled={erasureStatus === "loading"}
                            spellCheck="false"
                            required
                        />
                    </label>
                    <SubmitButton
                        className="button--danger"
                        isBusy={erasureStatus === "loading"}
                        disabled={!erasureValidation.isValid}
                        busyText="A eliminar conta..."
                    >
                        Eliminar a minha conta
                    </SubmitButton>
                </form>

                {erasureMessage ? (
                    <FeedbackMessage id="account-erasure-feedback" type="success">
                        {erasureMessage}
                    </FeedbackMessage>
                ) : null}
                <ErrorSummary
                    error={erasureError}
                    id="account-erasure-feedback"
                />
            </section></details>
        </div>
    );
}
