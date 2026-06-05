const API_BASE_URL =
    import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3001/api";

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

    if (response.status === 204) return null;

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
        throw new Error(data?.error?.message ?? "Pedido falhou");
    }

    return data;
}