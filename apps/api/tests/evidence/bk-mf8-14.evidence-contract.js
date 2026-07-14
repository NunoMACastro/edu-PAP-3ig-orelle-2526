const BK_ID = "BK-MF8-14";
const REQUIRED_REQUIREMENTS = ["RNF26"];
const REQUIRED_AREAS = ["hero", "steps", "panel", "empty-error"];
const REQUIRED_MODE = "mockup";
const MINIMUM_SCREENSHOTS = 2;
const MINIMUM_MOCKUP_REFERENCES = 2;
const MINIMUM_NEGATIVE_SCENARIOS = 3;

/**
 * Valida evidence minima da aproximacao visual ao mockup.
 *
 * @function validateBKMF814Evidence
 * @param {{bkId: string, requirements: string[], mode: "mockup", mockupReferences: string[], reviewedAreas: string[], screenshots: string[], negativeScenarios: string[], deviations: string[]}} evidence - Evidence recolhida para PR/defesa.
 * @returns {{bkId: string, status: "valid", domain: "mockup_alignment", mode: "mockup"}} Resultado normalizado.
 * @throws {Error} Quando a evidence nao cobre requisito, mockup, screenshots, areas ou negativos minimos.
 */
export function validateBKMF814Evidence(evidence) {
    const requirements = Array.isArray(evidence?.requirements)
        ? evidence.requirements
        : [];
    const reviewedAreas = Array.isArray(evidence?.reviewedAreas)
        ? evidence.reviewedAreas
        : [];
    const screenshots = Array.isArray(evidence?.screenshots)
        ? evidence.screenshots
        : [];
    const mockupReferences = Array.isArray(evidence?.mockupReferences)
        ? evidence.mockupReferences
        : [];
    const negativeScenarios = Array.isArray(evidence?.negativeScenarios)
        ? evidence.negativeScenarios
        : [];

    if (evidence?.bkId !== BK_ID) {
        throw new Error("Evidence associada ao BK errado.");
    }

    const missingRequirement = REQUIRED_REQUIREMENTS.find(
        (requirement) => !requirements.includes(requirement),
    );

    if (missingRequirement) {
        throw new Error(`Evidence sem requisito obrigatorio: ${missingRequirement}.`);
    }

    if (evidence?.mode !== REQUIRED_MODE) {
        throw new Error("Evidence visual deve usar mode mockup quando mockup/ existe.");
    }

    if (mockupReferences.length < MINIMUM_MOCKUP_REFERENCES) {
        throw new Error("Evidence sem referencias suficientes ao mockup local.");
    }

    const missingArea = REQUIRED_AREAS.find(
        (area) => !reviewedAreas.includes(area),
    );

    if (missingArea) {
        throw new Error(`Evidence sem area visual obrigatoria: ${missingArea}.`);
    }

    // O BK e P0: a equipa tem de mostrar pelo menos desktop e mobile.
    if (screenshots.length < MINIMUM_SCREENSHOTS) {
        throw new Error("Evidence visual precisa de screenshots desktop e mobile.");
    }

    if (negativeScenarios.length < MINIMUM_NEGATIVE_SCENARIOS) {
        throw new Error("Cenarios negativos abaixo do minimo P0.");
    }

    return {
        bkId: BK_ID,
        status: "valid",
        domain: "mockup_alignment",
        mode: REQUIRED_MODE,
    };
}
