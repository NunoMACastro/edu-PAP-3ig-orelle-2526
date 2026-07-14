/**
 * Migração 003: consolida exclusivamente sessões opacas persistidas.
 *
 * Credenciais JWT/raw nunca são convertidas em sessões válidas. Documentos
 * legados, estruturalmente inválidos, duplicados ou já expirados são removidos;
 * as sessões opacas válidas recebem apenas os campos de controlo em falta.
 */

const AUTH_SESSION_COLLECTION = "authsessions";
const TOKEN_HASH_PATTERN = /^[a-f0-9]{64}$/;
const CSRF_HASH_PATTERN = /^[a-f0-9]{64}$/;
const LEGACY_CREDENTIAL_FIELDS = [
    "token",
    "jwt",
    "accessToken",
    "refreshToken",
    "sessionToken",
    "credential",
    "cookie",
];

/** Índices equivalentes ao contrato runtime de `AuthSession`. */
const REQUIRED_INDEXES = Object.freeze([
    Object.freeze({
        key: Object.freeze({ tokenHash: 1 }),
        options: Object.freeze({ name: "tokenHash_1", unique: true }),
    }),
    Object.freeze({
        key: Object.freeze({ userId: 1 }),
        options: Object.freeze({ name: "userId_1" }),
    }),
    Object.freeze({
        key: Object.freeze({ revokedAt: 1 }),
        options: Object.freeze({ name: "revokedAt_1" }),
    }),
    Object.freeze({
        key: Object.freeze({ expiresAt: 1 }),
        options: Object.freeze({ name: "expiresAt_1", expireAfterSeconds: 0 }),
    }),
    Object.freeze({
        key: Object.freeze({ userId: 1, revokedAt: 1, expiresAt: 1 }),
        options: Object.freeze({
            name: "userId_1_revokedAt_1_expiresAt_1",
        }),
    }),
]);

/** Pesquisa documentos que ainda contêm uma credencial reutilizável legada. */
const LEGACY_CREDENTIAL_FILTER = {
    $or: [
        ...LEGACY_CREDENTIAL_FIELDS.map((field) => ({
            [field]: { $exists: true },
        })),
        { type: "jwt" },
        { kind: "jwt" },
        { strategy: "jwt" },
        { format: "jwt" },
    ],
};

/** Pesquisa documentos que não podem representar uma sessão opaca segura. */
const STRUCTURALLY_INVALID_FILTER = {
    $or: [
        { tokenHash: { $not: TOKEN_HASH_PATTERN } },
        { userId: { $not: { $type: "objectId" } } },
        { expiresAt: { $not: { $type: "date" } } },
        {
            $and: [
                { revokedAt: { $ne: null } },
                { revokedAt: { $not: { $type: "date" } } },
            ],
        },
    ],
};

/** Pesquisa sessões opacas válidas que ainda precisam de defaults seguros. */
const NORMALIZATION_FILTER = {
    $or: [
        { lastSeenAt: { $not: { $type: "date" } } },
        { revokedAt: { $exists: false } },
        { csrfHash: { $exists: false } },
        {
            $and: [
                { csrfHash: { $ne: null } },
                { csrfHash: { $not: CSRF_HASH_PATTERN } },
            ],
        },
        { createdAt: { $not: { $type: "date" } } },
        { updatedAt: { $not: { $type: "date" } } },
    ],
};

/**
 * Lista índices sem criar implicitamente a coleção.
 *
 * @param {import("mongodb").Collection} collection - Coleção alvo.
 * @param {import("mongodb").ClientSession} [session] - Sessão opcional.
 * @returns {Promise<object[]>} Índices atuais ou lista vazia se não existir.
 */
async function listIndexes(collection, session = undefined) {
    try {
        return await collection
            .listIndexes(session ? { session } : {})
            .toArray();
    } catch (error) {
        if (error?.code === 26 || error?.codeName === "NamespaceNotFound") {
            return [];
        }
        throw error;
    }
}

