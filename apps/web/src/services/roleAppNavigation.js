/**
 * Configuração declarativa da navegação autenticada Orélle.
 *
 * Separa destinos principais, destinos da conta e utilitários para que cada
 * superfície apresente apenas as ações adequadas sem perder o estado ativo.
 * A configuração permanece independente de React para ser validada por testes
 * de contrato e reutilizada na sidebar, no drawer e na navegação móvel.
 */

const EMPTY_ITEMS = Object.freeze([]);

/**
 * Cria um destino de navegação imutável.
 *
 * @param {string} to - Rota principal do destino.
 * @param {string} label - Texto visível do destino.
 * @param {string} icon - Identificador do ícone da navegação.
 * @param {string[]} [activePaths] - Rotas que representam o destino.
 * @param {{exact?: boolean, action?: "cart"|null}} [options] - Política de correspondência e ação local opcional.
 * @returns {Readonly<object>} Destino pronto para integrar a configuração.
 */
const item = (
    to,
    label,
    icon,
    activePaths = [to],
    { exact = false, action = null } = {},
) =>
    Object.freeze({
        to,
        label,
        icon,
        activePaths: Object.freeze(activePaths),
        exact,
        ...(action ? { action } : {}),
    });

/**
 * Cria um grupo estável de destinos.
 *
 * @param {string} id - Identificador técnico estável do grupo.
 * @param {string} label - Nome visível do grupo.
 * @param {string} icon - Ícone apresentado no modo accordion.
 * @param {Readonly<object>[]} items - Destinos pertencentes ao grupo.
 * @param {{direct?: boolean}} [options] - Define se o grupo é um único link.
 * @returns {Readonly<object>} Grupo imutável de navegação.
 */
const group = (id, label, icon, items, { direct = false } = {}) =>
    Object.freeze({
        id,
        label,
        icon,
        direct,
        items: Object.freeze(items),
    });

export const ROLE_NAVIGATION_CONFIG = Object.freeze({
    cliente: Object.freeze({
        title: "Área do cliente",
        presentation: "accordion",
        groups: Object.freeze([
            group(
                "inicio",
                "Início",
                "dashboard",
                [item("/conta", "Início", "dashboard", ["/conta"], { exact: true })],
                { direct: true },
            ),
            group("consulta", "Consulta", "sparkles", [
                item("/consulta", "Resumo da consulta", "sparkles", ["/consulta", "/consulta/relatorios"]),
                item("/consulta/nova", "Nova consulta", "sparkles"),
                item("/consulta/ativa", "Consulta atual", "review"),
                item("/consulta/historico", "Histórico de consultas", "calendar"),
            ]),
            group("pele-rotina", "Pele e rotina", "face", [
                item("/pele", "A minha pele", "face", ["/pele"]),
                item("/pele/historico", "Histórico da pele", "calendar"),
                item("/pele/evolucao", "Evolução", "star"),
                item("/pele/comparacao", "Comparação", "review"),
                item("/rotina", "Rotina", "calendar", ["/rotina"]),
                item("/rotina/alertas", "Alertas", "megaphone"),
            ]),
            group("compras", "Compras", "bag", [
                item("/produtos", "Produtos", "bag", ["/produtos"]),
                item(
                    "/carrinho",
                    "Carrinho",
                    "cart",
                    ["/carrinho", "/checkout"],
                    { action: "cart" },
                ),
                item("/compras", "Encomendas", "box"),
            ]),
        ]),
        accountItems: Object.freeze([
            item("/conta/perfil", "Perfil", "user"),
            item("/conta/preferencias", "Preferências", "star"),
            item("/conta/privacidade-biometrica", "Privacidade", "shield"),
            item("/notificacoes", "Notificações", "megaphone"),
        ]),
        utilityItems: EMPTY_ITEMS,
        mobile: Object.freeze([
            item("/conta", "Início", "dashboard", ["/conta"], { exact: true }),
            item("/consulta", "Consulta", "sparkles", ["/consulta"]),
            item("/pele", "Pele", "face", ["/pele", "/rotina"]),
        ]),
    }),
    consultor: Object.freeze({
        title: "Consultoria",
        groups: Object.freeze([
            group("consultoria", "Consultoria", "review", [
                item("/consultoria/revisoes", "Fila de revisões", "review"),
            ]),
        ]),
        accountItems: EMPTY_ITEMS,
        utilityItems: EMPTY_ITEMS,
        mobile: Object.freeze([item("/consultoria/revisoes", "Revisões", "review")]),
    }),
    administrador: Object.freeze({
        title: "Administração",
        groups: Object.freeze([
            group("visao-geral", "Visão geral", "dashboard", [
                item("/admin", "Painel", "dashboard", ["/admin"]),
            ]),
            group("catalogo", "Catálogo", "bag", [
                item("/admin/produtos", "Produtos", "bag", ["/admin/produtos"]),
                item("/admin/categorias", "Categorias", "tag"),
                item("/admin/stock", "Stock", "box"),
            ]),
            group("operacoes", "Operações", "cart", [
                item("/admin/encomendas", "Encomendas", "cart"),
                item("/admin/avaliacoes", "Avaliações", "star"),
                item("/admin/campanhas", "Campanhas", "megaphone"),
            ]),
            group("definicoes", "Definições", "shield", [
                item("/admin/utilizadores", "Utilizadores", "users"),
                item("/admin/pedidos-privacidade", "Privacidade", "shield"),
                item("/admin/auditoria-biometrica", "Auditoria", "shield"),
                item("/admin/exportacoes", "Exportações", "download"),
            ]),
        ]),
        accountItems: EMPTY_ITEMS,
        utilityItems: EMPTY_ITEMS,
        mobile: Object.freeze([
            item("/admin", "Início", "dashboard", ["/admin"]),
            item("/admin/produtos", "Produtos", "bag"),
            item("/admin/encomendas", "Encomendas", "cart"),
        ]),
    }),
});

