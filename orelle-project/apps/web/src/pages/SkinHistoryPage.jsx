import { useState } from "react";
import { apiRequest } from "../services/apiClient.js";

export function SkinHistoryPage() {
    const [history, setHistory] = useState([]);
    const [status, setStatus] = useState("idle");
    const [error, setError] = useState("");

    async function loadHistory() {
        setStatus("loading");
        setError("");

        try {
            const data = await apiRequest("/me/skin-history");
            setHistory(data.history);
            setStatus(data.history.length === 0 ? "empty" : "success");
        } catch (err) {
            setError(err.message);
            setStatus("error");
        }
    }

    return (
        <section>
            <h1>Histórico pessoal de pele</h1>
            <button onClick={loadHistory} disabled={status === "loading"}>
                {status === "loading" ? "A carregar..." : "Ver histórico"}
            </button>
            {status === "error" && <p role="alert">{error}</p>}
            {status === "empty" && <p>Ainda não existem análises ou relatórios.</p>}
            {status === "success" && (
                <ol>
                    {history.map((item) => (
                        <li key={`${item.type}-${item.id}`}>
                            <strong>{item.type === "analysis" ? "Análise" : "Relatório"}</strong>
                            <time dateTime={item.createdAt}>
                                {new Date(item.createdAt).toLocaleString("pt-PT")}
                            </time>
                            {item.type === "report" ? (
                                <p>{item.cosmeticSummary}</p>
                            ) : (
                                <p>Provider: {item.providerName}</p>
                            )}
                        </li>
                    ))}
                </ol>
            )}
        </section>
    );
}