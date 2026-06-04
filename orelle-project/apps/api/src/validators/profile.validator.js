import { AppError } from "../middlewares/error.middleware.js";
import { GENDERS, SKIN_TYPES } from "../models/profile.model.js";

function normalizeText(value) {
    return String(value ?? "").trim();
}

function normalizeList(value) {
    if (!Array.isArray(value)) return [];

    return [
        ...new Set(
            value
                .map((item) => normalizeText(item).toLowerCase())
                .filter(Boolean),
        ),
    ];
}

export function validateCreateProfileInput(body) {
    const input = {
        nome: normalizeText(body.nome),
        idade: Number(body.idade),
        tipoDePele: normalizeText(body.tipoDePele).toLowerCase(),
        genero: normalizeText(body.genero).toLowerCase(),
        objetivos: normalizeList(body.objetivos),
    };

    const errors = {};

    if (input.nome.length < 2 || input.nome.length > 80) {
        errors.nome = "Nome deve ter entre 2 e 80 caracteres";
    }

    if (
        !Number.isInteger(input.idade) ||
        input.idade < 13 ||
        input.idade > 120
    ) {
        errors.idade = "Idade deve ser um numero inteiro entre 13 e 120";
    }

    if (!SKIN_TYPES.includes(input.tipoDePele)) {
        errors.tipoDePele = `Tipo de pele deve ser um destes: ${SKIN_TYPES.join(", ")}`;
    }

    if (!GENDERS.includes(input.genero)) {
        errors.genero = `Genero deve ser um destes: ${GENDERS.join(", ")}`;
    }

    if (input.objetivos.length === 0 || input.objetivos.length > 5) {
        errors.objetivos = "Indica entre 1 e 5 objetivos";
    }

    if (Object.keys(errors).length > 0) {
        throw new AppError(400, "Dados de perfil invalidos", errors);
    }

    return input;
}

export function validateUpdateProfileInput(body) {
    const forbiddenKeys = ["userId", "role", "_id", "createdAt", "updatedAt"];
    const payload = {};
    const errors = {};

    for (const key of forbiddenKeys) {
        if (key in body) {
            errors[key] = "Este campo nao pode ser alterado pelo cliente";
        }
    }

    if ("nome" in body) {
        const nome = normalizeText(body.nome);
        if (nome.length < 2 || nome.length > 80) {
            errors.nome = "Nome deve ter entre 2 e 80 caracteres";
        } else {
            payload.nome = nome;
        }
    }

    if ("idade" in body) {
        const idade = Number(body.idade);
        if (!Number.isInteger(idade) || idade < 13 || idade > 120) {
            errors.idade = "Idade deve ser um numero inteiro entre 13 e 120";
        } else {
            payload.idade = idade;
        }
    }

    if ("tipoDePele" in body) {
        const tipoDePele = normalizeText(body.tipoDePele).toLowerCase();
        if (!SKIN_TYPES.includes(tipoDePele)) {
            errors.tipoDePele = `Tipo de pele deve ser um destes: ${SKIN_TYPES.join(", ")}`;
        } else {
            payload.tipoDePele = tipoDePele;
        }
    }

    if ("genero" in body) {
        const genero = normalizeText(body.genero).toLowerCase();
        if (!GENDERS.includes(genero)) {
            errors.genero = `Genero deve ser um destes: ${GENDERS.join(", ")}`;
        } else {
            payload.genero = genero;
        }
    }

    if ("objetivos" in body) {
        const objetivos = normalizeList(body.objetivos);
        if (objetivos.length === 0 || objetivos.length > 5) {
            errors.objetivos = "Indica entre 1 e 5 objetivos";
        } else {
            payload.objetivos = objetivos;
        }
    }

    if (Object.keys(payload).length === 0) {
        errors.base = "Nada para atualizar";
    }

    if (Object.keys(errors).length > 0) {
        throw new AppError(400, "Dados de perfil invalidos", errors);
    }

    return payload;
}