/**
 * Confirma se uma rota representa um caminho configurado.
 *
 * @param {string} pathname - Rota atual do browser.
 * @param {string} candidate - Caminho configurado para comparação.
 * @param {boolean} exact - Impede que descendentes sejam considerados ativos.
 * @returns {boolean} Verdadeiro quando o caminho corresponde à rota.
 */
function routeMatches(pathname, candidate, exact) {
    return pathname === candidate || (!exact && pathname.startsWith(`${candidate}/`));
}

/**
 * Devolve todos os destinos que participam na resolução do estado ativo.
 *
 * @param {object} navigation - Configuração de uma role.
 * @returns {object[]} Destinos principais, da conta e utilitários.
 */
function getActiveCandidates(navigation) {
    return [
        ...navigation.groups.flatMap((navigationGroup) => navigationGroup.items),
        ...(navigation.accountItems ?? EMPTY_ITEMS),
        ...(navigation.utilityItems ?? EMPTY_ITEMS),
    ];
}

/**
 * Calcula a correspondência mais específica de um destino para a rota atual.
 *
 * @param {object} navigationItem - Destino de navegação.
 * @param {string} pathname - Rota atual do browser.
 * @returns {number} Comprimento da melhor correspondência ou -1 sem resultado.
 */
function getItemMatchLength(navigationItem, pathname) {
    const matchingLengths = navigationItem.activePaths
        .filter((path) => routeMatches(pathname, path, navigationItem.exact))
        .map((path) => path.length);

    return matchingLengths.length > 0 ? Math.max(...matchingLengths) : -1;
}

/**
 * Confirma se um item representa diretamente a rota, sem comparar prioridades.
 *
 * É usado na bottom navigation, onde um destino representa deliberadamente
 * uma área inteira e deve continuar ativo nas respetivas subrotas.
 *
 * @param {object} navigationItem - Destino candidato.
 * @param {string} pathname - Rota atual do browser.
 * @returns {boolean} Verdadeiro quando alguma rota configurada corresponde.
 */
export function doesRoleNavigationItemMatch(navigationItem, pathname) {
    return getItemMatchLength(navigationItem, pathname) >= 0;
}

/**
 * Encontra o destino mais específico para a rota atual.
 *
 * @param {object} navigation - Configuração de uma role.
 * @param {string} pathname - Rota atual do browser.
 * @returns {object|null} Destino ativo ou null quando não existe correspondência.
 */
function findActiveNavigationItem(navigation, pathname) {
    return getActiveCandidates(navigation).reduce(
        (best, candidate) => {
            const matchLength = getItemMatchLength(candidate, pathname);
            return matchLength > best.matchLength
                ? { item: candidate, matchLength }
                : best;
        },
        { item: null, matchLength: -1 },
    ).item;
}

/**
 * Determina se um item é o destino visual mais específico da rota atual.
 *
 * @param {object} navigation - Configuração de uma role.
 * @param {object} targetItem - Item candidato.
 * @param {string} pathname - Rota atual.
 * @returns {boolean} Verdadeiro quando o item deve receber aria-current.
 */
export function isRoleNavigationItemActive(navigation, targetItem, pathname) {
    const activeItem = findActiveNavigationItem(navigation, pathname);
    return activeItem?.to === targetItem.to;
}

/**
 * Resolve o grupo principal que deve abrir para a rota atual.
 *
 * Destinos da conta e utilitários não pertencem à sidebar e devolvem null.
 *
 * @param {object} navigation - Configuração de uma role.
 * @param {string} pathname - Rota atual do browser.
 * @returns {string|null} Identificador do grupo ativo ou null.
 */
export function getActiveRoleNavigationGroupId(navigation, pathname) {
    const activeItem = findActiveNavigationItem(navigation, pathname);
    if (!activeItem) return null;

    return navigation.groups.find((navigationGroup) =>
        navigationGroup.items.some((candidate) => candidate.to === activeItem.to),
    )?.id ?? null;
}

/**
 * Obtém a navegação da role sem expor uma configuração mutável.
 *
 * @param {string} role - Role autenticada.
 * @returns {Readonly<object>} Configuração correspondente ou fallback de cliente.
 */
export function getRoleNavigation(role) {
    return ROLE_NAVIGATION_CONFIG[role] ?? ROLE_NAVIGATION_CONFIG.cliente;
}
