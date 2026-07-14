/**
 * Testes focais do boundary G3 para uploads faciais seguros.
 *
 * A suite usa codecs reais do Sharp e o storage AES-GCM real, isolando apenas
 * os modelos MongoDB. Assim comprova decode, auto-orientacao, remocao de EXIF,
 * cleanup fisico e contrato multipart sem depender de uma base externa.
 */
import { PassThrough } from "node:stream";
import {
    mkdir,
    mkdtemp,
    readFile,
    readdir,
    rm,
    stat,
    writeFile,
} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import request from "supertest";
import sharp from "sharp";
import { createApp } from "../src/app.js";
import { ROLES } from "../src/constants/roles.js";
import {
    FACE_PHOTO_UPLOAD_DIR,
    MAX_FACE_PHOTO_UPLOAD_BYTES,
    parseFacePhotoMultipart,
} from "../src/middlewares/face-photo-upload.middleware.js";
import { FaceConsent } from "../src/models/face-consent.model.js";
import { FacePhoto } from "../src/models/face-photo.model.js";
import {
    MAX_FACE_IMAGE_PIXELS,
    MAX_NORMALIZED_FACE_PHOTOS_BYTES,
    assertNormalizedFacePhotoQuota,
} from "../src/services/face-photo-normalization.service.js";
import { readEncryptedFacePhotoFile } from "../src/services/face-secure-storage.service.js";
import { createSessionToken } from "../src/services/session.service.js";

vi.mock("../src/models/face-consent.model.js", () => ({
    FaceConsent: {
        findOne: vi.fn(),
    },
}));

vi.mock("../src/models/face-photo.model.js", () => ({
    FacePhoto: {
        find: vi.fn(),
        insertMany: vi.fn(),
        updateMany: vi.fn(),
    },
}));

const userId = "66a000000000000000000101";
const consentId = "66b000000000000000000101";

/**
 * Cria IDs com a interface minima usada pelo DTO do service.
 *
 * @function objectId
 * @param {string} value - ID textual.
 * @returns {{toString: () => string}} ID compativel com o teste.
 */
function objectId(value) {
    return { toString: () => value };
}

/**
 * Simula `find(...).select(...)` para fotografias privadas ativas.
 *
 * @function activePhotoQuery
 * @param {object[]} photos - Fotografias a substituir.
 * @returns {object} Query Mongoose reduzida.
 */
function activePhotoQuery(photos) {
    return {
        select: vi.fn().mockResolvedValue(photos),
    };
}

/**
 * Gera uma imagem real pequena para testes multipart.
 *
 * @async
 * @function makeImage
 * @param {"jpeg"|"png"|"webp"} format - Codec de output.
 * @param {{width?: number, height?: number, withExif?: boolean}} [options] - Dimensoes e metadata opcional.
 * @returns {Promise<Buffer>} Imagem valida.
 */
async function makeImage(
    format,
    { width = 960, height = 720, withExif = false } = {},
) {
    // O padrão dá detalhe suficiente ao detector de blur sem depender de uma
    // fotografia real ou de dados biométricos nos testes.
    const source = Buffer.from(`
        <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <pattern id="quality-grid" width="24" height="24" patternUnits="userSpaceOnUse">
                    <rect width="24" height="24" fill="rgb(112, 92, 76)" />
                    <rect width="12" height="12" fill="rgb(164, 142, 118)" />
                    <rect x="12" y="12" width="12" height="12" fill="rgb(164, 142, 118)" />
                </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#quality-grid)" />
        </svg>
    `);
    let image = sharp(source)[format]();

    if (withExif) {
        image = image.withMetadata({
            orientation: 6,
            exif: { IFD0: { Copyright: "metadado-sensivel" } },
        });
    }

    return image.toBuffer();
}

/**
 * Cria cookie opaco de cliente no adaptador test-only.
 *
 * @function makeCookie
 * @returns {string} Cookie autenticado.
 */
function makeCookie() {
    const token = createSessionToken({
        id: userId,
        email: "upload@orelle.test",
        role: ROLES.CLIENTE,
    });
    return `orelle_session=${token}`;
}

/**
 * Anexa o par facial comum a um pedido Supertest.
 *
 * @function attachPair
 * @param {import("supertest").Test} test - Pedido em construcao.
 * @param {Buffer} frontal - Imagem frontal.
 * @param {Buffer} perfil - Imagem de perfil.
 * @param {string} [contentType="image/png"] - MIME declarado.
 * @returns {import("supertest").Test} Pedido com as duas partes.
 */
