/**
 * Pagina de registo do BK-MF0-01 com feedback acessivel do BK-MF5-07.
 */
import { useState } from "react";
import { Link } from "react-router-dom";
import { ErrorSummary } from "../components/ErrorSummary.jsx";
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
    const [submitError, setSubmitError] = useState(null);

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
        setSubmitError(null);

        try {
            await apiRequest("/auth/register", {
                method: "POST",
                body: JSON.stringify(form),
            });

            setStatus("success");
            setMessage("Conta criada. Já podes iniciar sessão.");
            setForm({ email: "", password: "" });
        } catch (err) {
            setStatus("error");
            setSubmitError(err);
        }
    }

    const isBusy = status === "loading";
    const feedbackType = status === "error" ? "error" : "success";

    return (
        <section className="auth-page">
            <header className="auth-page__header">
                <p className="auth-page__eyebrow">Começa aqui</p>
                <h1>Criar conta</h1>
                <p>
                    Guarda as tuas preferências e prepara uma experiência de beleza
                    pensada para ti.
                </p>
            </header>
            <form
                className="auth-form"
                aria-describedby={
                    message || submitError ? "register-feedback" : undefined
                }
                onSubmit={handleSubmit}
            >
                <label htmlFor="register-email">
                    Email
                    <input
                        id="register-email"
                        name="email"
                        type="email"
                        value={form.email}
                        onChange={updateField}
                        autoComplete="email"
                        required
                    />
                </label>

                <label htmlFor="register-password">
                    Palavra-passe
                    <input
                        id="register-password"
                        name="password"
                        type="password"
                        value={form.password}
                        onChange={updateField}
                        autoComplete="new-password"
                        minLength={8}
                        required
                    />
                </label>

                <SubmitButton
                    isBusy={isBusy}
                    busyText="A criar conta..."
                    className="auth-form__submit"
                >
                    Criar conta
                </SubmitButton>
            </form>

            {status !== "error" ? (
                <FeedbackMessage id="register-feedback" type={feedbackType}>
                    {message}
                </FeedbackMessage>
            ) : null}
            <ErrorSummary error={submitError} id="register-feedback" />
            <p className="auth-page__switch">
                Já tens conta? <Link to="/login">Iniciar sessão</Link>
            </p>
        </section>
    );
}
