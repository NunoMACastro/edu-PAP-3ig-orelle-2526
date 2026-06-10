import { AppError } from "../middlewares/error.middleware.js";

function colorFromProduct(product) {
    const seed = String(product._id).slice(-6);
    return `#${seed.padStart(6, "8")}`;
}

export function createMakeupPreview({ facePhoto, product }) {
    if (!facePhoto?._id) {
        throw new AppError(400, "Fotografia frontal ativa obrigatória");
    }

    if (!product?._id) {
        throw new AppError(404, "Produto obrigatório para simulação");
    }

    return {
        mode: "local_overlay",
        beforePanel: {
            label: "Antes",
            description: "Fotografia frontal privada confirmada pelo backend.",
        },
        afterPanel: {
            label: "Depois",
            description: `Aplicação visual estimada com ${product.name}.`,
            accentColor: colorFromProduct(product),
        },
        overlayDescription:
            "Preview de maquilhagem para apoio à escolha do produto, sem publicar a fotografia facial.",
        limitations: [
            "Preview baseline sem garantia de realismo fotográfico.",
            "Não é avaliação médica nem promessa de resultado.",
            "A fotografia usada permanece privada no servidor.",
        ],
    };
}