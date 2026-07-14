/**
 * Servico administrativo de utilizadores.
 *
 * Implementa a alteracao de role do BK-MF0-05, protegida pelas rotas admin e
 * limitada aos valores canonicos definidos em `roles.js`.
 */
import mongoose from "mongoose";
import { ROLE_VALUES } from "../constants/roles.js";
import { AppError } from "../middlewares/error.middleware.js";
import { AuthSession } from "../models/auth-session.model.js";
import { ACCOUNT_STATUSES, User } from "../models/user.model.js";

/**
 * Atualiza uma conta e revoga sessões na mesma transação quando existe BD.
 *
 * Fixtures unitárias sem ligação mantêm a query simples; o runtime pronto usa
 * sempre replica set e não pode confirmar a desativação sem revogar cookies.
 *
 * @async
 * @param {{targetUserId: string, update: object, revokeSessions: boolean, now: Date}} input - Mutação administrativa.
 * @returns {Promise<object|null>} Conta atualizada ou null.
 */
async function updateAccountState({
    targetUserId,
    update,
    revokeSessions,
    now,
}) {
    const applyUpdate = async (session = null) => {
        const options = {
            new: true,
            runValidators: true,
            ...(session ? { session } : {}),
        };
        const user =
            typeof User.findOneAndUpdate === "function"
                ? await User.findOneAndUpdate(
                      {
                          _id: targetUserId,
                          accountStatus: { $ne: ACCOUNT_STATUSES.DELETED },
                      },
                      update,
                      options,
                  )
                : await User.findByIdAndUpdate(targetUserId, update, options);

        if (user && revokeSessions && session) {
            await AuthSession.updateMany(
                { userId: targetUserId, revokedAt: null },
                { $set: { revokedAt: now, csrfHash: null } },
                { session },
            );
        }

        return user;
    };

    if (mongoose.connection.readyState !== 1) {
        return applyUpdate();
    }

    const session = await mongoose.startSession();
    try {
        let user = null;
        await session.withTransaction(async () => {
            user = await applyUpdate(session);
        });
        return user;
    } finally {
        await session.endSession();
    }
}

/**
 * Converte um utilizador em resposta segura para admin.
 *
 * @function toSafeUser
 * @param {object} user - Documento Mongoose ou mock equivalente.
 * @returns {object} Utilizador sem passwordHash nem dados biometricos.
 */
function toSafeUser(user) {
    return {
        id: user._id.toString(),
        email: user.email,
        role: user.role,
        isActive: user.isActive,
        accountStatus: user.accountStatus ?? ACCOUNT_STATUSES.ACTIVE,
        suspendedAt: user.suspendedAt ?? null,
        deletedAt: user.deletedAt ?? null,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
    };
}

/**
 * Lista utilizadores para administracao, sempre com DTO minimizado.
 *
 * @async
 * @function listAdminUsers
 * @returns {Promise<object[]>} Utilizadores seguros para painel admin.
 */
export async function listAdminUsers() {
    const users = await User.find({})
        .select("email role isActive accountStatus suspendedAt deletedAt createdAt updatedAt")
        .sort({ createdAt: -1 })
        .limit(100);

    return users.map(toSafeUser);
}

/**
 * Atualiza a role de outro utilizador.
 *
 * @async
 * @function updateUserRole
 * @param {{targetUserId: string, role: string, actorUserId: string}} params - Dados da operacao admin.
 * @returns {Promise<object>} Utilizador atualizado.
 * @throws {AppError} Quando a role e invalida, o admin tenta alterar-se a si proprio ou o alvo nao existe.
 */
