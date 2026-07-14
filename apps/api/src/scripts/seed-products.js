/**
 * Script local para preparar produtos realistas no catalogo.
 *
 * Os nomes representam tipos de cosmeticos existentes no mercado, mas ficam
 * com marca `Orelle` para evitar misturar marcas reais com dados da aplicacao.
 * As imagens usam ficheiros publicos identificados pelo slug do produto.
 */
import { fileURLToPath } from "node:url";
import { connectDB, disconnectDB } from "../config/db.js";
import { ROLES } from "../constants/roles.js";
import { Category } from "../models/category.model.js";
import { Product } from "../models/product.model.js";
import { User } from "../models/user.model.js";
import { validateProductInput } from "../validators/product.validator.js";
import { seedInitialCategories } from "./seed-categories.js";
import {
    DEMO_ADMIN_EMAIL,
    seedDemoUsers,
} from "./seed-users.js";
import { assertDevelopmentSeedsAllowed } from "./seed-safety.js";

const BRAND_NAME = "Orelle";
const PRODUCT_IMAGE_BASE_URL = (
    process.env.PRODUCT_IMAGE_BASE_URL ?? "http://localhost:5173/products"
).replace(/\/+$/, "");
const PRODUCT_IMAGE_EXTENSION = (
    process.env.PRODUCT_IMAGE_EXTENSION ?? "png"
).replace(/^\./, "");

const ALL_SKIN_TYPES = Object.freeze(["normal", "seca", "mista", "oleosa", "sensivel"]);

/** Define conjuntamente catálogo, metadata visual e variantes de maquilhagem. */
function defineAdditionalMakeupSeed({
    name,
    description,
    ingredientNames,
    priceCents,
    stock,
    makeupFunction,
    routineStep,
    regions,
    applicationAreas,
    texture,
    finish,
    coverage,
    styleTags,
    wearProfiles,
    variants = [],
    skinTypes = ALL_SKIN_TYPES,
    additionalConcernTags = [],
}) {
    return Object.freeze({
        catalog: Object.freeze({
            name,
            description,
            ingredientNames: Object.freeze([...ingredientNames]),
            skinTypes: Object.freeze([...skinTypes]),
            priceCents,
            stock,
            categorySlugs: Object.freeze(["maquilhagem"]),
        }),
        ai: Object.freeze({
            concernTags: Object.freeze(["makeup", ...additionalConcernTags]),
            routineSteps: Object.freeze([routineStep]),
            texture,
            finish,
            coverage,
        }),
        makeup: Object.freeze({
            functions: Object.freeze([makeupFunction]),
            regions: Object.freeze([...regions]),
            applicationAreas: Object.freeze([...applicationAreas]),
            styleTags: Object.freeze([...styleTags]),
            wearProfiles: Object.freeze([...wearProfiles]),
        }),
        variants: Object.freeze(variants.map((variant) => Object.freeze([...variant]))),
    });
}

