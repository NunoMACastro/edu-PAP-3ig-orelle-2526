/**
 * Página editorial de produtos semelhantes e complementares.
 */
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ProductCard } from "../components/ProductCard.jsx";
import { apiRequest } from "../services/apiClient.js";

/**
 * Mostra todos os produtos relacionados devolvidos pelo catálogo público.
 *
 * @returns {JSX.Element} Grelha relacionada, responsiva e acessível.
 */
export function RelatedProductsPage() {
    const { productId } = useParams();
    const [products, setProducts] = useState([]);
    const [status, setStatus] = useState("idle");
    const [error, setError] = useState("");

    useEffect(() => {
        const controller = new AbortController();
        loadRelatedProducts(controller.signal);
        return () => controller.abort();
        // A rota define o produto de referência.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [productId]);

    /** Carrega relacionados e ignora respostas canceladas de rotas antigas. */
    async function loadRelatedProducts(signal) {
        if (!productId) return;

        setStatus("loading");
        setError("");
        setProducts([]);

        try {
            const data = await apiRequest(`/catalog/products/${productId}/related`, {
                signal,
            });
            const nextProducts = Array.isArray(data.products) ? data.products : [];
            setProducts(nextProducts);
            setStatus(nextProducts.length === 0 ? "empty" : "success");
        } catch (requestError) {
            if (requestError.code === "REQUEST_ABORTED" || signal.aborted) return;
            setError(requestError.message);
            setStatus("error");
        }
    }

    return (
        <section
            className="related-products-page commerce-page"
            aria-labelledby="related-products-title"
        >
            <nav className="commerce-breadcrumb" aria-label="Breadcrumb">
                <Link to="/produtos">Catálogo</Link>
                <span aria-hidden="true">/</span>
                <Link to={`/produtos/${productId}`}>Produto</Link>
                <span aria-hidden="true">/</span>
                <span>Relacionados</span>
            </nav>

            <header className="related-products-page__header">
                <p className="app-kicker">Seleção complementar</p>
                <h1 id="related-products-title">
                    Produtos semelhantes e complementares
                </h1>
                <p>
                    Continua a explorar opções com afinidade de categoria, tipo de
                    pele ou marca.
                </p>
            </header>

            {status === "loading" ? (
                <p role="status">A procurar relacionados...</p>
            ) : null}
            {status === "error" ? <p role="alert">{error}</p> : null}
            {status === "empty" ? (
                <p>Ainda não existem produtos relacionados disponíveis.</p>
            ) : null}
            {status === "success" ? (
                <ul className="product-card-grid related-products-page__grid">
                    {products.map((product) => (
                        <ProductCard
                            key={product.id}
                            product={product}
                            variant="compact"
                            statusLabel="Disponível"
                        >
                            <Link className="text-link" to={`/produtos/${product.id}`}>
                                Ver produto
                            </Link>
                        </ProductCard>
                    ))}
                </ul>
            ) : null}
        </section>
    );
}
