/**
 * Pagina de evolucao temporal da pele.
 */
import { useMemo, useState } from "react";
import { apiRequest } from "../services/apiClient.js";

const SERIES = [
    { key: "acneScore", label: "Acne", color: "#0f766e" },
    { key: "manchasScore", label: "Manchas", color: "#7c3aed" },
    { key: "rugasScore", label: "Rugas", color: "#c2410c" },
    { key: "oleosidadeScore", label: "Oleosidade", color: "#1d4ed8" },
];

function buildPolyline(points, key) {
    const validPoints = points.filter((point) => typeof point[key] === "number");

    if (validPoints.length === 0) return "";

    return validPoints
        .map((point, index) => {
            const x =
                validPoints.length === 1
                    ? 50
                    : 10 + (index * 80) / (validPoints.length - 1);
            const y = 90 - (point[key] - 1) * 35;
            return `${x},${y}`;
        })
        .join(" ");
}

export function SkinEvolutionPage() {
    const [status, setStatus] = useState("idle");
    const [error, setError] = useState("");
    const [evolution, setEvolution] = useState(null);

    async function loadEvolution() {
        setStatus("loading");
        setError("");

        try {
            const data = await apiRequest("/me/skin-evolution");
            setEvolution(data.evolution);
            setStatus(data.evolution.points.length === 0 ? "empty" : "success");
        } catch (err) {
            setError(err.message);
            setStatus("error");
        }
    }

    const polylines = useMemo(() => {
        const points = evolution?.points ?? [];
        return SERIES.map((serie) => ({
            ...serie,
            points: buildPolyline(points, serie.key),
        }));
    }, [evolution]);

    return (
        <section>
            <h1>Evolução da pele</h1>
            <button onClick={loadEvolution} disabled={status === "loading"}>
                {status === "loading" ? "A carregar..." : "Ver evolução"}
            </button>
            {status === "error" && <p role="alert">{error}</p>}
            {status === "empty" && (
                <p>Ainda não existem análises concluídas para desenhar evolução.</p>
            )}
            {status === "success" && (
                <article>
                    <svg
                        viewBox="0 0 100 100"
                        role="img"
                        aria-labelledby="skin-evolution-title"
                        style={{ width: "100%", maxWidth: "520px" }}
                    >
                        <title id="skin-evolution-title">
                            Gráfico de evolução cosmética
                        </title>
                        <line x1="10" y1="20" x2="10" y2="90" stroke="#94a3b8" />
                        <line x1="10" y1="90" x2="90" y2="90" stroke="#94a3b8" />
                        {polylines.map((serie) => (
                            <polyline
                                key={serie.key}
                                points={serie.points}
                                fill="none"
                                stroke={serie.color}
                                strokeWidth="2"
                            />
                        ))}
                    </svg>
                    <ul>
                        {SERIES.map((serie) => (
                            <li key={serie.key}>
                                <span style={{ color: serie.color }}>{serie.label}</span>
                            </li>
                        ))}
                    </ul>
                    <p>Escala: 1 baixo, 2 moderado, 3 alto.</p>
                </article>
            )}
        </section>
    );
}
