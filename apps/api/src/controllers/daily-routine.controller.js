/**
 * Controllers de rotina diaria da MF2.
 */
import {
    generateDailyRoutineForUser,
    getDailyRoutineForUser,
} from "../services/daily-routine.service.js";

export async function generateDailyRoutineController(req, res, next) {
    try {
        const routine = await generateDailyRoutineForUser(req.user.id);
        return res.status(201).json({ routine });
    } catch (err) {
        return next(err);
    }
}

export async function getDailyRoutineController(req, res, next) {
    try {
        const routine = await getDailyRoutineForUser(req.user.id);
        return res.status(200).json({ routine });
    } catch (err) {
        return next(err);
    }
}
