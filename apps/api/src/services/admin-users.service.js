/**
 * Servico administrativo de utilizadores.
 *
 * Implementa a alteracao de role do BK-MF0-05, protegida pelas rotas admin e
 * limitada aos valores canonicos definidos em `roles.js`.
 */
import mongoose from "mongoose";
import { ROLE_VALUES } from "../constants/roles.js";
import { AppError } from "../middlewares/error.middleware.js";
import { User } from "../models/user.model.js";

const ACCOUNT_STATUSES = Object.freeze({
    ACTIVE: "active",
    SUSPENDED: "suspended",
    DELETED: "deleted",
});

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

    const user = await User.findByIdAndUpdate(
        targetUserId,
        { role },
        { new: true, runValidators: true },
    );

    if (!user) {
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

    const user = await User.findByIdAndUpdate(targetUserId, update, {
        new: true,
        runValidators: true,
    });

    if (!user) {
        throw new AppError(404, "Utilizador não encontrado");
    }

    return toSafeUser(user);
}

/**
 * Aplica eliminacao logica no ambito de RF33.
 *
 * @async
 * @function softDeleteUserAccount
 * @param {{targetUserId: string, actorUserId: string}} params - Acao admin.
 * @returns {Promise<object>} Utilizador eliminado logicamente.
 */
export async function softDeleteUserAccount({ targetUserId, actorUserId }) {
    if (!mongoose.isValidObjectId(targetUserId)) {
        throw new AppError(400, "ID de utilizador invalido");
    }

    if (targetUserId === actorUserId) {
        throw new AppError(
            400,
            "Um administrador não deve eliminar a própria conta neste fluxo",
        );
    }

    const deletedAt = new Date();
    const user = await User.findByIdAndUpdate(
        targetUserId,
        {
            accountStatus: ACCOUNT_STATUSES.DELETED,
            isActive: false,
            suspendedAt: deletedAt,
            deletedAt,
            email: `deleted-${targetUserId}@orelle.local`,
        },
        { new: true, runValidators: true },
    );

    if (!user) {
        throw new AppError(404, "Utilizador não encontrado");
    }

    return toSafeUser(user);
}
