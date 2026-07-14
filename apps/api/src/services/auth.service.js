/**
 * Servico de autenticacao da MF0.
 *
 * Este ficheiro junta o registo do BK-MF0-01 com o login do BK-MF0-02. A regra
 * de seguranca principal e nunca devolver `password` nem `passwordHash`.
 */
import bcrypt from "bcryptjs";
import { User } from "../models/user.model.js";
import { AppError } from "../middlewares/error.middleware.js";
import {
    getPasswordByteLength,
    PASSWORD_MAX_BYTES,
    PASSWORD_MIN_BYTES,
} from "../validators/auth.validator.js";

const ACTIVE_ACCOUNT_STATUS = "active";
export const BCRYPT_COST = 12;
// Hash fixo de um valor que nunca é uma credencial válida. Permite executar o
// mesmo custo bcrypt quando o email não existe, sem persistir ou gerar dados.
const LOGIN_TIMING_PLACEHOLDER_HASH =
    "$2a$12$SjyJtg.CIH6fuVpsnblwQOL3ADsDlY9CKbkJiS.ZHnF8SgfdEvEV6";

/**
 * Garante no proprio service que nenhuma chamada chega ao bcrypt fora do
 * intervalo suportado, mesmo se um caller interno contornar o validator HTTP.
 *
 * @function ensurePasswordFitsBcrypt
 * @param {string} password - Password a enviar para hash/compare.
 * @returns {void}
 * @throws {AppError} Quando o tamanho UTF-8 fica fora de 8-72 bytes.
 */
export function ensurePasswordFitsBcrypt(password) {
    const passwordBytes = getPasswordByteLength(String(password ?? ""));

    if (
        passwordBytes < PASSWORD_MIN_BYTES ||
        passwordBytes > PASSWORD_MAX_BYTES
    ) {
        throw new AppError(400, "Password fora dos limites permitidos", {
            password: "A password deve ter entre 8 e 72 bytes UTF-8",
        });
    }
}

/**
 * Identifica a violacao do indice unico de email devolvida pelo MongoDB.
 *
 * Quando o driver fornece `keyPattern`/`keyValue`, exigimos que a chave seja
 * `email`. Drivers/mocks antigos podem expor apenas `code: 11000`; no modelo
 * User atual, email e o unico campo unico e esse caso continua controlado.
 *
 * @function isDuplicateEmailError
 * @param {unknown} error - Erro devolvido por `User.create`.
 * @returns {boolean} Verdadeiro quando a corrida corresponde a email repetido.
 */
export function isDuplicateEmailError(error) {
    if (Number(error?.code) !== 11000) return false;

    const duplicateKeys = [
        ...Object.keys(error?.keyPattern ?? {}),
        ...Object.keys(error?.keyValue ?? {}),
    ];

    return duplicateKeys.length === 0 || duplicateKeys.includes("email");
}

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
 * Não consulta previamente o email: o índice único é a fonte atómica de
 * verdade e um `11000` de email torna-se num resultado interno neutro. Assim,
 * duas tentativas concorrentes não criam contas duplicadas nem respostas HTTP
 * distinguíveis.
 *
 * @param {{email: string, password: string}} input - Dados já validados.
 * @returns {Promise<{created: boolean, user: object|null}>} Resultado interno.
 * @throws {Error} Quando a persistência falha por outra causa.
 */
export async function registerUser({ email, password }) {
    ensurePasswordFitsBcrypt(password);
    const passwordHash = await bcrypt.hash(password, BCRYPT_COST);

    try {
        const user = await User.create({
            email,
            passwordHash,
            role: "cliente",
        });

        return { created: true, user: toSafeUser(user) };
    } catch (error) {
        if (!isDuplicateEmailError(error)) throw error;

        return { created: false, user: null };
    }
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
    ensurePasswordFitsBcrypt(password);
    const user = await User.findOne({ email }).select(
        "+passwordHash email role createdAt isActive accountStatus",
    );

    // A comparação usa sempre um hash bcrypt válido. Assim, email inexistente,
    // password errada e conta inativa percorrem primeiro o mesmo boundary
    // criptográfico; o estado da conta só é revelado após credencial correta.
    const passwordMatches = await bcrypt.compare(
        password,
        user?.passwordHash ?? LOGIN_TIMING_PLACEHOLDER_HASH,
    );

    if (!user || !passwordMatches) {
        throw new AppError(401, "Credenciais invalidas");
    }

    ensureUserCanAuthenticate(user);

    return toSafeUser(user);
}
