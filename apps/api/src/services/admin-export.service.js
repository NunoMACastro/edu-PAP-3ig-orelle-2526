/**
 * Service de exportacoes administrativas minimizadas.
 */
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { AiConsultationReview } from "../models/ai-consultation-review.model.js";
import { FaceReport } from "../models/face-report.model.js";
import { Order } from "../models/order.model.js";
import { ReportUnlock } from "../models/report-unlock.model.js";
import { User } from "../models/user.model.js";

const PDF_PAGE_SIZE = [595.28, 841.89];
const PDF_MARGIN = 44;
const PDF_BODY_FONT_SIZE = 8.5;
const PDF_BODY_LINE_HEIGHT = 11;

/**
 * Neutraliza os prefixos interpretados como fórmulas por folhas de cálculo.
 * O apóstrofo força representação textual sem remover o conteúdo original.
 *
 * @param {unknown} value - Valor potencialmente controlado por utilizadores.
 * @returns {string} Texto seguro para posterior escape CSV.
 */
function neutralizeSpreadsheetFormula(value) {
    const text = String(value ?? "");
    return /^[=+\-@\t\r]/.test(text) ? `'${text}` : text;
}

/**
 * Escapa valor CSV para manter compatibilidade com folhas de cálculo sem
 * permitir execução de fórmulas em células controladas.
 *
 * @function escapeCsv
 * @param {unknown} value - Valor a serializar.
 * @returns {string} Campo CSV seguro.
 */
