import { useState } from "react";
import { FeedbackMessage } from "../components/FeedbackMessage.jsx";
import { SubmitButton } from "../components/SubmitButton.jsx";
import { apiRequest } from "../services/apiClient.js";

/**
 * Envia consentimento e duas fotografias por FormData.
 *
 * @function FacePhotoUploadPage
 * @returns {JSX.Element} Formulário de upload facial com feedback seguro.
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
     * @param {import("react").FormEvent<HTMLFormElement>} event - Evento do formulário.
     * @returns {Promise<void>}
     */
    async function handleSubmit(event) {
        event.preventDefault();
        // Sem consentimento e duas fotografias, o formulário não deve iniciar o fluxo sensível.
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

            const formData = new FormData();
            formData.append("frontal", frontal);
            formData.append("perfil", perfil);

            // O apiRequest deteta FormData e evita forçar Content-Type errado no upload.
            const data = await apiRequest("/face-photos", {
                method: "POST",
                body: formData,
            });

            setStatus("success");
            setMessage(`${data.photos.length} fotografias guardadas com segurança.`);
        } catch (err) {
            // A UI mostra uma mensagem controlada e não expõe paths, cookies ou detalhes dos ficheiros.
            setStatus("error");
            setMessage(err.message);
        }
    }

    const isBusy = status === "loading";
    const isSubmitDisabled = !accepted || !frontal || !perfil || isBusy;
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
                    disabled={isSubmitDisabled}
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