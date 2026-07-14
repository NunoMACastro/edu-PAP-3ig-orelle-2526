/**
 * Controller de simulação de maquilhagem.
 */
import {
    createMakeupSimulationForReport,
    getMakeupSimulationForUser,
    readMakeupSimulationImageForUser,
    revokeMakeupSimulationConsent,
} from "../services/makeup-simulation.service.js";
import {
    validateMakeupSimulationId,
    validateMakeupSimulationInput,
} from "../validators/makeup-simulation.validator.js";

function setSensitiveNoStore(res) {
    res.set("Cache-Control", "private, no-store, max-age=0");
    res.set("Pragma", "no-cache");
}

/**
 * Cria uma simulação de maquilhagem para o utilizador autenticado.
 *
 * @async
 * @function createMakeupSimulationController
 * @param {import("express").Request & {user: {id: string}, faceConsent?: object}} req - Pedido autenticado com consentimento facial ativo.
 * @param {import("express").Response} res - Resposta Express.
 * @param {import("express").NextFunction} next - Próximo middleware.
 * @returns {Promise<import("express").Response|void>} Resposta 201 com a simulação pública.
 */
export async function createMakeupSimulationController(req, res, next) {
    try {
        const input = validateMakeupSimulationInput({
            ...req.body,
            reportId: req.params.reportId ?? req.body?.reportId,
        });
        const simulation = await createMakeupSimulationForReport(
            req.user.id,
            input,
            req.faceConsent,
        );
        setSensitiveNoStore(res);
        return res.status(201).json({ simulation });
    } catch (err) {
        return next(err);
    }
}

/** Devolve estado operacional da simulação própria. */
export async function getMakeupSimulationController(req, res, next) {
    try {
        const simulationId = validateMakeupSimulationId(req.params);
        const simulation = await getMakeupSimulationForUser(
            req.user.id,
            simulationId,
        );
        setSensitiveNoStore(res);
        return res.status(200).json({ simulation });
    } catch (error) {
        return next(error);
    }
}

/** Serve output cifrado apenas ao titular e sem cache. */
export async function getMakeupSimulationImageController(req, res, next) {
    try {
        const simulationId = validateMakeupSimulationId(req.params);
        const image = await readMakeupSimulationImageForUser(
            req.user.id,
            simulationId,
        );
        res.set({
            "Cache-Control": "private, no-store, max-age=0",
            Pragma: "no-cache",
            "Content-Type": image.mimeType,
            "Content-Length": String(image.buffer.length),
            "X-Content-Type-Options": "nosniff",
            "Cross-Origin-Resource-Policy": "same-origin",
        });
        return res.status(200).send(image.buffer);
    } catch (error) {
        return next(error);
    }
}

/** Revoga apenas o consentimento da edição, sem apagar o relatório. */
export async function revokeMakeupSimulationConsentController(req, res, next) {
    try {
        const simulationId = validateMakeupSimulationId(req.params);
        const consent = await revokeMakeupSimulationConsent(
            req.user.id,
            simulationId,
        );
        setSensitiveNoStore(res);
        return res.status(200).json({ consent });
    } catch (error) {
        return next(error);
    }
}
