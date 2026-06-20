/**
 * Pagina de criacao de perfil personalizado do BK-MF0-03.
 */
import { useState } from "react";
import { apiRequest } from "../services/apiClient.js";

const initialForm = {
    nome: "",
    idade: "",
    tipoDePele: "mista",
    genero: "prefiro_nao_dizer",
    objetivosTexto: "hidratar",
};

/**
 * Formulario para criar o perfil do utilizador autenticado.
 *
 * @function ProfileSetupPage
 * @returns {JSX.Element} UI de criacao de perfil.
 */
export function ProfileSetupPage() {
    const [form, setForm] = useState(initialForm);
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(false);

    /**
     * Atualiza um campo do formulario de perfil.
     *
     * @function updateField
     * @param {import("react").ChangeEvent<HTMLInputElement|HTMLSelectElement>} event - Evento do campo.
     * @returns {void}
     */
    function updateField(event) {
        setForm((current) => ({
            ...current,
            [event.target.name]: event.target.value,
        }));
    }

    /**
     * Cria o perfil na API.
     *
     * @async
     * @function handleSubmit
     * @param {import("react").FormEvent<HTMLFormElement>} event - Evento do formulario.
     * @returns {Promise<void>}
     */
    async function handleSubmit(event) {
        event.preventDefault();
        setLoading(true);
        setMessage("");

        const objetivos = form.objetivosTexto
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean);

        try {
            await apiRequest("/profile/me", {
                method: "POST",
                body: JSON.stringify({
                    nome: form.nome,
                    idade: Number(form.idade),
                    tipoDePele: form.tipoDePele,
                    genero: form.genero,
                    objetivos,
                }),
            });

            setMessage("Perfil criado com sucesso");
        } catch (err) {
            setMessage(err.message);
        } finally {
            setLoading(false);
        }
    }

    return (
        <main>
            <h1>Perfil Orélle</h1>
            <form onSubmit={handleSubmit}>
                <label>
                    Nome
                    <input
                        name="nome"
                        value={form.nome}
                        onChange={updateField}
                        required
                    />
                </label>

                <label>
                    Idade
                    <input
                        name="idade"
                        type="number"
                        min="13"
                        max="120"
                        value={form.idade}
                        onChange={updateField}
                        required
                    />
                </label>

                <label>
                    Tipo de pele
                    <select
                        name="tipoDePele"
                        value={form.tipoDePele}
                        onChange={updateField}
                    >
                        <option value="oleosa">Oleosa</option>
                        <option value="seca">Seca</option>
                        <option value="mista">Mista</option>
                        <option value="normal">Normal</option>
                        <option value="sensivel">Sensivel</option>
                    </select>
                </label>

                <label>
                    Genero
                    <select
                        name="genero"
                        value={form.genero}
                        onChange={updateField}
                    >
                        <option value="feminino">Feminino</option>
                        <option value="masculino">Masculino</option>
                        <option value="nao_binario">Não binário</option>
                        <option value="prefiro_nao_dizer">
                            Prefiro não dizer
                        </option>
                    </select>
                </label>

                <label>
                    Objetivos separados por vírgula
                    <input
                        name="objetivosTexto"
                        value={form.objetivosTexto}
                        onChange={updateField}
                    />
                </label>

                <button type="submit" disabled={loading}>
                    {loading ? "A guardar..." : "Guardar perfil"}
                </button>
            </form>

            {message && <p role="status">{message}</p>}
        </main>
    );
}
