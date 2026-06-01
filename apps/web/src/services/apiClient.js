/**
 * Cliente HTTP usado pelo frontend da MF0.
 *
 * A configuracao `credentials: "include"` e essencial para que o browser envie
 * e receba o cookie HttpOnly definido no BK-MF0-02.
 */
const API_BASE_URL =
    import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3001/api";

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
    const response = await fetch(`${API_BASE_URL}${path}`, {
        credentials: "include",
        headers: {
            "Content-Type": "application/json",
            ...(options.headers ?? {}),
        },
        ...options,
    });

    if (response.status === 204) {
        return null;
    }

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
        throw new Error(data?.error?.message ?? "Pedido falhou");
    }

    return data;
}
