/**
 * Utilitários de otimização de imagem da MF6.
 *
 * A compressão acontece apenas no browser e usa APIs nativas. Se o ambiente
 * não suportar canvas, a função devolve o ficheiro original para preservar o
 * fluxo de upload e deixar a validação final no backend.
 */

const DEFAULT_MAX_DIMENSION = 1600;
const DEFAULT_QUALITY = 0.82;

/**
 * Redimensiona uma dimensão mantendo proporção.
 *
 * @function scaleDimensions
 * @param {number} width - Largura original.
 * @param {number} height - Altura original.
 * @param {number} maxDimension - Maior dimensão permitida.
 * @returns {{width: number, height: number}} Dimensões finais.
 */
function scaleDimensions(width, height, maxDimension) {
    const ratio = Math.min(1, maxDimension / Math.max(width, height));

    return {
        width: Math.max(1, Math.round(width * ratio)),
        height: Math.max(1, Math.round(height * ratio)),
    };
}

/**
 * Converte `canvas.toBlob` para Promise.
 *
 * @function canvasToBlob
 * @param {HTMLCanvasElement} canvas - Canvas com a imagem redimensionada.
 * @param {string} type - MIME original.
 * @param {number} quality - Qualidade de compressão.
 * @returns {Promise<Blob|null>} Blob comprimido ou null.
 */
function canvasToBlob(canvas, type, quality) {
    return new Promise((resolve) => {
        canvas.toBlob(resolve, type, quality);
    });
}

/**
 * Comprime uma imagem antes do upload quando isso reduz o tamanho.
 *
 * @async
 * @function compressImageForUpload
 * @param {File} file - Imagem escolhida pelo utilizador.
 * @param {{maxDimension?: number, quality?: number}} [options={}] - Orçamento de compressão.
 * @returns {Promise<File>} Ficheiro original ou versão comprimida.
 */
export async function compressImageForUpload(file, options = {}) {
    if (
        !file?.type?.startsWith("image/") ||
        typeof createImageBitmap !== "function" ||
        typeof document === "undefined"
    ) {
        return file;
    }

    const maxDimension = options.maxDimension ?? DEFAULT_MAX_DIMENSION;
    const quality = options.quality ?? DEFAULT_QUALITY;
    let bitmap;

    try {
        bitmap = await createImageBitmap(file);
        const size = scaleDimensions(bitmap.width, bitmap.height, maxDimension);
        const canvas = document.createElement("canvas");

        canvas.width = size.width;
        canvas.height = size.height;
        canvas.getContext("2d").drawImage(bitmap, 0, 0, size.width, size.height);

        const blob = await canvasToBlob(canvas, file.type, quality);

        if (!blob || blob.size >= file.size) {
            return file;
        }

        return new File([blob], file.name, {
            type: file.type,
            lastModified: file.lastModified,
        });
    } catch {
        return file;
    } finally {
        bitmap?.close?.();
    }
}
