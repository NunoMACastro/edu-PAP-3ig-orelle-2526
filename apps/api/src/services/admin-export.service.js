/**
 * Service de exportacoes administrativas minimizadas.
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
 * Constroi CSV a partir de linhas simples.
 *
 * @function buildCsvText
 * @param {string[]} headers - Cabecalhos.
 * @param {Array<Record<string, unknown>>} rows - Linhas.
 * @returns {string} Conteudo CSV.
 */
function buildCsvText(headers, rows) {
    return [
        headers.map(escapeCsv).join(","),
        ...rows.map((row) => headers.map((header) => escapeCsv(row[header])).join(",")),
    ].join("\n");
}

/**
 * Constroi CSV descarregavel a partir de linhas simples.
 *
 * @function buildCsv
 * @param {string[]} headers - Cabecalhos.
 * @param {Array<Record<string, unknown>>} rows - Linhas.
 * @returns {Buffer} Conteudo CSV em UTF-8 com BOM para Excel.
 */
export function buildCsv(headers, rows) {
    return Buffer.from(`\uFEFF${buildCsvText(headers, rows)}`, "utf8");
}

/**
 * Constroi um PDF textual minimo sem dependencias externas.
 *
 * @function buildSimplePdf
 * @param {string} title - Titulo do documento.
 * @param {string} body - Conteudo textual minimizado.
 * @returns {Buffer} Representacao PDF simples.
 */
export function buildSimplePdf(title, body) {
    const text = `${title}\n\n${body}`.replace(/[()\\]/g, "");
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
 * Le dados minimizados do dataset pedido.
 *
 * @async
 * @function getDatasetRows
 * @param {string} dataset - Dataset canonico.
 * @returns {Promise<{headers: string[], rows: object[]}>} Dados exportaveis.
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

    // Exportacoes administrativas tambem respeitam pedidos de privacidade RF41.
    const reports = await FaceReport.find({ privacyStatus: "active" })
        .select("userId analysisId cosmeticSummary sources limitations createdAt")
        .sort({ createdAt: -1 })
        .limit(100);
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
 * Gera uma exportacao administrativa minimizada.
 *
 * @async
 * @function buildAdminExport
 * @param {{dataset: string, format: string}} input - Pedido validado.
 * @returns {Promise<{filename: string, contentType: string, buffer: Buffer, rowCount: number}>} Exportacao descarregavel.
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
