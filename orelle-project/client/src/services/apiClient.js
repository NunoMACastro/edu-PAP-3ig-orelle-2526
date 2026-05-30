const API_BASE_URL =
    import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3001/api";

/**
 * Cliente HTTP simples para a API da Orelle.
 * Mantemos a funcao centralizada para nao repetir fetch em todas as paginas.
 */
export async function apiRequest(path, options = {}) {
    const response = await fetch(`${API_BASE_URL}${path}`, {
        headers: {
            "Content-Type": "application/json",
            ...(options.headers ?? {}),
        },
        ...options,
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
        const message = data?.error?.message ?? "Pedido falhou";
        throw new Error(message);
    }

    return data;
}