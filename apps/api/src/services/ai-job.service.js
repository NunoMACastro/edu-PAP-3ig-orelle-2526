/**
 * Fila MongoDB idempotente para operações OpenAI.
 *
 * Claim e conclusão usam compare-and-set sobre um lease opaco. Um processo
 * interrompido deixa o job recuperável após a expiração, sem Redis nem estado
 * em memória necessário à continuidade funcional.
 */
import { randomUUID } from "node:crypto";
import { AppError } from "../middlewares/error.middleware.js";
import {
    AiJob,
    AI_JOB_STATUSES,
    AI_JOB_TYPES,
} from "../models/ai-job.model.js";
import {
    AiConsultationSession,
    AI_CONSULTATION_FLOW_STATES,
} from "../models/ai-consultation-session.model.js";

export const DEFAULT_AI_JOB_LEASE_MS = 2 * 60 * 1000;
export const DEFAULT_AI_JOB_POLL_INTERVAL_MS = 1_000;
export const DEFAULT_AI_JOB_HEARTBEAT_INTERVAL_MS = 5_000;
const MAX_AI_JOB_LEASE_RECOVERIES = 3;

const ACTIVE_FLOW_BY_JOB_TYPE = Object.freeze({
    [AI_JOB_TYPES.ANALYZE_PHOTOS]: AI_CONSULTATION_FLOW_STATES.ANALYZING,
    [AI_JOB_TYPES.SELECT_NEXT_QUESTION]:
        AI_CONSULTATION_FLOW_STATES.ASKING_QUESTIONS,
    [AI_JOB_TYPES.GENERATE_REPORT]:
        AI_CONSULTATION_FLOW_STATES.GENERATING_REPORT,
});

function normalizeReference(value, maxLength = 120) {
    const normalized = String(value ?? "").trim();
    return normalized ? normalized.slice(0, maxLength) : null;
}

function sanitizeJobResult(result = {}) {
    return {
        resourceType: normalizeReference(result.resourceType, 80),
        resourceId: normalizeReference(result.resourceId),
        flowState: normalizeReference(result.flowState, 80),
    };
}

async function projectJobFlowState(job, flowState) {
    if (!job?.consultationSessionId || !flowState) return;
    await AiConsultationSession.updateOne(
        {
            _id: job.consultationSessionId,
            userId: job.userId,
            currentJobId: job._id,
            isOpen: true,
        },
        { $set: { flowState } },
    );
}

/** DTO operacional seguro para polling. */
export function toPublicAiJob(job) {
    if (!job) return null;
    return {
        id: String(job._id),
        type: job.type,
        status: job.status,
        attempts: job.attempts,
        maxAttempts: job.maxAttempts,
        availableAt: job.availableAt,
        result: sanitizeJobResult(job.result),
        error: job.lastError?.code
            ? {
                  code: job.lastError.code,
                  retryable: Boolean(job.lastError.retryable),
                  at: job.lastError.at,
              }
            : null,
        createdAt: job.createdAt,
        updatedAt: job.updatedAt,
    };
}

/** Enfileira uma operação ou devolve o job já existente. */
export async function enqueueAiJob(
    {
        type,
        userId,
        consultationSessionId = null,
        resourceType = null,
        resourceId = null,
        deduplicationKey,
        maxAttempts = 4,
        availableAt = new Date(),
    },
    { session = null } = {},
) {
    if (!Object.values(AI_JOB_TYPES).includes(type)) {
        throw new TypeError("Tipo de job IA inválido");
    }
    const normalizedDeduplicationKey = normalizeReference(deduplicationKey, 160);
    if (!userId || !normalizedDeduplicationKey) {
        throw new TypeError("Referências obrigatórias do job IA em falta");
    }
    if (!Number.isInteger(maxAttempts) || maxAttempts < 1 || maxAttempts > 10) {
        throw new TypeError("Número máximo de tentativas do job IA inválido");
    }

    try {
        await AiJob.updateOne(
            { deduplicationKey: normalizedDeduplicationKey },
            {
                $setOnInsert: {
                    type,
                    userId,
                    consultationSessionId,
                    resourceType: normalizeReference(resourceType, 80),
                    resourceId: normalizeReference(resourceId),
                    deduplicationKey: normalizedDeduplicationKey,
                    status: AI_JOB_STATUSES.QUEUED,
                    attempts: 0,
                    maxAttempts,
                    availableAt,
                },
            },
            { upsert: true, ...(session ? { session } : {}) },
        );
    } catch (error) {
        // Dois upserts podem observar simultaneamente a ausência. O índice
        // único decide; o perdedor relê o job vencedor em vez de falhar.
        if (error?.code !== 11000) throw error;
    }

    let query = AiJob.findOne({ deduplicationKey: normalizedDeduplicationKey });
    if (session) query = query.session(session);
    return query;
}

