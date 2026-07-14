/** Dashboard personalizado e resiliente da área do cliente. */
import { useEffect } from "react";
import { ActionCard, OrelleActionLink, PageHero, SectionCard, Skeleton, StatusBanner } from "../components/OrelleUi.jsx";
import { useConsultationAvailability } from "../context/ConsultationAvailabilityContext.jsx";
import { getCurrentConsultationSession } from "../features/consultation/consultationApi.js";
import { getSessionDestination, getSessionPhase } from "../features/consultation/consultationModel.js";
import { useAsyncResource } from "../hooks/useAsyncResource.js";
import { apiRequest } from "../services/apiClient.js";
import { resolveClientNextStep } from "../services/clientDashboard.js";

/** Converte um 404 de perfil num estado de onboarding legítimo. */
async function loadProfile(signal) {
    try {
        const data = await apiRequest("/profile/me", { signal });
        return { profile: data.profile, missing: false };
    } catch (error) {
        if (error?.status === 404) return { profile: null, missing: true };
        throw error;
    }
}

/** Carrega a sessão sem transformar a ausência normal num erro global. */
async function loadSession(signal) {
    try {
        return await getCurrentConsultationSession({ signal });
    } catch (error) {
        if (error?.status === 404) return null;
        throw error;
    }
}

