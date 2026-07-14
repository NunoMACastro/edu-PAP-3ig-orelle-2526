const BK_ID = "BK-MF8-17";
const REQUIRED_REQUIREMENTS = ["RNF29"];
const SOURCE_EVIDENCE = "docs/evidence/MF8/EXECUCAO-FINAL-TESTES.md";
const FINAL_EVIDENCE = "docs/evidence/MF8/CORRECOES-FINAIS.md";
const MINIMUM_NEGATIVE_SCENARIOS = 3;

const VALID_FINAL_STATUSES = [
    "corrigido_revalidado",
    "bloqueado_por_ambiente_ou_ferramenta",
    "bloqueado_por_contrato",
    "sem_falhas_de_produto",
];

const REQUIRED_PROOFS = [
    "proof_relatorio_final",
    "proof_matriz_falhas",
    "proof_correcao_final",
    "proof_reexecucao_afetada",
    "proof_api",
    "proof_web_build",
    "proof_planificacao",
    "proof_diff",
    "proof_e2e",
    "proof_privacidade",
    "proof_fecho_mf8",
];

const VALID_PROOF_STATUSES = [
    "passou",
    "corrigido_revalidado",
    "sem_falhas_de_produto",
    "bloqueado_por_ambiente_ou_ferramenta",
    "bloqueado_por_contrato",
];

const VALID_BLOCKER_TYPES = [
    "bloqueado_por_ambiente_ou_ferramenta",
    "bloqueado_por_contrato",
];

const SENSITIVE_OUTPUT_PATTERNS = [
    /passwordHash/i,
    /Set-Cookie/i,
    /Authorization/i,
    /Bearer\s+[A-Za-z0-9._-]+/i,
    /storageKey/i,
    /consentId/i,
    /\/Users\//i,
    /\/var\//i,
];

/**
 * Valida a evidence terminal do BK-MF8-17/RNF29.
 *
 * @function validarBKMF817Evidence
 * @param {object} evidence - Evidence recolhida durante a correcao final e fecho da MF8.
 * @param {{
 *   bkId: string,
 *   requisitos: string[],
 *   sourceEvidence: string,
 *   finalEvidence: string,
 *   finalStatus: string,
 *   corrections: Array<{
 *     errorId: string,
 *     sourceProof: string,
 *     rootCause: string,
 *     changedFiles: string[],
 *     affectedTests: string[],
 *     before: { command: string, exitCode: number, summary: string },
 *     after: { command: string, exitCode: number, summary: string }
 *   }>,
 *   blockers: Array<{
 *     blockerId: string,
 *     sourceProof: string,
 *     type: string,
 *     reason: string,
 *     impact: string,
 *     nextAction: string
 *   }>,
 *   proofs: Array<{
 *     id: string,
 *     command: string,
 *     status: string,
 *     exitCode: number,
 *     summary: string,
 *     privacyCheck: string
 *   }>,
 *   negativos: Array<{ id: string, expected: string, result: string, status: string }>,
 *   privacyReview: { passed: boolean, notes: string[] },
 *   closure: { nextBk: string, decision: string, remainingRisks: string[] }
 * }} evidence - Evidence recolhida durante a correcao final e fecho da MF8.
 * @returns {{ bkId: string, estado: string, dominio: string, proofs: number }} Resultado normalizado.
 * @throws {Error} Quando a evidence nao prova RNF29 com seguranca e terminalidade.
 */
