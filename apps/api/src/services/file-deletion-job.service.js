/**
 * Processador idempotente do outbox de eliminação física.
 *
 * O enfileiramento pode participar na mesma transação MongoDB que retira o
 * recurso da operação normal. A operação de filesystem ocorre depois do
 * commit e confirma explicitamente que os bytes deixaram de existir.
 */
import { createHash, randomUUID } from "node:crypto";
import { stat, unlink } from "node:fs/promises";
import {
    FILE_DELETION_JOB_STATUSES,
    FileDeletionJob,
} from "../models/file-deletion-job.model.js";

export const DEFAULT_FILE_DELETION_LEASE_MS = 2 * 60 * 1000;
export const MAX_FILE_DELETION_RETRY_DELAY_MS = 60 * 60 * 1000;
const MAX_STORAGE_KEY_LENGTH = 4096;
const SAFE_DELETION_ERROR =
    "Não foi possível confirmar a eliminação física do ficheiro privado.";

/**
 * Normaliza IDs sem incluir documentos ou metadados adicionais.
 *
 * @function normalizeIdentifier
 * @param {unknown} value - ObjectId ou identificador textual.
 * @returns {string} Identificador limitado.
 */
function normalizeIdentifier(value) {
    return String(value ?? "").trim().slice(0, 120);
}

/**
 * Calcula uma chave opaca e estável sem persistir o path em índices públicos.
 *
 * @function buildFileDeletionDeduplicationKey
 * @param {{sourceType: unknown, sourceId: unknown, storageKey: unknown}} entry - Trabalho a deduplicar.
 * @returns {string} SHA-256 hexadecimal.
 */
export function buildFileDeletionDeduplicationKey(entry) {
    return createHash("sha256")
        .update(normalizeIdentifier(entry.sourceType))
        .update("\0")
        .update(normalizeIdentifier(entry.sourceId))
        .update("\0")
        .update(String(entry.storageKey ?? ""))
        .digest("hex");
}

/**
 * Enfileira eliminações de forma idempotente na transação fornecida.
 *
 * @async
 * @function enqueueFileDeletionJobs
 * @param {Array<{sourceType: string, sourceId: unknown, ownerId: unknown, storageKey: string}>} entries - Ficheiros privados a remover.
 * @param {{session?: import("mongoose").ClientSession|null, availableAt?: Date}} [options] - Sessão e relógio transacional opcionais.
 * @returns {Promise<{enqueued: number}>} Quantidade de entradas submetidas.
 */
export async function enqueueFileDeletionJobs(
    entries,
    { session = null, availableAt = new Date() } = {},
) {
    if (!Array.isArray(entries)) {
        throw new TypeError("A lista de eliminações físicas é inválida.");
    }
    if (
        !(availableAt instanceof Date) ||
        Number.isNaN(availableAt.getTime())
    ) {
        throw new TypeError("Relógio da eliminação física inválido.");
    }

    const normalizedEntries = entries.map((entry) => {
        const sourceType = normalizeIdentifier(entry?.sourceType).slice(0, 80);
        const sourceId = normalizeIdentifier(entry?.sourceId);
        const storageKey =
            typeof entry?.storageKey === "string" ? entry.storageKey : "";

        // Nunca ignorar silenciosamente metadados incompletos: fazê-lo poderia
        // eliminar o documento de origem e deixar bytes privados órfãos.
        if (
            !sourceType ||
            !sourceId ||
            !entry?.ownerId ||
            !storageKey ||
            storageKey.includes("\0") ||
            storageKey.length > MAX_STORAGE_KEY_LENGTH
        ) {
            throw new TypeError("Metadados de eliminação física inválidos.");
        }

        return {
            deduplicationKey: buildFileDeletionDeduplicationKey({
                sourceType,
                sourceId,
                storageKey,
            }),
            sourceType,
            sourceId,
            ownerId: entry.ownerId,
            storageKey,
        };
    });

    if (!normalizedEntries.length) return { enqueued: 0 };

    await FileDeletionJob.bulkWrite(
        normalizedEntries.map((entry) => ({
            updateOne: {
                filter: { deduplicationKey: entry.deduplicationKey },
                update: {
                    $setOnInsert: {
                        ...entry,
                        status: FILE_DELETION_JOB_STATUSES.PENDING,
                        attempts: 0,
                        availableAt,
                    },
                },
                upsert: true,
            },
        })),
        session ? { session } : undefined,
    );

    return { enqueued: normalizedEntries.length };
}