/** Recupera um job sem permitir enumeração entre utilizadores. */
export async function getOwnedAiJob(userId, jobId) {
    const job = await AiJob.findOne({ _id: jobId, userId });
    if (!job) throw new AppError(404, "Operação IA não encontrada");
    return toPublicAiJob(job);
}

/** Claim atómico de um job elegível ou de um lease expirado. */
export async function claimNextAiJob({
    workerId,
    types = Object.values(AI_JOB_TYPES),
    now = new Date(),
    leaseMs = DEFAULT_AI_JOB_LEASE_MS,
} = {}) {
    const normalizedWorkerId = normalizeReference(workerId ?? `worker-${process.pid}`);
    const token = randomUUID();
    const expiresAt = new Date(now.getTime() + leaseMs);

    const leaseFields = {
        status: AI_JOB_STATUSES.PROCESSING,
        "lease.token": token,
        "lease.workerId": normalizedWorkerId,
        "lease.expiresAt": expiresAt,
        startedAt: now,
        "lastError.code": null,
        "lastError.retryable": false,
        "lastError.at": null,
    };

    // Uma lease expirada representa uma tentativa interrompida, não uma nova
    // chamada funcional. Recupera primeiro o mesmo attempt, mesmo quando este
    // já era o último permitido, para que um restart nunca deixe `processing`
    // eterno. O contador separado impede crashes infinitos silenciosos.
    const recovered = await AiJob.findOneAndUpdate(
        {
            type: { $in: types },
            status: AI_JOB_STATUSES.PROCESSING,
            "lease.expiresAt": { $lte: now },
            $or: [
                { leaseRecoveryCount: { $lt: MAX_AI_JOB_LEASE_RECOVERIES } },
                { leaseRecoveryCount: { $exists: false } },
            ],
        },
        {
            $set: leaseFields,
            $inc: { leaseRecoveryCount: 1 },
        },
        { new: true, sort: { availableAt: 1, createdAt: 1 } },
    ).select("+deduplicationKey +lease.token +lease.workerId");
    if (recovered) return recovered;

    // Um job que perdeu três workers deixa de ficar preso: passa para o estado
    // repetível explícito e exige ação do titular, que reinicia os contadores.
    const exhaustedFilter = {
        type: { $in: types },
        status: AI_JOB_STATUSES.PROCESSING,
        "lease.expiresAt": { $lte: now },
        leaseRecoveryCount: { $gte: MAX_AI_JOB_LEASE_RECOVERIES },
    };
    const exhaustedJobs = await AiJob.find(exhaustedFilter).select(
        "_id userId consultationSessionId",
    );
    await AiJob.updateMany(
        exhaustedFilter,
        {
            $set: {
                status: AI_JOB_STATUSES.FAILED_RETRYABLE,
                availableAt: now,
                "lastError.code": "AI_JOB_LEASE_RECOVERY_EXHAUSTED",
                "lastError.retryable": true,
                "lastError.at": now,
                "lease.token": null,
                "lease.workerId": null,
                "lease.expiresAt": null,
            },
        },
    );
    await Promise.all(
        exhaustedJobs.map((job) =>
            projectJobFlowState(
                job,
                AI_CONSULTATION_FLOW_STATES.FAILED_RETRYABLE,
            ),
        ),
    );

    return AiJob.findOneAndUpdate(
        {
            type: { $in: types },
            status: {
                $in: [
                    AI_JOB_STATUSES.QUEUED,
                    AI_JOB_STATUSES.FAILED_RETRYABLE,
                ],
            },
            availableAt: { $lte: now },
            $expr: { $lt: ["$attempts", "$maxAttempts"] },
        },
        {
            $set: leaseFields,
            $inc: { attempts: 1 },
        },
        { new: true, sort: { availableAt: 1, createdAt: 1 } },
    ).select("+deduplicationKey +lease.token +lease.workerId");
}

