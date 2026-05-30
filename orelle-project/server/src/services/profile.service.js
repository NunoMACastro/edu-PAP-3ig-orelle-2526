import { Profile } from "../models/profile.model.js";
import { AppError } from "../middlewares/error.middleware.js";

function toProfileResponse(profile) {
    return {
        id: profile._id.toString(),
        userId: profile.userId.toString(),
        nome: profile.nome,
        idade: profile.idade,
        tipoDePele: profile.tipoDePele,
        genero: profile.genero,
        objetivos: profile.objetivos,
        createdAt: profile.createdAt,
        updatedAt: profile.updatedAt,
    };
}

export async function createMyProfile(userId, input) {
    const existing = await Profile.findOne({ userId }).select("_id");

    if (existing) {
        throw new AppError(409, "Este utilizador ja tem perfil");
    }

    const profile = await Profile.create({
        userId,
        ...input,
    });

    return toProfileResponse(profile);
}

export async function getMyProfile(userId) {
    const profile = await Profile.findOne({ userId });

    if (!profile) {
        throw new AppError(404, "Perfil ainda nao criado");
    }

    return toProfileResponse(profile);
}