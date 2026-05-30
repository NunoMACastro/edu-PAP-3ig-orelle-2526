import bcrypt from "bcryptjs";
import { User } from "../models/user.model.js";
import { AppError } from "../middlewares/error.middleware.js";

function toSafeUser(user) {
    return {
        id: user._id.toString(),
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
    };
}

export async function registerUser({ email, password }) {
    const existing = await User.findOne({ email }).select("_id");

    if (existing) {
        throw new AppError(409, "Ja existe uma conta com este email");
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await User.create({ email, passwordHash, role: "cliente" });

    return toSafeUser(user);
}

export async function loginUser({ email, password }) {
    const user = await User.findOne({ email }).select(
        "+passwordHash email role createdAt",
    );

    if (!user) {
        throw new AppError(401, "Credenciais invalidas");
    }

    const passwordMatches = await bcrypt.compare(password, user.passwordHash);

    if (!passwordMatches) {
        throw new AppError(401, "Credenciais invalidas");
    }

    return toSafeUser(user);
}