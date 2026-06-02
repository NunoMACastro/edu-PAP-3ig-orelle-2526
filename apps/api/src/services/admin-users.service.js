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

/**
 * Converte um utilizador em resposta segura para admin.
 *
 * @function toSafeUser
 * @param {object} user - Documento Mongoose ou mock equivalente.
 * @returns {{id: string, email: string, role: string, updatedAt: Date|undefined}} Utilizador sem passwordHash.
 */
function toSafeUser(user) {
    return {
        id: user._id.toString(),
        email: user.email,
        role: user.role,
        updatedAt: user.updatedAt,
    };
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
