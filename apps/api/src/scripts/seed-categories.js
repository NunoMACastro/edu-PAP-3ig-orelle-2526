/**
 * Script local para criar categorias iniciais da MF0.
 *
 * O BK-MF0-08 exige que o seed nao duplique categorias. A idempotencia fica no
 * service `seedCategory`, que usa `slug` como chave.
 */
import { fileURLToPath } from "node:url";
import { connectDB, disconnectDB } from "../config/db.js";
import { seedCategory } from "../services/category.service.js";
import { slugify } from "../validators/category.validator.js";
import { assertDevelopmentSeedsAllowed } from "./seed-safety.js";

export const INITIAL_CATEGORIES = [
    { name: "Limpeza", description: "Produtos de limpeza diaria da pele" },
    {
        name: "Maquilhagem",
        description: "Produtos de maquilhagem e acabamento",
    },
    {
        name: "Tratamento",
        description: "Produtos cosmeticos de cuidado da pele",
    },
    {
        name: "Protetor Solar",
        description: "Produtos cosmeticos com protecao solar",
    },
];

/**
 * Cria as categorias iniciais do catalogo sem duplicar `slug`.
 *
 * @async
 * @function seedInitialCategories
 * @returns {Promise<object[]>} Categorias existentes ou criadas.
 */
export async function seedInitialCategories() {
    assertDevelopmentSeedsAllowed();
    const categories = [];

    for (const category of INITIAL_CATEGORIES) {
        categories.push(
            await seedCategory({
                ...category,
                slug: slugify(category.name),
            }),
        );
    }

    return categories;
}

/**
 * Executa o seed de categorias como script standalone.
 *
 * @async
 * @function runSeedCategoriesScript
 * @returns {Promise<void>} Resolve quando o seed termina.
 */
async function runSeedCategoriesScript() {
    assertDevelopmentSeedsAllowed();
    await connectDB();

    try {
        await seedInitialCategories();
        console.log("Categorias iniciais preparadas");
    } finally {
        await disconnectDB();
    }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
    await runSeedCategoriesScript();
}
