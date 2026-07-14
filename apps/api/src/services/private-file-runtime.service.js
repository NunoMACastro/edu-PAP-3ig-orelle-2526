/**
 * Runtime durável dos ficheiros privados.
 *
 * Um único loop por processo executa o sweep de outputs expirados e consome o
 * outbox global de eliminações. Todo o estado recuperável vive no MongoDB; o
 * temporizador apenas reduz a latência e pode desaparecer num restart.
 */
import { processNextFileDeletionJob } from "./file-deletion-job.service.js";
import { expireMakeupSimulationOutputs } from "./makeup-simulation.service.js";

export const PRIVATE_FILE_POLL_INTERVAL_MS = 1_000;
export const PRIVATE_FILE_EXPIRY_SWEEP_INTERVAL_MS = 60_000;
export const PRIVATE_FILE_MAX_JOBS_PER_TICK = 25;

/**
 * Executa uma unidade limitada de manutenção sem manter estado em memória.
 *
 * @param {{now?: Date, performExpirySweep?: boolean, maxJobs?: number, sweepExpiredOutputs?: Function, processNextDeletion?: Function}} [options] - Relógio e dependências injetáveis.
 * @returns {Promise<{expiredOutputs: number, claimed: number, completed: number, failed: number}>} Resumo sanitizado.
 */
export async function runPrivateFileMaintenanceOnce({
    now = new Date(),
    performExpirySweep = true,
    maxJobs = PRIVATE_FILE_MAX_JOBS_PER_TICK,
    sweepExpiredOutputs = expireMakeupSimulationOutputs,
    processNextDeletion = processNextFileDeletionJob,
} = {}) {
    if (!Number.isInteger(maxJobs) || maxJobs < 1 || maxJobs > 500) {
        throw new TypeError("Limite do worker de ficheiros privados inválido");
    }
    const expiry = performExpirySweep
        ? await sweepExpiredOutputs(now)
        : { expired: 0 };
    const summary = {
        expiredOutputs: Number(expiry?.expired ?? 0),
        claimed: 0,
        completed: 0,
        failed: 0,
    };

    for (let index = 0; index < maxJobs; index += 1) {
        const result = await processNextDeletion({ now });
        if (!result.claimed) break;
        summary.claimed += 1;
        if (result.completed) summary.completed += 1;
        if (result.failed) summary.failed += 1;
    }
    return summary;
}

/**
 * Inicia polling serial, recuperável e terminável pelo shutdown do servidor.
 *
 * @param {{logger?: Pick<Console, "error">, pollIntervalMs?: number, expirySweepIntervalMs?: number, initialDelayMs?: number, nowFn?: () => Date, setTimeoutFn?: typeof setTimeout, clearTimeoutFn?: typeof clearTimeout, runMaintenance?: Function}} [options] - Configuração operacional injetável.
 * @returns {{stop: () => Promise<void>}} Handle de shutdown idempotente.
 */
export function startPrivateFileRuntimeWorker({
    logger = console,
    pollIntervalMs = PRIVATE_FILE_POLL_INTERVAL_MS,
    expirySweepIntervalMs = PRIVATE_FILE_EXPIRY_SWEEP_INTERVAL_MS,
    initialDelayMs = 250,
    nowFn = () => new Date(),
    setTimeoutFn = setTimeout,
    clearTimeoutFn = clearTimeout,
    runMaintenance = runPrivateFileMaintenanceOnce,
} = {}) {
    if (
        !Number.isInteger(pollIntervalMs) ||
        pollIntervalMs < 10 ||
        !Number.isInteger(expirySweepIntervalMs) ||
        expirySweepIntervalMs < 1_000 ||
        !Number.isInteger(initialDelayMs) ||
        initialDelayMs < 0
    ) {
        throw new TypeError("Intervalos do worker de ficheiros privados inválidos");
    }

    let timer = null;
    let activeRun = null;
    let stopping = false;
    let nextExpirySweepAt = 0;

    const schedule = (delayMs) => {
        if (stopping) return;
        timer = setTimeoutFn(runTick, delayMs);
        timer?.unref?.();
    };

    const runTick = () => {
        if (stopping || activeRun) return activeRun ?? Promise.resolve();
        const now = nowFn();
        const performExpirySweep = now.getTime() >= nextExpirySweepAt;
        if (performExpirySweep) {
            nextExpirySweepAt = now.getTime() + expirySweepIntervalMs;
        }
        activeRun = Promise.resolve()
            .then(() => runMaintenance({ now, performExpirySweep }))
            .catch(() => {
                logger.error("Falha numa iteração do worker de ficheiros privados");
            })
            .finally(() => {
                activeRun = null;
                schedule(pollIntervalMs);
            });
        return activeRun;
    };

    schedule(initialDelayMs);

    let stopPromise = null;
    return {
        stop() {
            if (stopPromise) return stopPromise;
            stopping = true;
            if (timer) clearTimeoutFn(timer);
            stopPromise = Promise.resolve(activeRun).then(() => undefined);
            return stopPromise;
        },
    };
}
