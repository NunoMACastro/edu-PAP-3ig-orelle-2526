/**
 * Pagina administrativa de categorias do BK-MF0-08.
 */
import { useEffect, useState } from "react";
import { apiRequest } from "../services/apiClient.js";

/**
 * Formulario para criar categorias e associa-las a produtos.
 *
 * @function AdminCategoriesPage
 * @returns {JSX.Element} UI administrativa de categorias.
 */
export function AdminCategoriesPage() {
    const [message, setMessage] = useState("");
    const [categories, setCategories] = useState([]);
    const [loadingCategories, setLoadingCategories] = useState(true);
    const [categoryName, setCategoryName] = useState("Limpeza");
    const [productId, setProductId] = useState("");
    const [selectedCategoryIds, setSelectedCategoryIds] = useState([]);

    /**
     * Carrega categorias administraveis da API.
     *
     * @async
     * @function loadCategories
     * @returns {Promise<void>}
     */
    async function loadCategories() {
        setLoadingCategories(true);

        try {
            const data = await apiRequest("/admin/categories");
            setCategories(data.categories);
        } catch (err) {
            setMessage(err.message);
        } finally {
            setLoadingCategories(false);
        }
    }

    useEffect(() => {
        loadCategories();
    }, []);

    /**
     * Cria uma categoria na API.
     *
     * @async
     * @function createCategory
     * @param {import("react").FormEvent<HTMLFormElement>} event - Evento do formulario.
     * @returns {Promise<void>}
     */
    async function createCategory(event) {
        event.preventDefault();

        try {
            await apiRequest("/admin/categories", {
                method: "POST",
                body: JSON.stringify({ name: categoryName }),
            });
            setMessage("Categoria criada");
            await loadCategories();
        } catch (err) {
            setMessage(err.message);
        }
    }

    /**
     * Seleciona ou remove uma categoria da associacao.
     *
     * @function toggleCategory
     * @param {string} categoryId - ID da categoria.
     * @returns {void}
     */
    function toggleCategory(categoryId) {
        setSelectedCategoryIds((current) =>
            current.includes(categoryId)
                ? current.filter((id) => id !== categoryId)
                : [...current, categoryId],
        );
    }

    /**
     * Associa categorias existentes a um produto.
     *
     * @async
     * @function assignCategories
     * @param {import("react").FormEvent<HTMLFormElement>} event - Evento do formulario.
     * @returns {Promise<void>}
     */
    async function assignCategories(event) {
        event.preventDefault();
        try {
            await apiRequest(`/admin/products/${productId}/categories`, {
                method: "PATCH",
                body: JSON.stringify({ categoryIds: selectedCategoryIds }),
            });
            setMessage("Categorias associadas");
        } catch (err) {
            setMessage(err.message);
        }
    }

    return (
        <main>
            <h1>Categorias</h1>
            {loadingCategories && <p role="status">A carregar categorias...</p>}

            {categories.length > 0 && (
                <section>
                    <h2>Categorias existentes</h2>
                    <ul>
                        {categories.map((category) => (
                            <li key={category.id}>
                                {category.name} ({category.slug})
                            </li>
                        ))}
                    </ul>
                </section>
            )}

            <form onSubmit={createCategory}>
                <label>
                    Nome da categoria
                    <input
                        value={categoryName}
                        onChange={(event) =>
                            setCategoryName(event.target.value)
                        }
                    />
                </label>
                <button type="submit">Criar categoria</button>
            </form>

            <form onSubmit={assignCategories}>
                <label>
                    ID do produto
                    <input
                        value={productId}
                        onChange={(event) => setProductId(event.target.value)}
                    />
                </label>
                <label>
                    Categorias
                    <div>
                        {categories.map((category) => (
                            <label key={category.id}>
                                <input
                                    type="checkbox"
                                    checked={selectedCategoryIds.includes(
                                        category.id,
                                    )}
                                    onChange={() => toggleCategory(category.id)}
                                />
                                {category.name}
                            </label>
                        ))}
                    </div>
                </label>
                <button type="submit" disabled={loadingCategories}>
                    Associar categorias
                </button>
            </form>

            {message && <p role="status">{message}</p>}
        </main>
    );
}
