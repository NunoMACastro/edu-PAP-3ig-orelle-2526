/**
 * Servico de autenticacao da MF0.
 *
 * Este ficheiro junta o registo do BK-MF0-01 com o login do BK-MF0-02. A regra
 * de seguranca principal e nunca devolver `password` nem `passwordHash`.
 */
import bcrypt from "bcryptjs";
import { User } from "../models/user.model.js";
import { AppError } from "../middlewares/error.middleware.js";

const ACTIVE_ACCOUNT_STATUS = "active";
export const BCRYPT_COST = 12;

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
 * Confirma se a conta pode iniciar ou manter sessão.
 *
 * @function ensureUserCanAuthenticate
 * @param {{isActive?: boolean, accountStatus?: string}} user - Utilizador carregado da base de dados.
 * @returns {void}
 * @throws {AppError} Quando a conta esta suspensa ou eliminada.
 */
export function ensureUserCanAuthenticate(user) {
    const accountStatus = user.accountStatus ?? ACTIVE_ACCOUNT_STATUS;

    if (user.isActive === false || accountStatus !== ACTIVE_ACCOUNT_STATUS) {
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

    const passwordHash = await bcrypt.hash(password, BCRYPT_COST);
    const user = await User.create({ email, passwordHash, role: "cliente" });

    return toSafeUser(user);
}

/**
 * Autentica um utilizador por email/password.
 *
 * @async
 * @function loginUser
 * @param {{email: string, password: string}} input - Credenciais validadas.
 * @returns {Promise<{id: string, email: string, role: string, createdAt: Date|undefined}>} Utilizador autenticado.
 * @throws {AppError} Quando email ou password nao correspondem.
 */
export async function loginUser({ email, password }) {
    const user = await User.findOne({ email }).select(
        "+passwordHash email role createdAt isActive accountStatus",
    );

    // A mensagem e igual para email inexistente e password errada para evitar
    // enumeracao de contas.
    if (!user) {
        throw new AppError(401, "Credenciais invalidas");
    }

    ensureUserCanAuthenticate(user);

    const passwordMatches = await bcrypt.compare(password, user.passwordHash);

    if (!passwordMatches) {
        throw new AppError(401, "Credenciais invalidas");
    }

    return toSafeUser(user);
}