export async function updateUserRole({ targetUserId, role, actorUserId }) {
    if (!ROLE_VALUES.includes(role)) {
        throw new AppError(400, "Role invalida");
    }

    if (!mongoose.isValidObjectId(targetUserId)) {
        throw new AppError(400, "ID de utilizador invalido");
    }

    if (targetUserId === actorUserId) {
        throw new AppError(
            400,
            "Um administrador não deve alterar a própria role neste fluxo",
        );
    }

    const user = await User.findOneAndUpdate(
        {
            _id: targetUserId,
            accountStatus: { $ne: ACCOUNT_STATUSES.DELETED },
        },
        { role },
        { new: true, runValidators: true },
    );

    if (!user) {
        const terminalAccount = await User.exists({
            _id: targetUserId,
            accountStatus: ACCOUNT_STATUSES.DELETED,
        });
        if (terminalAccount) {
            throw new AppError(
                409,
                "Uma conta eliminada terminalmente não pode mudar de role",
            );
        }
        throw new AppError(404, "Utilizador não encontrado");
    }

    return toSafeUser(user);
}

/**
 * Suspende ou reativa uma conta sem alterar a role.
 *
 * @async
 * @function setUserAccountStatus
 * @param {{targetUserId: string, status: string, actorUserId: string}} params - Acao admin.
 * @returns {Promise<object>} Utilizador atualizado.
 * @throws {AppError} Quando a acao e invalida.
 */
export async function setUserAccountStatus({ targetUserId, status, actorUserId }) {
    if (!mongoose.isValidObjectId(targetUserId)) {
        throw new AppError(400, "ID de utilizador invalido");
    }

    if (targetUserId === actorUserId) {
        throw new AppError(
            400,
            "Um administrador não deve alterar a própria conta neste fluxo",
        );
    }

    if (![ACCOUNT_STATUSES.ACTIVE, ACCOUNT_STATUSES.SUSPENDED].includes(status)) {
        throw new AppError(400, "Estado de conta invalido");
    }

    const update =
        status === ACCOUNT_STATUSES.ACTIVE
            ? { accountStatus: status, isActive: true, suspendedAt: null }
            : { accountStatus: status, isActive: false, suspendedAt: new Date() };

    const user = await updateAccountState({
        targetUserId,
        update,
        revokeSessions: status === ACCOUNT_STATUSES.SUSPENDED,
        now: update.suspendedAt ?? new Date(),
    });

    if (!user) {
        if (typeof User.exists === "function") {
            const deletedAccount = await User.exists({
                _id: targetUserId,
                accountStatus: ACCOUNT_STATUSES.DELETED,
            });

            if (deletedAccount) {
                throw new AppError(409, "Uma conta eliminada não pode ser reativada");
            }
        }

        throw new AppError(404, "Utilizador não encontrado");
    }

    return toSafeUser(user);
}

/**
 * Aplica desativação administrativa reversível no âmbito de RF33.
 *
 * Este endpoint legado usa HTTP DELETE, mas não executa a eliminação terminal:
 * preserva email/password/dados, suspende a conta e revoga todas as sessões.
 * Apenas `DELETE /api/me/account` pode gravar `accountStatus=deleted`.
 *
 * @async
 * @function softDeleteUserAccount
 * @param {{targetUserId: string, actorUserId: string}} params - Acao admin.
 * @returns {Promise<object>} Utilizador desativado de forma reversível.
 * @throws {AppError} Quando o alvo e invalido, inexistente ou igual ao admin atual.
 */
export async function softDeleteUserAccount({ targetUserId, actorUserId }) {
    if (!mongoose.isValidObjectId(targetUserId)) {
        throw new AppError(400, "ID de utilizador invalido");
    }

    if (targetUserId === actorUserId) {
        throw new AppError(
            400,
            "Um administrador não deve desativar a própria conta neste fluxo",
        );
    }

    const now = new Date();
    const user = await updateAccountState({
        targetUserId,
        update: {
            accountStatus: ACCOUNT_STATUSES.SUSPENDED,
            isActive: false,
            suspendedAt: now,
            deletedAt: null,
        },
        revokeSessions: true,
        now,
    });

    if (!user) {
        if (typeof User.exists === "function") {
            const terminalAccount = await User.exists({
                _id: targetUserId,
                accountStatus: ACCOUNT_STATUSES.DELETED,
            });
            if (terminalAccount) {
                throw new AppError(
                    409,
                    "Uma conta eliminada terminalmente não pode ser desativada",
                );
            }
        }
        throw new AppError(404, "Utilizador não encontrado");
    }

    return toSafeUser(user);
}
