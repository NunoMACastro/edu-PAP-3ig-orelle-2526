import { useState } from "react";
import { apiRequest } from "../services/apiClient.js";

export function PreferencesPage() {
    const [brandsText, setBrandsText] = useState("Orelle, The Ordinary");
    const [message, setMessage] = useState("");

    async function savePreferences(event) {
        event.preventDefault();

        const favoriteBrandNames = brandsText
            .split(",")
            .map((brand) => brand.trim())
            .filter(Boolean);

        try {
            await apiRequest("/preferences/me", {
                method: "PUT",
                body: JSON.stringify({
                    favoriteBrandNames,
                    favoriteProductIds: [],
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
            <form onSubmit={savePreferences}>
                <label>
                    Marcas favoritas separadas por virgula
                    <input
                        value={brandsText}
                        onChange={(event) => setBrandsText(event.target.value)}
                    />
                </label>
                <button type="submit">Guardar preferencias</button>
            </form>
            {message && <p role="status">{message}</p>}
        </main>
    );
}