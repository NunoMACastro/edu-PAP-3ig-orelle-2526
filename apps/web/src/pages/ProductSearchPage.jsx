/**
 * Catálogo público editorial com pesquisa e filtragem sincronizadas com a URL.
 */
import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ProductCard } from "../components/ProductCard.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { useCart } from "../context/CartContext.jsx";
import { apiRequest } from "../services/apiClient.js";
import { getSkinTypeLabel } from "../services/presentationLabels.js";

const SKIN_TYPES = ["oleosa", "seca", "mista", "normal", "sensivel"];
const FILTER_FIELDS = [
    "search",
    "brandName",
    "skinType",
    "categoryId",
    "minPriceEuros",
    "maxPriceEuros",
];

/** Converte a query pública no estado editável dos filtros. */
function getFiltersFromSearchParams(searchParams) {
    const formatEuroInput = (value) => {
        if (!value) return "";
        const cents = Number(value);
        return Number.isFinite(cents) && cents >= 0
            ? (cents / 100).toFixed(2)
            : "";
    };

    return {
        search: searchParams.get("search") ?? "",
        brandName: searchParams.get("brandName") ?? "",
        skinType: searchParams.get("skinType") ?? "",
        categoryId: searchParams.get("categoryId") ?? "",
        minPriceEuros: formatEuroInput(searchParams.get("minPriceCents")),
        maxPriceEuros: formatEuroInput(searchParams.get("maxPriceCents")),
    };
}

/** Constrói uma query apenas com filtros preenchidos e preços válidos. */
function buildCatalogQuery(filters) {
    const params = new URLSearchParams();

    for (const key of ["search", "brandName", "skinType", "categoryId"]) {
        const value = String(filters[key] ?? "").trim();
        if (value) params.set(key, value);
    }

    for (const [field, queryKey] of [
        ["minPriceEuros", "minPriceCents"],
        ["maxPriceEuros", "maxPriceCents"],
    ]) {
        const rawValue = String(filters[field] ?? "").trim();
        const euros = Number(rawValue);
        if (rawValue && Number.isFinite(euros)) {
            params.set(queryKey, String(Math.round(euros * 100)));
        }
    }

    return params;
}

/** Devolve uma contagem pública com singular e plural corretos. */
function formatResultCount(count) {
    return `${count} ${count === 1 ? "produto" : "produtos"}`;
}

/**
 * Permite pesquisar produtos por texto, marca, tipo de pele e preço.
 *
 * @returns {JSX.Element} Catálogo público responsivo.
 */
