/**
 * Pagina de login/logout do BK-MF0-02.
 */
import { useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";

/**
 * Formulario de login e acao de logout.
 *
 * @function LoginPage
 * @returns {JSX.Element} UI de autenticacao.
 */
export function LoginPage() {
    const { login, logout, user } = useAuth();
    const [form, setForm] = useState({ email: "", password: "" });
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(false);

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

        try {
            const loggedUser = await login(form);
            setMessage(`Sessão iniciada como ${loggedUser.email}`);
        } catch (err) {
            setMessage(err.message);
        } finally {
            setLoading(false);
        }
    }

    /**
     * Termina a sessao atual.
     *
     * @async
     * @function handleLogout
     * @returns {Promise<void>}
     */
    async function handleLogout() {
        await logout();
        setMessage("Sessão terminada");
    }

    return (
        <main>
            <h1>Login Orélle</h1>

            {user ? (
                <section>
                    <p>Autenticado como {user.email}</p>
                    <button type="button" onClick={handleLogout}>
                        Terminar sessão
                    </button>
                </section>
            ) : (
                <form onSubmit={handleLogin}>
                    <label>
                        Email
                        <input
                            name="email"
                            type="email"
                            value={form.email}
                            onChange={updateField}
                            required
                        />
                    </label>

                    <label>
                        Password
                        <input
                            name="password"
                            type="password"
                            value={form.password}
                            onChange={updateField}
                            required
                        />
                    </label>

                    <button type="submit" disabled={loading}>
                        {loading ? "A entrar..." : "Entrar"}
                    </button>
                </form>
            )}

            {message && <p role="status">{message}</p>}
        </main>
    );
}
