/**
 * Leitura estrita do ambiente E2E, sem defaults de credenciais ou hosts.
 */

const ROLE_PREFIXES = Object.freeze({
    cliente: "ORELLE_E2E_CLIENT",
    cliente_existente: "ORELLE_E2E_EXISTING_CLIENT",
    cliente_eliminar: "ORELLE_E2E_DELETE_CLIENT",
    consultor: "ORELLE_E2E_CONSULTANT",
    administrador: "ORELLE_E2E_ADMIN",
});

/**
 * Normaliza o nome de projeto para um sufixo seguro de variável de ambiente.
 *
 * @param {string} projectName - Nome publicado em `playwright.config.js`.
 * @returns {string} Sufixo allowlist em maiúsculas.
 */
function toProjectEnvironmentSuffix(projectName) {
    return String(projectName ?? "")
        .toUpperCase()
        .replace(/[^A-Z0-9]+/g, "_")
        .replace(/^_+|_+$/g, "");
}

/**
 * Obtém e valida a origem local fornecida pelo orquestrador.
 *
 * @returns {string} Origem HTTP loopback sem path, query ou credenciais.
 * @throws {Error} Quando o runner não foi lançado pelo runtime E2E isolado.
 */
export function getE2EBaseUrl() {
    const rawValue =
        process.env.ORELLE_E2E_WEB_URL ??
        process.env.PLAYWRIGHT_BASE_URL ??
        process.env.ORELLE_E2E_BASE_URL;

    if (!rawValue) {
        throw new Error(
            "E2E exige ORELLE_E2E_WEB_URL ou PLAYWRIGHT_BASE_URL do orquestrador local",
        );
    }

    let parsed;
    try {
        parsed = new URL(rawValue);
    } catch {
        throw new Error("Origem E2E inválida");
    }

    if (
        parsed.protocol !== "http:" ||
        parsed.hostname !== "127.0.0.1" ||
        !parsed.port ||
        parsed.username ||
        parsed.password ||
        parsed.pathname !== "/" ||
        parsed.search ||
        parsed.hash
    ) {
        throw new Error(
            "E2E browser só pode usar uma origem HTTP 127.0.0.1 com porta explícita",
        );
    }

    return parsed.origin;
}

/**
 * Lê credenciais efémeras sem as imprimir ou incluir em mensagens de erro.
 *
 * Variáveis com sufixo de projeto têm precedência para runtimes que criem
 * contas por browser. O seed mínimo atual usa as variáveis genéricas.
 *
 * @param {"cliente"|"cliente_existente"|"cliente_eliminar"|"consultor"|"administrador"} role - Identidade test-only.
 * @param {string} projectName - Projeto Playwright atual.
 * @returns {{email: string, password: string}} Credenciais apenas em memória.
 * @throws {Error} Quando o orquestrador não forneceu o par completo.
 */
export function getE2ECredentials(role, projectName) {
    const prefix = ROLE_PREFIXES[role];
    if (!prefix) throw new Error("Role E2E não suportada");

    const suffix = toProjectEnvironmentSuffix(projectName);
    const projectEmail = suffix
        ? process.env[`${prefix}_EMAIL_${suffix}`]
        : undefined;
    const projectPassword = suffix
        ? process.env[`${prefix}_PASSWORD_${suffix}`]
        : undefined;
    const email = projectEmail ?? process.env[`${prefix}_EMAIL`];
    const password = projectPassword ?? process.env[`${prefix}_PASSWORD`];

    if (!email || !password) {
        throw new Error(`Credenciais E2E incompletas para a role ${role}`);
    }

    return { email, password };
}

/**
 * Obtém a referência efémera de um relatório seed sem a apresentar na UI.
 *
 * O teste usa-a apenas num pedido autenticado por ownership para provar que o
 * workflow de privacidade removeu o documento e devolve 404.
 *
 * @returns {string} ObjectId test-only validado.
 */
export function getE2EPrivacyReportId() {
    const reportId = String(process.env.ORELLE_E2E_PRIVACY_REPORT_ID ?? "");
    if (!/^[a-f0-9]{24}$/i.test(reportId)) {
        throw new Error("Referência E2E de privacidade ausente ou inválida");
    }
    return reportId;
}

/**
 * Indica se o projeto executa a viagem mutável de referência.
 *
 * @param {string} projectName - Nome do projeto Playwright.
 * @returns {boolean} Verdadeiro apenas para Chromium.
 */
export function isMutationReferenceProject(projectName) {
    return projectName === "chromium";
}
