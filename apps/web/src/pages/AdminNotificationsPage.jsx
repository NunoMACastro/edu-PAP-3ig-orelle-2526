/**
 * Pagina admin para campanhas internas.
 */
import { useState } from "react";
import { apiRequest } from "../services/apiClient.js";

export function AdminNotificationsPage() {
    const [form, setForm] = useState({
        type: "promotion",
        title: "Novidade Orélle",
        message: "Temos novidades cosméticas disponíveis na app.",
        targetRole: "cliente",
    });
    const [message, setMessage] = useState("");

    function updateField(event) {
        setForm((current) => ({
            ...current,
            [event.target.name]: event.target.value,
        }));
    }

    async function createCampaign(event) {
        event.preventDefault();

        try {
            const data = await apiRequest("/admin/notifications/campaigns", {
                method: "POST",
                body: JSON.stringify(form),
            });
            setMessage(`${data.createdCount} notificações criadas.`);
        } catch (err) {
            setMessage(err.message);
        }
    }

    return (
        <section>
            <h1>Campanhas internas</h1>
            <form onSubmit={createCampaign}>
                <label>
                    Tipo
                    <select name="type" value={form.type} onChange={updateField}>
                        <option value="promotion">Promoção</option>
                        <option value="new_product">Novo produto</option>
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
                <button type="submit">Criar campanha</button>
            </form>
            {message && <p role="status">{message}</p>}
        </section>
    );
}
