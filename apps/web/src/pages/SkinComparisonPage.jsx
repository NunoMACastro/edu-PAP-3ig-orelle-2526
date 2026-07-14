/**
 * Página de comparação temporal de pele por momentos do histórico.
 */
import { useEffect, useMemo, useState } from "react";
import { ErrorSummary } from "../components/ErrorSummary.jsx";
import { OptimizedImage } from "../components/OptimizedImage.jsx";
import { EmptyState, PageHero, Skeleton } from "../components/OrelleUi.jsx";
import { useAsyncAction } from "../hooks/useAsyncAction.js";
import { useAsyncResource } from "../hooks/useAsyncResource.js";
import { apiRequest } from "../services/apiClient.js";
import { getSkinTypeLabel } from "../services/presentationLabels.js";

/**
 * Formata uma data persistida sem expor identificadores técnicos.
 *
 * @function formatAnalysisDate
 * @param {string|Date} value - Data da análise.
 * @returns {string} Data e hora em português de Portugal.
 */
function formatAnalysisDate(value) {
    return new Intl.DateTimeFormat("pt-PT", {
        dateStyle: "long",
        timeStyle: "short",
    }).format(new Date(value));
}

/**
 * Permite comparar dois momentos do histórico do próprio utilizador.
 *
 * @function SkinComparisonPage
 * @returns {import("react").JSX.Element} Seletores por data e resultado acessível.
 */
