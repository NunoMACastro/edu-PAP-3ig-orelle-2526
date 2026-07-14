/**
 * Registo canónico e ordenado das migrações executáveis nesta fase.
 * O `sourcePath` permite ao runner calcular checksum do ficheiro realmente
 * executado, detetando alterações posteriores numa versão já aplicada.
 */
import { fileURLToPath } from "node:url";
import { migration001PaymentSimulationContract } from "./001_payment_simulation_contract.js";
import { migration002OrderIdempotencyAndLegacyStates } from "./002_order_idempotency_and_legacy_states.js";
import { migration003AuthSessions } from "./003_auth_sessions.js";
import { migration004PrivacyRequestsAndErasure } from "./004_privacy_requests_and_erasure.js";
import { migration005SensitiveEncryptionV2 } from "./005_sensitive_encryption_v2.js";
import { migration006AiMachineHumanSplit } from "./006_ai_machine_human_split.js";
import { migration007RetentionAndAuditIndexes } from "./007_retention_and_audit_indexes.js";
import { migration008SensitiveDerivativesEncryption } from "./008_sensitive_derivatives_encryption.js";
import { migration009PrivacyBarriersAndFaceFileEncryption } from "./009_privacy_barriers_and_face_file_encryption.js";
import { migration010OpenAiOnlyAndConsentV2 } from "./010_openai_only_and_consent_v2.js";
import { migration011GoalConsultationAndAiJobs } from "./011_goal_consultation_and_ai_jobs.js";
import { migration012ProductAiMetadataAndVariants } from "./012_product_ai_metadata_and_variants.js";
import { migration013ReportV2AndRecommendationSnapshots } from "./013_report_v2_and_recommendation_snapshots.js";
import { migration014ReportReviewAndUnlockSnapshot } from "./014_report_review_and_unlock_snapshot.js";
import { migration015OpenAiMakeupSimulation } from "./015_photo_quality_and_openai_simulation.js";
import { migration016CosmeticVisualizationV3 } from "./016_cosmetic_visualization_v3.js";
import { migration017ProductMakeupSemanticsV3 } from "./017_product_makeup_semantics_v3.js";

/**
 * Acrescenta o caminho de origem sem o expor em logs públicos.
 *
 * @param {object} migration - Migração importada.
 * @param {string} relativePath - Caminho relativo ao presente módulo.
 * @returns {object} Migração preparada para cálculo de checksum.
 */
function withSourcePath(migration, relativePath) {
    return Object.freeze({
        ...migration,
        sourcePath: fileURLToPath(new URL(relativePath, import.meta.url)),
    });
}

/** Lista ordenada; versões novas só podem ser acrescentadas no fim. */
export const MIGRATIONS = Object.freeze([
    withSourcePath(
        migration001PaymentSimulationContract,
        "./001_payment_simulation_contract.js",
    ),
    withSourcePath(
        migration002OrderIdempotencyAndLegacyStates,
        "./002_order_idempotency_and_legacy_states.js",
    ),
    withSourcePath(migration003AuthSessions, "./003_auth_sessions.js"),
    withSourcePath(
        migration004PrivacyRequestsAndErasure,
        "./004_privacy_requests_and_erasure.js",
    ),
    withSourcePath(
        migration005SensitiveEncryptionV2,
        "./005_sensitive_encryption_v2.js",
    ),
    withSourcePath(
        migration006AiMachineHumanSplit,
        "./006_ai_machine_human_split.js",
    ),
    withSourcePath(
        migration007RetentionAndAuditIndexes,
        "./007_retention_and_audit_indexes.js",
    ),
    withSourcePath(
        migration008SensitiveDerivativesEncryption,
        "./008_sensitive_derivatives_encryption.js",
    ),
    withSourcePath(
        migration009PrivacyBarriersAndFaceFileEncryption,
        "./009_privacy_barriers_and_face_file_encryption.js",
    ),
    withSourcePath(
        migration010OpenAiOnlyAndConsentV2,
        "./010_openai_only_and_consent_v2.js",
    ),
    withSourcePath(
        migration011GoalConsultationAndAiJobs,
        "./011_goal_consultation_and_ai_jobs.js",
    ),
    withSourcePath(
        migration012ProductAiMetadataAndVariants,
        "./012_product_ai_metadata_and_variants.js",
    ),
    withSourcePath(
        migration013ReportV2AndRecommendationSnapshots,
        "./013_report_v2_and_recommendation_snapshots.js",
    ),
    withSourcePath(
        migration014ReportReviewAndUnlockSnapshot,
        "./014_report_review_and_unlock_snapshot.js",
    ),
    withSourcePath(
        migration015OpenAiMakeupSimulation,
        "./015_photo_quality_and_openai_simulation.js",
    ),
    withSourcePath(
        migration016CosmeticVisualizationV3,
        "./016_cosmetic_visualization_v3.js",
    ),
    withSourcePath(
        migration017ProductMakeupSemanticsV3,
        "./017_product_makeup_semantics_v3.js",
    ),
]);
