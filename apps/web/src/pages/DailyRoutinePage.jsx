import { useEffect, useState } from "react";
import { apiRequest } from "../services/apiClient.js";

function groupByPeriod(steps) {
    return {
        manha: steps.filter((step) => step.period === "manha"),
        noite: steps.filter((step) => step.period === "noite"),
    };
}

export function DailyRoutinePage() {
    const [status, setStatus] = useState("loading");
    const [error, setError] = useState("");
    const [routine, setRoutine] = useState(null);

    async function loadRoutine() {
        const data = await apiRequest("/api/me/daily-routine");
        setRoutine(data.routine);
        setStatus(data.routine ? "success" : "empty");
    }

    async function generateRoutine() {
        setStatus("loading");
        setError("");

        try {
            const data = await apiRequest("/api/me/daily-routine/generate", {
                method: "POST",
            });
            setRoutine(data.routine);
            setStatus("success");
        } catch (err) {
            setError(err.message);
            setStatus("error");
        }
    }

    useEffect(() => {
        loadRoutine().catch((err) => {
            setError(err.message);
            setStatus("error");
        });
    }, []);

    const groupedSteps = groupByPeriod(routine?.steps ?? []);

    return (
        <section>
            <h1>Rotina diária</h1>
            <button type="button" onClick={generateRoutine} disabled={status === "loading"}>
                Gerar rotina
            </button>
            {status === "loading" && <p>A carregar rotina...</p>}
            {status === "error" && <p role="alert">{error}</p>}
            {status === "empty" && <p>Ainda não existe rotina gerada.</p>}
            {status === "success" && (
                <div>
                    {["manha", "noite"].map((period) => (
                        <section key={period}>
                            <h2>{period === "manha" ? "Manhã" : "Noite"}</h2>
                            {groupedSteps[period].map((step) => (
                                <article key={`${step.period}-${step.order}`}>
                                    <h3>{step.title}</h3>
                                    <p>{step.instructions}</p>
                                    <p>{step.reason}</p>
                                </article>
                            ))}
                        </section>
                    ))}
                </div>
            )}
        </section>
    );
}