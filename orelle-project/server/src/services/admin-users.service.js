import { ROLE_VALUES } from "../constants/roles.js";
import { AppError } from "../middlewares/error.middleware.js";
import { User } from "../models/user.model.js";

function toSafeUser(user) {
    return {
        id: user._id.toString(),
        email: user.email,
        role: user.role,
        updatedAt: user.updatedAt,
    };
}

export async function updateUserRole({ targetUserId, role, actorUserId }) {
    if (!ROLE_VALUES.includes(role)) {
        throw new AppError(400, "Role invalida");
    }

    if (targetUserId === actorUserId) {
        throw new AppError(
            400,
            "Um administrador nao deve alterar a propria role neste fluxo",
        );
    }

    const user = await User.findByIdAndUpdate(
        targetUserId,
        { role },
        { new: true, runValidators: true },
    );

    if (!user) {
        throw new AppError(404, "Utilizador nao encontrado");
    }

    return toSafeUser(user);
}