/**
 * Controllers de perfil.
 *
 * Implementam os endpoints `/api/profile/me` da MF0. Todos dependem de
 * `requireAuth`, por isso usam sempre `req.user.id`.
 */
import {
    createMyProfile,
    getMyProfile,
    updateMyProfile,
    updateMyProfilePhoto,
} from "../services/profile.service.js";
import {
    validateCreateProfileInput,
    validateUpdateProfileInput,
} from "../validators/profile.validator.js";
import { validateProfilePhotoInput } from "../validators/profile-photo.validator.js";

/**
 * Cria o perfil do utilizador autenticado.
 *
 * @async
 * @function createMyProfileController
 * @param {import("express").Request & {user: {id: string}}} req - Pedido autenticado.
 * @param {import("express").Response} res - Resposta Express.
 * @param {import("express").NextFunction} next - Proximo middleware.
 * @returns {Promise<import("express").Response|void>} Resposta 201 com perfil.
 */
export async function createMyProfileController(req, res, next) {
    try {
        const input = validateCreateProfileInput(req.body);
        const profile = await createMyProfile(req.user.id, input);

        return res.status(201).json({ profile });
    } catch (err) {
        return next(err);
    }
}

/**
 * Consulta o perfil do utilizador autenticado.
 *
 * @async
 * @function getMyProfileController
 * @param {import("express").Request & {user: {id: string}}} req - Pedido autenticado.
 * @param {import("express").Response} res - Resposta Express.
 * @param {import("express").NextFunction} next - Proximo middleware.
 * @returns {Promise<import("express").Response|void>} Resposta 200 com perfil.
 */
export async function getMyProfileController(req, res, next) {
    try {
        const profile = await getMyProfile(req.user.id);

        return res.status(200).json({ profile });
    } catch (err) {
        return next(err);
    }
}

/**
 * Atualiza campos editaveis do perfil.
 *
 * @async
 * @function updateMyProfileController
 * @param {import("express").Request & {user: {id: string}}} req - Pedido autenticado.
 * @param {import("express").Response} res - Resposta Express.
 * @param {import("express").NextFunction} next - Proximo middleware.
 * @returns {Promise<import("express").Response|void>} Resposta 200 com perfil atualizado.
 */
export async function updateMyProfileController(req, res, next) {
    try {
        const input = validateUpdateProfileInput(req.body);
        const profile = await updateMyProfile(req.user.id, input);

        return res.status(200).json({ profile });
    } catch (err) {
        return next(err);
    }
}

/**
 * Atualiza a fotografia stub do perfil.
 *
 * @async
 * @function updateMyProfilePhotoController
 * @param {import("express").Request & {user: {id: string}}} req - Pedido autenticado.
 * @param {import("express").Response} res - Resposta Express.
 * @param {import("express").NextFunction} next - Proximo middleware.
 * @returns {Promise<import("express").Response|void>} Resposta 200 com fotografia atualizada.
 */
export async function updateMyProfilePhotoController(req, res, next) {
    try {
        const input = validateProfilePhotoInput(req.body);
        const profile = await updateMyProfilePhoto(req.user.id, input);

        return res.status(200).json({ profile });
    } catch (err) {
        return next(err);
    }
}
