import { getPersonalSkinHistory } from "../services/skin-history.service.js";

export async function getMySkinHistoryController(req, res, next) {
    try {
        const history = await getPersonalSkinHistory(req.user.id);
        return res.status(200).json({ history });
    } catch (err) {
        return next(err);
    }
}