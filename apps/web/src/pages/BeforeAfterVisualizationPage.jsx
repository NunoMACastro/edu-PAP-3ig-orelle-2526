/**
 * Página de visualização antes/depois da MF2.
 */
import { useState } from "react";
import { OptimizedImage } from "../components/OptimizedImage.jsx";
import { apiRequest } from "../services/apiClient.js";

/**
 * Mostra o fluxo que gera uma comparação visual segura a partir da simulação ativa.
 *
 * @function BeforeAfterVisualizationPage
 * @param {{simulation?: object|null}} props - Simulação de maquilhagem escolhida.
 * @returns {import("react").JSX.Element} Página de visualização antes/depois.
 */
export function BeforeAfterVisualizationPage({ simulation = null }) {
    const [visualization, setVisualization] = useState(null);
    const [status, setStatus] = useState("idle");
    const [error, setError] = useState("");

    /**
     * Submete a simulação ao backend para criar a visualização antes/depois.
     *
     * @async
     * @function submitVisualization
     * @param {import("react").FormEvent<HTMLFormElement>} event - Evento de submissão do formulário.
     * @returns {Promise<void>}
     */
    async function submitVisualization(event) {
        event.preventDefault();
        setStatus("loading");
        setError("");

        try {
            const data = await apiRequest("/before-after-visualizations", {
                method: "POST",
                body: JSON.stringify({ simulationId: simulation.id }),
            });
            setVisualization(data.visualization);
            setStatus("success");
        } catch (err) {
            setError(err.message);
            setStatus("error");
        }
    }

    return (
        <section>
            <h1>Visualização antes/depois</h1>
            {!simulation && (
                <p>Gera uma simulação de maquilhagem antes de criar a visualização.</p>
            )}
            {simulation && <p>Simulação selecionada: {simulation.product.name}</p>}
            <form onSubmit={submitVisualization}>
                <button
                    type="submit"
                    disabled={status === "loading" || !simulation}
                >
                    Gerar visualização
                </button>
            </form>
            {status === "error" && <p role="alert">{error}</p>}
            {status === "success" && visualization && (
                <article>
                    <div className="preview-grid">
                        <section>
                            <h2>{visualization.beforePanel.label}</h2>
                            {visualization.visualComparison?.beforeImageUrl && (
                                <OptimizedImage
                                    src={visualization.visualComparison.beforeImageUrl}
                                    alt={`${visualization.visualComparison.altText} Antes.`}
                                    width="320"
                                    height="210"
                                />
                            )}
                            <p>{visualization.beforePanel.description}</p>
                        </section>
                        <section>
                            <h2>{visualization.afterPanel.label}</h2>
                            {visualization.visualComparison?.afterImageUrl && (
                                <OptimizedImage
                                    src={visualization.visualComparison.afterImageUrl}
                                    alt={`${visualization.visualComparison.altText} Depois.`}
                                    width="320"
                                    height="210"
                                />
                            )}
                            <p>{visualization.afterPanel.description}</p>
                        </section>
                    </div>
                    <p>{visualization.summary}</p>
                    <ul>
                        {visualization.recommendedProductNames.map((name) => (
                            <li key={name}>{name}</li>
                        ))}
                    </ul>
                    <ul>
                        {visualization.limitations.map((limitation) => (
                            <li key={limitation}>{limitation}</li>
                        ))}
                    </ul>
                </article>
            )}
        </section>
    );
}
