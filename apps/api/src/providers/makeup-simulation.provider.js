/**
 * Provider local controlado para simulacao de maquilhagem baseline.
 */
import { AppError } from "../middlewares/error.middleware.js";

function colorFromProduct(product) {
    const seed = String(product._id).slice(-6);
    return `#${seed.padStart(6, "8")}`;
}

function escapeSvgText(value) {
    return String(value ?? "").replace(/[&<>"']/g, (char) => {
        const entities = {
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&apos;",
        };

        return entities[char];
    });
}

function normalizeAccentColor(color) {
    return /^#[0-9a-f]{6}$/i.test(color) ? color : "#64748b";
}

export function createSafeSvgPreviewImage({
    title,
    subtitle,
    accentColor,
    variant = "before",
}) {
    const safeTitle = escapeSvgText(title);
    const safeSubtitle = escapeSvgText(subtitle);
    const safeAccent = normalizeAccentColor(accentColor);
    const baseColor = variant === "after" ? safeAccent : "#94a3b8";
    const overlayOpacity = variant === "after" ? "0.30" : "0.12";
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="420" viewBox="0 0 640 420" role="img" aria-label="${safeTitle}">
  <rect width="640" height="420" fill="#f8fafc"/>
  <circle cx="320" cy="162" r="82" fill="#fde2d4" stroke="#334155" stroke-width="6"/>
  <path d="M198 352c18-74 74-118 122-118s104 44 122 118" fill="#fde2d4" stroke="#334155" stroke-width="6"/>
  <path d="M232 146c38-62 144-62 176 0" fill="none" stroke="#475569" stroke-width="10" stroke-linecap="round"/>
  <circle cx="292" cy="166" r="7" fill="#334155"/>
  <circle cx="348" cy="166" r="7" fill="#334155"/>
  <path d="M290 204c18 16 42 16 60 0" fill="none" stroke="#b45309" stroke-width="6" stroke-linecap="round"/>
  <circle cx="320" cy="188" r="128" fill="${baseColor}" opacity="${overlayOpacity}"/>
  <rect x="54" y="40" width="214" height="54" rx="8" fill="#ffffff" stroke="#cbd5e1"/>
  <text x="78" y="74" font-family="Arial, sans-serif" font-size="24" font-weight="700" fill="#0f172a">${safeTitle}</text>
  <text x="78" y="390" font-family="Arial, sans-serif" font-size="20" fill="#334155">${safeSubtitle}</text>
</svg>`;

    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

/**
 * Cria preview publico sem expor a fotografia facial privada.
 *
 * @function createMakeupPreview
 * @param {{facePhoto: object, product: object}} input - Fotografia frontal e produto.
 * @returns {object} Preview seguro.
 */
export function createMakeupPreview({ facePhoto, product }) {
    if (!facePhoto?._id) {
        throw new AppError(400, "Fotografia frontal ativa obrigatória");
    }

    if (!product?._id || product.stock <= 0) {
        throw new AppError(404, "Produto disponível obrigatório");
    }

    const accentColor = colorFromProduct(product);
    const beforeImageUrl = createSafeSvgPreviewImage({
        title: "Antes",
        subtitle: "Fotografia privada validada",
        accentColor: "#94a3b8",
    });
    const afterImageUrl = createSafeSvgPreviewImage({
        title: "Depois",
        subtitle: product.name,
        accentColor,
        variant: "after",
    });

    return {
        providerName: "local-makeup-simulation-v1",
        beforePanel: {
            label: "Antes",
            description: "Fotografia frontal privada validada pelo backend.",
            accentColor: "#94a3b8",
        },
        afterPanel: {
            label: "Depois",
            description: `Pré-visualização baseline com ${product.name} (${product.brandName}).`,
            accentColor,
        },
        overlay: {
            style: "baseline_visual_seguro",
            productName: product.name,
            accentColor,
        },
        visual: {
            type: "safe_svg_preview",
            beforeImageUrl,
            afterImageUrl,
            altText: `Preview visual seguro de maquilhagem com ${product.name}.`,
        },
        limitations: [
            "Simulação local baseline; não representa realismo fotográfico avançado.",
            "A fotografia facial privada não é devolvida pela API.",
            "Resultado cosmético e não clínico.",
        ],
    };
}
