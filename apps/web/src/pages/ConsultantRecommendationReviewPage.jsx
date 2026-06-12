/**
 * Pagina minima para revisao manual de recomendacoes.
 */
import { useEffect, useState } from "react";
import { apiRequest } from "../services/apiClient.js";

export function ConsultantRecommendationReviewPage({ recommendations = [] }) {
    const [selectedRecommendationId, setSelectedRecommendationId] = useState("");
    const [statusValue, setStatusValue] = useState("approved");
    const [note, setNote] = useState("");
    const [adjustedExplanation, setAdjustedExplanation] = useState("");
    const [review, setReview] = useState(null);
    const [status, setStatus] = useState("idle");
    const [error, setError] = useState("");
    const hasRecommendations = recommendations.length > 0;

    useEffect(() => {
        if (!hasRecommendations) {
            setSelectedRecommendationId("");
            return;
        }

        const stillExists = recommendations.some(
            (recommendation) => recommendation.id === selectedRecommendationId,
        );

        if (!stillExists) {
            setSelectedRecommendationId(recommendations[0].id);
        }
    }, [hasRecommendations, recommendations, selectedRecommendationId]);

    async function submitReview(event) {
        event.preventDefault();
        setStatus("loading");
        setError("");

        try {
            const data = await apiRequest(
                `/consultant/recommendations/${selectedRecommendationId}/reviews`,
                {
                    method: "POST",
                    body: JSON.stringify({
                        status: statusValue,
                        note,
                        adjustedExplanation:
                            statusValue === "adjusted" ? adjustedExplanation : undefined,
                    }),
                },
            );
            setReview(data.review);
            setStatus("success");
        } catch (err) {
            setError(err.message);
            setStatus("error");
        }
    }

    return (
        <section>
            <h1>Revisão de recomendação</h1>
            {!hasRecommendations && (
                <p>Carrega ou gera recomendações antes de submeter uma revisão.</p>
            )}
            <form onSubmit={submitReview}>
                <label>
                    Recomendação
                    <select
                        value={selectedRecommendationId}
                        onChange={(event) =>
                            setSelectedRecommendationId(event.target.value)
                        }
                        disabled={!hasRecommendations}
                    >
                        {recommendations.map((recommendation) => (
                            <option key={recommendation.id} value={recommendation.id}>
                                {recommendation.product.name} - {recommendation.status}
                            </option>
                        ))}
                    </select>
                </label>
                <label>
                    Estado
                    <select
                        value={statusValue}
                        onChange={(event) => setStatusValue(event.target.value)}
                    >
                        <option value="approved">Aprovar</option>
                        <option value="adjusted">Ajustar</option>
                        <option value="rejected">Rejeitar</option>
                    </select>
                </label>
                <label>
                    Nota
                    <textarea
                        value={note}
                        onChange={(event) => setNote(event.target.value)}
                    />
                </label>
                {statusValue === "adjusted" && (
                    <label>
                        Explicação ajustada
                        <textarea
                            value={adjustedExplanation}
                            onChange={(event) =>
                                setAdjustedExplanation(event.target.value)
                            }
                        />
                    </label>
                )}
                <button
                    type="submit"
                    disabled={status === "loading" || !selectedRecommendationId}
                >
                    Submeter revisão
                </button>
            </form>
            {status === "error" && <p role="alert">{error}</p>}
            {status === "success" && review && (
                <article>
                    <h2>{review.recommendation.product.name}</h2>
                    <p>{review.recommendation.explanation}</p>
                    <p>Decisão: {review.status}</p>
                    <p>Nota: {review.note}</p>
                </article>
            )}
        </section>
    );
}
