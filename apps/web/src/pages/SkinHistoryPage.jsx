/**
 * Pagina de historico pessoal de pele.
 */
import { useEffect } from "react";
import { ErrorSummary } from "../components/ErrorSummary.jsx";
import { EmptyState, PageHero, Skeleton } from "../components/OrelleUi.jsx";
import { collectionResourceStatus } from "../hooks/asyncOperation.js";
import { useAsyncResource } from "../hooks/useAsyncResource.js";
import { apiRequest } from "../services/apiClient.js";

/**
 * Lista analises e relatorios do utilizador autenticado.
 *
 * @function SkinHistoryPage
 * @returns {JSX.Element} UI de historico temporal.
 */
export function SkinHistoryPage() {
    const historyResource = useAsyncResource(
        async ({ signal }) => {
            const data = await apiRequest("/me/skin-history", { signal });
            return Array.isArray(data.history) ? data.history : [];
        },
        {
            initialData: [],
            statusFromData: collectionResourceStatus,
        },
    );
    const history = historyResource.data;
    const loadHistoryResource = historyResource.load;

    useEffect(() => {
        void loadHistoryResource();
    }, [loadHistoryResource]);

    /**
     * Carrega o historico pessoal.
     *
     * @async
     * @function loadHistory
     * @returns {Promise<void>}
     */
    async function loadHistory() {
        await historyResource.load();
    }

    return (
        <section className="client-list-page skin-history-page">
            <PageHero eyebrow="Pele e rotina" title="Histórico da tua pele" description="Uma linha temporal das análises e relatórios que acompanham a tua evolução." />
            <button
                type="button"
                onClick={loadHistory}
                disabled={historyResource.status === "loading"}
            >
                {historyResource.status === "loading"
                    ? "A carregar..."
                    : "Atualizar histórico"}
            </button>
            <ErrorSummary error={historyResource.error} id="skin-history-error" />
            {historyResource.status === "loading" && history.length === 0 ? <Skeleton lines={4} /> : null}
            {historyResource.status === "empty" && <EmptyState title="O teu histórico começa na primeira análise" description="Quando a consulta voltar a estar disponível, os resultados autorizados aparecem aqui." />}
            {history.length > 0 && (
                <ol aria-busy={historyResource.status === "loading"}>
                    {history.map((item) => (
                        <li key={`${item.type}-${item.id}`}>
                            <strong>
                                {item.type === "analysis"
                                    ? "Análise"
                                    : "Relatório"}
                            </strong>
                            <time dateTime={item.createdAt}>
                                {new Date(item.createdAt).toLocaleString(
                                    "pt-PT",
                                )}
                            </time>
                            {item.type === "report" ? (
                                <p>{item.cosmeticSummary}</p>
                            ) : (
                                <p>Análise cosmética registada.</p>
                            )}
                        </li>
                    ))}
                </ol>
            )}
        </section>
    );
}
