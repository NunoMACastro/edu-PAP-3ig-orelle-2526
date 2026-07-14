/**
 * Validacao e normalizacao defensiva de fotografias faciais com Sharp.
 *
 * O MIME declarado no multipart nunca e aceite como prova de formato. Cada
 * ficheiro e realmente descodificado com limite de pixeis, validado quanto a
 * formato/dimensoes/paginas, auto-orientado e re-encodado para WebP sem copiar
 * EXIF, ICC ou outros metadados do ficheiro original.
 */
import { unlink } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { AppError } from "../middlewares/error.middleware.js";
import {
    assertAbortSignalActive,
    getAbortSignalError,
} from "../utils/abort-signal.util.js";

export const MAX_FACE_IMAGE_DIMENSION = 6000;
export const MAX_FACE_IMAGE_PIXELS = 25_000_000;
export const MAX_NORMALIZED_FACE_PHOTOS_BYTES = 24 * 1024 * 1024;
export const MAX_NORMALIZED_FACE_IMAGE_EDGE = 2048;
export const MIN_FACE_IMAGE_SIDE = 720;
export const FACE_PHOTO_QUALITY_PROFILE_VERSION = "face-photo-quality-v1";
export const MIN_FACE_PHOTO_LUMA = 45;
export const MAX_FACE_PHOTO_LUMA = 210;
export const MAX_FACE_PHOTO_CLIPPED_RATIO = 0.2;
export const MIN_FACE_PHOTO_BLUR_VARIANCE = 20;

const OUTPUT_MIME_TYPE = "image/webp";
const MIME_TYPE_BY_SHARP_FORMAT = Object.freeze({
    jpeg: "image/jpeg",
    png: "image/png",
    webp: "image/webp",
});

/**
 * Remove um ficheiro temporario sem falhar se outro passo ja o apagou.
 *
 * @async
 * @function safeUnlink
 * @param {string|undefined} filePath - Path temporario privado.
 * @returns {Promise<void>} Termina mesmo para um path inexistente.
 */
async function safeUnlink(filePath) {
    if (!filePath) return;
    await unlink(filePath).catch(() => undefined);
}

/**
 * Executa uma operação Sharp ligada ao sinal transversal. `destroy()` impede
 * que o codec continue a consumir CPU ou a escrever um output depois de o
 * pedido ter expirado.
 *
 * @template T
 * @param {import("sharp").Sharp} processor - Pipeline Sharp atual.
 * @param {(processor: import("sharp").Sharp) => Promise<T>} operation - Operação assíncrona.
 * @param {AbortSignal|undefined} signal - Cancelamento do pedido.
 * @returns {Promise<T>} Resultado do codec.
 */
async function runSharpOperation(processor, operation, signal) {
    assertAbortSignalActive(signal, "Processamento da imagem cancelado.");
    const handleAbort = () => processor.destroy();
    signal?.addEventListener("abort", handleAbort, { once: true });

    try {
        const result = await operation(processor);
        assertAbortSignalActive(signal, "Processamento da imagem cancelado.");
        return result;
    } catch (error) {
        if (signal?.aborted) {
            throw getAbortSignalError(
                signal,
                "Processamento da imagem cancelado.",
            );
        }
        throw error;
    } finally {
        signal?.removeEventListener("abort", handleAbort);
    }
}

/**
 * Converte falhas de decode do Sharp num erro HTTP seguro e estavel.
 *
 * @function toSafeImageError
 * @param {unknown} error - Falha original do Sharp ou da validacao local.
 * @returns {AppError} Erro sem detalhes internos do codec ou filesystem.
 */
function toSafeImageError(error) {
    if (error instanceof AppError) return error;

    const message = String(error?.message ?? "");
    if (/pixel limit|exceeds.*pixel/i.test(message)) {
        return new AppError(
            400,
            "Imagem excede dimensões ou limite de píxeis permitido",
        );
    }

    return new AppError(400, "Conteúdo de imagem inválido");
}

/**
 * Valida metadados obtidos por decode real, incluindo coerencia MIME.
 *
 * @function assertAllowedDecodedImage
 * @param {object} metadata - Metadados devolvidos por `sharp().metadata()`.
 * @param {string} declaredMimeType - MIME vindo do multipart.
 * @returns {void}
 * @throws {AppError} Quando formato, MIME, dimensoes ou paginas nao cumprem o contrato.
 */
