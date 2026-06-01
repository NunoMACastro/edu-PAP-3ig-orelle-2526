/**
 * Servico de perfil do utilizador.
 *
 * Este modulo implementa o ownership correto do perfil: todos os acessos usam
 * `req.user.id`, recebido da sessao, e nunca um `userId` enviado pelo cliente.
 */
import { Profile } from "../models/profile.model.js";
import { AppError } from "../middlewares/error.middleware.js";

/**
 * Converte um perfil Mongoose numa resposta JSON estavel.
 *
 * @function toProfileResponse
 * @param {object} profile - Documento Mongoose ou mock equivalente.
 * @returns {{id: string, userId: string, nome: string, idade: number, tipoDePele: string, genero: string, objetivos: string[], profilePhotoUrl: string, profilePhotoMode: string, profilePhotoUpdatedAt: Date|null, createdAt: Date|undefined, updatedAt: Date|undefined}} Perfil seguro para o cliente.
 */
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

/**
 * Cria o perfil do utilizador autenticado.
 *
 * @async
 * @function createMyProfile
 * @param {string} userId - ID vindo da sessao autenticada.
 * @param {Record<string, unknown>} input - Dados ja validados.
 * @returns {Promise<object>} Perfil criado.
 * @throws {AppError} Quando o utilizador ja tem perfil.
 */
export async function createMyProfile(userId, input) {
    const existing = await Profile.findOne({ userId }).select("_id");

    if (existing) {
        throw new AppError(409, "Este utilizador já tem perfil");
    }

    const profile = await Profile.create({ userId, ...input });
    return toProfileResponse(profile);
}

/**
 * Consulta o perfil do utilizador autenticado.
 *
 * @async
 * @function getMyProfile
 * @param {string} userId - ID vindo da sessao autenticada.
 * @returns {Promise<object>} Perfil do proprio utilizador.
 * @throws {AppError} Quando ainda nao existe perfil.
 */
export async function getMyProfile(userId) {
    const profile = await Profile.findOne({ userId });

    if (!profile) {
        throw new AppError(404, "Perfil ainda não criado");
    }

    return toProfileResponse(profile);
}

/**
 * Atualiza campos editaveis do perfil do utilizador autenticado.
 *
 * @async
 * @function updateMyProfile
 * @param {string} userId - ID vindo da sessao autenticada.
 * @param {Record<string, unknown>} input - Campos permitidos pelo validator.
 * @returns {Promise<object>} Perfil atualizado.
 * @throws {AppError} Quando ainda nao existe perfil.
 */
export async function updateMyProfile(userId, input) {
    const profile = await Profile.findOneAndUpdate(
        { userId },
        { $set: input },
        { new: true, runValidators: true },
    );

    if (!profile) {
        throw new AppError(404, "Perfil ainda não criado");
    }

    return toProfileResponse(profile);
}

/**
 * Atualiza o URL controlado da fotografia de perfil.
 *
 * @async
 * @function updateMyProfilePhoto
 * @param {string} userId - ID vindo da sessao autenticada.
 * @param {{profilePhotoUrl: string, profilePhotoMode: "stub_url"}} input - Dados validados.
 * @returns {Promise<object>} Perfil atualizado com data da fotografia.
 * @throws {AppError} Quando ainda nao existe perfil.
 */
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
        throw new AppError(404, "Perfil ainda não criado");
    }

    return toProfileResponse(profile);
}
