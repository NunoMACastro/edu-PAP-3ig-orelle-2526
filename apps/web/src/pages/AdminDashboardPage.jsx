/** Dashboard administrativo com carregamento automático e estados resilientes. */
import { useEffect } from "react";
import { AdminIconButton, AdminPageHeader } from "../components/AdminUi.jsx";
import { EmptyState, Skeleton } from "../components/OrelleUi.jsx";
import { useAsyncResource } from "../hooks/useAsyncResource.js";
import { apiRequest } from "../services/apiClient.js";

/** Mostra estatísticas agregadas sem exigir uma ação inicial redundante. */
export function AdminDashboardPage() {
    const statsResource = useAsyncResource(async ({ signal }) => {
        const data = await apiRequest("/admin/dashboard/stats", { signal });
        return data.stats;
    });
    const loadStats = statsResource.load;
    useEffect(() => { void loadStats(); }, [loadStats]);
    const stats = statsResource.data;

    return (
        <section className="admin-page admin-dashboard-page">
            <AdminPageHeader eyebrow="Visão geral" title="Painel administrativo" description="Acompanha encomendas, utilização e desempenho do catálogo." actions={<AdminIconButton icon="refresh" label="Atualizar estatísticas" onClick={() => void loadStats()} disabled={statsResource.status === "loading"} />} />
            {statsResource.status === "loading" && !stats ? <div className="admin-stat-grid"><Skeleton /><Skeleton /><Skeleton /></div> : null}
            {statsResource.status === "error" ? <div className="admin-inline-error" role="alert"><p>Não foi possível carregar as estatísticas.</p><button type="button" onClick={() => void loadStats()}>Tentar novamente</button></div> : null}
            {stats ? (
                <>
                    <div className="admin-stat-grid" aria-busy={statsResource.status === "loading"}>
                        <article><span>Encomendas</span><strong>{stats.orderCount}</strong><small>confirmações registadas</small></article>
                        <article><span>Valor das encomendas</span><strong>{new Intl.NumberFormat("pt-PT", { style: "currency", currency: "EUR" }).format(stats.totalSalesCents / 100)}</strong><small>sem movimentos financeiros</small></article>
                        <article><span>Utilizadores</span><strong>{stats.activeUsers}</strong><small>contas ativas</small></article>
                    </div>
                    <section className="admin-panel admin-top-products">
                        <header><div><p>Catálogo</p><h2>Produtos mais vendidos</h2></div><span>{stats.topProducts.length} produtos</span></header>
                        {stats.topProducts.length === 0 ? <EmptyState title="Ainda não existem encomendas" description="Os produtos mais escolhidos aparecem aqui após a primeira encomenda confirmada." /> : <ol>{stats.topProducts.map((product, index) => <li key={product.productId}><span>{String(index + 1).padStart(2, "0")}</span><strong>{product.name}</strong><em>{product.unitsSold} unidades</em></li>)}</ol>}
                    </section>
                </>
            ) : null}
        </section>
    );
}
