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
        profilePhotoUrl: profile.profilePhotoUrl ?? "",
        profilePhotoMode: profile.profilePhotoMode ?? "stub_url",
        profilePhotoUpdatedAt: profile.profilePhotoUpdatedAt ?? null,
        createdAt: profile.createdAt,
        updatedAt: profile.updatedAt,
    };
}

export async function createMyProfile(userId, input) {
    const existing = await Profile.findOne({ userId }).select("_id");

    if (existing) {
        throw new AppError(409, "Este utilizador ja tem perfil");
    }

    const profile = await Profile.create({ userId, ...input });
    return toProfileResponse(profile);
}

export async function getMyProfile(userId) {
    const profile = await Profile.findOne({ userId });

    if (!profile) {
        throw new AppError(404, "Perfil ainda nao criado");
    }

    return toProfileResponse(profile);
}

export async function updateMyProfile(userId, input) {
    const profile = await Profile.findOneAndUpdate(
        { userId },
        { $set: input },
        { new: true, runValidators: true },
    );

    if (!profile) {
        throw new AppError(404, "Perfil ainda nao criado");
    }

    return toProfileResponse(profile);
}

export async function updateMyProfilePhoto(userId, input) {
    const profile = await Profile.findOneAndUpdate(
        { userId },
        {
            $set: {
                profilePhotoUrl: input.profilePhotoUrl,
                profilePhotoMode: input.profilePhotoMode,
                profilePhotoUpdatedAt: new Date(),
            },
        },
        { new: true, runValidators: true },
    );

    if (!profile) {
        throw new AppError(404, "Perfil ainda nao criado");
    }

    return toProfileResponse(profile);
}