function attachPair(test, frontal, perfil, contentType = "image/png") {
    return test
        .attach("frontal", frontal, {
            filename: "frontal-imagem",
            contentType,
        })
        .attach("perfil", perfil, {
            filename: "perfil-imagem",
            contentType,
        });
}

describe("G3 - upload facial seguro com Busboy e Sharp", () => {
    beforeEach(async () => {
        vi.resetAllMocks();
        await rm(FACE_PHOTO_UPLOAD_DIR, { recursive: true, force: true });

        FaceConsent.findOne.mockResolvedValue({
            _id: objectId(consentId),
            userId,
            version: "face-analysis-v2",
            purpose: "analise_facial_cosmetica",
            revokedAt: null,
            externalProviderConsent: {
                provider: "openai",
                noticeVersion: "openai-cosmetic-consultation-v2",
                acceptedAt: new Date("2026-07-10T09:00:00.000Z"),
                revokedAt: null,
            },
            purposes: { openAiAnalysis: true },
        });
        FacePhoto.find.mockReturnValue(activePhotoQuery([]));
        FacePhoto.updateMany.mockResolvedValue({ modifiedCount: 0 });
        FacePhoto.insertMany.mockImplementation(async (documents) =>
            documents.map((document, index) => ({
                ...document,
                _id: objectId(`66f00000000000000000010${index}`),
                status: "active",
                createdAt: new Date("2026-07-10T09:00:00.000Z"),
            })),
        );
    });

    afterEach(async () => {
        await rm(FACE_PHOTO_UPLOAD_DIR, { recursive: true, force: true });
    });

    it("auto-orienta, re-encoda para WebP e remove EXIF antes da cifra", async () => {
        const jpeg = await makeImage("jpeg", {
            width: 960,
            height: 720,
            withExif: true,
        });

        const response = await attachPair(
            request(createApp())
                .post("/api/face-photos")
                .set("Cookie", [makeCookie()]),
            jpeg,
            jpeg,
            "image/jpeg",
        );

        expect(response.status).toBe(201);
        const persisted = FacePhoto.insertMany.mock.calls[0][0];
        expect(persisted).toHaveLength(2);
        expect(persisted[0]).toEqual(
            expect.objectContaining({
                kind: "frontal",
                mimeType: "image/webp",
                sizeBytes: expect.any(Number),
            }),
        );

        const normalized = await readEncryptedFacePhotoFile(persisted[0]);
        const encryptedStats = await stat(persisted[0].storageKey);
        const metadata = await sharp(normalized).metadata();
        expect(metadata).toEqual(
            expect.objectContaining({
                format: "webp",
                width: 720,
                height: 960,
            }),
        );
        expect(metadata.exif).toBeUndefined();
        expect(metadata.orientation).toBeUndefined();
        expect(encryptedStats.mode & 0o777).toBe(0o600);
    });

    it("rejeita MIME declarado que nao corresponde ao decode real", async () => {
        const jpeg = await makeImage("jpeg");
        const png = await makeImage("png");

        const response = await attachPair(
            request(createApp())
                .post("/api/face-photos")
                .set("Cookie", [makeCookie()]),
            jpeg,
            png,
            "image/png",
        );

        expect(response.status).toBe(400);
        expect(response.body.error.message).toBe("Conteúdo de imagem inválido");
        expect(FacePhoto.insertMany).not.toHaveBeenCalled();
        await expect(readdir(FACE_PHOTO_UPLOAD_DIR)).resolves.toEqual([]);
    });

    it("rejeita ficheiro corrompido mesmo quando comeca por magic bytes PNG", async () => {
        const corruptPng = Buffer.concat([
            Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
            Buffer.from("conteudo-corrompido"),
        ]);
        const png = await makeImage("png");

        const response = await attachPair(
            request(createApp())
                .post("/api/face-photos")
                .set("Cookie", [makeCookie()]),
            corruptPng,
            png,
        );

        expect(response.status).toBe(400);
        expect(response.body.error.message).toBe("Conteúdo de imagem inválido");
        expect(FacePhoto.insertMany).not.toHaveBeenCalled();
        await expect(readdir(FACE_PHOTO_UPLOAD_DIR)).resolves.toEqual([]);
    });

    it("rejeita dimensao excessiva antes da re-encodificacao", async () => {
        const tooWide = await makeImage("png", { width: 6001, height: 720 });
        const png = await makeImage("png");

        const response = await attachPair(
            request(createApp())
                .post("/api/face-photos")
                .set("Cookie", [makeCookie()]),
            tooWide,
            png,
        );

        expect(response.status).toBe(400);
        expect(response.body.error.message).toBe(
            "Imagem excede dimensões ou limite de píxeis permitido",
        );
        expect(FacePhoto.insertMany).not.toHaveBeenCalled();
        await expect(readdir(FACE_PHOTO_UPLOAD_DIR)).resolves.toEqual([]);
    });

    it("rejeita decompression bomb comprimida pelo numero de pixeis antes de persistir", async () => {
        // Uma cor uniforme produz um PNG muito pequeno no multipart, mas o
        // decode exigiria mais de 25 MP. As dimensoes individuais ficam abaixo
        // de 6000 para isolar especificamente o limite total de pixeis.
        const compressedBomb = await makeImage("png", {
            width: 5001,
            height: 5000,
        });
        const png = await makeImage("png");
        const bombMetadata = await sharp(compressedBomb, {
            limitInputPixels: false,
        }).metadata();
        const decodedPixels = bombMetadata.width * bombMetadata.height;

        expect(compressedBomb.length).toBeLessThan(
            MAX_FACE_PHOTO_UPLOAD_BYTES,
        );
        expect((decodedPixels * 3) / compressedBomb.length).toBeGreaterThan(
            100,
        );
        expect(decodedPixels).toBeGreaterThan(MAX_FACE_IMAGE_PIXELS);

        const response = await attachPair(
            request(createApp())
                .post("/api/face-photos")
                .set("Cookie", [makeCookie()]),
            compressedBomb,
            png,
        );

        expect(response.status).toBe(400);
        expect(response.body.error.message).toBe(
            "Imagem excede dimensões ou limite de píxeis permitido",
        );
        expect(FacePhoto.find).not.toHaveBeenCalled();
        expect(FacePhoto.updateMany).not.toHaveBeenCalled();
        expect(FacePhoto.insertMany).not.toHaveBeenCalled();
        await expect(readdir(FACE_PHOTO_UPLOAD_DIR)).resolves.toEqual([]);
    });

    it.each([
        {
            label: "campo textual",
            build: async (png) =>
                request(createApp())
                    .post("/api/face-photos")
                    .set("Cookie", [makeCookie()])
                    .field("nota", "nao permitido")
                    .attach("frontal", png, {
                        filename: "frontal.png",
                        contentType: "image/png",
                    })
                    .attach("perfil", png, {
                        filename: "perfil.png",
                        contentType: "image/png",
                    }),
        },
        {
            label: "campo de ficheiro desconhecido",
            build: async (png) =>
                request(createApp())
                    .post("/api/face-photos")
                    .set("Cookie", [makeCookie()])
                    .attach("lateral", png, {
                        filename: "lateral.png",
                        contentType: "image/png",
                    })
                    .attach("perfil", png, {
                        filename: "perfil.png",
                        contentType: "image/png",
                    }),
        },
        {
            label: "campo frontal duplicado",
            build: async (png) =>
                request(createApp())
                    .post("/api/face-photos")
                    .set("Cookie", [makeCookie()])
                    .attach("frontal", png, {
                        filename: "frontal-a.png",
                        contentType: "image/png",
                    })
                    .attach("frontal", png, {
                        filename: "frontal-b.png",
                        contentType: "image/png",
                    }),
        },
    ])("rejeita $label e limpa qualquer parte aceite", async ({ build }) => {
        const png = await makeImage("png");
        const response = await build(png);

        expect(response.status).toBe(400);
        expect(FacePhoto.insertMany).not.toHaveBeenCalled();
        await expect(readdir(FACE_PHOTO_UPLOAD_DIR)).resolves.toEqual([]);
    });

    it("limpa ficheiro parcial quando o cliente aborta o stream", async () => {
        const uploadDir = await mkdtemp(
            path.join(os.tmpdir(), "orelle-face-abort-"),
        );
        const boundary = "orelle-abort-boundary";
        const stream = new PassThrough();
        stream.headers = {
            "content-type": `multipart/form-data; boundary=${boundary}`,
        };
        stream.aborted = false;

        const parsing = parseFacePhotoMultipart(stream, { uploadDir });
        stream.write(
            `--${boundary}\r\n` +
                'Content-Disposition: form-data; name="frontal"; filename="frontal.png"\r\n' +
                "Content-Type: image/png\r\n\r\n",
        );
        stream.write(Buffer.alloc(2048, 1));
        await vi.waitFor(() => {
            expect(stream.listenerCount("aborted")).toBeGreaterThan(0);
        });
        stream.aborted = true;
        stream.emit("aborted");

        await expect(parsing).rejects.toThrow("Upload interrompido");
        await expect(readdir(uploadDir)).resolves.toEqual([]);
        await rm(uploadDir, { recursive: true, force: true });
    });

    it("propaga req.orelleAbortSignal ao parser e limpa ficheiro parcial no timeout", async () => {
        const uploadDir = await mkdtemp(
            path.join(os.tmpdir(), "orelle-face-signal-abort-"),
        );
        const boundary = "orelle-signal-abort-boundary";
        const stream = new PassThrough();
        const controller = new AbortController();
        stream.headers = {
            "content-type": `multipart/form-data; boundary=${boundary}`,
        };
        stream.aborted = false;
        stream.orelleAbortSignal = controller.signal;

        const parsing = parseFacePhotoMultipart(stream, { uploadDir });
        stream.write(
            `--${boundary}\r\n` +
                'Content-Disposition: form-data; name="frontal"; filename="frontal.png"\r\n' +
                "Content-Type: image/png\r\n\r\n",
        );
        stream.write(Buffer.alloc(2048, 1));
        await vi.waitFor(() => {
            expect(stream.listenerCount("aborted")).toBeGreaterThan(0);
        });

        controller.abort(new Error("timeout do teste"));

        await expect(parsing).rejects.toMatchObject({
            statusCode: 503,
            message: "Upload facial cancelado.",
        });
        await expect(readdir(uploadDir)).resolves.toEqual([]);
        await rm(uploadDir, { recursive: true, force: true });
    });

    it("aplica a quota ao tamanho normalizado total", () => {
        expect(() =>
            assertNormalizedFacePhotoQuota([
                { file: { size: MAX_NORMALIZED_FACE_PHOTOS_BYTES / 2 } },
                { file: { size: MAX_NORMALIZED_FACE_PHOTOS_BYTES / 2 } },
            ]),
        ).not.toThrow();

        expect(() =>
            assertNormalizedFacePhotoQuota([
                { file: { size: MAX_NORMALIZED_FACE_PHOTOS_BYTES } },
                { file: { size: 1 } },
            ]),
        ).toThrow("Quota normalizada de fotografias excedida");
    });

    it("substitui as duas ativas e elimina fisicamente o par anterior", async () => {
        await rm(FACE_PHOTO_UPLOAD_DIR, { recursive: true, force: true });
        await mkdir(FACE_PHOTO_UPLOAD_DIR, { recursive: true });
        const oldFrontalPath = path.join(
            FACE_PHOTO_UPLOAD_DIR,
            "old-frontal.enc",
        );
        const oldPerfilPath = path.join(
            FACE_PHOTO_UPLOAD_DIR,
            "old-perfil.enc",
        );
        await Promise.all([
            writeFile(oldFrontalPath, "cifra-antiga-frontal"),
            writeFile(oldPerfilPath, "cifra-antiga-perfil"),
        ]);
        FacePhoto.find.mockReturnValueOnce(
            activePhotoQuery([
                {
                    _id: objectId("66f000000000000000000201"),
                    storageKey: oldFrontalPath,
                },
                {
                    _id: objectId("66f000000000000000000202"),
                    storageKey: oldPerfilPath,
                },
            ]),
        );
        const png = await makeImage("png");

        const response = await attachPair(
            request(createApp())
                .post("/api/face-photos")
                .set("Cookie", [makeCookie()]),
            png,
            png,
        );

        expect(response.status).toBe(201);
        expect(FacePhoto.updateMany).toHaveBeenCalledWith(
            expect.objectContaining({ status: "active" }),
            { $set: { status: "deleted" } },
        );
        expect(FacePhoto.insertMany.mock.calls[0][0]).toHaveLength(2);
        await expect(readFile(oldFrontalPath)).rejects.toMatchObject({
            code: "ENOENT",
        });
        await expect(readFile(oldPerfilPath)).rejects.toMatchObject({
            code: "ENOENT",
        });
    });
});
