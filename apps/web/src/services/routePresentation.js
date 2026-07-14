/**
 * Metadados públicos de apresentação por rota.
 *
 * O matcher fica separado do JSX para permitir testes rápidos sem browser e
 * para manter títulos coerentes mesmo nas rotas com parâmetros técnicos
 * internos que nunca são apresentados ao utilizador.
 */

const ROUTE_TITLES = Object.freeze([
    [/^\/$/, "Início"],
    [/^\/login$/, "Iniciar sessão"],
    [/^\/registo$/, "Criar conta"],
    [/^\/produtos\/[^/]+\/relacionados$/, "Produtos relacionados"],
    [/^\/produtos\/[^/]+\/avaliar$/, "Avaliar produto"],
    [/^\/produtos\/[^/]+$/, "Detalhe do produto"],
    [/^\/produtos$/, "Produtos"],
    [/^\/conta\/perfil$/, "Perfil"],
    [/^\/conta\/editar$/, "Editar perfil"],
    [/^\/conta\/preferencias$/, "Preferências"],
    [/^\/conta\/privacidade-biometrica$/, "Privacidade"],
    [/^\/conta$/, "Conta"],
    [/^\/consulta\/relatorios\/[^/]+\/resumo$/, "Resumo da consulta"],
    [/^\/consulta\/relatorios\/[^/]+\/plano$/, "Plano cosmético"],
    [/^\/consulta\/relatorios\/[^/]+\/produtos$/, "Produtos recomendados"],
    [/^\/consulta\/relatorios\/[^/]+\/pre-visualizacao$/, "Pré-visualização cosmética"],
    [/^\/consulta\/relatorios\/[^/]+\/evidencias$/, "Evidências da consulta"],
    [/^\/consulta\/relatorios\/[^/]+$/, "Relatório da consulta"],
    [/^\/consulta\/nova$/, "Nova consulta"],
    [/^\/consulta\/ativa$/, "Consulta ativa"],
    [/^\/consulta\/sessao$/, "Consulta guiada"],
    [/^\/consulta\/historico$/, "Histórico da consulta"],
    [/^\/consulta\/insights$/, "Insights do consultor"],
    [/^\/consulta\/recomendacoes$/, "Recomendações"],
    [/^\/consulta$/, "Consulta"],
    [/^\/pele\/fotografias$/, "Fotografias da pele"],
    [/^\/pele\/analise$/, "Avaliação cosmética"],
    [/^\/pele\/relatorio$/, "Relatório cosmético"],
    [/^\/pele\/historico$/, "Histórico da pele"],
    [/^\/pele\/evolucao$/, "Evolução da pele"],
    [/^\/pele\/comparacao$/, "Comparação da pele"],
    [/^\/pele\/simulacao$/, "Consulta"],
    [/^\/pele\/antes-depois\/[^/]+$/, "Consulta"],
    [/^\/pele$/, "Pele"],
    [/^\/rotina\/alertas$/, "Alertas da rotina"],
    [/^\/rotina$/, "Rotina"],
    [/^\/carrinho$/, "Carrinho"],
    [/^\/checkout$/, "Confirmar encomenda"],
    [/^\/compras$/, "Compras"],
    [/^\/notificacoes$/, "Notificações"],
    [/^\/consultoria\/revisoes$/, "Revisões da consulta"],
    [/^\/consultoria\/revisoes-ia$/, "Revisões da consulta"],
    [/^\/admin\/produtos\/novo$/, "Novo produto"],
    [/^\/admin\/categorias$/, "Categorias"],
    [/^\/admin\/utilizadores$/, "Utilizadores"],
    [/^\/admin\/pedidos-privacidade$/, "Pedidos de privacidade"],
    [/^\/admin\/avaliacoes$/, "Avaliações"],
    [/^\/admin\/exportacoes$/, "Exportações"],
    [/^\/admin\/campanhas$/, "Campanhas"],
    [/^\/admin\/encomendas$/, "Encomendas"],
    [/^\/admin\/stock$/, "Stock"],
    [/^\/admin\/auditoria-biometrica$/, "Auditoria de privacidade"],
    [/^\/admin\/produtos$/, "Curadoria de produtos"],
    [/^\/admin$/, "Administração"],
]);

/**
 * Resolve o título de produto para um pathname normalizado.
 *
 * @param {string} pathname - Pathname fornecido pelo React Router.
 * @returns {string} Título humano sem IDs nem terminologia interna.
 */
export function getRouteTitle(pathname) {
    const normalizedPath =
        String(pathname || "/").replace(/\/+$/, "") || "/";

    return (
        ROUTE_TITLES.find(([pattern]) => pattern.test(normalizedPath))?.[1] ??
        "Página não encontrada"
    );
}
