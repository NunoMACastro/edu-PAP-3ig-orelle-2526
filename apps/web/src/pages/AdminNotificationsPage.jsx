/**
 * Pagina admin para campanhas internas.
 */
import { useState } from "react";
import { AdminPageHeader } from "../components/AdminUi.jsx";
import { apiRequest } from "../services/apiClient.js";

/**
 * Mostra o formulario admin usado para criar campanhas de notificacoes internas.
 *
 * @function AdminNotificationsPage
 * @returns {JSX.Element} UI administrativa de campanhas.
 */
export function AdminNotificationsPage() {
    const [form, setForm] = useState({
        type: "promotion",
        title: "Novidade Orélle",
        message: "Temos novidades cosméticas disponíveis na app.",
        targetRole: "cliente",
    });
    const [campaignStatus, setCampaignStatus] = useState("idle");
    const [campaignMessage, setCampaignMessage] = useState("");
    const [routineStatus, setRoutineStatus] = useState("idle");
    const [routineMessage, setRoutineMessage] = useState("");

    /**
     * Atualiza o campo editado mantendo os restantes valores da campanha.
     *
     * @function updateField
     * @param {import("react").ChangeEvent<HTMLInputElement|HTMLSelectElement|HTMLTextAreaElement>} event - Evento do campo editado.
     * @returns {void}
     */
    function updateField(event) {
        setForm((current) => ({
            ...current,
            [event.target.name]: event.target.value,
        }));
    }

    /**
     * Submete a campanha ao backend e mostra o numero de notificacoes criadas.
     *
     * @async
     * @function createCampaign
     * @param {import("react").FormEvent<HTMLFormElement>} event - Submissao do formulario.
     * @returns {Promise<void>}
     */
    async function createCampaign(event) {
        event.preventDefault();
        setCampaignStatus("loading");
        setCampaignMessage("");

        try {
            const data = await apiRequest("/admin/notifications/campaigns", {
                method: "POST",
                body: JSON.stringify(form),
            });
            setCampaignMessage(`${data.createdCount} notificações criadas.`);
            setCampaignStatus("success");
        } catch (err) {
            setCampaignMessage(err.message);
            setCampaignStatus("error");
        }
    }

    /**
     * Executa explicitamente os alertas de rotina devidos neste momento.
     *
     * @returns {Promise<void>}
     */
    async function runRoutineAlerts() {
        setRoutineStatus("loading");
        setRoutineMessage("");

        try {
            const data = await apiRequest("/admin/routine-alerts/run", {
                method: "POST",
                body: JSON.stringify({}),
            });
            setRoutineMessage(
                `${data.createdCount} alerta(s) de rotina criado(s).`,
            );
            setRoutineStatus("success");
        } catch (err) {
            setRoutineMessage(err.message);
            setRoutineStatus("error");
        }
    }

    return (
        <section className="admin-page admin-campaigns-page">
            <AdminPageHeader eyebrow="Operações" title="Campanhas" description="Cria notificações segmentadas na aplicação e gere lembretes de rotina." />
            <div className="admin-two-column">
            <form className="admin-panel admin-campaign-form" onSubmit={createCampaign}>
                <h2>Nova campanha</h2>
                <label>
                    Tipo
                    <select name="type" value={form.type} onChange={updateField}>
                        <option value="promotion">Promoção</option>
                        <option value="new_product">Novo produto</option>
                    </select>
                </label>
                <label>
                    Destinatários
                    <select
                        name="targetRole"
                        value={form.targetRole}
                        onChange={updateField}
                    >
                        <option value="cliente">Clientes</option>
                        <option value="consultor">Consultores</option>
                        <option value="administrador">Administradores</option>
                    </select>
                </label>
                <label>
                    Título
                    <input name="title" value={form.title} onChange={updateField} />
                </label>
                <label>
                    Mensagem
                    <textarea
                        name="message"
                        value={form.message}
                        onChange={updateField}
                    />
                </label>
                <button type="submit" disabled={campaignStatus === "loading"}>
                    {campaignStatus === "loading"
                        ? "A criar campanha…"
                        : "Criar campanha"}
                </button>
                {campaignMessage ? (
                    <p role={campaignStatus === "error" ? "alert" : "status"}>
                        {campaignMessage}
                    </p>
                ) : null}
            </form>

            <section className="admin-panel admin-routine-panel" aria-labelledby="routine-alert-run-title">
                <h2 id="routine-alert-run-title">Alertas de rotina</h2>
                <p>
                    Esta ação cria os lembretes de rotina que estão devidos e
                    respeita as preferências de cada cliente.
                </p>
                <button
                    type="button"
                    onClick={runRoutineAlerts}
                    disabled={routineStatus === "loading"}
                >
                    {routineStatus === "loading"
                        ? "A executar alertas…"
                        : "Executar alertas devidos"}
                </button>
                {routineMessage ? (
                    <p role={routineStatus === "error" ? "alert" : "status"}>
                        {routineMessage}
                    </p>
                ) : null}
            </section>
            </div>
        </section>
    );
}
