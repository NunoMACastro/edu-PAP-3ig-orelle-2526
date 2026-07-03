/**
 * Pagina de exportacoes administrativas minimizadas.
 */
import { useState } from "react";
import { apiDownload } from "../services/apiClient.js";

/**
 * Resolve o nome do ficheiro indicado pelo backend.
 *
 * @function getDownloadFilename
 * @param {string|null} contentDisposition - Header Content-Disposition.
 * @param {string} fallback - Nome local quando o header nao existe.
 * @returns {string} Nome seguro para download.
 */
function getDownloadFilename(contentDisposition, fallback) {
    const utf8Match = contentDisposition?.match(/filename\*=UTF-8''([^;]+)/i);
    const filenameMatch = contentDisposition?.match(/filename="?([^";]+)"?/i);
    const encodedFilename = utf8Match?.[1] ?? filenameMatch?.[1];

    if (!encodedFilename) return fallback;

    return decodeURIComponent(encodedFilename);
}

/**
 * Descarrega um Blob no browser sem expor o conteudo no DOM.
 *
 * @function downloadBlob
 * @param {Blob} blob - Conteudo binario recebido da API.
 * @param {string} filename - Nome do ficheiro.
 * @returns {void}
 */
function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = filename;
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 0);
}

/**
 * Gera exportacoes CSV/PDF como ficheiros descarregaveis.
 *
 * @function AdminExportsPage
 * @returns {JSX.Element} UI admin de exportacoes.
 */
export function AdminExportsPage() {
    const [dataset, setDataset] = useState("sales");
    const [format, setFormat] = useState("csv");
    const [exportResult, setExportResult] = useState(null);
    const [status, setStatus] = useState("idle");
    const [error, setError] = useState("");

    async function generateExport(event) {
        event.preventDefault();
        setStatus("loading");
        setError("");

        try {
            const response = await apiDownload(
                `/admin/exports/${dataset}?format=${format}`,
            );
            const blob = await response.blob();
            const filename = getDownloadFilename(
                response.headers.get("content-disposition"),
                `${dataset}.${format}`,
            );

            downloadBlob(blob, filename);
            setExportResult({
                filename,
                contentType: response.headers.get("content-type") ?? "",
                rowCount: response.headers.get("x-orelle-export-rows") ?? "0",
            });
            setStatus("success");
        } catch (err) {
            setError(err.message);
            setStatus("error");
        }
    }

    return (
        <section>
            <h1>Exportações</h1>
            <form onSubmit={generateExport}>
                <label>
                    Dataset
                    <select value={dataset} onChange={(event) => setDataset(event.target.value)}>
                        <option value="sales">Vendas</option>
                        <option value="users">Utilizadores</option>
                        <option value="ai-reports">Relatórios IA</option>
                    </select>
                </label>
                <label>
                    Formato
                    <select value={format} onChange={(event) => setFormat(event.target.value)}>
                        <option value="csv">CSV</option>
                        <option value="pdf">PDF</option>
                    </select>
                </label>
                <button type="submit" disabled={status === "loading"}>
                    Gerar exportação
                </button>
            </form>
            {status === "error" && <p role="alert">{error}</p>}
            {status === "success" && exportResult && (
                <article>
                    <h2>{exportResult.filename}</h2>
                    <p>
                        {exportResult.contentType} · {exportResult.rowCount} linhas
                    </p>
                </article>
            )}
        </section>
    );
}
