/** Curadoria administrativa da metadata usada nas recomendações OpenAI. */
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { AdminIconButton, AdminIconLink, AdminModal, AdminPageHeader, AdminPagination, AdminStatusBadge } from "../components/AdminUi.jsx";
import { ErrorSummary } from "../components/ErrorSummary.jsx";
import { useAsyncAction } from "../hooks/useAsyncAction.js";
import { useAsyncResource } from "../hooks/useAsyncResource.js";
import {
    buildAiCurationPayload,
    COVERAGES,
    FINISHES,
    listProductsForAiCuration,
    MAKEUP_APPLICATION_AREAS,
    MAKEUP_FUNCTIONS,
    MAKEUP_REGIONS,
    MAKEUP_STYLES,
    MAKEUP_WEAR_PROFILES,
    PRODUCT_CONCERNS,
    productToAiCurationForm,
    ROUTINE_STEPS,
    saveProductAiCuration,
    TEXTURES,
    UNDERTONES,
} from "../services/productAiCuration.js";
import { apiRequest } from "../services/apiClient.js";

const EMPTY_VARIANT = Object.freeze({
    variantId: "",
    label: "",
    colorHex: "",
    undertone: "",
    finish: "",
    coverage: "",
    imageUrl: "",
    priceEuros: "",
    stock: "0",
});

const ADMIN_PRODUCTS_PAGE_SIZE = 20;
const EMPTY_PRODUCTS_PAGE = Object.freeze({
    products: Object.freeze([]),
    pagination: Object.freeze({
        page: 1,
        pageSize: ADMIN_PRODUCTS_PAGE_SIZE,
        total: 0,
        totalPages: 0,
    }),
});

/** Select reutilizável para enums comerciais com labels humanas. */
function LabeledSelect({ label, value, options, onChange }) {
    return (
        <label>
            {label}
            <select value={value} onChange={onChange}>
                {options.map(([optionValue, optionLabel]) => (
                    <option key={optionValue || "empty"} value={optionValue}>
                        {optionLabel}
                    </option>
                ))}
            </select>
        </label>
    );
}

