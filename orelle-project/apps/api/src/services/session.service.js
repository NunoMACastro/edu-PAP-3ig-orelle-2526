import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { AppError } from "../middlewares/error.middleware.js";

export const SESSION_COOKIE_NAME = "orelle_session";

export function getSessionCookieOptions() {
    return {
        httpOnly: true,
        sameSite: "lax",
        secure: env.nodeEnv === "production",
        path: "/",
        maxAge: 1000 * 60 * 60 * 2,
    };
}

export function createSessionToken(user) {
    return jwt.sign(
        {
            sub: user.id,
            email: user.email,
            role: user.role,
        },
        env.sessionSecret,
        { expiresIn: env.sessionTtl },
    );
}

export function verifySessionToken(token) {
    try {
        const payload = jwt.verify(token, env.sessionSecret);

        return {
            id: payload.sub,
            email: payload.email,
            role: payload.role,
        };
    } catch {
        throw new AppError(401, "Sessao invalida ou expirada");
    }
}

export function attachSessionCookie(res, user) {
    const token = createSessionToken(user);
    res.cookie(SESSION_COOKIE_NAME, token, getSessionCookieOptions());
}

export function clearSessionCookie(res) {
    res.clearCookie(SESSION_COOKIE_NAME, getSessionCookieOptions());
}