/** Conclui apenas se o lease ainda pertence ao worker atual. */
export async function completeAiJob(job, result = {}, { now = new Date() } = {}) {
    const update = await AiJob.updateOne(
        {
            _id: job._id,
            status: AI_JOB_STATUSES.PROCESSING,
            "lease.token": job.lease?.token,
        },
        {
            $set: {
                status: AI_JOB_STATUSES.COMPLETED,
                result: sanitizeJobResult(result),
                completedAt: now,
                terminalAt: now,
                "lease.token": null,
                "lease.workerId": null,
                "lease.expiresAt": null,
            },
        },
    );
    if (update.modifiedCount !== 1) throw new Error("Lease do job IA perdido");
}

/**
 * Renova o lease enquanto uma chamada OpenAI/codec ainda está em curso.
 *
 * @param {object} job - Job reclamado com token privado selecionado.
 * @param {{now?: Date, leaseMs?: number}} [options] - Relógio e janela injetáveis.
 * @returns {Promise<boolean>} Verdadeiro quando o lease ainda pertence ao worker.
 */
export async function renewAiJobLease(
    job,
    { now = new Date(), leaseMs = DEFAULT_AI_JOB_LEASE_MS } = {},
) {
    const update = await AiJob.updateOne(
        {
            _id: job._id,
            status: AI_JOB_STATUSES.PROCESSING,
            "lease.token": job.lease?.token,
        },
        {
            $set: {
                "lease.expiresAt": new Date(now.getTime() + leaseMs),
            },
        },
    );
    return update.modifiedCount === 1;
}

/** Marca falha sanitizada e calcula quando pode voltar a ser reclamada. */
export async function failAiJob(
    job,
    error,
    { retryable = Boolean(error?.details?.retryable ?? error?.transient), now = new Date() } = {},
) {
    const canAutoRetry = retryable && job.attempts < job.maxAttempts;
    const delayMs = Math.min(30_000, 1_000 * 2 ** Math.max(0, job.attempts - 1));
    const status = retryable
        ? AI_JOB_STATUSES.FAILED_RETRYABLE
        : AI_JOB_STATUSES.FAILED_TERMINAL;
    const update = await AiJob.updateOne(
        {
            _id: job._id,
            status: AI_JOB_STATUSES.PROCESSING,
            "lease.token": job.lease?.token,
        },
        {
            $set: {
                status,
                availableAt: canAutoRetry
                    ? new Date(now.getTime() + delayMs)
                    : now,
                "lastError.code": normalizeReference(
                    error?.details?.code ?? error?.code ?? "AI_JOB_FAILED",
                    80,
                ),
                "lastError.retryable": retryable,
                "lastError.at": now,
                terminalAt: retryable ? null : now,
                "lease.token": null,
                "lease.workerId": null,
                "lease.expiresAt": null,
            },
        },
    );
    if (update.modifiedCount !== 1) throw new Error("Lease do job IA perdido");
    return status;
}

/** Reabre explicitamente apenas uma falha retryable pertencente ao utilizador. */
export async function retryOwnedAiJob(userId, jobId, { now = new Date() } = {}) {
    const job = await AiJob.findOneAndUpdate(
        {
            _id: jobId,
            userId,
            status: {
                $in: [
                    AI_JOB_STATUSES.FAILED_RETRYABLE,
                    AI_JOB_STATUSES.FAILED_TERMINAL,
                ],
            },
            manualRetryCount: { $lt: 2 },
        },
        {
            $set: {
                status: AI_JOB_STATUSES.QUEUED,
                availableAt: now,
                attempts: 0,
                leaseRecoveryCount: 0,
                terminalAt: null,
                "lastError.code": null,
                "lastError.retryable": false,
                "lastError.at": null,
            },
            $inc: { manualRetryCount: 1 },
        },
        { new: true },
    );
    if (!job) throw new AppError(409, "A operação IA não pode ser repetida");
    return toPublicAiJob(job);
}

