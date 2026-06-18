import { FaceReport } from "../models/face-report.model.js";
import { Order, PAYMENT_STATUS } from "../models/order.model.js";
import { User } from "../models/user.model.js";

/**
 * Escapa valor para célula CSV.
 *
 * @function escapeCsvValue
 * @param {unknown} value - Valor bruto.
 * @returns {string} Valor seguro para CSV.
 */
function escapeCsvValue(value) {
    const text = String(value ?? "");
    return `"${text.replaceAll('"', '""')}"`;
}

/**
 * Constrói CSV compatível com Excel.
 *
 * @function buildCsv
 * @param {string[]} headers - Cabeçalhos.
 * @param {Array<Record<string, unknown>>} rows - Linhas normalizadas.
 * @returns {Buffer} Conteúdo CSV em UTF-8 com BOM.
 */
function buildCsv(headers, rows) {
    const lines = [
        headers.map(escapeCsvValue).join(","),
        ...rows.map((row) => headers.map((header) => escapeCsvValue(row[header])).join(",")),
    ];

    return Buffer.from(`\uFEFF${lines.join("\n")}`, "utf8");
}

/**
 * Escapa texto para uma stream PDF simples.
 *
 * @function escapePdfText
 * @param {unknown} value - Valor bruto.
 * @returns {string} Texto escapado para PDF.
 */
function escapePdfText(value) {
    return String(value ?? "")
        .replaceAll("\\", "\\\\")
        .replaceAll("(", "\\(")
        .replaceAll(")", "\\)");
}

/**
 * Gera PDF textual mínimo para defesa e operação.
 *
 * @function buildTextPdf
 * @param {string} title - Título do documento.
 * @param {string[]} lines - Linhas de texto.
 * @returns {Buffer} PDF mínimo.
 */
function buildTextPdf(title, lines) {
    const content = [`BT /F1 14 Tf 50 780 Td (${escapePdfText(title)}) Tj`];

    lines.slice(0, 40).forEach((line, index) => {
        content.push(`0 -${index === 0 ? 28 : 18} Td (${escapePdfText(line)}) Tj`);
    });

    content.push("ET");
    const stream = content.join("\n");
    const pdf = `%PDF-1.4
1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj
2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj
3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >> endobj
4 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj
5 0 obj << /Length ${Buffer.byteLength(stream)} >> stream
${stream}
endstream endobj
trailer << /Root 1 0 R >>
%%EOF`;

    return Buffer.from(pdf, "utf8");
}

/**
 * Obtém linhas minimizadas para exportação.
 *
 * @async
 * @function getExportRows
 * @param {"sales"|"ai-reports"|"users"} dataset - Conjunto pedido.
 * @returns {Promise<{title: string, headers: string[], rows: Array<Record<string, unknown>>}>} Dados seguros.
 */
async function getExportRows(dataset) {
    if (dataset === "sales") {
        const orders = await Order.find({})
            .select("status payment.status totalCents createdAt")
            .sort({ createdAt: -1 })
            .limit(200);

        return {
            title: "Exportação de vendas",
            headers: ["createdAt", "status", "paymentStatus", "totalEuros"],
            rows: orders.map((order) => ({
                createdAt: order.createdAt?.toISOString() ?? "",
                status: order.status,
                paymentStatus: order.payment.status,
                totalEuros: (order.totalCents / 100).toFixed(2),
                paid: order.payment.status === PAYMENT_STATUS.PAID ? "sim" : "nao",
            })),
        };
    }

    if (dataset === "ai-reports") {
        const reports = await FaceReport.find({})
            .select("analysisId limitations createdAt")
            .sort({ createdAt: -1 })
            .limit(100);

        return {
            title: "Exportação de relatórios IA",
            headers: ["createdAt", "analysisId", "limitationsCount"],
            rows: reports.map((report) => ({
                createdAt: report.createdAt?.toISOString() ?? "",
                analysisId: report.analysisId.toString(),
                limitationsCount: report.limitations?.length ?? 0,
            })),
        };
    }

    const users = await User.find({})
        .select("email role accountStatus isActive createdAt")
        .sort({ createdAt: -1 })
        .limit(200);

    return {
        title: "Exportação de utilizadores",
        headers: ["createdAt", "email", "role", "accountStatus", "isActive"],
        rows: users.map((user) => ({
            createdAt: user.createdAt?.toISOString() ?? "",
            email: user.email,
            role: user.role,
            accountStatus: user.accountStatus,
            isActive: user.isActive ? "sim" : "nao",
        })),
    };
}

/**
 * Gera exportação administrativa.
 *
 * @async
 * @function buildAdminExport
 * @param {{dataset: "sales"|"ai-reports"|"users", format: "csv"|"pdf"}} input - Pedido validado.
 * @returns {Promise<{buffer: Buffer, contentType: string, filename: string}>} Ficheiro pronto para resposta.
 */
export async function buildAdminExport(input) {
    const data = await getExportRows(input.dataset);

    if (input.format === "pdf") {
        const lines = data.rows.map((row) =>
            data.headers.map((header) => `${header}: ${row[header]}`).join(" | "),
        );

        return {
            buffer: buildTextPdf(data.title, lines),
            contentType: "application/pdf",
            filename: `${input.dataset}.pdf`,
        };
    }

    return {
        buffer: buildCsv(data.headers, data.rows),
        contentType: "text/csv; charset=utf-8",
        filename: `${input.dataset}.csv`,
    };
}

