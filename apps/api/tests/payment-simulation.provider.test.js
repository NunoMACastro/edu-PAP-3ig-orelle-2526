/**
 * Contratos puros do provider académico de pagamento simulado.
 *
 * Estes testes falham se o módulo voltar a introduzir I/O de rede ou campos
 * próprios de um gateway, mantendo a decisão de escopo executável.
 */
import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";
import {
    createAwaitingSimulationPayment,
    createFailedSimulationPayment,
    createSuccessfulSimulationPayment,
} from "../src/providers/payment.provider.js";
import { toOrderResponse } from "../src/services/order.service.js";
import {
    validateCheckoutPayload,
    validatePaymentIdempotencyKey,
} from "../src/validators/checkout.validator.js";

const order = {
    _id: {
        toString: () => "66c000000000000000000901",
    },
};

describe("provider de pagamento exclusivamente simulado", () => {
    it("cria checkout pendente com o contrato público mínimo", () => {
        const payment = createAwaitingSimulationPayment();

        expect(payment).toMatchObject({
            mode: "simulated",
            status: "awaiting_simulation",
            simulationReference: null,
            simulatedAt: null,
        });
        expect(payment.message).toContain("Não será efetuada qualquer cobrança");
        expect(Object.keys(payment).sort()).toEqual(
            [
                "idempotencyKeyHash",
                "message",
                "mode",
                "simulatedAt",
                "simulationReference",
                "status",
            ].sort(),
        );
    });

    it("produz sucesso determinístico e inequivocamente académico", () => {
        const now = new Date("2026-07-09T12:00:00.000Z");
        const payment = createSuccessfulSimulationPayment(order, {
            now,
            randomId: () => "fixed-reference",
        });

        expect(payment).toEqual({
            mode: "simulated",
            status: "simulated_paid",
            simulationReference:
                "sim-66c000000000000000000901-fixed-reference",
            simulatedAt: now,
            message:
                "Demonstração académica — não foi efetuada qualquer cobrança.",
        });
    });

    it("representa falha sem sugerir uma cobrança real", () => {
        const payment = createFailedSimulationPayment(order, {
            now: new Date("2026-07-09T12:00:00.000Z"),
            randomId: () => "failed-reference",
        });

        expect(payment.status).toBe("simulated_failed");
        expect(payment.mode).toBe("simulated");
        expect(payment.message).toContain("não foi efetuada qualquer cobrança");
    });

    it("não contém cliente HTTP nem URL de saída", async () => {
        const source = await readFile(
            new URL("../src/providers/payment.provider.js", import.meta.url),
            "utf8",
        );
        const urlScheme = ["https", "://"].join("");

        expect(source).not.toMatch(/\bfetch\s*\(/);
        expect(source).not.toContain(urlScheme);
    });

    it("recusa qualquer seleção de método ou total no checkout", () => {
        expect(validateCheckoutPayload({})).toEqual({});
        expect(() => validateCheckoutPayload({ method: "external" })).toThrow(
            "O checkout não aceita método, preço ou dados de pagamento.",
        );
        expect(() => validateCheckoutPayload({ totalCents: 1 })).toThrow(
            "O checkout não aceita método, preço ou dados de pagamento.",
        );
    });

    it("exige uma Idempotency-Key limitada e segura", () => {
        expect(
            validatePaymentIdempotencyKey({
                "idempotency-key": "checkout.attempt-2026_07_09",
            }),
        ).toBe("checkout.attempt-2026_07_09");
        expect(() => validatePaymentIdempotencyKey({})).toThrow(
            "Idempotency-Key",
        );
        expect(() =>
            validatePaymentIdempotencyKey({
                "idempotency-key": "unsafe key with spaces",
            }),
        ).toThrow("Idempotency-Key");
    });

    it("remove o hash interno do DTO público", () => {
        const response = toOrderResponse({
            _id: order._id,
            items: [
                {
                    productId: order._id,
                    name: "Produto académico",
                    unitPriceCents: 100,
                    quantity: 1,
                    lineTotalCents: 100,
                },
            ],
            subtotalCents: 100,
            discountCents: 0,
            totalCents: 100,
            voucher: null,
            status: "pendente",
            payment: {
                ...createSuccessfulSimulationPayment(order, {
                    randomId: () => "public-contract",
                }),
                idempotencyKeyHash: "never-public",
            },
            stockReserved: true,
        });

        expect(Object.keys(response.payment).sort()).toEqual(
            [
                "message",
                "mode",
                "simulatedAt",
                "simulationReference",
                "status",
            ].sort(),
        );
        expect(JSON.stringify(response)).not.toContain("never-public");
    });
});