/**
 * Compara chaves de índice preservando a ordem dos campos compostos.
 *
 * @param {object} current - Chave devolvida pelo MongoDB.
 * @param {object} expected - Chave canónica.
 * @returns {boolean} Verdadeiro quando são equivalentes.
 */
function sameIndexKey(current = {}, expected = {}) {
    return JSON.stringify(Object.entries(current)) === JSON.stringify(Object.entries(expected));
}

/**
 * Confirma opções com impacto funcional, incluindo ausência de TTL indevido.
 *
 * @param {object} current - Índice atual.
 * @param {object} required - Especificação canónica.
 * @returns {boolean} Verdadeiro quando o índice satisfaz o contrato.
 */
function hasRequiredIndexOptions(current, required) {
    const expectedTtl = required.options.expireAfterSeconds;
    const currentHasTtl = current.expireAfterSeconds !== undefined;
    const expectedHasTtl = expectedTtl !== undefined;

    return (
        Boolean(current.unique) === Boolean(required.options.unique) &&
        Boolean(current.sparse) === false &&
        currentHasTtl === expectedHasTtl &&
        (!expectedHasTtl || Number(current.expireAfterSeconds) === expectedTtl)
    );
}

/**
 * Resume índices ausentes ou incompatíveis sem expor dados da coleção.
 *
 * @param {import("mongodb").Collection} collection - Coleção alvo.
 * @param {import("mongodb").ClientSession} [session] - Sessão opcional.
 * @returns {Promise<{missingIndexes: number, mismatchedIndexes: number}>} Contagens sanitizadas.
 */
async function analyzeIndexes(collection, session = undefined) {
    const currentIndexes = await listIndexes(collection, session);
    let missingIndexes = 0;
    let mismatchedIndexes = 0;

    for (const required of REQUIRED_INDEXES) {
        const sameKey = currentIndexes.find((index) =>
            sameIndexKey(index.key, required.key),
        );
        if (!sameKey) {
            missingIndexes += 1;
        } else if (!hasRequiredIndexOptions(sameKey, required)) {
            mismatchedIndexes += 1;
        }
    }

    return { missingIndexes, mismatchedIndexes };
}

/**
 * Conta todos os documentos envolvidos em hashes duplicados.
 *
 * @param {import("mongodb").Collection} collection - Coleção de sessões.
 * @param {import("mongodb").ClientSession} [session] - Sessão opcional.
 * @returns {Promise<number>} Número de sessões ambíguas a invalidar.
 */
async function countDuplicateSessionDocuments(collection, session = undefined) {
    const [summary] = await collection
        .aggregate(
            [
                {
                    $match: {
                        $and: [
                            { tokenHash: TOKEN_HASH_PATTERN },
                            { userId: { $type: "objectId" } },
                            { expiresAt: { $type: "date" } },
                            { $nor: LEGACY_CREDENTIAL_FILTER.$or },
                        ],
                    },
                },
                { $group: { _id: "$tokenHash", count: { $sum: 1 } } },
                { $match: { count: { $gt: 1 } } },
                { $group: { _id: null, documents: { $sum: "$count" } } },
            ],
            session ? { session } : {},
        )
        .toArray();

    return summary?.documents ?? 0;
}

/**
 * Recolhe contagens antes da migração sem devolver hashes ou IDs.
 *
 * @param {import("mongodb").Db} db - Base local selecionada pelo runner.
 * @param {import("mongodb").ClientSession} [session] - Sessão opcional.
 * @returns {Promise<object>} Contagens sanitizadas e estado dos índices.
 */
