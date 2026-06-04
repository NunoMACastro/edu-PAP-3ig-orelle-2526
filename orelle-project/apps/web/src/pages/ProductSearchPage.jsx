import { useState } from "react";
import { apiRequest } from "../services/apiClient.js";

const SKIN_TYPES = ["oleosa", "seca", "mista", "sensivel", "normal"];

export function ProductSearchPage() {
    const [filters, setFilters] = useState({
        search: "",
        brandName: "",
        skinType: "",
        minPriceCents: "",
        maxPriceCents: "",
    });
    const [products, setProducts] = useState([]);
    const [status, setStatus] = useState("idle");
    const [error, setError] = useState("");

    function updateFilter(field, value) {
        setFilters((current) => ({ ...current, [field]: value }));
    }

    function buildQueryString() {
        const params = new URLSearchParams();
        Object.entries(filters).forEach(([key, value]) => {
            if (String(value).trim()) params.set(key, value);
        });
        return params.toString();
    }

    async function handleSubmit(event) {
        event.preventDefault();
        setStatus("loading");
        setError("");

        try {
            const query = buildQueryString();
            const data = await apiRequest(`/catalog/products?${query}`);
            setProducts(data.products);
            setStatus(data.products.length === 0 ? "empty" : "success");
        } catch (err) {
            setError(err.message);
            setProducts([]);
            setStatus("error");
        }
    }

    return (
        <main>
            <h1>Catálogo Orélle</h1>
            <form onSubmit={handleSubmit}>
                <label>
                    Pesquisa
                    <input
                        value={filters.search}
                        onChange={(event) =>
                            updateFilter("search", event.target.value)
                        }
                    />
                </label>
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
                                {type}
                            </option>
                        ))}
                    </select>
                </label>
                <label>
                    Preço mínimo em cêntimos
                    <input
                        type="number"
                        min="0"
                        value={filters.minPriceCents}
                        onChange={(event) =>
                            updateFilter("minPriceCents", event.target.value)
                        }
                    />
                </label>
                <label>
                    Preço máximo em cêntimos
                    <input
                        type="number"
                        min="0"
                        value={filters.maxPriceCents}
                        onChange={(event) =>
                            updateFilter("maxPriceCents", event.target.value)
                        }
                    />
                </label>
                <button type="submit" disabled={status === "loading"}>
                    {status === "loading" ? "A pesquisar..." : "Pesquisar"}
                </button>
            </form>

            {status === "error" && <p role="alert">{error}</p>}
            {status === "empty" && <p>Não foram encontrados produtos.</p>}
            {status === "success" && (
                <ul>
                    {products.map((product) => (
                        <li key={product.id}>
                            <img src={product.imageUrl} alt={product.name} />
                            <h2>{product.name}</h2>
                            <p>{product.brandName}</p>
                            <p>{(product.priceCents / 100).toFixed(2)} €</p>
                        </li>
                    ))}
                </ul>
            )}
        </main>
    );
}