/**
 * Reatribui trabalho antigo de um titular ao workflow destrutivo atual.
 *
 * A operação corre na mesma transação que o tombstone. Primeiro cria jobs
 * idempotentes na nova origem e só depois remove as entradas supersedidas;
 * assim, metadata já eliminada noutro domínio não pode deixar bytes órfãos.
 *
 * @param {{ownerId: unknown, sourceType: string, sourceId: unknown}} input - Nova origem canónica.
 * @param {{session: import("mongoose").ClientSession}} options - Sessão transacional obrigatória.
 * @returns {Promise<{reclaimed: number, superseded: number}>} Contagens sanitizadas.
 */
export async function reclaimFileDeletionJobsForOwner(
    { ownerId, sourceType, sourceId },
    { session },
) {
    const normalizedSourceType = normalizeIdentifier(sourceType).slice(0, 80);
    const normalizedSourceId = normalizeIdentifier(sourceId);
    const jobs = await FileDeletionJob.find({
        ownerId,
        status: { $ne: FILE_DELETION_JOB_STATUSES.COMPLETED },
    })
        .select("+storageKey")
        .session(session)
        .lean();

    if (!jobs.length) return { reclaimed: 0, superseded: 0 };
    if (jobs.some((job) => !job.storageKey)) {
        throw new Error("Job de eliminação pendente sem path recuperável.");
    }

    await enqueueFileDeletionJobs(
        jobs.map((job) => ({
            sourceType: normalizedSourceType,
            sourceId: normalizedSourceId,
            ownerId,
            storageKey: job.storageKey,
        })),
        { session },
    );

    const supersededIds = jobs
        .filter(
            (job) =>
                job.sourceType !== normalizedSourceType ||
                job.sourceId !== normalizedSourceId,
        )
        .map((job) => job._id);
    if (supersededIds.length) {
        await FileDeletionJob.deleteMany(
            { _id: { $in: supersededIds } },
            { session },
        );
    }

    return {
        reclaimed: jobs.length,
        superseded: supersededIds.length,
    };
}

/**
 * Confirma que um path já não existe.
 *
 * @async
 * @function isFilePhysicallyAbsent
 * @param {string} storageKey - Path privado apenas usado no worker.
 * @param {(path: string) => Promise<unknown>} statFile - Adaptador injetável.
 * @returns {Promise<boolean>} True apenas perante ENOENT.
 */
export async function isFilePhysicallyAbsent(storageKey, statFile = stat) {
    try {
        await statFile(storageKey);
        return false;
    } catch (error) {
        if (error?.code === "ENOENT") return true;
        throw error;
    }
}

/**
 * Tenta remover um ficheiro e confirma o estado final no filesystem.
 *
 * @async
 * @function deleteAndConfirmFile
 * @param {string} storageKey - Path privado selecionado explicitamente.
 * @param {{unlinkFile?: (path: string) => Promise<void>, statFile?: (path: string) => Promise<unknown>, afterUnlink?: (path: string) => Promise<void>}} [adapters] - Adaptadores para testes de falha.
 * @returns {Promise<void>} Termina apenas quando o ficheiro está ausente.
 */
export async function deleteAndConfirmFile(
    storageKey,
    { unlinkFile = unlink, statFile = stat, afterUnlink } = {},
) {
    try {
        await unlinkFile(storageKey);
    } catch (error) {
        if (error?.code !== "ENOENT") throw error;
    }

    if (afterUnlink) await afterUnlink(storageKey);

    if (!(await isFilePhysicallyAbsent(storageKey, statFile))) {
        throw new Error(SAFE_DELETION_ERROR);
    }
}

function retryDelayForAttempt(attempts) {
    const exponent = Math.max(0, Math.min(16, Number(attempts ?? 1) - 1));
    return Math.min(
        MAX_FILE_DELETION_RETRY_DELAY_MS,
        1_000 * 2 ** exponent,
    );
}

/**
 * Reclama o próximo trabalho global elegível, incluindo leases abandonados.
 * O path só é selecionado no documento privado devolvido ao worker.
 *
 * @param {{now?: Date, leaseMs?: number, leaseToken?: string}} [options] - Relógio e lease injetáveis.
 * @returns {Promise<object|null>} Job privado reclamado ou `null`.
 */
