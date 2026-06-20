/**
 * Pagina de dashboard administrativo da MF3.
 */
import { useState } from "react";
import { apiRequest } from "../services/apiClient.js";

/**
 * Mostra estatisticas agregadas de vendas e utilizacao.
 *
 * @function AdminDashboardPage
 * @returns {JSX.Element} Dashboard admin.
 */
export function AdminDashboardPage() {
    const [stats, setStats] = useState(null);
    const [status, setStatus] = useState("idle");
    const [error, setError] = useState("");

    /**
     * Carrega estatisticas administrativas.
     *
     * @async
     * @function loadStats
     * @returns {Promise<void>}
     */
    async function loadStats() {
        setStatus("loading");
        setError("");

        try {
            const data = await apiRequest("/admin/dashboard/stats");
            setStats(data.stats);
            setStatus("success");
        } catch (err) {
            setError(err.message);
            setStatus("error");
        }
    }

    return (
        <section>
            <h1>Dashboard administrativo</h1>
            <button onClick={loadStats} disabled={status === "loading"}>
                {status === "loading" ? "A carregar..." : "Ver estatísticas"}
            </button>
            {status === "error" && <p role="alert">{error}</p>}
            {status === "success" && stats && (
                <article>
                    <p>Encomendas pagas: {stats.orderCount}</p>
                    <p>Vendas: {(stats.totalSalesCents / 100).toFixed(2)} EUR</p>
                    <p>Utilizadores ativos: {stats.activeUsers}</p>
                    <h2>Produtos mais vendidos</h2>
                    {stats.topProducts.length === 0 ? (
                        <p>Sem vendas pagas registadas.</p>
                    ) : (
                        <ul>
                            {stats.topProducts.map((product) => (
                                <li key={product.productId}>
                                    {product.name}: {product.unitsSold} unidades
                                </li>
                            ))}
                        </ul>
                    )}
                </article>
            )}
        </section>
    );
}
