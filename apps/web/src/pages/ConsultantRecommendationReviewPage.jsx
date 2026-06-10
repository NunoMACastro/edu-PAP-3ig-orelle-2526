import { useState } from "react";
import { apiRequest } from "../services/apiClient.js";

export function ConsultantRecommendationReviewPage() {
    const [recommendationId, setRecommendationId] = useState("");
    const [statusValue, setStatusValue] = useState("approved");
    const [note, setNote] = useState("");
    const [adjustedExplanation, setAdjustedExplanation] = useState("");
    const [status, setStatus] = useState("idle");
    const [error, setError] = useState("");
    const [result, setResult] = useState(null);

    async function submitReview(event) {
        event.preventDefault();
        setStatus("loading");
        setError("");

        try {
            const data = await apiRequest(
                `/api/consultant/recommendations/${recommendationId}/reviews`,
                {
                    method: "POST",
                    body: JSON.stringify({
                        status: statusValue,
                        note,
                        adjustedExplanation: statusValue === "adjusted" ? adjustedExplanation : null,
                    }),
                },
            );

            setResult(data);
            setStatus("success");
        } catch (err) {
            setError(err.message);
            setStatus("error");
        }
    }

    return (
        <section>
            <h1>Rever recomendação</h1>
            <form onSubmit={submitReview}>
                <label>
                    ID da recomendação
                    <input value={recommendationId} onChange={(event) => setRecommendationId(event.target.value)} />
                </label>
                <label>
                    Decisão
                    <select value={statusValue} onChange={(event) => setStatusValue(event.target.value)}>
                        <option value="approved">Aprovar</option>
                        <option value="adjusted">Ajustar</option>
                        <option value="rejected">Rejeitar</option>
                    </select>
                </label>
                <label>
                    Nota
                    <textarea value={note} onChange={(event) => setNote(event.target.value)} />
                </label>
                {statusValue === "adjusted" && (
                    <label>
                        Explicação ajustada
                        <textarea
                            value={adjustedExplanation}
                            onChange={(event) => setAdjustedExplanation(event.target.value)}
                        />
                    </label>
                )}
                <button type="submit" disabled={status === "loading"}>Guardar revisão</button>
            </form>
            {status === "error" && <p role="alert">{error}</p>}
            {status === "success" && result && <p>Revisão registada: {result.review.status}</p>}
        </section>
    );
}