const ADDITIONAL_MAKEUP_PRODUCT_DEFINITIONS = Object.freeze([
    defineAdditionalMakeupSeed({ name: "Skin Tint Hidratante Natural", description: "Skin tint leve para uniformizar subtilmente o rosto com conforto hidratante.", ingredientNames: ["glicerina", "iron oxides", "squalane"], priceCents: 2190, stock: 28, makeupFunction: "skin_tint", routineStep: "complexion", regions: ["complexion"], applicationAreas: ["full_complexion"], texture: "fluid", finish: "natural", coverage: "sheer", styleTags: ["natural_everyday", "soft_classic"], wearProfiles: ["comfort", "hydrating"], variants: [["light-neutral", "Claro neutro", "#DDB493", "neutral"], ["medium-warm", "Médio quente", "#B77E59", "warm"], ["deep-neutral", "Profundo neutro", "#704631", "neutral"]] }),
    defineAdditionalMakeupSeed({ name: "Base Longwear Acabamento Natural", description: "Base de longa duração com cobertura média e acabamento natural para dias prolongados.", ingredientNames: ["dimethicone", "iron oxides", "silica"], priceCents: 2890, stock: 24, makeupFunction: "foundation", routineStep: "complexion", regions: ["complexion"], applicationAreas: ["full_complexion"], texture: "liquid", finish: "natural", coverage: "medium", styleTags: ["soft_classic", "soft_glam", "gala_evening"], wearProfiles: ["longwear", "photo_ready"], variants: [["porcelain-neutral", "Porcelana neutro", "#E8C3A8", "neutral"], ["light-warm", "Claro quente", "#D5A47F", "warm"], ["medium-olive", "Médio oliva", "#AD7853", "olive"], ["deep-warm", "Profundo quente", "#71442F", "warm"]] }),
    defineAdditionalMakeupSeed({ name: "Base Creme Cobertura Completa", description: "Base cremosa de cobertura completa para um resultado definido e uniforme.", ingredientNames: ["dimethicone", "mica", "iron oxides"], priceCents: 2990, stock: 20, makeupFunction: "foundation", routineStep: "complexion", regions: ["complexion"], applicationAreas: ["full_complexion"], texture: "cream", finish: "satin", coverage: "full", styleTags: ["soft_glam", "gala_evening", "modern_editorial"], wearProfiles: ["longwear", "photo_ready"], variants: [["light-cool", "Claro frio", "#E3BDA5", "cool"], ["medium-neutral", "Médio neutro", "#B67E5B", "neutral"], ["deep-neutral", "Profundo neutro", "#6B422F", "neutral"]] }),
    defineAdditionalMakeupSeed({ name: "Corretor Serum Luminoso", description: "Corretor leve e luminoso para a zona das olheiras e pequenas imperfeições.", ingredientNames: ["glicerina", "mica", "iron oxides"], priceCents: 1590, stock: 30, makeupFunction: "concealer", routineStep: "complexion", regions: ["complexion"], applicationAreas: ["under_eyes", "blemishes"], texture: "serum", finish: "luminous", coverage: "medium", styleTags: ["natural_everyday", "soft_classic", "soft_glam"], wearProfiles: ["comfort", "hydrating"], variants: [["light-neutral", "Claro neutro", "#E5BE9F", "neutral"], ["medium-warm", "Médio quente", "#BD865F", "warm"], ["deep-neutral", "Profundo neutro", "#774A34", "neutral"]] }),
    defineAdditionalMakeupSeed({ name: "Corretor de Cor Cremoso", description: "Corretor de cor cremoso para neutralização localizada antes da base ou corretor.", ingredientNames: ["dimethicone", "mica", "iron oxides"], priceCents: 1690, stock: 26, makeupFunction: "color_corrector", routineStep: "complexion", regions: ["complexion"], applicationAreas: ["under_eyes", "blemishes"], texture: "cream", finish: "natural", coverage: "medium", styleTags: ["soft_classic", "soft_glam", "gala_evening"], wearProfiles: ["photo_ready", "longwear"], variants: [["peach", "Pêssego", "#D99276", "warm"], ["green", "Verde", "#8FAA89", "universal"], ["lavender", "Lavanda", "#A995B3", "cool"]] }),
    defineAdditionalMakeupSeed({ name: "Po Solto Translucido", description: "Pó solto translúcido para fixação leve e controlo localizado do brilho.", ingredientNames: ["silica", "mica", "rice powder"], priceCents: 1790, stock: 32, makeupFunction: "setting_powder", routineStep: "set", regions: ["complexion"], applicationAreas: ["t_zone", "under_eyes"], texture: "powder", finish: "matte", coverage: "sheer", styleTags: ["natural_everyday", "soft_classic", "soft_glam", "gala_evening"], wearProfiles: ["oil_control", "longwear", "photo_ready"], variants: [["translucent", "Translúcido", "#E8DDCE", "universal"], ["deep-translucent", "Translúcido profundo", "#A87C61", "universal"]] }),
    defineAdditionalMakeupSeed({ name: "Po Compacto Oil Control", description: "Pó compacto mate para reforçar a fixação e controlar brilho na zona T.", ingredientNames: ["silica", "talc", "mica"], priceCents: 1690, stock: 27, makeupFunction: "setting_powder", routineStep: "set", regions: ["complexion"], applicationAreas: ["t_zone", "full_complexion"], texture: "powder", finish: "matte", coverage: "light", styleTags: ["soft_classic", "soft_glam", "gala_evening"], wearProfiles: ["oil_control", "longwear"], variants: [["light", "Claro", "#DFC2A6", "neutral"], ["medium", "Médio", "#BB8967", "neutral"], ["deep", "Profundo", "#76503B", "neutral"]] }),
    defineAdditionalMakeupSeed({ name: "Spray Fixador Longwear", description: "Spray fixador para prolongar o plano de maquilhagem sem acrescentar cor.", ingredientNames: ["agua", "film former", "panthenol"], priceCents: 1590, stock: 34, makeupFunction: "setting_spray", routineStep: "set", regions: ["complexion", "cheeks", "eyes", "brows", "lips"], applicationAreas: ["full_complexion"], texture: "water", finish: "natural", coverage: "none", styleTags: ["soft_classic", "soft_glam", "gala_evening", "modern_editorial"], wearProfiles: ["longwear", "photo_ready"] }),
    defineAdditionalMakeupSeed({ name: "Blush em Po Soft Matte", description: "Blush em pó mate de aplicação modulável nas maçãs do rosto.", ingredientNames: ["mica", "talc", "iron oxides"], priceCents: 1490, stock: 30, makeupFunction: "blush", routineStep: "cheeks", regions: ["cheeks"], applicationAreas: ["cheek_apples"], texture: "powder", finish: "matte", coverage: "medium", styleTags: ["natural_everyday", "soft_classic", "soft_glam"], wearProfiles: ["longwear", "oil_control"], variants: [["soft-pink", "Rosa suave", "#C77982", "cool"], ["peach", "Pêssego", "#D08368", "warm"], ["berry", "Frutos vermelhos", "#98515F", "cool"]] }),
    defineAdditionalMakeupSeed({ name: "Blush Liquido Luminoso", description: "Blush líquido luminoso para cor translúcida e acabamento fresco.", ingredientNames: ["agua", "glicerina", "mica"], priceCents: 1590, stock: 29, makeupFunction: "blush", routineStep: "cheeks", regions: ["cheeks"], applicationAreas: ["cheek_apples"], texture: "liquid", finish: "luminous", coverage: "sheer", styleTags: ["natural_everyday", "soft_glam", "modern_editorial"], wearProfiles: ["comfort", "hydrating"], variants: [["rose", "Rosa", "#C86E79", "cool"], ["coral", "Coral", "#D87865", "warm"]] }),
    defineAdditionalMakeupSeed({ name: "Bronzer em Creme Natural", description: "Bronzer cremoso para aquecer o rosto com transições suaves e naturais.", ingredientNames: ["squalane", "mica", "iron oxides"], priceCents: 1790, stock: 25, makeupFunction: "bronzer", routineStep: "cheeks", regions: ["cheeks", "complexion"], applicationAreas: ["cheekbones", "temples"], texture: "cream", finish: "natural", coverage: "medium", styleTags: ["natural_everyday", "soft_classic", "soft_glam"], wearProfiles: ["comfort", "hydrating"], variants: [["light", "Claro", "#B77C58", "warm"], ["medium", "Médio", "#8F5D42", "warm"], ["deep", "Profundo", "#62402F", "neutral"]] }),
    defineAdditionalMakeupSeed({ name: "Bronzer em Po Mate", description: "Bronzer em pó mate para definição quente e duradoura.", ingredientNames: ["mica", "talc", "iron oxides"], priceCents: 1690, stock: 28, makeupFunction: "bronzer", routineStep: "cheeks", regions: ["cheeks", "complexion"], applicationAreas: ["cheekbones", "temples"], texture: "powder", finish: "matte", coverage: "medium", styleTags: ["soft_classic", "soft_glam", "gala_evening"], wearProfiles: ["longwear", "oil_control"], variants: [["light-neutral", "Claro neutro", "#AF7958", "neutral"], ["medium-warm", "Médio quente", "#8B593D", "warm"], ["deep-neutral", "Profundo neutro", "#5D3B2B", "neutral"]] }),
    defineAdditionalMakeupSeed({ name: "Stick de Contorno", description: "Stick de contorno para definição localizada através de cor e sombra cosmética.", ingredientNames: ["dimethicone", "wax", "iron oxides"], priceCents: 1890, stock: 24, makeupFunction: "contour", routineStep: "cheeks", regions: ["cheeks", "complexion"], applicationAreas: ["cheekbones", "jawline", "temples"], texture: "cream", finish: "matte", coverage: "medium", styleTags: ["soft_glam", "gala_evening", "modern_editorial"], wearProfiles: ["longwear", "photo_ready"], variants: [["light-cool", "Claro frio", "#96705E", "cool"], ["medium-neutral", "Médio neutro", "#73513F", "neutral"], ["deep-neutral", "Profundo neutro", "#50372D", "neutral"]] }),
    defineAdditionalMakeupSeed({ name: "Iluminador Liquido", description: "Iluminador líquido para pontos de luz controlados e acabamento luminoso.", ingredientNames: ["glicerina", "mica", "squalane"], priceCents: 1690, stock: 27, makeupFunction: "highlighter", routineStep: "cheeks", regions: ["cheeks", "complexion"], applicationAreas: ["cheekbones"], texture: "liquid", finish: "luminous", coverage: "sheer", styleTags: ["natural_everyday", "soft_glam", "modern_editorial"], wearProfiles: ["comfort", "photo_ready"], variants: [["pearl", "Pérola", "#E8D5C5", "cool"], ["champagne", "Champanhe", "#D4B17A", "warm"], ["bronze", "Bronze", "#9C6848", "warm"]] }),
    defineAdditionalMakeupSeed({ name: "Iluminador em Po", description: "Iluminador em pó para brilho definido nas zonas altas do rosto.", ingredientNames: ["mica", "silica", "iron oxides"], priceCents: 1590, stock: 26, makeupFunction: "highlighter", routineStep: "cheeks", regions: ["cheeks", "complexion"], applicationAreas: ["cheekbones"], texture: "powder", finish: "luminous", coverage: "medium", styleTags: ["soft_glam", "gala_evening", "modern_editorial"], wearProfiles: ["longwear", "photo_ready"], variants: [["pearl", "Pérola", "#E5D3C5", "cool"], ["gold", "Dourado", "#CDA45F", "warm"]] }),
    defineAdditionalMakeupSeed({ name: "Paleta Sombras Rosa e Ameixa", description: "Paleta de sombras rosa e ameixa para looks clássicos, soft glam e de noite.", ingredientNames: ["mica", "talc", "iron oxides"], priceCents: 3190, stock: 18, makeupFunction: "eyeshadow", routineStep: "eyes", regions: ["eyes"], applicationAreas: ["eyelids"], texture: "powder", finish: "satin", coverage: "medium", styleTags: ["soft_classic", "soft_glam", "gala_evening"], wearProfiles: ["longwear", "photo_ready"], variants: [["rose", "Rosa", "#B86D82", "cool"], ["plum", "Ameixa", "#704458", "cool"]] }),
    defineAdditionalMakeupSeed({ name: "Sombra Creme Longwear", description: "Sombra cremosa de longa duração para cor uniforme e definida nas pálpebras.", ingredientNames: ["dimethicone", "mica", "iron oxides"], priceCents: 1490, stock: 31, makeupFunction: "eyeshadow", routineStep: "eyes", regions: ["eyes"], applicationAreas: ["eyelids"], texture: "cream", finish: "satin", coverage: "full", styleTags: ["soft_classic", "soft_glam", "modern_editorial"], wearProfiles: ["longwear", "photo_ready"], variants: [["taupe", "Taupe", "#806B62", "neutral"], ["bronze", "Bronze", "#8D5E3E", "warm"], ["plum", "Ameixa", "#684656", "cool"]] }),
    defineAdditionalMakeupSeed({ name: "Eyeliner Precisao", description: "Eyeliner líquido de precisão para definição da linha das pestanas.", ingredientNames: ["film former", "iron oxides", "panthenol"], priceCents: 1290, stock: 36, makeupFunction: "eyeliner", routineStep: "eyes", regions: ["eyes"], applicationAreas: ["lash_line"], texture: "liquid", finish: "satin", coverage: "full", styleTags: ["soft_classic", "soft_glam", "gala_evening", "modern_editorial"], wearProfiles: ["longwear", "photo_ready"], variants: [["black", "Preto", "#171717", "universal"], ["brown", "Castanho", "#3D2A24", "universal"]] }),
    defineAdditionalMakeupSeed({ name: "Lapis de Olhos Esfumavel", description: "Lápis de olhos cremoso para definição suave ou esfumada.", ingredientNames: ["wax", "mica", "iron oxides"], priceCents: 1090, stock: 39, makeupFunction: "eyeliner", routineStep: "eyes", regions: ["eyes"], applicationAreas: ["lash_line"], texture: "cream", finish: "matte", coverage: "medium", styleTags: ["natural_everyday", "soft_classic", "soft_glam"], wearProfiles: ["comfort", "longwear"], variants: [["black", "Preto", "#1A1919", "universal"], ["brown", "Castanho", "#4A332A", "universal"], ["plum", "Ameixa", "#513643", "cool"]] }),
    defineAdditionalMakeupSeed({ name: "Mascara Alongamento e Definicao", description: "Máscara de pestanas para alongamento visual e separação definida.", ingredientNames: ["carnauba wax", "panthenol", "iron oxides"], priceCents: 1690, stock: 34, makeupFunction: "mascara", routineStep: "eyes", regions: ["eyes"], applicationAreas: ["lashes"], texture: "liquid", finish: "natural", coverage: "full", styleTags: ["natural_everyday", "soft_classic", "soft_glam", "gala_evening"], wearProfiles: ["longwear", "photo_ready"], variants: [["black", "Preto", "#151515", "universal"], ["brown", "Castanho", "#382821", "universal"]] }),
    defineAdditionalMakeupSeed({ name: "Gel de Sobrancelhas com Cor", description: "Gel com cor para pentear, preencher subtilmente e fixar as sobrancelhas.", ingredientNames: ["film former", "panthenol", "iron oxides"], priceCents: 1390, stock: 32, makeupFunction: "brow_product", routineStep: "brows", regions: ["brows"], applicationAreas: ["brows"], texture: "gel", finish: "natural", coverage: "light", styleTags: ["natural_everyday", "soft_classic", "soft_glam"], wearProfiles: ["comfort", "longwear"], variants: [["taupe", "Taupe", "#76645B", "neutral"], ["brown", "Castanho", "#553A2D", "warm"], ["deep-brown", "Castanho profundo", "#32251F", "neutral"]] }),
    defineAdditionalMakeupSeed({ name: "Lapis de Sobrancelhas Precisao", description: "Lápis fino para preencher falhas e definir a forma existente das sobrancelhas.", ingredientNames: ["wax", "mica", "iron oxides"], priceCents: 1190, stock: 35, makeupFunction: "brow_product", routineStep: "brows", regions: ["brows"], applicationAreas: ["brows"], texture: "cream", finish: "matte", coverage: "medium", styleTags: ["soft_classic", "soft_glam", "gala_evening"], wearProfiles: ["longwear", "photo_ready"], variants: [["taupe", "Taupe", "#75645C", "neutral"], ["brown", "Castanho", "#51372B", "warm"], ["deep", "Profundo", "#2E2420", "neutral"]] }),
    defineAdditionalMakeupSeed({ name: "Lapis de Contorno de Labios", description: "Lápis de lábios para definir o contorno existente e apoiar a duração da cor.", ingredientNames: ["wax", "mica", "iron oxides"], priceCents: 990, stock: 41, makeupFunction: "lip_liner", routineStep: "lips", regions: ["lips"], applicationAreas: ["lip_contour"], texture: "cream", finish: "matte", coverage: "full", styleTags: ["soft_classic", "soft_glam", "gala_evening"], wearProfiles: ["longwear", "photo_ready"], variants: [["nude-rose", "Nude rosado", "#9C5C61", "cool"], ["nude-brown", "Nude castanho", "#774B42", "neutral"], ["red", "Vermelho", "#8E3038", "cool"]] }),
    defineAdditionalMakeupSeed({ name: "Batom Satin Intenso", description: "Batom acetinado de cor intensa e acabamento confortável.", ingredientNames: ["shea butter", "mica", "iron oxides"], priceCents: 1290, stock: 37, makeupFunction: "lipstick", routineStep: "lips", regions: ["lips"], applicationAreas: ["lips"], texture: "cream", finish: "satin", coverage: "full", styleTags: ["soft_classic", "soft_glam", "gala_evening"], wearProfiles: ["comfort", "photo_ready"], variants: [["rose", "Rosa", "#A74F62", "cool"], ["coral", "Coral", "#B95345", "warm"], ["red", "Vermelho", "#922D37", "cool"], ["berry", "Frutos vermelhos", "#733247", "cool"]] }),
    defineAdditionalMakeupSeed({ name: "Batom Mate Longwear", description: "Batom mate de longa duração para um resultado definido.", ingredientNames: ["silica", "wax", "iron oxides"], priceCents: 1390, stock: 34, makeupFunction: "lipstick", routineStep: "lips", regions: ["lips"], applicationAreas: ["lips"], texture: "liquid", finish: "matte", coverage: "full", styleTags: ["soft_glam", "gala_evening", "modern_editorial"], wearProfiles: ["longwear", "photo_ready"], variants: [["nude", "Nude", "#96615A", "neutral"], ["red", "Vermelho", "#8B2631", "cool"], ["plum", "Ameixa", "#663044", "cool"]] }),
    defineAdditionalMakeupSeed({ name: "Gloss Labial Luminoso", description: "Gloss labial translúcido para brilho visível e conforto.", ingredientNames: ["squalane", "castor oil", "mica"], priceCents: 1090, stock: 40, makeupFunction: "lip_gloss", routineStep: "lips", regions: ["lips"], applicationAreas: ["lips"], texture: "gel", finish: "luminous", coverage: "sheer", styleTags: ["natural_everyday", "soft_glam", "modern_editorial"], wearProfiles: ["comfort", "hydrating"], variants: [["clear", "Transparente", "#E9D9D2", "universal"], ["rose", "Rosa", "#C97882", "cool"], ["peach", "Pêssego", "#D68B73", "warm"]] }),
    defineAdditionalMakeupSeed({ name: "Oleo Labial com Cor", description: "Óleo labial com cor translúcida para conforto e luminosidade.", ingredientNames: ["squalane", "jojoba oil", "iron oxides"], priceCents: 1190, stock: 38, makeupFunction: "lip_gloss", routineStep: "lips", regions: ["lips"], applicationAreas: ["lips"], texture: "oil", finish: "luminous", coverage: "sheer", styleTags: ["natural_everyday", "soft_classic"], wearProfiles: ["comfort", "hydrating"], variants: [["rose", "Rosa", "#B96672", "cool"], ["berry", "Frutos vermelhos", "#8C4456", "cool"]] }),
    defineAdditionalMakeupSeed({ name: "Primer Iluminador Suavizante", description: "Primer luminoso para preparar a complexion e criar uma base visualmente suave.", ingredientNames: ["glicerina", "mica", "dimethicone"], priceCents: 1690, stock: 27, makeupFunction: "primer", routineStep: "prime", regions: ["complexion"], applicationAreas: ["full_complexion"], texture: "gel_cream", finish: "luminous", coverage: "none", styleTags: ["natural_everyday", "soft_glam", "gala_evening"], wearProfiles: ["hydrating", "photo_ready"], additionalConcernTags: ["hydration_barrier"] }),
]);

