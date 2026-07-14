/**
 * Gestão administrativa de categorias e respetivas associações a produtos.
 */
import { useEffect, useState } from "react";
import { AdminPageHeader } from "../components/AdminUi.jsx";
import { ErrorSummary } from "../components/ErrorSummary.jsx";
import { FeedbackMessage } from "../components/FeedbackMessage.jsx";
import { collectionResourceStatus } from "../hooks/asyncOperation.js";
import { useAsyncAction } from "../hooks/useAsyncAction.js";
import { useAsyncResource } from "../hooks/useAsyncResource.js";
import { apiRequest } from "../services/apiClient.js";

/**
 * Obtém as categorias já associadas a um produto sem assumir uma única forma
 * legada do DTO administrativo.
 *
 * @param {object|null|undefined} product - Produto selecionado.
 * @returns {string[]} Identificadores internos usados apenas nos controlos.
 */
function getProductCategoryIds(product) {
    const values = Array.isArray(product?.categoryIds)
        ? product.categoryIds
        : Array.isArray(product?.categories)
          ? product.categories
          : [];

    return values
        .map((value) =>
            typeof value === "string"
                ? value
                : (value?.id ?? value?.categoryId ?? ""),
        )
        .filter(Boolean);
}

/**
 * Formulário para criar categorias e gerir as associações de um produto.
 *
 * Leituras e mutações têm estados independentes: uma criação confirmada não é
 * apresentada como falhada apenas porque o refresh posterior ficou offline.
 *
 * @returns {import("react").JSX.Element} UI administrativa de categorias.
 */
