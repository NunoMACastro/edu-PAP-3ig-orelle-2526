/**
 * Testes unitários do contrato frontend de pagamento simulado.
 */
import assert from "node:assert/strict";
import test from "node:test";
import {
    assertSimulatedOrder,
    canSimulatePayment,
    createSimulationIdempotencyKey,
    getIdempotencyKeyAfterSimulationResponse,
    getSimulatedPaymentStatusLabel,
    SIMULATED_PAYMENT_NOTICE,
} from "../src/services/simulatedCheckout.js";

const ORDER_ID = "507f1f77bcf86cd799439011";
const UUID = "123e4567-e89b-42d3-a456-426614174000";
const NEXT_UUID = "223e4567-e89b-42d3-a456-426614174001";

/**
 * Constrói o DTO mínimo usado nos testes de contrato.
 *
 * @param {string} status - Estado de pagamento simulado.
 * @returns {object} Encomenda pública mínima.
 */
function createOrder(status) {
    return {
        id: ORDER_ID,
        payment: {
            mode: "simulated",
            status,
        },
    };
}

test("explica permanentemente que a confirmação não cria cobrança", () => {
    assert.equal(
        SIMULATED_PAYMENT_NOTICE,
        "Nenhum valor será cobrado. A confirmação regista a encomenda sem criar um movimento financeiro.",
    );
});

test("cria uma chave opaca aceite pelo boundary HTTP", () => {
    const key = createSimulationIdempotencyKey(ORDER_ID, () => UUID);

    assert.equal(key, `sim.${ORDER_ID}.${UUID}`);
    assert.match(key, /^[A-Za-z0-9._:-]{8,128}$/);
});

test("produz a mesma chave quando a tentativa reutiliza o mesmo valor seguro", () => {
    const first = createSimulationIdempotencyKey(ORDER_ID, () => UUID);
    const retry = createSimulationIdempotencyKey(ORDER_ID, () => UUID);

    assert.equal(retry, first);
});

test("abre uma chave nova apenas depois de uma falha terminal persistida", () => {
    const currentKey = createSimulationIdempotencyKey(ORDER_ID, () => UUID);
    const afterFailure = getIdempotencyKeyAfterSimulationResponse(
        createOrder("simulated_failed"),
        currentKey,
        () => NEXT_UUID,
    );
    const afterSuccess = getIdempotencyKeyAfterSimulationResponse(
        createOrder("simulated_paid"),
        currentKey,
        () => NEXT_UUID,
    );

    assert.equal(afterFailure, `sim.${ORDER_ID}.${NEXT_UUID}`);
    assert.notEqual(afterFailure, currentKey);
    assert.equal(afterSuccess, currentKey);
});

test("recusa criar chaves sem encomenda ou sem entropia segura", () => {
    assert.throws(
        () => createSimulationIdempotencyKey("", () => UUID),
        /identificar a encomenda/,
    );
    assert.throws(
        () => createSimulationIdempotencyKey(ORDER_ID, null),
        /gerador aleatório seguro/,
    );
});

test("aceita apenas o contrato público exclusivamente simulado", () => {
    for (const status of [
        "awaiting_simulation",
        "simulated_paid",
        "simulated_failed",
    ]) {
        const order = createOrder(status);
        assert.equal(assertSimulatedOrder(order), order);
    }

    assert.throws(
        () =>
            assertSimulatedOrder({
                id: ORDER_ID,
                payment: { mode: "invalid_mode", status: "simulated_paid" },
            }),
        /validar a encomenda/,
    );
    assert.throws(
        () => assertSimulatedOrder(createOrder("paid")),
        /validar a encomenda/,
    );
    assert.throws(
        () => assertSimulatedOrder({ payment: createOrder("simulated_paid") }),
        /validar a encomenda/,
    );
});

test("só permite simular estados recuperáveis", () => {
    assert.equal(canSimulatePayment(createOrder("awaiting_simulation")), true);
    assert.equal(canSimulatePayment(createOrder("simulated_failed")), true);
    assert.equal(canSimulatePayment(createOrder("simulated_paid")), false);
    assert.equal(canSimulatePayment(null), false);
});

test("traduz estados técnicos sem inventar um resultado", () => {
    assert.equal(getSimulatedPaymentStatusLabel("awaiting_simulation"), "Por confirmar");
    assert.equal(
        getSimulatedPaymentStatusLabel("simulated_paid"),
        "Encomenda confirmada",
    );
    assert.equal(
        getSimulatedPaymentStatusLabel("simulated_failed"),
        "Confirmação não concluída",
    );
    assert.equal(getSimulatedPaymentStatusLabel("unexpected"), "Estado indisponível");
});