export const CATALOG_PRODUCTS = [
    {
        name: "Gel de Limpeza Suave",
        description:
            "Gel cosmetico de limpeza diaria para remover impurezas sem deixar a pele desconfortavel.",
        ingredientNames: ["agua", "glicerina", "coco glucoside"],
        skinTypes: ["normal", "mista", "sensivel"],
        priceCents: 1290,
        stock: 36,
        categorySlugs: ["limpeza"],
    },
    {
        name: "Espuma de Limpeza Purificante",
        description:
            "Espuma leve para limpeza de pele oleosa e mista, com acabamento fresco e sem perfume intenso.",
        ingredientNames: ["agua", "zinco pca", "glicerina"],
        skinTypes: ["oleosa", "mista"],
        priceCents: 1490,
        stock: 32,
        categorySlugs: ["limpeza"],
    },
    {
        name: "Oleo de Limpeza Desmaquilhante",
        description:
            "Oleo de limpeza para dissolver maquilhagem e protetor solar antes do gel de limpeza diario.",
        ingredientNames: ["caprylic triglyceride", "squalane", "tocopherol"],
        skinTypes: ["seca", "normal", "mista"],
        priceCents: 1890,
        stock: 24,
        categorySlugs: ["limpeza"],
    },
    {
        name: "Agua Micelar Pele Sensivel",
        description:
            "Agua micelar suave para rosto e olhos, pensada para limpeza rapida em pele sensivel.",
        ingredientNames: ["agua", "glicerina", "panthenol"],
        skinTypes: ["sensivel", "normal", "seca"],
        priceCents: 1090,
        stock: 42,
        categorySlugs: ["limpeza"],
    },
    {
        name: "Tonico Esfoliante AHA BHA",
        description:
            "Tonico cosmetico com acidos suaves para textura irregular e excesso de oleosidade.",
        ingredientNames: ["acido glicolico", "acido salicilico", "aloe vera"],
        skinTypes: ["oleosa", "mista"],
        priceCents: 1690,
        stock: 18,
        categorySlugs: ["tratamento"],
    },
    {
        name: "Serum Niacinamida 10% + Zinco 1%",
        description:
            "Serum cosmetico para ajudar a equilibrar a aparencia de oleosidade e brilho excessivo.",
        ingredientNames: ["niacinamida", "zinco pca", "glicerina"],
        skinTypes: ["oleosa", "mista"],
        priceCents: 1590,
        stock: 30,
        categorySlugs: ["tratamento"],
    },
    {
        name: "Serum Acido Hialuronico 2% + B5",
        description:
            "Serum hidratante com textura leve para melhorar a sensacao de conforto da pele.",
        ingredientNames: ["acido hialuronico", "panthenol", "glicerina"],
        skinTypes: ["seca", "normal", "mista", "sensivel"],
        priceCents: 1790,
        stock: 34,
        categorySlugs: ["tratamento"],
    },
    {
        name: "Serum Vitamina C 10%",
        description:
            "Serum antioxidante cosmetico para luminosidade e uniformizacao visual do tom da pele.",
        ingredientNames: ["ascorbyl glucoside", "ferulic acid", "glicerina"],
        skinTypes: ["normal", "mista", "seca"],
        priceCents: 2290,
        stock: 22,
        categorySlugs: ["tratamento"],
    },
    {
        name: "Serum Retinal Suave 0.1%",
        description:
            "Serum noturno de cuidado cosmetico gradual para textura e aparencia geral da pele.",
        ingredientNames: ["retinal", "squalane", "bisabolol"],
        skinTypes: ["normal", "seca", "mista"],
        priceCents: 2590,
        stock: 16,
        categorySlugs: ["tratamento"],
    },
    {
        name: "Creme Hidratante Ceramidas",
        description:
            "Creme hidratante diario com ceramidas para reforcar a sensacao de barreira cutanea.",
        ingredientNames: ["ceramidas", "glicerina", "cholesterol"],
        skinTypes: ["seca", "normal", "sensivel"],
        priceCents: 1990,
        stock: 28,
        categorySlugs: ["tratamento"],
    },
    {
        name: "Gel-Creme Hidratante Oil-Free",
        description:
            "Gel-creme hidratante leve para pele mista e oleosa, com toque rapido e nao oleoso.",
        ingredientNames: ["agua", "glicerina", "niacinamida"],
        skinTypes: ["oleosa", "mista", "normal"],
        priceCents: 1790,
        stock: 31,
        categorySlugs: ["tratamento"],
    },
    {
        name: "Creme Rico Pele Seca",
        description:
            "Creme nutritivo para pele seca, com textura envolvente e conforto prolongado.",
        ingredientNames: ["shea butter", "squalane", "glicerina"],
        skinTypes: ["seca"],
        priceCents: 2190,
        stock: 20,
        categorySlugs: ["tratamento"],
    },
    {
        name: "Creme Barreira Cica",
        description:
            "Creme de cuidado cosmetico com pantenol e centella para pele sensibilizada.",
        ingredientNames: ["panthenol", "centella asiatica", "madecassoside"],
        skinTypes: ["sensivel", "seca", "normal"],
        priceCents: 2090,
        stock: 26,
        categorySlugs: ["tratamento"],
    },
    {
        name: "Mascara Argila Verde",
        description:
            "Mascara facial de argila para absorver excesso de oleosidade e deixar toque fresco.",
        ingredientNames: ["kaolin", "bentonite", "aloe vera"],
        skinTypes: ["oleosa", "mista"],
        priceCents: 1390,
        stock: 25,
        categorySlugs: ["tratamento"],
    },
    {
        name: "Mascara Hidratante Noturna",
        description:
            "Mascara noturna de hidratacao cosmetica para pele com sensacao de repuxar.",
        ingredientNames: ["glicerina", "squalane", "acido hialuronico"],
        skinTypes: ["seca", "normal", "sensivel"],
        priceCents: 1890,
        stock: 19,
        categorySlugs: ["tratamento"],
    },
    {
        name: "Protetor Solar Fluido FPS 50",
        description:
            "Protetor solar fluido de uso diario com acabamento leve para rosto e pescoco.",
        ingredientNames: ["uv filters", "glicerina", "vitamina e"],
        skinTypes: ["normal", "mista", "seca"],
        priceCents: 2190,
        stock: 38,
        categorySlugs: ["protetor-solar"],
    },
    {
        name: "Protetor Solar Mineral FPS 50",
        description:
            "Protetor solar mineral para pele sensivel, com filtros fisicos e textura cremosa.",
        ingredientNames: ["zinc oxide", "titanium dioxide", "squalane"],
        skinTypes: ["sensivel", "seca", "normal"],
        priceCents: 2390,
        stock: 21,
        categorySlugs: ["protetor-solar"],
    },
    {
        name: "Protetor Solar Oil Control FPS 50",
        description:
            "Protetor solar com acabamento mate para pele oleosa e mista durante o dia.",
        ingredientNames: ["uv filters", "silica", "niacinamida"],
        skinTypes: ["oleosa", "mista"],
        priceCents: 2290,
        stock: 29,
        categorySlugs: ["protetor-solar"],
    },
    {
        name: "Base Liquida Mate",
        description:
            "Base liquida de acabamento mate para uniformizar o aspeto da pele sem pesar.",
        ingredientNames: ["dimethicone", "iron oxides", "silica"],
        skinTypes: ["oleosa", "mista", "normal"],
        priceCents: 2490,
        stock: 18,
        categorySlugs: ["maquilhagem"],
    },
    {
        name: "Base Serum Glow",
        description:
            "Base-serum de acabamento luminoso para cobertura leve e sensacao hidratante.",
        ingredientNames: ["glicerina", "iron oxides", "acido hialuronico"],
        skinTypes: ["seca", "normal", "mista"],
        priceCents: 2690,
        stock: 17,
        categorySlugs: ["maquilhagem"],
    },
    {
        name: "Corretor Liquido Alta Cobertura",
        description:
            "Corretor liquido para olheiras e pequenas marcas, com aplicacao precisa.",
        ingredientNames: ["dimethicone", "mica", "iron oxides"],
        skinTypes: ["normal", "mista", "seca", "oleosa"],
        priceCents: 1490,
        stock: 27,
        categorySlugs: ["maquilhagem"],
    },
    {
        name: "Blush Creme Rosa",
        description:
            "Blush em creme com acabamento natural para acrescentar cor suave ao rosto.",
        ingredientNames: ["squalane", "mica", "iron oxides"],
        skinTypes: ["seca", "normal", "mista"],
        priceCents: 1390,
        stock: 23,
        categorySlugs: ["maquilhagem"],
    },
    {
        name: "Batom Hidratante Nude",
        description:
            "Batom cremoso com cor nude e conforto para uso diario em maquilhagem simples.",
        ingredientNames: ["shea butter", "tocopherol", "mica"],
        skinTypes: ["normal", "seca", "mista", "oleosa", "sensivel"],
        priceCents: 1190,
        stock: 35,
        categorySlugs: ["maquilhagem"],
    },
    {
        name: "Mascara de Pestanas Volume",
        description:
            "Mascara de pestanas para volume e definicao, com escova classica de uso diario.",
        ingredientNames: ["beeswax", "carnauba wax", "iron oxides"],
        skinTypes: ["normal", "seca", "mista", "oleosa", "sensivel"],
        priceCents: 1590,
        stock: 33,
        categorySlugs: ["maquilhagem"],
    },
    {
        name: "Paleta Sombras Neutras",
        description:
            "Paleta de sombras neutras com tons mate e acetinados para looks de dia e noite.",
        ingredientNames: ["mica", "talc", "iron oxides"],
        skinTypes: ["normal", "seca", "mista", "oleosa", "sensivel"],
        priceCents: 2990,
        stock: 14,
        categorySlugs: ["maquilhagem"],
    },
    {
        name: "Gel de Limpeza Anti-Imperfeicoes",
        description:
            "Gel de limpeza sem perfume para remover impurezas com suavidade em pele com tendencia a imperfeicoes.",
        ingredientNames: ["agua", "glicerina", "zinco pca"],
        skinTypes: ["oleosa", "mista", "normal", "sensivel"],
        priceCents: 1390,
        stock: 30,
        categorySlugs: ["limpeza"],
    },
    {
        name: "Serum Equilibrante Acido Azelaico 10%",
        description:
            "Serum cosmetico gradual para melhorar o aspeto de imperfeicoes, vermelhidao e tom irregular.",
        ingredientNames: ["acido azelaico", "squalane", "panthenol"],
        skinTypes: ["oleosa", "mista", "normal", "sensivel"],
        priceCents: 2090,
        stock: 22,
        categorySlugs: ["tratamento"],
    },
    {
        name: "Locao Leve Pele com Imperfeicoes",
        description:
            "Locao hidratante leve para conforto diario de pele com brilho e tendencia a imperfeicoes.",
        ingredientNames: ["niacinamida", "ceramidas", "glicerina"],
        skinTypes: ["oleosa", "mista", "normal"],
        priceCents: 1890,
        stock: 27,
        categorySlugs: ["tratamento"],
    },
    {
        name: "Gel Local SOS Imperfeicoes",
        description:
            "Gel cosmetico de aplicacao localizada para cuidar da aparencia de imperfeicoes sem pesar na rotina.",
        ingredientNames: ["acido salicilico", "niacinamida", "aloe vera"],
        skinTypes: ["oleosa", "mista", "normal"],
        priceCents: 1190,
        stock: 25,
        categorySlugs: ["tratamento"],
    },
    {
        name: "Creme Conforto Pele Seca com Imperfeicoes",
        description:
            "Creme sem perfume para hidratar pele seca ou sensivel com tendencia ocasional a imperfeicoes.",
        ingredientNames: ["ceramidas", "panthenol", "niacinamida"],
        skinTypes: ["seca", "normal", "sensivel"],
        priceCents: 1990,
        stock: 24,
        categorySlugs: ["tratamento"],
    },
    {
        name: "Serum Uniformizador Suave",
        description:
            "Serum sem perfume para apoiar a uniformidade visual do tom e o conforto da pele sensivel.",
        ingredientNames: ["alpha arbutin", "acido hialuronico", "glicerina"],
        skinTypes: ["oleosa", "mista", "normal", "seca", "sensivel"],
        priceCents: 1890,
        stock: 26,
        categorySlugs: ["tratamento"],
    },
    {
        name: "Essencia Antioxidante Luminosidade",
        description:
            "Essencia cosmetica leve para reforcar a luminosidade e a hidratacao sem uma textura pesada.",
        ingredientNames: ["cha verde", "ascorbyl glucoside", "glicerina"],
        skinTypes: ["mista", "normal", "seca", "sensivel"],
        priceCents: 1490,
        stock: 29,
        categorySlugs: ["tratamento"],
    },
    {
        name: "Creme Iluminador Diario",
        description:
            "Creme diario para hidratar e melhorar a aparencia de luminosidade e uniformidade da pele.",
        ingredientNames: ["niacinamida", "extrato de alcaçuz", "ceramidas"],
        skinTypes: ["mista", "normal", "seca", "sensivel"],
        priceCents: 1790,
        stock: 28,
        categorySlugs: ["tratamento"],
    },
    {
        name: "Protetor Solar Mineral com Cor FPS 50",
        description:
            "Protetor solar mineral com cobertura leve para uniformizar visualmente a pele durante o dia.",
        ingredientNames: ["zinc oxide", "titanium dioxide", "iron oxides"],
        skinTypes: ["mista", "normal", "seca", "sensivel"],
        priceCents: 2290,
        stock: 32,
        categorySlugs: ["protetor-solar"],
    },
    {
        name: "Protetor Solar Sport FPS 50+",
        description:
            "Protetor solar resistente a agua durante 80 minutos para atividade fisica e dias no exterior.",
        ingredientNames: ["uv filters", "tocopherol", "glicerina"],
        skinTypes: ["oleosa", "mista", "normal"],
        priceCents: 1990,
        stock: 35,
        categorySlugs: ["protetor-solar"],
    },
    {
        name: "Protetor Solar Invisivel FPS 50",
        description:
            "Protetor solar fluido sem perfume e sem acabamento branco para uso diario em varios tipos de pele.",
        ingredientNames: ["uv filters", "silica", "glicerina"],
        skinTypes: ["oleosa", "mista", "normal", "seca", "sensivel"],
        priceCents: 1690,
        stock: 40,
        categorySlugs: ["protetor-solar"],
    },
    {
        name: "Leite de Limpeza Calmante",
        description:
            "Leite de limpeza sem perfume para remover residuos e manter o conforto da pele seca ou sensivel.",
        ingredientNames: ["extrato de aveia", "glicerina", "panthenol"],
        skinTypes: ["normal", "seca", "sensivel"],
        priceCents: 1290,
        stock: 33,
        categorySlugs: ["limpeza"],
    },
    {
        name: "Balsamo Reparador Sem Perfume",
        description:
            "Balsamo cosmetico nutritivo para zonas secas e pele sensibilizada que precisa de conforto adicional.",
        ingredientNames: ["ceramidas", "panthenol", "squalane"],
        skinTypes: ["normal", "seca", "sensivel"],
        priceCents: 1590,
        stock: 31,
        categorySlugs: ["tratamento"],
    },
    {
        name: "Primer Mate Controlo de Brilho",
        description:
            "Primer de maquilhagem com acabamento mate para preparar a pele e reduzir visualmente o brilho.",
        ingredientNames: ["silica", "niacinamida", "dimethicone"],
        skinTypes: ["oleosa", "mista", "normal"],
        priceCents: 1490,
        stock: 25,
        categorySlugs: ["maquilhagem"],
    },
    {
        name: "Primer Hidratante Calmante",
        description:
            "Primer hidratante sem perfume para preparar pele seca ou sensivel com acabamento vicoso.",
        ingredientNames: ["glicerina", "panthenol", "centella asiatica"],
        skinTypes: ["mista", "normal", "seca", "sensivel"],
        priceCents: 1590,
        stock: 24,
        categorySlugs: ["maquilhagem"],
    },
    ...ADDITIONAL_MAKEUP_PRODUCT_DEFINITIONS.map(({ catalog }) => catalog),
];