export function AdminCategoriesPage() {
    const [categoryName, setCategoryName] = useState("");
    const [productId, setProductId] = useState("");
    const [selectedCategoryIds, setSelectedCategoryIds] = useState([]);
    const categoriesResource = useAsyncResource(
        async ({ signal }) => {
            const data = await apiRequest("/admin/categories", { signal });
            return Array.isArray(data.categories) ? data.categories : [];
        },
        {
            initialData: [],
            initialStatus: "loading",
            statusFromData: collectionResourceStatus,
        },
    );
    const productsResource = useAsyncResource(
        async ({ signal }) => {
            const data = await apiRequest("/catalog/products", { signal });
            return Array.isArray(data.products) ? data.products : [];
        },
        {
            initialData: [],
            initialStatus: "loading",
            statusFromData: collectionResourceStatus,
        },
    );
    const createAction = useAsyncAction(async ({ signal }, name) => {
        const data = await apiRequest("/admin/categories", {
            method: "POST",
            signal,
            body: JSON.stringify({ name }),
        });
        return data.category ?? null;
    });
    const assignAction = useAsyncAction(
        async ({ signal }, { selectedProductId, categoryIds }) => {
            const data = await apiRequest(
                `/admin/products/${selectedProductId}/categories`,
                {
                    method: "PATCH",
                    signal,
                    body: JSON.stringify({ categoryIds }),
                },
            );
            return data.product ?? { id: selectedProductId, categoryIds };
        },
    );
    const categories = categoriesResource.data;
    const products = productsResource.data;
    const loadCategories = categoriesResource.load;
    const loadProducts = productsResource.load;

    useEffect(() => {
        loadCategories();
        loadProducts();
    }, [loadCategories, loadProducts]);

    useEffect(() => {
        if (products.length === 0) {
            setProductId("");
            setSelectedCategoryIds([]);
            return;
        }

        const selectedProduct =
            products.find((product) => product.id === productId) ?? products[0];
        if (selectedProduct.id !== productId) setProductId(selectedProduct.id);
        setSelectedCategoryIds(getProductCategoryIds(selectedProduct));
    }, [productId, products]);

    /** Cria uma categoria e atualiza a lista sem misturar o resultado do refresh. */
    async function createCategory(event) {
        event.preventDefault();
        const normalizedName = categoryName.trim();
        if (!normalizedName) return;

        const result = await createAction.run(normalizedName);
        if (!result.ok) return;

        if (result.data) {
            categoriesResource.setData((current) =>
                current.some((category) => category.id === result.data.id)
                    ? current
                    : [...current, result.data],
            );
        }
        setCategoryName("");
        await loadCategories();
    }

    /** Seleciona ou remove uma categoria da associação em edição. */
    function toggleCategory(categoryId) {
        setSelectedCategoryIds((current) =>
            current.includes(categoryId)
                ? current.filter((id) => id !== categoryId)
                : [...current, categoryId],
        );
    }

    /** Substitui atomicamente as associações, incluindo a remoção total. */
    async function assignCategories(event) {
        event.preventDefault();
        if (!productId) return;

        const categoryIds = [...selectedCategoryIds];
        const result = await assignAction.run({
            selectedProductId: productId,
            categoryIds,
        });
        if (!result.ok) return;

        productsResource.setData((current) =>
            current.map((product) =>
                product.id === productId
                    ? { ...product, ...result.data, categoryIds }
                    : product,
            ),
        );
    }

    const loadingCategories = categoriesResource.status === "loading";
    const loadingProducts = productsResource.status === "loading";
    const selectedProduct = products.find((product) => product.id === productId);

    return (
        <section className="admin-page admin-categories-page">
            <AdminPageHeader eyebrow="Catálogo" title="Categorias" description="Cria famílias de produtos e gere as respetivas associações sem sair da página." />

            {loadingCategories && categories.length === 0 ? (
                <p role="status">A carregar categorias...</p>
            ) : null}
            <ErrorSummary
                error={categoriesResource.error}
                id="category-list-error"
                title="Não foi possível atualizar as categorias"
            />

            {categories.length > 0 ? (
                <section className="admin-panel admin-category-summary" aria-busy={loadingCategories}>
                    <header>
                        <div>
                            <p>Organização atual</p>
                            <h2>Categorias existentes</h2>
                        </div>
                        <span className="admin-category-count">
                            {categories.length} {categories.length === 1 ? "categoria" : "categorias"}
                        </span>
                    </header>
                    <ul className="admin-chip-list">
                        {categories.map((category) => (
                            <li key={category.id}>{category.name}</li>
                        ))}
                    </ul>
                </section>
            ) : null}
            {categoriesResource.status === "empty" ? (
                <p>Ainda não existem categorias.</p>
            ) : null}

            <div className="admin-two-column">
            <form className="admin-panel" onSubmit={createCategory}>
                <h2>Criar categoria</h2>
                <p>Adiciona uma designação curta e reconhecível no catálogo.</p>
                <label>
                    Nome da categoria
                    <input
                        value={categoryName}
                        onChange={(event) => {
                            createAction.reset();
                            setCategoryName(event.target.value);
                        }}
                        maxLength={80}
                        disabled={createAction.status === "loading"}
                        required
                    />
                </label>
                <button
                    type="submit"
                    disabled={
                        createAction.status === "loading" || !categoryName.trim()
                    }
                >
                    {createAction.status === "loading"
                        ? "A criar categoria..."
                        : "Criar categoria"}
                </button>
                <ErrorSummary
                    error={createAction.error}
                    id="category-create-error"
                />
                {createAction.status === "success" ? (
                    <FeedbackMessage type="success">
                        Categoria criada. A lista foi sincronizada quando a ligação o permitiu.
                    </FeedbackMessage>
                ) : null}
            </form>

            <form className="admin-panel" onSubmit={assignCategories}>
                <h2>Associar categorias a um produto</h2>
                <p>Seleciona um produto e ativa apenas as categorias relevantes.</p>
                <label>
                    Produto
                    <select
                        value={productId}
                        onChange={(event) => {
                            assignAction.reset();
                            setProductId(event.target.value);
                        }}
                        disabled={loadingProducts || assignAction.status === "loading"}
                        required
                    >
                        <option value="" disabled>
                            Seleciona um produto
                        </option>
                        {products.map((product) => (
                            <option key={product.id} value={product.id}>
                                {product.name}
                            </option>
                        ))}
                    </select>
                </label>
                <ErrorSummary
                    error={productsResource.error}
                    id="category-products-error"
                    title="Não foi possível atualizar os produtos"
                />

                <fieldset disabled={assignAction.status === "loading"}>
                    <legend>Categorias</legend>
                    {categories.length === 0 ? (
                        <p>Não existem categorias disponíveis para selecionar.</p>
                    ) : null}
                    {categories.map((category) => (
                        <label key={category.id}>
                            <input
                                type="checkbox"
                                checked={selectedCategoryIds.includes(category.id)}
                                onChange={() => {
                                    assignAction.reset();
                                    toggleCategory(category.id);
                                }}
                            />
                            {category.name}
                        </label>
                    ))}
                </fieldset>
                <p>
                    {selectedCategoryIds.length === 0
                        ? "Sem categorias selecionadas: as associações atuais serão removidas."
                        : `${selectedCategoryIds.length} categoria(s) selecionada(s) para ${selectedProduct?.name ?? "o produto"}.`}
                </p>
                <button
                    type="submit"
                    disabled={assignAction.status === "loading" || !productId}
                >
                    {assignAction.status === "loading"
                        ? "A guardar associações..."
                        : "Guardar associações"}
                </button>
                <ErrorSummary
                    error={assignAction.error}
                    id="category-assign-error"
                />
                {assignAction.status === "success" ? (
                    <FeedbackMessage type="success">
                        Associações atualizadas.
                    </FeedbackMessage>
                ) : null}
            </form>
            </div>
        </section>
    );
}
