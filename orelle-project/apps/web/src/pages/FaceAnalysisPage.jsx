import { useState } from "react";
import { apiRequest } from "../services/apiClient.js";

export function FaceAnalysisPage() {
    const [analysis, setAnalysis] = useState(null);
    const [status, setStatus] = useState("idle");
    const [error, setError] = useState("");

    async function handleAnalyze() {
        setStatus("loading");
        setError("");
        setAnalysis(null);

        try {
            const data = await apiRequest("/face-analyses", {
                method: "POST",
            });
            setAnalysis(data.analysis);
            setStatus("success");
        } catch (err) {
            setError(err.message);
            setStatus("error");
        }
    }

    return (
        <section>
            <h1>Análise facial cosmética</h1>
            <button onClick={handleAnalyze} disabled={status === "loading"}>
                {status === "loading" ? "A analisar..." : "Iniciar análise"}
            </button>
            {status === "error" && <p role="alert">{error}</p>}
            {status === "success" && analysis && (
                <article>
                    <p>{analysis.limitations.join(" ")}</p>
                    <ul>
                        {Object.entries(analysis.findings).map(([key, value]) => (
                            <li key={key}>
                                <strong>{key}</strong>: {value.label} (
                                {Math.round(value.confidence * 100)}%)
                            </li>
                        ))}
                    </ul>
                </article>
            )}
        </section>
    );
}