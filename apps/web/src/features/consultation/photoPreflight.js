/**
 * Preflight local, leve e sem upload, para fotografias da consulta.
 *
 * O preflight elimina apenas problemas técnicos óbvios. A avaliação de
 * qualidade e a decisão de processar continuam a pertencer ao backend.
 */
import { inspectFaceWithMediaPipe } from "./mediapipeFacePreflight.js";

export const ACCEPTED_PHOTO_TYPES = Object.freeze([
    "image/jpeg",
    "image/png",
    "image/webp",
]);
export const MAX_PHOTO_BYTES = 10 * 1024 * 1024;
export const MIN_PHOTO_SIDE = 720;
export const MIN_PHOTO_LUMA = 45;
export const MAX_PHOTO_LUMA = 210;
export const MAX_PHOTO_CLIPPED_RATIO = 0.2;
export const MIN_PHOTO_BLUR_VARIANCE = 20;

/**
 * Valida metadata já extraída, permitindo testes sem APIs de imagem do browser.
 */
export function validatePhotoMetadata({ type, size, width, height }) {
    const errors = [];

    if (!ACCEPTED_PHOTO_TYPES.includes(String(type))) {
        errors.push("Usa uma fotografia JPEG, PNG ou WebP.");
    }
    if (!Number.isFinite(size) || size <= 0 || size > MAX_PHOTO_BYTES) {
        errors.push("A fotografia deve ter no máximo 10 MiB.");
    }
    if (
        !Number.isFinite(width) ||
        !Number.isFinite(height) ||
        Math.min(width, height) < MIN_PHOTO_SIDE
    ) {
        errors.push("O lado mais curto da fotografia deve ter pelo menos 720 píxeis.");
    }

    return { ok: errors.length === 0, errors };
}

/** Variância do Laplaciano equivalente ao gate defensivo do backend. */
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

/** Avalia luz, clipping e nitidez sem reconhecer identidade ou rosto. */
export function validatePhotoSignals({
    lumaMean,
    darkClippedRatio,
    lightClippedRatio,
    blurVariance,
}) {
    const errors = [];
    const warnings = [];

    if (lumaMean < MIN_PHOTO_LUMA) errors.push("A fotografia está demasiado escura.");
    if (lumaMean > MAX_PHOTO_LUMA) errors.push("A fotografia está demasiado clara.");
    if (
        darkClippedRatio > MAX_PHOTO_CLIPPED_RATIO ||
        lightClippedRatio > MAX_PHOTO_CLIPPED_RATIO
    ) {
        errors.push("Evita zonas extensas sem detalhe por excesso ou falta de luz.");
    }
    if (blurVariance < MIN_PHOTO_BLUR_VARIANCE) {
        errors.push("A fotografia parece desfocada; mantém a câmara estável.");
    }
    if (lumaMean < 60 || lumaMean > 195) {
        warnings.push("A iluminação está próxima do limite aceite.");
    }
    if (blurVariance < 40) {
        warnings.push("Confirma que os contornos do rosto estão nítidos.");
    }

    return { ok: errors.length === 0, errors, warnings };
}

/** Converte RGBA do canvas numa amostra grayscale e calcula sinais locais. */
function analyzeCanvasPixels(imageData, width, height) {
    const pixels = new Uint8Array(width * height);
    let sum = 0;
    let dark = 0;
    let light = 0;

    for (let source = 0, target = 0; source < imageData.length; source += 4, target += 1) {
        const luma = Math.round(
            imageData[source] * 0.2126 +
                imageData[source + 1] * 0.7152 +
                imageData[source + 2] * 0.0722,
        );
        pixels[target] = luma;
        sum += luma;
        if (luma <= 5) dark += 1;
        if (luma >= 250) light += 1;
    }

    const count = pixels.length || 1;
    return {
        lumaMean: sum / count,
        darkClippedRatio: dark / count,
        lightClippedRatio: light / count,
        blurVariance: calculateLaplacianVariance(pixels, width, height),
    };
}

/** Analisa uma amostra pequena; falhas do canvas não bloqueiam o fallback remoto. */
function analyzeBitmapSignals(bitmap) {
    if (typeof document === "undefined") return null;
    const scale = Math.min(1, 256 / Math.max(bitmap.width, bitmap.height));
    const width = Math.max(3, Math.round(bitmap.width * scale));
    const height = Math.max(3, Math.round(bitmap.height * scale));
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d", { willReadFrequently: true });
    if (!context) return null;
    context.drawImage(bitmap, 0, 0, width, height);
    const { data } = context.getImageData(0, 0, width, height);
    return analyzeCanvasPixels(data, width, height);
}

/** Extrai dimensões com createImageBitmap quando o browser o suporta. */
async function readDimensionsWithBitmap(file, expectedKind) {
    if (typeof createImageBitmap !== "function") return null;
    const bitmap = await createImageBitmap(file);
    try {
        let signals = null;
        try {
            signals = analyzeBitmapSignals(bitmap);
        } catch {
            // O backend repete sempre a análise; canvas local é best-effort.
        }
        const face = await inspectFaceWithMediaPipe(bitmap, expectedKind);
        return { width: bitmap.width, height: bitmap.height, signals, face };
    } finally {
        bitmap.close?.();
    }
}

/** Fallback compatível com browsers sem createImageBitmap. */
function readDimensionsWithImage(file) {
    return new Promise((resolve, reject) => {
        const objectUrl = URL.createObjectURL(file);
        const image = new Image();

        image.onload = () => {
            URL.revokeObjectURL(objectUrl);
            resolve({ width: image.naturalWidth, height: image.naturalHeight });
        };
        image.onerror = () => {
            URL.revokeObjectURL(objectUrl);
            reject(new Error("Não foi possível ler a fotografia."));
        };
        image.src = objectUrl;
    });
}

/**
 * Inspeciona um ficheiro no dispositivo; nunca envia bytes nem guarda a imagem.
 */
export async function inspectPhotoFile(file, { expectedKind } = {}) {
    if (typeof File === "undefined" || !(file instanceof File)) {
        return { ok: false, errors: ["Escolhe um ficheiro de imagem válido."] };
    }

    try {
        const dimensions =
            (await readDimensionsWithBitmap(file, expectedKind)) ??
            (await readDimensionsWithImage(file));
        const metadataResult = validatePhotoMetadata({
                type: file.type,
                size: file.size,
                ...dimensions,
            });
        const signalResult = dimensions.signals
            ? validatePhotoSignals(dimensions.signals)
            : { ok: true, errors: [], warnings: [] };
        const faceResult = dimensions.face ?? {
            ok: true,
            errors: [],
            warnings: [
                "Não foi possível executar a verificação automática neste navegador. Podes continuar; a fotografia será validada em segurança.",
            ],
        };
        return {
            ok: metadataResult.ok && signalResult.ok && faceResult.ok,
            errors: [
                ...metadataResult.errors,
                ...signalResult.errors,
                ...faceResult.errors,
            ],
            warnings: [...signalResult.warnings, ...faceResult.warnings],
            ...dimensions,
        };
    } catch {
        return {
            ok: false,
            errors: ["Não foi possível validar esta fotografia no dispositivo."],
        };
    }
}
