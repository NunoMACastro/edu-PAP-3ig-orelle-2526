/**
 * Identidade visual reutilizável da Orélle.
 *
 * A variante compacta combina o símbolo oficial com um wordmark textual
 * legível em dimensões pequenas. A variante completa preserva a assinatura e
 * a tagline existentes no ficheiro oficial.
 */
import { OptimizedImage } from "./OptimizedImage.jsx";

const BRAND_NAME = "Orélle";
const BRAND_LOCKUP_ALT = "Orélle — Consultoria Cosmética Inteligente";

/**
 * Renderiza a marca oficial em formato compacto ou completo.
 *
 * @param {{variant?: "compact"|"full", tone?: "light"|"dark", priority?: boolean, className?: string}} props - Configuração visual da marca.
 * @returns {JSX.Element} Marca responsiva com dimensões estáveis.
 */
export function BrandLogo({
    variant = "compact",
    tone = "dark",
    priority = false,
    className = "",
}) {
    const logoClassName = [
        "brand-logo",
        `brand-logo--${variant}`,
        `brand-logo--tone-${tone}`,
        className,
    ]
        .filter(Boolean)
        .join(" ");

    if (variant === "full") {
        return (
            <span className={logoClassName}>
                <OptimizedImage
                    src="/brand/orelle-lockup-640.png"
                    alt={BRAND_LOCKUP_ALT}
                    width={640}
                    height={574}
                    className="brand-logo__image"
                    sizes="(max-width: 620px) 280px, 420px"
                    priority={priority}
                    avifSrcSet="/brand/orelle-lockup-320.avif 320w, /brand/orelle-lockup-640.avif 640w"
                    webpSrcSet="/brand/orelle-lockup-320.webp 320w, /brand/orelle-lockup-640.webp 640w"
                />
            </span>
        );
    }

    return (
        <span className={logoClassName}>
            <span aria-hidden="true">
                <OptimizedImage
                    src="/brand/orelle-mark-128.png"
                    alt=""
                    width={128}
                    height={128}
                    className="brand-logo__image"
                    sizes="44px"
                    priority={priority}
                    avifSrcSet="/brand/orelle-mark-64.avif 64w, /brand/orelle-mark-128.avif 128w"
                    webpSrcSet="/brand/orelle-mark-64.webp 64w, /brand/orelle-mark-128.webp 128w"
                />
            </span>
            <span className="brand-logo__wordmark">{BRAND_NAME}</span>
        </span>
    );
}
