/**
 * Pagina de registo do BK-MF0-01 com feedback acessivel do BK-MF5-07.
 */
import { useState } from "react";
import { FeedbackMessage } from "../components/FeedbackMessage.jsx";
import { SubmitButton } from "../components/SubmitButton.jsx";
import { apiRequest } from "../services/apiClient.js";

/**
 * Formulario de registo com email, password e feedback imediato.
 *
 * @function RegisterPage
 * @returns {JSX.Element} UI de registo com mensagens seguras e botao ocupado.
 */
export function RegisterPage() {
    const [form, setForm] = useState({ email: "", password: "" });
    const [status, setStatus] = useState("idle");
    const [message, setMessage] = useState("");

    /**
     * Atualiza um campo do formulario sem alterar os restantes.
     *
     * @function updateField
     * @param {import("react").ChangeEvent<HTMLInputElement>} event - Evento do input.
     * @returns {void}
     */
    function updateField(event) {
        setForm((current) => ({
            ...current,
            [event.target.name]: event.target.value,
        }));
    }

    /**
     * Submete o registo para a API e traduz o resultado para feedback de UI.
     *
     * @async
     * @function handleSubmit
     * @param {import("react").FormEvent<HTMLFormElement>} event - Evento do formulario.
     * @returns {Promise<void>}
     */
    async function handleSubmit(event) {
        event.preventDefault();
        // O estado loading limpa mensagens antigas e bloqueia novo submit ate a API responder.
        setStatus("loading");
        setMessage("");

        try {
            await apiRequest("/auth/register", {
                method: "POST",
                body: JSON.stringify(form),
            });

            setStatus("success");
            setMessage("Conta criada. Ja podes iniciar sessao.");
            setForm({ email: "", password: "" });
        } catch (err) {
            // A mensagem vem do apiRequest/backend; nao exibimos objetos tecnicos nem detalhes internos.
            setStatus("error");
            setMessage(err.message);
        }
    }

    const isBusy = status === "loading";
    const feedbackType = status === "error" ? "error" : "success";

    return (
        <main>
            <h1>Registo Orélle</h1>
            <form
                aria-describedby={message ? "register-feedback" : undefined}
                onSubmit={handleSubmit}
            >
                <label>
                    Email
                    <input
                        name="email"
                        type="email"
                        value={form.email}
                        onChange={updateField}
                        autoComplete="email"
                        required
                    />
                </label>

                <label>
                    Palavra-passe
                    <input
                        name="password"
                        type="password"
                        value={form.password}
                        onChange={updateField}
                        autoComplete="new-password"
                        minLength={8}
                        required
                    />
                </label>

                <SubmitButton isBusy={isBusy} busyText="A criar conta...">
                    Criar conta
                </SubmitButton>
            </form>

            <FeedbackMessage id="register-feedback" type={feedbackType}>
                {message}
            </FeedbackMessage>
        </main>
    );
}