/** Página de seleção e curadoria sem apresentar chaves internas. */
export function AdminProductsPage() {
    const [selectedProductId, setSelectedProductId] = useState("");
    const [editorType, setEditorType] = useState(null);
    const [form, setForm] = useState(null);
    const [message, setMessage] = useState("");
    const [stockDraft, setStockDraft] = useState("0");
    const [categories, setCategories] = useState([]);
    const [categoryIds, setCategoryIds] = useState([]);
    const [secondaryAction, setSecondaryAction] = useState({ status: "idle", error: "" });
    const [search, setSearch] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [page, setPage] = useState(1);
    const [eligibilityFilter, setEligibilityFilter] = useState("all");
    const [stockFilter, setStockFilter] = useState("all");
    const productsResource = useAsyncResource(
        ({ signal }, filters) =>
            listProductsForAiCuration(filters, { signal }),
        { initialData: EMPTY_PRODUCTS_PAGE },
    );
    const saveAction = useAsyncAction(async ({ signal }) => {
        if (!selectedProductId || !form) return null;
        return saveProductAiCuration(
            selectedProductId,
            buildAiCurationPayload(form),
            { signal },
        );
    });
    const loadProducts = productsResource.load;

    useEffect(() => {
        const timeoutId = window.setTimeout(() => {
            setDebouncedSearch(search.trim());
            setPage(1);
        }, 300);
        return () => window.clearTimeout(timeoutId);
    }, [search]);

    useEffect(() => {
        void loadProducts({
            page,
            pageSize: ADMIN_PRODUCTS_PAGE_SIZE,
            search: debouncedSearch,
            aiEligibility: eligibilityFilter,
            stock: stockFilter,
        });
    }, [
        debouncedSearch,
        eligibilityFilter,
        loadProducts,
        page,
        stockFilter,
    ]);

    const products = useMemo(
        () => productsResource.data?.products ?? [],
        [productsResource.data],
    );
    const pagination = productsResource.data?.pagination ??
        EMPTY_PRODUCTS_PAGE.pagination;
    const selectedProduct = products.find(
        (product) => product.id === selectedProductId,
    );
    const filteredProducts = products;

    const variantStock = useMemo(
        () =>
            (form?.variants ?? []).reduce(
                (sum, variant) => sum + (Number(variant.stock) || 0),
                0,
            ),
        [form?.variants],
    );
    const variantStockMatches =
        !form ||
        form.variants.length === 0 ||
        variantStock === Number(selectedProduct?.stock ?? 0);

    function updateField(field, value) {
        setForm((current) => ({ ...current, [field]: value }));
        setMessage("");
    }

    /** Troca o produto e inicia uma cópia editável da metadata recebida. */
    function selectProduct(productId) {
        setSelectedProductId(productId);
        setEditorType("curation");
        const product = products.find((item) => item.id === productId);
        setForm(product ? productToAiCurationForm(product) : null);
        setMessage("");
    }

    const closeEditor = useCallback(() => {
        setSelectedProductId("");
        setEditorType(null);
        setForm(null);
        setMessage("");
        setSecondaryAction({ status: "idle", error: "" });
    }, []);

    /** Abre a edição de stock com o valor atual do produto. */
    function openStockEditor(product) {
        setSelectedProductId(product.id);
        setStockDraft(String(product.stock ?? 0));
        setEditorType("stock");
        setMessage("");
        setSecondaryAction({ status: "idle", error: "" });
    }

    /** Abre as associações e carrega a lista de categorias apenas quando necessária. */
    async function openCategoryEditor(product) {
        setSelectedProductId(product.id);
        setCategoryIds((product.categories ?? product.categoryIds ?? []).map((category) => typeof category === "string" ? category : category.id ?? category.categoryId).filter(Boolean));
        setEditorType("categories");
        setMessage("");
        setSecondaryAction({ status: "loading", error: "" });
        try {
            const data = await apiRequest("/admin/categories");
            setCategories(Array.isArray(data.categories) ? data.categories : []);
            setSecondaryAction({ status: "idle", error: "" });
        } catch (error) {
            setSecondaryAction({ status: "error", error: error.message });
        }
    }

    async function saveStock(event) {
        event.preventDefault();
        setSecondaryAction({ status: "loading", error: "" });
        try {
            const data = await apiRequest(`/admin/products/${selectedProductId}/stock`, { method: "PATCH", body: JSON.stringify({ stock: Number(stockDraft) }) });
            productsResource.setData((current) => ({
                ...current,
                products: current.products.map((product) => product.id === selectedProductId ? { ...product, ...data.product } : product),
            }));
            setMessage("Stock atualizado.");
            setSecondaryAction({ status: "success", error: "" });
        } catch (error) {
            setSecondaryAction({ status: "error", error: error.message });
        }
    }

    async function saveCategories(event) {
        event.preventDefault();
        setSecondaryAction({ status: "loading", error: "" });
        try {
            const data = await apiRequest(`/admin/products/${selectedProductId}/categories`, { method: "PATCH", body: JSON.stringify({ categoryIds }) });
            productsResource.setData((current) => ({
                ...current,
                products: current.products.map((product) => product.id === selectedProductId ? { ...product, ...data.product, categoryIds } : product),
            }));
            setMessage("Categorias atualizadas.");
            setSecondaryAction({ status: "success", error: "" });
        } catch (error) {
            setSecondaryAction({ status: "error", error: error.message });
        }
    }

    function toggleListField(field, value, checked) {
        setForm((current) => ({
            ...current,
            [field]: checked
                ? [...new Set([...current[field], value])]
                : current[field].filter((item) => item !== value),
        }));
    }

    function updateVariant(index, field, value) {
        setForm((current) => ({
            ...current,
            variants: current.variants.map((variant, variantIndex) =>
                variantIndex === index
                    ? { ...variant, [field]: value }
                    : variant,
            ),
        }));
    }

    async function submit(event) {
        event.preventDefault();
        setMessage("");
        const result = await saveAction.run();
        if (!result.ok || !result.data) return;
        productsResource.setData((current) =>
            ({
                ...current,
                products: current.products.map((product) =>
                    product.id === result.data.id ? result.data : product,
                ),
            }),
        );
        setForm(productToAiCurationForm(result.data));
        setMessage("Curadoria guardada. O produto usa agora esta metadata versionada.");
    }

    return (
        <section className="admin-page admin-product-curation">
            <AdminPageHeader eyebrow="Catálogo" title="Produtos" description="Pesquisa o catálogo e abre apenas a área que pretendes gerir." actions={<Link className="orelle-button orelle-button--primary" to="/admin/produtos/novo">Novo produto</Link>} />

            <ErrorSummary
                error={productsResource.error ?? saveAction.error}
                id="product-curation-error"
            />
            <div className="admin-toolbar" role="search" aria-label="Pesquisa avançada de produtos">
                <label className="admin-toolbar__search">Pesquisar<input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Produto ou marca" /></label>
                <label>Elegibilidade<select value={eligibilityFilter} onChange={(event) => { setEligibilityFilter(event.target.value); setPage(1); }}><option value="all">Todos</option><option value="eligible">Elegíveis para IA</option><option value="ineligible">Não elegíveis</option></select></label>
                <label>Stock<select value={stockFilter} onChange={(event) => { setStockFilter(event.target.value); setPage(1); }}><option value="all">Todo o stock</option><option value="available">Disponível</option><option value="empty">Esgotado</option></select></label>
                <span>{pagination.total} {pagination.total === 1 ? "resultado" : "resultados"}</span>
            </div>

            {productsResource.status === "loading" && products.length === 0 ? <p role="status">A carregar o catálogo.</p> : null}
            <div className="admin-product-list" role="region" aria-label="Lista de produtos">
                {filteredProducts.map((product) => (
                    <article key={product.id} className="admin-product-row">
                        <div className="admin-product-row__identity"><span aria-hidden="true">{product.name.slice(0, 1).toUpperCase()}</span><div><h2>{product.name}</h2><p>{product.brandName}</p></div></div>
                        <div className="admin-product-row__meta"><AdminStatusBadge tone={product.aiEligible ? "success" : "neutral"}>{product.aiEligible ? "Elegível para IA" : "Curadoria pendente"}</AdminStatusBadge><span>{product.stock} unidades</span><span>{Number.isFinite(Number(product.priceCents)) ? `${(Number(product.priceCents) / 100).toFixed(2)} €` : "Preço indisponível"}</span></div>
                        <div className="admin-product-row__actions"><AdminIconLink icon="eye" label={`Ver ${product.name} no catálogo`} to={`/produtos/${product.id}`} /><AdminIconButton icon="tag" label={`Editar categorias de ${product.name}`} onClick={() => void openCategoryEditor(product)} /><AdminIconButton icon="box" label={`Editar stock de ${product.name}`} onClick={() => openStockEditor(product)} /><AdminIconButton icon="edit" label={`Editar curadoria de ${product.name}`} onClick={() => selectProduct(product.id)} /></div>
                    </article>
                ))}
                {productsResource.status !== "loading" && filteredProducts.length === 0 ? <p className="admin-list-empty">Nenhum produto corresponde aos filtros.</p> : null}
            </div>
            <AdminPagination
                page={pagination.page}
                totalPages={pagination.totalPages}
                total={pagination.total}
                onPageChange={setPage}
                label="Paginação de produtos"
                disabled={productsResource.status === "loading"}
            />

            <AdminModal open={Boolean(selectedProduct && editorType)} title={selectedProduct ? `Editar ${selectedProduct.name}` : "Editar produto"} description={editorType === "stock" ? "Atualiza apenas a quantidade disponível." : editorType === "categories" ? "Escolhe as famílias em que o produto deve aparecer." : "Curadoria cosmética, atributos e variantes."} onClose={closeEditor}>
            {selectedProduct && editorType === "stock" ? <form onSubmit={saveStock}><label>Novo stock<input type="number" min="0" step="1" value={stockDraft} onChange={(event) => setStockDraft(event.target.value)} /></label><button type="submit" disabled={secondaryAction.status === "loading"}>Guardar stock</button>{message ? <p role="status">{message}</p> : null}{secondaryAction.error ? <p role="alert">{secondaryAction.error}</p> : null}</form> : null}
            {selectedProduct && editorType === "categories" ? <form onSubmit={saveCategories}><fieldset><legend>Categorias</legend>{secondaryAction.status === "loading" && categories.length === 0 ? <p role="status">A carregar categorias…</p> : categories.map((category) => <label key={category.id}><input type="checkbox" checked={categoryIds.includes(category.id)} onChange={(event) => setCategoryIds((current) => event.target.checked ? [...new Set([...current, category.id])] : current.filter((id) => id !== category.id))} />{category.name}</label>)}</fieldset><button type="submit" disabled={secondaryAction.status === "loading"}>Guardar categorias</button>{message ? <p role="status">{message}</p> : null}{secondaryAction.error ? <p role="alert">{secondaryAction.error}</p> : null}</form> : null}
            {selectedProduct && editorType === "curation" && form ? (
                <form onSubmit={submit} aria-describedby="product-curation-error">
                    <section className="consultation-notice">
                        <h2>{selectedProduct.name}</h2>
                        <p>
                            Stock agregado protegido: {selectedProduct.stock} unidades.
                        </p>
                        <label>
                            <input
                                type="checkbox"
                                checked={form.aiEligible}
                                onChange={(event) =>
                                    updateField("aiEligible", event.target.checked)
                                }
                            />
                            Produto elegível para recomendações da consulta
                        </label>
                    </section>

                    <fieldset>
                        <legend>Objetivos cosméticos aplicáveis</legend>
                        {PRODUCT_CONCERNS.map(([value, label]) => (
                            <label key={value}>
                                <input
                                    type="checkbox"
                                    checked={form.concernTags.includes(value)}
                                    onChange={(event) =>
                                        toggleListField(
                                            "concernTags",
                                            value,
                                            event.target.checked,
                                        )
                                    }
                                />
                                {label}
                            </label>
                        ))}
                    </fieldset>

                    <fieldset>
                        <legend>Passos da rotina</legend>
                        {ROUTINE_STEPS.map(([value, label]) => (
                            <label key={value}>
                                <input
                                    type="checkbox"
                                    checked={form.routineSteps.includes(value)}
                                    onChange={(event) =>
                                        toggleListField(
                                            "routineSteps",
                                            value,
                                            event.target.checked,
                                        )
                                    }
                                />
                                {label}
                            </label>
                        ))}
                    </fieldset>

                    <fieldset>
                        <legend>Funções visuais de maquilhagem</legend>
                        <p>Declara o tipo real do produto; esta informação controla o ranking e a ordem das camadas da imagem.</p>
                        {MAKEUP_FUNCTIONS.map(([value, label]) => (
                            <label key={value}>
                                <input type="checkbox" checked={form.makeupFunctions.includes(value)} onChange={(event) => toggleListField("makeupFunctions", value, event.target.checked)} />
                                {label}
                            </label>
                        ))}
                    </fieldset>

                    <fieldset>
                        <legend>Regiões e áreas de aplicação</legend>
                        {MAKEUP_REGIONS.map(([value, label]) => (
                            <label key={value}>
                                <input type="checkbox" checked={form.makeupRegions.includes(value)} onChange={(event) => toggleListField("makeupRegions", value, event.target.checked)} />
                                {label}
                            </label>
                        ))}
                        <hr />
                        {MAKEUP_APPLICATION_AREAS.map(([value, label]) => (
                            <label key={value}>
                                <input type="checkbox" checked={form.makeupApplicationAreas.includes(value)} onChange={(event) => toggleListField("makeupApplicationAreas", value, event.target.checked)} />
                                {label}
                            </label>
                        ))}
                    </fieldset>

                    <fieldset>
                        <legend>Estilos e prioridades compatíveis</legend>
                        {MAKEUP_STYLES.map(([value, label]) => (
                            <label key={value}>
                                <input type="checkbox" checked={form.makeupStyleTags.includes(value)} onChange={(event) => toggleListField("makeupStyleTags", value, event.target.checked)} />
                                {label}
                            </label>
                        ))}
                        <hr />
                        {MAKEUP_WEAR_PROFILES.map(([value, label]) => (
                            <label key={value}>
                                <input type="checkbox" checked={form.makeupWearProfiles.includes(value)} onChange={(event) => toggleListField("makeupWearProfiles", value, event.target.checked)} />
                                {label}
                            </label>
                        ))}
                    </fieldset>

                    <label>
                        Ingredientes INCI normalizados
                        <textarea
                            value={form.inciText}
                            onChange={(event) =>
                                updateField("inciText", event.target.value)
                            }
                            rows="8"
                            placeholder={"Aqua\nGlycerin\nNiacinamide"}
                        />
                        <small>Um ingrediente por linha, conforme a embalagem.</small>
                    </label>

                    <fieldset className="admin-product-attributes">
                        <legend>Atributos estruturados</legend>
                        <LabeledSelect
                            label="Textura"
                            value={form.texture}
                            options={TEXTURES}
                            onChange={(event) =>
                                updateField("texture", event.target.value)
                            }
                        />
                        <LabeledSelect
                            label="Acabamento"
                            value={form.finish}
                            options={FINISHES}
                            onChange={(event) =>
                                updateField("finish", event.target.value)
                            }
                        />
                        <LabeledSelect
                            label="Cobertura"
                            value={form.coverage}
                            options={COVERAGES}
                            onChange={(event) =>
                                updateField("coverage", event.target.value)
                            }
                        />
                        <label>
                            Sem fragrância
                            <select
                                value={form.fragranceFree}
                                onChange={(event) =>
                                    updateField(
                                        "fragranceFree",
                                        event.target.value,
                                    )
                                }
                            >
                                <option value="">Não indicado</option>
                                <option value="true">Sim</option>
                                <option value="false">Não</option>
                            </select>
                        </label>
                        <label>
                            FPS
                            <input
                                type="number"
                                min="0"
                                max="100"
                                step="1"
                                value={form.spf}
                                onChange={(event) =>
                                    updateField("spf", event.target.value)
                                }
                            />
                        </label>
                        <label>
                            Proteção UVA
                            <select
                                value={form.uvaRating}
                                onChange={(event) =>
                                    updateField("uvaRating", event.target.value)
                                }
                            >
                                <option value="">Não indicada</option>
                                <option value="none">Sem alegação</option>
                                <option value="broad_spectrum">Amplo espectro</option>
                                <option value="pa+++">PA+++</option>
                                <option value="pa++++">PA++++</option>
                            </select>
                        </label>
                        <label>
                            Resistência à água
                            <select
                                value={form.waterResistantMinutes}
                                onChange={(event) =>
                                    updateField(
                                        "waterResistantMinutes",
                                        event.target.value,
                                    )
                                }
                            >
                                <option value="">Não indicada</option>
                                <option value="0">Não resistente</option>
                                <option value="40">40 minutos</option>
                                <option value="80">80 minutos</option>
                            </select>
                        </label>
                    </fieldset>

                    <fieldset>
                        <legend>Variantes comerciais (opcional)</legend>
                        <p>
                            Se adicionares variantes, a soma do stock tem de ser igual
                            ao stock agregado protegido.
                        </p>
                        {form.variants.map((variant, index) => (
                            <fieldset className="admin-product-variant" key={`${variant.variantId || "new"}-${index}`}>
                                <legend>Variante {index + 1}</legend>
                                <label>
                                    Nome apresentado
                                    <input
                                        value={variant.label}
                                        required
                                        onChange={(event) =>
                                            updateVariant(
                                                index,
                                                "label",
                                                event.target.value,
                                            )
                                        }
                                    />
                                </label>
                                <label>
                                    Cor hexadecimal
                                    <input
                                        value={variant.colorHex}
                                        placeholder="#C89A82"
                                        pattern="#[0-9A-Fa-f]{6}"
                                        onChange={(event) =>
                                            updateVariant(
                                                index,
                                                "colorHex",
                                                event.target.value,
                                            )
                                        }
                                    />
                                </label>
                                <LabeledSelect
                                    label="Subtom"
                                    value={variant.undertone}
                                    options={UNDERTONES}
                                    onChange={(event) =>
                                        updateVariant(
                                            index,
                                            "undertone",
                                            event.target.value,
                                        )
                                    }
                                />
                                <LabeledSelect
                                    label="Acabamento da variante"
                                    value={variant.finish}
                                    options={FINISHES}
                                    onChange={(event) =>
                                        updateVariant(
                                            index,
                                            "finish",
                                            event.target.value,
                                        )
                                    }
                                />
                                <LabeledSelect
                                    label="Cobertura da variante"
                                    value={variant.coverage}
                                    options={COVERAGES}
                                    onChange={(event) =>
                                        updateVariant(
                                            index,
                                            "coverage",
                                            event.target.value,
                                        )
                                    }
                                />
                                <label>
                                    Imagem (opcional)
                                    <input
                                        type="url"
                                        value={variant.imageUrl}
                                        onChange={(event) =>
                                            updateVariant(
                                                index,
                                                "imageUrl",
                                                event.target.value,
                                            )
                                        }
                                    />
                                </label>
                                <label>
                                    Preço próprio em EUR (opcional)
                                    <input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={variant.priceEuros}
                                        onChange={(event) =>
                                            updateVariant(
                                                index,
                                                "priceEuros",
                                                event.target.value,
                                            )
                                        }
                                    />
                                </label>
                                <label>
                                    Stock desta variante
                                    <input
                                        type="number"
                                        min="0"
                                        step="1"
                                        value={variant.stock}
                                        required
                                        onChange={(event) =>
                                            updateVariant(
                                                index,
                                                "stock",
                                                event.target.value,
                                            )
                                        }
                                    />
                                </label>
                                <button
                                    type="button"
                                    onClick={() =>
                                        updateField(
                                            "variants",
                                            form.variants.filter(
                                                (_, variantIndex) =>
                                                    variantIndex !== index,
                                            ),
                                        )
                                    }
                                >
                                    Remover variante {index + 1}
                                </button>
                            </fieldset>
                        ))}
                        <button
                            type="button"
                            onClick={() =>
                                updateField("variants", [
                                    ...form.variants,
                                    { ...EMPTY_VARIANT },
                                ])
                            }
                        >
                            Adicionar variante
                        </button>
                        {form.variants.length > 0 && (
                            <p role="status">
                                Stock distribuído: {variantStock} de {selectedProduct.stock}.
                            </p>
                        )}
                    </fieldset>

                    <button
                        type="submit"
                        disabled={
                            saveAction.status === "loading" ||
                            !variantStockMatches
                        }
                    >
                        {saveAction.status === "loading"
                            ? "A guardar…"
                            : "Guardar curadoria"}
                    </button>
                    {!variantStockMatches && (
                        <p role="alert">
                            Distribui exatamente {selectedProduct.stock} unidades pelas
                            variantes antes de guardar.
                        </p>
                    )}
                    {message && <p role="status">{message}</p>}
                </form>
            ) : null}
            </AdminModal>
        </section>
    );
}
