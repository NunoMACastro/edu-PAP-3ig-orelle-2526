/** Provider e armazenamento lossless da pré-visualização cosmética. */
import { mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import sharp from "sharp";
import { afterEach, describe, expect, it, vi } from "vitest";
import { editCosmeticPhotoWithOpenAi } from "../src/providers/openai-cosmetic-edit.provider.js";
import {
    readEncryptedMakeupOutput,
    writeEncryptedMakeupOutput,
} from "../src/services/makeup-simulation-storage.service.js";

const temporaryDirectories = [];

async function image(format = "webp", width = 96, height = 64) {
    const pipeline = sharp({
        create: {
            width,
            height,
            channels: 3,
            background: "#c08457",
        },
    });
    return format === "png" ? pipeline.png().toBuffer() : pipeline.webp().toBuffer();
}

async function responseWithPng(form, model = "gpt-image-2") {
    const [width, height] = String(form.get("size")).split("x").map(Number);
    const output = await image("png", width, height);
    return new Response(
        JSON.stringify({
            id: "img-edit-test",
            model,
            data: [{ b64_json: output.toString("base64") }],
        }),
        { status: 200, headers: { "x-request-id": "req-image-test" } },
    );
}

/** Mantém o event loop ativo e rejeita com a razão real do AbortSignal. */
function rejectWhenAborted(signal) {
    return new Promise((_resolve, reject) => {
        const guard = setTimeout(
            () => reject(new Error("AbortSignal de teste não foi acionado")),
            1_000,
        );
        const rejectWithSignalReason = () => {
            clearTimeout(guard);
            reject(signal.reason);
        };
        if (signal.aborted) return rejectWithSignalReason();
        signal.addEventListener("abort", rejectWithSignalReason, { once: true });
    });
}

function request(sourceImage, overrides = {}) {
    return {
        sourceImage,
        sourceMimeType: "image/webp",
        visualizationSpec: {
            objectives: [
                {
                    code: "oil_control",
                    priority: "primary",
                    effect: "reduce_excess_specular_shine",
                    regions: ["forehead", "nose"],
                },
                {
                    code: "makeup",
                    priority: "secondary",
                    effect: "apply_confirmed_catalog_makeup",
                    regions: ["lips"],
                },
            ],
        },
        recommendations: [
            {
                variantId: "rose-matte",
                colorHex: "#C07080",
                finish: "matte",
                coverage: "medium",
                visualRoles: ["lips"],
                productName: "INSTRUÇÃO NÃO CONFIÁVEL",
            },
        ],
        intensity: "subtle",
        ...overrides,
    };
}

function config(overrides = {}) {
    return {
        nodeEnv: "test",
        openAiTestFixtureMode: false,
        openAiApiKey: "test-key-not-a-real-credential",
        openAiImageModel: "gpt-image-2",
        openAiImageQuality: "high",
        openAiImageTimeoutMs: 5_000,
        openAiImagePromptVersion: "cosmetic-image-edit-v5",
        openAiImageSchemaVersion: "cosmetic-image-contract-v3",
        ...overrides,
    };
}

afterEach(async () => {
    vi.restoreAllMocks();
    await Promise.all(
        temporaryDirectories.splice(0).map((directory) =>
            rm(directory, { recursive: true, force: true }),
        ),
    );
});

describe("imagem OpenAI cosmética lossless", () => {
    it.each(["gpt-image-2", "gpt-image-2-2026-07-01"])(
        "omite input_fidelity em %s e fixa high, PNG e tamanho proporcional",
        async (imageModel) => {
            const sourceImage = await image("webp");
            const fetchImpl = vi.fn(async (_url, options) => {
                const form = options.body;
                expect(form.get("model")).toBe(imageModel);
                expect(form.has("input_fidelity")).toBe(false);
                expect(form.get("quality")).toBe("high");
                expect(form.get("output_format")).toBe("png");
                expect(form.get("size")).toBe("1536x1024");
                const sourceFile = form.get("image[]");
                expect(sourceFile).toBeInstanceOf(Blob);
                expect(sourceFile.type).toBe("image/webp");
                expect(sourceFile.name).toBe("frontal.webp");
                expect(Buffer.from(await sourceFile.arrayBuffer())).toEqual(sourceImage);
                const prompt = form.get("prompt");
                expect(prompt).toContain("TASK");
                expect(prompt).toContain("excessive specular highlights");
                expect(prompt).toContain("observable effect at 100% zoom");
                expect(prompt).toContain("variant=rose-matte");
                expect(prompt).not.toContain("INSTRUÇÃO NÃO CONFIÁVEL");
                return responseWithPng(form, imageModel);
            });

            const result = await editCosmeticPhotoWithOpenAi(
                request(sourceImage),
                { config: config({ openAiImageModel: imageModel }), fetchImpl },
            );

            expect(fetchImpl).toHaveBeenCalledTimes(1);
            expect((await sharp(result.imageBuffer).metadata()).format).toBe("png");
            expect(result.provenance).toMatchObject({
                requestedModel: imageModel,
                effectiveModel: imageModel,
                requestId: "req-image-test",
                requestedSize: "1536x1024",
                outputWidth: 1536,
                outputHeight: 1024,
                quality: "high",
                format: "png",
            });
        },
    );

    it("mantém input_fidelity apenas em modelos GPT Image anteriores", async () => {
        const sourceImage = await image("webp");
        const fetchImpl = vi.fn(async (_url, options) => {
            expect(options.body.get("input_fidelity")).toBe("high");
            return responseWithPng(options.body, "gpt-image-1.5");
        });
        await editCosmeticPhotoWithOpenAi(request(sourceImage), {
            config: config({ openAiImageModel: "gpt-image-1.5" }),
            fetchImpl,
        });
        expect(fetchImpl).toHaveBeenCalledTimes(1);
    });

    it("concede o deadline total a um pedido e não repete um timeout", async () => {
        const sourceImage = await image("webp");
        const logger = { log: vi.fn(), error: vi.fn() };
        const fetchImpl = vi.fn(async (_url, options) =>
            rejectWhenAborted(options.signal),
        );
        await expect(
            editCosmeticPhotoWithOpenAi(request(sourceImage), {
                config: config({ openAiImageTimeoutMs: 200 }),
                fetchImpl,
                logger,
            }),
        ).rejects.toMatchObject({
            statusCode: 503,
            details: { code: "OPENAI_IMAGE_TIMEOUT", retryable: true },
        });
        expect(fetchImpl).toHaveBeenCalledTimes(1);
        const started = JSON.parse(logger.log.mock.calls[0][0]);
        const failed = JSON.parse(logger.error.mock.calls[0][0]);
        expect(started).toMatchObject({
            event: "openai_image_edit_request_started",
            attempt: 1,
            timeoutMs: expect.any(Number),
        });
        expect(started.timeoutMs).toBeGreaterThan(100);
        expect(failed).toMatchObject({
            event: "openai_image_edit_request_failed",
            errorCode: "OPENAI_IMAGE_TIMEOUT",
            retryable: true,
            willRetry: false,
        });
    });

    it("repete apenas uma resposta HTTP transitória recebida cedo", async () => {
        const sourceImage = await image("webp");
        const sleep = vi.fn();
        const fetchImpl = vi
            .fn()
            .mockResolvedValueOnce(
                new Response("", {
                    status: 503,
                    headers: { "x-request-id": "req-transient" },
                }),
            )
            .mockImplementationOnce(async (_url, options) =>
                responseWithPng(options.body),
            );
        const result = await editCosmeticPhotoWithOpenAi(request(sourceImage), {
            config: config({ openAiImageTimeoutMs: 240_000 }),
            fetchImpl,
            sleep,
        });
        expect(fetchImpl).toHaveBeenCalledTimes(2);
        expect(sleep).toHaveBeenCalledWith(250, undefined, undefined);
        expect((await sharp(result.imageBuffer).metadata()).format).toBe("png");
    });

    it("não repete quando o caller já cancelou", async () => {
        const sourceImage = await image("webp");
        const controller = new AbortController();
        controller.abort(new DOMException("cancelado", "AbortError"));
        const fetchImpl = vi.fn();
        await expect(
            editCosmeticPhotoWithOpenAi(
                request(sourceImage, { signal: controller.signal }),
                { config: config(), fetchImpl },
            ),
        ).rejects.toMatchObject({ name: "AbortError" });
        expect(fetchImpl).not.toHaveBeenCalled();
    });

    it("rejeita output que não seja PNG ou tenha dimensões inesperadas", async () => {
        const sourceImage = await image("webp");
        const invalidOutput = await image("webp", 128, 128);
        const fetchImpl = vi.fn(async () =>
            new Response(
                JSON.stringify({
                    model: "gpt-image-2",
                    data: [{ b64_json: invalidOutput.toString("base64") }],
                }),
                { status: 200 },
            ),
        );
        await expect(
            editCosmeticPhotoWithOpenAi(request(sourceImage), {
                config: config(),
                fetchImpl,
            }),
        ).rejects.toMatchObject({ statusCode: 502 });
        expect(fetchImpl).toHaveBeenCalledTimes(1);
    });

    it("usa fixture de teste e persiste apenas ciphertext PNG", async () => {
        const sourceImage = await image("webp", 32, 32);
        const generated = await editCosmeticPhotoWithOpenAi(request(sourceImage), {
            config: config({
                openAiTestFixtureMode: true,
                openAiImageModel: "gpt-image-test",
            }),
            fetchImpl: vi.fn(),
        });
        expect(generated.provenance).toMatchObject({
            provider: "openai",
            requestedModel: "gpt-image-test",
            effectiveModel: "gpt-image-test",
            requestId: "test-openai-image-request",
            requestedSize: "1248x1248",
            outputWidth: 1248,
            outputHeight: 1248,
            quality: "high",
            format: "png",
        });

        const storageDir = await mkdtemp(
            path.join(os.tmpdir(), "orelle-cosmetic-storage-"),
        );
        temporaryDirectories.push(storageDir);
        const simulationId = "66c000000000000000009901";
        const userId = "66c000000000000000009902";
        const stored = await writeEncryptedMakeupOutput(generated.imageBuffer, {
            userId,
            simulationId,
            expectedDimensions: { width: 1248, height: 1248 },
            storageDir,
        });
        expect(stored.mimeType).toBe("image/png");
        expect(stored.storageKey).toMatch(/\.png\.enc$/u);
        const bytesAtRest = await readFile(stored.storageKey);
        expect(bytesAtRest.subarray(1, 4).toString("ascii")).not.toBe("PNG");

        const clear = await readEncryptedMakeupOutput({
            _id: simulationId,
            userId,
            outputStorageKey: stored.storageKey,
            outputEncryption: stored.encryption,
        });
        expect(await sharp(clear).metadata()).toMatchObject({
            format: "png",
            width: 1248,
            height: 1248,
        });
    });

    it("não espera nem repete quando já não existe uma janela útil", async () => {
        const sourceImage = await image("webp");
        let now = Date.parse("2026-07-11T10:00:00.000Z");
        vi.spyOn(Date, "now").mockImplementation(() => now);
        const sleep = vi.fn(async (milliseconds) => {
            now += milliseconds;
        });
        const fetchImpl = vi.fn().mockResolvedValue({
            ok: false,
            status: 429,
            headers: {
                get: (name) =>
                    name.toLowerCase() === "retry-after"
                        ? "Sat, 11 Jul 2026 10:01:00 GMT"
                        : null,
            },
        });
        await expect(
            editCosmeticPhotoWithOpenAi(request(sourceImage), {
                config: config({ openAiImageModel: "gpt-image-test", openAiImageTimeoutMs: 1_000 }),
                fetchImpl,
                sleep,
            }),
        ).rejects.toMatchObject({
            details: expect.objectContaining({ code: "OPENAI_IMAGE_HTTP_429" }),
        });
        expect(fetchImpl).toHaveBeenCalledTimes(1);
        expect(sleep).not.toHaveBeenCalled();
    });

    it("regista apenas metadados operacionais permitidos", async () => {
        const sourceImage = await image("webp");
        const logger = { log: vi.fn(), error: vi.fn() };
        const fetchImpl = vi.fn(async (_url, options) =>
            responseWithPng(options.body),
        );
        await editCosmeticPhotoWithOpenAi(
            request(sourceImage, {
                operationId: "66c000000000000000009999",
            }),
            { config: config(), fetchImpl, logger },
        );
        const entries = logger.log.mock.calls.map(([line]) => JSON.parse(line));
        expect(entries).toEqual([
            expect.objectContaining({
                event: "openai_image_edit_request_started",
                operationId: "66c000000000000000009999",
                model: "gpt-image-2",
                quality: "high",
                requestedSize: "1536x1024",
            }),
            expect.objectContaining({
                event: "openai_image_edit_response_received",
                requestId: "req-image-test",
                statusCode: 200,
            }),
        ]);
        expect(JSON.stringify(entries)).not.toContain("TASK");
        expect(JSON.stringify(entries)).not.toContain("test-key");
        expect(JSON.stringify(entries)).not.toContain("rose-matte");
    });
});
