/**
 * Pagina de cliente para criar pedidos de privacidade biometrica RF41.
 */
import { useState } from "react";
import { FeedbackMessage } from "../components/FeedbackMessage.jsx";
import { SubmitButton } from "../components/SubmitButton.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { apiRequest } from "../services/apiClient.js";

const ACTION_OPTIONS = Object.freeze([
    {
        value: "delete",
        label: "Eliminar dados biometricos",
    },
    {
        value: "anonymize",
        label: "Anonimizar dados biometricos",
    },
]);

const RESOURCE_OPTIONS = Object.freeze([
    {
        value: "photos",
        label: "Fotografias faciais",
    },
    {
        value: "reports",
        label: "Relatorios cosmeticos",
    },
]);

/**
 * Alterna um recurso numa lista de recursos selecionados.
 *
 * @function toggleResourceValue
 * @param {string[]} resources - Recursos atualmente selecionados.
 * @param {string} value - Recurso a adicionar ou remover.
 * @param {boolean} checked - Estado final do checkbox.
 * @returns {string[]} Proxima lista de recursos.
 */
function toggleResourceValue(resources, value, checked) {
    if (checked) {
        return [...new Set([...resources, value])];
    }

    return resources.filter((resource) => resource !== value);
}

/**
 * Formulario de cliente para pedir eliminacao ou anonimizacao de dados faciais.
 *
 * @function BiometricDataRequestPage
 * @returns {JSX.Element} UI de criacao de pedido RF41 com feedback seguro.
 */
export function BiometricDataRequestPage() {
    const { user } = useAuth();
    const [form, setForm] = useState({
        action: "delete",
        resources: ["photos", "reports"],
        reason: "",
    });
    const [status, setStatus] = useState("idle");
    const [message, setMessage] = useState("");
    const [createdRequest, setCreatedRequest] = useState(null);

    /**
     * Atualiza campo simples do formulario.
     *
     * @function updateField
     * @param {import("react").ChangeEvent<HTMLSelectElement|HTMLTextAreaElement>} event - Evento do campo.
     * @returns {void}
     */
    function updateField(event) {
        const { name, value } = event.target;

        setForm((current) => ({
            ...current,
            [name]: value,
        }));
    }

    /**
     * Atualiza a lista de recursos sem aceitar ownership vindo da UI.
     *
     * @function updateResource
     * @param {import("react").ChangeEvent<HTMLInputElement>} event - Evento do checkbox.
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
     * Cria o pedido no endpoint autenticado do cliente.
     *
     * @async
     * @function handleSubmit
     * @param {import("react").FormEvent<HTMLFormElement>} event - Evento do formulario.
     * @returns {Promise<void>}
     */
    async function handleSubmit(event) {
        event.preventDefault();

        if (form.resources.length === 0) {
            setStatus("error");
            setMessage("Escolhe pelo menos um tipo de dado para o pedido.");
            return;
        }

        setStatus("loading");
        setMessage("");
        setCreatedRequest(null);

        try {
            const data = await apiRequest("/me/biometric-data-requests", {
                method: "POST",
                body: JSON.stringify({
                    action: form.action,
                    resources: form.resources,
                    reason: form.reason,
                }),
            });

            setStatus("success");
            setMessage("Pedido criado. Um consultor ou administrador vai rever a decisao.");
            setCreatedRequest(data.request ?? null);
            setForm((current) => ({
                ...current,
                reason: "",
            }));
        } catch (err) {
            // O backend continua a decidir sessao, ownership e role; a UI mostra apenas mensagem segura.
            setStatus("error");
            setMessage(err.message);
        }
    }

    const isBusy = status === "loading";
    const isClient = user?.role === "cliente";
    const isDisabled = !isClient || isBusy;
    const feedbackType = status === "error" ? "error" : "success";

    return (
        <section>
            <h1>Pedido de privacidade biometrica</h1>
            <p>
                Pede a eliminacao ou anonimizacao das fotografias faciais e
                relatorios cosmeticos associados a tua conta.
            </p>

            {!isClient && (
                <FeedbackMessage type="info">
                    Inicia sessao como cliente para criar um pedido.
                </FeedbackMessage>
            )}

            <form
                aria-describedby={message ? "biometric-request-feedback" : undefined}
                onSubmit={handleSubmit}
            >
                <label>
                    Tipo de pedido
                    <select
                        name="action"
                        value={form.action}
                        onChange={updateField}
                        disabled={isDisabled}
                    >
                        {ACTION_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </select>
                </label>

                {RESOURCE_OPTIONS.map((option) => (
                    <label key={option.value}>
                        <input
                            type="checkbox"
                            value={option.value}
                            checked={form.resources.includes(option.value)}
                            onChange={updateResource}
                            disabled={isDisabled}
                        />
                        {option.label}
                    </label>
                ))}

                <label>
                    Motivo opcional
                    <textarea
                        name="reason"
                        value={form.reason}
                        onChange={updateField}
                        maxLength={500}
                        disabled={isDisabled}
                        placeholder="Ex.: Quero remover a analise facial antiga."
                    />
                </label>

                <SubmitButton
                    isBusy={isBusy}
                    disabled={!isClient}
                    busyText="A criar pedido..."
                >
                    Criar pedido de privacidade
                </SubmitButton>
            </form>

            <FeedbackMessage id="biometric-request-feedback" type={feedbackType}>
                {message}
            </FeedbackMessage>

            {createdRequest && (
                <article>
                    <h2>Pedido registado</h2>
                    <p>Estado: {createdRequest.status}</p>
                    <p>Pedido: {createdRequest.id}</p>
                </article>
            )}
        </section>
    );
}
