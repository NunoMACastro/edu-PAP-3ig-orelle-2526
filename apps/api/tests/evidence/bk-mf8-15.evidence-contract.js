const BK_ID = "BK-MF8-15";
const REQUIRED_REQUIREMENTS = ["RNF27"];
const MINIMUM_NEGATIVE_SCENARIOS = 3;

const REQUIRED_PROOFS = [
    "proof_test_env",
    "proof_mockup_alignment",
    "proof_mockup_evidence",
    "proof_final_contract",
    "proof_mf8_smoke",
    "proof_api",
    "proof_web_build",
    "proof_e2e",
];

const REQUIRED_LAYERS = ["unit", "integration", "smoke", "build", "e2e"];

const VALID_STATUSES = [
    "preparado",
    "criado_neste_bk",
    "executavel",
    "lacuna_controlada",
    "passou",
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
 * Valida a matriz de testes e lacunas que prepara a bateria final da MF8.
 *
 * @function validarBKMF815Matrix
 * @param {object} matrix - Matriz criada em `docs/evidence/MF8/TESTES-ATUAIS-E-LACUNAS.md`.
 * @param {{
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
 * }} matrix - Matriz criada em `docs/evidence/MF8/TESTES-ATUAIS-E-LACUNAS.md`.
 * @returns {{ bkId: string, estado: string, dominio: string, proofs: number }} Resultado normalizado.
 * @throws {Error} Quando a matriz nao cobre requisito, proofs, camadas, negativos ou lacuna E2E.
 */
export function validarBKMF815Matrix(matrix) {
    const requisitos = Array.isArray(matrix?.requisitos) ? matrix.requisitos : [];
    const rows = Array.isArray(matrix?.rows) ? matrix.rows : [];
    const negativos = Array.isArray(matrix?.negativos) ? matrix.negativos : [];

    if (matrix?.bkId !== BK_ID) {
        throw new Error("Matriz associada ao BK errado.");
    }

    const missingRequirement = REQUIRED_REQUIREMENTS.find(
        (requirement) => !requisitos.includes(requirement),
    );

    if (missingRequirement) {
        throw new Error(`Matriz sem requisito obrigatorio: ${missingRequirement}.`);
    }

    const rowByProof = new Map(rows.map((row) => [row.proofId, row]));
    const missingProof = REQUIRED_PROOFS.find((proofId) => !rowByProof.has(proofId));

    if (missingProof) {
        throw new Error(`Matriz sem proof obrigatorio: ${missingProof}.`);
    }

    const layers = new Set(rows.map((row) => row.layer));
    const missingLayer = REQUIRED_LAYERS.find((layer) => !layers.has(layer));

    if (missingLayer) {
        throw new Error(`Matriz sem camada obrigatoria: ${missingLayer}.`);
    }

    for (const row of rows) {
        validateMatrixRow(row);
    }

    if (negativos.length < MINIMUM_NEGATIVE_SCENARIOS) {
        throw new Error("Cenarios negativos abaixo do minimo P0.");
    }

    const e2eRow = rowByProof.get("proof_e2e");

    if (e2eRow.command === "TODO (BLOCKER)" && e2eRow.status !== "lacuna_controlada") {
        throw new Error("proof_e2e sem runner aprovado deve ficar como lacuna_controlada.");
    }

    return {
        bkId: BK_ID,
        estado: "validado",
        dominio: "matriz final de testes",
        proofs: rows.length,
    };
}

/**
 * Valida uma linha da matriz de testes finais.
 *
 * @param {object} row - Linha de inventario de teste/lacuna.
 * @param {{
 *   proofId: string,
 *   bkRef: string,
 *   layer: string,
 *   command: string,
 *   status: string,
 *   gap: string,
 *   negativeScenario: string,
 *   risk: string,
 *   handoff: string
 * }} row - Linha de inventario de teste/lacuna.
 * @returns {void}
 * @throws {Error} Quando a linha esta incompleta ou expoe dados sensiveis.
 */
function validateMatrixRow(row) {
    if (
        !row.proofId ||
        !row.bkRef ||
        !row.layer ||
        !row.command ||
        !row.status ||
        !row.gap ||
        !row.negativeScenario ||
        !row.risk ||
        !row.handoff
    ) {
        throw new Error(`Linha incompleta na matriz: ${row?.proofId ?? "sem-id"}.`);
    }

    if (!VALID_STATUSES.includes(row.status)) {
        throw new Error(`Estado invalido no proof ${row.proofId}: ${row.status}.`);
    }

    const serializedRow = [
        row.command,
        row.gap,
        row.negativeScenario,
        row.risk,
        row.handoff,
    ].join(" ");
    const leakedPattern = SENSITIVE_OUTPUT_PATTERNS.find((pattern) =>
        serializedRow.includes(pattern),
    );

    if (leakedPattern) {
        throw new Error(`Conteudo sensivel detetado no proof ${row.proofId}: ${leakedPattern}.`);
    }
}
