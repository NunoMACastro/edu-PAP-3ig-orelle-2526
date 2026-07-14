/**
 * Pagina de preferencias do BK-MF0-06.
 */
import { useEffect, useState } from "react";
import { NavIcon } from "../components/NavIcon.jsx";
import { OptimizedImage } from "../components/OptimizedImage.jsx";
import { EmptyState, PageHero, Skeleton, TagInput } from "../components/OrelleUi.jsx";
import { apiRequest } from "../services/apiClient.js";

/**
 * Formulario para guardar marcas favoritas.
 *
 * @function PreferencesPage
 * @returns {JSX.Element} UI de preferencias.
 */
export function PreferencesPage() {
    const [brandsText, setBrandsText] = useState("");
    const [products, setProducts] = useState([]);
    const [favoriteProductIds, setFavoriteProductIds] = useState([]);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [productSearch, setProductSearch] = useState("");

    useEffect(() => {
        const controller = new AbortController();

        Promise.all([
            apiRequest("/preferences/me", { signal: controller.signal }),
            apiRequest("/catalog/products", { signal: controller.signal }),
        ])
            .then(([preferencesData, catalogData]) => {
                setBrandsText(
                    preferencesData.preferences.favoriteBrandNames.join(", "),
                );
                setFavoriteProductIds(
                    preferencesData.preferences.favoriteProductIds,
                );
                setProducts(catalogData.products);
            })
            .catch((err) => {
                if (err.code === "REQUEST_ABORTED") return;
                setError(err.message);
            })
            .finally(() => {
                if (!controller.signal.aborted) setLoading(false);
            });

        return () => controller.abort();
    }, []);

    /** Alterna uma preferência usando o ID apenas como valor interno da opção. */
    function toggleFavoriteProduct(productId) {
        setFavoriteProductIds((current) =>
            current.includes(productId)
                ? current.filter((candidate) => candidate !== productId)
                : [...current, productId],
        );
    }

    /**
     * Guarda as preferencias na API.
     *
     * @async
     * @function savePreferences
     * @param {import("react").FormEvent<HTMLFormElement>} event - Evento do formulario.
     * @returns {Promise<void>}
     */
    async function savePreferences(event) {
        event.preventDefault();
        setSaving(true);
        setMessage("");
        setError("");

        const favoriteBrandNames = brandsText
            .split(",")
            .map((brand) => brand.trim())
            .filter(Boolean);
        try {
            await apiRequest("/preferences/me", {
                method: "PUT",
                body: JSON.stringify({
                    favoriteBrandNames,
                    favoriteProductIds,
                }),
            });
            setMessage("Preferências guardadas com sucesso.");
        } catch (err) {
            setError(err.message);
        } finally {
            setSaving(false);
        }
    }

    const normalizedSearch = productSearch
        .trim()
        .toLocaleLowerCase("pt-PT");
    const filteredProducts = products.filter((product) =>
        `${product.name} ${product.brandName}`
            .toLocaleLowerCase("pt-PT")
            .includes(normalizedSearch),
    );
    const favoriteBrandCount = brandsText
        .split(",")
        .map((brand) => brand.trim())
        .filter(Boolean).length;

    return (
        <section className="route-content preferences-page">
            <PageHero
                eyebrow="Conta"
                title="As tuas preferências"
                description="Guarda as marcas e os produtos que mais combinam contigo para tornar cada recomendação mais relevante."
            >
                <div className="preferences-hero-summary" aria-live="polite">
                    <span>Seleção atual</span>
                    <strong>
                        {loading
                            ? "A carregar"
                            : `${favoriteProductIds.length} ${favoriteProductIds.length === 1 ? "produto" : "produtos"}`}
                    </strong>
                    <p>
                        {loading
                            ? "A preparar a tua seleção"
                            : `${favoriteBrandCount} ${favoriteBrandCount === 1 ? "marca favorita" : "marcas favoritas"}`}
                    </p>
                </div>
            </PageHero>

            {loading ? (
                <div className="preferences-loading" aria-busy="true">
                    <Skeleton lines={5} label="A carregar preferências" />
                </div>
            ) : (
                <form className="preferences-form" onSubmit={savePreferences}>
                    <section
                        className="preferences-brands"
                        aria-labelledby="preferences-brands-title"
                    >
                        <div className="preferences-section-heading">
                            <span className="preferences-section-heading__icon" aria-hidden="true">
                                <NavIcon name="star" />
                            </span>
                            <div>
                                <p className="orelle-eyebrow">As tuas escolhas</p>
                                <h2 id="preferences-brands-title">Marcas favoritas</h2>
                                <p>
                                    Adiciona as marcas que procuras primeiro quando
                                    exploras novos cuidados ou maquilhagem.
                                </p>
                            </div>
                        </div>
                        <TagInput
                            label="Marcas"
                            value={brandsText}
                            onChange={(event) => setBrandsText(event.target.value)}
                            hint="Separa cada marca por uma vírgula."
                            placeholder="Ex.: Orélle, The Ordinary"
                        />
                    </section>

                    <fieldset className="preferences-products">
                        <legend>
                            <span className="preferences-section-heading__icon" aria-hidden="true">
                                <NavIcon name="bag" />
                            </span>
                            <span>
                                <strong>Produtos favoritos</strong>
                                <small>
                                    Seleciona os produtos que queres manter por perto.
                                </small>
                            </span>
                        </legend>

                        <div className="preferences-toolbar">
                            <label className="preferences-search">
                                <span>Pesquisar produtos</span>
                                <span className="preferences-search__control">
                                    <NavIcon name="search" />
                                    <input
                                        type="search"
                                        value={productSearch}
                                        onChange={(event) => setProductSearch(event.target.value)}
                                        placeholder="Nome ou marca"
                                    />
                                </span>
                            </label>
                            <p aria-live="polite">
                                {filteredProducts.length}{" "}
                                {filteredProducts.length === 1 ? "resultado" : "resultados"}
                            </p>
                        </div>

                        {products.length === 0 ? (
                            <EmptyState
                                title="Sem produtos disponíveis"
                                description="Volta mais tarde para atualizar as tuas escolhas."
                            />
                        ) : filteredProducts.length === 0 ? (
                            <EmptyState
                                title="Nenhum produto encontrado"
                                description="Experimenta pesquisar por outro nome ou marca."
                                icon="⌕"
                            />
                        ) : (
                            <div
                                className="preferences-product-grid"
                                aria-label="Lista de produtos disponíveis"
                                tabIndex={0}
                            >
                                {filteredProducts.map((product) => {
                                    const isSelected = favoriteProductIds.includes(product.id);

                                    return (
                                        <label
                                            key={product.id}
                                            className={`preferences-product-card ${isSelected ? "preferences-product-card--selected" : ""}`}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={isSelected}
                                                onChange={() => toggleFavoriteProduct(product.id)}
                                            />
                                            <span className="preferences-product-card__media" aria-hidden="true">
                                                <OptimizedImage
                                                    src={product.imageUrl}
                                                    alt=""
                                                    width="96"
                                                    height="96"
                                                    sizes="96px"
                                                />
                                            </span>
                                            <span className="preferences-product-card__copy">
                                                <small>{product.brandName}</small>
                                                <strong>{product.name}</strong>
                                                <span>{isSelected ? "Selecionado" : "Selecionar"}</span>
                                            </span>
                                            <span className="preferences-product-card__check" aria-hidden="true">
                                                {isSelected ? "✓" : ""}
                                            </span>
                                        </label>
                                    );
                                })}
                            </div>
                        )}
                    </fieldset>

                    <footer className="account-form-actions preferences-form__actions">
                        <p>
                            Tens {favoriteProductIds.length}{" "}
                            {favoriteProductIds.length === 1
                                ? "produto selecionado"
                                : "produtos selecionados"}.
                        </p>
                        <button type="submit" disabled={saving}>
                            <NavIcon name="save" />
                            {saving ? "A guardar..." : "Guardar preferências"}
                        </button>
                    </footer>
                </form>
            )}

            {message ? <p className="account-feedback account-feedback--success" role="status">{message}</p> : null}
            {error ? <p className="account-feedback account-feedback--error" role="alert">{error}</p> : null}
        </section>
    );
}