export function validarBKMF817Evidence(evidence) {
    const requisitos = Array.isArray(evidence?.requisitos) ? evidence.requisitos : [];
    const corrections = Array.isArray(evidence?.corrections) ? evidence.corrections : [];
    const blockers = Array.isArray(evidence?.blockers) ? evidence.blockers : [];
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

    if (evidence.sourceEvidence !== SOURCE_EVIDENCE || evidence.finalEvidence !== FINAL_EVIDENCE) {
        throw new Error("Evidence final sem ligacao aos ficheiros esperados.");
    }

    if (!VALID_FINAL_STATUSES.includes(evidence.finalStatus)) {
        throw new Error(`Estado final invalido: ${evidence.finalStatus}.`);
    }

    const proofById = new Map(proofs.map((proof) => [proof.id, proof]));
    const missingProof = REQUIRED_PROOFS.find((proofId) => !proofById.has(proofId));

    if (missingProof) {
        throw new Error(`Evidence final sem proof obrigatorio: ${missingProof}.`);
    }

    if (negativos.length < MINIMUM_NEGATIVE_SCENARIOS) {
        throw new Error("Cenarios negativos abaixo do minimo P0.");
    }

    const e2eProof = proofById.get("proof_e2e");

    // Sem runner aprovado, o E2E deve ficar bloqueado para evitar uma falsa prova P0.
    if (
        e2eProof.command === "TODO (BLOCKER)" &&
        e2eProof.status !== "bloqueado_por_ambiente_ou_ferramenta"
    ) {
        throw new Error("proof_e2e sem comando real deve ficar bloqueado.");
    }

    corrections.forEach(validateCorrection);
    blockers.forEach(validateBlocker);
    proofs.forEach(validateProof);
    negativos.forEach(validateNegativeScenario);

    if (evidence.finalStatus === "corrigido_revalidado" && corrections.length === 0) {
        throw new Error("Estado corrigido sem correcoes registadas.");
    }

    if (evidence.finalStatus === "sem_falhas_de_produto" && corrections.length > 0) {
        throw new Error("Estado sem falhas nao pode ter correcoes de produto.");
    }

    if (evidence.privacyReview?.passed !== true) {
        throw new Error("Evidence final sem revisao de privacidade aprovada.");
    }

    if (evidence.closure?.nextBk !== "-") {
        throw new Error("BK-MF8-17 deve fechar a MF8 sem proximo BK.");
    }

    assertSafeText(evidence.closure?.decision, "closure.decision");
    for (const risk of evidence.closure?.remainingRisks ?? []) {
        assertSafeText(risk, "closure.remainingRisks");
    }

    return {
        bkId: BK_ID,
        estado: "validado",
        dominio: "correcoes finais mf8",
        proofs: proofs.length,
    };
}

/**
 * Valida uma correcao real de produto.
 *
 * @param {object} correction - Registo de causa raiz e reexecucao afetada.
 * @param {{
 *   errorId: string,
 *   sourceProof: string,
 *   rootCause: string,
 *   changedFiles: string[],
 *   affectedTests: string[],
 *   before: { command: string, exitCode: number, summary: string },
 *   after: { command: string, exitCode: number, summary: string }
 * }} correction - Registo de causa raiz e reexecucao afetada.
 * @returns {void}
 * @throws {Error} Quando a correcao nao tem teste afetado ou before/after valido.
 */
function validateCorrection(correction) {
    if (!correction?.errorId || !correction?.sourceProof || !correction?.rootCause) {
        throw new Error("Correcao sem erro, prova de origem ou causa raiz.");
    }

    if (!Array.isArray(correction.changedFiles) || correction.changedFiles.length === 0) {
        throw new Error(`Correcao ${correction.errorId} sem ficheiros editados.`);
    }

    if (!Array.isArray(correction.affectedTests) || correction.affectedTests.length === 0) {
        throw new Error(`Correcao ${correction.errorId} sem teste afetado.`);
    }

    // O BK17 prova estabilizacao com o mesmo teste a falhar antes e passar depois.
    if (correction.before?.exitCode === 0 || correction.after?.exitCode !== 0) {
        throw new Error(`Correcao ${correction.errorId} sem before/after valido.`);
    }

    assertSafeText(correction.rootCause, `rootCause:${correction.errorId}`);
    assertSafeText(correction.before?.summary, `before:${correction.errorId}`);
    assertSafeText(correction.after?.summary, `after:${correction.errorId}`);
}

