import { useState } from "react";
import { apiRequest } from "../services/apiClient.js";

export function FaceReportPage() {
    const [report, setReport] = useState(null);
    const [status, setStatus] = useState("idle");
    const [error, setError] = useState("");

    async function handleGenerate() {
        setStatus("loading");
        setError("");
        setReport(null);

        try {
            const data = await apiRequest("/face-reports/latest", {
                method: "POST",
            });
            setReport(data.report);
            setStatus("success");
        } catch (err) {
            setError(err.message);
            setStatus("error");
        }
    }

    return (
        <section>
            <h1>Relatório personalizado</h1>
            <button onClick={handleGenerate} disabled={status === "loading"}>
                {status === "loading" ? "A gerar..." : "Gerar relatório"}
            </button>
            {status === "error" && <p role="alert">{error}</p>}
            {status === "success" && report && (
                <article>
                    <p>{report.cosmeticSummary}</p>
                    <h2>Rotina sugerida</h2>
                    <ul>
                        {report.routineSuggestions.map((step) => (
                            <li key={`${step.period}-${step.title}`}>
                                <strong>{step.period}: {step.title}</strong>
                                <p>{step.reason}</p>
                            </li>
                        ))}
                    </ul>
                    <h2>Limitações</h2>
                    <ul>
                        {report.limitations.map((item) => (
                            <li key={item}>{item}</li>
                        ))}
                    </ul>
                </article>
            )}
        </section>
    );
}