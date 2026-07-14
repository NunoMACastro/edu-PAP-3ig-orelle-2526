/**
 * Fachada de domínio da pré-visualização cosmética.
 *
 * A coleção física e o worker conservam nomes legacy para não mover ciphertext
 * nem quebrar AAD; novos controllers dependem apenas desta nomenclatura.
 */
export {
    createCosmeticVisualizationForReport,
    getCosmeticVisualizationForUser,
    readCosmeticVisualizationImageForUser,
    revokeCosmeticVisualizationConsent,
    submitCosmeticVisualizationFeedback,
} from "./makeup-simulation.service.js";

