/**
 * Card comercial partilhado entre home, catálogo e produtos relacionados.
 *
 * A estrutura mantém imagem e título como links independentes para não criar
 * elementos interativos aninhados quando o consumidor acrescenta ações.
 */
import { Link } from "react-router-dom";
import {
    formatProductPrice,
    formatProductSkinTypes,
} from "../services/productPresentation.js";
import { OptimizedImage } from "./OptimizedImage.jsx";

/**
 * Renderiza um produto público com hierarquia e apresentação Orélle.
 *
 * @param {{product: object, headingLevel?: 2|3, variant?: "standard"|"compact", statusLabel?: string|null, children?: import("react").ReactNode}} props - Produto e ações contextuais.
 * @returns {JSX.Element} Card comercial acessível.
 */
export function ProductCard({
    product,
    headingLevel = 2,
    variant = "standard",
    statusLabel,
    children,
}) {
    const Heading = headingLevel === 3 ? "h3" : "h2";
    const productPath = `/produtos/${product.id}`;
    const derivedStatus = Number.isFinite(Number(product.stock))
        ? Number(product.stock) > 0
            ? "Disponível"
            : "Sem stock"
        : null;
    const visibleStatus = statusLabel === undefined ? derivedStatus : statusLabel;

    return (
        <li className={`product-card product-card--${variant}`}>
            <div className="product-card__media">
                <Link
                    className="product-card__media-link"
                    to={productPath}
                    aria-label={`Ver ${product.name}`}
                >
                    <OptimizedImage
                        src={product.imageUrl}
                        alt={product.name}
                        sizes="(max-width: 620px) calc(100vw - 2rem), (max-width: 920px) 45vw, (max-width: 1359px) 32vw, 280px"
                    />
                </Link>
                {visibleStatus ? (
                    <span
                        className={`product-card__badge ${visibleStatus === "Sem stock" ? "product-card__badge--unavailable" : ""}`.trim()}
                    >
                        {visibleStatus}
                    </span>
                ) : null}
            </div>
            <div className="product-card__body">
                <p className="product-card__category">
                    {formatProductSkinTypes(product.skinTypes)}
                </p>
                <Heading>
                    <Link to={productPath}>{product.name}</Link>
                </Heading>
                {product.brandName ? (
                    <p className="product-card__brand">{product.brandName}</p>
                ) : null}
                {variant === "standard" && product.description ? (
                    <p className="product-card__description">
                        {product.description}
                    </p>
                ) : null}
                <div className="product-card__footer">
                    <strong>{formatProductPrice(product.priceCents)}</strong>
                    {children ? (
                        <div className="product-card__actions">{children}</div>
                    ) : null}
                </div>
            </div>
        </li>
    );
}
