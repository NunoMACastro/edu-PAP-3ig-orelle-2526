import { useEffect, useState } from "react";
import { apiRequest } from "../services/apiClient.js";

export function ProductRecommendationsPage() {
    const [status, setStatus] = useState("loading");
    const [error, setError] = useState("");
    const [recommendations, setRecommendations] = useState([]);
    const [limitations, setLimitations] = useState([]);

    async function loadRecommendations() {
        const data = await apiRequest("/api/recommendations");
        setRecommendations(data.recommendations);
        setStatus(data.recommendations.length === 0 ? "empty" : "success");
    }

    async function generateRecommendations() {
        setStatus("loading");
        setError("");

        try {
            const data = await apiRequest("/api/recommendations/generate", {
                method: "POST",
            });
            setRecommendations(data.recommendations);
            setLimitations(data.limitations ?? []);
            setStatus("success");
        } catch (err) {
            setError(err.message);
            setStatus("error");
        }
    }
    async function submitFeedback(recommendationId, value) {
        setStatus("loading");
        setError("");

        try {
            const data = await apiRequest(`/api/recommendations/${recommendationId}/feedback`, {
                method: "POST",
                body: JSON.stringify({ value }),
            });

            setRecommendations((current) =>
                current.map((recommendation) =>
                    recommendation.id === recommendationId
                        ? data.recommendation
                        : recommendation,
            ),
        );
            setStatus("success");
        } catch (err) {
            setError(err.message);
            setStatus("error");
        }
    }
    useEffect(() => {
        loadRecommendations().catch((err) => {
            setError(err.message);
            setStatus("error");
        });
    }, []);

    return (
        <section>
            <h1>Recomendações personalizadas</h1>
            <button type="button" onClick={generateRecommendations} disabled={status === "loading"}>
                Gerar recomendações
            </button>

            {status === "loading" && <p>A carregar recomendações...</p>}
            {status === "error" && <p role="alert">{error}</p>}
            {status === "empty" && <p>Ainda não existem recomendações geradas.</p>}

            {status === "success" && (
                <div>
                    {recommendations.map((recommendation) => (
                        <article key={recommendation.id}>
                            <img src={recommendation.product.imageUrl} alt="" width="96" height="96" />
                            <h2>{recommendation.product.name}</h2>
                            <p>{recommendation.product.brandName}</p>
                            <p>{recommendation.explanation}</p>
                            <RecommendationReasonList reasonCodes={recommendation.reasonCodes} />
                            <p>Score: {Math.round(recommendation.score * 100)}%</p>
                            <p>Preço: {(recommendation.product.priceCents / 100).toFixed(2)} €</p>
                            <button type="button" onClick={() => submitFeedback(recommendation.id, "util")}>
                                Útil
                            </button>
                            <button type="button" onClick={() => submitFeedback(recommendation.id, "nao_relevante")}>
                                Não relevante
                            </button>
                            {recommendation.feedback?.value && (
                                <p>Feedback registado: {recommendation.feedback.value.replace("_", " ")}</p>
                )}
                        </article>
                    ))}

                    {limitations.length > 0 && (
                        <ul>
                            {limitations.map((limitation) => (
                                <li key={limitation}>{limitation}</li>
                            ))}
                        </ul>
                    )}
                </div>
            )}
        </section>
    );
}
function RecommendationReasonList({ reasonCodes }) {
    if (!reasonCodes?.length) {
        return <p>Motivo indisponível.</p>;
    }

    return (
        <ul aria-label="Motivos da recomendação">
            {reasonCodes.map((code) => (
                <li key={code}>{code.replaceAll("_", " ")}</li>
            ))}
        </ul>
    );
}