function assertAllowedDecodedImage(metadata, declaredMimeType) {
    const decodedMimeType = MIME_TYPE_BY_SHARP_FORMAT[metadata?.format];
    const width = Number(metadata?.width ?? 0);
    const height = Number(metadata?.height ?? 0);
    const pages = Number(metadata?.pages ?? 1);

    if (!decodedMimeType || decodedMimeType !== declaredMimeType) {
        throw new AppError(400, "Conteúdo de imagem inválido");
    }

    if (!Number.isInteger(width) || !Number.isInteger(height) || width < 1 || height < 1) {
        throw new AppError(400, "Conteúdo de imagem inválido");
    }

    if (Math.min(width, height) < MIN_FACE_IMAGE_SIDE) {
        throw new AppError(
            422,
            `A fotografia deve ter pelo menos ${MIN_FACE_IMAGE_SIDE}px no lado menor`,
        );
    }

    if (
        width > MAX_FACE_IMAGE_DIMENSION ||
        height > MAX_FACE_IMAGE_DIMENSION ||
        width * height > MAX_FACE_IMAGE_PIXELS
    ) {
        throw new AppError(
            400,
            "Imagem excede dimensões ou limite de píxeis permitido",
        );
    }

    if (!Number.isInteger(pages) || pages !== 1) {
        throw new AppError(400, "Imagens animadas ou multipágina não são permitidas");
    }
}

/** Calcula variância do Laplaciano sobre uma imagem grayscale de um canal. */
export function calculateLaplacianVariance(pixels, width, height) {
    if (!pixels || width < 3 || height < 3) return 0;
    let count = 0;
    let sum = 0;
    let sumSquares = 0;
    for (let y = 1; y < height - 1; y += 1) {
        for (let x = 1; x < width - 1; x += 1) {
            const index = y * width + x;
            const value =
                4 * pixels[index] -
                pixels[index - 1] -
                pixels[index + 1] -
                pixels[index - width] -
                pixels[index + width];
            count += 1;
            sum += value;
            sumSquares += value * value;
        }
    }
    if (!count) return 0;
    const mean = sum / count;
    return Math.max(0, sumSquares / count - mean * mean);
}

/** Analisa luz, clipping e nitidez sem tentar reconhecer identidade/rosto. */
async function analyzeNormalizedPhotoQuality(filePath, signal) {
    const processor = sharp(filePath, {
        limitInputPixels: MAX_FACE_IMAGE_PIXELS,
        sequentialRead: true,
    })
        .removeAlpha()
        .greyscale()
        .resize({ width: 256, height: 256, fit: "inside", withoutEnlargement: true })
        .raw();
    const { data, info } = await runSharpOperation(
        processor,
        (pipeline) => pipeline.toBuffer({ resolveWithObject: true }),
        signal,
    );
    const pixels = new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
    let sum = 0;
    let clippedDark = 0;
    let clippedLight = 0;
    for (const value of pixels) {
        sum += value;
        if (value <= 5) clippedDark += 1;
        if (value >= 250) clippedLight += 1;
    }
    const count = pixels.length || 1;
    const lumaMean = sum / count;
    const darkRatio = clippedDark / count;
    const lightRatio = clippedLight / count;
    const blurVariance = calculateLaplacianVariance(
        pixels,
        info.width,
        info.height,
    );
    const failures = [];
    const warnings = [];
    if (lumaMean < MIN_FACE_PHOTO_LUMA) failures.push("too_dark");
    if (lumaMean > MAX_FACE_PHOTO_LUMA) failures.push("too_bright");
    if (darkRatio > MAX_FACE_PHOTO_CLIPPED_RATIO) failures.push("dark_clipping");
    if (lightRatio > MAX_FACE_PHOTO_CLIPPED_RATIO) failures.push("light_clipping");
    if (blurVariance < MIN_FACE_PHOTO_BLUR_VARIANCE) failures.push("blurred");
    if (lumaMean < 60 || lumaMean > 195) warnings.push("uneven_lighting_risk");
    if (darkRatio > 0.1 || lightRatio > 0.1) warnings.push("exposure_near_limit");
    if (blurVariance < 40) warnings.push("sharpness_near_limit");

    return {
        profileVersion: FACE_PHOTO_QUALITY_PROFILE_VERSION,
        status: failures.length > 0 ? "fail" : warnings.length > 0 ? "warning" : "pass",
        failures,
        warnings,
        metrics: {
            lumaMean: Number(lumaMean.toFixed(2)),
            darkClippedRatio: Number(darkRatio.toFixed(4)),
            lightClippedRatio: Number(lightRatio.toFixed(4)),
            blurVariance: Number(blurVariance.toFixed(2)),
        },
    };
}

/**
 * Confirma a quota total a partir do tamanho efetivamente normalizado.
 *
 * A verificacao e exportada para que o limite tenha um teste unitario barato,
 * sem gerar artificialmente imagens aleatorias de dezenas de megapixeis.
 *
 * @function assertNormalizedFacePhotoQuota
 * @param {{file?: {size?: number}}[]} uploadedFiles - Par ja re-encodado.
 * @returns {void}
 * @throws {AppError} Quando o total normalizado excede 24 MiB.
 */