export function SkinComparisonPage() {
    const [baselineSelection, setBaselineSelection] = useState("");
    const [followUpSelection, setFollowUpSelection] = useState("");
    const {
        data: analyses,
        status: loadStatus,
        error: loadError,
        load: loadAnalyses,
    } = useAsyncResource(
        async ({ signal }) => {
            const data = await apiRequest(
                "/me/skin-analyses/comparison-options",
                { signal },
            );
            return Array.isArray(data.analyses) ? data.analyses : [];
        },
        {
            initialData: [],
            initialStatus: "loading",
            statusFromData: (options) =>
                options.length < 2 ? "empty" : "success",
        },
    );
    const comparisonAction = useAsyncAction(
        async ({ signal }, selections) => {
            const data = await apiRequest("/me/skin-comparisons", {
                method: "POST",
                signal,
                body: JSON.stringify(selections),
            });
            return data.comparison;
        },
    );
    const comparison = comparisonAction.result;

    useEffect(() => {
        let active = true;
        loadAnalyses().then((result) => {
            if (!active || !result.ok) return;
            const options = result.data;
            setBaselineSelection(options[0]?.selectionKey ?? "");
            setFollowUpSelection(options.at(-1)?.selectionKey ?? "");
        });

        return () => {
            active = false;
        };
    }, [loadAnalyses]);

    /** Recarrega as opções e preserva seleções que continuem disponíveis. */
    async function retryAnalysisOptions() {
        const result = await loadAnalyses();
        if (!result.ok) return;

        setBaselineSelection((current) =>
            result.data.some((item) => item.selectionKey === current)
                ? current
                : (result.data[0]?.selectionKey ?? ""),
        );
        setFollowUpSelection((current) =>
            result.data.some((item) => item.selectionKey === current)
                ? current
                : (result.data.at(-1)?.selectionKey ?? ""),
        );
    }

    const selectedMoments = useMemo(
        () => ({
            baseline: analyses.find(
                (analysis) => analysis.selectionKey === baselineSelection,
            ),
            followUp: analyses.find(
                (analysis) => analysis.selectionKey === followUpSelection,
            ),
        }),
        [analyses, baselineSelection, followUpSelection],
    );

    /**
     * Pede ao backend a comparação das duas datas selecionadas.
     *
     * @async
     * @function handleSubmit
     * @param {import("react").FormEvent<HTMLFormElement>} event - Evento do formulário.
     * @returns {Promise<void>}
     */
    async function handleSubmit(event) {
        event.preventDefault();
        await comparisonAction.run({ baselineSelection, followUpSelection });
    }

    return (
        <section className="skin-comparison-page">
            <PageHero eyebrow="Pele e rotina" title="Compara dois momentos" description="Observa diferenças cosméticas lado a lado. Esta comparação não constitui diagnóstico médico." />

            {loadStatus === "loading" && <Skeleton lines={4} label="A carregar análises" />}
            <ErrorSummary error={loadError} id="skin-comparison-load-error" />
            {loadStatus === "error" && (
                <button type="button" onClick={retryAnalysisOptions}>
                    Tentar carregar análises novamente
                </button>
            )}
            {loadStatus === "empty" && <EmptyState title="Precisamos de dois momentos" description="São necessárias pelo menos duas análises concluídas em datas diferentes para criar uma comparação." />}

            {loadStatus === "success" && (
                <form onSubmit={handleSubmit}>
                    <label>
                        Momento inicial
                        <select
                            value={baselineSelection}
                            onChange={(event) => {
                                comparisonAction.reset();
                                setBaselineSelection(event.target.value);
                            }}
                            disabled={comparisonAction.status === "loading"}
                            required
                        >
                            {analyses.map((analysis) => (
                                <option
                                    key={`baseline-${analysis.selectionKey}`}
                                    value={analysis.selectionKey}
                                >
                                    {formatAnalysisDate(analysis.date)} — pele{" "}
                                    {getSkinTypeLabel(analysis.skinType)}
                                </option>
                            ))}
                        </select>
                    </label>
                    <label>
                        Momento final
                        <select
                            value={followUpSelection}
                            onChange={(event) => {
                                comparisonAction.reset();
                                setFollowUpSelection(event.target.value);
                            }}
                            disabled={comparisonAction.status === "loading"}
                            required
                        >
                            {analyses.map((analysis) => (
                                <option
                                    key={`follow-up-${analysis.selectionKey}`}
                                    value={analysis.selectionKey}
                                >
                                    {formatAnalysisDate(analysis.date)} — pele{" "}
                                    {getSkinTypeLabel(analysis.skinType)}
                                </option>
                            ))}
                        </select>
                    </label>
                    <button
                        type="submit"
                        disabled={
                            comparisonAction.status === "loading" ||
                            !baselineSelection ||
                            !followUpSelection ||
                            selectedMoments.baseline?.date >=
                                selectedMoments.followUp?.date
                        }
                    >
                        {comparisonAction.status === "loading"
                            ? "A comparar..."
                            : "Comparar momentos"}
                    </button>
                    {selectedMoments.baseline?.date >=
                        selectedMoments.followUp?.date && (
                        <p role="status">
                            O momento final tem de ser posterior ao momento inicial.
                        </p>
                    )}
                </form>
            )}

            <ErrorSummary
                error={comparisonAction.error}
                id="skin-comparison-action-error"
            />
            {comparison && (
                <article
                    aria-labelledby="skin-comparison-result-title"
                    aria-busy={comparisonAction.status === "loading"}
                >
                    <h2 id="skin-comparison-result-title">Resultado da comparação</h2>
                    <p>{comparison.summary}</p>
                    <p>{comparison.daysBetween} dias entre os dois momentos.</p>

                    {(selectedMoments.baseline?.imageUrl ||
                        selectedMoments.followUp?.imageUrl) && (
                        <div className="preview-grid">
                            {selectedMoments.baseline?.imageUrl && (
                                <section>
                                    <h3>Momento inicial</h3>
                                    <OptimizedImage
                                        src={selectedMoments.baseline.imageUrl}
                                        alt={`Fotografia autorizada da análise de ${formatAnalysisDate(selectedMoments.baseline.date)}`}
                                        width="320"
                                        height="320"
                                        sizes="(max-width: 700px) calc(100vw - 2rem), 320px"
                                    />
                                </section>
                            )}
                            {selectedMoments.followUp?.imageUrl && (
                                <section>
                                    <h3>Momento final</h3>
                                    <OptimizedImage
                                        src={selectedMoments.followUp.imageUrl}
                                        alt={`Fotografia autorizada da análise de ${formatAnalysisDate(selectedMoments.followUp.date)}`}
                                        width="320"
                                        height="320"
                                        sizes="(max-width: 700px) calc(100vw - 2rem), 320px"
                                    />
                                </section>
                            )}
                        </div>
                    )}

                    <div
                        className="table-scroll"
                        role="region"
                        aria-label="Tabela da comparação cosmética"
                        tabIndex={0}
                    >
                        <table>
                            <caption>Métricas cosméticas nos dois momentos</caption>
                            <thead>
                                <tr>
                                    <th scope="col">Métrica</th>
                                    <th scope="col">Momento inicial</th>
                                    <th scope="col">Momento final</th>
                                    <th scope="col">Alteração observada</th>
                                </tr>
                            </thead>
                            <tbody>
                                {comparison.metricDeltas.map((delta) => (
                                    <tr key={delta.metric}>
                                        <th scope="row">{delta.metric}</th>
                                        <td>{delta.baselineValue}</td>
                                        <td>{delta.followUpValue}</td>
                                        <td>{delta.changeLabel}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

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
