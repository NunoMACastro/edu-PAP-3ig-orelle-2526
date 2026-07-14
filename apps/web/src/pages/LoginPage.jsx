/**
 * Pagina de login/logout do BK-MF0-02.
 */
import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ErrorSummary } from "../components/ErrorSummary.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { resolvePostLoginPath } from "../services/accountNavigation.js";

/**
 * Formulario de login e acao de logout.
 *
 * @function LoginPage
 * @returns {JSX.Element} UI de autenticacao.
 */
export function LoginPage() {
    const {
        login,
        logout,
        logoutAll,
        user,
        postSessionNotice,
        clearPostSessionNotice,
    } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();
    const [form, setForm] = useState({ email: "", password: "" });
    const [message, setMessage] = useState(
        location.state?.accountDeletedMessage ?? postSessionNotice ?? "",
    );
    const [submitError, setSubmitError] = useState(null);
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [sessionScope, setSessionScope] = useState("current");
    const sessionActionInFlightRef = useRef(false);

    useEffect(() => {
        const notice =
            location.state?.accountDeletedMessage ?? postSessionNotice ?? "";

        if (!notice) return;

        setMessage(notice);
        clearPostSessionNotice();
    }, [
        location.state?.accountDeletedMessage,
        postSessionNotice,
        clearPostSessionNotice,
    ]);

    /**
     * Atualiza campos do formulario de login.
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
     * Envia as credenciais para a API.
     *
     * @async
     * @function handleLogin
     * @param {import("react").FormEvent<HTMLFormElement>} event - Evento do formulario.
     * @returns {Promise<void>}
     */
    async function handleLogin(event) {
        event.preventDefault();
        setLoading(true);
        setMessage("");
        setSubmitError(null);

        try {
            const loggedUser = await login(form);
            setMessage(`Sessão iniciada como ${loggedUser.email}`);
            navigate(resolvePostLoginPath(loggedUser, location.state?.from?.pathname), {
                replace: true,
            });
        } catch (err) {
            setSubmitError(err);
        } finally {
            setLoading(false);
        }
    }

    /**
     * Termina a sessao atual.
     *
     * @async
     * @function handleLogout
     * @param {"current"|"all"} scope - Sessão atual ou todas as sessões.
     * @returns {Promise<void>}
     */
    async function handleLogout(scope = "current") {
        if (sessionActionInFlightRef.current) return;

        sessionActionInFlightRef.current = true;
        setSessionScope(scope);
        setLoading(true);
        setMessage("");
        setSubmitError(null);

        try {
            await (scope === "all" ? logoutAll() : logout());
            setMessage(
                scope === "all"
                    ? "Todas as sessões foram terminadas."
                    : "Sessão terminada.",
            );
        } catch (error) {
            setSubmitError(error);
        } finally {
            sessionActionInFlightRef.current = false;
            setLoading(false);
        }
    }

    return (
        <section className="auth-page">
            <header className="auth-page__header">
                <p className="auth-page__eyebrow">Bem-vindo de volta</p>
                <h1>Iniciar sessão</h1>
                <p>
                    Continua a tua experiência de beleza personalizada na Orélle.
                </p>
            </header>

            {user ? (
                <section className="auth-session">
                    <p>Autenticado como {user.email}</p>
                    <div className="auth-session__actions">
                        <button
                            type="button"
                            onClick={() => handleLogout("current")}
                            disabled={loading}
                        >
                            {loading && sessionScope === "current"
                                ? "A terminar sessão..."
                                : "Terminar sessão"}
                        </button>
                        <button
                            type="button"
                            className="button--secondary"
                            onClick={() => handleLogout("all")}
                            disabled={loading}
                        >
                            {loading && sessionScope === "all"
                                ? "A terminar sessões..."
                                : "Terminar sessões em todos os dispositivos"}
                        </button>
                    </div>
                </section>
            ) : (
                <form
                    className="auth-form"
                    aria-describedby={submitError ? "login-error" : undefined}
                    onSubmit={handleLogin}
                >
                    <label htmlFor="login-email">
                        Email
                        <input
                            id="login-email"
                            name="email"
                            type="email"
                            autoComplete="email"
                            value={form.email}
                            onChange={updateField}
                            required
                        />
                    </label>

                    <div className="auth-password-field">
                        <label htmlFor="login-password">Palavra-passe</label>
                        <div className="auth-password-control">
                            <input
                                id="login-password"
                                name="password"
                                type={showPassword ? "text" : "password"}
                                autoComplete="current-password"
                                value={form.password}
                                onChange={updateField}
                                required
                            />
                            <button
                                type="button"
                                className="auth-password-toggle"
                                aria-label={`${showPassword ? "Ocultar" : "Mostrar"} palavra-passe`}
                                aria-pressed={showPassword}
                                onClick={() => setShowPassword((current) => !current)}
                            >
                                {showPassword ? "Ocultar" : "Mostrar"}
                            </button>
                        </div>
                    </div>

                    <button className="auth-form__submit" type="submit" disabled={loading}>
                        {loading ? "A entrar..." : "Entrar"}
                    </button>
                </form>
            )}

            {message && <p role="status">{message}</p>}
            <ErrorSummary error={submitError} id="login-error" />
            {!user && (
                <p className="auth-page__switch">
                    Ainda não tens conta? <Link to="/registo">Criar conta</Link>
                </p>
            )}
        </section>
    );
}
