import {
    SESSION_COOKIE_NAME,
    verifySessionToken,
} from "../services/session.service.js";
import { AppError } from "./error.middleware.js";


export function requireAuth(req, res, next) {
    const token = req.cookies?.[SESSION_COOKIE_NAME];

    if (!token) {
        return next(new AppError(401, "Autenticacao obrigatoria"));
    }

    try {
        req.user = verifySessionToken(token);
        return next();
    } catch (err) {
        return next(err);
    }
}