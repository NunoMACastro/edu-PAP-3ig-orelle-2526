import { useState } from "react";
import { apiRequest } from "../services/apiClient.js";

export function FacePhotoUploadPage() {
    const [accepted, setAccepted] = useState(false);
    const [frontal, setFrontal] = useState(null);
    const [perfil, setPerfil] = useState(null);
    const [status, setStatus] = useState("idle");
    const [message, setMessage] = useState("");

    async function handleSubmit(event) {
        event.preventDefault();
        setStatus("loading");
        setMessage("");

        try {
            await apiRequest("/face-consent", {
                method: "POST",
                body: JSON.stringify({ accepted, version: "face-analysis-v1" }),
            });

            const formData = new FormData();
            formData.append("frontal", frontal);
            formData.append("perfil", perfil);

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
                        onChange={(event) => setFrontal(event.target.files[0])}
                    />
                </label>
                <label>
                    Fotografia de perfil
                    <input
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                        onChange={(event) => setPerfil(event.target.files[0])}
                    />
                </label>
                <button
                    type="submit"
                    disabled={!accepted || !frontal || !perfil || status === "loading"}
                >
                    {status === "loading" ? "A enviar..." : "Enviar fotografias"}
                </button>
            </form>
            {message && <p role={status === "error" ? "alert" : undefined}>{message}</p>}
        </section>
    );
}