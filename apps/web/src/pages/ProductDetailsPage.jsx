/**
 * Detalhe comercial público de um produto Orélle.
 */
import { useEffect, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { OptimizedImage } from "../components/OptimizedImage.jsx";
import { ProductCard } from "../components/ProductCard.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { useCart } from "../context/CartContext.jsx";
import { apiRequest } from "../services/apiClient.js";
import {
    getProductCoverageLabel,
    getProductFinishLabel,
    getProductTextureLabel,
    getProductUndertoneLabel,
    getProductUvaLabel,
    getSkinTypeLabel,
} from "../services/presentationLabels.js";
import {
    formatProductPrice,
    getSafeProductColor,
} from "../services/productPresentation.js";

const PRODUCT_NOT_FOUND_MESSAGE = "Produto não encontrado";

/** Cria factos comerciais apenas a partir de atributos realmente disponíveis. */
function getProductFacts(product) {
    const attributes = product?.attributes ?? {};

    return [
        attributes.texture
            ? { label: "Textura", value: getProductTextureLabel(attributes.texture) }
            : null,
        attributes.finish
            ? { label: "Acabamento", value: getProductFinishLabel(attributes.finish) }
            : null,
        attributes.coverage
            ? { label: "Cobertura", value: getProductCoverageLabel(attributes.coverage) }
            : null,
        attributes.fragranceFree === true
            ? { label: "Fragrância", value: "Sem fragrância" }
            : null,
        Number(attributes.spf) > 0
            ? { label: "Proteção solar", value: `SPF ${attributes.spf}` }
            : null,
        attributes.uvaRating && attributes.uvaRating !== "none"
            ? { label: "Proteção UVA", value: getProductUvaLabel(attributes.uvaRating) }
            : null,
        Number(attributes.waterResistantMinutes) > 0
            ? {
                  label: "Resistência à água",
                  value: `${attributes.waterResistantMinutes} minutos`,
              }
            : null,
    ].filter(Boolean);
}

/** Formata o resumo de avaliações sem destacar um zero pouco informativo. */
function formatReviewSummary(reviewSummary) {
    const totalReviews = Number(reviewSummary?.totalReviews ?? 0);
    if (totalReviews < 1) return "Ainda sem avaliações";

    const average = Number(reviewSummary?.averageRating ?? 0).toLocaleString(
        "pt-PT",
        { maximumFractionDigits: 2 },
    );
    return `★ ${average} · ${totalReviews} ${totalReviews === 1 ? "avaliação" : "avaliações"}`;
}

/**
 * Mostra imagem, variantes, compra e informação editorial do produto.
 *
 * @returns {JSX.Element} Detalhe público responsivo.
 */
export function ProductDetailsPage() {
    const { user } = useAuth();
    const { addItem, actionStatus } = useCart();
    const location = useLocation();
    const { productId } = useParams();
    const [product, setProduct] = useState(null);
    const [status, setStatus] = useState("idle");
    const [error, setError] = useState("");
    const [relatedProducts, setRelatedProducts] = useState([]);
    const [relatedStatus, setRelatedStatus] = useState("idle");
    const [relatedError, setRelatedError] = useState("");
    const [cartError, setCartError] = useState("");
    const [selectedVariantId, setSelectedVariantId] = useState("");
    const isClient = user?.role === "cliente";
    const cartBusy = actionStatus === "loading";

    useEffect(() => {
        const controller = new AbortController();
        loadProduct(controller.signal);
        loadRelatedProducts(controller.signal);
        return () => controller.abort();
        // A rota e a query de variante definem a apresentação inicial.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [productId, location.search]);

    /** Carrega o detalhe principal sem depender dos produtos relacionados. */
    async function loadProduct(signal) {
        if (!productId) return;

        setStatus("loading");
        setError("");
        setCartError("");
        setProduct(null);

        try {
            const data = await apiRequest(`/catalog/products/${productId}`, { signal });
            const loadedProduct = data.product;
            const variants = Array.isArray(loadedProduct?.variants)
                ? loadedProduct.variants
                : [];
            const requestedVariantId = new URLSearchParams(location.search).get(
                "variant",
            );
            const requestedVariant = variants.find(
                (variant) => variant.variantId === requestedVariantId,
            );

            setProduct(loadedProduct);
            setSelectedVariantId(
                requestedVariant?.variantId ??
                    (variants.length === 1 ? variants[0].variantId : ""),
            );
            setStatus("success");
        } catch (requestError) {
            if (requestError.code === "REQUEST_ABORTED" || signal.aborted) return;
            if (requestError.message === PRODUCT_NOT_FOUND_MESSAGE) {
                setStatus("empty");
                return;
            }

            setError(requestError.message);
            setStatus("error");
        }
    }

    /** Carrega relacionados como conteúdo progressivo e não bloqueante. */
    async function loadRelatedProducts(signal) {
        if (!productId) return;

        setRelatedStatus("loading");
        setRelatedError("");
        setRelatedProducts([]);

        try {
            const data = await apiRequest(`/catalog/products/${productId}/related`, {
                signal,
            });
            const products = Array.isArray(data.products) ? data.products : [];
            setRelatedProducts(products);
            setRelatedStatus(products.length > 0 ? "success" : "empty");
        } catch (requestError) {
            if (requestError.code === "REQUEST_ABORTED" || signal.aborted) return;
            setRelatedError(requestError.message);
            setRelatedStatus("error");
        }
    }

    /** Adiciona ao carrinho a variante comercial atualmente selecionada. */
    async function addToCart() {
        if (!product || cartBusy) return;

        setCartError("");

        const variants = Array.isArray(product.variants) ? product.variants : [];
        const selectedVariant = variants.find(
            (variant) => variant.variantId === selectedVariantId,
        );
        if (variants.length > 0 && !selectedVariant) {
            setCartError("Escolhe uma variante antes de adicionar ao carrinho.");
            return;
        }
        if (Number(selectedVariant?.stock ?? product.stock) < 1) {
            setCartError("Este produto está sem stock neste momento.");
            return;
        }

        try {
            await addItem({
                productId: product.id,
                ...(selectedVariant
                    ? { variantId: selectedVariant.variantId }
                    : {}),
                quantity: 1,
            });
        } catch {
            // O drawer global apresenta o erro confirmado pelo provider.
        }
    }

    const variants = Array.isArray(product?.variants) ? product.variants : [];
    const selectedVariant = variants.find(
        (variant) => variant.variantId === selectedVariantId,
    );
    const effectivePriceCents = Number.isInteger(selectedVariant?.priceCents)
        ? selectedVariant.priceCents
        : product?.priceCents;
    const effectiveStock = selectedVariant?.stock ?? product?.stock ?? 0;
    const effectiveImageUrl = selectedVariant?.imageUrl || product?.imageUrl;
    const canAddToCart =
        variants.length === 0
            ? effectiveStock > 0
            : Boolean(selectedVariant && effectiveStock > 0);
    const productFacts = getProductFacts(product);
    const skinTypes = Array.isArray(product?.skinTypes) ? product.skinTypes : [];

    return (
        <section
            className="product-detail-page commerce-page"
            aria-labelledby={product ? "product-detail-title" : undefined}
        >
            <nav className="commerce-breadcrumb" aria-label="Breadcrumb">
                <Link to="/produtos">Catálogo</Link>
                <span aria-hidden="true">/</span>
                <span>{product?.name ?? "Produto"}</span>
            </nav>

            {status === "error" ? <p role="alert">{error}</p> : null}
            {status === "loading" ? (
                <p role="status">A carregar produto...</p>
            ) : null}
            {status === "empty" ? <p>Produto não encontrado.</p> : null}

            {status === "success" && product ? (
                <>
                    <article className="product-detail-hero">
                        <div className="product-detail-media">
                            <OptimizedImage
                                src={effectiveImageUrl}
                                alt={product.name}
                                width={960}
                                height={960}
                                priority
                                className="product-detail-media__image"
                                sizes="(max-width: 760px) calc(100vw - 2rem), 52vw"
                            />
                        </div>

                        <div className="product-purchase-panel">
                            <p className="app-kicker">{product.brandName}</p>
                            <h1 id="product-detail-title">{product.name}</h1>
                            <p className="product-review-summary">
                                {formatReviewSummary(product.reviewSummary)}
                            </p>
                            <p className="product-detail-description">
                                {product.description}
                            </p>

                            {skinTypes.length > 0 ? (
                                <ul
                                    className="product-skin-chips"
                                    aria-label="Tipos de pele indicados"
                                >
                                    {skinTypes.map((skinType) => (
                                        <li key={skinType}>
                                            {getSkinTypeLabel(skinType)}
                                        </li>
                                    ))}
                                </ul>
                            ) : null}

                            {variants.length > 0 ? (
                                <fieldset className="product-variant-picker">
                                    <legend>Escolhe a variante</legend>
                                    <div className="product-variant-grid">
                                        {variants.map((variant) => {
                                            const safeColor = getSafeProductColor(
                                                variant.colorHex,
                                            );
                                            return (
                                                <label
                                                    className={`product-variant-option ${selectedVariantId === variant.variantId ? "product-variant-option--selected" : ""}`.trim()}
                                                    key={variant.variantId}
                                                >
                                                    <input
                                                        type="radio"
                                                        name="product-variant"
                                                        value={variant.variantId}
                                                        aria-label={variant.label}
                                                        checked={
                                                            selectedVariantId ===
                                                            variant.variantId
                                                        }
                                                        onChange={(event) =>
                                                            setSelectedVariantId(
                                                                event.target.value,
                                                            )
                                                        }
                                                        disabled={cartBusy}
                                                    />
                                                    {safeColor ? (
                                                        <span
                                                            className="product-variant-option__swatch"
                                                            style={{ backgroundColor: safeColor }}
                                                            aria-hidden="true"
                                                        />
                                                    ) : null}
                                                    <span className="product-variant-option__copy">
                                                        <strong>{variant.label}</strong>
                                                        <small>
                                                            {[
                                                                variant.undertone
                                                                    ? getProductUndertoneLabel(
                                                                          variant.undertone,
                                                                      )
                                                                    : null,
                                                                variant.finish
                                                                    ? getProductFinishLabel(
                                                                          variant.finish,
                                                                      )
                                                                    : null,
                                                                variant.coverage
                                                                    ? getProductCoverageLabel(
                                                                          variant.coverage,
                                                                      )
                                                                    : null,
                                                            ]
                                                                .filter(Boolean)
                                                                .join(" · ")}
                                                        </small>
                                                    </span>
                                                </label>
                                            );
                                        })}
                                    </div>
                                </fieldset>
                            ) : null}

                            <div className="product-purchase-summary">
                                <strong className="product-detail-price">
                                    {selectedVariant || variants.length === 0
                                        ? formatProductPrice(effectivePriceCents)
                                        : `Desde ${formatProductPrice(product.priceCents)}`}
                                </strong>
                                <span
                                    className={`product-stock-chip ${effectiveStock < 1 ? "product-stock-chip--unavailable" : ""}`.trim()}
                                >
                                    {selectedVariant || variants.length === 0
                                        ? `Stock: ${effectiveStock}`
                                        : "Seleciona uma variante para confirmar o stock"}
                                </span>
                            </div>

                            {cartError ? <p role="alert">{cartError}</p> : null}
                            <div className="product-purchase-actions">
                                {isClient ? (
                                    <button
                                        type="button"
                                        onClick={addToCart}
                                        disabled={cartBusy || !canAddToCart}
                                    >
                                        {cartBusy
                                            ? "A adicionar..."
                                            : variants.length > 0 && !selectedVariant
                                              ? "Escolhe uma variante"
                                              : effectiveStock < 1
                                                ? "Sem stock"
                                                : "Adicionar ao carrinho"}
                                    </button>
                                ) : user ? (
                                    <p>Carrinho disponível apenas para clientes.</p>
                                ) : (
                                    <Link
                                        className="product-detail__primary-action"
                                        to="/login"
                                        state={{ from: location }}
                                    >
                                        Entrar para comprar
                                    </Link>
                                )}

                                {isClient ? (
                                    <Link
                                        className="product-detail__secondary-action"
                                        to={`/produtos/${product.id}/avaliar`}
                                    >
                                        Avaliar produto
                                    </Link>
                                ) : !user ? (
                                    <Link
                                        className="product-detail__secondary-action"
                                        to="/login"
                                        state={{ from: location }}
                                    >
                                        Entrar para avaliar
                                    </Link>
                                ) : null}
                            </div>
                        </div>
                    </article>

                    <div className="product-detail-information">
                        <section aria-labelledby="product-about-title">
                            <p className="app-kicker">Conhece o produto</p>
                            <h2 id="product-about-title">Sobre este cuidado</h2>
                            <p>{product.description}</p>
                        </section>

                        {productFacts.length > 0 ? (
                            <section aria-labelledby="product-facts-title">
                                <p className="app-kicker">Características</p>
                                <h2 id="product-facts-title">Detalhes cosméticos</h2>
                                <dl className="product-facts-grid">
                                    {productFacts.map((fact) => (
                                        <div key={fact.label}>
                                            <dt>{fact.label}</dt>
                                            <dd>{fact.value}</dd>
                                        </div>
                                    ))}
                                </dl>
                            </section>
                        ) : null}

                        <section aria-labelledby="product-ingredients-title">
                            <p className="app-kicker">Transparência</p>
                            <h2 id="product-ingredients-title">Ingredientes</h2>
                            <ul className="product-ingredient-list">
                                {(product.ingredientNames ?? []).map((ingredient) => (
                                    <li key={ingredient}>{ingredient}</li>
                                ))}
                            </ul>
                        </section>
                    </div>

                    <section
                        className="related-products-preview"
                        aria-labelledby="related-products-preview-title"
                    >
                        <header>
                            <div>
                                <p className="app-kicker">Continua a descobrir</p>
                                <h2 id="related-products-preview-title">
                                    Também podes gostar
                                </h2>
                            </div>
                            {relatedStatus === "success" ? (
                                <Link
                                    className="text-link"
                                    to={`/produtos/${product.id}/relacionados`}
                                >
                                    Ver todos
                                </Link>
                            ) : null}
                        </header>

                        {relatedStatus === "loading" ? (
                            <p role="status">A procurar produtos relacionados...</p>
                        ) : null}
                        {relatedStatus === "error" ? (
                            <p role="status">
                                Não foi possível carregar as sugestões relacionadas.
                                {relatedError ? " Tenta novamente mais tarde." : ""}
                            </p>
                        ) : null}
                        {relatedStatus === "empty" ? (
                            <p>Ainda não existem produtos relacionados disponíveis.</p>
                        ) : null}
                        {relatedStatus === "success" ? (
                            <ul className="product-card-grid related-products-grid">
                                {relatedProducts.slice(0, 3).map((relatedProduct) => (
                                    <ProductCard
                                        key={relatedProduct.id}
                                        product={relatedProduct}
                                        headingLevel={3}
                                        variant="compact"
                                        statusLabel="Disponível"
                                    >
                                        <Link
                                            className="text-link"
                                            to={`/produtos/${relatedProduct.id}`}
                                        >
                                            Ver produto
                                        </Link>
                                    </ProductCard>
                                ))}
                            </ul>
                        ) : null}
                    </section>
                </>
            ) : null}
        </section>
    );
}
