/**
 * Pagina de comparacao temporal de pele da MF3.
 */
import { useState } from "react";
import { apiRequest } from "../services/apiClient.js";

/**
 * Permite comparar duas analises faciais do proprio utilizador.
 *
 * @function SkinComparisonPage
 * @returns {JSX.Element} Formulario e resultado minimizado da comparacao.
 */
export function SkinComparisonPage() {
    const [baselineAnalysisId, setBaselineAnalysisId] = useState("");
    const [followUpAnalysisId, setFollowUpAnalysisId] = useState("");
    const [comparison, setComparison] = useState(null);
    const [status, setStatus] = useState("idle");
    const [error, setError] = useState("");

    /**
     * Submete IDs das analises ao backend.
     *
     * @async
     * @function handleSubmit
     * @param {import("react").FormEvent<HTMLFormElement>} event - Evento do formulario.
     * @returns {Promise<void>}
     */
    async function handleSubmit(event) {
        event.preventDefault();
        setStatus("loading");
        setError("");
        setComparison(null);

        try {
            const data = await apiRequest("/me/skin-comparisons", {
                method: "POST",
                body: JSON.stringify({ baselineAnalysisId, followUpAnalysisId }),
            });
            setComparison(data.comparison);
            setStatus("success");
        } catch (err) {
            setError(err.message);
            setStatus("error");
        }
    }

    return (
        <section>
            <h1>Comparação após 30 dias</h1>
            <form onSubmit={handleSubmit}>
                <label>
                    ID da análise inicial
                    <input
                        value={baselineAnalysisId}
                        onChange={(event) =>
                            setBaselineAnalysisId(event.target.value)
                        }
                    />
                </label>
                <label>
                    ID da análise final
                    <input
                        value={followUpAnalysisId}
                        onChange={(event) =>
                            setFollowUpAnalysisId(event.target.value)
                        }
                    />
                </label>
                <button type="submit" disabled={status === "loading"}>
                    {status === "loading" ? "A comparar..." : "Comparar análises"}
                </button>
            </form>

            {status === "error" && <p role="alert">{error}</p>}
            {status === "success" && comparison && (
                <article>
                    <h2>Resumo</h2>
                    <p>{comparison.summary}</p>
                    <p>{comparison.daysBetween} dias entre análises.</p>
                    <ul>
                        {comparison.metricDeltas.map((delta) => (
                            <li key={delta.metric}>
                                <strong>{delta.metric}</strong>: {delta.changeLabel}
                            </li>
                        ))}
                    </ul>
                    <h3>Limitações</h3>
                    <ul>
                        {comparison.limitations.map((limitation) => (
                            <li key={limitation}>{limitation}</li>
                        ))}
                    </ul>
                </article>
            )}
        </section>
    );
}