// Alias temporário para imports de testes/guias anteriores. O runtime não usa
// esta designação para representar resultados de IA.
export const DEMO_PRODUCTS = CATALOG_PRODUCTS;

/**
 * Cria metadata IA explícita para um produto seedado.
 *
 * A curadoria não depende de palavras presentes no nome ou na descrição. Isto
 * evita que termos como `suave`, `mate` ou `oleosidade` alterem tags e texturas
 * por coincidência textual.
 */
function defineSeedAiMetadata({
    concernTags,
    routineSteps,
    texture,
    finish = null,
    coverage = "none",
    fragranceFree = null,
    spf = null,
    uvaRating = null,
    waterResistantMinutes = null,
    makeup = {},
}) {
    return Object.freeze({
        concernTags: Object.freeze([...concernTags]),
        routineSteps: Object.freeze([...routineSteps]),
        attributes: Object.freeze({
            texture,
            finish,
            coverage,
            fragranceFree,
            spf,
            uvaRating,
            waterResistantMinutes,
        }),
        makeup: Object.freeze({
            functions: Object.freeze([...(makeup.functions ?? [])]),
            regions: Object.freeze([...(makeup.regions ?? [])]),
            applicationAreas: Object.freeze([...(makeup.applicationAreas ?? [])]),
            styleTags: Object.freeze([...(makeup.styleTags ?? [])]),
            wearProfiles: Object.freeze([...(makeup.wearProfiles ?? [])]),
        }),
    });
}

