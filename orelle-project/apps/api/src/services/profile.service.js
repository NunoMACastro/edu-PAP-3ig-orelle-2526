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

function toPublicProductResponse(product) {
    return {
        id: product._id.toString(),
        name: product.name,
        brandName: product.brandName,
        description: product.description,
        ingredientNames: product.ingredientNames,
        skinTypes: product.skinTypes,
        imageUrl: product.imageUrl,
        priceCents: product.priceCents,
        stock: product.stock,
        categoryIds: product.categoryIds.map((id) => id.toString()),
    };
}

function escapeRegexText(value) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export async function listCatalogProducts(filters) {
    const query = {};

    if (filters.search) {
        query.$text = { $search: filters.search };
    }

    if (filters.brandName) {
        const escapedBrandName = escapeRegexText(filters.brandName);
        query.brandName = new RegExp(escapedBrandName, "i");
    }

    if (filters.skinType) {
        query.skinTypes = filters.skinType;
    }

    if (filters.categoryId) {
        query.categoryIds = filters.categoryId;
    }

    if (
        filters.minPriceCents !== undefined ||
        filters.maxPriceCents !== undefined
    ) {
        query.priceCents = {};
        if (filters.minPriceCents !== undefined) {
            query.priceCents.$gte = filters.minPriceCents;
        }
        if (filters.maxPriceCents !== undefined) {
            query.priceCents.$lte = filters.maxPriceCents;
        }
    }

    const products = await Product.find(query)
        .sort({ createdAt: -1 })
        .limit(40);

    return products.map(toPublicProductResponse);
}