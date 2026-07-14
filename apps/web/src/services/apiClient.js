/**
 * Cliente HTTP same-origin da aplicação Orélle.
 *
 * Centraliza cookies, erros públicos, timeouts, cancelamento e expiração de
 * sessão. Nunca guarda tokens no browser nem incorpora hosts de desenvolvimento
 * no bundle publicado.
 */

export const API_BASE_URL = "/api";
export const JSON_REQUEST_TIMEOUT_MS = 10_000;
export const FILE_REQUEST_TIMEOUT_MS = 30_000;
export const AUTH_SESSION_EXPIRED_EVENT = "orelle:session-expired";
export const CSRF_HEADER_NAME = "X-CSRF-Token";

const SAFE_HTTP_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);
const CSRF_EXEMPT_MUTATIONS = new Set(["/auth/login", "/auth/register"]);
const CSRF_TOKEN_PATTERN = /^[A-Za-z0-9_-]{43}$/;
const OPERATIONAL_ERROR_PATTERN =
    /\b(?:api|backend|csrf|endpoint|idempotency-key|json|mongodb|objectid|openai|payload|provider|schema)\b|pagamento\s+(?:acad[eé]mico\s+)?simulado/i;
let csrfTokenCache = null;
let csrfTokenRequest = null;

/**
 * Impede que mensagens de infraestrutura devolvidas por serviços apareçam na UI.
 * Mantém mensagens de validação de negócio que ajudam o utilizador a corrigir
 * campos, mas converte falhas técnicas e erros de servidor em copy acionável.
 */
export function getPublicErrorMessage(message, status = 0) {
    const normalizedMessage = String(message ?? "").trim();

    if (Number(status) >= 500) {
        return "Não foi possível concluir este pedido. Tenta novamente.";
    }

    if (/csrf/i.test(normalizedMessage)) {
        return "Não foi possível validar a sessão. Atualiza a página e tenta novamente.";
    }

    if (!normalizedMessage || OPERATIONAL_ERROR_PATTERN.test(normalizedMessage)) {
        return "Não foi possível concluir esta ação. Tenta novamente.";
    }

    return normalizedMessage;
}

/**
 * Limpa o token CSRF mantido apenas em memória.
 *
 * É chamado quando a sessão muda, expira ou termina. Nenhum token é escrito
 * em localStorage, sessionStorage, cookies acessíveis a JS ou logs.
 *
 * @returns {void}
 */
export function clearCsrfTokenCache() {
    csrfTokenCache = null;
    csrfTokenRequest = null;
}

/**
 * Erro HTTP/rede normalizado para as páginas da aplicação.
 */
export class ApiError extends Error {
    /**
     * @param {object} options - Metadados públicos e sanitizados.
     * @param {string} options.message - Mensagem para a UI.
     * @param {number} [options.status=0] - Status HTTP ou zero sem resposta.
     * @param {string} [options.code="API_ERROR"] - Código estável.
     * @param {unknown} [options.details] - Detalhes públicos de validação.
     * @param {string} [options.requestId] - Correlação devolvida pela API.
     * @param {unknown} [options.cause] - Erro original não serializado.
     */
    constructor({
        message,
        status = 0,
        code = "API_ERROR",
        details = undefined,
        requestId = undefined,
        cause = undefined,
    }) {
        super(message, cause === undefined ? undefined : { cause });
        this.name = "ApiError";
        this.status = status;
        this.code = code;
        this.details = details;
        this.requestId = requestId;
    }
}

/**
 * Lê o envelope público de erro sem assumir JSON válido.
 *
 * @param {Response} response - Resposta HTTP não bem-sucedida.
 * @returns {Promise<{message: string, code: string, details?: unknown, requestId?: string}>} Erro normalizado.
 */
async function readApiError(response) {
    const data = await response.json().catch(() => ({}));
    const publicError = data?.error ?? {};

    return {
        message: getPublicErrorMessage(publicError.message, response.status),
        code: publicError.code ?? `HTTP_${response.status}`,
        details: publicError.details,
        requestId: publicError.requestId,
    };
}

/**
 * Emite um único contrato global que o AuthProvider pode observar.
 *
 * @param {string|undefined} requestId - Correlação pública da resposta 401.
 * @returns {void}
 */
function dispatchSessionExpired(requestId) {
    clearCsrfTokenCache();

    if (
        typeof window === "undefined" ||
        typeof window.dispatchEvent !== "function"
    ) {
        return;
    }

    const event =
        typeof CustomEvent === "function"
            ? new CustomEvent(AUTH_SESSION_EXPIRED_EVENT, {
                  detail: { requestId },
              })
            : new Event(AUTH_SESSION_EXPIRED_EVENT);

    window.dispatchEvent(event);
}

/**
 * Compõe cancelamento do caller com um timeout próprio e disponibiliza cleanup.
 *
 * @param {AbortSignal|undefined} callerSignal - Sinal recebido do componente.
 * @param {number} timeoutMs - Limite temporal do pedido.
 * @returns {{signal: AbortSignal, didTimeout: () => boolean, cleanup: () => void}} Controlo do pedido.
 */
