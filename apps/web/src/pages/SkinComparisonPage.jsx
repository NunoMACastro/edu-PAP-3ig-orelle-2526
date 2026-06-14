import { useEffect, useMemo, useState } from "react";
import { apiRequest } from "../services/apiClient.js";

/**
 * Página que permite escolher duas análises reais do histórico pessoal e criar a comparação.
 * @returns {JSX.Element} Interface de comparação facial.
 */
export function SkinComparisonPage() {
    const [baselineAnalysisId, setBaselineAnalysisId] = useState("");
    const [followUpAnalysisId, setFollowUpAnalysisId] = useState("");
    const [history, setHistory] = useState([]);
    const [comparison, setComparison] = useState(null);
    const [historyStatus, setHistoryStatus] = useState("idle");
    const [submitStatus, setSubmitStatus] = useState("idle");
    const [error, setError] = useState("");

    const analyses = useMemo(
        () => history.filter((item) => item.type === "analysis"),
        [history],
    );
    const canSubmit =
        baselineAnalysisId &&
        followUpAnalysisId &&
        baselineAnalysisId !== followUpAnalysisId &&
        submitStatus !== "loading";

    useEffect(() => {
        /**
         * Carrega o histórico pessoal e mantém apenas entradas de análise facial.
         * @returns {Promise<void>}
         */
        async function loadHistory() {
            setHistoryStatus("loading");
            setError("");

            try {
                // A autenticação via cookie HttpOnly segue no pedido; a página não guarda tokens.
                const data = await apiRequest("/me/skin-history", {
                    credentials: "include",
                });
                const safeHistory = Array.isArray(data.history) ? data.history : [];
                setHistory(safeHistory);
                setHistoryStatus(safeHistory.some((item) => item.type === "analysis") ? "success" : "empty");
            } catch (err) {
                setError(err.message || "Não foi possível carregar o histórico.");
                setHistoryStatus("error");
            }
        }

        loadHistory();
    }, []);

    /**
     * Submete a comparação escolhida pelo cliente.
     * @param {React.FormEvent<HTMLFormElement>} event - Evento de submissão do formulário.
     * @returns {Promise<void>}
     */
    async function submitComparison(event) {
        event.preventDefault();

        if (!canSubmit) {
            setError("Escolhe duas análises diferentes antes de comparar.");
            return;
        }

        setSubmitStatus("loading");
        setError("");
        try {
            const data = await apiRequest("/me/skin-comparisons", {
                method: "POST",
                credentials: "include",
                body: JSON.stringify({ baselineAnalysisId, followUpAnalysisId }),
            });
            setComparison(data.comparison);
            setSubmitStatus("success");
        } catch (err) {
            setError(err.message || "Não foi possível criar comparação.");
            setSubmitStatus("error");
        }
    }

    function analysisLabel(analysis) {
        const date = new Date(analysis.createdAt).toLocaleDateString("pt-PT");
        return `${date} - ${analysis.providerName || "análise facial"}`;
    }

    return (
        <main>
            <h1>Comparação após 30 dias</h1>
            {historyStatus === "loading" ? <p>A carregar histórico pessoal...</p> : null}
            {historyStatus === "empty" ? <p>Precisas de pelo menos duas análises guardadas no histórico.</p> : null}
            {historyStatus === "error" ? <p role="alert">{error}</p> : null}
            <form onSubmit={submitComparison}>
                <label>
                    Análise inicial
                    <select
                        value={baselineAnalysisId}
                        onChange={(event) => setBaselineAnalysisId(event.target.value)}
                        disabled={analyses.length < 2}
                    >
                        <option value="">Escolher análise inicial</option>
                        {analyses.map((analysis) => (
                            <option key={analysis.id} value={analysis.id}>
                                {analysisLabel(analysis)}
                            </option>
                        ))}
                    </select>
                </label>
                <label>
                    Análise final
                    <select
                        value={followUpAnalysisId}
                        onChange={(event) => setFollowUpAnalysisId(event.target.value)}
                        disabled={analyses.length < 2}
                    >
                        <option value="">Escolher análise final</option>
                        {analyses.map((analysis) => (
                            <option key={analysis.id} value={analysis.id}>
                                {analysisLabel(analysis)}
                            </option>
                        ))}
                    </select>
                </label>
                <button type="submit" disabled={!canSubmit}>
                    {submitStatus === "loading" ? "A comparar..." : "Comparar"}
                </button>
            </form>
            {error && historyStatus !== "error" ? <p role="alert">{error}</p> : null}
            {comparison ? (
                <section>
                    <h2>Resultado</h2>
                    <p>{comparison.summary}</p>
                    <p>Dias entre análises: {comparison.daysBetween}</p>
                    <ul>
                        {comparison.metricDeltas.map((delta) => (
                            <li key={delta.metric}>
                                {delta.metric}: {delta.changeLabel}
                            </li>
                        ))}
                    </ul>
                </section>
            ) : null}
        </main>
    );
}