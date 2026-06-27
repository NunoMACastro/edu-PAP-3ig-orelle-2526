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

        return res.status(200).send(exportResult.buffer);
    } catch (err) {
        return next(err);
    }
}
