/**
 * Primitivas puras partilhadas pelos hooks de operações assíncronas.
 *
 * A geração monotónica permite invalidar respostas antigas sem depender do
 * timing do cancelamento de rede. Isto cobre APIs que terminem mesmo depois de
 * receberem um `AbortSignal` e impede que sobrescrevam estado mais recente.
 */

export const ASYNC_STATUS = Object.freeze({
    IDLE: "idle",
    LOADING: "loading",
    SUCCESS: "success",
    EMPTY: "empty",
    ERROR: "error",
});

/**
 * Cria um controlo monotónico para identificar apenas a execução mais recente.
 *
 * @param {number} [initialGeneration=0] - Geração inicial, útil em testes.
 * @returns {{next: () => number, invalidate: () => number, isCurrent: (generation: number) => boolean, current: () => number}} Gate de gerações.
 */
export function createAsyncGenerationGate(initialGeneration = 0) {
    let generation = initialGeneration;

    return Object.freeze({
        next() {
            generation += 1;
            return generation;
        },
        invalidate() {
            generation += 1;
            return generation;
        },
        isCurrent(candidate) {
            return candidate === generation;
        },
        current() {
            return generation;
        },
    });
}

/**
 * Reconhece cancelamentos do browser e o contrato normalizado do `apiClient`.
 *
 * @param {unknown} error - Erro capturado pela operação.
 * @param {AbortSignal|undefined} signal - Sinal associado à execução.
 * @returns {boolean} Verdadeiro apenas para cancelamento intencional.
 */
export function isAsyncAbort(error, signal) {
    return (
        signal?.aborted === true ||
        error?.name === "AbortError" ||
        error?.code === "REQUEST_ABORTED"
    );
}

/**
 * Normaliza valores rejeitados que não sejam instâncias de `Error`.
 *
 * @param {unknown} error - Valor rejeitado.
 * @returns {Error} Erro seguro para consumo uniforme pela UI.
 */
export function normalizeAsyncError(error) {
    if (error instanceof Error) return error;

    return new Error(
        typeof error === "string" && error.trim()
            ? error
            : "A operação não pôde ser concluída.",
    );
}

/**
 * Resolve o estado visual de uma coleção já carregada.
 *
 * @param {unknown} value - Resultado devolvido pelo loader.
 * @returns {"empty"|"success"} Estado de coleção.
 */
export function collectionResourceStatus(value) {
    return Array.isArray(value) && value.length === 0
        ? ASYNC_STATUS.EMPTY
        : ASYNC_STATUS.SUCCESS;
}
