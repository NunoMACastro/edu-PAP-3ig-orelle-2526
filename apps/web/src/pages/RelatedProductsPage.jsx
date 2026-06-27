/**
 * Pagina de produtos relacionados por catalogo.
 */
import { useState } from "react";
import { OptimizedImage } from "../components/OptimizedImage.jsx";
import { apiRequest } from "../services/apiClient.js";

/**
 * Mostra produtos semelhantes e complementares.
 *
 * @function RelatedProductsPage
 * @returns {JSX.Element} UI de pesquisa de relacionados por ID.
 */
export function RelatedProductsPage() {
    const [productId, setProductId] = useState("");
    const [products, setProducts] = useState([]);
    const [status, setStatus] = useState("idle");
    const [error, setError] = useState("");

    /**
     * Carrega produtos relacionados do endpoint real.
     *
     * @async
     * @function handleSubmit
     * @param {import("react").FormEvent<HTMLFormElement>} event - Evento do formulario.
     * @returns {Promise<void>}
     */
    async function handleSubmit(event) {
        event.preventDefault();
        setStatus("loading");
        setError("");
        setProducts([]);

        try {
            const data = await apiRequest(
                `/catalog/products/${productId}/related`,
            );
            setProducts(data.products);
            setStatus(data.products.length === 0 ? "empty" : "success");
        } catch (err) {
            setError(err.message);
            setStatus("error");
        }
    }

    return (
        <section>
            <h1>Produtos semelhantes e complementares</h1>
            <form onSubmit={handleSubmit}>
                <label>
                    ID do produto
                    <input
                        value={productId}
                        onChange={(event) => setProductId(event.target.value)}
                    />
                </label>
                <button type="submit" disabled={status === "loading"}>
                    {status === "loading" ? "A procurar..." : "Ver relacionados"}
                </button>
            </form>

            {status === "error" && <p role="alert">{error}</p>}
            {status === "empty" && <p>Sem produtos relacionados.</p>}
            {status === "success" && (
                <ul>
                    {products.map((product) => (
                        <li key={product.id}>
                            <OptimizedImage
                                src={product.imageUrl}
                                alt={product.name}
                            />
                            <strong>{product.name}</strong>
                            <span>
                                {(product.priceCents / 100).toFixed(2)} EUR
                            </span>
                        </li>
                    ))}
                </ul>
            )}
        </section>
    );
}