/**
 * Fonte autoritativa da curadoria IA dos produtos académicos.
 *
 * Cada entrada foi distribuída por objetivo, passo da rotina e atributos
 * cosméticos para garantir candidatos úteis sem inferência heurística.
 */
const CURATED_AI_METADATA_BY_PRODUCT_NAME = Object.freeze({
    "Gel de Limpeza Suave": defineSeedAiMetadata({
        concernTags: ["sensitivity_redness"],
        routineSteps: ["cleanse"],
        texture: "gel",
        fragranceFree: true,
    }),
    "Espuma de Limpeza Purificante": defineSeedAiMetadata({
        concernTags: ["oil_control", "acne_imperfections"],
        routineSteps: ["cleanse"],
        texture: "foam",
        fragranceFree: true,
    }),
    "Oleo de Limpeza Desmaquilhante": defineSeedAiMetadata({
        concernTags: ["hydration_barrier"],
        routineSteps: ["cleanse"],
        texture: "oil",
    }),
    "Agua Micelar Pele Sensivel": defineSeedAiMetadata({
        concernTags: ["sensitivity_redness"],
        routineSteps: ["cleanse"],
        texture: "water",
        fragranceFree: true,
    }),
    "Tonico Esfoliante AHA BHA": defineSeedAiMetadata({
        concernTags: ["oil_control", "acne_imperfections"],
        routineSteps: ["tone_exfoliate"],
        texture: "water",
    }),
    "Serum Niacinamida 10% + Zinco 1%": defineSeedAiMetadata({
        concernTags: ["oil_control", "acne_imperfections"],
        routineSteps: ["treat"],
        texture: "serum",
    }),
    "Serum Acido Hialuronico 2% + B5": defineSeedAiMetadata({
        concernTags: ["hydration_barrier", "sensitivity_redness"],
        routineSteps: ["treat"],
        texture: "serum",
    }),
    "Serum Vitamina C 10%": defineSeedAiMetadata({
        concernTags: ["spots_tone_luminosity"],
        routineSteps: ["treat"],
        texture: "serum",
        finish: "luminous",
    }),
    "Serum Retinal Suave 0.1%": defineSeedAiMetadata({
        concernTags: ["spots_tone_luminosity", "hydration_barrier"],
        routineSteps: ["treat"],
        texture: "serum",
    }),
    "Creme Hidratante Ceramidas": defineSeedAiMetadata({
        concernTags: ["hydration_barrier", "sensitivity_redness"],
        routineSteps: ["moisturize"],
        texture: "cream",
    }),
    "Gel-Creme Hidratante Oil-Free": defineSeedAiMetadata({
        concernTags: ["hydration_barrier", "oil_control"],
        routineSteps: ["moisturize"],
        texture: "gel_cream",
    }),
    "Creme Rico Pele Seca": defineSeedAiMetadata({
        concernTags: ["hydration_barrier"],
        routineSteps: ["moisturize"],
        texture: "cream",
    }),
    "Creme Barreira Cica": defineSeedAiMetadata({
        concernTags: ["hydration_barrier", "sensitivity_redness"],
        routineSteps: ["moisturize"],
        texture: "cream",
    }),
    "Mascara Argila Verde": defineSeedAiMetadata({
        concernTags: ["oil_control", "acne_imperfections"],
        routineSteps: ["treat"],
        texture: "cream",
        finish: "matte",
    }),
    "Mascara Hidratante Noturna": defineSeedAiMetadata({
        concernTags: ["hydration_barrier", "sensitivity_redness"],
        routineSteps: ["moisturize"],
        texture: "cream",
    }),
    "Protetor Solar Fluido FPS 50": defineSeedAiMetadata({
        concernTags: ["sun_protection"],
        routineSteps: ["protect"],
        texture: "fluid",
        spf: 50,
        uvaRating: "broad_spectrum",
        waterResistantMinutes: 0,
    }),
    "Protetor Solar Mineral FPS 50": defineSeedAiMetadata({
        concernTags: [
            "sun_protection",
            "sensitivity_redness",
            "hydration_barrier",
        ],
        routineSteps: ["protect"],
        texture: "cream",
        fragranceFree: true,
        spf: 50,
        uvaRating: "broad_spectrum",
        waterResistantMinutes: 0,
    }),
    "Protetor Solar Oil Control FPS 50": defineSeedAiMetadata({
        concernTags: ["sun_protection", "oil_control"],
        routineSteps: ["protect"],
        texture: "fluid",
        finish: "matte",
        spf: 50,
        uvaRating: "broad_spectrum",
        waterResistantMinutes: 0,
    }),
    "Base Liquida Mate": defineSeedAiMetadata({
        concernTags: ["makeup"],
        routineSteps: ["complexion"],
        texture: "liquid",
        finish: "matte",
        coverage: "medium",
        makeup: { functions: ["foundation"], regions: ["complexion"], applicationAreas: ["full_complexion"], styleTags: ["soft_classic", "soft_glam"], wearProfiles: ["oil_control", "longwear"] },
    }),
    "Base Serum Glow": defineSeedAiMetadata({
        concernTags: ["makeup"],
        routineSteps: ["complexion"],
        texture: "serum",
        finish: "luminous",
        coverage: "light",
        makeup: { functions: ["foundation"], regions: ["complexion"], applicationAreas: ["full_complexion"], styleTags: ["natural_everyday", "soft_classic"], wearProfiles: ["hydrating", "comfort"] },
    }),
    "Corretor Liquido Alta Cobertura": defineSeedAiMetadata({
        concernTags: ["makeup"],
        routineSteps: ["complexion"],
        texture: "liquid",
        finish: "natural",
        coverage: "full",
        makeup: { functions: ["concealer"], regions: ["complexion"], applicationAreas: ["under_eyes", "blemishes"], styleTags: ["soft_classic", "soft_glam", "gala_evening"], wearProfiles: ["longwear", "photo_ready"] },
    }),
    "Blush Creme Rosa": defineSeedAiMetadata({
        concernTags: ["makeup"],
        routineSteps: ["cheeks"],
        texture: "cream",
        finish: "natural",
        coverage: "sheer",
        makeup: { functions: ["blush"], regions: ["cheeks"], applicationAreas: ["cheek_apples"], styleTags: ["natural_everyday", "soft_classic"], wearProfiles: ["comfort", "hydrating"] },
    }),
    "Batom Hidratante Nude": defineSeedAiMetadata({
        concernTags: ["makeup"],
        routineSteps: ["lips"],
        texture: "balm",
        finish: "satin",
        coverage: "medium",
        makeup: { functions: ["lipstick"], regions: ["lips"], applicationAreas: ["lips"], styleTags: ["natural_everyday", "soft_classic"], wearProfiles: ["comfort", "hydrating"] },
    }),
    "Mascara de Pestanas Volume": defineSeedAiMetadata({
        concernTags: ["makeup"],
        routineSteps: ["eyes"],
        texture: "liquid",
        finish: "natural",
        coverage: "full",
        makeup: { functions: ["mascara"], regions: ["eyes"], applicationAreas: ["lashes"], styleTags: ["natural_everyday", "soft_classic", "soft_glam"], wearProfiles: ["longwear", "photo_ready"] },
    }),
    "Paleta Sombras Neutras": defineSeedAiMetadata({
        concernTags: ["makeup"],
        routineSteps: ["eyes"],
        texture: "powder",
        finish: "satin",
        coverage: "medium",
        makeup: { functions: ["eyeshadow"], regions: ["eyes"], applicationAreas: ["eyelids"], styleTags: ["natural_everyday", "soft_classic", "soft_glam"], wearProfiles: ["longwear", "photo_ready"] },
    }),
    "Gel de Limpeza Anti-Imperfeicoes": defineSeedAiMetadata({
        concernTags: ["acne_imperfections", "sensitivity_redness"],
        routineSteps: ["cleanse"],
        texture: "gel",
        fragranceFree: true,
    }),
    "Serum Equilibrante Acido Azelaico 10%": defineSeedAiMetadata({
        concernTags: [
            "acne_imperfections",
            "sensitivity_redness",
            "spots_tone_luminosity",
        ],
        routineSteps: ["treat"],
        texture: "serum",
        fragranceFree: true,
    }),
    "Locao Leve Pele com Imperfeicoes": defineSeedAiMetadata({
        concernTags: [
            "acne_imperfections",
            "hydration_barrier",
            "oil_control",
        ],
        routineSteps: ["moisturize"],
        texture: "fluid",
    }),
    "Gel Local SOS Imperfeicoes": defineSeedAiMetadata({
        concernTags: ["acne_imperfections", "oil_control"],
        routineSteps: ["treat"],
        texture: "gel",
    }),
    "Creme Conforto Pele Seca com Imperfeicoes": defineSeedAiMetadata({
        concernTags: [
            "acne_imperfections",
            "hydration_barrier",
            "sensitivity_redness",
        ],
        routineSteps: ["moisturize"],
        texture: "cream",
        fragranceFree: true,
    }),
    "Serum Uniformizador Suave": defineSeedAiMetadata({
        concernTags: [
            "spots_tone_luminosity",
            "sensitivity_redness",
            "hydration_barrier",
        ],
        routineSteps: ["treat"],
        texture: "serum",
        fragranceFree: true,
    }),
    "Essencia Antioxidante Luminosidade": defineSeedAiMetadata({
        concernTags: ["spots_tone_luminosity", "hydration_barrier"],
        routineSteps: ["treat"],
        texture: "water",
        finish: "luminous",
    }),
    "Creme Iluminador Diario": defineSeedAiMetadata({
        concernTags: [
            "spots_tone_luminosity",
            "hydration_barrier",
            "sensitivity_redness",
        ],
        routineSteps: ["moisturize"],
        texture: "cream",
    }),
    "Protetor Solar Mineral com Cor FPS 50": defineSeedAiMetadata({
        concernTags: [
            "sun_protection",
            "spots_tone_luminosity",
            "sensitivity_redness",
            "makeup",
        ],
        routineSteps: ["protect"],
        texture: "cream",
        finish: "natural",
        coverage: "light",
        fragranceFree: true,
        spf: 50,
        uvaRating: "broad_spectrum",
        waterResistantMinutes: 0,
        makeup: { functions: ["skin_tint"], regions: ["complexion"], applicationAreas: ["full_complexion"], styleTags: ["natural_everyday"], wearProfiles: ["comfort", "hydrating"] },
    }),
    "Protetor Solar Sport FPS 50+": defineSeedAiMetadata({
        concernTags: ["sun_protection"],
        routineSteps: ["protect"],
        texture: "fluid",
        finish: "natural",
        spf: 50,
        uvaRating: "broad_spectrum",
        waterResistantMinutes: 80,
    }),
    "Protetor Solar Invisivel FPS 50": defineSeedAiMetadata({
        concernTags: ["sun_protection", "oil_control"],
        routineSteps: ["protect"],
        texture: "fluid",
        finish: "natural",
        fragranceFree: true,
        spf: 50,
        uvaRating: "broad_spectrum",
        waterResistantMinutes: 0,
    }),
    "Leite de Limpeza Calmante": defineSeedAiMetadata({
        concernTags: ["sensitivity_redness", "hydration_barrier"],
        routineSteps: ["cleanse"],
        texture: "fluid",
        fragranceFree: true,
    }),
    "Balsamo Reparador Sem Perfume": defineSeedAiMetadata({
        concernTags: ["sensitivity_redness", "hydration_barrier"],
        routineSteps: ["moisturize"],
        texture: "balm",
        fragranceFree: true,
    }),
    "Primer Mate Controlo de Brilho": defineSeedAiMetadata({
        concernTags: ["makeup", "oil_control"],
        routineSteps: ["prime"],
        texture: "gel",
        finish: "matte",
        makeup: { functions: ["primer"], regions: ["complexion"], applicationAreas: ["full_complexion", "t_zone"], styleTags: ["natural_everyday", "soft_classic", "soft_glam"], wearProfiles: ["oil_control", "longwear"] },
    }),
    "Primer Hidratante Calmante": defineSeedAiMetadata({
        concernTags: ["makeup", "hydration_barrier", "sensitivity_redness"],
        routineSteps: ["prime"],
        texture: "gel_cream",
        finish: "dewy",
        fragranceFree: true,
        makeup: { functions: ["primer"], regions: ["complexion"], applicationAreas: ["full_complexion"], styleTags: ["natural_everyday", "soft_classic"], wearProfiles: ["hydrating", "comfort"] },
    }),
    ...Object.fromEntries(
        ADDITIONAL_MAKEUP_PRODUCT_DEFINITIONS.map(({ catalog, ai, makeup }) => [
            catalog.name,
            defineSeedAiMetadata({ ...ai, makeup }),
        ]),
    ),
});

