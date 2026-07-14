/**
 * Imagem otimizada para superfícies visuais da MF6.
 *
 * O componente centraliza `picture`, AVIF/WebP, fallback visual, prioridade e
 * dimensões estáveis sem alterar os contratos de produto ou biometria.
 */
import { useState } from "react";
import { getProductPictureSources } from "../utils/responsiveImageSources.js";

/**
 * Renderiza imagem com defaults seguros de performance.
 *
 * @function OptimizedImage
 * @param {{src: string, alt: string, width?: string|number, height?: string|number, className?: string, sizes?: string, priority?: boolean, avifSrcSet?: string, webpSrcSet?: string}} props - Propriedades da imagem.
 * @returns {JSX.Element|null} Imagem otimizada ou null quando não há src.
 */
export function OptimizedImage({
    src,
    alt,
    width,
    height,
    className = "",
    sizes = "100vw",
    priority = false,
    avifSrcSet,
    webpSrcSet,
}) {
    const [failed, setFailed] = useState(false);

    const resolvedWidth = width ?? 640;
    const resolvedHeight = height ?? resolvedWidth;
    if (!src) {
        const accessibilityProps = alt
            ? { role: "img", "aria-label": `${alt}. Imagem indisponível.` }
            : { "aria-hidden": true };

        return (
            <span
                className={`optimized-image-fallback ${className}`.trim()}
                {...accessibilityProps}
                style={{
                    aspectRatio: `${resolvedWidth} / ${resolvedHeight}`,
                    maxWidth: "100%",
                }}
            >
                Imagem indisponível
            </span>
        );
    }

    const productSources = getProductPictureSources(src);
    const resolvedAvifSrcSet = avifSrcSet ?? productSources?.avifSrcSet;
    const resolvedWebpSrcSet = webpSrcSet ?? productSources?.webpSrcSet;
    const fallbackSrc = productSources?.fallbackSrc ?? src;

    if (failed) {
        const accessibilityProps = alt
            ? { role: "img", "aria-label": `${alt}. Imagem indisponível.` }
            : { "aria-hidden": true };

        return (
            <span
                className={`optimized-image-fallback ${className}`.trim()}
                {...accessibilityProps}
                style={{
                    aspectRatio: `${resolvedWidth} / ${resolvedHeight}`,
                    maxWidth: "100%",
                }}
            >
                Imagem indisponível
            </span>
        );
    }

    return (
        <picture>
            {resolvedAvifSrcSet ? (
                <source
                    type="image/avif"
                    srcSet={resolvedAvifSrcSet}
                    sizes={sizes}
                />
            ) : null}
            {resolvedWebpSrcSet ? (
                <source
                    type="image/webp"
                    srcSet={resolvedWebpSrcSet}
                    sizes={sizes}
                />
            ) : null}
            <img
                src={fallbackSrc}
                alt={alt}
                width={resolvedWidth}
                height={resolvedHeight}
                className={className}
                sizes={sizes}
                loading={priority ? "eager" : "lazy"}
                fetchpriority={priority ? "high" : undefined}
                decoding="async"
                referrerPolicy="no-referrer"
                onError={() => setFailed(true)}
            />
        </picture>
    );
}