/**
 * Valida que um bloqueio ficou separado das correcoes de produto.
 *
 * @param {object} blocker - Bloqueio herdado ou encontrado durante o fecho.
 * @param {{
 *   blockerId: string,
 *   sourceProof: string,
 *   type: string,
 *   reason: string,
 *   impact: string,
 *   nextAction: string
 * }} blocker - Bloqueio herdado ou encontrado durante o fecho.
 * @returns {void}
 * @throws {Error} Quando o bloqueio nao tem campos minimos ou tipo valido.
 */
function validateBlocker(blocker) {
    if (
        !blocker?.blockerId ||
        !blocker?.sourceProof ||
        !blocker?.type ||
        !blocker?.reason ||
        !blocker?.impact ||
        !blocker?.nextAction
    ) {
        throw new Error("Bloqueio sem campos minimos.");
    }

    if (!VALID_BLOCKER_TYPES.includes(blocker.type)) {
        throw new Error(`Tipo de bloqueio invalido: ${blocker.type}.`);
    }

    assertSafeText(blocker.reason, `blockerReason:${blocker.blockerId}`);
    assertSafeText(blocker.impact, `blockerImpact:${blocker.blockerId}`);
    assertSafeText(blocker.nextAction, `blockerNextAction:${blocker.blockerId}`);
}

/**
 * Valida uma prova de comando ou gate final.
 *
 * @param {object} proof - Prova resumida para defesa.
 * @param {{
 *   id: string,
 *   command: string,
 *   status: string,
 *   exitCode: number,
 *   summary: string,
 *   privacyCheck: string
 * }} proof - Prova resumida para defesa.
 * @returns {void}
 * @throws {Error} Quando a prova esta incompleta, incoerente ou insegura.
 */
function validateProof(proof) {
    if (
        !proof?.id ||
        !proof?.command ||
        !proof?.status ||
        !Number.isInteger(proof?.exitCode) ||
        !proof?.summary ||
        !proof?.privacyCheck
    ) {
        throw new Error(`Proof incompleto: ${proof?.id ?? "sem-id"}.`);
    }

    if (!VALID_PROOF_STATUSES.includes(proof.status)) {
        throw new Error(`Estado invalido no proof ${proof.id}: ${proof.status}.`);
    }

    if (proof.status === "passou" && proof.exitCode !== 0) {
        throw new Error(`Proof ${proof.id} marcado como passou com exit code diferente de 0.`);
    }

    assertSafeText(proof.summary, `proofSummary:${proof.id}`);
    assertSafeText(proof.privacyCheck, `proofPrivacy:${proof.id}`);
}

/**
 * Valida um negativo minimo P0.
 *
 * @param {{ id: string, expected: string, result: string, status: string }} scenario - Cenario negativo.
 * @returns {void}
 * @throws {Error} Quando o negativo esta incompleto ou nao passou.
 */
function validateNegativeScenario(scenario) {
    if (!scenario?.id || !scenario?.expected || !scenario?.result || scenario?.status !== "passou") {
        throw new Error(`Cenario negativo invalido: ${scenario?.id ?? "sem-id"}.`);
    }

    assertSafeText(scenario.expected, `negativeExpected:${scenario.id}`);
    assertSafeText(scenario.result, `negativeResult:${scenario.id}`);
}

/**
 * Confirma que o texto resumido da evidence nao contem segredos ou paths internos.
 *
 * @param {string} value - Texto a validar.
 * @param {string} fieldName - Campo usado para diagnostico.
 * @returns {void}
 * @throws {Error} Quando o texto contem um marcador sensivel.
 */
function assertSafeText(value, fieldName) {
    const text = String(value ?? "");
    const leakedPattern = SENSITIVE_OUTPUT_PATTERNS.find((pattern) => pattern.test(text));

    if (leakedPattern) {
        throw new Error(`Evidence sensivel em ${fieldName}.`);
    }
}
