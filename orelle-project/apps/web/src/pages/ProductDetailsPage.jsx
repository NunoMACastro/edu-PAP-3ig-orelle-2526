import { useState } from "react";
import { apiRequest } from "../services/apiClient.js";

export function ProductDetailsPage() {
    const [productId, setProductId] = useState("");
    const [product, setProduct] = useState(null);
    const [status, setStatus] = useState("idle");
    const [error, setError] = useState("");

    async function handleSubmit(event) {
        event.preventDefault();
        setStatus("loading");
        setError("");
        setProduct(null);

        try {
            const data = await apiRequest(`/catalog/products/${productId}`);
            setProduct(data.product);
            setStatus("success");
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
            {status === "success" && product && (
                <article>
                    <img src={product.imageUrl} alt={product.name} />
                    <h2>{product.name}</h2>
                    <p>{product.brandName}</p>
                    <p>{product.description}</p>
                    <p>{(product.priceCents / 100).toFixed(2)} €</p>
                    <p>Stock: {product.stock}</p>
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