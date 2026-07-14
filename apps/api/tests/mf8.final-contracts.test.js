import { describe, expect, it } from "vitest";
import { validarBKMF815Matrix } from "./evidence/bk-mf8-15.evidence-contract.js";

/**
 * Cria uma matriz valida de testes/lacunas para o BK-MF8-15.
 *
 * @returns {{
 *   bkId: string,
 *   requisitos: string[],
 *   rows: Array<{
 *     proofId: string,
 *     bkRef: string,
 *     layer: string,
 *     command: string,
 *     status: string,
 *     gap: string,
 *     negativeScenario: string,
 *     risk: string,
 *     handoff: string
 *   }>,
 *   negativos: Array<{ id: string, expected: string, result: string, status: string }>
 * }} Matriz pronta para validar o handoff para BK-MF8-16.
 */
function createValidMatrix() {
    const baseRow = {
        gap: "Sem lacuna confirmada.",
        negativeScenario: "Falha controlada documentada.",
        risk: "Fecho final sem evidencia suficiente.",
        handoff: "BK-MF8-16 deve executar e anexar output.",
    };

    return {
        bkId: "BK-MF8-15",
        requisitos: ["RNF27"],
        rows: [
            {
                ...baseRow,
                proofId: "proof_test_env",
                bkRef: "BK-MF8-03 / RNF22",
                layer: "unit",
                command: "npm --prefix real_dev/api test -- tests/mf8.test-env.contract.test.js",
                status: "preparado",
            },
            {
                ...baseRow,
                proofId: "proof_mockup_alignment",
                bkRef: "BK-MF8-14 / RNF26",
                layer: "smoke",
                command: "node real_dev/web/scripts/check-mf8-mockup-alignment.mjs",
                status: "preparado",
            },
            {
                ...baseRow,
                proofId: "proof_mockup_evidence",
                bkRef: "BK-MF8-14 / RNF26",
                layer: "unit",
                command: "node --check real_dev/api/tests/evidence/bk-mf8-14.evidence-contract.js",
                status: "preparado",
            },
            {
                ...baseRow,
                proofId: "proof_final_contract",
                bkRef: "BK-MF8-15 / RNF27",
                layer: "unit",
                command: "npm --prefix real_dev/api test -- tests/mf8.final-contracts.test.js",
                status: "criado_neste_bk",
            },
            {
                ...baseRow,
                proofId: "proof_mf8_smoke",
                bkRef: "BK-MF8-15 / RNF27",
                layer: "smoke",
                command: "node real_dev/web/scripts/check-mf8-final-smoke.mjs",
                status: "criado_neste_bk",
            },
            {
                ...baseRow,
                proofId: "proof_api",
                bkRef: "MF0-MF8",
                layer: "integration",
                command: "npm --prefix real_dev/api test",
                status: "executavel",
            },
            {
                ...baseRow,
                proofId: "proof_web_build",
                bkRef: "MF0-MF8",
                layer: "build",
                command: "npm --prefix real_dev/web run build",
                status: "executavel",
            },
            {
                ...baseRow,
                proofId: "proof_e2e",
                bkRef: "MF8 / P0",
                layer: "e2e",
                command: "TODO (BLOCKER)",
                status: "lacuna_controlada",
                gap: "Sem comando E2E/browser aprovado em real_dev/web/package.json.",
                negativeScenario: "Marcar E2E como passou sem runner deve falhar.",
                risk: "Cobertura P0 incompleta se o professor exigir browser real.",
                handoff: "BK-MF8-16 mantem blocker ou substitui por comando aprovado.",
            },
        ],
        negativos: [
            {
                id: "neg_sem_proof_e2e",
                expected: "Matriz sem proof_e2e falha.",
                result: "Contrato rejeita proof em falta.",
                status: "passou",
            },
            {
                id: "neg_sem_negativos_minimos",
                expected: "Menos de 3 negativos falha.",
                result: "Contrato rejeita matriz incompleta.",
                status: "passou",
            },
            {
                id: "neg_output_sensivel",
                expected: "Conteudo sensivel falha.",
                result: "Contrato rejeita padrao sensivel.",
                status: "passou",
            },
        ],
    };
}

describe("BK-MF8-15 / RNF27 - matriz final de testes", () => {
    it("valida matriz completa com lacuna E2E controlada", () => {
        expect(validarBKMF815Matrix(createValidMatrix())).toEqual({
            bkId: "BK-MF8-15",
            estado: "validado",
            dominio: "matriz final de testes",
            proofs: 8,
        });
    });

    it("falha quando falta proof_e2e", () => {
        const matrix = createValidMatrix();
        matrix.rows = matrix.rows.filter((row) => row.proofId !== "proof_e2e");

        expect(() => validarBKMF815Matrix(matrix)).toThrow("proof_e2e");
    });

    it("falha quando proof_e2e sem runner aprovado fica como sucesso", () => {
        const matrix = createValidMatrix();
        const e2eRow = matrix.rows.find((row) => row.proofId === "proof_e2e");
        e2eRow.status = "passou";

        expect(() => validarBKMF815Matrix(matrix)).toThrow("proof_e2e sem runner");
    });

    it("falha quando ha menos de tres negativos P0", () => {
        const matrix = createValidMatrix();
        matrix.negativos = matrix.negativos.slice(0, 2);

        expect(() => validarBKMF815Matrix(matrix)).toThrow("Cenarios negativos");
    });

    it("falha quando uma linha expoe conteudo sensivel", () => {
        const matrix = createValidMatrix();
        const apiRow = matrix.rows.find((row) => row.proofId === "proof_api");
        apiRow.risk = "Output mostrou passwordHash no resumo.";

        expect(() => validarBKMF815Matrix(matrix)).toThrow("Conteudo sensivel");
    });
});
