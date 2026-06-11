import { useState } from "react";
import { apiRequest } from "../services/apiClient.js";

export function MakeupSimulationPage() {
    const [productId, setProductId] = useState("");
    const [status, setStatus] = useState("idle");
    const [error, setError] = useState("");
    const [simulation, setSimulation] = useState(null);

    async function submitSimulation(event) {
        event.preventDefault();
        setStatus("loading");
        setError("");

        try {
            const data = await apiRequest("/api/makeup-simulations", {
                method: "POST",
                body: JSON.stringify({ productId }),
            });

            setSimulation(data.simulation);
            setStatus("success");
        } catch (err) {
            setError(err.message);
            setStatus("error");
        }
    }

    return (
        <section>
            <h1>Simulação de maquilhagem</h1>
            <form onSubmit={submitSimulation}>
                <label>
                    ID do produto
                    <input value={productId} onChange={(event) => setProductId(event.target.value)} />
                </label>
                <button type="submit" disabled={status === "loading"}>Gerar simulação</button>
            </form>
            {status === "error" && <p role="alert">{error}</p>}
            {status === "success" && simulation && (
                <div>
                    <h2>{simulation.product.name}</h2>
                    <section>
                        <h3>{simulation.preview.beforePanel.label}</h3>
                        <p>{simulation.preview.beforePanel.description}</p>
                    </section>
                    <section style={{ borderColor: simulation.preview.afterPanel.accentColor }}>
                        <h3>{simulation.preview.afterPanel.label}</h3>
                        <p>{simulation.preview.afterPanel.description}</p>
                    </section>
                    <p>{simulation.preview.overlayDescription}</p>
                </div>
            )}
        </section>
    );
}