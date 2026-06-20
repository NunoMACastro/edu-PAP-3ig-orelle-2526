/**
 * Pagina de edicao de perfil do BK-MF0-04.
 */
import { useEffect, useState } from "react";
import { apiRequest } from "../services/apiClient.js";

/**
 * Formulario de edicao de dados e fotografia stub.
 *
 * @function EditProfilePage
 * @returns {JSX.Element} UI de edicao do perfil.
 */
export function EditProfilePage() {
    const [message, setMessage] = useState("");
    const [loadingProfile, setLoadingProfile] = useState(true);
    const [profileForm, setProfileForm] = useState({
        nome: "",
        idade: "",
        tipoDePele: "mista",
        genero: "prefiro_nao_dizer",
        objetivosTexto: "hidratar",
        allergiesTexto: "",
        avoidIngredientsTexto: "",
        lightMedicalRestrictionsTexto: "",
    });
    const [photoUrl, setPhotoUrl] = useState(
        "http://localhost/avatar-demo.png",
    );

    useEffect(() => {
        apiRequest("/profile/me")
            .then((data) => {
                const profile = data.profile;
                setProfileForm({
                    nome: profile.nome,
                    idade: String(profile.idade),
                    tipoDePele: profile.tipoDePele,
                    genero: profile.genero,
                    objetivosTexto: profile.objetivos.join(", "),
                    allergiesTexto: (profile.allergies ?? []).join(", "),
                    avoidIngredientsTexto: (profile.avoidIngredients ?? []).join(", "),
                    lightMedicalRestrictionsTexto: (
                        profile.lightMedicalRestrictions ?? []
                    ).join(", "),
                });
                if (profile.profilePhotoUrl) {
                    setPhotoUrl(profile.profilePhotoUrl);
                }
            })
            .catch((err) => {
                setMessage(err.message);
            })
            .finally(() => {
                setLoadingProfile(false);
            });
    }, []);

    /**
     * Atualiza um campo do formulario de perfil.
     *
     * @function updateProfileField
     * @param {import("react").ChangeEvent<HTMLInputElement|HTMLSelectElement>} event - Evento do campo.
     * @returns {void}
     */
    function updateProfileField(event) {
        setProfileForm((current) => ({
            ...current,
            [event.target.name]: event.target.value,
        }));
    }

    /**
     * Guarda alteracoes textuais do perfil.
     *
     * @async
     * @function saveProfile
     * @param {import("react").FormEvent<HTMLFormElement>} event - Evento do formulario.
     * @returns {Promise<void>}
     */
    async function saveProfile(event) {
        event.preventDefault();
        const objetivos = profileForm.objetivosTexto
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean);
        const allergies = profileForm.allergiesTexto
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean);
        const avoidIngredients = profileForm.avoidIngredientsTexto
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean);
        const lightMedicalRestrictions =
            profileForm.lightMedicalRestrictionsTexto
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
                    allergies,
                    avoidIngredients,
                    lightMedicalRestrictions,
                }),
            });
            setMessage("Perfil atualizado");
        } catch (err) {
            setMessage(err.message);
        }
    }

    /**
     * Guarda o URL controlado da fotografia stub.
     *
     * @async
     * @function savePhotoStub
     * @param {import("react").FormEvent<HTMLFormElement>} event - Evento do formulario.
     * @returns {Promise<void>}
     */
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
            {loadingProfile && <p role="status">A carregar perfil...</p>}

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
                    <select
                        name="tipoDePele"
                        value={profileForm.tipoDePele}
                        onChange={updateProfileField}
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
                        value={profileForm.genero}
                        onChange={updateProfileField}
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
                    Objetivos
                    <input
                        name="objetivosTexto"
                        value={profileForm.objetivosTexto}
                        onChange={updateProfileField}
                    />
                </label>
                <label>
                    Alergias declaradas
                    <textarea
                        name="allergiesTexto"
                        value={profileForm.allergiesTexto}
                        onChange={updateProfileField}
                    />
                </label>
                <label>
                    Ingredientes a evitar
                    <textarea
                        name="avoidIngredientsTexto"
                        value={profileForm.avoidIngredientsTexto}
                        onChange={updateProfileField}
                    />
                </label>
                <label>
                    Restrições médicas leves
                    <textarea
                        name="lightMedicalRestrictionsTexto"
                        value={profileForm.lightMedicalRestrictionsTexto}
                        onChange={updateProfileField}
                    />
                </label>
                <button type="submit" disabled={loadingProfile}>
                    Guardar alteracoes
                </button>
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