function createRequestAbortControl(callerSignal, timeoutMs) {
    const controller = new AbortController();
    let timeoutReached = false;
    const abortFromCaller = () => controller.abort(callerSignal?.reason);

    if (callerSignal?.aborted) {
        abortFromCaller();
    } else {
        callerSignal?.addEventListener("abort", abortFromCaller, { once: true });
    }

    const timeout = setTimeout(() => {
        timeoutReached = true;
        controller.abort(new Error("Request timeout"));
    }, timeoutMs);

    return {
        signal: controller.signal,
        didTimeout: () => timeoutReached,
        cleanup: () => {
            clearTimeout(timeout);
            callerSignal?.removeEventListener("abort", abortFromCaller);
        },
    };
}

/**
 * Converte falhas de fetch/cancelamento em `ApiError` estável.
 *
 * @param {unknown} error - Falha original.
 * @param {{didTimeout: () => boolean}} abortControl - Estado do timeout.
 * @param {AbortSignal|undefined} callerSignal - Sinal do caller.
 * @returns {ApiError} Erro público normalizado.
 */
function normalizeFetchFailure(error, abortControl, callerSignal) {
    if (abortControl.didTimeout()) {
        return new ApiError({
            message: "O pedido excedeu o tempo limite.",
            code: "REQUEST_TIMEOUT",
            cause: error,
        });
    }

    if (callerSignal?.aborted) {
        return new ApiError({
            message: "O pedido foi cancelado.",
            code: "REQUEST_ABORTED",
            cause: error,
        });
    }

    if (error instanceof ApiError) return error;

    return new ApiError({
        message: "Não foi possível estabelecer ligação. Verifica a tua ligação e tenta novamente.",
        code: "NETWORK_ERROR",
        cause: error,
    });
}

/**
 * Executa `fetch` com contrato comum e devolve a resposta ainda não consumida.
 *
 * @param {string} path - Caminho iniciado por `/`.
 * @param {RequestInit & {timeoutMs?: number}} options - Opções do caller.
 * @param {number} defaultTimeoutMs - Timeout da categoria de pedido.
 * @param {(response: Response) => Promise<unknown>} consumeResponse - Leitura do body ainda sob timeout.
 * @returns {Promise<unknown>} Resultado consumido dentro do limite temporal.
 */
async function performApiFetch(
    path,
    options,
    defaultTimeoutMs,
    consumeResponse,
) {
    const {
        timeoutMs = defaultTimeoutMs,
        signal: callerSignal,
        headers: callerHeaders,
        ...fetchOptions
    } = options;
    const body = fetchOptions.body;
    const isFormData =
        typeof FormData !== "undefined" && body instanceof FormData;
    const headers = new Headers(callerHeaders ?? {});

    if (body !== undefined && !isFormData && !headers.has("Content-Type")) {
        headers.set("Content-Type", "application/json");
    }

    const abortControl = createRequestAbortControl(callerSignal, timeoutMs);

    try {
        // A preparação assíncrona (por exemplo, obter CSRF) pode dar tempo ao
        // caller para cancelar antes de `fetch` instalar listeners. Falhamos
        // imediatamente em vez de iniciar um pedido com signal já abortado.
        if (abortControl.signal.aborted) {
            throw abortControl.signal.reason ?? new Error("Request aborted");
        }

        const response = await fetch(`${API_BASE_URL}${path}`, {
            ...fetchOptions,
            credentials: "include",
            headers,
            signal: abortControl.signal,
        });

        if (!response.ok) {
            const publicError = await readApiError(response);
            if (response.status === 401) {
                dispatchSessionExpired(publicError.requestId);
            }

            throw new ApiError({
                ...publicError,
                status: response.status,
            });
        }

        return await consumeResponse(response);
    } catch (error) {
        throw normalizeFetchFailure(error, abortControl, callerSignal);
    } finally {
        abortControl.cleanup();
    }
}

/**
 * Indica se um pedido deve transportar a prova CSRF da sessão por cookie.
 *
 * @param {string} path - Path relativo da API.
 * @param {RequestInit} options - Opções do pedido.
 * @returns {boolean} Verdadeiro para mutações autenticadas.
 */
function requestRequiresCsrf(path, options) {
    const method = String(options.method ?? "GET").toUpperCase();

    return (
        !SAFE_HTTP_METHODS.has(method) &&
        !CSRF_EXEMPT_MUTATIONS.has(path)
    );
}

/**
 * Obtém uma prova CSRF ligada à sessão e partilha pedidos concorrentes.
 *
 * @returns {Promise<string>} Token validado mantido apenas em memória.
 */
