/**
 * Contratos canonicos de consentimento facial.
 *
 * A finalidade fica centralizada para todos os fluxos sensiveis validarem o
 * mesmo texto tecnico antes de tratar fotografias ou relatorios faciais.
 */

/**
 * Finalidade RGPD aceite para analise facial cosmetica.
 *
 * @type {"analise_facial_cosmetica"}
 */
export const FACE_ANALYSIS_CONSENT_PURPOSE = "analise_facial_cosmetica";

/**
 * Finalidade sensivel que a Orélle nao ativa neste BK.
 *
 * @type {"aprendizagem_modelos_terceiros"}
 */
export const THIRD_PARTY_MODEL_LEARNING_PURPOSE =
    "aprendizagem_modelos_terceiros";

/**
 * Retencao comunicada a providers externos para limitar o uso das imagens.
 *
 * @type {"processamento_imediato_sem_aprendizagem_terceiros"}
 */
export const FACE_IMAGE_PROVIDER_RETENTION =
    "processamento_imediato_sem_aprendizagem_terceiros";

/**
 * Politica minima e testavel para imagens faciais processadas.
 *
 * @type {{purpose: string, retention: string, modelLearningAllowed: boolean}}
 */
export const FACE_IMAGE_PURPOSE_POLICY = Object.freeze({
    purpose: FACE_ANALYSIS_CONSENT_PURPOSE,
    retention: FACE_IMAGE_PROVIDER_RETENTION,
    // Este BK nao cria consentimento separado para aprendizagem por terceiros.
    modelLearningAllowed: false,
});
