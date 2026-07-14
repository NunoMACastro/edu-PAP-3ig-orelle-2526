/**
 * Utilitários puros para construir fontes responsivas de imagens Orelle.
 *
 * Os produtos continuam a receber `imageUrl` da API. Quando esse URL segue o
 * contrato `/products/<slug>.png`, a UI acrescenta variantes AVIF/WebP sem
 * alterar o payload público nem exigir um novo endpoint.
 */

export const PRODUCT_IMAGE_WIDTHS = Object.freeze([320, 640, 960]);

/**
 * Constrói um `srcset` ordenado por largura.
 *
 * @param {string} prefix - Caminho sem extensão e sem sufixo de largura.
 * @param {"avif"|"webp"} format - Formato das variantes geradas.
 * @param {number[]} [widths] - Larguras disponíveis.
 * @returns {string} Valor para o atributo `srcset`.
 */
export function buildResponsiveSrcSet(
    prefix,
    format,
    widths = PRODUCT_IMAGE_WIDTHS,
) {
    return widths.map((width) => `${prefix}-${width}.${format} ${width}w`).join(", ");
}

/**
 * Deriva as variantes publicadas a partir de um URL de produto da API.
 *
 * URLs HTTP de desenvolvimento são convertidos em caminhos same-origin, sem
 * incorporar hosts de loopback no bundle. URLs HTTPS externos preservam a
 * origem, permitindo que um CDN sirva o mesmo contrato de variantes. Se as
 * variantes não existirem, o browser usa automaticamente o PNG original.
 *
 * @param {string} src - URL recebido da API ou caminho público.
 * @param {string} [currentOrigin] - Origem da página, injetável em testes.
 * @returns {{avifSrcSet: string, webpSrcSet: string, fallbackSrc: string}|null} Fontes responsivas ou `null` fora do contrato de produto.
 */
export function getProductPictureSources(
    src,
    currentOrigin = globalThis.location?.origin ?? "http://orelle.local",
) {
    if (typeof src !== "string" || src.trim() === "") return null;

    let parsedUrl;

    try {
        parsedUrl = new URL(src, currentOrigin);
    } catch {
        return null;
    }

    const match = parsedUrl.pathname.match(/^\/products\/([a-z0-9-]+)\.png$/i);
    if (!match) return null;

    const originPrefix =
        src.startsWith("/") ||
        parsedUrl.protocol === "http:" ||
        parsedUrl.origin === currentOrigin
            ? ""
            : parsedUrl.origin;
    const imagePrefix = `${originPrefix}/products/${match[1]}`;

    return {
        avifSrcSet: buildResponsiveSrcSet(imagePrefix, "avif"),
        webpSrcSet: buildResponsiveSrcSet(imagePrefix, "webp"),
        fallbackSrc: `${imagePrefix}.png`,
    };
}
