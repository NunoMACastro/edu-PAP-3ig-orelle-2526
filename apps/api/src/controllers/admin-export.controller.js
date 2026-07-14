/**
 * Controllers de exportacao administrativa.
 */
import { buildAdminExport } from "../services/admin-export.service.js";
import { validateAdminExportRequest } from "../validators/admin-export.validator.js";

/**
 * Gera exportacao minimizada para admin.
 *
 * @async
 * @function exportAdminDatasetController
 * @param {import("express").Request} req - Pedido admin com dataset em `params` e filtros em `query`.
 * @param {import("express").Response} res - Resposta Express usada para enviar o ficheiro.
 * @param {import("express").NextFunction} next - Proximo middleware para erros.
 * @returns {Promise<import("express").Response|void>} Resposta 200 com o ficheiro exportado.
 */
export async function exportAdminDatasetController(req, res, next) {
    try {
        const input = validateAdminExportRequest(req.params, req.query);
        const exportResult = await buildAdminExport(input);

        res.setHeader("Content-Type", exportResult.contentType);
        res.setHeader(
            "Content-Disposition",
            `attachment; filename="${exportResult.filename}"`,
        );
        res.setHeader("X-Content-Type-Options", "nosniff");
        res.setHeader("X-Orelle-Export-Rows", String(exportResult.rowCount));
        res.setHeader("Cache-Control", "private, no-store, max-age=0");
        res.setHeader("Pragma", "no-cache");

        return res.status(200).send(exportResult.buffer);
    } catch (err) {
        return next(err);
    }
}
