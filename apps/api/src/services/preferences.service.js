/**
 * Servico de preferencias do utilizador.
 *
 * O BK-MF0-06 guarda e consulta preferencias sempre por `userId` autenticado,
 * garantindo que um utilizador nao consegue escrever no documento de outro.
 */
import { AppError } from "../middlewares/error.middleware.js";
import { Preference } from "../models/preference.model.js";
import { Product } from "../models/product.model.js";

/**
 * Converte preferencias para resposta JSON.
 *
 * @function toPreferenceResponse
 * @param {object} preference - Documento Mongoose ou mock equivalente.
 * @returns {{id: string, userId: string, favoriteBrandNames: string[], favoriteProductIds: string[], updatedAt: Date|undefined}} Preferencias seguras.
 */
function toPreferenceResponse(preference) {
    return {
        id: preference._id.toString(),
        userId: preference.userId.toString(),
        favoriteBrandNames: preference.favoriteBrandNames,
        favoriteProductIds: preference.favoriteProductIds.map((id) =>
            id.toString(),
        ),
        updatedAt: preference.updatedAt,
    };
}

/**
 * Consulta preferencias, criando o documento vazio se ainda nao existir.
 *
 * @async
 * @function getMyPreferences
 * @param {string} userId - ID vindo da sessao autenticada.
 * @returns {Promise<object>} Preferencias existentes ou inicializadas.
 */
export async function getMyPreferences(userId) {
    const preference = await Preference.findOneAndUpdate(
        { userId },
        {
            $setOnInsert: {
                userId,
                favoriteBrandNames: [],
                favoriteProductIds: [],
            },
        },
        { upsert: true, new: true },
    );

    return toPreferenceResponse(preference);
}

/**
 * Atualiza preferencias do utilizador autenticado.
 *
 * @async
 * @function updateMyPreferences
 * @param {string} userId - ID vindo da sessao autenticada.
 * @param {{favoriteBrandNames: string[], favoriteProductIds: string[]}} input - Preferencias validadas.
 * @returns {Promise<object>} Preferencias atualizadas.
 * @throws {AppError} Quando algum produto favorito nao existe.
 */
export async function updateMyPreferences(userId, input) {
    if (input.favoriteProductIds.length > 0) {
        const found = await Product.countDocuments({
            _id: { $in: input.favoriteProductIds },
        });

        if (found !== input.favoriteProductIds.length) {
            throw new AppError(
                400,
                "Um ou mais produtos favoritos não existem",
            );
        }
    }

    const preference = await Preference.findOneAndUpdate(
        { userId },
        { $set: input },
        { upsert: true, new: true, runValidators: true },
    );

    return toPreferenceResponse(preference);
}
