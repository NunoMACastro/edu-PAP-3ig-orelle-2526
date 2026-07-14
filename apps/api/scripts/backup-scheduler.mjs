/**
 * Scheduler opcional do backup académico/local.
 *
 * Só arranca com `runtimeMode="dev:local"` e opt-in explícito. A função recebe
 * o job por injeção para permanecer testável sem temporizadores reais.
 */
export const LOCAL_BACKUP_INTERVAL_MS = 24 * 60 * 60 * 1000;

/**
 * Inicia a execução diária explicitamente autorizada.
 *
 * @param {{runtimeMode: string, enabled: boolean, runJob: () => Promise<unknown>, setIntervalFn?: typeof setInterval, clearIntervalFn?: typeof clearInterval, onError?: (error: unknown) => void}} options - Configuração local.
 * @returns {{started: false, timer: null}|{started: true, timer: ReturnType<typeof setInterval>, stop: () => Promise<void>}} Estado do scheduler.
 */
export function startLocalBackupScheduler({
    runtimeMode,
    enabled,
    runJob,
    setIntervalFn = setInterval,
    clearIntervalFn = clearInterval,
    onError = () => undefined,
}) {
    if (runtimeMode !== "dev:local" || enabled !== true) {
        return { started: false, timer: null };
    }

    if (typeof runJob !== "function") {
        throw new Error("Scheduler local exige um job de backup");
    }

    let activeJob = null;
    let stopping = false;
    const runScheduledJob = () => {
        if (stopping) return Promise.resolve();
        if (activeJob) return activeJob;

        activeJob = Promise.resolve()
            .then(runJob)
            .catch((error) => onError(error))
            .finally(() => {
                activeJob = null;
            });
        return activeJob;
    };
    const timer = setIntervalFn(
        runScheduledJob,
        LOCAL_BACKUP_INTERVAL_MS,
    );
    timer?.unref?.();

    return {
        started: true,
        timer,
        async stop() {
            stopping = true;
            clearIntervalFn(timer);
            await activeJob;
        },
    };
}
