/**
 * Utilitários do checkout exclusivamente simulado.
 *
 * Este módulo não conhece fornecedores, URLs externas ou dados financeiros. A sua
 * responsabilidade limita-se a criar uma chave opaca por tentativa e a
 * traduzir os estados públicos devolvidos pela API para linguagem de produto.
 */

export const SIMULATED_PAYMENT_NOTICE =
    "Nenhum valor será cobrado. A confirmação regista a encomenda sem criar um movimento financeiro.";

const PAYMENT_STATUS_LABELS = Object.freeze({
    awaiting_simulation: "Por confirmar",
    simulated_paid: "Encomenda confirmada",
    simulated_failed: "Confirmação não concluída",
});

const SIMULATED_PAYMENT_STATUSES = Object.freeze(
    Object.keys(PAYMENT_STATUS_LABELS),
);

/**
 * Cria uma chave opaca para uma tentativa de pagamento simulado.
 *
 * A página guarda o valor retornado e reutiliza-o nos retries da mesma
 * tentativa. A função exige entropia criptograficamente segura para evitar
 * chaves previsíveis.
 *
 * @function createSimulationIdempotencyKey
 * @param {string} orderId - Identificador da encomenda devolvido pela API.
 * @param {() => string} [randomUUID] - Gerador seguro injetável em testes.
 * @returns {string} Chave aceite pelo header `Idempotency-Key`.
 * @throws {Error} Quando falta um ID ou um gerador seguro.
 */
export function createSimulationIdempotencyKey(
    orderId,
    randomUUID = globalThis.crypto?.randomUUID?.bind(globalThis.crypto),
) {
    const normalizedOrderId = String(orderId ?? "").trim();

    if (!normalizedOrderId) {
        throw new Error("Não foi possível identificar a encomenda.");
    }

    if (typeof randomUUID !== "function") {
        throw new Error("O browser não disponibiliza um gerador aleatório seguro.");
    }

    return `sim.${normalizedOrderId}.${randomUUID()}`;
}

/**
 * Mantém a chave durante erros de transporte, mas abre uma tentativa nova
 * depois de a API devolver uma falha terminal persistida.
 *
 * Reutilizar a chave de uma `simulated_failed` reproduziria, corretamente, a
 * mesma falha para sempre. Uma nova ação explícita do utilizador precisa de uma
 * chave nova; um erro antes de existir resposta continua a reutilizar a chave
 * que a página já mantém em estado.
 *
 * @function getIdempotencyKeyAfterSimulationResponse
 * @param {object} order - Encomenda validada devolvida pela API.
 * @param {string} currentKey - Chave da tentativa que acabou de responder.
 * @param {() => string} [randomUUID] - Gerador seguro injetável em testes.
 * @returns {string} Chave a usar na próxima ação explícita.
 */
export function getIdempotencyKeyAfterSimulationResponse(
    order,
    currentKey,
    randomUUID = globalThis.crypto?.randomUUID?.bind(globalThis.crypto),
) {
    if (order?.payment?.status === "simulated_failed") {
        return createSimulationIdempotencyKey(order.id, randomUUID);
    }

    return String(currentKey ?? "");
}

/**
 * Indica se a encomenda aceita o passo explícito de simulação.
 *
 * @function canSimulatePayment
 * @param {object|null} order - DTO público da encomenda.
 * @returns {boolean} Verdadeiro para estados pendentes ou falhados recuperáveis.
 */
export function canSimulatePayment(order) {
    return ["awaiting_simulation", "simulated_failed"].includes(
        order?.payment?.status,
    );
}

/**
 * Valida o contrato mínimo antes de a UI aceitar uma encomenda da API.
 *
 * Esta barreira evita que uma resposta antiga com integração externa ou um payload
 * incompleto volte a ativar, por acidente, um fluxo externo no frontend.
 *
 * @function assertSimulatedOrder
 * @param {unknown} order - Valor recebido em `data.order`.
 * @returns {object} A própria encomenda depois de validada.
 * @throws {Error} Quando o payload não respeita o contrato simulado.
 */
export function assertSimulatedOrder(order) {
    if (
        !order ||
        typeof order !== "object" ||
        typeof order.id !== "string" ||
        !order.id.trim() ||
        order.payment?.mode !== "simulated" ||
        !SIMULATED_PAYMENT_STATUSES.includes(order.payment?.status)
    ) {
        throw new Error("Não foi possível validar a encomenda. Tenta novamente.");
    }

    return order;
}

/**
 * Traduz um estado público de pagamento sem expor nomes técnicos na UI.
 *
 * @function getSimulatedPaymentStatusLabel
 * @param {string|undefined} status - Estado devolvido pela API.
 * @returns {string} Texto legível e seguro para apresentação.
 */
export function getSimulatedPaymentStatusLabel(status) {
    return PAYMENT_STATUS_LABELS[status] ?? "Estado indisponível";
}
