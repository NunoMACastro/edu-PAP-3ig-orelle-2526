/**
 * Pagina de consentimento e upload facial MF1 com feedback acessivel MF5.
 */
import { useState } from "react";
import { FeedbackMessage } from "../components/FeedbackMessage.jsx";
import { SubmitButton } from "../components/SubmitButton.jsx";
import { apiRequest } from "../services/apiClient.js";
import { compressImageForUpload } from "../utils/imageOptimization.js";

/**
 * Envia consentimento e duas fotografias por FormData.
 *
 * @function FacePhotoUploadPage
 * @returns {JSX.Element} Formulario de upload facial com feedback seguro.
 */
export function FacePhotoUploadPage() {
    const [accepted, setAccepted] = useState(false);
    const [frontal, setFrontal] = useState(null);
    const [perfil, setPerfil] = useState(null);
    const [status, setStatus] = useState("idle");
    const [message, setMessage] = useState("");

    /**
     * Aceita consentimento e envia fotografias para a API.
     *
     * @async
     * @function handleSubmit
     * @param {import("react").FormEvent<HTMLFormElement>} event - Evento do formulario.
     * @returns {Promise<void>}
     */
    async function handleSubmit(event) {
        event.preventDefault();
        if (!accepted || !frontal || !perfil) {
            setStatus("error");
            setMessage("Aceita o consentimento e escolhe as duas fotografias.");
            return;
        }

        setStatus("loading");
        setMessage("");

        try {
            await apiRequest("/face-consent", {
                method: "POST",
                body: JSON.stringify({
                    accepted,
                    version: "face-analysis-v1",
                }),
            });

            const [optimizedFrontal, optimizedPerfil] = await Promise.all([
                compressImageForUpload(frontal),
                compressImageForUpload(perfil),
            ]);
            const formData = new FormData();
            formData.append("frontal", optimizedFrontal);
            formData.append("perfil", optimizedPerfil);

            // O apiRequest deteta FormData e evita forcar Content-Type errado no upload.
            const data = await apiRequest("/face-photos", {
                method: "POST",
                body: formData,
            });

            setStatus("success");
            setMessage(`${data.photos.length} fotografias guardadas com seguranca.`);
        } catch (err) {
            // A UI mostra texto controlado e nao expoe paths, cookies ou detalhes dos ficheiros.
            setStatus("error");
            setMessage(err.message);
        }
    }

    const isBusy = status === "loading";
    const feedbackType = status === "error" ? "error" : "success";

    return (
        <section>
            <h1>Fotografias para análise facial</h1>
            <form
                aria-describedby={message ? "face-photo-feedback" : undefined}
                onSubmit={handleSubmit}
            >
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
                <SubmitButton
                    isBusy={isBusy}
                    busyText="A enviar fotografias..."
                >
                    Enviar fotografias
                </SubmitButton>
            </form>
            <FeedbackMessage id="face-photo-feedback" type={feedbackType}>
                {message}
            </FeedbackMessage>
        </section>
    );
}
