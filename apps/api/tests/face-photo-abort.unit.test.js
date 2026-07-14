/**
 * Testes focais de cancelamento dentro do codec e do storage facial.
 */
import { access, mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AppError } from "../src/middlewares/error.middleware.js";
import { normalizeUploadedFacePhotos } from "../src/services/face-photo-normalization.service.js";
import { encryptFacePhotoFile } from "../src/services/face-secure-storage.service.js";

const sharpMocks = vi.hoisted(() => ({
    factory: vi.fn(),
    processors: [],
    metadataStarted: vi.fn(),
}));

vi.mock("sharp", () => ({
    default: sharpMocks.factory.mockImplementation(() => {
        let rejectMetadata;
        const processor = {
            metadata: vi.fn(
                () =>
                    new Promise((_resolve, reject) => {
                        rejectMetadata = reject;
                        sharpMocks.metadataStarted();
                    }),
            ),
            destroy: vi.fn(() => {
                rejectMetadata?.(new Error("sharp destroyed"));
            }),
        };
        sharpMocks.processors.push(processor);
        return processor;
    }),
}));

const temporaryDirectories = [];

afterEach(async () => {
    vi.clearAllMocks();
    sharpMocks.processors.length = 0;
    await Promise.all(
        temporaryDirectories.splice(0).map((directory) =>
            rm(directory, { recursive: true, force: true }),
        ),
    );
});

describe("cancelamento cooperativo de fotografias faciais", () => {
    it("destrói o pipeline Sharp que está a descodificar", async () => {
        const controller = new AbortController();
        const normalization = normalizeUploadedFacePhotos(
            [
                {
                    kind: "frontal",
                    file: {
                        path: "/tmp/orelle-sharp-abort.upload",
                        mimetype: "image/png",
                    },
                },
            ],
            { signal: controller.signal },
        );

        await vi.waitFor(() => {
            expect(sharpMocks.metadataStarted).toHaveBeenCalledTimes(1);
        });
        controller.abort(new AppError(503, "Pedido expirado no Sharp."));

        await expect(normalization).rejects.toMatchObject({
            statusCode: 503,
            message: "Pedido expirado no Sharp.",
        });
        expect(sharpMocks.processors[0].destroy).toHaveBeenCalledTimes(1);
    });

    it("remove a cifra parcial quando o storage aborta antes de apagar o claro", async () => {
        const directory = await mkdtemp(
            path.join(os.tmpdir(), "orelle-storage-abort-"),
        );
        temporaryDirectories.push(directory);
        const plainPath = path.join(directory, "frontal.webp");
        await writeFile(plainPath, Buffer.from("imagem-normalizada-de-teste"));
        const controller = new AbortController();

        await expect(
            encryptFacePhotoFile(
                { path: plainPath },
                {
                    userId: "66a000000000000000000111",
                    photoId: "66f000000000000000000111",
                    kind: "frontal",
                },
                {
                    signal: controller.signal,
                    afterEncryptedWrite: async () => {
                        controller.abort(
                            new AppError(503, "Pedido expirado no storage."),
                        );
                    },
                },
            ),
        ).rejects.toMatchObject({
            statusCode: 503,
            message: "Pedido expirado no storage.",
        });

        await expect(access(`${plainPath}.enc`)).rejects.toMatchObject({
            code: "ENOENT",
        });
        await expect(access(plainPath)).resolves.toBeUndefined();
    });
});