async function getCsrfToken() {
    if (csrfTokenCache) return csrfTokenCache;
    if (csrfTokenRequest) return csrfTokenRequest;

    csrfTokenRequest = performApiFetch(
        "/auth/csrf",
        { method: "GET" },
        JSON_REQUEST_TIMEOUT_MS,
        async (response) => response.json().catch(() => ({})),
    )
        .then((data) => {
            if (!CSRF_TOKEN_PATTERN.test(String(data?.csrfToken ?? ""))) {
                throw new ApiError({
                    message: "Não foi possível validar a sessão. Atualiza a página e tenta novamente.",
                    code: "CSRF_TOKEN_INVALID",
                });
            }

            csrfTokenCache = data.csrfToken;
            return csrfTokenCache;
        })
        .finally(() => {
            csrfTokenRequest = null;
        });

    return csrfTokenRequest;
}

/**
 * Permite ao caller abandonar imediatamente a espera por um bootstrap CSRF
 * partilhado. O pedido partilhado pode concluir e preencher a cache para outros
 * callers, mas a mutação cancelada nunca chega a ser enviada.
 *
 * @param {Promise<string>} tokenPromise - Bootstrap partilhado em memória.
 * @param {AbortSignal|undefined} signal - Cancelamento do caller.
 * @returns {Promise<string>} Token ou erro de cancelamento normalizado.
 */
function waitForCsrfToken(tokenPromise, signal) {
    if (!signal) return tokenPromise;
    if (signal.aborted) {
        return Promise.reject(
            new ApiError({
                message: "O pedido foi cancelado.",
                code: "REQUEST_ABORTED",
            }),
        );
    }

    return new Promise((resolve, reject) => {
        const abort = () => {
            reject(
                new ApiError({
                    message: "O pedido foi cancelado.",
                    code: "REQUEST_ABORTED",
                }),
            );
        };
        signal.addEventListener("abort", abort, { once: true });
        tokenPromise.then(resolve, reject).finally(() => {
            signal.removeEventListener("abort", abort);
        });
    });
}

/**
 * Acrescenta o header CSRF a mutações autenticadas sem alterar o body.
 *
 * O browser acrescenta o header `Origin` protegido pelo user agent; tentar
 * forjá-lo em JavaScript seria incorreto. Aqui só é enviada a prova explícita.
 *
 * @param {string} path - Path relativo da API.
 * @param {RequestInit & {timeoutMs?: number}} options - Opções originais.
 * @returns {Promise<RequestInit & {timeoutMs?: number}>} Opções preparadas.
 */
async function withCsrfProof(path, options) {
    if (!requestRequiresCsrf(path, options)) return options;

    const headers = new Headers(options.headers ?? {});
    if (!headers.has(CSRF_HEADER_NAME)) {
        headers.set(
            CSRF_HEADER_NAME,
            await waitForCsrfToken(getCsrfToken(), options.signal),
        );
    }

    return { ...options, headers };
}

/**
 * Atualiza o ciclo de vida do token depois de uma mutação ou erro.
 *
 * @param {string} path - Path executado.
 * @param {unknown} error - Erro opcional da resposta.
 * @returns {void}
 */
function updateCsrfLifecycle(path, error = undefined) {
    if (
        path === "/auth/login" ||
        path === "/auth/logout" ||
        path === "/auth/logout-all" ||
        (error instanceof ApiError &&
            error.status === 403 &&
            /csrf/i.test(error.message))
    ) {
        clearCsrfTokenCache();
    }
}

/**
 * Faz um pedido JSON com timeout padrão de 10 segundos.
 *
 * @param {string} path - Caminho relativo à API.
 * @param {RequestInit & {timeoutMs?: number}} [options={}] - Opções fetch.
 * @returns {Promise<unknown|null>} JSON ou null para 204.
 */
export async function apiRequest(path, options = {}) {
    const preparedOptions = await withCsrfProof(path, options);

    try {
        const result = await performApiFetch(
            path,
            preparedOptions,
            JSON_REQUEST_TIMEOUT_MS,
            async (response) => {
                if (response.status === 204) return null;

                try {
                    return await response.json();
                } catch (error) {
                    if (error?.name === "AbortError") throw error;

                    throw new ApiError({
                        message: "Recebemos uma resposta inesperada. Tenta novamente.",
                        status: response.status,
                        code: "INVALID_API_RESPONSE",
                        requestId:
                            response.headers.get("x-request-id") ?? undefined,
                        cause: error,
                    });
                }
            },
        );
        updateCsrfLifecycle(path);
        return result;
    } catch (error) {
        updateCsrfLifecycle(path, error);
        throw error;
    }
}

/**
 * Faz um pedido autenticado de ficheiro com timeout padrão de 30 segundos.
 *
 * @param {string} path - Caminho relativo à API.
 * @param {RequestInit & {timeoutMs?: number}} [options={}] - Opções fetch.
 * @returns {Promise<{blob: Blob, headers: Headers, status: number}>} Ficheiro totalmente lido dentro do timeout.
 */
export async function apiDownload(path, options = {}) {
    const preparedOptions = await withCsrfProof(path, options);

    return performApiFetch(
        path,
        preparedOptions,
        FILE_REQUEST_TIMEOUT_MS,
        async (response) => ({
            blob: await response.blob(),
            headers: response.headers,
            status: response.status,
        }),
    );
}
