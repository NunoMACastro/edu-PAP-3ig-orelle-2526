/**
 * Validadores de autenticacao da MF0.
 *
 * Estes validadores protegem os services de receberem dados crus do request.
 * A validacao de email/password existe no backend mesmo que o frontend tambem
 * tenha campos `required`, porque o cliente nunca deve ser considerado fonte de
 * seguranca.
 */
import { AppError } from "../middlewares/error.middleware.js";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Normaliza um email recebido do cliente.
 *
 * @function normalizeEmail
 * @param {unknown} value - Valor recebido em `body.email`.
 * @returns {string} Email em minusculas e sem espacos laterais.
 */
function normalizeEmail(value) {
    return String(value ?? "")
        .trim()
        .toLowerCase();
}

/**
 * Valida o payload de registo do BK-MF0-01.
 *
 * @function validateRegisterInput
 * @param {{email?: unknown, password?: unknown}} body - Corpo do pedido HTTP.
 * @returns {{email: string, password: string}} Dados normalizados para o service.
 * @throws {AppError} Quando email ou password nao cumprem o contrato RF01/RNF10.
 */
export function validateRegisterInput(body) {
    const email = normalizeEmail(body.email);
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

/**
 * Valida o payload de login do BK-MF0-02.
 *
 * @function validateLoginInput
 * @param {{email?: unknown, password?: unknown}} body - Corpo do pedido HTTP.
 * @returns {{email: string, password: string}} Credenciais normalizadas.
 * @throws {AppError} Quando o payload nao tem formato suficiente para login.
 */
export function validateLoginInput(body) {
    const email = normalizeEmail(body.email);
    const password = String(body.password ?? "");
    const errors = {};

    if (!EMAIL_RE.test(email)) {
        errors.email = "Email invalido";
    }

    if (!password) {
        errors.password = "Password obrigatória";
    }

    if (Object.keys(errors).length > 0) {
        throw new AppError(400, "Dados de login invalidos", errors);
    }

    return { email, password };
}