async function analyze(db, session = undefined) {
    const sessions = db.collection(AUTH_SESSION_COLLECTION);
    const options = session ? { session } : {};
    const now = new Date();
    const [
        legacyCredentialDocuments,
        structurallyInvalidSessions,
        sessionsNeedingNormalization,
        expiredOpaqueSessions,
        duplicateOpaqueSessions,
        indexState,
    ] = await Promise.all([
        sessions.countDocuments(LEGACY_CREDENTIAL_FILTER, options),
        sessions.countDocuments(STRUCTURALLY_INVALID_FILTER, options),
        sessions.countDocuments(
            {
                $and: [
                    { $nor: LEGACY_CREDENTIAL_FILTER.$or },
                    { $nor: STRUCTURALLY_INVALID_FILTER.$or },
                    NORMALIZATION_FILTER,
                ],
            },
            options,
        ),
        sessions.countDocuments(
            {
                $and: [
                    { $nor: LEGACY_CREDENTIAL_FILTER.$or },
                    { $nor: STRUCTURALLY_INVALID_FILTER.$or },
                    { expiresAt: { $lte: now } },
                ],
            },
            options,
        ),
        countDuplicateSessionDocuments(sessions, session),
        analyzeIndexes(sessions, session),
    ]);

    return {
        legacyCredentialDocuments,
        structurallyInvalidSessions,
        sessionsNeedingNormalization,
        expiredOpaqueSessions,
        duplicateOpaqueSessions,
        ...indexState,
    };
}

/**
 * Remove todos os documentos associados a hashes ambíguos.
 *
 * Manter arbitrariamente um dos owners promoveria uma credencial insegura;
 * eliminar o grupo força nova autenticação de forma determinística.
 *
 * @param {import("mongodb").Collection} collection - Coleção de sessões.
 * @param {import("mongodb").ClientSession} session - Sessão ativa.
 * @returns {Promise<number>} Documentos removidos.
 */
async function deleteDuplicateSessions(collection, session) {
    const duplicateHashes = await collection
        .aggregate(
            [
                { $match: { tokenHash: TOKEN_HASH_PATTERN } },
                { $group: { _id: "$tokenHash", count: { $sum: 1 } } },
                { $match: { count: { $gt: 1 } } },
                { $project: { _id: 1 } },
            ],
            { session },
        )
        .toArray();

    if (duplicateHashes.length === 0) return 0;

    const result = await collection.deleteMany(
        { tokenHash: { $in: duplicateHashes.map(({ _id }) => _id) } },
        { session },
    );
    return result.deletedCount;
}

/**
 * Cria ou substitui apenas os índices incompatíveis requeridos.
 *
 * @param {import("mongodb").Collection} collection - Coleção alvo.
 * @returns {Promise<{indexesCreated: number, indexesReplaced: number}>} Resumo das operações.
 */
async function ensureRequiredIndexes(collection) {
    let currentIndexes = await listIndexes(collection);
    let indexesCreated = 0;
    let indexesReplaced = 0;

    for (const required of REQUIRED_INDEXES) {
        const compatible = currentIndexes.find(
            (index) =>
                sameIndexKey(index.key, required.key) &&
                hasRequiredIndexOptions(index, required),
        );
        if (compatible) continue;

        const conflicts = currentIndexes.filter(
            (index) =>
                index.name !== "_id_" &&
                (index.name === required.options.name ||
                    sameIndexKey(index.key, required.key)),
        );
        for (const conflict of conflicts) {
            await collection.dropIndex(conflict.name);
            indexesReplaced += 1;
        }

        await collection.createIndex(required.key, required.options);
        indexesCreated += 1;
        currentIndexes = await listIndexes(collection);
    }

    return { indexesCreated, indexesReplaced };
}

/**
 * Aplica a limpeza e normalização transacionais da migração idempotente.
 *
 * @param {{db: import("mongodb").Db, session: import("mongodb").ClientSession, now: Date}} context - Dependências transacionais.
 * @returns {Promise<object>} Contagens das alterações efetuadas.
 */
