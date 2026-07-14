/** Testes do ciclo de vida do worker durável composto no servidor. */
import { EventEmitter } from "node:events";
import { describe, expect, it, vi } from "vitest";
import { AI_JOB_TYPES } from "../src/models/ai-job.model.js";
import {
    createAiRuntimeHandlers,
    startAiRuntimeWorker,
} from "../src/services/ai-worker-runtime.service.js";
import { startServer } from "../src/server.js";

describe("AI-E2E-02 - composição e shutdown do worker", () => {
    it("regista exatamente os quatro tipos canónicos", () => {
        expect(Object.keys(createAiRuntimeHandlers()).sort()).toEqual(
            Object.values(AI_JOB_TYPES).sort(),
        );
    });

    it("não reclama jobs quando o processo arrancou sem configuração OpenAI", async () => {
        const worker = startAiRuntimeWorker();

        expect(worker.degraded).toBe(true);
        await expect(worker.stop()).resolves.toBeUndefined();
    });

    it("para o worker uma vez antes de desligar a base", async () => {
        const events = [];
        const worker = {
            stop: vi.fn(async () => {
                events.push("worker");
            }),
        };
        const server = new EventEmitter();
        server.close = vi.fn((callback) => {
            events.push("http");
            callback();
        });
        const runtime = await startServer({
            connect: vi.fn().mockResolvedValue(undefined),
            disconnect: vi.fn(async () => {
                events.push("mongo");
            }),
            createApplication: () => ({
                listen: (_target, callback) => {
                    callback();
                    return server;
                },
            }),
            startWorker: vi.fn(() => worker),
            processRef: { exitCode: 0, once: vi.fn() },
            logger: { log: vi.fn(), error: vi.fn() },
            installSignalHandlers: false,
        });

        await Promise.all([runtime.shutdown("test"), runtime.shutdown("replay")]);

        expect(worker.stop).toHaveBeenCalledTimes(1);
        expect(events.at(-1)).toBe("mongo");
        expect(new Set(events.slice(0, 2))).toEqual(new Set(["http", "worker"]));
    });
});
