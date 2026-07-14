/**
 * Migração 005: converte dados sensíveis em claro ou envelopes AES-GCM v1 no
 * contrato contextual v2. AAD liga cada payload à coleção, owner e campo.
 *
 * O runner executa `up` numa transação. A operação é retomável porque campos
 * v2 válidos são autenticados e ignorados, enquanto apenas campos legados são
 * reescritos. Nenhum conteúdo ou chave entra nos resultados sanitizados.
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
    SENSITIVE_FIELD_ENCRYPTION_SPECS,
} from "../utils/contextual-encrypted-field.util.js";

/** Indica que o objeto tenta ser envelope, mas não cumpre v1/v2. */
function isMalformedEncryptedPayload(value) {
    return (
        Boolean(value) &&
        typeof value === "object" &&
        value.encrypted === true &&
        !isEncryptedPayload(value)
    );
}

/** Constrói o contexto canónico sem copiar o conteúdo sensível. */
function buildContext(spec, document, field) {
    return getSensitiveFieldEncryptionContext({
        collection: spec.collection,
        owner: document[spec.ownerField],
        field,
    });
}

/** Confirma que o documento tem owner exato antes de tocar em conteúdo. */
function hasValidOwner(spec, document) {
    return /^[a-f0-9]{24}$/i.test(
        String(document?.[spec.ownerField]?.toString?.() ?? ""),
    );
}

/**
 * Classifica o estado sem devolver valores de negócio.
 *
 * @returns {{kind: "empty"|"v2"|"v1"|"plaintext"|"malformed"|"invalid_v2"}}
 */
function classifyField(spec, document, field) {
    const value = document[field];
    if (value === null || value === undefined) return { kind: "empty" };
    if (isMalformedEncryptedPayload(value)) return { kind: "malformed" };
    if (isContextualEncryptedPayload(value)) {
        try {
            decryptJsonWithContext(value, buildContext(spec, document, field));
            return { kind: "v2" };
        } catch {
            return { kind: "invalid_v2" };
        }
    }
    if (isEncryptedPayload(value)) return { kind: "v1" };
    return { kind: "plaintext" };
}

/** Recolhe apenas contagens, nunca valores, IDs ou contexto criptográfico. */
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

    for (const spec of SENSITIVE_FIELD_ENCRYPTION_SPECS) {
        const projection = { [spec.ownerField]: 1 };
        for (const field of spec.fields) projection[field] = 1;

        const cursor = db.collection(spec.collection).find({}, { ...options, projection });
        for await (const document of cursor) {
            let documentNeedsEncryption = false;
            let hasSensitiveValue = false;

            for (const field of spec.fields) {
                const value = document[field];
                if (value !== null && value !== undefined) hasSensitiveValue = true;
                const { kind } = classifyField(spec, document, field);
                if (kind === "plaintext" || kind === "v1") {
                    documentNeedsEncryption = true;
                    counters.fieldsNeedingEncryption += 1;
                    if (kind === "plaintext") counters.plaintextFields += 1;
                    else counters.legacyV1Fields += 1;
                } else if (kind === "malformed" || kind === "invalid_v2") {
                    counters.invalidEncryptedFields += 1;
                }
            }

            if (hasSensitiveValue && !hasValidOwner(spec, document)) {
                counters.invalidOwnerDocuments += 1;
            }
            if (documentNeedsEncryption) counters.documentsNeedingEncryption += 1;
        }
    }

    return counters;
}

/** Converte cada documento de forma idempotente dentro da transação do runner. */
async function up({ db, session }) {
    let documentsUpdated = 0;
    let fieldsEncrypted = 0;

    for (const spec of SENSITIVE_FIELD_ENCRYPTION_SPECS) {
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
                    `Migração 005 encontrou owner inválido em ${spec.collection}`,
                );
            }

            const set = {};
            for (const field of spec.fields) {
                const value = document[field];
                if (value === null || value === undefined) continue;
                const { kind } = classifyField(spec, document, field);

                if (kind === "v2") continue;
                if (kind === "malformed" || kind === "invalid_v2") {
                    throw new Error(
                        `Migração 005 recusou payload inválido em ${spec.collection}.${field}`,
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
                    `Migração 005 perdeu ownership concorrente em ${spec.collection}`,
                );
            }
            documentsUpdated += 1;
        }
    }

    return { documentsUpdated, fieldsEncrypted };
}

/** Falha fechada se restar plaintext, v1, owner inválido ou payload adulterado. */
async function validate({ db, session = undefined }) {
    const remaining = await analyze(db, session);
    if (Object.values(remaining).some((count) => count !== 0)) {
        throw new Error("Migração 005 deixou dados sensíveis fora do contrato v2");
    }
    return remaining;
}

export const migration005SensitiveEncryptionV2 = Object.freeze({
    version: "005_sensitive_encryption_v2",
    description: "Cifra dados sensíveis com AES-GCM contextual v2",
    analyze,
    up,
    validate,
});
