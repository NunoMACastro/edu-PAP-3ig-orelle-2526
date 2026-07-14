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

/** Limite inferior da password medido no encoding recebido pelo bcrypt. */
export const PASSWORD_MIN_BYTES = 8;

/** Limite superior seguro antes da truncagem historica do bcrypt. */
export const PASSWORD_MAX_BYTES = 72;

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
 * Mede a password em bytes UTF-8, e nao em code units JavaScript.
 *
 * Esta distincao e essencial para caracteres acentuados, emoji e restantes
 * caracteres multibyte: `password.length <= 72` nao garante que o bcrypt
 * receba no maximo 72 bytes.
 *
 * @function getPasswordByteLength
 * @param {string} password - Password ja convertida para string.
 * @returns {number} Tamanho real do valor em UTF-8.
 */
export function getPasswordByteLength(password) {
    return Buffer.byteLength(password, "utf8");
}

/**
 * Acrescenta ao mapa de erros o contrato comum de 8 a 72 bytes UTF-8.
 *
 * @function validatePasswordByteLength
 * @param {string} password - Password recebida.
 * @param {Record<string, string>} errors - Mapa mutavel de erros publicos.
 * @returns {number} Numero de bytes calculado uma unica vez.
 */
function validatePasswordByteLength(password, errors) {
    const passwordBytes = getPasswordByteLength(password);

    if (passwordBytes < PASSWORD_MIN_BYTES) {
        errors.password = "A password deve ter pelo menos 8 bytes UTF-8";
    } else if (passwordBytes > PASSWORD_MAX_BYTES) {
        errors.password = "A password não pode exceder 72 bytes UTF-8";
    }

    return passwordBytes;
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

    validatePasswordByteLength(password, errors);

    if (
        !errors.password &&
        (!/\p{L}/u.test(password) || !/\p{N}/u.test(password))
    ) {
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

    validatePasswordByteLength(password, errors);

    if (Object.keys(errors).length > 0) {
        throw new AppError(400, "Dados de login invalidos", errors);
    }

    return { email, password };
}