async function up({ db, session, now }) {
    const sessions = db.collection(AUTH_SESSION_COLLECTION);
    const unsafeResult = await sessions.deleteMany(
        { $or: [LEGACY_CREDENTIAL_FILTER, STRUCTURALLY_INVALID_FILTER] },
        { session },
    );
    const duplicateSessionsRemoved = await deleteDuplicateSessions(
        sessions,
        session,
    );
    const expiredResult = await sessions.deleteMany(
        { expiresAt: { $lte: now } },
        { session },
    );
    const normalizedResult = await sessions.updateMany(
        NORMALIZATION_FILTER,
        [
            {
                $set: {
                    lastSeenAt: {
                        $cond: [
                            { $eq: [{ $type: "$lastSeenAt" }, "date"] },
                            "$lastSeenAt",
                            {
                                $cond: [
                                    { $eq: [{ $type: "$updatedAt" }, "date"] },
                                    "$updatedAt",
                                    {
                                        $cond: [
                                            { $eq: [{ $type: "$createdAt" }, "date"] },
                                            "$createdAt",
                                            now,
                                        ],
                                    },
                                ],
                            },
                        ],
                    },
                    revokedAt: {
                        $cond: [
                            { $eq: [{ $type: "$revokedAt" }, "date"] },
                            "$revokedAt",
                            null,
                        ],
                    },
                    csrfHash: {
                        $cond: [
                            {
                                $and: [
                                    { $eq: [{ $type: "$csrfHash" }, "string"] },
                                    {
                                        $regexMatch: {
                                            input: "$csrfHash",
                                            regex: CSRF_HASH_PATTERN,
                                        },
                                    },
                                ],
                            },
                            "$csrfHash",
                            null,
                        ],
                    },
                    createdAt: {
                        $cond: [
                            { $eq: [{ $type: "$createdAt" }, "date"] },
                            "$createdAt",
                            now,
                        ],
                    },
                    updatedAt: {
                        $cond: [
                            { $eq: [{ $type: "$updatedAt" }, "date"] },
                            "$updatedAt",
                            now,
                        ],
                    },
                },
            },
        ],
        { session },
    );
    return {
        unsafeSessionsRemoved: unsafeResult.deletedCount,
        duplicateSessionsRemoved,
        expiredSessionsRemoved: expiredResult.deletedCount,
        sessionsNormalized: normalizedResult.modifiedCount,
    };
}

/**
 * Garante índices depois do commit do DML, porque MongoDB recusa
 * `listIndexes`/DDL dentro de transações multi-documento.
 *
 * @param {{db: import("mongodb").Db}} context - Base alvo sob lock global.
 * @returns {Promise<object>} Contagens de índices idempotentes.
 */
async function finalize({ db }) {
    return ensureRequiredIndexes(db.collection(AUTH_SESSION_COLLECTION));
}

/**
 * Confirma estrutura segura e índices; expiração continua também protegida em
 * runtime porque o monitor TTL do MongoDB é deliberadamente assíncrono.
 *
 * @param {{db: import("mongodb").Db, session: import("mongodb").ClientSession}} context - Base e sessão atuais.
 * @returns {Promise<object>} Estado final sanitizado.
 * @throws {Error} Quando resta uma sessão promovível ou um índice incorreto.
 */
async function validate({ db, session }) {
    const remaining = await analyze(db, session);
    const blockingKeys = [
        "legacyCredentialDocuments",
        "structurallyInvalidSessions",
        "sessionsNeedingNormalization",
        "duplicateOpaqueSessions",
        "missingIndexes",
        "mismatchedIndexes",
    ];

    if (blockingKeys.some((key) => remaining[key] !== 0)) {
        throw new Error("Migração 003 deixou sessões ou índices inválidos");
    }

    return remaining;
}

/** Metadados e operações imutáveis da migração. */
export const migration003AuthSessions = Object.freeze({
    version: "003_auth_sessions",
    description: "Invalida credenciais legadas e consolida sessões opacas",
    executionMode: "transaction_then_finalize",
    analyze,
    up,
    finalize,
    validate,
});
