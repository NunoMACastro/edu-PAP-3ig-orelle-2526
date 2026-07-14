/**
 * Migração 008: cifra dados sensíveis derivados que continuavam materializados
 * em recomendações, revisões, comparações e limitações de análise.
 *
 * A versão é append-only e não altera o contrato/checksum das migrações 005 ou
 * 006. Cada envelope AES-GCM v2 fica autenticado pela coleção, owner e campo.
 */
import {
    decryptJsonForMigration,
    decryptJsonWithContext,
    encryptJsonWithContext,
    isContextualEncryptedPayload,
    isEncryptedPayload,
} from "../utils/encryption.util.js";
import {
    getSensitiveFieldEncryptionContext,
    SENSITIVE_DERIVATIVE_ENCRYPTION_SPECS,
} from "../utils/contextual-encrypted-field.util.js";
import { stripLegacyReviewerId } from "../utils/human-override-privacy.util.js";

const LEGACY_REVIEW_STATUSES = Object.freeze([
    "approved",
    "adjusted",
    "rejected",
]);
const HUMAN_OVERRIDE_SPECS = Object.freeze([
    Object.freeze({ collection: "productrecommendations", ownerField: "userId" }),
    Object.freeze({ collection: "aiconsultationreviews", ownerField: "userId" }),
]);

/** Indica que um valor tenta ser envelope, mas não cumpre v1/v2. */
function isMalformedEncryptedPayload(value) {
    return (
        Boolean(value) &&
        typeof value === "object" &&
        value.encrypted === true &&
        !isEncryptedPayload(value)
    );
}

/** Constrói o AAD canónico sem devolver conteúdo sensível. */
function buildContext(spec, document, field) {
    return getSensitiveFieldEncryptionContext({
        collection: spec.collection,
        owner: document[spec.ownerField],
        field,
    });
}

/** Confirma owner ObjectId exato antes de cifrar. */
function hasValidOwner(spec, document) {
    return /^[a-f0-9]{24}$/i.test(
        String(document?.[spec.ownerField]?.toString?.() ?? ""),
    );
}

/** Classifica um campo sem expor o respetivo valor. */
function classifyField(spec, document, field) {
    const value = document[field];
    if (value === null || value === undefined) return "empty";
    if (isMalformedEncryptedPayload(value)) return "malformed";
    if (isContextualEncryptedPayload(value)) {
        try {
            decryptJsonWithContext(value, buildContext(spec, document, field));
            return "v2";
        } catch {
            return "invalid_v2";
        }
    }
    if (isEncryptedPayload(value)) return "v1";
    return "plaintext";
}

/**
 * Classifica reviews individuais antigas sem expor notas ou owners.
 * Só a review mais recente por recomendação pode originar um override.
 */
async function inspectLegacyReviewBackfill(db, session = undefined) {
    const options = session ? { session } : {};
    const reviews = await db
        .collection("recommendationreviews")
        .find(
            {
                recommendationId: { $type: "objectId" },
                clientUserId: { $type: "objectId" },
                status: { $in: LEGACY_REVIEW_STATUSES },
            },
            {
                ...options,
                projection: {
                    recommendationId: 1,
                    clientUserId: 1,
                    consultantId: 1,
                    status: 1,
                    note: 1,
                    adjustedExplanation: 1,
                    createdAt: 1,
                    updatedAt: 1,
                },
            },
        )
        .sort({ createdAt: -1, _id: -1 })
        .toArray();
    const latestByRecommendation = new Map();
    for (const review of reviews) {
        const key = String(review.recommendationId);
        if (!latestByRecommendation.has(key)) {
            latestByRecommendation.set(key, review);
        }
    }

    const candidates = [];
    let orphanReviews = 0;
    let ownershipMismatchReviews = 0;
    for (const review of latestByRecommendation.values()) {
        const recommendation = await db
            .collection("productrecommendations")
            .findOne(
                { _id: review.recommendationId },
                {
                    ...options,
                    projection: { userId: 1, humanOverride: 1 },
                },
            );
        if (!recommendation) {
            orphanReviews += 1;
            continue;
        }
        if (String(recommendation.userId) !== String(review.clientUserId)) {
            ownershipMismatchReviews += 1;
            continue;
        }
        if (
            recommendation.humanOverride === null ||
            recommendation.humanOverride === undefined
        ) {
            candidates.push({ recommendation, review });
        }
    }

    return {
        candidates,
        reviewsNeedingOverride: candidates.length,
        orphanReviews,
        ownershipMismatchReviews,
    };
}

/** Converte uma nota legacy em valor lógico dentro do contexto original. */
function readLegacyReviewField(review, field) {
    const value = review[field];
    if (value === null || value === undefined) return null;
    return decryptJsonForMigration(
        value,
        getSensitiveFieldEncryptionContext({
            collection: "recommendationreviews",
            owner: review.clientUserId,
            field,
        }),
    );
}

