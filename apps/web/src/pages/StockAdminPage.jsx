// client/src/pages/StockAdminPage.jsx
import { useEffect, useState } from "react";
import { apiRequest } from "../services/apiClient.js";

/**
 * Página administrativa para consultar alertas e atualizar stock.
 * @returns {JSX.Element} Interface de gestão de stock.
 */
export function StockAdminPage() {
    const [products, setProducts] = useState([]);
    const [status, setStatus] = useState("loading");
    const [error, setError] = useState("");

    /**
     * Carrega produtos abaixo do limite de stock.
     * @returns {Promise<void>}
     */
    async function loadAlerts() {
        setStatus("loading");
        try {
            // A role administrativa é validada no backend; a UI não decide permissões.
            const data = await apiRequest("/admin/stock/alerts", { credentials: "include" });
            setProducts(data.products);
            setStatus("success");
        } catch (err) {
            setError(err.message || "Não foi possível carregar stock.");
            setStatus("error");
        }
    }

    /**
     * Atualiza manualmente o stock e recarrega a lista de alertas.
     * @param {string} productId - Produto a atualizar.
     * @param {number} stock - Novo stock pretendido.
     * @returns {Promise<void>}
     */
    async function updateStock(productId, stock) {
        setError("");
        try {
            await apiRequest(`/admin/products/${productId}/stock`, {
                method: "PATCH",
                credentials: "include",
                body: JSON.stringify({ stock }),
            });
            await loadAlerts();
        } catch (err) {
            setError(err.message || "Não foi possível atualizar stock.");
        }
    }

    useEffect(() => {
        loadAlerts();
    }, []);

    if (status === "loading") return <p>A carregar alertas...</p>;
    if (status === "error") return <p role="alert">{error}</p>;

    return (
        <main>
            <h1>Gestão de stock</h1>
            {error ? <p role="alert">{error}</p> : null}
            {products.length === 0 ? (
                <p>Não existem alertas de baixo stock.</p>
            ) : (
                products.map((product) => (
                    <article key={product.productId}>
                        <h2>{product.name}</h2>
                        <p>Stock atual: {product.stock}</p>
                        <label>
                            Novo stock
                            <input
                                type="number"
                                min="0"
                                defaultValue={product.stock}
                                onBlur={(event) => updateStock(product.productId, Number(event.target.value))}
                            />
                        </label>
                    </article>
                ))
            )}
        </main>
    );
}