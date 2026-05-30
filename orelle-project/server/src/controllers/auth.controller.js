import { loginUser, registerUser } from "../services/auth.service.js";
import {
    attachSessionCookie,
    clearSessionCookie,
} from "../services/session.service.js";
import {
    validateLoginInput,
    validateRegisterInput,
} from "../validators/auth.validator.js";

export async function registerController(req, res, next) {
    try {
        const input = validateRegisterInput(req.body);
        const user = await registerUser(input);

        return res.status(201).json({ user });
    } catch (err) {
        return next(err);
    }
}

export async function loginController(req, res, next) {
    try {
        const input = validateLoginInput(req.body);
        const user = await loginUser(input);

        attachSessionCookie(res, user);

        return res.status(200).json({ user });
    } catch (err) {
        return next(err);
    }
}

export function logoutController(req, res) {
    clearSessionCookie(res);
    return res.status(204).send();
}

export function meController(req, res) {
    return res.status(200).json({ user: req.user });
}