/**
 * Pagina administrativa de criacao de produto do BK-MF0-07.
 */
import { useState } from "react";
import { apiRequest } from "../services/apiClient.js";

/**
 * Formulario para criar produtos como administrador.
 *
 * @function AdminProductCreatePage
 * @returns {JSX.Element} UI de criacao de produto.
 */
export function AdminProductCreatePage() {
    const [message, setMessage] = useState("");
    const [form, setForm] = useState({
        name: "",
        brandName: "",
        description: "",
        ingredientNamesText: "agua, glicerina",
        skinTypesText: "mista",
        imageUrl: "https://images.orelle.local/produto-demo.png",
        priceEuros: "19.90",
        stock: "10",
    });

    /**
     * Atualiza um campo do formulario de produto.
     *
     * @function updateField
     * @param {import("react").ChangeEvent<HTMLInputElement|HTMLTextAreaElement>} event - Evento do campo.
     * @returns {void}
     */
    function updateField(event) {
        setForm((current) => ({
            ...current,
            [event.target.name]: event.target.value,
        }));
    }

    /**
     * Envia o produto para a API admin.
     *
     * @async
     * @function submitProduct
     * @param {import("react").FormEvent<HTMLFormElement>} event - Evento do formulario.
     * @returns {Promise<void>}
     */
    async function submitProduct(event) {
        event.preventDefault();

        const ingredientNames = form.ingredientNamesText
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean);
        const skinTypes = form.skinTypesText
            .split(",")
            .map((item) => item.trim().toLowerCase())
            .filter(Boolean);
        const priceCents = Math.round(Number(form.priceEuros) * 100);

        try {
            await apiRequest("/admin/products", {
                method: "POST",
                body: JSON.stringify({
                    name: form.name,
                    brandName: form.brandName,
                    description: form.description,
                    ingredientNames,
                    skinTypes,
                    imageUrl: form.imageUrl,
                    priceCents,
                    stock: Number(form.stock),
                }),
            });
            setMessage("Produto criado");
        } catch (err) {
            setMessage(err.message);
        }
    }

    return (
        <main>
            <h1>Novo produto</h1>
            <form onSubmit={submitProduct}>
                <label>
                    Nome
                    <input
                        name="name"
                        value={form.name}
                        onChange={updateField}
                    />
                </label>
                <label>
                    Marca
                    <input
                        name="brandName"
                        value={form.brandName}
                        onChange={updateField}
                    />
                </label>
                <label>
                    Descrição
                    <textarea
                        name="description"
                        value={form.description}
                        onChange={updateField}
                    />
                </label>
                <label>
                    Ingredientes
                    <input
                        name="ingredientNamesText"
                        value={form.ingredientNamesText}
                        onChange={updateField}
                    />
                </label>
                <label>
                    Tipos de pele
                    <input
                        name="skinTypesText"
                        value={form.skinTypesText}
                        onChange={updateField}
                    />
                </label>
                <label>
                    Imagem URL
                    <input
                        name="imageUrl"
                        value={form.imageUrl}
                        onChange={updateField}
                    />
                </label>
                <label>
                    Preço EUR
                    <input
                        name="priceEuros"
                        type="number"
                        step="0.01"
                        value={form.priceEuros}
                        onChange={updateField}
                    />
                </label>
                <label>
                    Stock
                    <input
                        name="stock"
                        type="number"
                        value={form.stock}
                        onChange={updateField}
                    />
                </label>
                <button type="submit">Criar produto</button>
            </form>
            {message && <p role="status">{message}</p>}
        </main>
    );
}