export function assertNormalizedFacePhotoQuota(uploadedFiles) {
    const totalBytes = uploadedFiles.reduce(
        (total, item) => total + Number(item?.file?.size ?? 0),
        0,
    );

    if (
        !Number.isSafeInteger(totalBytes) ||
        totalBytes < 1 ||
        totalBytes > MAX_NORMALIZED_FACE_PHOTOS_BYTES
    ) {
        throw new AppError(
            400,
            "Quota normalizada de fotografias excedida",
        );
    }
}

/**
 * Descodifica e re-encoda um ficheiro para WebP auto-orientado sem metadados.
 *
 * @async
 * @function normalizeFacePhoto
 * @param {{kind: "frontal"|"perfil", file: object}} uploadedFile - Ficheiro temporario recebido.
 * @param {{signal?: AbortSignal}} [options] - Cancelamento cooperativo.
 * @returns {Promise<{kind: "frontal"|"perfil", file: object}>} Ficheiro WebP normalizado.
 * @throws {AppError} Quando o conteudo nao e uma imagem permitida.
 */
async function normalizeFacePhoto(uploadedFile, { signal } = {}) {
    const { file } = uploadedFile;
    const normalizedPath = `${file.path}.normalized.webp`;

    try {
        const inputOptions = {
            failOn: "warning",
            limitInputPixels: MAX_FACE_IMAGE_PIXELS,
            sequentialRead: true,
        };
        const metadataProcessor = sharp(file.path, inputOptions);
        const metadata = await runSharpOperation(
            metadataProcessor,
            (processor) => processor.metadata(),
            signal,
        );
        assertAllowedDecodedImage(metadata, file.mimetype);
        assertAbortSignalActive(signal, "Processamento da imagem cancelado.");

        const normalizationProcessor = sharp(file.path, inputOptions)
            .rotate()
            .resize({
                width: MAX_NORMALIZED_FACE_IMAGE_EDGE,
                height: MAX_NORMALIZED_FACE_IMAGE_EDGE,
                fit: "inside",
                withoutEnlargement: true,
            })
            .webp({
                lossless: true,
                effort: 5,
            });
        const output = await runSharpOperation(
            normalizationProcessor,
            (processor) => processor.toFile(normalizedPath),
            signal,
        );

        // Sharp nao copia metadados por omissao. Uma leitura independente do
        // output torna essa propriedade verificavel e evita regressao futura.
        const outputMetadataProcessor = sharp(normalizedPath, {
            limitInputPixels: MAX_FACE_IMAGE_PIXELS,
        });
        const normalizedMetadata = await runSharpOperation(
            outputMetadataProcessor,
            (processor) => processor.metadata(),
            signal,
        );
        if (
            normalizedMetadata.format !== "webp" ||
            normalizedMetadata.exif ||
            normalizedMetadata.orientation
        ) {
            throw new AppError(500, "Não foi possível remover metadados da imagem");
        }

        const quality = await analyzeNormalizedPhotoQuality(
            normalizedPath,
            signal,
        );
        if (quality.status === "fail") {
            throw new AppError(
                422,
                "A fotografia não cumpre a qualidade técnica mínima",
                { code: "FACE_PHOTO_QUALITY_FAILED", reasons: quality.failures },
            );
        }

        await safeUnlink(file.path);

        return {
            kind: uploadedFile.kind,
            file: {
                ...file,
                path: normalizedPath,
                filename: path.basename(normalizedPath),
                mimetype: OUTPUT_MIME_TYPE,
                size: output.size,
                quality,
            },
        };
    } catch (error) {
        await Promise.all([safeUnlink(file.path), safeUnlink(normalizedPath)]);
        throw toSafeImageError(error);
    }
}

/**
 * Normaliza o par facial e garante cleanup integral se qualquer lado falhar.
 *
 * @async
 * @function normalizeUploadedFacePhotos
 * @param {{kind: "frontal"|"perfil", file: object}[]} uploadedFiles - Par vindo do Busboy.
 * @param {{signal?: AbortSignal}} [options] - Cancelamento cooperativo.
 * @returns {Promise<{kind: "frontal"|"perfil", file: object}[]>} Par WebP normalizado.
 * @throws {AppError} Quando uma imagem ou a quota total e invalida.
 */
export async function normalizeUploadedFacePhotos(
    uploadedFiles,
    { signal } = {},
) {
    const normalizedFiles = [];

    try {
        // O processamento sequencial reduz o pico de memoria para uploads que
        // chegam perto do limite de pixeis.
        for (const uploadedFile of uploadedFiles) {
            assertAbortSignalActive(signal, "Processamento da imagem cancelado.");
            normalizedFiles.push(
                await normalizeFacePhoto(uploadedFile, { signal }),
            );
        }

        assertAbortSignalActive(signal, "Processamento da imagem cancelado.");
        assertNormalizedFacePhotoQuota(normalizedFiles);
        return normalizedFiles;
    } catch (error) {
        await Promise.all(
            normalizedFiles.map(({ file }) => safeUnlink(file?.path)),
        );
        throw error;
    }
}
