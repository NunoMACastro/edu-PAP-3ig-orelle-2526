/**
 * Pagina administrativa de criacao de produto do BK-MF0-07.
 */
import { useState } from "react";
import { AdminPageHeader } from "../components/AdminUi.jsx";
import { ErrorSummary } from "../components/ErrorSummary.jsx";
import { apiRequest } from "../services/apiClient.js";
import { getSkinTypeLabel } from "../services/presentationLabels.js";

const SKIN_TYPES = Object.freeze(["oleosa", "seca", "mista", "normal", "sensivel"]);

/**
 * Formulario para criar produtos como administrador.
 *
 * @function AdminProductCreatePage
 * @returns {JSX.Element} UI de criacao de produto.
 */
export function AdminProductCreatePage() {
    const [message, setMessage] = useState("");
    const [submitError, setSubmitError] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [form, setForm] = useState({
        name: "",
        brandName: "",
        description: "",
        ingredientNamesText: "água\nglicerina",
        skinTypes: ["mista"],
        imageUrl: "",
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

    /** Alterna uma opção humana de tipo de pele. */
    function toggleSkinType(skinType, checked) {
        setForm((current) => ({
            ...current,
            skinTypes: checked
                ? [...new Set([...current.skinTypes, skinType])]
                : current.skinTypes.filter((item) => item !== skinType),
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
        if (isSubmitting) return;

        const ingredientNames = form.ingredientNamesText
            .split(/\r?\n/)
            .map((item) => item.trim())
            .filter(Boolean);
        const priceCents = Math.round(Number(form.priceEuros) * 100);

        setIsSubmitting(true);
        setMessage("");
        setSubmitError(null);
        try {
            await apiRequest("/admin/products", {
                method: "POST",
                body: JSON.stringify({
                    name: form.name,
                    brandName: form.brandName,
                    description: form.description,
                    ingredientNames,
                    skinTypes: form.skinTypes,
                    imageUrl: form.imageUrl,
                    priceCents,
                    stock: Number(form.stock),
                }),
            });
            setMessage("Produto criado com sucesso.");
        } catch (err) {
            setSubmitError(err);
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <section className="admin-page admin-product-create-page">
            <AdminPageHeader
                eyebrow="Catálogo"
                title="Novo produto"
                description="Regista a informação comercial essencial. A curadoria cosmética pode ser concluída depois na lista de produtos."
            />
            <form
                className="admin-panel admin-product-create-form"
                aria-describedby={submitError ? "product-create-error" : undefined}
                onSubmit={submitProduct}
            >
                <div className="admin-form-grid">
                    <label>
                        Nome
                        <input
                            name="name"
                            value={form.name}
                            onChange={updateField}
                            required
                            minLength="2"
                        />
                    </label>
                    <label>
                        Marca
                        <input
                            name="brandName"
                            value={form.brandName}
                            onChange={updateField}
                            required
                            minLength="2"
                        />
                    </label>
                </div>
                <label>
                    Descrição
                    <textarea
                        name="description"
                        value={form.description}
                        onChange={updateField}
                        required
                        minLength="20"
                        maxLength="1000"
                    />
                </label>
                <label>
                    Ingredientes
                    <textarea
                        name="ingredientNamesText"
                        value={form.ingredientNamesText}
                        onChange={updateField}
                        required
                    />
                    <small>Um ingrediente por linha.</small>
                </label>
                <fieldset>
                    <legend>Tipos de pele</legend>
                    {SKIN_TYPES.map((skinType) => (
                        <label key={skinType}>
                            <input
                                type="checkbox"
                                checked={form.skinTypes.includes(skinType)}
                                onChange={(event) =>
                                    toggleSkinType(skinType, event.target.checked)
                                }
                            />
                            {getSkinTypeLabel(skinType)}
                        </label>
                    ))}
                </fieldset>
                <label>
                    Endereço da imagem do produto
                    <input
                        name="imageUrl"
                        value={form.imageUrl}
                        onChange={updateField}
                        placeholder="https://exemplo.test/produto.webp"
                        inputMode="url"
                        required
                    />
                </label>
                <div className="admin-form-grid">
                    <label>
                        Preço EUR
                        <input
                            name="priceEuros"
                            type="number"
                            step="0.01"
                            min="0"
                            value={form.priceEuros}
                            onChange={updateField}
                            required
                        />
                    </label>
                    <label>
                        Stock
                        <input
                            name="stock"
                            type="number"
                            min="0"
                            step="1"
                            value={form.stock}
                            onChange={updateField}
                            required
                        />
                    </label>
                </div>
                <button type="submit" disabled={isSubmitting || form.skinTypes.length === 0}>
                    {isSubmitting ? "A criar produto..." : "Criar produto"}
                </button>
            </form>
            {message && <p role="status">{message}</p>}
            <ErrorSummary error={submitError} id="product-create-error" />
        </section>
    );
}
