const BK_ID = "BK-MF8-16";
const REQUIRED_REQUIREMENTS = ["RNF28"];
const MINIMUM_NEGATIVE_SCENARIOS = 3;

const REQUIRED_PROOFS = [
    "proof_contrato",
    "proof_matriz",
    "proof_contrato_bk15",
    "proof_teste_final_bk15",
    "proof_smoke_bk15",
    "proof_contrato_bk16",
    "proof_teste_bk16",
    "proof_api",
    "proof_web_build",
    "proof_planificacao",
    "proof_diff",
    "proof_e2e",
    "proof_privacidade",
    "proof_handoff",
];

const REQUIRED_LAYERS = [
    "planificacao",
    "unit",
    "integration",
    "smoke",
    "build",
    "diff",
    "e2e",
    "privacy",
    "handoff",
];

const VALID_STATUSES = [
    "passou",
    "falhou_por_produto",
    "bloqueado_por_ambiente_ou_ferramenta",
];

const SENSITIVE_OUTPUT_PATTERNS = [
    "passwordHash",
    "Authorization:",
    "Set-Cookie",
    "storageKey",
    "consentId",
    "/Users/",
    "/var/",
];

/**
 * Valida a evidence final da execucao de testes da MF8.
 *
 * @function validarBKMF816Evidence
 * @param {object} evidence - Evidence recolhida durante a bateria final.
 * @param {{
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
 * }} evidence - Evidence recolhida durante a bateria final.
 * @returns {{ bkId: string, estado: string, dominio: string, proofs: number }} Resultado normalizado.
 * @throws {Error} Quando a evidence nao cobre requisitos, proofs, camadas, negativos ou handoff.
 */
export function validarBKMF816Evidence(evidence) {
    const requisitos = Array.isArray(evidence?.requisitos) ? evidence.requisitos : [];
    const proofs = Array.isArray(evidence?.proofs) ? evidence.proofs : [];
    const negativos = Array.isArray(evidence?.negativos) ? evidence.negativos : [];

    if (evidence?.bkId !== BK_ID) {
        throw new Error("Evidence associada ao BK errado.");
    }

    const missingRequirement = REQUIRED_REQUIREMENTS.find(
        (requirement) => !requisitos.includes(requirement),
    );

    if (missingRequirement) {
        throw new Error(`Evidence sem requisito obrigatorio: ${missingRequirement}.`);
    }

    const proofById = new Map(proofs.map((proof) => [proof.id, proof]));
    const missingProof = REQUIRED_PROOFS.find((proofId) => !proofById.has(proofId));

    if (missingProof) {
        throw new Error(`Evidence final sem proof obrigatorio: ${missingProof}.`);
    }

    const layers = new Set(proofs.map((proof) => proof.layer));
    const missingLayer = REQUIRED_LAYERS.find((layer) => !layers.has(layer));

    if (missingLayer) {
        throw new Error(`Evidence final sem camada obrigatoria: ${missingLayer}.`);
    }

    if (negativos.length < MINIMUM_NEGATIVE_SCENARIOS) {
        throw new Error("Cenarios negativos abaixo do minimo P0.");
    }

    const e2eProof = proofById.get("proof_e2e");

    if (
        e2eProof.command === "TODO (BLOCKER)" &&
        e2eProof.status !== "bloqueado_por_ambiente_ou_ferramenta"
    ) {
        throw new Error("proof_e2e sem comando real deve ficar bloqueado por ambiente ou ferramenta.");
    }

    for (const proof of proofs) {
        validateProof(proof);
    }

    if (evidence?.handoff?.nextBk !== "BK-MF8-17") {
        throw new Error("Handoff final deve apontar para BK-MF8-17.");
    }

    return {
        bkId: BK_ID,
        estado: "validado",
        dominio: "execucao final de testes",
        proofs: proofs.length,
    };
}

/**
 * Valida uma linha da evidence final.
 *
 * @param {object} proof - Linha de evidence de um comando executado ou bloqueado.
 * @param {{
 *   id: string,
 *   command: string,
 *   cwd: string,
 *   layer: string,
 *   exitCode: number,
 *   status: string,
 *   outputSummary: string,
 *   privacyCheck: string,
 *   impact: string
 * }} proof - Linha de evidence de um comando executado ou bloqueado.
 * @returns {void}
 * @throws {Error} Quando a linha esta incompleta, tem estado invalido ou expoe dados sensiveis.
 */
function validateProof(proof) {
    if (
        !proof.id ||
        !proof.command ||
        !proof.cwd ||
        !proof.layer ||
        !proof.outputSummary ||
        !proof.privacyCheck ||
        !proof.impact
    ) {
        throw new Error(`Proof incompleto: ${proof?.id ?? "sem-id"}.`);
    }

    if (!VALID_STATUSES.includes(proof.status)) {
        throw new Error(`Estado invalido no proof ${proof.id}: ${proof.status}.`);
    }

    if (!Number.isInteger(proof.exitCode)) {
        throw new Error(`Exit code invalido no proof ${proof.id}.`);
    }

    if (proof.status === "passou" && proof.exitCode !== 0) {
        throw new Error(`Proof ${proof.id} marcado como passou com exit code diferente de 0.`);
    }

    const leakedPattern = SENSITIVE_OUTPUT_PATTERNS.find((pattern) =>
        proof.outputSummary.includes(pattern),
    );

    if (leakedPattern) {
        throw new Error(`Output sensivel detetado no proof ${proof.id}: ${leakedPattern}.`);
    }
}
