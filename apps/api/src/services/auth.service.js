/**
 * Servico de autenticacao da MF0 e MF4.
 *
 * Este ficheiro junta o registo com o login, aplicando as regras de segurança
 * e validação de estado de conta administrativo (ativo, suspenso ou eliminado).
 */
import bcrypt from "bcryptjs";
import { ACCOUNT_STATUSES, User } from "../models/user.model.js";
import { AppError } from "../middlewares/error.middleware.js";

/**
 * Converte um documento User numa resposta segura para o cliente.
 *
 * @function toSafeUser
 * @param {{_id: {toString: () => string}, email: string, role: string, createdAt?: Date}} user - Documento Mongoose ou mock equivalente.
 * @returns {{id: string, email: string, role: string, createdAt: Date|undefined}} Utilizador sem campos sensiveis.
 */
function toSafeUser(user) {
    return {
        id: user._id.toString(),
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
    };
}

/**
 * Confirma se a conta pode autenticar-se.
 *
 * @function ensureUserCanAuthenticate
 * @param {{isActive: boolean, accountStatus?: string}} user - Utilizador obtido da base de dados.
 * @returns {void}
 * @throws {AppError} Quando a conta foi suspensa ou eliminada.
 */
function ensureUserCanAuthenticate(user) {
    if (!user.isActive || user.accountStatus !== ACCOUNT_STATUSES.ACTIVE) {
        throw new AppError(403, "Conta inativa. Contacta a equipa Orélle.");
    }
}

/**
 * Regista um novo utilizador com password protegida por hash.
 *
 * @async
 * @function registerUser
 * @param {{email: string, password: string}} input - Dados validados pelo validator.
 * @returns {Promise<{id: string, email: string, role: string, createdAt: Date|undefined}>} Utilizador criado sem segredo.
 * @throws {AppError} Quando o email ja existe.
 */
export async function registerUser({ email, password }) {
    const existing = await User.findOne({ email }).select("_id");

    if (existing) {
        throw new AppError(409, "Já existe uma conta com este email");
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await User.create({ email, passwordHash, role: "cliente" });

    return toSafeUser(user);
}

/**
 * Autentica um utilizador por email/password, validando o estado administrativo.
 *
 * @async
 * @function loginUser
 * @param {{email: string, password: string}} input - Credenciais validadas.
 * @returns {Promise<{id: string, email: string, role: string, createdAt: Date|undefined}>} Utilizador autenticado.
 * @throws {AppError} Quando email, password nao correspondem ou conta está bloqueada.
 */
export async function loginUser({ email, password }) {
    // Agora pedimos também o "isActive" e o "accountStatus" na query
    const user = await User.findOne({ email }).select(
        "+passwordHash email role createdAt isActive accountStatus",
    );

    // Mensagem genérica para evitar enumeração de contas
    if (!user) {
        throw new AppError(401, "Credenciais invalidas");
    }

    // 1. Validar se o utilizador não está suspenso ou eliminado antes de validar a password
    ensureUserCanAuthenticate(user);

    // 2. Validar a password
    const passwordMatches = await bcrypt.compare(password, user.passwordHash);

    if (!passwordMatches) {
        throw new AppError(401, "Credenciais invalidas");
    }

    return toSafeUser(user);
}