/**
 * Página de evolução temporal da pele.
 */
import { useEffect, useMemo, useState } from "react";
import { EmptyState, PageHero, Skeleton } from "../components/OrelleUi.jsx";
import { apiRequest } from "../services/apiClient.js";
import { getSkinTypeLabel } from "../services/presentationLabels.js";

const SERIES = [
    { key: "acneScore", label: "Acne", color: "#0f766e" },
    { key: "manchasScore", label: "Manchas", color: "#7c3aed" },
    { key: "rugasScore", label: "Rugas", color: "#c2410c" },
    { key: "oleosidadeScore", label: "Oleosidade", color: "#1d4ed8" },
];

/**
 * Constrói a sequência de coordenadas SVG para uma métrica da evolução.
 *
 * @function buildPolyline
 * @param {object[]} points - Pontos temporais devolvidos pela API.
 * @param {string} key - Chave da métrica que será desenhada.
 * @returns {string} Coordenadas no formato esperado pelo elemento polyline.
 */
function buildPolyline(points, key) {
    const validPoints = points.filter((point) => typeof point[key] === "number");

    if (validPoints.length === 0) return "";

    return validPoints
        .map((point, index) => {
            // A escala SVG usa 0 no topo, por isso o score maior fica visualmente mais acima.
            const x =
                validPoints.length === 1
                    ? 50
                    : 10 + (index * 80) / (validPoints.length - 1);
            const y = 90 - (point[key] - 1) * 35;
            return `${x},${y}`;
        })
        .join(" ");
}

/** Formata uma pontuação cosmética sem inferir valores ausentes. */
function formatScore(value, scale = {}) {
    if (typeof value !== "number") return "Sem dados";
    return `${value} — ${scale[value] ?? "classificação indisponível"}`;
}

/**
 * Mostra um gráfico SVG simples com a evolução cosmética da pele.
 *
 * @function SkinEvolutionPage
 * @returns {import("react").JSX.Element} Página de evolução temporal da pele.
 */
export function SkinEvolutionPage() {
    const [status, setStatus] = useState("idle");
    const [error, setError] = useState("");
    const [evolution, setEvolution] = useState(null);

    /**
     * Carrega os pontos de evolução cosmética do utilizador autenticado.
     *
     * @async
     * @function loadEvolution
     * @returns {Promise<void>}
     */
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

    useEffect(() => {
        void loadEvolution();
    }, []);

    const polylines = useMemo(() => {
        const points = evolution?.points ?? [];
        return SERIES.map((serie) => ({
            ...serie,
            points: buildPolyline(points, serie.key),
        }));
    }, [evolution]);

    return (
        <section className="skin-evolution-page">
            <PageHero eyebrow="Pele e rotina" title="Evolução da tua pele" description="Acompanha tendências cosméticas ao longo do tempo sem perder o detalhe dos valores." />
            <button onClick={loadEvolution} disabled={status === "loading"}>
                {status === "loading" ? "A atualizar..." : "Atualizar"}
            </button>
            {status === "loading" ? <Skeleton lines={4} /> : null}
            {status === "error" && <p role="alert">{error}</p>}
            {status === "empty" && <EmptyState title="Ainda não há dados suficientes" description="São necessárias análises concluídas em momentos diferentes para desenhar a evolução." />}
            {status === "success" && (
                <article>
                    <svg
                        viewBox="0 0 100 100"
                        role="img"
                        aria-labelledby="skin-evolution-title"
                        aria-describedby="skin-evolution-description"
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
                    <p id="skin-evolution-description">
                        Escala: 1 baixo, 2 moderado, 3 alto. A tabela seguinte
                        contém os mesmos valores sem depender da cor ou do gráfico.
                    </p>
                    <div
                        className="table-scroll"
                        role="region"
                        aria-label="Tabela da evolução cosmética"
                        tabIndex={0}
                    >
                        <table>
                            <caption>Valores da evolução cosmética por data</caption>
                            <thead>
                                <tr>
                                    <th scope="col">Data</th>
                                    <th scope="col">Tipo de pele</th>
                                    {SERIES.map((serie) => (
                                        <th key={serie.key} scope="col">
                                            {serie.label}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {evolution.points.map((point, index) => (
                                    <tr key={`${point.createdAt}-${index}`}>
                                        <th scope="row">
                                            {new Date(point.createdAt).toLocaleDateString("pt-PT")}
                                        </th>
                                        <td>{getSkinTypeLabel(point.skinType)}</td>
                                        {SERIES.map((serie) => (
                                            <td key={serie.key}>
                                                {formatScore(
                                                    point[serie.key],
                                                    evolution.scale,
                                                )}
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    {(evolution.limitations ?? []).length > 0 && (
                        <>
                            <h2>Limitações</h2>
                            <ul>
                                {evolution.limitations.map((limitation) => (
                                    <li key={limitation}>{limitation}</li>
                                ))}
                            </ul>
                        </>
                    )}
                </article>
            )}
        </section>
    );
}
