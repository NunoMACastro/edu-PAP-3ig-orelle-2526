/**
 * Pagina de preferencias de alertas de rotina.
 */
import { useEffect, useState } from "react";
import { apiRequest } from "../services/apiClient.js";

export function RoutineAlertsPage() {
    const [form, setForm] = useState({ enabled: true, eveningTime: "21:00" });
    const [message, setMessage] = useState("");

    useEffect(() => {
        apiRequest("/me/routine-alerts")
            .then((data) => {
                setForm({
                    enabled: data.preference.enabled,
                    eveningTime: data.preference.eveningTime,
                });
            })
            .catch((err) => setMessage(err.message));
    }, []);

    async function savePreference(event) {
        event.preventDefault();

        try {
            await apiRequest("/me/routine-alerts", {
                method: "PUT",
                body: JSON.stringify(form),
            });
            setMessage("Alertas de rotina atualizados.");
        } catch (err) {
            setMessage(err.message);
        }
    }

    return (
        <section>
            <h1>Alertas de rotina</h1>
            <form onSubmit={savePreference}>
                <label>
                    <input
                        type="checkbox"
                        checked={form.enabled}
                        onChange={(event) =>
                            setForm((current) => ({
                                ...current,
                                enabled: event.target.checked,
                            }))
                        }
                    />
                    Receber alerta noturno
                </label>
                <label>
                    Hora
                    <input
                        type="time"
                        value={form.eveningTime}
                        onChange={(event) =>
                            setForm((current) => ({
                                ...current,
                                eveningTime: event.target.value,
                            }))
                        }
                    />
                </label>
                <button type="submit">Guardar alertas</button>
            </form>
            {message && <p role="status">{message}</p>}
        </section>
    );
}
