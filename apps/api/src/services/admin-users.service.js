/**
 * Servico administrativo de utilizadores (MF0 + MF4).
 *
 * Reúne a gestão de permissões (roles) herdada da MF0 com as novas
 * capacidades de auditoria, suspensão e eliminação lógica exigidas no MF4.
 */
import mongoose from "mongoose";
import { ROLE_VALUES } from "../constants/roles.js";
import { AppError } from "../middlewares/error.middleware.js";
import { ACCOUNT_STATUSES, User } from "../models/user.model.js";

/**
 * Converte utilizador para DTO administrativo seguro com todos os detalhes de estado.
 * Substitui o antigo 'toSafeUser' para garantir retrocompatibilidade e suporte ao MF4.
 *
 * @function toAdminUserDto
 * @param {object} user - Documento Mongoose.
 * @returns {object} Utilizador sem campos sensíveis.
 */
function toAdminUserDto(user) {
    return {
        id: user._id.toString(),
        email: user.email,
        role: user.role,
        isActive: user.isActive,
        accountStatus: user.accountStatus,
        suspendedAt: user.suspendedAt,
        deletedAt: user.deletedAt,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
    };
}

/**
 * Lista utilizadores para administração, sem devolver segredos.
 *
 * @async
 * @function listAdminUsers
 * @returns {Promise<object[]>} Utilizadores seguros.
 */
export async function listAdminUsers() {
    const users = await User.find({})
        .select("email role isActive accountStatus suspendedAt deletedAt createdAt updatedAt")
        .sort({ createdAt: -1 })
        .limit(100);

    return users.map(toAdminUserDto);
}

/**
 * Altera o estado de conta de outro utilizador (Ativar ou Suspender).
 *
 * @async
 * @function setUserAccountStatus
 * @param {{targetUserId: string, status: "active"|"suspended", actorUserId: string}} params - Dados da ação.
 * @returns {Promise<object>} Utilizador atualizado.
 * @throws {AppError} Quando a ação é inválida.
 */
export async function setUserAccountStatus({ targetUserId, status, actorUserId }) {
    if (!mongoose.isValidObjectId(targetUserId)) {
        throw new AppError(400, "ID de utilizador invalido");
    }

    if (targetUserId === actorUserId) {
        throw new AppError(400, "Um administrador não deve alterar a própria conta neste fluxo");
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

    return toAdminUserDto(user);
}

/**
 * Executa eliminação lógica da conta no âmbito de RF33.
 * Transforma o email para libertar o formato original e desativa o acesso.
 *
 * @async
 * @function softDeleteUserAccount
 * @param {{targetUserId: string, actorUserId: string}} params - Ação administrativa.
 * @returns {Promise<object>} Utilizador eliminado logicamente.
 */
export async function softDeleteUserAccount({ targetUserId, actorUserId }) {
    if (!mongoose.isValidObjectId(targetUserId)) {
        throw new AppError(400, "ID de utilizador invalido");
    }

    if (targetUserId === actorUserId) {
        throw new AppError(400, "Um administrador não deve eliminar a própria conta neste fluxo");
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

    return toAdminUserDto(user);
}

/**
 * Atualiza a role de outro utilizador (Herdado da MF0 e atualizado para MF4).
 *
 * @async
 * @function updateUserRole
 * @param {{targetUserId: string, role: string, actorUserId: string}} params - Dados da operacao admin.
 * @returns {Promise<object>} Utilizador atualizado com formato DTO completo.
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

    // Atualizado de 'toSafeUser' para 'toAdminUserDto' para manter o padrão do MF4
    return toAdminUserDto(user);
}