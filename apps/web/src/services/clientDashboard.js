/** Regras puras do próximo passo no dashboard do cliente. */

/**
 * Resolve a ação principal sem inferir identidade a partir do email.
 *
 * @param {{profile: object|null, profileMissing: boolean, session: object|null, consultationAvailable: boolean, sessionDestination?: string}} input - Estado agregado dos recursos.
 * @returns {{to: string, label: string, title: string, description: string}} Próximo passo recomendado.
 */
export function resolveClientNextStep({
    profile,
    profileMissing,
    session,
    consultationAvailable,
    sessionDestination = "/consulta/ativa",
}) {
    if (profileMissing || !profile) {
        return { to: "/conta/perfil", label: "Completar perfil", title: "Começa por ti", description: "Completa o perfil para personalizarmos melhor a tua experiência." };
    }
    if (session) {
        return { to: sessionDestination, label: "Continuar consulta", title: "A tua consulta está à tua espera", description: "Retoma o percurso exatamente onde ficou." };
    }
    if (consultationAvailable) {
        return { to: "/consulta/nova", label: "Iniciar consulta", title: "Descobre o que combina contigo", description: "Inicia uma consulta cosmética guiada e centrada nos teus objetivos." };
    }
    return { to: "/produtos", label: "Explorar produtos", title: "Cuida de ti ao teu ritmo", description: "Enquanto a consulta não está disponível, explora a seleção Orélle." };
}
