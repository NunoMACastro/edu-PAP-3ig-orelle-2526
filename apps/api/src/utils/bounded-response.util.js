/**
 * Leitura incremental de respostas HTTP externas com limite de bytes.
 *
 * O limite é aplicado antes de concatenar o corpo completo, evitando que um
 * provider remoto force a API a reservar memória ilimitada.
 */

/**
 * Lê uma resposta como UTF-8, cancelando o stream assim que excede o budget.
 *
 * @param {Response|object} response - Resposta Fetch ou transport de teste.
 * @param {number} maxBytes - Limite máximo em bytes.
 * @param {() => Error} makeLimitError - Fábrica do erro de domínio.
 * @returns {Promise<string>} Corpo completo dentro do limite.
 */
export async function readBoundedResponseText(
    response,
    maxBytes,
    makeLimitError,
) {
    const contentLength = Number(
        response?.headers?.get?.("content-length") ?? 0,
    );
    if (Number.isFinite(contentLength) && contentLength > maxBytes) {
        throw makeLimitError();
    }

    const reader = response?.body?.getReader?.();
    if (!reader) {
        const text = await response.text();
        if (Buffer.byteLength(text, "utf8") > maxBytes) {
            throw makeLimitError();
        }
        return text;
    }

    const decoder = new TextDecoder();
    let byteCount = 0;
    let text = "";

    while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        byteCount += value?.byteLength ?? 0;
        if (byteCount > maxBytes) {
            await reader.cancel().catch(() => undefined);
            throw makeLimitError();
        }
        text += decoder.decode(value, { stream: true });
    }

    text += decoder.decode();
    return text;
}
