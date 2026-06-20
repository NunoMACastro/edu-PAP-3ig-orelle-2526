/**
 * Pagina de preferencias do BK-MF0-06.
 */
import { useEffect, useState } from "react";
import { apiRequest } from "../services/apiClient.js";

/**
 * Formulario para guardar marcas favoritas.
 *
 * @function PreferencesPage
 * @returns {JSX.Element} UI de preferencias.
 */
export function PreferencesPage() {
    const [brandsText, setBrandsText] = useState("Orelle, The Ordinary");
    const [productIdsText, setProductIdsText] = useState("");
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        apiRequest("/preferences/me")
            .then((data) => {
                setBrandsText(data.preferences.favoriteBrandNames.join(", "));
                setProductIdsText(
                    data.preferences.favoriteProductIds.join(", "),
                );
            })
            .catch((err) => {
                setMessage(err.message);
            })
            .finally(() => {
                setLoading(false);
            });
    }, []);

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

        const favoriteBrandNames = brandsText
            .split(",")
            .map((brand) => brand.trim())
            .filter(Boolean);
        const favoriteProductIds = productIdsText
            .split(",")
            .map((id) => id.trim())
            .filter(Boolean);

        try {
            await apiRequest("/preferences/me", {
                method: "PUT",
                body: JSON.stringify({
                    favoriteBrandNames,
                    favoriteProductIds,
                }),
            });
            setMessage("Preferencias guardadas");
        } catch (err) {
            setMessage(err.message);
        }
    }

    return (
        <main>
            <h1>Preferencias</h1>
            {loading && <p role="status">A carregar preferencias...</p>}
            <form onSubmit={savePreferences}>
                <label>
                    Marcas favoritas separadas por vírgula
                    <input
                        value={brandsText}
                        onChange={(event) => setBrandsText(event.target.value)}
                    />
                </label>
                <label>
                    IDs de produtos favoritos separados por vírgula
                    <input
                        value={productIdsText}
                        onChange={(event) =>
                            setProductIdsText(event.target.value)
                        }
                    />
                </label>
                <button type="submit" disabled={loading}>
                    Guardar preferencias
                </button>
            </form>
            {message && <p role="status">{message}</p>}
        </main>
    );
}