export async function claimNextFileDeletionJob({
    now = new Date(),
    leaseMs = DEFAULT_FILE_DELETION_LEASE_MS,
    leaseToken = randomUUID(),
} = {}) {
    const expiresAt = new Date(now.getTime() + leaseMs);
    return FileDeletionJob.findOneAndUpdate(
        {
            $or: [
                {
                    status: {
                        $in: [
                            FILE_DELETION_JOB_STATUSES.PENDING,
                            FILE_DELETION_JOB_STATUSES.FAILED,
                        ],
                    },
                    $or: [
                        { availableAt: { $lte: now } },
                        { availableAt: null },
                        { availableAt: { $exists: false } },
                    ],
                },
                {
                    status: FILE_DELETION_JOB_STATUSES.PROCESSING,
                    "lease.expiresAt": { $lte: now },
                },
            ],
        },
        {
            $set: {
                status: FILE_DELETION_JOB_STATUSES.PROCESSING,
                "lease.token": leaseToken,
                "lease.expiresAt": expiresAt,
                lastError: "",
                lastAttemptAt: now,
            },
            $inc: { attempts: 1 },
        },
        { new: true, sort: { availableAt: 1, createdAt: 1 } },
    )
        .select("+storageKey +lease.token")
        .lean();
}

/**
 * Processa no máximo um job global. Falhas de filesystem ficam persistidas
 * com backoff; falhas de base são propagadas ao loop operacional.
 *
 * @param {{now?: Date, leaseMs?: number, leaseToken?: string, unlinkFile?: Function, statFile?: Function, afterUnlink?: Function}} [options] - Adaptadores e relógio.
 * @returns {Promise<{claimed: boolean, completed: boolean, failed: boolean, leaseLost: boolean}>} Resultado sem paths.
 */
export async function processNextFileDeletionJob({
    now = new Date(),
    leaseMs = DEFAULT_FILE_DELETION_LEASE_MS,
    leaseToken = randomUUID(),
    unlinkFile = unlink,
    statFile = stat,
    afterUnlink,
} = {}) {
    const job = await claimNextFileDeletionJob({ now, leaseMs, leaseToken });
    if (!job) {
        return {
            claimed: false,
            completed: false,
            failed: false,
            leaseLost: false,
        };
    }

    try {
        await deleteAndConfirmFile(job.storageKey, {
            unlinkFile,
            statFile,
            afterUnlink,
        });
        const completed = await FileDeletionJob.updateOne(
            {
                _id: job._id,
                status: FILE_DELETION_JOB_STATUSES.PROCESSING,
                "lease.token": leaseToken,
            },
            {
                $set: {
                    status: FILE_DELETION_JOB_STATUSES.COMPLETED,
                    completedAt: now,
                    terminalAt: now,
                    lastError: "",
                    "lease.expiresAt": null,
                },
                $unset: {
                    ownerId: "",
                    storageKey: "",
                    sourceType: "",
                    sourceId: "",
                    "lease.token": "",
                },
            },
        );
        return {
            claimed: true,
            completed: completed.modifiedCount === 1,
            failed: false,
            leaseLost: completed.modifiedCount !== 1,
        };
    } catch {
        const failed = await FileDeletionJob.updateOne(
            {
                _id: job._id,
                status: FILE_DELETION_JOB_STATUSES.PROCESSING,
                "lease.token": leaseToken,
            },
            {
                $set: {
                    status: FILE_DELETION_JOB_STATUSES.FAILED,
                    availableAt: new Date(
                        now.getTime() + retryDelayForAttempt(job.attempts),
                    ),
                    lastError: SAFE_DELETION_ERROR,
                    "lease.token": null,
                    "lease.expiresAt": null,
                },
            },
        );
        return {
            claimed: true,
            completed: false,
            failed: failed.modifiedCount === 1,
            leaseLost: failed.modifiedCount !== 1,
        };
    }
}

/**
 * Processa os jobs de uma origem, com lease e compare-and-set por job.
 *
 * @async
 * @function processFileDeletionJobs
 * @param {{sourceType: string, sourceId: unknown, now?: Date, leaseMs?: number, leaseToken?: string, unlinkFile?: (path: string) => Promise<void>, statFile?: (path: string) => Promise<unknown>, afterUnlink?: (path: string) => Promise<void>}} input - Origem e adaptadores do worker.
 * @returns {Promise<{claimed: number, completed: number, failed: number, outstanding: number}>} Resultado sanitizado do processamento.
 */
