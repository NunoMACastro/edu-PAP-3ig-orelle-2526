/**
 * Provider puramente local do pagamento simulado.
 *
 * Este módulo não conhece credenciais, URLs ou clientes HTTP. A única função é
 * construir estados explícitos de demonstração para uma encomenda já validada
 * pelo service transacional.
 */
import { randomUUID } from "node:crypto";
import {
    PAYMENT_MODE,
    PAYMENT_STATUS,
} from "../constants/domain.constants.js";

export const SIMULATED_PAYMENT_NOTICE =
    "Demonstração académica — não foi efetuada qualquer cobrança.";

/**
 * Cria o estado inicial de um checkout ainda não simulado.
 *
 * @returns {object} Estado persistível, sem qualquer referência externa.
 */
export function createAwaitingSimulationPayment() {
    return {
        mode: PAYMENT_MODE.SIMULATED,
        status: PAYMENT_STATUS.AWAITING_SIMULATION,
        simulationReference: null,
        simulatedAt: null,
        idempotencyKeyHash: null,
        message: "Pagamento por simular. Não será efetuada qualquer cobrança.",
    };
}

/**
 * Cria um resultado local de simulação bem-sucedida.
 *
 * @param {object} order - Encomenda validada dentro da transação.
 * @param {{now?: Date, randomId?: () => string}} [options] - Relógio e gerador injetáveis em testes.
 * @returns {object} Estado final da simulação.
 */
export function createSuccessfulSimulationPayment(
    order,
    { now = new Date(), randomId = randomUUID } = {},
) {
    return {
        mode: PAYMENT_MODE.SIMULATED,
        status: PAYMENT_STATUS.SIMULATED_PAID,
        simulationReference: `sim-${order._id.toString()}-${randomId()}`,
        simulatedAt: now,
        message: SIMULATED_PAYMENT_NOTICE,
    };
}

/**
 * Cria um resultado de falha local para testes e futuras regras académicas.
 * A falha nunca consome stock, voucher ou carrinho.
 *
 * @param {object} order - Encomenda validada.
 * @param {{now?: Date, randomId?: () => string}} [options] - Dependências determinísticas.
 * @returns {object} Estado final de simulação falhada.
 */
export function createFailedSimulationPayment(
    order,
    { now = new Date(), randomId = randomUUID } = {},
) {
    return {
        mode: PAYMENT_MODE.SIMULATED,
        status: PAYMENT_STATUS.SIMULATED_FAILED,
        simulationReference: `sim-${order._id.toString()}-${randomId()}`,
        simulatedAt: now,
        message: `Simulação não concluída. ${SIMULATED_PAYMENT_NOTICE}`,
    };
}
