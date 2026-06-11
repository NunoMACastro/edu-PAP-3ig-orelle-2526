import { useState } from "react";
import { apiRequest } from "../services/apiClient.js";

export function BeforeAfterVisualizationPage() {
    const [simulationId, setSimulationId] = useState("");
    const [status, setStatus] = useState("idle");
    const [error, setError] = useState("");
    const [visualization, setVisualization] = useState(null);

    async function submitVisualization(event) {
        event.preventDefault();
        setStatus("loading");
        setError("");

        try {
            const data = await apiRequest("/api/before-after-visualizations", {
                method: "POST",
                body: JSON.stringify({ simulationId }),
            });

            setVisualization(data.visualization);
            setStatus("success");
        } catch (err) {
            setError(err.message);
            setStatus("error");
        }
    }

    return (
        <section>
            <h1>Visualização antes/depois</h1>
            <form onSubmit={submitVisualization}>
                <label>
                    ID da simulação
                    <input value={simulationId} onChange={(event) => setSimulationId(event.target.value)} />
                </label>
                <button type="submit" disabled={status === "loading"}>Gerar visualização</button>
            </form>
            {status === "error" && <p role="alert">{error}</p>}
            {status === "success" && visualization && (
                <div>
                    <section>
                        <h2>{visualization.beforePanel.label}</h2>
                        <p>{visualization.beforePanel.description}</p>
                    </section>
                    <section style={{ borderColor: visualization.afterPanel.accentColor }}>
                        <h2>{visualization.afterPanel.label}</h2>
                        <p>{visualization.afterPanel.description}</p>
                    </section>
                    <p>{visualization.summary}</p>
                    <ul>
                        {visualization.recommendedProductNames.map((name) => (
                            <li key={name}>{name}</li>
                        ))}
                    </ul>
                </div>
            )}
        </section>
    );
}