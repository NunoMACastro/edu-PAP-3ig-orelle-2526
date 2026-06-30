/**
 * Service de exportações administrativas minimizadas.
 */
import { FaceReport } from "../models/face-report.model.js";
import { Order } from "../models/order.model.js";
import { User } from "../models/user.model.js";

/**
 * Escapa valor CSV para manter compatibilidade com Excel.
 *
 * @function escapeCsv
 * @param {unknown} value - Valor a serializar.
 * @returns {string} Campo CSV seguro.
 */
function escapeCsv(value) {
    const text = String(value ?? "");
    return `"${text.replaceAll('"', '""')}"`;
}

/**
 * Constrói CSV a partir de linhas simples.
 *
 * @function buildCsvText
 * @param {string[]} headers - Cabeçalhos.
 * @param {Array<Record<string, unknown>>} rows - Linhas.
 * @returns {string} Conteúdo CSV.
 */
function buildCsvText(headers, rows) {
    return [
        headers.map(escapeCsv).join(","),
        ...rows.map((row) => headers.map((header) => escapeCsv(row[header])).join(",")),
    ].join("\n");
}

/**
 * Constrói CSV descarregável a partir de linhas simples.
 *
 * @function buildCsv
 * @param {string[]} headers - Cabeçalhos.
 * @param {Array<Record<string, unknown>>} rows - Linhas.
 * @returns {Buffer} Conteúdo CSV em UTF-8 com BOM para Excel.
 */
export function buildCsv(headers, rows) {
    return Buffer.from(`\uFEFF${buildCsvText(headers, rows)}`, "utf8");
}

/**
 * Constrói um PDF textual mínimo sem dependências externas.
 *
 * @function buildSimplePdf
 * @param {string} title - Título do documento.
 * @param {string} body - Conteúdo textual minimizado.
 * @returns {Buffer} Representação PDF simples.
 */
export function buildSimplePdf(title, body) {
    const text = `${title}\n\n${body}`.replace(/[()\\]/g, "");

    // A sanitização remove caracteres que quebram a string simples do PDF.
    // O limite reduz risco de gerar ficheiros enormes a partir de dados administrativos.
    const stream = `BT /F1 12 Tf 72 720 Td (${text.slice(0, 1200)}) Tj ET`;
    const pdf = `%PDF-1.1
1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj
2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj
3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R >> endobj
4 0 obj << /Length ${Buffer.byteLength(stream, "utf8")} >> stream
${stream}
endstream endobj
xref
0 5
0000000000 65535 f
trailer << /Root 1 0 R >>
%%EOF`;

    return Buffer.from(pdf, "utf8");
}

/**
 * Lê dados minimizados do dataset pedido.
 *
 * @async
 * @function getDatasetRows
 * @param {string} dataset - Dataset canónico.
 * @returns {Promise<{headers: string[], rows: object[]}>} Dados exportáveis.
 */
async function getDatasetRows(dataset) {
    if (dataset === "sales") {
        const orders = await Order.find({}).sort({ createdAt: -1 }).limit(200);

        return {
            headers: ["id", "totalCents", "status", "paymentStatus", "createdAt"],
            rows: orders.map((order) => ({
                id: order._id.toString(),
                totalCents: order.totalCents,
                status: order.status,
                paymentStatus: order.payment?.status,
                createdAt: order.createdAt?.toISOString?.() ?? "",
            })),
        };
    }

    if (dataset === "users") {
        const users = await User.find({})
            .select("email role isActive accountStatus createdAt")
            .sort({ createdAt: -1 })
            .limit(200);

        // A projeção exclui passwordHash e qualquer outro segredo da conta.
        return {
            headers: ["id", "email", "role", "isActive", "accountStatus", "createdAt"],
            rows: users.map((user) => ({
                id: user._id.toString(),
                email: user.email,
                role: user.role,
                isActive: user.isActive,
                accountStatus: user.accountStatus ?? "active",
                createdAt: user.createdAt?.toISOString?.() ?? "",
            })),
        };
    }

    const reports = await FaceReport.find({ privacyStatus: "active" })
        .select("userId analysisId cosmeticSummary sources limitations createdAt")
        .sort({ createdAt: -1 })
        .limit(100);

    // Relatórios apagados ou anonimizados ficam fora da exportação administrativa.
    return {
        headers: ["id", "userId", "analysisId", "summary", "sources", "limitations", "createdAt"],
        rows: reports.map((report) => ({
            id: report._id.toString(),
            userId: report.userId.toString(),
            analysisId: report.analysisId.toString(),
            summary: report.cosmeticSummary,
            sources: (report.sources ?? []).join("; "),
            limitations: (report.limitations ?? []).join("; "),
            createdAt: report.createdAt?.toISOString?.() ?? "",
        })),
    };
}

/**
 * Gera uma exportação administrativa minimizada.
 *
 * @async
 * @function buildAdminExport
 * @param {{dataset: string, format: string}} input - Pedido validado.
 * @returns {Promise<{filename: string, contentType: string, buffer: Buffer, rowCount: number}>} Exportação descarregável.
 */
export async function buildAdminExport({ dataset, format }) {
    const { headers, rows } = await getDatasetRows(dataset);
    const csvText = buildCsvText(headers, rows);

    if (format === "pdf") {
        return {
            filename: `${dataset}.pdf`,
            contentType: "application/pdf",
            buffer: buildSimplePdf(`Orelle ${dataset}`, csvText),
            rowCount: rows.length,
        };
    }

    return {
        filename: `${dataset}.csv`,
        contentType: "text/csv; charset=utf-8",
        buffer: buildCsv(headers, rows),
        rowCount: rows.length,
    };
}
