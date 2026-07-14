/**
 * Runner de migrações MongoDB com checksum do source, lock com lease,
 * dry-run sem escrita e aplicação idempotente. DML usa transações; DDL que o
 * MongoDB proíbe dentro delas usa uma fase finalizadora retomável.
 */
import { createHash, randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import { performance } from "node:perf_hooks";
import { MIGRATIONS } from "./index.js";

export const MIGRATION_COLLECTION = "schema_migrations";
export const MIGRATION_LOCK_COLLECTION = "schema_migration_locks";
export const DEFAULT_MIGRATION_LOCK_TTL_MS = 5 * 60 * 1000;
const MIGRATION_VERSION_INDEX = "version_1_unique";

const TRANSACTION_OPTIONS = Object.freeze({
    readConcern: { level: "snapshot" },
    writeConcern: { w: "majority" },
    readPreference: "primary",
});
const MIGRATION_EXECUTION_MODES = Object.freeze({
    TRANSACTIONAL: "transactional",
    TRANSACTION_THEN_FINALIZE: "transaction_then_finalize",
});

/**
 * Calcula SHA-256 do ficheiro de migração realmente executado.
 *
 * @param {{sourcePath: string}} migration - Migração registada.
 * @returns {Promise<string>} Checksum hexadecimal.
 */
export async function calculateMigrationChecksum(migration) {
    if (!migration?.sourcePath) {
        throw new Error("Migração sem sourcePath para checksum");
    }

    const source = await readFile(migration.sourcePath);
    return createHash("sha256").update(source).digest("hex");
}

/**
 * Garante versões únicas e estritamente crescentes.
 *
 * @param {object[]} migrations - Registo candidato.
 * @returns {void}
 */
export function assertMigrationRegistry(migrations) {
    let previousVersion = "";
    const seen = new Set();

    for (const migration of migrations) {
        const executionMode =
            migration?.executionMode ?? MIGRATION_EXECUTION_MODES.TRANSACTIONAL;
        const executionModeIsValid = Object.values(
            MIGRATION_EXECUTION_MODES,
        ).includes(executionMode);
        const finalizeIsValid =
            executionMode !==
                MIGRATION_EXECUTION_MODES.TRANSACTION_THEN_FINALIZE ||
            typeof migration.finalize === "function";

        if (
            !migration?.version ||
            seen.has(migration.version) ||
            migration.version <= previousVersion ||
            typeof migration.analyze !== "function" ||
            typeof migration.up !== "function" ||
            typeof migration.validate !== "function" ||
            !executionModeIsValid ||
            !finalizeIsValid
        ) {
            throw new Error("Registo de migrações inválido ou fora de ordem");
        }

        seen.add(migration.version);
        previousVersion = migration.version;
    }
}

/**
 * Aplica uma migração que contém DDL incompatível com transações MongoDB.
 *
 * O DML é confirmado primeiro numa transação; o finalize idempotente trata
 * índices fora dela, valida o estado completo e só então grava o registo. Se
 * o processo cair entre fases, a ausência do registo força um replay seguro.
 *
 * @param {object} options - Dependências da execução faseada.
 * @returns {Promise<object>} Evidência sanitizada da migração aplicada.
 */
async function runTransactionThenFinalize({
    client,
    db,
    migration,
    checksum,
    now,
    startedAt,
    assertLockOwned,
}) {
    await assertLockOwned();
    const before = await migration.analyze(db);
    const session = client.startSession();
    let transactionalChanges;

    try {
        await session.withTransaction(async () => {
            await assertLockOwned();
            transactionalChanges = await migration.up({ db, session, now });
            await assertLockOwned();
        }, TRANSACTION_OPTIONS);
    } finally {
        await session.endSession();
    }

    await assertLockOwned();
    const finalizedChanges = await migration.finalize({ db, now });
    await assertLockOwned();
    const validation = await migration.validate({ db });
    await assertLockOwned();
    const durationMs = Math.max(
        0,
        Math.round(performance.now() - startedAt),
    );

    await db.collection(MIGRATION_COLLECTION).insertOne({
        version: migration.version,
        checksum,
        appliedAt: now,
        durationMs,
    });

    return {
        version: migration.version,
        state: "applied",
        before,
        changes: { ...transactionalChanges, ...finalizedChanges },
        validation,
        durationMs,
    };
}

/**
 * Lista estado/checksum sem expor paths ou dados migrados.
 *
 * @param {{db: import("mongodb").Db, migrations?: object[]}} options - Base e registo.
 * @returns {Promise<object[]>} Estado canónico por versão.
 */
export async function getMigrationStatus({ db, migrations = MIGRATIONS }) {
    assertMigrationRegistry(migrations);
    const records = await db
        .collection(MIGRATION_COLLECTION)
        .find({})
        .project({ _id: 0, version: 1, checksum: 1, appliedAt: 1, durationMs: 1 })
        .toArray();
    const recordsByVersion = new Map(
        records.map((record) => [record.version, record]),
    );
    if (recordsByVersion.size !== records.length) {
        throw new Error("Registos de migração duplicados por versão");
    }
    const status = [];

    for (const migration of migrations) {
        const checksum = await calculateMigrationChecksum(migration);
        const record = recordsByVersion.get(migration.version);
        status.push({
            version: migration.version,
            description: migration.description,
            checksum,
            state: !record
                ? "pending"
                : record.checksum === checksum
                  ? "applied"
                  : "checksum_mismatch",
            appliedAt: record?.appliedAt ?? null,
            durationMs: record?.durationMs ?? null,
        });
    }

    return status;
}

/**
 * Recusa avançar quando uma versão aplicada mudou no disco.
 *
 * @param {object[]} status - Resultado de `getMigrationStatus`.
 * @returns {void}
 */
function assertNoChecksumMismatch(status) {
    const mismatch = status.find((entry) => entry.state === "checksum_mismatch");
    if (mismatch) {
        throw new Error(`Checksum divergente na migração ${mismatch.version}`);
    }
}

/**
 * Adquire lease global sem esperar nem substituir outro owner ativo.
 *
 * @param {object} options - Configuração do lock.
 * @param {import("mongodb").Db} options.db - Base atual.
 * @param {string} options.ownerId - Identificador aleatório deste runner.
 * @param {Date} options.now - Relógio injetável.
 * @param {number} options.lockTtlMs - Duração máxima do lease.
 * @returns {Promise<void>}
 */
async function acquireMigrationLock({ db, ownerId, now, lockTtlMs }) {
    const expiresAt = new Date(now.getTime() + lockTtlMs);

    try {
        const result = await db.collection(MIGRATION_LOCK_COLLECTION).updateOne(
            {
                _id: "global",
                $or: [{ expiresAt: { $lte: now } }, { ownerId }],
            },
            {
                $set: { ownerId, acquiredAt: now, expiresAt },
            },
            { upsert: true },
        );

        if (result.matchedCount + result.upsertedCount !== 1) {
            throw new Error("Lock de migração ocupado");
        }
    } catch (error) {
        if (error?.code === 11000 || error?.message === "Lock de migração ocupado") {
            throw new Error("Lock de migração ocupado");
        }
        throw error;
    }
}

/**
 * Garante que cada versão só pode ser registada uma vez, mesmo se dois
 * processos disputarem um lease durante uma pausa longa do event loop.
 *
 * @param {import("mongodb").Db} db - Base atual.
 * @returns {Promise<void>}
 */
async function ensureMigrationVersionIndex(db) {
    try {
        await db.collection(MIGRATION_COLLECTION).createIndex(
            { version: 1 },
            { name: MIGRATION_VERSION_INDEX, unique: true },
        );
    } catch (error) {
        if (error?.code === 11000) {
            throw new Error("Registos de migração duplicados por versão");
        }
        throw error;
    }
}

/**
 * Renova o lease apenas enquanto o mesmo owner continua no documento global.
 * Uma aquisição concorrente torna a perda terminal para o runner atual.
 *
 * @param {object} options - Dependências do heartbeat.
 * @returns {Promise<void>}
 */
async function renewMigrationLock({ db, ownerId, lockTtlMs }) {
    const heartbeatAt = new Date();
    const expiresAt = new Date(heartbeatAt.getTime() + lockTtlMs);
    const result = await db.collection(MIGRATION_LOCK_COLLECTION).updateOne(
        { _id: "global", ownerId },
        { $set: { heartbeatAt, expiresAt } },
    );

    if (result.matchedCount !== 1) {
        throw new Error("Lock de migração perdido");
    }
}

/**
 * Confirma no servidor que o lease ainda pertence ao runner e não expirou.
 *
 * @param {object} options - Identidade do lease.
 * @returns {Promise<void>}
 */
async function assertMigrationLockOwned({ db, ownerId }) {
    const lock = await db.collection(MIGRATION_LOCK_COLLECTION).findOne(
        {
            _id: "global",
            ownerId,
            expiresAt: { $gt: new Date() },
        },
        { projection: { _id: 1 } },
    );

    if (!lock) {
        throw new Error("Lock de migração perdido");
    }
}

/**
 * Mantém o lease vivo e disponibiliza barreiras explícitas antes de commits.
 * O timer é descarregado do event loop, mas todas as operações em curso são
 * aguardadas no teardown.
 *
 * @param {object} options - Base, owner e duração do lease.
 * @returns {{assertOwned: () => Promise<void>, stop: () => Promise<void>}}
 */
function startMigrationLockHeartbeat({ db, ownerId, lockTtlMs }) {
    const intervalMs = Math.max(100, Math.floor(lockTtlMs / 3));
    let failure = null;
    let pending = Promise.resolve();
    const timer = setInterval(() => {
        if (failure) return;

        pending = pending
            .then(() => renewMigrationLock({ db, ownerId, lockTtlMs }))
            .catch((error) => {
                failure = error;
            });
    }, intervalMs);
    timer.unref?.();

    return {
        assertOwned: async () => {
            await pending;
            if (failure) throw failure;
            await assertMigrationLockOwned({ db, ownerId });
        },
        stop: async () => {
            clearInterval(timer);
            await pending;
        },
    };
}

/**
 * Liberta apenas o lease pertencente ao presente runner.
 *
 * @param {import("mongodb").Db} db - Base atual.
 * @param {string} ownerId - Owner a remover.
 * @returns {Promise<void>}
 */
async function releaseMigrationLock(db, ownerId) {
    await db.collection(MIGRATION_LOCK_COLLECTION).deleteOne({
        _id: "global",
        ownerId,
    });
}

/**
 * Produz dry-run completo sem criar coleções, locks ou registos.
 *
 * @param {{db: import("mongodb").Db, migrations?: object[]}} options - Base e registo.
 * @returns {Promise<object[]>} Análise sanitizada de cada versão pendente.
 */
export async function dryRunMigrations({ db, migrations = MIGRATIONS }) {
    const status = await getMigrationStatus({ db, migrations });
    assertNoChecksumMismatch(status);
    const statusByVersion = new Map(
        status.map((entry) => [entry.version, entry]),
    );
    const result = [];

    for (const migration of migrations) {
        const entry = statusByVersion.get(migration.version);
        result.push({
            version: migration.version,
            state: entry.state,
            analysis:
                entry.state === "pending" ? await migration.analyze(db) : null,
        });
    }

    return result;
}

/**
 * Aplica migrações pendentes uma a uma. O modo normal inclui registo e
 * validação na transação; migrações com DDL usam a fase finalizadora retomável.
 * Repetir o comando devolve `skipped` sem novas escritas.
 *
 * @param {object} options - Dependências explícitas.
 * @param {import("mongodb").MongoClient} options.client - Client do replica set.
 * @param {import("mongodb").Db} options.db - Base local alvo.
 * @param {object[]} [options.migrations] - Registo injetável.
 * @param {Date} [options.now] - Relógio do run.
 * @param {string} [options.ownerId] - Owner opaco do lock.
 * @param {number} [options.lockTtlMs] - Lease do lock.
 * @returns {Promise<object[]>} Resultados sanitizados por versão.
 */
export async function runMigrations({
    client,
    db,
    migrations = MIGRATIONS,
    now = new Date(),
    ownerId = randomUUID(),
    lockTtlMs = DEFAULT_MIGRATION_LOCK_TTL_MS,
}) {
    const status = await getMigrationStatus({ db, migrations });
    assertNoChecksumMismatch(status);

    if (!Number.isSafeInteger(lockTtlMs) || lockTtlMs < 1_000) {
        throw new Error("Lease de migração inválido");
    }

    await ensureMigrationVersionIndex(db);
    const lockNow = new Date();
    await acquireMigrationLock({ db, ownerId, now: lockNow, lockTtlMs });
    const heartbeat = startMigrationLockHeartbeat({ db, ownerId, lockTtlMs });
    const results = [];

    try {
        for (const migration of migrations) {
            await heartbeat.assertOwned();
            const checksum = await calculateMigrationChecksum(migration);
            const existing = await db
                .collection(MIGRATION_COLLECTION)
                .findOne({ version: migration.version });

            if (existing) {
                if (existing.checksum !== checksum) {
                    throw new Error(
                        `Checksum divergente na migração ${migration.version}`,
                    );
                }
                results.push({ version: migration.version, state: "skipped" });
                continue;
            }

            const session = client.startSession();
            let migrationResult;
            const startedAt = performance.now();

            if (
                migration.executionMode ===
                MIGRATION_EXECUTION_MODES.TRANSACTION_THEN_FINALIZE
            ) {
                await session.endSession();
                migrationResult = await runTransactionThenFinalize({
                    client,
                    db,
                    migration,
                    checksum,
                    now,
                    startedAt,
                    assertLockOwned: heartbeat.assertOwned,
                });
                results.push(migrationResult);
                continue;
            }

            try {
                await session.withTransaction(async () => {
                    await heartbeat.assertOwned();
                    const before = await migration.analyze(db, session);
                    const changes = await migration.up({ db, session, now });
                    await heartbeat.assertOwned();
                    const validation = await migration.validate({ db, session });
                    await heartbeat.assertOwned();
                    const durationMs = Math.max(
                        0,
                        Math.round(performance.now() - startedAt),
                    );

                    await db.collection(MIGRATION_COLLECTION).insertOne(
                        {
                            version: migration.version,
                            checksum,
                            appliedAt: now,
                            durationMs,
                        },
                        { session },
                    );
                    migrationResult = {
                        version: migration.version,
                        state: "applied",
                        before,
                        changes,
                        validation,
                        durationMs,
                    };
                }, TRANSACTION_OPTIONS);
            } finally {
                await session.endSession();
            }

            results.push(migrationResult);
        }
    } finally {
        await heartbeat.stop();
        await releaseMigrationLock(db, ownerId);
    }

    return results;
}
