import { AppError } from "../middlewares/error.middleware.js";
import { FacePhoto } from "../models/face-photo.model.js";
import { Product } from "../models/product.model.js";
import { MakeupSimulation } from "../models/makeup-simulation.model.js";
import { createMakeupPreview } from "../providers/makeup-simulation.provider.js";

function toProductDto(product) {
    return {
        id: product._id.toString(),
        name: product.name,
        brandName: product.brandName,
        imageUrl: product.imageUrl,
        priceCents: product.priceCents,
    };
}

function toMakeupSimulationDto(simulation, product) {
    return {
        id: simulation._id.toString(),
        product: toProductDto(product),
        preview: simulation.preview,
        createdAt: simulation.createdAt,
    };
}

export async function createMakeupSimulationForUser({ userId, consent, productId }) {
    if (!consent?._id) {
        throw new AppError(403, "Consentimento facial em falta");
    }

    const [facePhoto, product] = await Promise.all([
        FacePhoto.findOne({ userId, kind: "frontal", status: "active" })
            .sort({ createdAt: -1 })
            .select("+storageKey"),
        Product.findById(productId).select("name brandName imageUrl priceCents stock"),
    ]);

    if (!facePhoto) {
        throw new AppError(400, "Fotografia frontal ativa obrigatória");
    }

    if (!product || product.stock <= 0) {
        throw new AppError(404, "Produto indisponível");
    }

    const preview = createMakeupPreview({ facePhoto, product });
    const simulation = await MakeupSimulation.create({
        userId,
        consentId: consent._id,
        facePhotoId: facePhoto._id,
        productId: product._id,
        preview,
    });

    return { simulation: toMakeupSimulationDto(simulation, product) };
}