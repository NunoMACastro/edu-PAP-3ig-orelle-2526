import { useEffect, useState } from "react";
import { apiRequest } from "../services/apiClient.js";

/**
 * Formata valores em cêntimos para moeda euro.
 * @param {number} cents - Valor em cêntimos.
 * @returns {string} Valor formatado em pt-PT.
 */
function euros(cents) {
    return new Intl.NumberFormat("pt-PT", { style: "currency", currency: "EUR" }).format(cents / 100);
}

/**
 * Página administrativa que apresenta métricas agregadas da loja.
 * @returns {JSX.Element} Interface do dashboard.
 */
export function AdminDashboardPage() {
    const [stats, setStats] = useState(null);
    const [status, setStatus] = useState("loading");
    const [error, setError] = useState("");

    useEffect(() => {
        /**
         * Carrega estatísticas agregadas protegidas pela role no backend.
         * @returns {Promise<void>}
         */
        async function loadStats() {
            try {
                // A UI apenas consome agregados; a autorização é validada no servidor.
                const data = await apiRequest("/admin/dashboard/stats", { credentials: "include" });
                setStats(data.stats);
                setStatus("success");
            } catch (err) {
                setError(err.message || "Não foi possível carregar estatísticas.");
                setStatus("error");
            }
        }
        loadStats();
    }, []);

    if (status === "loading") return <p>A carregar estatísticas...</p>;
    if (status === "error") return <p role="alert">{error}</p>;

    return (
        <main>
            <h1>Dashboard</h1>
            <section>
                <p>Encomendas pagas: {stats.orderCount}</p>
                <p>Vendas: {euros(stats.totalSalesCents)}</p>
                <p>Utilizadores ativos: {stats.activeUsers}</p>
            </section>
            <section>
                <h2>Produtos mais vendidos</h2>
                {stats.topProducts.length === 0 ? (
                    <p>Sem vendas registadas.</p>
                ) : (
                    <ol>
                        {stats.topProducts.map((product) => (
                            <li key={product.productId}>
                                {product.name}: {product.unitsSold} unidades, {euros(product.revenueCents)}
                            </li>
                        ))}
                    </ol>
                )}
            </section>
        </main>
    );
}