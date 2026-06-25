const MAX_IMAGE_WIDTH = 1280;
const JPEG_QUALITY = 0.82;
const MIN_SIZE_TO_COMPRESS_BYTES = 900_000;

/**
 * Indica se o browser suporta as APIs necessárias para comprimir imagens.
 *
 * @function canCompressInBrowser
 * @returns {boolean} Verdadeiro quando há suporte mínimo para compressão local.
 */
function canCompressInBrowser() {
    return (
        typeof document !== "undefined" &&
        typeof createImageBitmap === "function"
    );
}

/**
 * Calcula dimensões finais mantendo proporção.
 *
 * @function calculateTargetSize
 * @param {{width: number, height: number}} bitmap - Imagem descodificada pelo browser.
 * @returns {{targetWidth: number, targetHeight: number}} Dimensões para o canvas.
 */
function calculateTargetSize(bitmap) {
    // Nunca aumentamos imagens pequenas; a compressão serve para reduzir custo.
    const resizeRatio = Math.min(1, MAX_IMAGE_WIDTH / bitmap.width);

    return {
        targetWidth: Math.round(bitmap.width * resizeRatio),
        targetHeight: Math.round(bitmap.height * resizeRatio),
    };
}

/**
 * Converte o conteúdo de um canvas para Blob JPEG.
 *
 * @function canvasToJpegBlob
 * @param {HTMLCanvasElement} canvas - Canvas com a imagem redimensionada.
 * @returns {Promise<Blob|null>} Blob comprimido ou null se o browser falhar.
 */
function canvasToJpegBlob(canvas) {
    return new Promise((resolve) => {
        canvas.toBlob(resolve, "image/jpeg", JPEG_QUALITY);
    });
}

/**
 * Cria um novo File JPEG preservando o nome base do ficheiro original.
 *
 * @function buildCompressedFile
 * @param {Blob} blob - Conteúdo comprimido.
 * @param {File} originalFile - Ficheiro escolhido pelo utilizador.
 * @returns {File} Ficheiro pronto para anexar ao FormData.
 */
function buildCompressedFile(blob, originalFile) {
    const originalName = originalFile.name.replace(/\.[^.]+$/, "");
    const fileName = `${originalName}.jpg`;

    return new File([blob], fileName, {
        type: "image/jpeg",
        lastModified: originalFile.lastModified,
    });
}

/**
 * Tenta comprimir uma imagem antes do envio para a API.
 *
 * @async
 * @function compressImageForUpload
 * @param {File} file - Ficheiro selecionado no formulário facial.
 * @returns {Promise<File>} Ficheiro comprimido ou original quando o fallback é necessário.
 */
export async function compressImageForUpload(file) {
    if (!file.type.startsWith("image/")) {
        return file;
    }

    if (file.size < MIN_SIZE_TO_COMPRESS_BYTES) {
        return file;
    }

    if (!canCompressInBrowser()) {
        return file;
    }

    let bitmap;

    try {
        bitmap = await createImageBitmap(file);

        const { targetWidth, targetHeight } = calculateTargetSize(bitmap);
        const canvas = document.createElement("canvas");
        canvas.width = targetWidth;
        canvas.height = targetHeight;

        const context = canvas.getContext("2d");

        if (!context) {
            return file;
        }

        // O canvas só existe em memória; a fotografia não é guardada no browser.
        context.drawImage(bitmap, 0, 0, targetWidth, targetHeight);

        const blob = await canvasToJpegBlob(canvas);

        if (!blob || blob.size >= file.size) {
            return file;
        }

        return buildCompressedFile(blob, file);
    } catch {
        // Qualquer falha de descodificação mantém o upload funcional com o ficheiro original.
        return file;
    } finally {
        bitmap?.close?.();
    }
}