const MAKEUP_VARIANTS = Object.freeze({
    "Base Liquida Mate": [
        ["porcelain-neutral", "Porcelana neutro", "#E8C3A8", "neutral"],
        ["light-warm", "Claro quente", "#D9AD87", "warm"],
        ["medium-olive", "Médio oliva", "#B9855E", "olive"],
        ["deep-neutral", "Profundo neutro", "#754A35", "neutral"],
    ],
    "Base Serum Glow": [
        ["porcelain-cool", "Porcelana frio", "#EBC7B1", "cool"],
        ["light-neutral", "Claro neutro", "#D9AE8D", "neutral"],
        ["medium-warm", "Médio quente", "#B87C54", "warm"],
        ["deep-warm", "Profundo quente", "#74432D", "warm"],
    ],
    "Corretor Liquido Alta Cobertura": [
        ["light-neutral", "Claro neutro", "#E4BE9E", "neutral"],
        ["light-warm", "Claro quente", "#D5A27D", "warm"],
        ["medium-olive", "Médio oliva", "#B37B55", "olive"],
        ["deep-neutral", "Profundo neutro", "#744831", "neutral"],
    ],
    "Blush Creme Rosa": [
        ["soft-rose", "Rosa suave", "#C9787E", "cool"],
        ["warm-rose", "Rosa quente", "#C56F61", "warm"],
    ],
    "Batom Hidratante Nude": [
        ["nude-rose", "Nude rosado", "#A95F63", "cool"],
        ["nude-peach", "Nude pêssego", "#B96F59", "warm"],
        ["nude-brown", "Nude castanho", "#815047", "neutral"],
    ],
    "Mascara de Pestanas Volume": [
        ["black", "Preto", "#171717", "universal"],
        ["brown", "Castanho", "#3D2A24", "universal"],
    ],
    "Paleta Sombras Neutras": [
        ["neutral", "Neutros", "#9A7968", "neutral"],
        ["warm", "Neutros quentes", "#A66E4D", "warm"],
    ],
    "Protetor Solar Mineral com Cor FPS 50": [
        ["light-neutral", "Claro neutro", "#DDB796", "neutral"],
        ["medium-warm", "Médio quente", "#B87E59", "warm"],
        ["medium-olive", "Médio oliva", "#A97852", "olive"],
        ["deep-neutral", "Profundo neutro", "#704832", "neutral"],
    ],
    ...Object.fromEntries(
        ADDITIONAL_MAKEUP_PRODUCT_DEFINITIONS
            .filter(({ variants }) => variants.length > 0)
            .map(({ catalog, variants }) => [catalog.name, variants]),
    ),
});

