/**
 * Script local para criar categorias iniciais da MF0.
 *
 * O BK-MF0-08 exige que o seed nao duplique categorias. A idempotencia fica no
 * service `seedCategory`, que usa `slug` como chave.
 */
import { connectDB, disconnectDB } from "../config/db.js";
import { seedCategory } from "../services/category.service.js";
import { slugify } from "../validators/category.validator.js";

const INITIAL_CATEGORIES = [
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

await connectDB();

for (const category of INITIAL_CATEGORIES) {
    await seedCategory({
        ...category,
        slug: slugify(category.name),
    });
}

await disconnectDB();

console.log("Categorias iniciais preparadas");
