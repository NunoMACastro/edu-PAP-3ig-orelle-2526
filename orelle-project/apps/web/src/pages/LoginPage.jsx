import { useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";

export function LoginPage() {
    const { login, logout, user } = useAuth();
    const [form, setForm] = useState({ email: "", password: "" });
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(false);

    function updateField(event) {
        setForm((current) => ({
            ...current,
            [event.target.name]: event.target.value,
        }));
    }

    async function handleLogin(event) {
        event.preventDefault();
        setLoading(true);
        setMessage("");

        try {
            const loggedUser = await login(form);
            setMessage(`Sessao iniciada como ${loggedUser.email}`);
        } catch (err) {
            setMessage(err.message);
        } finally {
            setLoading(false);
        }
    }

    async function handleLogout() {
        await logout();
        setMessage("Sessao terminada");
    }

    return (
        <main>
            <h1>Login Orélle</h1>

            {user ? (
                <section>
                    <p>Autenticado como {user.email}</p>
                    <button type="button" onClick={handleLogout}>
                        Terminar sessao
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