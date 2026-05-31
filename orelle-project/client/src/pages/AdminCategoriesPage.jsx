import { useState } from "react";
import { apiRequest } from "../services/apiClient.js";

export function AdminCategoriesPage() {
    const [message, setMessage] = useState("");
    const [categoryName, setCategoryName] = useState("Limpeza");
    const [productId, setProductId] = useState("");
    const [categoryIdsText, setCategoryIdsText] = useState("");

    async function createCategory(event) {
        event.preventDefault();

        try {
            await apiRequest("/admin/categories", {
                method: "POST",
                body: JSON.stringify({ name: categoryName }),
            });
            setMessage("Categoria criada");
        } catch (err) {
            setMessage(err.message);
        }
    }

    async function assignCategories(event) {
        event.preventDefault();
        const categoryIds = categoryIdsText
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean);

        try {
            await apiRequest(`/admin/products/${productId}/categories`, {
                method: "PATCH",
                body: JSON.stringify({ categoryIds }),
            });
            setMessage("Categorias associadas");
        } catch (err) {
            setMessage(err.message);
        }
    }

    return (
        <main>
            <h1>Categorias</h1>

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
                    IDs de categorias separados por virgula
                    <input
                        value={categoryIdsText}
                        onChange={(event) =>
                            setCategoryIdsText(event.target.value)
                        }
                    />
                </label>
                <button type="submit">Associar categorias</button>
            </form>

            {message && <p role="status">{message}</p>}
        </main>
    );
}