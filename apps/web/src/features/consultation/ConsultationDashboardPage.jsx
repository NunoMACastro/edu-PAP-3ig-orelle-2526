/** Dashboard server-driven da consulta cosmética. */
import { useEffect } from "react";
import { ActionCard, OrelleActionLink, PageHero, SectionCard, Skeleton, StatusBanner } from "../../components/OrelleUi.jsx";
import { useConsultationAvailability } from "../../context/ConsultationAvailabilityContext.jsx";
import { useAsyncResource } from "../../hooks/useAsyncResource.js";
import { getCurrentConsultationSession } from "./consultationApi.js";
import { getSessionDestination, getSessionPhase } from "./consultationModel.js";

const SESSION_PHASE_LABELS = Object.freeze({
    collecting_goal: "Objetivos por confirmar", collecting_photos: "Fotografias em falta", analyzing: "Análise em curso", asking_questions: "Perguntas em curso", ready_for_report: "Pronta para gerar relatório", generating_report: "Relatório em preparação", draft_ready: "Relatório pronto para rever", review_pending: "Revisão humana pedida", needs_clarification: "Esclarecimento necessário", frozen_locked: "Relatório finalizado", unlocked: "Relatório desbloqueado", failed_retryable: "Operação interrompida", cancelled: "Consulta cancelada",
});

/** Ponto de entrada da consulta com linguagem de produto em modo degradado. */
export function ConsultationDashboardPage() {
    const availability = useConsultationAvailability();
    const currentSession = useAsyncResource(async ({ signal }) => {
        try { return await getCurrentConsultationSession({ signal }); }
        catch (error) { if (error?.status === 404) return null; throw error; }
    }, { initialData: null });
    const loadCurrentSession = currentSession.load;
    useEffect(() => { void loadCurrentSession(); }, [loadCurrentSession]);

    const session = currentSession.data;
    const phase = getSessionPhase(session);
    const providerAvailable = availability.available;
    const answeredCount = session?.conversation?.answeredCount ?? 0;
    const totalQuestions = session?.conversation?.totalQuestions ?? 0;
    const destination = session ? getSessionDestination(session) : "/consulta/nova";
    const heroTitle = session
        ? phase === "asking_questions"
            ? "Continua a tua consulta"
            : SESSION_PHASE_LABELS[phase] ?? "A tua consulta está em curso"
        : "A tua beleza começa por te ouvir";
    const heroDescription = session
        ? phase === "asking_questions"
            ? `${answeredCount} de ${totalQuestions || 8} respostas guardadas. Retoma exatamente onde paraste.`
            : "O teu progresso está guardado e podes continuar quando quiseres."
        : "Um percurso guiado que combina os teus objetivos, fotografias autorizadas e preferências para criar recomendações à tua medida.";

    return (
        <section className="consultation-flow consultation-dashboard">
            <PageHero
                eyebrow="Consulta cosmética personalizada"
                title={heroTitle}
                description={heroDescription}
                actions={providerAvailable ? <OrelleActionLink to={destination}>{session ? "Continuar consulta" : "Começar a minha consulta"}</OrelleActionLink> : <OrelleActionLink variant="secondary" to="/consulta/historico">Ver histórico</OrelleActionLink>}
            >
                {session && totalQuestions > 0 ? (
                    <div className="consultation-dashboard__progress" role="progressbar" aria-label="Progresso da consulta" aria-valuemin="0" aria-valuemax={totalQuestions} aria-valuenow={answeredCount}>
                        <div><strong>{answeredCount} de {totalQuestions}</strong><span>respostas guardadas</span></div>
                        <span><i style={{ width: `${Math.round((answeredCount / totalQuestions) * 100)}%` }} /></span>
                    </div>
                ) : null}
            </PageHero>

            {availability.status === "loading" ? <Skeleton label="A verificar disponibilidade" lines={2} /> : null}
            {!providerAvailable && availability.status === "success" ? (
                <StatusBanner tone="warning" title="A consulta guiada está temporariamente indisponível">
                    <p>O teu histórico e relatórios continuam disponíveis. Entretanto, podes explorar produtos e manter a tua rotina.</p>
                    <div className="flow-actions"><OrelleActionLink variant="secondary" to="/produtos">Explorar produtos</OrelleActionLink><OrelleActionLink variant="ghost" to="/rotina">Ver rotina</OrelleActionLink></div>
                </StatusBanner>
            ) : null}

            <SectionCard className="consultation-dashboard__how" title="Como funciona" description="Um percurso claro, seguro e pensado para ser retomado.">
                <ol><li><span>01</span><div><strong>Escolhe os objetivos</strong><p>Define aquilo que queres cuidar ou explorar.</p></div></li><li><span>02</span><div><strong>Responde ao teu ritmo</strong><p>Uma pergunta de cada vez, com o progresso sempre guardado.</p></div></li><li><span>03</span><div><strong>Recebe o relatório</strong><p>Consulta recomendações explicadas e adequadas às tuas preferências.</p></div></li></ol>
            </SectionCard>

            <div className="consultation-dashboard__grid orelle-action-grid">
                {currentSession.status === "loading" ? <div className="orelle-action-card"><Skeleton /></div> : <ActionCard to="/consulta/historico" eyebrow="Histórico" title="O teu percurso" description="Consulta relatórios e revisões anteriores." action="Abrir histórico" />}
                <ActionCard to="/pele" eyebrow="Pele" title="Acompanhar evolução" description="Relaciona os relatórios com o histórico da tua pele." action="Abrir área da pele" />
                <ActionCard to="/produtos" eyebrow="Produtos" title="Explorar o catálogo" description="Descobre produtos enquanto preparas a próxima consulta." action="Explorar" />
            </div>

            {currentSession.error ? <StatusBanner tone="error" title="Não foi possível atualizar a consulta"><button type="button" onClick={() => void loadCurrentSession()}>Tentar novamente</button></StatusBanner> : null}
            <aside className="consultation-disclaimer"><strong>Importante:</strong> esta experiência presta orientação cosmética e não substitui diagnóstico ou aconselhamento médico.</aside>
        </section>
    );
}
