/**
 * Página de recomendações personalizadas da MF2.
 */
import { useState } from "react";
import { apiRequest } from "../services/apiClient.js";

/**
 * Mostra recomendações personalizadas e permite enviar feedback do cliente.
 *
 * @function ProductRecommendationsPage
 * @param {{onRecommendationsChange?: Function}} props - Callback para sincronizar recomendações com outras páginas.
 * @returns {import("react").JSX.Element} Página de recomendações personalizadas.
 */
export function ProductRecommendationsPage({ onRecommendationsChange = () => {} }) {
    const [recommendations, setRecommendations] = useState([]);
    const [status, setStatus] = useState("idle");
    const [error, setError] = useState("");

    /**
     * Pede ao backend para gerar novas recomendações personalizadas.
     *
     * @async
     * @function generateRecommendations
     * @returns {Promise<void>}
     */
    async function generateRecommendations() {
        setStatus("loading");
        setError("");

        try {
            const data = await apiRequest("/recommendations/generate", {
                method: "POST",
            });
            setRecommendations(data.recommendations);
            onRecommendationsChange(data.recommendations);
            setStatus("success");
        } catch (err) {
            setError(err.message);
            setStatus("error");
        }
    }

    /**
     * Carrega recomendações já existentes para o utilizador autenticado.
     *
     * @async
     * @function loadRecommendations
     * @returns {Promise<void>}
     */
    async function loadRecommendations() {
        setStatus("loading");
        setError("");

        try {
            const data = await apiRequest("/recommendations");
            setRecommendations(data.recommendations);
            onRecommendationsChange(data.recommendations);
            setStatus(data.recommendations.length === 0 ? "empty" : "success");
        } catch (err) {
            setError(err.message);
            setStatus("error");
        }
    }

    /**
     * Regista feedback de utilidade para uma recomendação específica.
     *
     * @async
     * @function submitFeedback
     * @param {string} recommendationId - ID da recomendação avaliada.
     * @param {string} feedback - Valor de feedback enviado ao backend.
     * @returns {Promise<void>}
     */
    async function submitFeedback(recommendationId, feedback) {
        try {
            const data = await apiRequest(
                `/recommendations/${recommendationId}/feedback`,
                {
                    method: "POST",
                    body: JSON.stringify({ value: feedback }),
                },
            );
            setRecommendations((items) => {
                const updated = items.map((item) =>
                    item.id === recommendationId ? data.recommendation : item,
                );
                onRecommendationsChange(updated);
                return updated;
            });
        } catch (err) {
            setError(err.message);
            setStatus("error");
        }
    }

    return (
        <section>
            <h1>Recomendações personalizadas</h1>
            <button onClick={generateRecommendations} disabled={status === "loading"}>
                Gerar recomendações
            </button>
            <button onClick={loadRecommendations} disabled={status === "loading"}>
                Ver recomendações existentes
            </button>
            {status === "error" && <p role="alert">{error}</p>}
            {status === "empty" && <p>Ainda não existem recomendações.</p>}
            {status === "success" && (
                <ul>
                    {recommendations.map((recommendation) => (
                        <li key={recommendation.id}>
                            <article>
                                <h2>{recommendation.product.name}</h2>
                                <p>{recommendation.explanation}</p>
                                <p>
                                    Score: {Math.round(recommendation.score * 100)}% | Estado:{" "}
                                    {recommendation.status}
                                </p>
                                <p>Motivos: {recommendation.reasonCodes.join(", ")}</p>
                                {recommendation.consultantNote && (
                                    <p>Nota do consultor: {recommendation.consultantNote}</p>
                                )}
                                <button
                                    onClick={() => submitFeedback(recommendation.id, "util")}
                                >
                                    Útil
                                </button>
                                <button
                                    onClick={() =>
                                        submitFeedback(recommendation.id, "nao_relevante")
                                    }
                                >
                                    Não relevante
                                </button>
                            </article>
                        </li>
                    ))}
                </ul>
            )}
        </section>
    );
}
