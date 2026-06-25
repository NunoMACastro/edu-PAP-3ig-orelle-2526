/**
 * Cliente HTTP usado pelo frontend da MF0.
 *
 * A configuracao `credentials: "include"` e essencial para que o browser envie
 * e receba o cookie HttpOnly definido no BK-MF0-02.
 */
export const API_BASE_URL =
    import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3001/api";

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
const configuredApiBaseUrl =
    import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3001/api";

/**
 * Valida a URL pública da API no frontend.
 *
 * @function resolveApiBaseUrl
 * @param {string} value - URL configurada.
 * @returns {string} URL pronta a usar pelo cliente HTTP.
 * @throws {Error} Quando produção usa HTTP inseguro.
 */
export function resolveApiBaseUrl(value) {
    const isProduction = import.meta.env.PROD;

    if (isProduction && value.startsWith("http://")) {
        throw new Error("VITE_API_BASE_URL deve usar HTTPS em produção.");
    }

    // Em desenvolvimento, localhost pode usar HTTP para facilitar testes.
    return value;
}

export const API_BASE_URL = resolveApiBaseUrl(configuredApiBaseUrl);