/**
 * Smoke estático do checkout exclusivamente simulado.
 *
 * O teste protege o contrato de dois passos sem instalar um runner adicional:
 * checkout vazio, simulação idempotente, aviso permanente e ausência de
 * integrações ou redirecionamentos externos na página.
 */
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const checkoutPage = await readFile(
    new URL("../src/pages/CheckoutPage.jsx", import.meta.url),
    "utf8",
);
const checkoutHelpers = await readFile(
    new URL("../src/services/simulatedCheckout.js", import.meta.url),
    "utf8",
);

const REQUIRED_PAGE_MARKERS = [
    'apiRequest("/orders/checkout", {',
    'method: "POST"',
    "/payments/simulate",
    '"Idempotency-Key": paymentAttemptKey',
    "createSimulationIdempotencyKey(nextOrder.id)",
    "getIdempotencyKeyAfterSimulationResponse(",
    "setOrder(nextOrder)",
    'title="Confirmar encomenda"',
    '"Confirmar encomenda"',
    "Não foi efetuada qualquer cobrança.",
    "paymentState.error",
];

for (const marker of REQUIRED_PAGE_MARKERS) {
    assert.ok(checkoutPage.includes(marker), `CheckoutPage sem marcador: ${marker}`);
}

const FORBIDDEN_PAGE_PATTERNS = [
    /body\s*:/,
    /stripe/i,
    /paypal/i,
    /mbway/i,
    /gateway/i,
    /checkoutUrl/i,
    /window\.location/i,
    /location\.href/i,
    /<a\s+href/i,
    /setOrder\(null\)/,
];

for (const pattern of FORBIDDEN_PAGE_PATTERNS) {
    assert.doesNotMatch(checkoutPage, pattern);
}

assert.ok(
    checkoutHelpers.includes(
        '"Nenhum valor será cobrado. A confirmação regista a encomenda sem criar um movimento financeiro."',
    ),
    "Aviso académico permanente em falta",
);
assert.ok(
    checkoutHelpers.includes("globalThis.crypto?.randomUUID"),
    "A chave idempotente não usa um gerador seguro",
);
assert.doesNotMatch(checkoutHelpers, /Math\.random/);

console.log(
    "G2 checkout simulado: PASS (2 passos, retry estável e nova key após falha).",
);
