/**
 * Pagina de rotina diaria da MF2.
 */
import { useState } from "react";
import { apiRequest } from "../services/apiClient.js";

function groupSteps(steps) {
    return {
        manha: steps.filter((step) => step.period === "manha"),
        noite: steps.filter((step) => step.period === "noite"),
    };
}

export function DailyRoutinePage() {
    const [routine, setRoutine] = useState(null);
    const [status, setStatus] = useState("idle");
    const [error, setError] = useState("");

    async function generateRoutine() {
        setStatus("loading");
        setError("");

        try {
            const data = await apiRequest("/me/daily-routine/generate", {
                method: "POST",
            });
            setRoutine(data.routine);
            setStatus("success");
        } catch (err) {
            setError(err.message);
            setStatus("error");
        }
    }

    async function loadRoutine() {
        setStatus("loading");
        setError("");

        try {
            const data = await apiRequest("/me/daily-routine");
            setRoutine(data.routine);
            setStatus(data.routine ? "success" : "empty");
        } catch (err) {
            setError(err.message);
            setStatus("error");
        }
    }

    const grouped = groupSteps(routine?.steps ?? []);

    return (
        <section>
            <h1>Rotina diária</h1>
            <button onClick={generateRoutine} disabled={status === "loading"}>
                Gerar rotina
            </button>
            <button onClick={loadRoutine} disabled={status === "loading"}>
                Ver rotina atual
            </button>
            {status === "error" && <p role="alert">{error}</p>}
            {status === "empty" && <p>Ainda não existe rotina gerada.</p>}
            {status === "success" && routine && (
                <article>
                    <p>Origem: {routine.source}</p>
                    {["manha", "noite"].map((period) => (
                        <section key={period}>
                            <h2>{period === "manha" ? "Manhã" : "Noite"}</h2>
                            <ol>
                                {grouped[period].map((step) => (
                                    <li key={`${period}-${step.recommendationId}`}>
                                        <strong>{step.title}</strong>
                                        <p>{step.instructions}</p>
                                        <p>
                                            Produto: {step.product.name} (
                                            {step.product.brandName})
                                        </p>
                                    </li>
                                ))}
                            </ol>
                        </section>
                    ))}
                    <ul>
                        {routine.limitations.map((limitation) => (
                            <li key={limitation}>{limitation}</li>
                        ))}
                    </ul>
                </article>
            )}
        </section>
    );
}