export function ProductSearchPage() {
    const { user } = useAuth();
    const { addItem } = useCart();
    const [searchParams, setSearchParams] = useSearchParams();
    const [filters, setFilters] = useState(() =>
        getFiltersFromSearchParams(searchParams),
    );
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [categoryStatus, setCategoryStatus] = useState("loading");
    const [status, setStatus] = useState("idle");
    const [error, setError] = useState("");
    const [isSearching, setIsSearching] = useState(false);
    const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
    const [cartBusyIds, setCartBusyIds] = useState(() => new Set());
    const searchControllerRef = useRef(null);
    const cartInFlightRef = useRef(new Set());
    const isClient = user?.role === "cliente";

    useEffect(() => {
        const controller = new AbortController();

        apiRequest("/catalog/categories", { signal: controller.signal })
            .then((data) => {
                setCategories(Array.isArray(data.categories) ? data.categories : []);
                setCategoryStatus("success");
            })
            .catch(() => {
                if (controller.signal.aborted) return;
                setCategories([]);
                setCategoryStatus("error");
            });

        return () => controller.abort();
    }, []);

    useEffect(() => () => searchControllerRef.current?.abort(), []);

    useEffect(() => {
        const urlFilters = getFiltersFromSearchParams(searchParams);
        setFilters(urlFilters);
        searchCatalog(urlFilters);
        // A URL é a fonte de verdade; pesquisa direta só ocorre em resubmissão.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchParams]);

    /** Atualiza um filtro local sem disparar pedidos intermédios. */
    function updateFilter(field, value) {
        setFilters((current) => ({ ...current, [field]: value }));
    }

    /** Publica os filtros recebidos na URL canónica. */
    function applyFilters(nextFilters) {
        const params = buildCatalogQuery(nextFilters);
        setSearchParams(params);
    }

    /** Executa a pesquisa no endpoint público atual. */
    async function searchCatalog(currentFilters) {
        searchControllerRef.current?.abort();
        const controller = new AbortController();
        searchControllerRef.current = controller;
        setIsSearching(true);
        setError("");

        try {
            const query = buildCatalogQuery(currentFilters).toString();
            const data = await apiRequest(
                query ? `/catalog/products?${query}` : "/catalog/products",
                { signal: controller.signal },
            );
            if (searchControllerRef.current !== controller) return;

            const nextProducts = Array.isArray(data.products) ? data.products : [];
            setProducts(nextProducts);
            setStatus(nextProducts.length === 0 ? "empty" : "success");
        } catch (requestError) {
            if (controller.signal.aborted) return;
            setError(requestError.message);
            setStatus((current) => (products.length === 0 ? "error" : current));
        } finally {
            if (searchControllerRef.current === controller) {
                searchControllerRef.current = null;
                setIsSearching(false);
            }
        }
    }

    /** Submete os filtros editados ou repete a pesquisa atual. */
    async function handleSubmit(event) {
        event.preventDefault();
        const query = buildCatalogQuery(filters);

        if (query.toString() === searchParams.toString()) {
            await searchCatalog(filters);
            return;
        }

        setSearchParams(query);
    }

    /** Remove um filtro ativo e atualiza imediatamente a URL. */
    function clearFilter(field) {
        const nextFilters = { ...filters, [field]: "" };
        setFilters(nextFilters);
        applyFilters(nextFilters);
    }

    /** Remove todos os filtros públicos. */
    function clearAllFilters() {
        const emptyFilters = Object.fromEntries(
            FILTER_FIELDS.map((field) => [field, ""]),
        );
        setFilters(emptyFilters);
        applyFilters(emptyFilters);
    }

    /** Adiciona um produto sem variantes ao carrinho do cliente. */
    async function addToCart(productId) {
        if (!isClient || cartInFlightRef.current.has(productId)) return;

        cartInFlightRef.current.add(productId);
        setCartBusyIds((current) => new Set(current).add(productId));

        try {
            await addItem({ productId, quantity: 1 });
        } catch {
            // O drawer global apresenta o erro confirmado pelo provider.
        } finally {
            cartInFlightRef.current.delete(productId);
            setCartBusyIds((current) => {
                const next = new Set(current);
                next.delete(productId);
                return next;
            });
        }
    }

    const categoryName =
        categories.find((category) => category.id === filters.categoryId)?.name ??
        "Categoria selecionada";
    const activeFilters = [
        filters.search
            ? { field: "search", label: `Pesquisa: ${filters.search}` }
            : null,
        filters.brandName
            ? { field: "brandName", label: `Marca: ${filters.brandName}` }
            : null,
        filters.categoryId
            ? { field: "categoryId", label: `Categoria: ${categoryName}` }
            : null,
        filters.skinType
            ? {
                  field: "skinType",
                  label: `Pele: ${getSkinTypeLabel(filters.skinType)}`,
              }
            : null,
        filters.minPriceEuros
            ? {
                  field: "minPriceEuros",
                  label: `Desde ${filters.minPriceEuros} EUR`,
              }
            : null,
        filters.maxPriceEuros
            ? {
                  field: "maxPriceEuros",
                  label: `Até ${filters.maxPriceEuros} EUR`,
              }
            : null,
    ].filter(Boolean);

    return (
        <section
            className="catalog-page commerce-page"
            aria-labelledby="catalog-title"
        >
            <header className="catalog-page__header">
                <div>
                    <p className="app-kicker">Seleção Orélle</p>
                    <h1 id="catalog-title">Catálogo Orélle</h1>
                    <p>
                        Descobre cuidados e maquilhagem pensados para diferentes
                        tipos de pele, rotinas e momentos.
                    </p>
                </div>
                <p className="catalog-page__count" aria-live="polite">
                    {isSearching && products.length === 0
                        ? "A procurar produtos"
                        : formatResultCount(products.length)}
                </p>
            </header>

            <form className="catalog-filters" onSubmit={handleSubmit}>
                <div className="catalog-filters__primary">
                    <label className="catalog-filters__search">
                        Pesquisa
                        <input
                            value={filters.search}
                            placeholder="O que procuras?"
                            onChange={(event) =>
                                updateFilter("search", event.target.value)
                            }
                        />
                    </label>
                    <button type="submit" disabled={isSearching}>
                        {isSearching ? "A pesquisar..." : "Pesquisar"}
                    </button>
                    <button
                        className="catalog-filters__toggle"
                        type="button"
                        aria-expanded={showAdvancedFilters}
                        aria-controls="catalog-advanced-filters"
                        onClick={() =>
                            setShowAdvancedFilters((current) => !current)
                        }
                    >
                        Filtrar
                    </button>
                </div>

                <div
                    id="catalog-advanced-filters"
                    className={`catalog-filters__advanced ${showAdvancedFilters ? "catalog-filters__advanced--open" : ""}`.trim()}
                >
                    <label>
                        Marca
                        <input
                            value={filters.brandName}
                            onChange={(event) =>
                                updateFilter("brandName", event.target.value)
                            }
                        />
                    </label>
                    <label>
                        Categoria
                        <select
                            value={filters.categoryId}
                            onChange={(event) =>
                                updateFilter("categoryId", event.target.value)
                            }
                            disabled={categoryStatus === "loading"}
                        >
                            <option value="">Todas as categorias</option>
                            {filters.categoryId &&
                            !categories.some(
                                (category) => category.id === filters.categoryId,
                            ) ? (
                                <option value={filters.categoryId}>
                                    Categoria selecionada
                                </option>
                            ) : null}
                            {categories.map((category) => (
                                <option key={category.id} value={category.id}>
                                    {category.name}
                                </option>
                            ))}
                        </select>
                    </label>
                    <label>
                        Tipo de pele
                        <select
                            value={filters.skinType}
                            onChange={(event) =>
                                updateFilter("skinType", event.target.value)
                            }
                        >
                            <option value="">Todos</option>
                            {SKIN_TYPES.map((type) => (
                                <option key={type} value={type}>
                                    {getSkinTypeLabel(type)}
                                </option>
                            ))}
                        </select>
                    </label>
                    <label>
                        Preço mínimo (EUR)
                        <input
                            type="number"
                            min="0"
                            step="0.01"
                            inputMode="decimal"
                            value={filters.minPriceEuros}
                            onChange={(event) =>
                                updateFilter("minPriceEuros", event.target.value)
                            }
                        />
                    </label>
                    <label>
                        Preço máximo (EUR)
                        <input
                            type="number"
                            min="0"
                            step="0.01"
                            inputMode="decimal"
                            value={filters.maxPriceEuros}
                            onChange={(event) =>
                                updateFilter("maxPriceEuros", event.target.value)
                            }
                        />
                    </label>
                </div>
            </form>

            {activeFilters.length > 0 ? (
                <div className="catalog-active-filters" aria-label="Filtros ativos">
                    <span>Filtros ativos</span>
                    {activeFilters.map((filter) => (
                        <button
                            key={filter.field}
                            type="button"
                            onClick={() => clearFilter(filter.field)}
                            aria-label={`Remover ${filter.label}`}
                        >
                            {filter.label} <span aria-hidden="true">×</span>
                        </button>
                    ))}
                    <button
                        className="catalog-active-filters__clear"
                        type="button"
                        onClick={clearAllFilters}
                    >
                        Limpar filtros
                    </button>
                </div>
            ) : null}

            <div className="catalog-feedback" aria-live="polite">
                {categoryStatus === "error" ? (
                    <p role="status">
                        Não foi possível carregar as categorias. Podes continuar sem
                        esse filtro.
                    </p>
                ) : null}
                {isSearching ? <p role="status">A carregar produtos...</p> : null}
                {status === "error" ? <p role="alert">{error}</p> : null}
                {status !== "error" && error ? (
                    <p role="alert">
                        {error} Mantêm-se visíveis os resultados anteriores.
                    </p>
                ) : null}
                {status === "empty" ? (
                    <p className="catalog-feedback__empty">
                        Não encontrámos produtos com estes filtros. Experimenta
                        alargar a pesquisa.
                    </p>
                ) : null}
            </div>

            {status === "success" ? (
                <ul className="product-card-grid catalog-product-grid">
                    {products.map((product) => (
                        <ProductCard key={product.id} product={product}>
                            {isClient ? (
                                (product.variants ?? []).length > 0 ? (
                                    <Link className="text-link" to={`/produtos/${product.id}`}>
                                        Escolher variante
                                    </Link>
                                ) : (
                                    <button
                                        type="button"
                                        onClick={() => addToCart(product.id)}
                                        disabled={
                                            product.stock <= 0 ||
                                            cartBusyIds.has(product.id)
                                        }
                                        aria-label={`Adicionar ${product.name} ao carrinho`}
                                    >
                                        {cartBusyIds.has(product.id)
                                            ? "A adicionar..."
                                            : "Adicionar"}
                                    </button>
                                )
                            ) : (
                                <Link className="text-link" to={`/produtos/${product.id}`}>
                                    Ver produto
                                </Link>
                            )}
                        </ProductCard>
                    ))}
                </ul>
            ) : null}
        </section>
    );
}
