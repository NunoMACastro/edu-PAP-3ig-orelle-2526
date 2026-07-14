/**
 * Contratos puros de navegacao da area pessoal.
 *
 * Mantem os destinos por role e o inventario de rotas do cliente fora dos
 * componentes React, para que possam ser validados sem depender do browser.
 */

export const CLIENT_ACCOUNT_LINKS = Object.freeze([
    { to: "/conta", label: "Visão geral", end: true },
    { to: "/conta/perfil", label: "Perfil" },
    { to: "/conta/preferencias", label: "Preferências" },
    { to: "/conta/privacidade-biometrica", label: "Privacidade" },
    { to: "/compras", label: "Compras" },
    { to: "/notificacoes", label: "Notificações" },
    { to: "/pele", label: "Área da pele", end: true },
    { to: "/pele/historico", label: "Histórico" },
    { to: "/pele/evolucao", label: "Evolução" },
    { to: "/pele/comparacao", label: "Comparação" },
    { to: "/rotina/alertas", label: "Alertas" },
]);

export const ACCOUNT_OVERVIEW_LINKS = Object.freeze([
    {
        to: "/conta/perfil",
        title: "Perfil pessoal",
        description: "Consultar ou atualizar os dados usados na personalização.",
    },
    {
        to: "/conta/preferencias",
        title: "Preferências",
        description: "Gerir preferências de marcas e produtos.",
    },
    {
        to: "/conta/privacidade-biometrica",
        title: "Privacidade",
        description: "Consultar e gerir pedidos relativos aos dados biométricos.",
    },
    {
        to: "/compras",
        title: "Compras",
        description: "Rever encomendas e voltar a adicionar produtos ao carrinho.",
    },
    {
        to: "/notificacoes",
        title: "Notificações",
        description: "Ler as mensagens e atualizações da tua conta.",
    },
    {
        to: "/rotina/alertas",
        title: "Alertas de rotina",
        description: "Definir quando pretendes receber lembretes da rotina.",
    },
]);

export const SKIN_OVERVIEW_LINKS = Object.freeze([
    {
        to: "/consulta/nova",
        title: "Fotografias",
        description: "Gerir as fotografias autorizadas para análise cosmética.",
    },
    {
        to: "/consulta/ativa",
        title: "Nova análise",
        description: "Iniciar uma análise cosmética com o modo disponível.",
    },
    {
        to: "/consulta",
        title: "Relatório",
        description: "Consultar o relatório cosmético mais recente.",
    },
    {
        to: "/pele/historico",
        title: "Histórico",
        description: "Consultar análises e relatórios anteriores.",
    },
    {
        to: "/pele/evolucao",
        title: "Evolução",
        description: "Acompanhar a evolução temporal dos indicadores cosméticos.",
    },
    {
        to: "/pele/comparacao",
        title: "Comparação",
        description: "Comparar observações de pele disponíveis na tua conta.",
    },
]);

const ROLE_DEFAULT_PATHS = Object.freeze({
    cliente: "/conta",
    consultor: "/consultoria/revisoes",
    administrador: "/admin",
});

const CLIENT_PATH_PREFIXES = Object.freeze([
    "/conta",
    "/pele",
    "/rotina",
    "/carrinho",
    "/checkout",
    "/compras",
    "/notificacoes",
    "/consulta",
]);

/** Confirma igualdade de rota ou um descendente separado por `/`. */
function matchesPathPrefix(pathname, prefix) {
    return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

/** Identifica catálogo/detalhe/relacionados públicos sem incluir avaliações. */
function isPublicProductPath(pathname) {
    const segments = pathname.split("/").filter(Boolean);

    return (
        segments[0] === "produtos" &&
        (segments.length === 1 ||
            segments.length === 2 ||
            (segments.length === 3 && segments[2] === "relacionados"))
    );
}

/**
 * Confirma que o destino interno pertence à role acabada de autenticar.
 *
 * O controlo definitivo continua na API e nos route guards. Esta allowlist
 * impede apenas redirects pós-login para uma área visual de outra role.
 *
 * @param {{role?: string}} user - Utilizador autenticado.
 * @param {string} pathname - Path interno já normalizado.
 * @returns {boolean} Verdadeiro quando a role pode abrir a rota.
 */
function canRoleOpenPath(user, pathname) {
    if (pathname === "/" || isPublicProductPath(pathname)) return true;

    if (user.role === "cliente") {
        return (
            CLIENT_PATH_PREFIXES.some((prefix) =>
                matchesPathPrefix(pathname, prefix),
            ) || /^\/produtos\/[^/]+\/avaliar\/?$/.test(pathname)
        );
    }

    if (user.role === "consultor") {
        return matchesPathPrefix(pathname, "/consultoria");
    }

    if (user.role === "administrador") {
        return (
            matchesPathPrefix(pathname, "/admin") ||
            matchesPathPrefix(pathname, "/consultoria")
        );
    }

    return false;
}

/**
 * Resolve o destino após autenticação sem permitir destinos externos.
 *
 * @param {{role?: string}} user - Utilizador autenticado.
 * @param {string|undefined} requestedPath - Rota interna pedida antes do login.
 * @returns {string} Rota inicial compatível com a role.
 */
export function resolvePostLoginPath(user, requestedPath) {
    const defaultPath = ROLE_DEFAULT_PATHS[user?.role] ?? "/conta";
    const isSafeRequestedPath =
        typeof requestedPath === "string" &&
        requestedPath.startsWith("/") &&
        !requestedPath.startsWith("//") &&
        requestedPath !== "/login";

    if (isSafeRequestedPath && canRoleOpenPath(user, requestedPath)) {
        return requestedPath;
    }

    return defaultPath;
}
