/** Gestão administrativa de stock com inventário e alertas automáticos. */
import { useCallback, useEffect, useState } from "react";
import { AdminIconButton, AdminPageHeader, AdminPagination, AdminStatusBadge } from "../components/AdminUi.jsx";
import { EmptyState, Skeleton } from "../components/OrelleUi.jsx";
import { apiRequest } from "../services/apiClient.js";
import { listProductsForAiCuration } from "../services/productAiCuration.js";

const ADMIN_STOCK_PAGE_SIZE = 20;
const EMPTY_PAGINATION = Object.freeze({
    page: 1,
    pageSize: ADMIN_STOCK_PAGE_SIZE,
    total: 0,
    totalPages: 0,
});

/** Lista o inventário completo e permite um ajuste explícito por produto. */
export function StockAdminPage() {
    const [alerts, setAlerts] = useState([]);
    const [products, setProducts] = useState([]);
    const [productId, setProductId] = useState("");
    const [stock, setStock] = useState(0);
    const [status, setStatus] = useState("loading");
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const [actionStatus, setActionStatus] = useState("idle");
    const [search, setSearch] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState(EMPTY_PAGINATION);

    const loadInventory = useCallback(async (signal, requestedPage, requestedSearch) => {
        setStatus("loading");
        setError("");
        try {
            const [catalogData, alertData] = await Promise.all([
                listProductsForAiCuration(
                    {
                        page: requestedPage,
                        pageSize: ADMIN_STOCK_PAGE_SIZE,
                        search: requestedSearch,
                        aiEligibility: "all",
                        stock: "all",
                    },
                    { signal },
                ),
                apiRequest("/admin/stock/alerts", { signal }),
            ]);
            const nextProducts = Array.isArray(catalogData.products) ? catalogData.products : [];
            setProducts(nextProducts);
            setPagination(catalogData.pagination ?? EMPTY_PAGINATION);
            setProductId((current) =>
                nextProducts.some((product) => product.id === current)
                    ? current
                    : "",
            );
            setAlerts(Array.isArray(alertData.products) ? alertData.products : []);
            setStatus(nextProducts.length ? "success" : "empty");
        } catch (requestError) {
            if (requestError.code === "REQUEST_ABORTED") return;
            setError(requestError.message);
            setStatus("error");
        }
    }, []);

    useEffect(() => {
        const timeoutId = window.setTimeout(() => {
            setDebouncedSearch(search.trim());
            setPage(1);
        }, 300);
        return () => window.clearTimeout(timeoutId);
    }, [search]);

    useEffect(() => {
        const controller = new AbortController();
        void loadInventory(controller.signal, page, debouncedSearch);
        return () => controller.abort();
    }, [debouncedSearch, loadInventory, page]);

    function selectProduct(product) {
        setProductId(product.id);
        setStock(product.stock);
        setMessage("");
    }

    async function handleStockUpdate(event) {
        event.preventDefault();
        setError(""); setMessage(""); setActionStatus("loading");
        try {
            const data = await apiRequest(`/admin/products/${productId}/stock`, { method: "PATCH", body: JSON.stringify({ stock: Number(stock) }) });
            setProducts((current) => current.map((product) => product.id === productId ? { ...product, stock: data.product.stock } : product));
            setMessage(`Stock de ${data.product.name ?? "produto"} atualizado para ${data.product.stock} unidades.`);
            const alertData = await apiRequest("/admin/stock/alerts");
            setAlerts(alertData.products ?? []);
            setActionStatus("success");
        } catch (requestError) { setError(requestError.message); setActionStatus("error"); }
    }

    const lowStockIds = new Set(alerts.map((product) => product.productId));
    const selectedProduct = products.find((product) => product.id === productId);

    return (
        <section className="admin-page admin-stock-page">
            <AdminPageHeader eyebrow="Catálogo" title="Stock" description="Acompanha todo o inventário e intervém apenas nos produtos que precisam de ajuste." actions={<AdminIconButton icon="refresh" label="Atualizar inventário" onClick={() => void loadInventory(undefined, page, debouncedSearch)} disabled={status === "loading"} />} />
            {status === "loading" && products.length === 0 ? <Skeleton lines={5} /> : null}
            {error ? <p role="alert">{error}</p> : null}
            {alerts.length > 0 ? <aside className="admin-stock-alert" role="status"><strong>{alerts.length} {alerts.length === 1 ? "produto precisa" : "produtos precisam"} de atenção</strong><span>Stock igual ou inferior ao nível mínimo definido.</span></aside> : status === "success" ? <aside className="admin-stock-alert admin-stock-alert--ok" role="status"><strong>Inventário saudável</strong><span>Não existem alertas de baixo stock.</span></aside> : null}

            <div className="admin-toolbar admin-stock-toolbar" role="search" aria-label="Pesquisa de stock">
                <label className="admin-toolbar__search">Pesquisar produto ou marca<input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Produto ou marca" /></label>
                <span>{pagination.total} {pagination.total === 1 ? "produto" : "produtos"}</span>
            </div>

            <div className="admin-stock-layout">
                <section className="admin-panel admin-inventory-list">
                    <header><div><p>Inventário</p><h2>Todos os produtos</h2></div><span>{products.length}</span></header>
                    {status === "empty" ? <EmptyState title="Sem produtos" description="Cria o primeiro produto para começar a gerir stock." /> : products.map((product) => <article key={product.id} className={productId === product.id ? "admin-inventory-row admin-inventory-row--selected" : "admin-inventory-row"}><div><strong>{product.name}</strong><span>{product.brandName}</span></div><AdminStatusBadge tone={lowStockIds.has(product.id) ? "warning" : "success"}>{product.stock} unidades</AdminStatusBadge><AdminIconButton icon="edit" label={`Ajustar stock de ${product.name}`} onClick={() => selectProduct(product)} /></article>)}
                </section>
                <section className="admin-panel admin-stock-editor">
                    <header><div><p>Ajuste manual</p><h2>{selectedProduct?.name ?? "Seleciona um produto"}</h2></div></header>
                    {selectedProduct ? <form onSubmit={handleStockUpdate}><p>Stock atual: <strong>{selectedProduct.stock}</strong></p><label>Novo stock<input type="number" min="0" step="1" value={stock} onChange={(event) => setStock(event.target.value)} /></label><button type="submit" disabled={actionStatus === "loading"}>{actionStatus === "loading" ? "A atualizar…" : "Guardar stock"}</button>{message ? <p role="status">{message}</p> : null}</form> : <EmptyState title="Escolhe uma linha" description="Usa o ícone de edição junto ao produto que pretendes atualizar." />}
                </section>
            </div>
            <AdminPagination
                page={pagination.page}
                totalPages={pagination.totalPages}
                total={pagination.total}
                onPageChange={setPage}
                label="Paginação de stock"
                disabled={status === "loading"}
            />
        </section>
    );
}
