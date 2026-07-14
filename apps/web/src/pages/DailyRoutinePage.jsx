/**
 * Página de rotina diária da MF2.
 */
import { useEffect, useRef, useState } from "react";
import { EmptyState, PageHero, SectionCard, Skeleton } from "../components/OrelleUi.jsx";
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

/** Traduz a proveniência técnica para linguagem de produto. */
function formatRoutineSource(source) {
    const labels = {
        recommendations: "Recomendações personalizadas",
        purchase_history: "Histórico de compras",
    };
    return labels[source] ?? "Dados disponíveis na tua conta";
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
    const [isLoading, setIsLoading] = useState(false);
    const operationInFlightRef = useRef(false);

    useEffect(() => {
        const controller = new AbortController();
        setIsLoading(true);
        setStatus("loading");
        apiRequest("/me/daily-routine", { signal: controller.signal })
            .then((data) => {
                setRoutine(data.routine);
                setStatus(data.routine ? "success" : "empty");
            })
            .catch((requestError) => {
                if (requestError.code === "REQUEST_ABORTED") return;
                setError(requestError.message);
                setStatus("error");
            })
            .finally(() => {
                if (!controller.signal.aborted) setIsLoading(false);
            });
        return () => controller.abort();
    }, []);

    /**
     * Pede ao backend para gerar uma nova rotina diária.
     *
     * @async
     * @function generateRoutine
     * @returns {Promise<void>}
     */
    async function generateRoutine() {
        if (operationInFlightRef.current) return;
        operationInFlightRef.current = true;
        setIsLoading(true);
        setError("");

        try {
            const data = await apiRequest("/me/daily-routine/generate", {
                method: "POST",
            });
            setRoutine(data.routine);
            setStatus("success");
        } catch (err) {
            setError(err.message);
            if (!routine) setStatus("error");
        } finally {
            operationInFlightRef.current = false;
            setIsLoading(false);
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
        if (operationInFlightRef.current) return;
        operationInFlightRef.current = true;
        setIsLoading(true);
        setError("");

        try {
            const data = await apiRequest("/me/daily-routine");
            setRoutine(data.routine);
            setStatus(data.routine ? "success" : "empty");
        } catch (err) {
            setError(err.message);
            if (!routine) setStatus("error");
        } finally {
            operationInFlightRef.current = false;
            setIsLoading(false);
        }
    }

    const grouped = groupSteps(routine?.steps ?? []);

    return (
        <section className="routine-page">
            <PageHero eyebrow="Pele e rotina" title="A tua rotina diária" description="Uma agenda simples para cuidares da pele de manhã e à noite." />
            <button type="button" onClick={generateRoutine} disabled={isLoading}>
                {isLoading ? "A processar..." : routine ? "Regenerar rotina" : "Gerar rotina"}
            </button>
            <button type="button" onClick={loadRoutine} disabled={isLoading}>
                Atualizar
            </button>
            {status === "idle" || (isLoading && !routine) ? <Skeleton lines={4} /> : null}
            {status === "error" && <p role="alert">{error}</p>}
            {status !== "error" && error && (
                <p role="alert">{error} A rotina anterior permanece visível.</p>
            )}
            {status === "empty" && <EmptyState title="Cria a tua primeira rotina" description="A rotina reúne recomendações e produtos já disponíveis na tua conta." />}
            {status === "success" && routine && (
                <article>
                    <p>Base da rotina: {formatRoutineSource(routine.source)}</p>
                    {["manha", "noite"].map((period) => (
                        <SectionCard key={period} title={period === "manha" ? "Manhã" : "Noite"}>
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
                        </SectionCard>
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
