/** Contrato estático do desbloqueio exclusivamente simulado do relatório. */
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const source = await readFile(
    new URL(
        "../src/features/consultation/ConsultationReportPage.jsx",
        import.meta.url,
    ),
    "utf8",
);

test("relatório apresenta a simulação e a criação do voucher sem gateway real", () => {
    assert.match(source, /createPaymentIdempotencyKey/);
    assert.match(source, /unlockConsultationReport/);
    assert.match(source, /Simulação de pagamento/);
    assert.match(source, /Simular pagamento e desbloquear/);
    assert.match(source, /consultation-payment__actions/);
    assert.match(source, /voucher simulado do mesmo valor/);
    assert.doesNotMatch(source, /Confirmar pagamento académico|checkoutUrl|gateway/i);
});

test("voucher e última visualização cosmética são retomados pelo GET do relatório", () => {
    assert.match(source, /report\.voucher/);
    assert.match(source, /report\.visualization/);
    assert.match(source, /getCosmeticVisualization/);
    assert.doesNotMatch(source, /localStorage|sessionStorage/);
});
