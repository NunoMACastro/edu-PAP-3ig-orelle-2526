/**
 * Imagem otimizada para superfícies visuais da MF6.
 *
 * O componente aplica lazy loading, decoding assíncrono e dimensões estáveis
 * quando fornecidas, reduzindo custo de carregamento sem alterar contratos de
 * produto, simulação ou biometria.
 */
import React from "react";

/**
 * Renderiza imagem com defaults seguros de performance.
 *
 * @function OptimizedImage
 * @param {{src: string, alt: string, width?: string|number, height?: string|number, className?: string}} props - Propriedades da imagem.
 * @returns {JSX.Element|null} Imagem otimizada ou null quando não há src.
 */
export function OptimizedImage({ src, alt, width, height, className }) {
    if (!src) return null;

    return (
        <img
            src={src}
            alt={alt}
            width={width}
            height={height}
            className={className}
            loading="lazy"
            decoding="async"
            referrerPolicy="no-referrer"
        />
    );
}
