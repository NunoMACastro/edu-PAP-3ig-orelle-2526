/** Testes unitários do polling e shutdown do lifecycle privado. */
import { EventEmitter } from "node:events";
import { describe, expect, it, vi } from "vitest";
import {
    runPrivateFileMaintenanceOnce,
    startPrivateFileRuntimeWorker,
} from "../src/services/private-file-runtime.service.js";
import { startServer } from "../src/server.js";

describe("runtime de ficheiros privados", () => {
    it("faz sweep e drena apenas o batch limitado sem sobreposição", async () => {
        const sweepExpiredOutputs = vi.fn().mockResolvedValue({ expired: 2 });
        const processNextDeletion = vi
            .fn()
            .mockResolvedValueOnce({ claimed: true, completed: true, failed: false })
            .mockResolvedValueOnce({ claimed: true, completed: false, failed: true })
            .mockResolvedValueOnce({ claimed: false });

        await expect(
            runPrivateFileMaintenanceOnce({
                now: new Date("2026-07-11T12:00:00.000Z"),
                sweepExpiredOutputs,
                processNextDeletion,
                maxJobs: 5,
            }),
        ).resolves.toEqual({
            expiredOutputs: 2,
            claimed: 2,
            completed: 1,
            failed: 1,
        });
        expect(sweepExpiredOutputs).toHaveBeenCalledOnce();
        expect(processNextDeletion).toHaveBeenCalledTimes(3);
    });

    it("agenda sweep periódico e aguarda a iteração ativa no stop", async () => {
        const scheduled = [];
        const cleared = [];
        const setTimeoutFn = vi.fn((callback, delay) => {
            const timer = { callback, delay, unref: vi.fn() };
            scheduled.push(timer);
            return timer;
        });
        const clearTimeoutFn = vi.fn((timer) => cleared.push(timer));
        let release;
        const runMaintenance = vi.fn(
            () =>
                new Promise((resolve) => {
                    release = resolve;
                }),
        );
        const worker = startPrivateFileRuntimeWorker({
            setTimeoutFn,
            clearTimeoutFn,
            runMaintenance,
            initialDelayMs: 0,
            pollIntervalMs: 10,
            expirySweepIntervalMs: 1_000,
            nowFn: () => new Date("2026-07-11T12:00:00.000Z"),
            logger: { error: vi.fn() },
        });
        expect(scheduled[0].delay).toBe(0);

        const active = scheduled[0].callback();
        await vi.waitFor(() => expect(runMaintenance).toHaveBeenCalledOnce());
        expect(runMaintenance).toHaveBeenCalledWith(
            expect.objectContaining({ performExpirySweep: true }),
        );
        const stopping = worker.stop();
        let stopped = false;
        void stopping.then(() => {
            stopped = true;
        });
        await Promise.resolve();
        expect(stopped).toBe(false);
        release({});
        await active;
        await stopping;
        expect(stopped).toBe(true);
        expect(clearTimeoutFn).toHaveBeenCalled();
        expect(cleared).toContain(scheduled[0]);
    });

    it("executa o sweep pelo relógio mesmo sem pedidos HTTP novos", async () => {
        const scheduled = [];
        const setTimeoutFn = vi.fn((callback, delay) => {
            const timer = { callback, delay, unref: vi.fn() };
            scheduled.push(timer);
            return timer;
        });
        let nowMs = Date.parse("2026-07-11T12:00:00.000Z");
        const runMaintenance = vi.fn().mockResolvedValue({});
        const worker = startPrivateFileRuntimeWorker({
            setTimeoutFn,
            clearTimeoutFn: vi.fn(),
            runMaintenance,
            initialDelayMs: 0,
            pollIntervalMs: 10,
            expirySweepIntervalMs: 1_000,
            nowFn: () => new Date(nowMs),
            logger: { error: vi.fn() },
        });

        await scheduled[0].callback();
        nowMs += 500;
        await scheduled[1].callback();
        nowMs += 600;
        await scheduled[2].callback();

        expect(
            runMaintenance.mock.calls.map(([options]) =>
                options.performExpirySweep,
            ),
        ).toEqual([true, false, true]);
        await worker.stop();
    });

    it("servidor encerra HTTP e ambos os workers antes do MongoDB", async () => {
        const events = [];
        const aiWorker = { stop: vi.fn(async () => events.push("ai")) };
        const privateWorker = {
            stop: vi.fn(async () => events.push("private")),
        };
        const server = new EventEmitter();
        server.close = vi.fn((callback) => {
            events.push("http");
            callback();
        });
        const runtime = await startServer({
            connect: vi.fn().mockResolvedValue(undefined),
            disconnect: vi.fn(async () => events.push("mongo")),
            createApplication: () => ({
                listen: (_target, callback) => {
                    callback();
                    return server;
                },
            }),
            startWorker: () => aiWorker,
            startPrivateWorker: () => privateWorker,
            processRef: { exitCode: 0, once: vi.fn() },
            logger: { log: vi.fn(), error: vi.fn() },
            installSignalHandlers: false,
        });

        await Promise.all([runtime.shutdown("one"), runtime.shutdown("two")]);
        expect(aiWorker.stop).toHaveBeenCalledOnce();
        expect(privateWorker.stop).toHaveBeenCalledOnce();
        expect(events.at(-1)).toBe("mongo");
        expect(new Set(events.slice(0, 3))).toEqual(
            new Set(["http", "ai", "private"]),
        );
    });
});
