const BK_ID = "BK-MF8-13";
const REQUIRED_REQUIREMENTS = ["RF42", "RF45", "RF46", "RNF26"];
const MINIMUM_PROOFS = 4;
const MINIMUM_NEGATIVE_SCENARIOS = 3;

/**
 * Valida a evidence minima da interface integrada cliente/consultor.
 *
 * @function validateBKMF813Evidence
 * @param {{bkId: string, requirements: string[], proofs: string[], negativeScenarios: string[]}} evidence - Evidence recolhida para PR/defesa.
 * @returns {{bkId: string, status: "valid", domain: "assisted_consultation_ui"}} Resultado normalizado.
 * @throws {Error} Quando a evidence nao prova rastreabilidade, integracao ou negativos.
 */
export function validateBKMF813Evidence(evidence) {
    const requirements = Array.isArray(evidence?.requirements)
        ? evidence.requirements
        : [];
    const proofs = Array.isArray(evidence?.proofs) ? evidence.proofs : [];
    const negativeScenarios = Array.isArray(evidence?.negativeScenarios)
        ? evidence.negativeScenarios
        : [];

    // A evidence fica presa ao BK e aos requisitos para evitar prova generica.
    if (evidence?.bkId !== BK_ID) {
        throw new Error("Evidence associada ao BK errado.");
    }

    const missingRequirement = REQUIRED_REQUIREMENTS.find(
        (requirement) => !requirements.includes(requirement),
    );

    if (missingRequirement) {
        throw new Error(`Evidence sem requisito obrigatorio: ${missingRequirement}.`);
    }

    // Quatro provas cobrem navegacao, role gate visual, build e check estatico.
    if (proofs.length < MINIMUM_PROOFS) {
        throw new Error("Evidence tecnica insuficiente para a interface integrada.");
    }

    if (negativeScenarios.length < MINIMUM_NEGATIVE_SCENARIOS) {
        throw new Error("Cenarios negativos abaixo do minimo P0.");
    }

    return {
        bkId: BK_ID,
        status: "valid",
        domain: "assisted_consultation_ui",
    };
}