/** Cancela trabalho ainda não concluído quando a finalidade deixa de existir. */
export async function cancelAiJobsForUser(
    userId,
    { consultationSessionId = null, now = new Date(), session = null } = {},
) {
    const filter = {
        userId,
        status: { $in: [AI_JOB_STATUSES.QUEUED, AI_JOB_STATUSES.PROCESSING, AI_JOB_STATUSES.FAILED_RETRYABLE] },
        ...(consultationSessionId ? { consultationSessionId } : {}),
    };
    return AiJob.updateMany(
        filter,
        {
            $set: {
                status: AI_JOB_STATUSES.CANCELLED,
                cancelledAt: now,
                terminalAt: now,
                "lease.token": null,
                "lease.workerId": null,
                "lease.expiresAt": null,
            },
        },
        session ? { session } : undefined,
    );
}

/** Processa no máximo um job; útil para loop e testes determinísticos. */
export async function runAiJobWorkerOnce({ handlers, workerId, types, now, leaseMs } = {}) {
    const job = await claimNextAiJob({ workerId, types, now, leaseMs });
    if (!job) return { claimed: false, jobId: null, status: null };
    await projectJobFlowState(job, ACTIVE_FLOW_BY_JOB_TYPE[job.type]);
    const handler = handlers?.[job.type];
    const effectiveLeaseMs = leaseMs ?? DEFAULT_AI_JOB_LEASE_MS;
    const heartbeatIntervalMs = Math.max(
        1_000,
        Math.min(
            DEFAULT_AI_JOB_HEARTBEAT_INTERVAL_MS,
            Math.floor(effectiveLeaseMs / 3),
        ),
    );
    let heartbeatFailure = null;
    const operationController = new AbortController();
    const heartbeat = setInterval(() => {
        void renewAiJobLease(job, { leaseMs: effectiveLeaseMs })
            .then((renewed) => {
                if (!renewed) {
                    heartbeatFailure = new Error("Lease do job IA perdido");
                    operationController.abort(heartbeatFailure);
                }
            })
            .catch(() => {
                heartbeatFailure = new Error("Lease do job IA não foi renovado");
                operationController.abort(heartbeatFailure);
            });
    }, heartbeatIntervalMs);
    heartbeat.unref?.();

    try {
        if (typeof handler !== "function") {
            const error = new Error("Handler do job IA indisponível");
            error.code = "AI_JOB_HANDLER_MISSING";
            throw error;
        }
        const result = await handler(job, {
            signal: operationController.signal,
        });
        if (heartbeatFailure) throw heartbeatFailure;
        await completeAiJob(job, result);
        return { claimed: true, jobId: String(job._id), status: AI_JOB_STATUSES.COMPLETED };
    } catch (error) {
        if (operationController.signal.aborted) {
            return {
                claimed: true,
                jobId: String(job._id),
                status: AI_JOB_STATUSES.CANCELLED,
            };
        }
        const status = await failAiJob(job, error);
        const automaticRetryScheduled =
            status === AI_JOB_STATUSES.FAILED_RETRYABLE &&
            job.attempts < job.maxAttempts;
        if (!automaticRetryScheduled) {
            await projectJobFlowState(
                job,
                AI_CONSULTATION_FLOW_STATES.FAILED_RETRYABLE,
            );
        }
        return { claimed: true, jobId: String(job._id), status };
    } finally {
        clearInterval(heartbeat);
    }
}

/** Inicia polling leve; `stop()` aguarda o trabalho já reclamado. */
export function startAiJobWorker({
    handlers,
    workerId = `orelle-${process.pid}-${randomUUID()}`,
    types,
    pollIntervalMs = DEFAULT_AI_JOB_POLL_INTERVAL_MS,
    logger = console,
} = {}) {
    let stopped = false;
    let timer = null;
    let pending = Promise.resolve();

    const schedule = () => {
        if (stopped) return;
        timer = setTimeout(() => {
            pending = runAiJobWorkerOnce({ handlers, workerId, types })
                .catch(() => logger.error("Falha sanitizada no worker IA"))
                .finally(schedule);
        }, pollIntervalMs);
        timer.unref?.();
    };
    schedule();

    return {
        async stop() {
            stopped = true;
            if (timer) clearTimeout(timer);
            await pending;
        },
    };
}
