/**
 * Renderiza uma imagem com atributos de performance e acessibilidade.
 *
 * @function OptimizedImage
 * @param {{src: string, alt: string, className?: string, eager?: boolean}} props - Dados da imagem.
 * @returns {JSX.Element} Imagem pronta para usar em páginas do Orelle.
 */
export function OptimizedImage({ src, alt, className = "", eager = false }) {
    // Lazy loading é o padrão para não descarregar imagens antes de serem úteis.
    const loadingMode = eager ? "eager" : "lazy";
    const imageClassName = `optimized-image ${className}`.trim();

    return (
        <img
            className={imageClassName}
            src={src}
            alt={alt}
            loading={loadingMode}
            decoding="async"
            // A imagem pode vir de catálogo; não enviamos a página atual como referência.
            referrerPolicy="no-referrer"
        />
    );
}