/**
 * Composição única do worker durável da consulta cosmética.
 *
 * O servidor conhece apenas este boundary. Os módulos de análise, perguntas,
 * relatório e imagem continuam independentes e registam aqui exatamente um
 * handler por tipo de `AiJob`.
 */
import { createCoreAiJobHandlers } from "./ai-consultation.service.js";
import { startAiJobWorker } from "./ai-job.service.js";
import { createReportAiJobHandlers } from "./report-ai-job-handlers.service.js";
import { getOpenAiCapabilities } from "../providers/openai-responses.provider.js";

/**
 * Compõe os quatro handlers canónicos, permitindo overrides apenas em testes.
 *
 * @param {{coreOptions?: object, reportOverrides?: object}} [options] - Dependências estreitas dos handlers.
 * @returns {Record<string, (job: object) => Promise<object>>} Mapa completo de handlers.
 */
export function createAiRuntimeHandlers({
    coreOptions = {},
    reportOverrides = {},
} = {}) {
    return {
        ...createCoreAiJobHandlers(coreOptions),
        ...createReportAiJobHandlers(reportOverrides),
    };
}

/**
 * Inicia um único poller por processo da API.
 *
 * @param {{handlers?: Record<string, Function>, logger?: Pick<Console, "error">, workerOptions?: object}} [options] - Configuração operacional injetável.
 * @returns {{stop: () => Promise<void>}} Handle usado pelo shutdown gracioso.
 */
export function startAiRuntimeWorker({
    handlers = createAiRuntimeHandlers(),
    logger = console,
    workerOptions = {},
} = {}) {
    if (!getOpenAiCapabilities().available) {
        return {
            degraded: true,
            async stop() {},
        };
    }
    return startAiJobWorker({
        ...workerOptions,
        handlers,
        logger,
    });
}