export async function processFileDeletionJobs({
    sourceType,
    sourceId,
    now = new Date(),
    leaseMs = DEFAULT_FILE_DELETION_LEASE_MS,
    leaseToken = randomUUID(),
    unlinkFile = unlink,
    statFile = stat,
    afterUnlink,
}) {
    const normalizedSourceType = normalizeIdentifier(sourceType).slice(0, 80);
    const normalizedSourceId = normalizeIdentifier(sourceId);
    const expiresAt = new Date(now.getTime() + leaseMs);
    const candidates = await FileDeletionJob.find({
        sourceType: normalizedSourceType,
        sourceId: normalizedSourceId,
        status: { $ne: FILE_DELETION_JOB_STATUSES.COMPLETED },
    })
        .select("_id")
        .lean();
    const summary = { claimed: 0, completed: 0, failed: 0, outstanding: 0 };

    for (const candidate of candidates) {
        const job = await FileDeletionJob.findOneAndUpdate(
            {
                _id: candidate._id,
                $or: [
                    {
                        status: {
                            $in: [
                                FILE_DELETION_JOB_STATUSES.PENDING,
                                FILE_DELETION_JOB_STATUSES.FAILED,
                            ],
                        },
                    },
                    {
                        status: FILE_DELETION_JOB_STATUSES.PROCESSING,
                        "lease.expiresAt": { $lte: now },
                    },
                ],
            },
            {
                $set: {
                    status: FILE_DELETION_JOB_STATUSES.PROCESSING,
                    "lease.token": leaseToken,
                    "lease.expiresAt": expiresAt,
                    lastError: "",
                    lastAttemptAt: now,
                },
                $inc: { attempts: 1 },
            },
            { new: true },
        )
            .select("+storageKey +lease.token")
            .lean();

        if (!job) continue;
        summary.claimed += 1;

        try {
            await deleteAndConfirmFile(job.storageKey, {
                unlinkFile,
                statFile,
                afterUnlink,
            });

            const completed = await FileDeletionJob.updateOne(
                {
                    _id: job._id,
                    status: FILE_DELETION_JOB_STATUSES.PROCESSING,
                    "lease.token": leaseToken,
                },
                {
                    $set: {
                        status: FILE_DELETION_JOB_STATUSES.COMPLETED,
                        completedAt: now,
                        terminalAt: now,
                        lastError: "",
                        "lease.expiresAt": null,
                    },
                    $unset: {
                        ownerId: "",
                        storageKey: "",
                        sourceType: "",
                        sourceId: "",
                        "lease.token": "",
                    },
                },
            );

            if (completed.modifiedCount === 1) summary.completed += 1;
        } catch {
            await FileDeletionJob.updateOne(
                {
                    _id: job._id,
                    status: FILE_DELETION_JOB_STATUSES.PROCESSING,
                    "lease.token": leaseToken,
                },
                {
                    $set: {
                        status: FILE_DELETION_JOB_STATUSES.FAILED,
                        availableAt: new Date(
                            now.getTime() + retryDelayForAttempt(job.attempts),
                        ),
                        lastError: SAFE_DELETION_ERROR,
                        "lease.token": null,
                        "lease.expiresAt": null,
                    },
                },
            );
            summary.failed += 1;
        }
    }

    summary.outstanding = await FileDeletionJob.countDocuments({
        sourceType: normalizedSourceType,
        sourceId: normalizedSourceId,
        status: { $ne: FILE_DELETION_JOB_STATUSES.COMPLETED },
    });

    return summary;
}

/**
 * Confirma que todos os jobs de uma origem terminaram.
 *
 * @async
 * @function areFileDeletionJobsCompleted
 * @param {{sourceType: string, sourceId: unknown}} input - Origem do workflow.
 * @param {{session?: import("mongoose").ClientSession|null}} [options] - Sessão opcional.
 * @returns {Promise<boolean>} True quando não há trabalho pendente/falhado.
 */
export async function areFileDeletionJobsCompleted(
    { sourceType, sourceId },
    { session = null } = {},
) {
    const outstanding = await FileDeletionJob.countDocuments({
        sourceType: normalizeIdentifier(sourceType).slice(0, 80),
        sourceId: normalizeIdentifier(sourceId),
        status: { $ne: FILE_DELETION_JOB_STATUSES.COMPLETED },
    }).session(session);

    return outstanding === 0;
}