/** Cada card lê o seu endpoint de forma independente. */
export function AccountOverviewPage() {
    const consultation = useConsultationAvailability();
    const profile = useAsyncResource(({ signal }) => loadProfile(signal), { initialData: null });
    const session = useAsyncResource(({ signal }) => loadSession(signal), { initialData: null });
    const skin = useAsyncResource(async ({ signal }) => (await apiRequest("/me/skin-history", { signal })).history ?? [], { initialData: [] });
    const routine = useAsyncResource(async ({ signal }) => (await apiRequest("/me/daily-routine", { signal })).routine ?? null, { initialData: null });
    const orders = useAsyncResource(async ({ signal }) => (await apiRequest("/me/orders", { signal })).orders ?? [], { initialData: [] });
    const notifications = useAsyncResource(async ({ signal }) => (await apiRequest("/me/notifications", { signal })).notifications ?? [], { initialData: [] });

    const loadProfileResource = profile.load;
    const loadSessionResource = session.load;
    const loadSkinResource = skin.load;
    const loadRoutineResource = routine.load;
    const loadOrdersResource = orders.load;
    const loadNotificationsResource = notifications.load;

    useEffect(() => {
        void loadProfileResource();
        void loadSessionResource();
        void loadSkinResource();
        void loadRoutineResource();
        void loadOrdersResource();
        void loadNotificationsResource();
    }, [loadNotificationsResource, loadOrdersResource, loadProfileResource, loadRoutineResource, loadSessionResource, loadSkinResource]);

    const personName = profile.data?.profile?.nome?.trim();
    const nextStep = resolveClientNextStep({
        profile: profile.data?.profile,
        profileMissing: profile.data?.missing === true,
        session: session.data,
        consultationAvailable: consultation.available,
        sessionDestination: session.data ? getSessionDestination(session.data) : undefined,
    });
    const latestSkin = [...skin.data].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];
    const latestOrder = orders.data[0];
    const unreadCount = notifications.data.filter((item) => !item.isRead).length;
    const consultationPhase = getSessionPhase(session.data);
    const consultationProgress = session.data?.conversation;

    return (
        <section className="client-dashboard" aria-labelledby="client-dashboard-title">
            <PageHero
                eyebrow="O teu espaço Orélle"
                title={personName ? `Olá, ${personName}` : "A tua beleza, organizada à tua medida"}
                description="A tua consulta é o ponto de partida. A pele, a rotina e os produtos organizam-se à volta do que procuras."
                actions={<OrelleActionLink to={nextStep.to}>{nextStep.label}</OrelleActionLink>}
            >
                <div className="client-dashboard__next"><span>Próximo passo</span><strong>{nextStep.title}</strong><p>{nextStep.description}</p></div>
            </PageHero>

            {consultation.status === "success" && !consultation.available ? (
                <StatusBanner tone="warning" title="A consulta guiada está temporariamente indisponível">
                    <p>Podes continuar a consultar o histórico, cuidar da tua rotina e explorar produtos.</p>
                </StatusBanner>
            ) : null}

            <div className="client-dashboard__grid">
                <SectionCard className="client-dashboard__consultation" title={session.data ? "Continua a tua consulta" : "Começa pela tua consulta"} description="O percurso cosmético personalizado da Orélle.">
                    {session.status === "loading" ? <Skeleton /> : session.error ? <CardError onRetry={loadSessionResource} /> : session.data ? (
                        <div className="client-dashboard__consultation-status">
                            <p>{consultationPhase === "asking_questions" ? `Pergunta ${consultationProgress?.currentIndex ?? 1} de ${consultationProgress?.totalQuestions ?? 17}.` : "O teu progresso está guardado e pronto para continuar."}</p>
                            {consultationProgress?.totalQuestions > 0 ? <div role="progressbar" aria-label="Progresso da consulta" aria-valuemin="0" aria-valuemax={consultationProgress.totalQuestions} aria-valuenow={consultationProgress.answeredCount}><span style={{ width: `${Math.round((consultationProgress.answeredCount / consultationProgress.totalQuestions) * 100)}%` }} /></div> : null}
                        </div>
                    ) : <p>Conta-nos os teus objetivos e recebe um relatório pensado para ti.</p>}
                    <OrelleActionLink to={session.data ? getSessionDestination(session.data) : "/consulta"}>{session.data ? "Continuar consulta" : "Começar a minha consulta"}</OrelleActionLink>
                </SectionCard>
                <SectionCard title="A tua pele" description="Última atividade e evolução.">
                    {skin.status === "loading" ? <Skeleton /> : skin.error ? <CardError onRetry={loadSkinResource} /> : latestSkin ? <p>Último registo em {new Date(latestSkin.createdAt).toLocaleDateString("pt-PT")}.</p> : <p>Ainda não existem análises concluídas.</p>}
                    <OrelleActionLink variant="secondary" to="/pele">Abrir área da pele</OrelleActionLink>
                </SectionCard>
                <SectionCard title="Rotina atual" description="Cuidados para manhã e noite.">
                    {routine.status === "loading" ? <Skeleton /> : routine.error ? <CardError onRetry={loadRoutineResource} /> : routine.data ? <p>{routine.data.steps?.length ?? 0} passos organizados na tua rotina.</p> : <p>Ainda não tens uma rotina gerada.</p>}
                    <OrelleActionLink variant="secondary" to="/rotina">Ver rotina</OrelleActionLink>
                </SectionCard>
                <SectionCard title="Compras" description="A tua encomenda mais recente.">
                    {orders.status === "loading" ? <Skeleton /> : orders.error ? <CardError onRetry={loadOrdersResource} /> : latestOrder ? <p>{new Date(latestOrder.createdAt).toLocaleDateString("pt-PT")} · {(latestOrder.totalCents / 100).toFixed(2)} €</p> : <p>Ainda não existem encomendas.</p>}
                    <OrelleActionLink variant="secondary" to="/compras">Ver encomendas</OrelleActionLink>
                </SectionCard>
                <SectionCard title="Notificações" description="Atualizações importantes da tua conta.">
                    {notifications.status === "loading" ? <Skeleton /> : notifications.error ? <CardError onRetry={loadNotificationsResource} /> : <p>{unreadCount === 0 ? "Estás a par de tudo." : `${unreadCount} ${unreadCount === 1 ? "mensagem por ler" : "mensagens por ler"}.`}</p>}
                    <OrelleActionLink variant="secondary" to="/notificacoes">Abrir notificações</OrelleActionLink>
                </SectionCard>
                <ActionCard to="/conta/perfil" eyebrow="Conta" title="Perfil e preferências" description="Mantém os teus dados, objetivos e escolhas atualizados." action="Gerir conta" />
            </div>
        </section>
    );
}

/** Erro localizado que não bloqueia os restantes cards. */
function CardError({ onRetry }) {
    return <div className="client-dashboard__card-error"><p>Não foi possível atualizar este conteúdo.</p><button type="button" onClick={() => void onRetry()}>Tentar novamente</button></div>;
}
