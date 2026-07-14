/** Dashboard editorial das funcionalidades cosméticas de pele. */
import { ActionCard, PageHero, StatusBanner } from "../components/OrelleUi.jsx";
import { useConsultationAvailability } from "../context/ConsultationAvailabilityContext.jsx";

/** Apresenta os percursos de pele como próximos passos claros. */
export function SkinOverviewPage() {
    const consultation = useConsultationAvailability();
    return (
        <section className="skin-overview-page">
            <PageHero eyebrow="Pele e rotina" title="A tua pele, ao longo do tempo" description="Reúne análises autorizadas, evolução, comparações e rotina num percurso simples de acompanhar." />
            {!consultation.available && consultation.status === "success" ? <StatusBanner tone="warning" title="Novas análises temporariamente indisponíveis"><p>O teu histórico e os dados já guardados continuam acessíveis.</p></StatusBanner> : null}
            <div className="orelle-action-grid">
                <ActionCard to="/pele/historico" eyebrow="Última atividade" title="Histórico da pele" description="Consulta análises e relatórios por ordem temporal." action="Abrir histórico" />
                <ActionCard to="/pele/evolucao" eyebrow="Tendências" title="Evolução" description="Acompanha as métricas cosméticas em gráfico e tabela." action="Ver evolução" />
                <ActionCard to="/pele/comparacao" eyebrow="Antes e depois" title="Comparação" description="Compara dois momentos autorizados lado a lado." action="Comparar" />
                <ActionCard to="/rotina" eyebrow="Cuidados diários" title="A tua rotina" description="Organiza os passos recomendados para manhã e noite." action="Abrir rotina" />
                <ActionCard to="/rotina/alertas" eyebrow="Lembretes" title="Alertas" description="Escolhe quando queres receber o lembrete noturno." action="Gerir alertas" />
                <ActionCard to={consultation.available ? "/consulta/nova" : "/consulta/historico"} eyebrow="Consulta" title={consultation.available ? "Nova análise" : "Relatórios anteriores"} description={consultation.available ? "Começa um novo percurso cosmético." : "Consulta o que já está disponível."} action="Abrir" />
            </div>
        </section>
    );
}
