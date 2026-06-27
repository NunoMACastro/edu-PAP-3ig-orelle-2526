/**
 * Pagina de detalhe publico de produto.
 */
import { useState } from "react";
import { OptimizedImage } from "../components/OptimizedImage.jsx";
import { apiRequest } from "../services/apiClient.js";

const PRODUCT_NOT_FOUND_MESSAGE = "Produto não encontrado";

/**
 * Mostra imagem, descricao, ingredientes, preco, stock e resumo de notas.
 *
 * @function ProductDetailsPage
 * @returns {JSX.Element} Formulario por ID e detalhe do produto.
 */
export function ProductDetailsPage() {
    const [productId, setProductId] = useState("");
    const [product, setProduct] = useState(null);
    const [status, setStatus] = useState("idle");
    const [error, setError] = useState("");
    const [cartMessage, setCartMessage] = useState("");

    /**
     * Carrega detalhe por ID.
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
        setCartMessage("");
        setProduct(null);

        try {
            const data = await apiRequest(`/catalog/products/${productId}`);
            setProduct(data.product);
            setStatus("success");
        } catch (err) {
            if (err.message === PRODUCT_NOT_FOUND_MESSAGE) {
                setStatus("empty");
                return;
            }

            setError(err.message);
            setStatus("error");
        }
    }

    /**
     * Adiciona o produto detalhado ao carrinho.
     *
     * @async
     * @function addToCart
     * @returns {Promise<void>}
     */
    async function addToCart() {
        if (!product) return;

        setError("");
        setCartMessage("");

        try {
            await apiRequest("/cart/items", {
                method: "POST",
                body: JSON.stringify({ productId: product.id, quantity: 1 }),
            });
            setCartMessage("Produto adicionado ao carrinho.");
        } catch (err) {
            setError(err.message);
            setStatus("error");
        }
    }

    return (
        <section>
            <h1>Detalhe do produto</h1>
            <form onSubmit={handleSubmit}>
                <label>
                    ID do produto
                    <input
                        value={productId}
                        onChange={(event) => setProductId(event.target.value)}
                    />
                </label>
                <button type="submit" disabled={status === "loading"}>
                    {status === "loading" ? "A carregar..." : "Ver produto"}
                </button>
            </form>

            {status === "error" && <p role="alert">{error}</p>}
            {cartMessage && <p>{cartMessage}</p>}
            {status === "empty" && <p>Produto não encontrado.</p>}
            {status === "success" && product && (
                <article>
                    <OptimizedImage src={product.imageUrl} alt={product.name} />
                    <h2>{product.name}</h2>
                    <p>{product.brandName}</p>
                    <p>{product.description}</p>
                    <p>{(product.priceCents / 100).toFixed(2)} EUR</p>
                    <p>Stock: {product.stock}</p>
                    <button onClick={addToCart}>Adicionar ao carrinho</button>
                    <p>
                        Nota média: {product.reviewSummary.averageRating} (
                        {product.reviewSummary.totalReviews} avaliações)
                    </p>
                    <h3>Ingredientes</h3>
                    <ul>
                        {product.ingredientNames.map((ingredient) => (
                            <li key={ingredient}>{ingredient}</li>
                        ))}
                    </ul>
                    <h3>Produtos relacionados</h3>
                    {product.relatedProducts.length === 0 ? (
                        <p>Sem produtos relacionados neste momento.</p>
                    ) : (
                        <ul>
                            {product.relatedProducts.map((item) => (
                                <li key={item.id}>{item.name}</li>
                            ))}
                        </ul>
                    )}
                </article>
            )}
        </section>
    );
}
