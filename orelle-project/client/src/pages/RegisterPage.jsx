import { useState } from "react";
import { apiRequest } from "../services/apiClient.js";

export function RegisterPage() {
    const [form, setForm] = useState({ email: "", password: "" });
    const [status, setStatus] = useState("idle");
    const [message, setMessage] = useState("");

    function updateField(event) {
        setForm((current) => ({
            ...current,
            [event.target.name]: event.target.value,
        }));
    }

    async function handleSubmit(event) {
        event.preventDefault();
        setStatus("loading");
        setMessage("");

        try {
            const data = await apiRequest("/auth/register", {
                method: "POST",
                body: JSON.stringify(form),
            });

            setStatus("success");
            setMessage(`Conta criada para ${data.user.email}`);
            setForm({ email: "", password: "" });
        } catch (err) {
            setStatus("error");
            setMessage(err.message);
        }
    }

    return (
        <main>
            <h1>Registo Orélle</h1>
            <form onSubmit={handleSubmit}>
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
                    Password
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

                <button type="submit" disabled={status === "loading"}>
                    {status === "loading" ? "A criar..." : "Criar conta"}
                </button>
            </form>

            {message && (
                <p role={status === "error" ? "alert" : "status"}>{message}</p>
            )}
        </main>
    );
}