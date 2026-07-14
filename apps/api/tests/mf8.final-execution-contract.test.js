import { describe, expect, it } from "vitest";
import { validarBKMF816Evidence } from "./evidence/bk-mf8-16.evidence-contract.js";

/**
 * Cria evidence valida da execucao final de testes do BK-MF8-16.
 *
 * @returns {{
 *   bkId: string,
 *   requisitos: string[],
 *   proofs: Array<{
 *     id: string,
 *     command: string,
 *     cwd: string,
 *     layer: string,
 *     exitCode: number,
 *     status: string,
 *     outputSummary: string,
 *     privacyCheck: string,
 *     impact: string
 *   }>,
 *   negativos: Array<{ id: string, expected: string, result: string, status: string }>,
 *   handoff: { nextBk: string, failures: string[], blockers: string[] }
 * }} Evidence final pronta para PR/defesa.
 */
function createValidEvidence() {
    const baseProof = {
        cwd: "raiz",
        exitCode: 0,
        status: "passou",
        outputSummary: "Comando executado sem dados sensiveis no resumo.",
        privacyCheck: "Sem passwords, tokens, cookies, imagens ou relatorios sensiveis.",
        impact: "Prova objetiva guardada para defesa.",
    };

    return {
        bkId: "BK-MF8-16",
        requisitos: ["RNF28"],
        proofs: [
            { ...baseProof, id: "proof_contrato", command: "rg -n RNF28 ...", layer: "planificacao" },
            { ...baseProof, id: "proof_matriz", command: "rg -n proof_api ...", layer: "planificacao" },
            {
                ...baseProof,
                id: "proof_contrato_bk15",
                command: "node --check real_dev/api/tests/evidence/bk-mf8-15.evidence-contract.js",
                layer: "unit",
            },
            {
                ...baseProof,
                id: "proof_teste_final_bk15",
                command: "npm --prefix real_dev/api test -- tests/mf8.final-contracts.test.js",
                layer: "unit",
            },
            {
                ...baseProof,
                id: "proof_smoke_bk15",
                command: "node real_dev/web/scripts/check-mf8-final-smoke.mjs",
                layer: "smoke",
            },
            {
                ...baseProof,
                id: "proof_contrato_bk16",
                command: "node --check real_dev/api/tests/evidence/bk-mf8-16.evidence-contract.js",
                layer: "unit",
            },
            {
                ...baseProof,
                id: "proof_teste_bk16",
                command: "npm --prefix real_dev/api test -- tests/mf8.final-execution-contract.test.js",
                layer: "unit",
            },
            { ...baseProof, id: "proof_api", command: "npm --prefix real_dev/api test", layer: "integration" },
            { ...baseProof, id: "proof_web_build", command: "npm --prefix real_dev/web run build", layer: "build" },
            { ...baseProof, id: "proof_planificacao", command: "bash scripts/validate-planificacao.sh", layer: "planificacao" },
            { ...baseProof, id: "proof_diff", command: "git diff --check", layer: "diff" },
            {
                ...baseProof,
                id: "proof_e2e",
                command: "TODO (BLOCKER)",
                layer: "e2e",
                exitCode: 1,
                status: "bloqueado_por_ambiente_ou_ferramenta",
                outputSummary: "Sem comando E2E/browser aprovado em real_dev/web/package.json.",
                impact: "Bloqueio explicito para nao fingir cobertura browser.",
            },
            {
                ...baseProof,
                id: "proof_privacidade",
                command: "rg -n padroes sensiveis docs/evidence/MF8/EXECUCAO-FINAL-TESTES.md",
                layer: "privacy",
                outputSummary: "Sem padroes sensiveis na evidence final.",
                impact: "Prova que os outputs anexados nao expoem dados sensiveis.",
            },
            {
                ...baseProof,
                id: "proof_handoff",
                command: "rg -n Falhas/Handoff docs/evidence/MF8/EXECUCAO-FINAL-TESTES.md",
                layer: "handoff",
                impact: "Prova que o BK-MF8-17 recebe falhas e bloqueios triados.",
            },
        ],
        negativos: [
            {
                id: "neg_comando_inexistente",
                expected: "Comando inexistente fica bloqueado.",
                result: "Estado bloqueado registado.",
                status: "passou",
            },
            {
                id: "neg_falha_sem_output",
                expected: "Falha sem output e repetida uma vez.",
                result: "Repeticao documentada.",
                status: "passou",
            },
            {
                id: "neg_e2e_sem_runner",
                expected: "E2E sem runner fica TODO (BLOCKER).",
                result: "Bloqueio documentado.",
                status: "passou",
            },
        ],
        handoff: {
            nextBk: "BK-MF8-17",
            failures: [],
            blockers: ["proof_e2e"],
        },
    };
}

describe("BK-MF8-16 / RNF28 - execucao final com evidencias", () => {
    it("valida evidence final completa com E2E bloqueado de forma honesta", () => {
        expect(validarBKMF816Evidence(createValidEvidence())).toEqual({
            bkId: "BK-MF8-16",
            estado: "validado",
            dominio: "execucao final de testes",
            proofs: 14,
        });
    });

    it("falha quando falta proof_e2e", () => {
        const evidence = createValidEvidence();
        evidence.proofs = evidence.proofs.filter((proof) => proof.id !== "proof_e2e");

        expect(() => validarBKMF816Evidence(evidence)).toThrow("proof_e2e");
    });

    it("falha quando proof_e2e sem comando real fica marcado como sucesso", () => {
        const evidence = createValidEvidence();
        const e2eProof = evidence.proofs.find((proof) => proof.id === "proof_e2e");
        e2eProof.status = "passou";

        expect(() => validarBKMF816Evidence(evidence)).toThrow("proof_e2e sem comando real");
    });

    it("falha quando o output resumido expoe dados sensiveis", () => {
        const evidence = createValidEvidence();
        const apiProof = evidence.proofs.find((proof) => proof.id === "proof_api");
        apiProof.outputSummary = "Falha devolveu passwordHash no output.";

        expect(() => validarBKMF816Evidence(evidence)).toThrow("Output sensivel");
    });

    it("falha quando o handoff nao aponta para BK-MF8-17", () => {
        const evidence = createValidEvidence();
        evidence.handoff.nextBk = "BK-MF8-18";

        expect(() => validarBKMF816Evidence(evidence)).toThrow("BK-MF8-17");
    });
});
