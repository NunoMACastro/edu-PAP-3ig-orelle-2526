/** Histórico seguro e minimizado da consulta do cliente autenticado. */
import { useEffect } from "react";
import { Link } from "react-router-dom";
import { ErrorSummary } from "../../components/ErrorSummary.jsx";
import { EmptyState, PageHero, Skeleton } from "../../components/OrelleUi.jsx";
import { collectionResourceStatus } from "../../hooks/asyncOperation.js";
import { useAsyncResource } from "../../hooks/useAsyncResource.js";
import { listConsultationHistory } from "./consultationApi.js";
import {
    CONSULTATION_GOAL_FALLBACKS,
    getSessionDestination,
    getSessionPhase,
} from "./consultationModel.js";

const HISTORY_PHASE_LABELS = Object.freeze({
    collecting_photos: "Fotografias em falta",
    analyzing: "Análise em curso",
    asking_questions: "Perguntas em curso",
    ready_for_report: "Pronta para relatório",
    generating_report: "Relatório em preparação",
    draft_ready: "Rascunho pronto",
    review_pending: "Revisão humana pendente",
    needs_clarification: "Esclarecimento necessário",
    frozen_locked: "Relatório final bloqueado",
    unlocked: "Relatório desbloqueado",
    failed_retryable: "Interrompida",
    cancelled: "Cancelada",
});

/** Formata datas válidas sem expor `Invalid Date`. */
function formatEventDate(value) {
    const date = new Date(value);
    return Number.isNaN(date.getTime())
        ? "Data indisponível"
        : date.toLocaleString("pt-PT");
}

/** Resume objetivos sem refletir códigos desconhecidos. */
function formatHistoryGoals(goals) {
    const primary = goals?.primaryGoal ?? goals?.primary?.code ?? goals?.primary;
    const secondary = goals?.secondaryGoals ?? goals?.secondary ?? [];
    const codes = [primary, ...(Array.isArray(secondary) ? secondary : [])]
        .map((goal) => String(goal?.code ?? goal ?? ""))
        .filter(Boolean);
    const labels = codes
        .map((code) => CONSULTATION_GOAL_FALLBACKS[code]?.label)
        .filter(Boolean);
    return labels.length > 0 ? labels.join(" · ") : "Objetivos indisponíveis";
}

/** Timeline canónica; não pede nem envia identificadores de utilizador. */
export function ConsultationHistoryPage() {
    const historyResource = useAsyncResource(
        ({ signal }) => listConsultationHistory({ signal }),
        { initialData: [], statusFromData: collectionResourceStatus },
    );
    const loadHistory = historyResource.load;

    useEffect(() => {
        void loadHistory();
    }, [loadHistory]);

    return (
        <section className="consultation-flow consultation-history">
            <PageHero eyebrow="Histórico" title="As tuas consultas" description="Acompanha objetivos, fases, revisões e relatórios ao longo do tempo." />

            <button
                type="button"
                onClick={() => void loadHistory()}
                disabled={historyResource.status === "loading"}
            >
                {historyResource.status === "loading"
                    ? "A atualizar…"
                    : "Atualizar histórico"}
            </button>
            <ErrorSummary error={historyResource.error} id="consultation-history-error" />
            {historyResource.status === "loading" && historyResource.data.length === 0 ? <Skeleton lines={4} /> : null}

            {historyResource.status === "empty" && (
                <EmptyState title="Ainda não existem consultas" description="Quando iniciares um percurso, os objetivos e relatórios aparecem nesta linha temporal." action={<Link className="button-link" to="/consulta/nova">Iniciar consulta</Link>} />
            )}

            {historyResource.data.length > 0 && (
                <ol className="consultation-history__timeline">
                    {historyResource.data.map((event, index) => {
                        const reportId = String(
                            event.reportId ?? event.report?.id ?? "",
                        );
                        const phase = getSessionPhase(event);
                        return (
                            <li key={event.id ?? `${event.createdAt}-${index}`}>
                                <article className="consultation-card">
                                    <h2>
                                        {formatHistoryGoals(event.goals)}
                                    </h2>
                                    <p>
                                        Estado:{" "}
                                        {HISTORY_PHASE_LABELS[phase] ??
                                            "Estado indisponível"}
                                    </p>
                                    <small>
                                        Atualizada em{" "}
                                        {formatEventDate(
                                            event.updatedAt ?? event.createdAt,
                                        )}
                                    </small>
                                    {reportId && (
                                        <Link
                                            className="text-link"
                                            to={`/consulta/relatorios/${encodeURIComponent(
                                                reportId,
                                            )}`}
                                        >
                                            Abrir relatório
                                        </Link>
                                    )}
                                    {!reportId && event.isOpen === true && (
                                        <Link
                                            className="text-link"
                                            to={getSessionDestination(event)}
                                        >
                                            Continuar consulta
                                        </Link>
                                    )}
                                </article>
                            </li>
                        );
                    })}
                </ol>
            )}
        </section>
    );
}