/** Distribui stock inicial sem criar nem destruir unidades agregadas. */
function distributeVariantStock(totalStock, definitions, existingVariants = []) {
    const existingById = new Map(
        existingVariants.map((variant) => [variant.variantId, variant]),
    );
    const hasCompleteExistingSet = definitions.every(([variantId]) =>
        existingById.has(variantId),
    );

    if (hasCompleteExistingSet) {
        const existingTotal = definitions.reduce(
            (sum, [variantId]) => sum + Number(existingById.get(variantId).stock),
            0,
        );
        if (existingTotal === totalStock) {
            return definitions.map(([variantId, label, colorHex, undertone]) => {
                const existing = existingById.get(variantId);
                return {
                    variantId,
                    label,
                    colorHex,
                    undertone,
                    finish: existing.finish ?? null,
                    coverage: existing.coverage ?? null,
                    imageUrl: existing.imageUrl ?? null,
                    priceCents: existing.priceCents ?? null,
                    stock: existing.stock,
                };
            });
        }
    }

    const base = Math.floor(totalStock / definitions.length);
    let remainder = totalStock % definitions.length;
    return definitions.map(([variantId, label, colorHex, undertone]) => ({
        variantId,
        label,
        colorHex,
        undertone,
        finish: null,
        coverage: null,
        imageUrl: null,
        priceCents: null,
        stock: base + (remainder-- > 0 ? 1 : 0),
    }));
}

/**
 * Constrói metadata curada e determinística para o catálogo académico.
 * A função recebe o stock real para que variantes nunca o reponham.
 */
