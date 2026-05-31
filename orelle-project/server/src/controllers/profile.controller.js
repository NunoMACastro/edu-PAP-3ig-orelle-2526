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

export async function getMyProfileController(req, res, next) {
    try {
        // Vai buscar o perfil usando o ID do utilizador autenticado
        const profile = await getMyProfile(req.user.id);

        // Se o utilizador ainda não tiver perfil criado, devolve um erro 404
        if (!profile) {
            return res.status(404).json({ 
                error: { message: "Perfil nao encontrado" } 
            });
        }

        return res.status(200).json({ profile });
    } catch (err) {
        return next(err);
    }
}
export async function updateMyProfileController(req, res, next) {
    try {
        const input = validateUpdateProfileInput(req.body);
        const profile = await updateMyProfile(req.user.id, input);

        return res.status(200).json({ profile });
    } catch (err) {
        return next(err);
    }
}

export async function updateMyProfilePhotoController(req, res, next) {
    try {
        const input = validateProfilePhotoInput(req.body);
        const profile = await updateMyProfilePhoto(req.user.id, input);

        return res.status(200).json({ profile });
    } catch (err) {
        return next(err);
    }
}

export async function createMyProfileController(req, res, next) {
    try {
        // Valida os dados que vêm do corpo do pedido (req.body)
        const input = validateCreateProfileInput(req.body);
        
        // Cria o perfil associando-o ao ID do utilizador autenticado
        const profile = await createMyProfile(req.user.id, input);

        return res.status(201).json({ profile });
    } catch (err) {
        return next(err);
    }
}