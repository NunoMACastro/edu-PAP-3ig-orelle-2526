import { describe, expect, it } from "vitest";
import { validarBKMF817Evidence } from "./evidence/bk-mf8-17.evidence-contract.js";

/**
 * Cria evidence terminal valida para o BK-MF8-17 quando a bateria final nao
 * encontrou falhas de produto e manteve apenas o blocker E2E.
 *
 * @returns {{
 *   bkId: string,
 *   requisitos: string[],
 *   sourceEvidence: string,
 *   finalEvidence: string,
 *   finalStatus: string,
 *   corrections: object[],
 *   blockers: object[],
 *   proofs: object[],
 *   negativos: object[],
 *   privacyReview: { passed: boolean, notes: string[] },
 *   closure: { nextBk: string, decision: string, remainingRisks: string[] }
 * }} Evidence pronta para validar RNF29.
 */
function createValidEvidence() {
    const baseProof = {
        status: "passou",
        exitCode: 0,
        summary: "Comando executado com resumo seguro.",
        privacyCheck: "Sem passwords, tokens, cookies, imagens ou relatorios sensiveis.",
    };

    return {
        bkId: "BK-MF8-17",
        requisitos: ["RNF29"],
        sourceEvidence: "docs/evidence/MF8/EXECUCAO-FINAL-TESTES.md",
        finalEvidence: "docs/evidence/MF8/CORRECOES-FINAIS.md",
        finalStatus: "sem_falhas_de_produto",
        corrections: [],
        blockers: [
            {
                blockerId: "BLK-MF8-17-E2E",
                sourceProof: "proof_e2e",
                type: "bloqueado_por_ambiente_ou_ferramenta",
                reason: "Sem comando E2E/browser aprovado em real_dev/web/package.json.",
                impact: "Cobertura P0 sem browser real.",
                nextAction: "Aprovar runner E2E ou manter blocker explicito na defesa.",
            },
        ],
        proofs: [
            {
                ...baseProof,
                id: "proof_relatorio_final",
                command: "rg -n RNF29 docs/RNF.md",
            },
            {
                ...baseProof,
                id: "proof_matriz_falhas",
                command: "rg -n falhou_por_produto docs/evidence/MF8/EXECUCAO-FINAL-TESTES.md",
            },
            {
                ...baseProof,
                id: "proof_correcao_final",
                command: "rg -n BK-MF8-17 docs/evidence/MF8/CORRECOES-FINAIS.md",
            },
            {
                ...baseProof,
                id: "proof_reexecucao_afetada",
                command: "npm --prefix real_dev/api test -- tests/mf8.final-fixes-contract.test.js",
            },
            {
                ...baseProof,
                id: "proof_api",
                command: "npm --prefix real_dev/api test",
            },
            {
                ...baseProof,
                id: "proof_web_build",
                command: "npm --prefix real_dev/web run build",
            },
            {
                ...baseProof,
                id: "proof_planificacao",
                command: "bash scripts/validate-planificacao.sh",
            },
            {
                ...baseProof,
                id: "proof_diff",
                command: "git diff --check",
            },
            {
                ...baseProof,
                id: "proof_e2e",
                command: "TODO (BLOCKER)",
                status: "bloqueado_por_ambiente_ou_ferramenta",
                exitCode: 1,
                summary: "Sem comando E2E/browser aprovado.",
            },
            {
                ...baseProof,
                id: "proof_privacidade",
                command: "rg -n padroes sensiveis docs/evidence/MF8/CORRECOES-FINAIS.md",
            },
            {
                ...baseProof,
                id: "proof_fecho_mf8",
                command: "rg -n 'proximo_bk' docs/planificacao/backlogs/MATRIZ-CANONICA-BK.md",
            },
        ],
        negativos: [
            {
                id: "neg_correcao_sem_teste_afetado",
                expected: "Correcao real sem teste afetado deve falhar.",
                result: "Contrato rejeita affectedTests vazio.",
                status: "passou",
            },
            {
                id: "neg_e2e_sem_runner",
                expected: "E2E sem runner nao pode ser sucesso.",
                result: "Contrato exige bloqueio ambiental.",
                status: "passou",
            },
            {
                id: "neg_output_sensivel",
                expected: "Output com cookies ou tokens deve falhar.",
                result: "Contrato rejeita marcadores sensiveis.",
                status: "passou",
            },
            {
                id: "neg_fecho_terminal",
                expected: "BK terminal nao pode apontar para proximo BK.",
                result: "Contrato exige nextBk igual a '-'.",
                status: "passou",
            },
        ],
        privacyReview: {
            passed: true,
            notes: ["Outputs resumidos e sem dados sensiveis."],
        },
        closure: {
            nextBk: "-",
            decision: "MF8 fechada com blocker E2E explicito.",
            remainingRisks: ["Browser E2E depende de runner aprovado."],
        },
    };
}

describe("BK-MF8-17 / RNF29 - correcao final e reexecucao afetada", () => {
    it("valida evidence terminal sem falhas de produto e com blocker E2E honesto", () => {
        expect(validarBKMF817Evidence(createValidEvidence())).toEqual({
            bkId: "BK-MF8-17",
            estado: "validado",
            dominio: "correcoes finais mf8",
            proofs: 11,
        });
    });

    it("falha quando uma correcao de produto nao tem teste afetado", () => {
        const evidence = createValidEvidence();
        evidence.finalStatus = "corrigido_revalidado";
        evidence.corrections = [
            {
                errorId: "ERR-MF8-17-001",
                sourceProof: "proof_api",
                rootCause: "Falha real de produto.",
                changedFiles: ["real_dev/api/src/example.js"],
                affectedTests: [],
                before: {
                    command: "npm --prefix real_dev/api test -- tests/example.test.js",
                    exitCode: 1,
                    summary: "Teste falhou antes.",
                },
                after: {
                    command: "npm --prefix real_dev/api test -- tests/example.test.js",
                    exitCode: 0,
                    summary: "Teste passou depois.",
                },
            },
        ];

        // Este negativo impede fechar RNF29 com uma correcao sem prova afetada.
        expect(() => validarBKMF817Evidence(evidence)).toThrow("sem teste afetado");
    });

    it("falha quando proof_e2e sem comando real fica marcado como sucesso", () => {
        const evidence = createValidEvidence();
        const e2eProof = evidence.proofs.find((proof) => proof.id === "proof_e2e");
        e2eProof.status = "passou";

        // Sem runner browser aprovado, sucesso E2E seria uma prova artificial.
        expect(() => validarBKMF817Evidence(evidence)).toThrow("proof_e2e sem comando real");
    });

    it("falha quando output resumido expoe dados sensiveis", () => {
        const evidence = createValidEvidence();
        const apiProof = evidence.proofs.find((proof) => proof.id === "proof_api");
        apiProof.summary = "Set-Cookie: orelle_session=valor";

        expect(() => validarBKMF817Evidence(evidence)).toThrow("Evidence sensivel");
    });

    it("falha quando o fecho aponta para outro BK", () => {
        const evidence = createValidEvidence();
        evidence.closure.nextBk = "BK-MF9-01";

        expect(() => validarBKMF817Evidence(evidence)).toThrow("sem proximo BK");
    });
});
