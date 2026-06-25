/**
 * Página de consentimento e upload facial MF1/MF6.
 */
import { useState } from "react";
import { apiRequest } from "../services/apiClient.js";
import { compressImageForUpload } from "../utils/image-compression.js";

/**
 * Cria o FormData final do upload facial.
 *
 * @async
 * @function buildFacePhotoFormData
 * @param {{frontalFile: File, perfilFile: File}} input - Ficheiros escolhidos pelo utilizador.
 * @returns {Promise<FormData>} FormData com os campos esperados pelo backend.
 */
async function buildFacePhotoFormData({ frontalFile, perfilFile }) {
    const [compressedFrontal, compressedPerfil] = await Promise.all([
        compressImageForUpload(frontalFile),
        compressImageForUpload(perfilFile),
    ]);

    const formData = new FormData();

    // Os nomes dos campos são contrato do backend e não devem ser traduzidos.
    formData.append("frontal", compressedFrontal);
    formData.append("perfil", compressedPerfil);

    return formData;
}

/**
 * Envia consentimento e duas fotografias por FormData.
 *
 * @function FacePhotoUploadPage
 * @returns {JSX.Element} Formulário de upload facial.
 */
export function FacePhotoUploadPage() {
    const [accepted, setAccepted] = useState(false);
    const [frontal, setFrontal] = useState(null);
    const [perfil, setPerfil] = useState(null);
    const [status, setStatus] = useState("idle");
    const [message, setMessage] = useState("");

    /**
     * Aceita consentimento e envia fotos comprimidas quando possível.
     *
     * @async
     * @function handleSubmit
     * @param {import("react").FormEvent<HTMLFormElement>} event - Evento do formulário.
     * @returns {Promise<void>}
     */
    async function handleSubmit(event) {
        event.preventDefault();

        if (!accepted || !frontal || !perfil) {
            setStatus("error");
            setMessage("Aceita o consentimento e seleciona as duas fotografias.");
            return;
        }

        setStatus("loading");
        setMessage("A preparar fotografias...");

        try {
            // O consentimento é registado antes do upload para respeitar o fluxo facial.
            await apiRequest("/face-consent", {
                method: "POST",
                body: JSON.stringify({
                    accepted: true,
                    version: "face-analysis-v1",
                }),
            });

            const formData = await buildFacePhotoFormData({
                frontalFile: frontal,
                perfilFile: perfil,
            });

            // O apiRequest deteta FormData e evita forçar Content-Type errado.
            const data = await apiRequest("/face-photos", {
                method: "POST",
                body: formData,
            });

            setStatus("success");
            setMessage(`${data.photos.length} fotografias guardadas.`);
        } catch (err) {
            setStatus("error");
            setMessage(err.message);
        }
    }

    return (
        <section>
            <h1>Fotografias para análise facial</h1>
            <form onSubmit={handleSubmit}>
                <label>
                    <input
                        type="checkbox"
                        checked={accepted}
                        onChange={(event) => setAccepted(event.target.checked)}
                    />
                    Aceito o tratamento destas fotografias para análise facial cosmética.
                </label>
                <label>
                    Fotografia frontal
                    <input
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                        onChange={(event) =>
                            setFrontal(event.target.files[0] ?? null)
                        }
                    />
                </label>
                <label>
                    Fotografia de perfil
                    <input
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                        onChange={(event) =>
                            setPerfil(event.target.files[0] ?? null)
                        }
                    />
                </label>
                <button
                    type="submit"
                    disabled={!accepted || !frontal || !perfil || status === "loading"}
                >
                    {status === "loading" ? "A enviar..." : "Enviar fotografias"}
                </button>
            </form>
            {message && (
                <p role={status === "error" ? "alert" : "status"}>
                    {message}
                </p>
            )}
        </section>
    );
}