export function buildCuratedAiMetadata(product, stock, existingVariants = []) {
    const curated = CURATED_AI_METADATA_BY_PRODUCT_NAME[product.name];
    if (!curated) {
        throw new TypeError(
            `Produto seedado sem curadoria IA explícita: ${product.name}`,
        );
    }

    const { concernTags, routineSteps, attributes, makeup } = curated;
    const variantDefinitions = MAKEUP_VARIANTS[product.name] ?? [];
    const variants = variantDefinitions.length
        ? distributeVariantStock(stock, variantDefinitions, existingVariants).map(
              (variant) => ({
                  ...variant,
                  finish: attributes.finish,
                  coverage: attributes.coverage,
              }),
          )
        : [];

    return {
        // Mantém o helper compatível com a migração histórica 012. As seeds
        // atuais passam sempre pelo validador, que publica o contrato v3, e a
        // migração 017 promove documentos persistidos já existentes.
        schemaVersion: 2,
        aiEligible: true,
        concernTags: [...concernTags],
        routineSteps,
        inciIngredients: product.ingredientNames,
        attributes: { ...attributes },
        makeup: {
            functions: [...makeup.functions],
            regions: [...makeup.regions],
            applicationAreas: [...makeup.applicationAreas],
            styleTags: [...makeup.styleTags],
            wearProfiles: [...makeup.wearProfiles],
        },
        variants,
    };
}

/**
 * Converte o nome publico do produto num slug estavel para a imagem.
 *
 * @function slugifyProductName
 * @param {string} productName - Nome publico do produto.
 * @returns {string} Slug ASCII usado no ficheiro de imagem.
 */
function slugifyProductName(productName) {
    return productName
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/%/g, "")
        .replace(/\+/g, " ")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
}

/**
 * Constroi o nome de ficheiro da imagem publica de produto.
 *
 * @function productImageFileNameFor
 * @param {string} productName - Nome publico do produto.
 * @returns {string} Nome de ficheiro por slug, por exemplo `gel-de-limpeza-suave.png`.
 */
function productImageFileNameFor(productName) {
    return `${slugifyProductName(productName)}.${PRODUCT_IMAGE_EXTENSION}`;
}

/**
 * Constroi um URL publico para a imagem de produto.
 *
 * @function imageUrlForProduct
 * @param {string} productName - Nome publico do produto.
 * @returns {string} URL http/https aceite pelo validador.
 */
function imageUrlForProduct(productName) {
    return `${PRODUCT_IMAGE_BASE_URL}/${productImageFileNameFor(productName)}`;
}

/**
 * Constrói os dados completos necessários para gerar as imagens do catálogo.
 *
 * O manifesto usa a mesma função de slug e a mesma curadoria das seeds, pelo
 * que os ficheiros produzidos ficam alinhados com os URLs usados pelo runtime.
 *
 * @returns {object[]} Produtos prontos para exportação em JSON.
 */
export function buildProductImageGenerationManifest() {
    return CATALOG_PRODUCTS.map((product, index) => {
        const metadata = buildCuratedAiMetadata(product, product.stock, []);
        const imageFileName = productImageFileNameFor(product.name);
        const ingredientSummary = product.ingredientNames.join(", ");

        return {
            catalogPosition: index + 1,
            productName: product.name,
            brandName: BRAND_NAME,
            imageFileName,
            publicImagePath: `/products/${imageFileName}`,
            canonicalSize: { width: 960, height: 960, format: "png" },
            description: product.description,
            categorySlugs: [...product.categorySlugs],
            ingredientNames: [...product.ingredientNames],
            skinTypes: [...product.skinTypes],
            priceCents: product.priceCents,
            stock: product.stock,
            aiEligible: metadata.aiEligible,
            concernTags: [...metadata.concernTags],
            routineSteps: [...metadata.routineSteps],
            attributes: { ...metadata.attributes },
            makeup: {
                functions: [...metadata.makeup.functions],
                regions: [...metadata.makeup.regions],
                applicationAreas: [...metadata.makeup.applicationAreas],
                styleTags: [...metadata.makeup.styleTags],
                wearProfiles: [...metadata.makeup.wearProfiles],
            },
            variants: metadata.variants.map((variant) => ({
                variantId: variant.variantId,
                label: variant.label,
                colorHex: variant.colorHex,
                undertone: variant.undertone,
                finish: variant.finish,
                coverage: variant.coverage,
            })),
            imagePrompt: [
                "Fotografia editorial premium de produto cosmético, composição quadrada 960x960.",
                `Produto fictício da marca ORÉLLE: ${product.name}.`,
                product.description,
                `Ingredientes de referência visual: ${ingredientSummary}.`,
                `Textura cosmética: ${metadata.attributes.texture}; acabamento: ${metadata.attributes.finish ?? "natural ou neutro"}.`,
                "Embalagem elegante e realista, coerente com o tipo de produto, centrada e totalmente visível.",
                "Direção artística luxuosa em rosa seco, rosé gold e bordô, iluminação de estúdio suave, fundo editorial com profundidade.",
                "Sem pessoas, sem mãos, sem marcas externas e sem objetos que ocultem a embalagem.",
                "Manter identidade visual consistente com o catálogo ORÉLLE existente.",
            ].join(" "),
        };
    });
}

/**
 * Procura ou cria o admin usado como `createdBy` dos produtos seedados.
 *
 * @async
 * @function getSeedAdmin
 * @returns {Promise<object>} Utilizador administrador.
 * @throws {Error} Quando nao e possivel preparar o admin.
 */
async function getSeedAdmin() {
    let admin = await User.findOne({
        email: DEMO_ADMIN_EMAIL,
        role: ROLES.ADMIN,
    });

    if (!admin) {
        await seedDemoUsers();
        admin = await User.findOne({
            email: DEMO_ADMIN_EMAIL,
            role: ROLES.ADMIN,
        });
    }

    if (!admin) {
        throw new Error("Nao foi possivel preparar o admin dos produtos seedados");
    }

    return admin;
}

/**
 * Carrega categorias por slug depois de garantir o seed base.
 *
 * @async
 * @function getCategoriesBySlug
 * @returns {Promise<Map<string, object>>} Categorias indexadas por slug.
 * @throws {Error} Quando alguma categoria esperada nao existe.
 */
async function getCategoriesBySlug() {
    await seedInitialCategories();

    const expectedSlugs = [
        ...new Set(CATALOG_PRODUCTS.flatMap((product) => product.categorySlugs)),
    ];
    const categories = await Category.find({ slug: { $in: expectedSlugs } });
    const categoriesBySlug = new Map(
        categories.map((category) => [category.slug, category]),
    );
    const missingSlugs = expectedSlugs.filter(
        (slug) => !categoriesBySlug.has(slug),
    );

    if (missingSlugs.length > 0) {
        throw new Error(`Categorias em falta: ${missingSlugs.join(", ")}`);
    }

    return categoriesBySlug;
}

/**
 * Cria ou atualiza produtos locais por nome e marca.
 *
 * @async
 * @function seedDemoProducts
 * @returns {Promise<object[]>} Produtos existentes ou criados.
 */
export async function seedCatalogProducts() {
    assertDevelopmentSeedsAllowed();

    const admin = await getSeedAdmin();
    const categoriesBySlug = await getCategoriesBySlug();
    const products = [];

    for (const productSeed of CATALOG_PRODUCTS) {
        const { categorySlugs, ...payload } = productSeed;
        const existingProduct = await Product.findOne({
            name: payload.name,
            brandName: BRAND_NAME,
        });
        const effectiveStock = existingProduct?.stock ?? payload.stock;
        const aiMetadata = buildCuratedAiMetadata(
            { ...payload, categorySlugs },
            effectiveStock,
            existingProduct?.variants ?? [],
        );
        const input = validateProductInput({
            ...payload,
            stock: effectiveStock,
            brandName: BRAND_NAME,
            imageUrl: imageUrlForProduct(payload.name),
            ...aiMetadata,
        });
        const categoryIds = categorySlugs.map(
            (slug) => categoriesBySlug.get(slug)._id,
        );

        const { stock: initialStock, ...nonStockInput } = input;
        products.push(
            await Product.findOneAndUpdate(
                { name: input.name, brandName: input.brandName },
                {
                    $set: {
                        ...nonStockInput,
                        categoryIds,
                    },
                    $setOnInsert: {
                        stock: initialStock,
                        createdBy: admin._id,
                    },
                },
                { upsert: true, new: true, runValidators: true },
            ),
        );
    }

    return products;
}

/** Alias de compatibilidade para comandos e imports anteriores. */
export const seedDemoProducts = seedCatalogProducts;

/**
 * Executa o seed de produtos como script standalone.
 *
 * @async
 * @function runSeedProductsScript
 * @returns {Promise<void>} Resolve quando o seed termina.
 */
async function runSeedProductsScript() {
    assertDevelopmentSeedsAllowed();
    await connectDB();

    try {
        const products = await seedCatalogProducts();
        console.log(`Produtos de catálogo preparados: ${products.length}`);
    } finally {
        await disconnectDB();
    }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
    await runSeedProductsScript();
}
