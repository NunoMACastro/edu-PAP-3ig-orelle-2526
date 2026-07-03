/**
 * Pagina administrativa de stock da MF3.
 */
import { useState } from "react";
import { apiRequest } from "../services/apiClient.js";

/**
 * Lista alertas de baixo stock e permite ajuste manual.
 *
 * @function StockAdminPage
 * @returns {JSX.Element} UI admin de stock.
 */
export function StockAdminPage() {
    const [alerts, setAlerts] = useState([]);
    const [productId, setProductId] = useState("");
    const [stock, setStock] = useState(0);
    const [status, setStatus] = useState("idle");
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    /**
     * Carrega alertas de stock.
     *
     * @async
     * @function loadAlerts
     * @returns {Promise<void>}
     */
    async function loadAlerts() {
        setStatus("loading");
        setError("");
        setMessage("");

        try {
            const data = await apiRequest("/admin/stock/alerts");
            setAlerts(data.products);
            setStatus(data.products.length === 0 ? "empty" : "success");
        } catch (err) {
            setError(err.message);
            setStatus("error");
        }
    }

    /**
     * Submete ajuste manual de stock.
     *
     * @async
     * @function handleStockUpdate
     * @param {import("react").FormEvent<HTMLFormElement>} event - Evento submit.
     * @returns {Promise<void>}
     */
    async function handleStockUpdate(event) {
        event.preventDefault();
        setError("");
        setMessage("");

        try {
            const data = await apiRequest(`/admin/products/${productId}/stock`, {
                method: "PATCH",
                body: JSON.stringify({ stock: Number(stock) }),
            });
            setMessage(`Stock atualizado para ${data.product.stock}.`);
            await loadAlerts();
        } catch (err) {
            setError(err.message);
            setStatus("error");
        }
    }

    return (
        <section>
            <h1>Gestão de stock</h1>
            <button onClick={loadAlerts} disabled={status === "loading"}>
                {status === "loading" ? "A carregar..." : "Ver baixo stock"}
            </button>
            <form onSubmit={handleStockUpdate}>
                <label>
                    ID do produto
                    <input
                        value={productId}
                        onChange={(event) => setProductId(event.target.value)}
                    />
                </label>
                <label>
                    Novo stock
                    <input
                        type="number"
                        min="0"
                        value={stock}
                        onChange={(event) => setStock(event.target.value)}
                    />
                </label>
                <button type="submit">Atualizar stock</button>
            </form>

            {message && <p>{message}</p>}
            {status === "error" && <p role="alert">{error}</p>}
            {status === "empty" && <p>Sem alertas de baixo stock.</p>}
            {status === "success" && (
                <ul>
                    {alerts.map((product) => (
                        <li key={product.productId}>
                            {product.name}: {product.stock} unidades (limite{" "}
                            {product.threshold})
                        </li>
                    ))}
                </ul>
            )}
        </section>
    );
}