/**
 * Preserva correções humanas históricas sem alterar o snapshot da máquina.
 */
async function backfillLegacyReviewOverrides(db, session, now) {
    const inspection = await inspectLegacyReviewBackfill(db, session);
    if (
        inspection.orphanReviews > 0 ||
        inspection.ownershipMismatchReviews > 0
    ) {
        throw new Error(
            "Migração 008 encontrou review legacy órfã ou com ownership incompatível",
        );
    }

    let legacyOverridesBackfilled = 0;
    for (const { recommendation, review } of inspection.candidates) {
        const humanOverride = {
            decision: review.status,
            note: readLegacyReviewField(review, "note"),
            adjustedExplanation:
                review.status === "adjusted"
                    ? readLegacyReviewField(review, "adjustedExplanation")
                    : null,
            reviewId: review._id,
            reviewedAt: review.createdAt ?? review.updatedAt ?? now,
        };
        const encryptedOverride = encryptJsonWithContext(
            humanOverride,
            getSensitiveFieldEncryptionContext({
                collection: "productrecommendations",
                owner: recommendation.userId,
                field: "humanOverride",
            }),
        );
        const result = await db.collection("productrecommendations").updateOne(
            {
                _id: recommendation._id,
                userId: recommendation.userId,
                humanOverride: null,
            },
            { $set: { humanOverride: encryptedOverride } },
            { session },
        );
        if (result.matchedCount !== 1) {
            throw new Error(
                "Migração 008 perdeu CAS ao preservar review legacy",
            );
        }
        legacyOverridesBackfilled += 1;
    }

    return legacyOverridesBackfilled;
}

/** Classifica overrides que ainda conservam identidade ou envelope legado. */
async function inspectHumanOverrideSanitization(db, session = undefined) {
    const options = session ? { session } : {};
    const counters = {
        humanOverridesNeedingSanitization: 0,
        invalidHumanOverrideOwners: 0,
        invalidHumanOverrides: 0,
    };

    for (const spec of HUMAN_OVERRIDE_SPECS) {
        const documents = await db
            .collection(spec.collection)
            .find(
                { humanOverride: { $ne: null } },
                {
                    ...options,
                    projection: { [spec.ownerField]: 1, humanOverride: 1 },
                },
            )
            .toArray();

        for (const document of documents) {
            if (!hasValidOwner(spec, document)) {
                counters.invalidHumanOverrideOwners += 1;
                continue;
            }
            try {
                const context = getSensitiveFieldEncryptionContext({
                    collection: spec.collection,
                    owner: document[spec.ownerField],
                    field: "humanOverride",
                });
                const logicalValue = decryptJsonForMigration(
                    document.humanOverride,
                    context,
                );
                const { removed } = stripLegacyReviewerId(logicalValue);
                if (
                    removed ||
                    !isContextualEncryptedPayload(document.humanOverride)
                ) {
                    counters.humanOverridesNeedingSanitization += 1;
                }
            } catch {
                counters.invalidHumanOverrides += 1;
            }
        }
    }

    return counters;
}

/** Recifra overrides históricos sem a identidade redundante do consultor. */
async function sanitizeHumanOverrides(db, session) {
    let humanOverridesSanitized = 0;

    for (const spec of HUMAN_OVERRIDE_SPECS) {
        const documents = await db
            .collection(spec.collection)
            .find(
                { humanOverride: { $ne: null } },
                {
                    session,
                    projection: { [spec.ownerField]: 1, humanOverride: 1 },
                },
            )
            .toArray();

        for (const document of documents) {
            if (!hasValidOwner(spec, document)) {
                throw new Error(
                    `Migração 008 encontrou owner inválido em ${spec.collection}.humanOverride`,
                );
            }
            const context = getSensitiveFieldEncryptionContext({
                collection: spec.collection,
                owner: document[spec.ownerField],
                field: "humanOverride",
            });
            const logicalValue = decryptJsonForMigration(
                document.humanOverride,
                context,
            );
            const { value, removed } = stripLegacyReviewerId(logicalValue);
            if (
                !removed &&
                isContextualEncryptedPayload(document.humanOverride)
            ) {
                continue;
            }

            const encryptedOverride = encryptJsonWithContext(value, context);
            const result = await db.collection(spec.collection).updateOne(
                {
                    _id: document._id,
                    [spec.ownerField]: document[spec.ownerField],
                    humanOverride: document.humanOverride,
                },
                { $set: { humanOverride: encryptedOverride } },
                { session },
            );
            if (result.matchedCount !== 1) {
                throw new Error(
                    `Migração 008 perdeu CAS em ${spec.collection}.humanOverride`,
                );
            }
            humanOverridesSanitized += 1;
        }
    }

    return humanOverridesSanitized;
}

