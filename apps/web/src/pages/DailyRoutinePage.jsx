/**
 * Página de rotina diária da MF2.
 */
import { useState } from "react";
import { apiRequest } from "../services/apiClient.js";

/**
 * Agrupa os passos da rotina pelos períodos apresentados na interface.
 *
 * @function groupSteps
 * @param {object[]} steps - Passos devolvidos pelo backend.
 * @returns {{manha: object[], noite: object[]}} Passos separados por manhã e noite.
 */
function groupSteps(steps) {
    return {
        manha: steps.filter((step) => step.period === "manha"),
        noite: steps.filter((step) => step.period === "noite"),
    };
}

/**
 * Mostra a rotina diária gerada a partir das recomendações do utilizador.
 *
 * @function DailyRoutinePage
 * @returns {import("react").JSX.Element} Página de rotina diária.
 */
export function DailyRoutinePage() {
    const [routine, setRoutine] = useState(null);
    const [status, setStatus] = useState("idle");
    const [error, setError] = useState("");

    /**
     * Pede ao backend para gerar uma nova rotina diária.
     *
     * @async
     * @function generateRoutine
     * @returns {Promise<void>}
     */
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

    /**
     * Carrega a rotina atualmente guardada para o utilizador.
     *
     * @async
     * @function loadRoutine
     * @returns {Promise<void>}
     */
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
