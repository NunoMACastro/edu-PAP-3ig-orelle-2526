import { registerUser } from "../services/auth.service.js";
import { validateRegisterInput } from "../validators/auth.validator.js";


export async function registerController(req, res, next) {
    try {
        const input = validateRegisterInput(req.body);
        const user = await registerUser(input);

        return res.status(201).json({ user });
    } catch (err) {
        return next(err);
    }
}