/** Recolhe apenas contagens agregadas para status/dry-run. */
async function analyze(db, session = undefined) {
    const options = session ? { session } : {};
    const counters = {
        documentsNeedingEncryption: 0,
        fieldsNeedingEncryption: 0,
        plaintextFields: 0,
        legacyV1Fields: 0,
        invalidOwnerDocuments: 0,
        invalidEncryptedFields: 0,
    };
    const legacyReviews = await inspectLegacyReviewBackfill(db, session);
    counters.reviewsNeedingOverride = legacyReviews.reviewsNeedingOverride;
    counters.orphanReviews = legacyReviews.orphanReviews;
    counters.ownershipMismatchReviews =
        legacyReviews.ownershipMismatchReviews;
    Object.assign(
        counters,
        await inspectHumanOverrideSanitization(db, session),
    );

    for (const spec of SENSITIVE_DERIVATIVE_ENCRYPTION_SPECS) {
        const projection = { [spec.ownerField]: 1 };
        for (const field of spec.fields) projection[field] = 1;
        const cursor = db
            .collection(spec.collection)
            .find({}, { ...options, projection });

        for await (const document of cursor) {
            let documentNeedsEncryption = false;
            const hasSensitiveValue = spec.fields.some(
                (field) => document[field] !== null && document[field] !== undefined,
            );

            if (hasSensitiveValue && !hasValidOwner(spec, document)) {
                counters.invalidOwnerDocuments += 1;
            }

            for (const field of spec.fields) {
                const kind = classifyField(spec, document, field);
                if (kind === "plaintext" || kind === "v1") {
                    documentNeedsEncryption = true;
                    counters.fieldsNeedingEncryption += 1;
                    if (kind === "plaintext") counters.plaintextFields += 1;
                    else counters.legacyV1Fields += 1;
                } else if (kind === "malformed" || kind === "invalid_v2") {
                    counters.invalidEncryptedFields += 1;
                }
            }

            if (documentNeedsEncryption) counters.documentsNeedingEncryption += 1;
        }
    }

    return counters;
}

/** Converte apenas plaintext/v1 e autentica qualquer envelope v2 existente. */
async function up({ db, session, now }) {
    let documentsUpdated = 0;
    let fieldsEncrypted = 0;
    const legacyOverridesBackfilled = await backfillLegacyReviewOverrides(
        db,
        session,
        now,
    );
    const humanOverridesSanitized = await sanitizeHumanOverrides(db, session);

    for (const spec of SENSITIVE_DERIVATIVE_ENCRYPTION_SPECS) {
        const projection = { [spec.ownerField]: 1 };
        for (const field of spec.fields) projection[field] = 1;
        const cursor = db
            .collection(spec.collection)
            .find({}, { session, projection });

        for await (const document of cursor) {
            const hasSensitiveValue = spec.fields.some(
                (field) => document[field] !== null && document[field] !== undefined,
            );
            if (hasSensitiveValue && !hasValidOwner(spec, document)) {
                throw new Error(
                    `Migração 008 encontrou owner inválido em ${spec.collection}`,
                );
            }

            const set = {};
            for (const field of spec.fields) {
                const value = document[field];
                if (value === null || value === undefined) continue;
                const kind = classifyField(spec, document, field);
                if (kind === "v2") continue;
                if (kind === "malformed" || kind === "invalid_v2") {
                    throw new Error(
                        `Migração 008 recusou payload inválido em ${spec.collection}.${field}`,
                    );
                }

                const context = buildContext(spec, document, field);
                const logicalValue = decryptJsonForMigration(value, context);
                set[field] = encryptJsonWithContext(logicalValue, context);
                fieldsEncrypted += 1;
            }

            if (Object.keys(set).length === 0) continue;
            const result = await db.collection(spec.collection).updateOne(
                {
                    _id: document._id,
                    [spec.ownerField]: document[spec.ownerField],
                },
                { $set: set },
                { session },
            );
            if (result.matchedCount !== 1) {
                throw new Error(
                    `Migração 008 perdeu ownership concorrente em ${spec.collection}`,
                );
            }
            documentsUpdated += 1;
        }
    }

    return {
        documentsUpdated,
        fieldsEncrypted,
        legacyOverridesBackfilled,
        humanOverridesSanitized,
    };
}

/** Falha fechada se restar plaintext, v1, owner inválido ou AAD divergente. */
async function validate({ db, session = undefined }) {
    const remaining = await analyze(db, session);
    if (Object.values(remaining).some((count) => count !== 0)) {
        throw new Error(
            "Migração 008 deixou derivados sensíveis fora do contrato v2",
        );
    }
    return remaining;
}

export const migration008SensitiveDerivativesEncryption = Object.freeze({
    version: "008_sensitive_derivatives_encryption",
    description: "Cifra derivados sensíveis com AES-GCM contextual v2",
    analyze,
    up,
    validate,
});
