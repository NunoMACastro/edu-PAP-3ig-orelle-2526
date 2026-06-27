/**
 * Cliente HTTP usado pelo frontend da MF0.
 *
 * A configuracao `credentials: "include"` e essencial para que o browser envie
 * e receba o cookie HttpOnly definido no BK-MF0-02.
 */
const DEFAULT_API_BASE_URL = "http://127.0.0.1:3001/api";
const configuredApiBaseUrl = import.meta.env.VITE_API_BASE_URL;

/**
 * Confirma se uma URL HTTP e explicitamente local.
 *
 * @function isLocalHttpUrl
 * @param {string} value - URL candidata.
 * @returns {boolean} Verdadeiro quando a URL HTTP aponta para localhost.
 */
function isLocalHttpUrl(value) {
    try {
        const url = new URL(value);

        return (
            url.protocol === "http:" &&
            ["localhost", "127.0.0.1", "::1"].includes(url.hostname)
        );
    } catch {
        return false;
    }
}

/**
 * Resolve a base URL da API e bloqueia HTTP publico em build publicado.
 *
 * @function resolveApiBaseUrl
 * @param {string|undefined} value - Valor de ambiente opcional.
 * @param {{isProduction?: boolean}} [options={}] - Contexto de build.
 * @returns {string} Base URL segura para o cliente.
 * @throws {Error} Quando build publicado aponta para API HTTP nao local.
 */
export function resolveApiBaseUrl(value, options = {}) {
    const isProduction = options.isProduction ?? import.meta.env.PROD;
    const resolvedValue = value ?? DEFAULT_API_BASE_URL;

    if (
        isProduction &&
        resolvedValue.startsWith("http://") &&
        !isLocalHttpUrl(resolvedValue)
    ) {
        throw new Error("VITE_API_BASE_URL deve usar HTTPS em produção.");
    }

    return resolvedValue;
}

export const API_BASE_URL = resolveApiBaseUrl(configuredApiBaseUrl);

/**
 * Extrai uma mensagem de erro JSON sem assumir que todos os endpoints
 * devolvem sempre JSON.
 *
 * @async
 * @function readApiErrorMessage
 * @param {Response} response - Resposta fetch.
 * @returns {Promise<string>} Mensagem segura para UI.
 */
async function readApiErrorMessage(response) {
    const data = await response.json().catch(() => ({}));

    return data?.error?.message ?? "Pedido falhou";
}

/**
 * Faz um pedido JSON para a API Orélle.
 *
 * @async
 * @function apiRequest
 * @param {string} path - Caminho da API, por exemplo `/auth/login`.
 * @param {RequestInit} [options={}] - Opcoes adicionais do `fetch`.
 * @returns {Promise<unknown|null>} JSON da resposta ou null para 204.
 * @throws {Error} Quando a API devolve status de erro.
 */
export async function apiRequest(path, options = {}) {
    const isFormData = options.body instanceof FormData;
    const response = await fetch(`${API_BASE_URL}${path}`, {
        credentials: "include",
        headers: isFormData
            ? options.headers
            : {
                  "Content-Type": "application/json",
                  ...(options.headers ?? {}),
              },
        ...options,
    });

    if (response.status === 204) {
        return null;
    }

    if (!response.ok) {
        throw new Error(await readApiErrorMessage(response));
    }

    const data = await response.json().catch(() => ({}));

    return data;
}

/**
 * Faz um pedido autenticado para endpoints que devolvem ficheiros.
 *
 * @async
 * @function apiDownload
 * @param {string} path - Caminho da API.
 * @param {RequestInit} [options={}] - Opcoes adicionais do `fetch`.
 * @returns {Promise<Response>} Resposta binaria validada.
 * @throws {Error} Quando a API devolve status de erro.
 */
export async function apiDownload(path, options = {}) {
    const response = await fetch(`${API_BASE_URL}${path}`, {
        credentials: "include",
        ...options,
    });

    if (!response.ok) {
        throw new Error(await readApiErrorMessage(response));
    }

    return response;
}
