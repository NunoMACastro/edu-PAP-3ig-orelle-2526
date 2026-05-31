import { useState } from "react";
import { apiRequest } from "../services/apiClient.js";

export function EditProfilePage() {
    const [message, setMessage] = useState("");
    const [profileForm, setProfileForm] = useState({
        nome: "",
        idade: "",
        tipoDePele: "mista",
        genero: "prefiro_nao_dizer",
        objetivosTexto: "hidratar",
    });
    const [photoUrl, setPhotoUrl] = useState(
        "http://localhost/avatar-demo.png",
    );

    function updateProfileField(event) {
        setProfileForm((current) => ({
            ...current,
            [event.target.name]: event.target.value,
        }));
    }

    async function saveProfile(event) {
        event.preventDefault();
        const objetivos = profileForm.objetivosTexto
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean);

        try {
            await apiRequest("/profile/me", {
                method: "PUT",
                body: JSON.stringify({
                    nome: profileForm.nome,
                    idade: Number(profileForm.idade),
                    tipoDePele: profileForm.tipoDePele,
                    genero: profileForm.genero,
                    objetivos,
                }),
            });
            setMessage("Perfil atualizado");
        } catch (err) {
            setMessage(err.message);
        }
    }

    async function savePhotoStub(event) {
        event.preventDefault();

        try {
            await apiRequest("/profile/me/photo", {
                method: "PATCH",
                body: JSON.stringify({
                    profilePhotoMode: "stub_url",
                    profilePhotoUrl: photoUrl,
                }),
            });
            setMessage("Fotografia stub atualizada");
        } catch (err) {
            setMessage(err.message);
        }
    }

    return (
        <main>
            <h1>Editar perfil</h1>

            <form onSubmit={saveProfile}>
                <label>
                    Nome
                    <input
                        name="nome"
                        value={profileForm.nome}
                        onChange={updateProfileField}
                    />
                </label>
                <label>
                    Idade
                    <input
                        name="idade"
                        type="number"
                        value={profileForm.idade}
                        onChange={updateProfileField}
                    />
                </label>
                <label>
                    Tipo de pele
                    <input
                        name="tipoDePele"
                        value={profileForm.tipoDePele}
                        onChange={updateProfileField}
                    />
                </label>
                <label>
                    Genero
                    <input
                        name="genero"
                        value={profileForm.genero}
                        onChange={updateProfileField}
                    />
                </label>
                <label>
                    Objetivos
                    <input
                        name="objetivosTexto"
                        value={profileForm.objetivosTexto}
                        onChange={updateProfileField}
                    />
                </label>
                <button type="submit">Guardar alteracoes</button>
            </form>

            <form onSubmit={savePhotoStub}>
                <label>
                    URL controlado da fotografia
                    <input
                        value={photoUrl}
                        onChange={(event) => setPhotoUrl(event.target.value)}
                    />
                </label>
                <button type="submit">Guardar fotografia stub</button>
            </form>

            {message && <p role="status">{message}</p>}
        </main>
    );
}