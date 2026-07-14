/**
 * Pagina de preferencias de alertas de rotina.
 */
import { useEffect, useState } from "react";
import { PageHero, SectionCard } from "../components/OrelleUi.jsx";
import { apiRequest } from "../services/apiClient.js";

/**
 * Permite consultar e guardar a preferencia pessoal de alertas de rotina.
 *
 * @function RoutineAlertsPage
 * @returns {JSX.Element} UI de configuracao de alertas.
 */
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

    /**
     * Guarda a preferencia atual de alerta noturno.
     *
     * @async
     * @function savePreference
     * @param {import("react").FormEvent<HTMLFormElement>} event - Submissao do formulario.
     * @returns {Promise<void>}
     */
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
        <section className="routine-alerts-page">
            <PageHero eyebrow="Pele e rotina" title="Alertas da rotina" description="Escolhe um horário simples para não perderes o cuidado noturno." />
            <SectionCard title={form.enabled ? "Lembrete ativo" : "Lembrete desativado"} description={form.enabled ? `Receberás um alerta diário às ${form.eveningTime}.` : "Ativa quando quiseres criar este hábito."}>
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
            </SectionCard>
        </section>
    );
}
