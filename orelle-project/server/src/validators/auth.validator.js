import { AppError } from "../middlewares/error.middleware.js";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;


export function validateRegisterInput(body) {
    const email = String(body.email ?? "")
        .trim()
        .toLowerCase();
    const password = String(body.password ?? "");
    const errors = {};

    if (!EMAIL_RE.test(email)) {
        errors.email = "Email invalido";
    }

    if (password.length < 8) {
        errors.password = "A password deve ter pelo menos 8 caracteres";
    }

    if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) {
        errors.password = "A password deve incluir letras e numeros";
    }

    if (Object.keys(errors).length > 0) {
        throw new AppError(400, "Dados de registo invalidos", errors);
    }

    return { email, password };
}