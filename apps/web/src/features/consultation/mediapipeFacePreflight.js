/**
 * FaceLandmarker local e opcional para preflight de enquadramento.
 *
 * O package é carregado apenas quando o utilizador escolhe uma fotografia. WASM
 * e modelo são servidos pela própria aplicação; não existem pedidos a CDN. Uma
 * falha de inicialização degrada para warning e o backend repete sempre os gates.
 */

const WASM_ROOT = "/mediapipe/wasm";
const MODEL_ASSET_PATH = "/mediapipe/models/face_landmarker.task";
const MIN_DETECTION_CONFIDENCE = 0.7;
const MIN_FACE_PRESENCE_CONFIDENCE = 0.7;
const MIN_TRACKING_CONFIDENCE = 0.7;
const LEFT_EYE_OUTER_INDEX = 33;
const RIGHT_EYE_OUTER_INDEX = 263;
const NOSE_TIP_INDEX = 1;
const GEOMETRY_EPSILON = 1e-6;

let faceLandmarkerPromise = null;

/** Carrega uma única instância usando exclusivamente assets locais. */
async function getFaceLandmarker() {
    if (!faceLandmarkerPromise) {
        faceLandmarkerPromise = import("@mediapipe/tasks-vision").then(
            async ({ FaceLandmarker, FilesetResolver }) => {
                const vision = await FilesetResolver.forVisionTasks(WASM_ROOT);
                return FaceLandmarker.createFromOptions(vision, {
                    baseOptions: {
                        modelAssetPath: MODEL_ASSET_PATH,
                        delegate: "CPU",
                    },
                    runningMode: "IMAGE",
                    numFaces: 2,
                    minFaceDetectionConfidence: MIN_DETECTION_CONFIDENCE,
                    minFacePresenceConfidence: MIN_FACE_PRESENCE_CONFIDENCE,
                    minTrackingConfidence: MIN_TRACKING_CONFIDENCE,
                    outputFaceBlendshapes: false,
                    outputFacialTransformationMatrixes: false,
                });
            },
        );
    }

    return faceLandmarkerPromise;
}

/** Calcula a bounding box normalizada dos landmarks devolvidos. */
function getLandmarkBounds(landmarks) {
    const xs = landmarks.map((point) => Number(point?.x)).filter(Number.isFinite);
    const ys = landmarks.map((point) => Number(point?.y)).filter(Number.isFinite);
    if (xs.length === 0 || ys.length === 0) return null;
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
    return {
        minX,
        maxX,
        minY,
        maxY,
        width: maxX - minX,
        height: maxY - minY,
        centerX: (minX + maxX) / 2,
        centerY: (minY + maxY) / 2,
    };
}

/**
 * Aproxima yaw pela assimetria horizontal nariz/olhos. Não tenta reconhecer a
 * pessoa nem infere atributos; serve apenas para distinguir frente de perfil.
 */
function getYawAsymmetry(landmarks) {
    const leftEye = landmarks[LEFT_EYE_OUTER_INDEX];
    const rightEye = landmarks[RIGHT_EYE_OUTER_INDEX];
    const nose = landmarks[NOSE_TIP_INDEX];
    if (![leftEye, rightEye, nose].every(Boolean)) return null;

    const leftDistance = Math.abs(Number(nose.x) - Number(leftEye.x));
    const rightDistance = Math.abs(Number(rightEye.x) - Number(nose.x));
    const largest = Math.max(leftDistance, rightDistance);
    if (!Number.isFinite(largest) || largest <= 0) return null;
    return Math.min(leftDistance, rightDistance) / largest;
}

/**
 * Avalia contagem, confiança mínima configurada, framing, centro e orientação.
 * É exportada para testes determinísticos sem carregar WASM/modelo.
 */
export function assessFaceLandmarkerResult(result, expectedKind) {
    const faces = Array.isArray(result?.faceLandmarks)
        ? result.faceLandmarks
        : [];
    if (faces.length !== 1) {
        return {
            ok: false,
            errors: [
                faces.length === 0
                    ? "Não foi detetado um rosto com confiança suficiente."
                    : "A fotografia deve conter exatamente um rosto.",
            ],
            warnings: [],
            metrics: { faceCount: faces.length },
        };
    }

    const landmarks = faces[0];
    const bounds = getLandmarkBounds(landmarks);
    const yawAsymmetry = getYawAsymmetry(landmarks);
    const absoluteYawDegrees =
        yawAsymmetry === null ? null : (1 - yawAsymmetry) * 90;
    if (!bounds) {
        return {
            ok: false,
            errors: ["Não foi possível medir o enquadramento do rosto."],
            warnings: [],
            metrics: { faceCount: 1 },
        };
    }

    const errors = [];
    const warnings = [];
    const touchesFrame =
        bounds.minX < 0.015 ||
        bounds.maxX > 0.985 ||
        bounds.minY < 0.015 ||
        bounds.maxY > 0.985;
    if (
        touchesFrame ||
        bounds.height < 0.3 - GEOMETRY_EPSILON ||
        bounds.height > 0.85 + GEOMETRY_EPSILON
    ) {
        errors.push("Enquadra todo o rosto, sem o cortar e sem ficar demasiado longe.");
    }
    if (
        Math.abs(bounds.centerX - 0.5) > 0.2 + GEOMETRY_EPSILON ||
        Math.abs(bounds.centerY - 0.48) > 0.2 + GEOMETRY_EPSILON
    ) {
        errors.push("Mantém o rosto próximo do centro da fotografia.");
    }

    if (absoluteYawDegrees === null) {
        warnings.push("Não foi possível confirmar a orientação do rosto localmente.");
    } else if (
        expectedKind === "frontal" &&
        absoluteYawDegrees > 20 + GEOMETRY_EPSILON
    ) {
        errors.push("Na fotografia frontal, olha diretamente para a câmara.");
    } else if (
        expectedKind === "perfil" &&
        (absoluteYawDegrees < 35 - GEOMETRY_EPSILON ||
            absoluteYawDegrees > 75 + GEOMETRY_EPSILON)
    ) {
        errors.push(
            "Na fotografia de perfil, roda o rosto entre 35° e 75° para um lado.",
        );
    }

    return {
        ok: errors.length === 0,
        errors,
        warnings,
        metrics: {
            faceCount: 1,
            confidenceFloor: MIN_DETECTION_CONFIDENCE,
            centerX: bounds.centerX,
            centerY: bounds.centerY,
            faceWidth: bounds.width,
            faceHeight: bounds.height,
            yawAsymmetry,
            absoluteYawDegrees,
        },
    };
}

/** Executa deteção local ou devolve fallback não bloqueante. */
export async function inspectFaceWithMediaPipe(imageSource, expectedKind) {
    try {
        const faceLandmarker = await getFaceLandmarker();
        return {
            status: "available",
            ...assessFaceLandmarkerResult(
                faceLandmarker.detect(imageSource),
                expectedKind,
            ),
        };
    } catch {
        return {
            status: "unavailable",
            ok: true,
            errors: [],
            warnings: [
                "Não foi possível concluir a verificação automática. Podes continuar; a fotografia será validada em segurança.",
            ],
            metrics: null,
        };
    }
}

export const MEDIAPIPE_LOCAL_ASSETS = Object.freeze({
    wasmRoot: WASM_ROOT,
    modelAssetPath: MODEL_ASSET_PATH,
});
