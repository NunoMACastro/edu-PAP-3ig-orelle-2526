/**
 * Entrada do servidor HTTP da API Orélle.
 *
 * Liga ao MongoDB, abre a porta HTTP e encerra servidor/ligação de forma
 * graciosa. A configuração das rotas fica em `app.js`.
 */
import { pathToFileURL } from "node:url";
import { connectDB, disconnectDB } from "./config/db.js";
import { env } from "./config/env.js";
import { createApp } from "./app.js";
import { startAiRuntimeWorker } from "./services/ai-worker-runtime.service.js";
import { startPrivateFileRuntimeWorker } from "./services/private-file-runtime.service.js";

export const DEFAULT_SHUTDOWN_TIMEOUT_MS = 10_000;

/**
 * Abre o listener HTTP e só resolve depois de o sistema operativo confirmar
 * que a porta ficou disponível. Erros de bind são propagados ao chamador em
 * vez de deixarem um runtime parcialmente iniciado.
 *
 * @param {object} options - Dependências do arranque HTTP.
 * @param {import("express").Express} options.app - Aplicação Express.
 * @param {number|import("node:net").ListenOptions} options.listenTarget - Porta ou opções de escuta.
 * @returns {Promise<import("node:http").Server>} Servidor já em estado `listening`.
 */
async function listenForHttp({ app, listenTarget }) {
    /** @type {import("node:http").Server|undefined} */
    let server;
    /** @type {((error: Error) => void)|undefined} */
    let startupErrorHandler;

    const listening = new Promise((resolve, reject) => {
        let settled = false;

        const settle = (handler, value) => {
            if (settled) return;
            settled = true;
            handler(value);
        };

        try {
            server = app.listen(listenTarget, () => settle(resolve));
            startupErrorHandler = (error) => settle(reject, error);
            server.once?.("error", startupErrorHandler);
        } catch (error) {
            settle(reject, error);
        }
    });

    try {
        await listening;
        return server;
    } finally {
        if (server && startupErrorHandler) {
            server.off?.("error", startupErrorHandler);
        }
    }
}

/**
 * Arranca a API e instala shutdown idempotente para SIGINT/SIGTERM.
 *
 * @param {object} [options] - Dependências injetáveis para teste.
 * @param {typeof connectDB} [options.connect] - Ligação à base de dados.
 * @param {typeof disconnectDB} [options.disconnect] - Fecho da base de dados.
 * @param {typeof createApp} [options.createApplication] - Fábrica Express.
 * @param {NodeJS.Process} [options.processRef] - Processo que recebe sinais.
 * @param {Pick<Console, "log"|"error">} [options.logger] - Logger sanitizado.
 * @param {number} [options.shutdownTimeoutMs] - Limite para shutdown.
 * @param {boolean} [options.installSignalHandlers=true] - Instala handlers próprios do processo.
 * @param {typeof startAiRuntimeWorker} [options.startWorker] - Fábrica do worker durável.
 * @param {typeof startPrivateFileRuntimeWorker} [options.startPrivateWorker] - Fábrica do lifecycle de ficheiros privados.
 * @returns {Promise<{app: import("express").Express, server: import("node:http").Server, worker: {stop: () => Promise<void>}, privateFileWorker: {stop: () => Promise<void>}, shutdown: (signal?: string) => Promise<void>}>} Runtime iniciado.
 */
export async function startServer({
    connect = connectDB,
    disconnect = disconnectDB,
    createApplication = createApp,
    processRef = process,
    logger = console,
    shutdownTimeoutMs = DEFAULT_SHUTDOWN_TIMEOUT_MS,
    installSignalHandlers = true,
    startWorker = startAiRuntimeWorker,
    startPrivateWorker = startPrivateFileRuntimeWorker,
} = {}) {
    await connect();

    const app = createApplication();
    const listenTarget = env.localRuntime
        ? { host: "127.0.0.1", port: env.port, exclusive: true }
        : env.port;
    let server;
    let worker;
    let privateFileWorker;

    try {
        server = await listenForHttp({ app, listenTarget });
        worker = startWorker({ logger });
        if (!worker || typeof worker.stop !== "function") {
            throw new Error("Worker IA não devolveu um handle de shutdown válido");
        }
        privateFileWorker = startPrivateWorker({ logger });
        if (!privateFileWorker || typeof privateFileWorker.stop !== "function") {
            throw new Error(
                "Worker de ficheiros privados não devolveu um handle de shutdown válido",
            );
        }
        logger.log(`Orelle API ativa na porta ${env.port}`);
    } catch (error) {
        await Promise.allSettled([
            worker?.stop?.(),
            privateFileWorker?.stop?.(),
        ]);
        if (server) {
            await new Promise((resolve) => {
                server.close?.(() => resolve());
            }).catch(() => undefined);
        }
        try {
            await disconnect();
        } catch {
            logger.error("Falha ao libertar MongoDB após erro no arranque HTTP");
        }
        throw error;
    }
    let shutdownPromise = null;

    /**
     * Impede novos pedidos, aguarda os pedidos ativos e fecha o MongoDB.
     * Chamadas repetidas reutilizam a mesma promise.
     *
     * @param {string} [signal] - Sinal que iniciou o encerramento.
     * @returns {Promise<void>} Conclusão do shutdown.
     */
    function shutdown(signal = "manual") {
        if (shutdownPromise) return shutdownPromise;

        shutdownPromise = (async () => {
            logger.log(`A encerrar Orelle API (${signal})`);
            let timeout;
            let shutdownError;

            try {
                await Promise.race([
                    Promise.all([
                        new Promise((resolve, reject) => {
                            server.close((error) => {
                                if (error) reject(error);
                                else resolve();
                            });
                        }),
                        worker.stop(),
                        privateFileWorker.stop(),
                    ]),
                    new Promise((_, reject) => {
                        timeout = setTimeout(
                            () => reject(new Error("Timeout no shutdown HTTP")),
                            shutdownTimeoutMs,
                        );
                        timeout.unref?.();
                    }),
                ]);
            } catch (error) {
                shutdownError = error;
                // Depois do limite gracioso, nenhuma ligação HTTP deve manter
                // o processo preso. O MongoDB continua a ser fechado abaixo.
                server.closeAllConnections?.();
            } finally {
                if (timeout) clearTimeout(timeout);
            }

            try {
                await disconnect();
            } catch (error) {
                shutdownError ??= error;
            }

            if (shutdownError) {
                processRef.exitCode = 1;
                logger.error("Falha no encerramento gracioso da API");
                throw shutdownError;
            }
        })();

        return shutdownPromise;
    }

    if (installSignalHandlers) {
        processRef.once("SIGTERM", () => void shutdown("SIGTERM").catch(() => {}));
        processRef.once("SIGINT", () => void shutdown("SIGINT").catch(() => {}));
    }

    return { app, server, worker, privateFileWorker, shutdown };
}

const entrypoint = process.argv[1]
    ? pathToFileURL(process.argv[1]).href
    : undefined;

if (entrypoint === import.meta.url) {
    await startServer();
}