function escapeCsv(value) {
    const text = neutralizeSpreadsheetFormula(value);
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
 * Converte texto para o conjunto de caracteres suportado pela fonte PDF.
 * Caracteres não representáveis são substituídos para que conteúdo externo
 * nunca consiga interromper a geração do documento.
 *
 * @param {unknown} value - Conteúdo a normalizar.
 * @param {import("pdf-lib").PDFFont} font - Fonte embebida no documento.
 * @returns {string} Texto seguro para a fonte escolhida.
 */
function normalizePdfText(value, font) {
    const normalized = String(value ?? "")
        .replaceAll("\t", "    ")
        .replaceAll("\u0000", "");
    let result = "";

    for (const character of normalized) {
        if (character === "\n" || character === "\r") {
            result += character;
            continue;
        }

        try {
            font.encodeText(character);
            result += character;
        } catch {
            result += "?";
        }
    }

    return result;
}

/**
 * Quebra texto em linhas que cabem na largura útil da página, preservando
 * quebras explícitas e dividindo também valores longos sem espaços.
 *
 * @param {string} text - Texto já compatível com a fonte.
 * @param {import("pdf-lib").PDFFont} font - Fonte usada na medição.
 * @param {number} fontSize - Tamanho da fonte.
 * @param {number} maxWidth - Largura máxima da linha.
 * @returns {string[]} Linhas prontas a desenhar.
 */
function wrapPdfText(text, font, fontSize, maxWidth) {
    const wrapped = [];

    for (const paragraph of text.replaceAll("\r\n", "\n").split("\n")) {
        if (paragraph.length === 0) {
            wrapped.push("");
            continue;
        }

        let currentLine = "";
        for (const character of paragraph) {
            const candidate = `${currentLine}${character}`;
            if (
                currentLine.length > 0 &&
                font.widthOfTextAtSize(candidate, fontSize) > maxWidth
            ) {
                wrapped.push(currentLine);
                currentLine = character;
            } else {
                currentLine = candidate;
            }
        }
        wrapped.push(currentLine);
    }

    return wrapped;
}

/**
 * Constrói um PDF textual paginado e estruturalmente conforme.
 *
 * @async
 * @function buildSimplePdf
 * @param {string} title - Título do documento.
 * @param {string} body - Conteúdo textual minimizado.
 * @returns {Promise<Buffer>} Representação PDF válida.
 */
export async function buildSimplePdf(title, body) {
    const document = await PDFDocument.create();
    const regularFont = await document.embedFont(StandardFonts.Helvetica);
    const boldFont = await document.embedFont(StandardFonts.HelveticaBold);
    const safeTitle = normalizePdfText(title, boldFont);
    const safeBody = normalizePdfText(body, regularFont);
    const contentWidth = PDF_PAGE_SIZE[0] - PDF_MARGIN * 2;
    const lines = wrapPdfText(
        safeBody,
        regularFont,
        PDF_BODY_FONT_SIZE,
        contentWidth,
    );
    let page;
    let cursorY;

    const addPage = ({ includeTitle = false } = {}) => {
        page = document.addPage(PDF_PAGE_SIZE);
        cursorY = PDF_PAGE_SIZE[1] - PDF_MARGIN;

        if (includeTitle) {
            page.drawText(safeTitle, {
                x: PDF_MARGIN,
                y: cursorY - 18,
                size: 18,
                font: boldFont,
                color: rgb(0.18, 0.12, 0.16),
                maxWidth: contentWidth,
            });
            cursorY -= 42;
            page.drawLine({
                start: { x: PDF_MARGIN, y: cursorY + 9 },
                end: { x: PDF_PAGE_SIZE[0] - PDF_MARGIN, y: cursorY + 9 },
                thickness: 0.75,
                color: rgb(0.72, 0.55, 0.64),
            });
        }
    };

    addPage({ includeTitle: true });
    for (const line of lines) {
        if (cursorY < PDF_MARGIN + 24) {
            addPage();
        }
        if (line.length > 0) {
            page.drawText(line, {
                x: PDF_MARGIN,
                y: cursorY,
                size: PDF_BODY_FONT_SIZE,
                font: regularFont,
                color: rgb(0.12, 0.12, 0.12),
            });
        }
        cursorY -= PDF_BODY_LINE_HEIGHT;
    }

    const pages = document.getPages();
    pages.forEach((currentPage, index) => {
        currentPage.drawText(`Página ${index + 1} de ${pages.length}`, {
            x: PDF_MARGIN,
            y: 20,
            size: 8,
            font: regularFont,
            color: rgb(0.35, 0.35, 0.35),
        });
    });

    document.setTitle(safeTitle);
    document.setSubject("Exportação administrativa minimizada da Orélle");
    document.setCreator("Orélle académico/local");
    document.setProducer("pdf-lib");

    return Buffer.from(await document.save({ useObjectStreams: false }));
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
        .select(
            "schemaVersion lifecycleStatus finalRecommendationIds createdAt",
        )
        .sort({ createdAt: -1 })
        .limit(100);
    const reportIds = reports.map(({ _id }) => _id);
    const [reviews, unlocks] = reportIds.length
        ? await Promise.all([
              AiConsultationReview.find({ reportId: { $in: reportIds } })
                  .select("reportId status")
                  .lean(),
              ReportUnlock.find({ reportId: { $in: reportIds } })
                  .select("reportId status depositCents simulatedPayment.status")
                  .lean(),
          ])
        : [[], []];
    const reviewsByReport = new Map(
        reviews.map((review) => [review.reportId.toString(), review]),
    );
    const unlocksByReport = new Map(
        unlocks.map((unlock) => [unlock.reportId.toString(), unlock]),
    );

    return {
        headers: [
            "id",
            "schemaVersion",
            "lifecycleStatus",
            "recommendationCount",
            "reviewStatus",
            "unlockStatus",
            "simulatedPaymentStatus",
            "depositCents",
            "createdAt",
        ],
        rows: reports.map((report) => {
            const reportId = report._id.toString();
            const review = reviewsByReport.get(reportId);
            const unlock = unlocksByReport.get(reportId);

            return {
                id: reportId,
                schemaVersion: Number(report.schemaVersion ?? 1),
                lifecycleStatus: report.lifecycleStatus ?? "legacy",
                recommendationCount: Array.isArray(
                    report.finalRecommendationIds,
                )
                    ? report.finalRecommendationIds.length
                    : 0,
                reviewStatus: review?.status ?? "not_requested",
                unlockStatus: unlock?.status ?? "not_created",
                simulatedPaymentStatus:
                    unlock?.simulatedPayment?.status ?? "not_started",
                depositCents: Number(unlock?.depositCents ?? 0),
                createdAt: report.createdAt?.toISOString?.() ?? "",
            };
        }),
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
            buffer: await buildSimplePdf(`Orelle ${dataset}`, csvText),
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
