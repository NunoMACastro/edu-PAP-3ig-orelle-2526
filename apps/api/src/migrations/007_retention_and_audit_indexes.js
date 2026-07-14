/**
 * Migração 007: aplica retenção de 30 dias apenas às métricas técnicas e
 * garante índices de consulta nas coleções append-only de auditoria atuais.
 * Nenhum documento de auditoria é alterado ou removido por esta migração.
 */

export const PERFORMANCE_METRIC_TTL_SECONDS = 30 * 24 * 60 * 60;

const REQUIRED_INDEXES_BY_COLLECTION = Object.freeze({
    performancemetrics: Object.freeze([
        Object.freeze({
            key: Object.freeze({ createdAt: 1 }),
            options: Object.freeze({
                name: "createdAt_1",
                expireAfterSeconds: PERFORMANCE_METRIC_TTL_SECONDS,
            }),
        }),
        Object.freeze({
            key: Object.freeze({ operation: 1, status: 1, createdAt: -1 }),
            options: Object.freeze({
                name: "operation_1_status_1_createdAt_-1",
            }),
        }),
    ]),
    biometricaccesslogs: Object.freeze([
        Object.freeze({
            key: Object.freeze({ createdAt: -1 }),
            options: Object.freeze({ name: "createdAt_-1" }),
        }),
        Object.freeze({
            key: Object.freeze({ actorId: 1, createdAt: -1 }),
            options: Object.freeze({ name: "actorId_1_createdAt_-1" }),
        }),
        Object.freeze({
            key: Object.freeze({ subjectUserId: 1, createdAt: -1 }),
            options: Object.freeze({ name: "subjectUserId_1_createdAt_-1" }),
        }),
        Object.freeze({
            key: Object.freeze({ alertRaised: 1, createdAt: -1 }),
            options: Object.freeze({ name: "alertRaised_1_createdAt_-1" }),
        }),
    ]),
    aiinteractionhistories: Object.freeze([
        Object.freeze({
            key: Object.freeze({ userId: 1, createdAt: -1 }),
            options: Object.freeze({ name: "userId_1_createdAt_-1" }),
        }),
        Object.freeze({
            key: Object.freeze({ userId: 1, sessionId: 1, eventType: 1 }),
            options: Object.freeze({
                name: "userId_1_sessionId_1_eventType_1",
                unique: true,
            }),
        }),
        Object.freeze({
            key: Object.freeze({ eventType: 1, createdAt: -1 }),
            options: Object.freeze({ name: "eventType_1_createdAt_-1" }),
        }),
    ]),
});

/**
 * Lista índices sem criar implicitamente uma coleção ausente.
 *
 * @param {import("mongodb").Collection} collection - Coleção alvo.
 * @param {import("mongodb").ClientSession} [session] - Sessão opcional.
 * @returns {Promise<object[]>} Índices atuais.
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

/** Compara chaves de índice preservando a ordem dos campos. */
function sameIndexKey(current = {}, expected = {}) {
    return JSON.stringify(Object.entries(current)) === JSON.stringify(Object.entries(expected));
}

/**
 * Confirma opções funcionais e recusa TTL inesperado em audit trails.
 *
 * @param {object} current - Índice atual.
 * @param {object} required - Especificação esperada.
 * @returns {boolean} Compatibilidade funcional.
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
 * Resume o estado dos índices sem expor nomes de utilizadores ou eventos.
 *
 * @param {import("mongodb").Db} db - Base alvo.
 * @param {import("mongodb").ClientSession} [session] - Sessão opcional.
 * @returns {Promise<{missingIndexes: number, mismatchedIndexes: number}>} Contagens agregadas.
 */
async function analyzeIndexes(db, session = undefined) {
    let missingIndexes = 0;
    let mismatchedIndexes = 0;

    for (const [collectionName, requiredIndexes] of Object.entries(
        REQUIRED_INDEXES_BY_COLLECTION,
    )) {
        const currentIndexes = await listIndexes(
            db.collection(collectionName),
            session,
        );
        for (const required of requiredIndexes) {
            const sameKey = currentIndexes.find((index) =>
                sameIndexKey(index.key, required.key),
            );
            if (!sameKey) missingIndexes += 1;
            else if (!hasRequiredIndexOptions(sameKey, required)) {
                mismatchedIndexes += 1;
            }
        }
    }

    return { missingIndexes, mismatchedIndexes };
}

/**
 * Recolhe contagens sanitizadas para status/dry-run.
 *
 * @param {import("mongodb").Db} db - Base local selecionada.
 * @param {import("mongodb").ClientSession} [session] - Sessão opcional.
 * @returns {Promise<object>} Estado da retenção e dos índices.
 */
async function analyze(db, session = undefined) {
    const options = session ? { session } : {};
    const metricsWithoutCreatedAt = await db
        .collection("performancemetrics")
        .countDocuments({ createdAt: { $not: { $type: "date" } } }, options);
    const indexState = await analyzeIndexes(db, session);

    return { metricsWithoutCreatedAt, ...indexState };
}

/**
 * Cria/substitui apenas índices incompatíveis, preservando todos os dados.
 *
 * @param {import("mongodb").Db} db - Base alvo.
 * @returns {Promise<{indexesCreated: number, indexesReplaced: number}>} Resumo das operações.
 */
async function ensureRequiredIndexes(db) {
    let indexesCreated = 0;
    let indexesReplaced = 0;

    for (const [collectionName, requiredIndexes] of Object.entries(
        REQUIRED_INDEXES_BY_COLLECTION,
    )) {
        const collection = db.collection(collectionName);
        let currentIndexes = await listIndexes(collection);

        for (const required of requiredIndexes) {
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
    }

    return { indexesCreated, indexesReplaced };
}

/**
 * Normaliza apenas o timestamp técnico das métricas dentro da transação.
 * Audit logs e histórico IA não recebem qualquer update/delete.
 *
 * @param {{db: import("mongodb").Db, session: import("mongodb").ClientSession, now: Date}} context - Dependências transacionais.
 * @returns {Promise<object>} Contagens das alterações.
 */
async function up({ db, session, now }) {
    const normalizedMetrics = await db.collection("performancemetrics").updateMany(
        { createdAt: { $not: { $type: "date" } } },
        [
            {
                $set: {
                    createdAt: {
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
        metricsNormalized: normalizedMetrics.modifiedCount,
    };
}

/**
 * Aplica DDL de retenção/auditoria fora da transação MongoDB.
 *
 * @param {{db: import("mongodb").Db}} context - Base protegida pelo lock.
 * @returns {Promise<object>} Índices criados/substituídos.
 */
async function finalize({ db }) {
    return ensureRequiredIndexes(db);
}

/**
 * Confirma que todos os documentos de métricas entram na retenção e que as
 * coleções de auditoria não possuem TTL nos índices canónicos.
 *
 * @param {{db: import("mongodb").Db, session?: import("mongodb").ClientSession}} context - Base e sessão opcional.
 * @returns {Promise<object>} Estado final sanitizado.
 */
async function validate({ db, session }) {
    const remaining = await analyze(db, session);
    if (Object.values(remaining).some((count) => count !== 0)) {
        throw new Error("Migração 007 deixou retenção ou índices incompletos");
    }
    return remaining;
}

/** Metadados e operações imutáveis da migração. */
export const migration007RetentionAndAuditIndexes = Object.freeze({
    version: "007_retention_and_audit_indexes",
    description: "Aplica retenção técnica e índices append-only sem apagar auditoria",
    executionMode: "transaction_then_finalize",
    analyze,
    up,
    finalize,
    validate,
});
