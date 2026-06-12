/**
 * Service de simulacao de maquilhagem da MF2.
 */
import { AppError } from "../middlewares/error.middleware.js";
import { FacePhoto } from "../models/face-photo.model.js";
import { MakeupSimulation } from "../models/makeup-simulation.model.js";
import { Product } from "../models/product.model.js";
import { createMakeupPreview } from "../providers/makeup-simulation.provider.js";

const PRODUCT_SELECT = "name brandName imageUrl priceCents stock skinTypes";

function toSimulationDto(simulation) {
    return {
        id: simulation._id.toString(),
        product: {
            id: simulation.productId._id.toString(),
            name: simulation.productId.name,
            brandName: simulation.productId.brandName,
            imageUrl: simulation.productId.imageUrl,
            priceCents: simulation.productId.priceCents,
            stock: simulation.productId.stock,
        },
        providerName: simulation.providerName,
        preview: simulation.preview,
        createdAt: simulation.createdAt,
    };
}

/**
 * Cria simulacao de maquilhagem para o utilizador autenticado.
 *
 * @async
 * @function createMakeupSimulationForUser
 * @param {string} userId - Utilizador autenticado.
 * @param {{productId: string}} input - Produto validado.
 * @param {object} consent - Consentimento ativo da rota.
 * @returns {Promise<object>} Simulacao publica.
 */
export async function createMakeupSimulationForUser(userId, input, consent) {
    if (!consent?._id) {
        throw new AppError(403, "Consentimento facial em falta");
    }

    const [facePhoto, product] = await Promise.all([
        FacePhoto.findOne({ userId, kind: "frontal", status: "active" }).sort({
            createdAt: -1,
        }),
        Product.findOne({ _id: input.productId, stock: { $gt: 0 } }).select(PRODUCT_SELECT),
    ]);

    if (!facePhoto) {
        throw new AppError(400, "Fotografia frontal ativa obrigatória");
    }

    if (!product) {
        throw new AppError(404, "Produto não encontrado ou sem stock");
    }

    const preview = createMakeupPreview({ facePhoto, product });
    const simulation = await MakeupSimulation.create({
        userId,
        facePhotoId: facePhoto._id,
        consentId: consent._id,
        productId: product._id,
        providerName: preview.providerName,
        preview: {
            beforePanel: preview.beforePanel,
            afterPanel: preview.afterPanel,
            overlay: preview.overlay,
            visual: preview.visual,
            limitations: preview.limitations,
        },
    });

    simulation.productId = product;

    return toSimulationDto(simulation);
}
