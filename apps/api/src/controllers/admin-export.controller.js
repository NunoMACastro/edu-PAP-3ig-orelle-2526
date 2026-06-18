import { buildAdminExport } from "../services/admin-export.service.js";
import { validateAdminExportRequest } from "../validators/admin-export.validator.js";

/**
 * Descarrega exportação administrativa.
 *
 * @async
 * @function downloadAdminExportController
 */
export async function downloadAdminExportController(req, res, next) {
    try {
        const input = validateAdminExportRequest(req.params, req.query);
        const file = await buildAdminExport(input);

        res.setHeader("Content-Type", file.contentType);
        res.setHeader("Content-Disposition", `attachment; filename="${file.filename}"`);
        return res.status(200).send(file.buffer);
    } catch (err) {
        return next(err);
    }
}