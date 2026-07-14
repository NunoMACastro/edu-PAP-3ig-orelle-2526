/** Bootstrap idempotente de dados exclusivamente para desenvolvimento local. */
import { fileURLToPath } from "node:url";
import { connectDB, disconnectDB } from "../config/db.js";
import { seedInitialCategories } from "./seed-categories.js";
import { seedCatalogProducts } from "./seed-products.js";
import { seedDemoClientData } from "./seed-client-data.js";
import { seedDemoUsers } from "./seed-users.js";
import { assertDevelopmentSeedsAllowed } from "./seed-safety.js";

export { cleanupDemoClientSeedFiles } from "./seed-client-data.js";

export async function seedLocalData() {
    assertDevelopmentSeedsAllowed();
    const users = await seedDemoUsers();
    const categories = await seedInitialCategories();
    const products = await seedCatalogProducts();
    const clientData = await seedDemoClientData();
    return { users, categories, products, clientData };
}

async function runSeedLocalScript() {
    assertDevelopmentSeedsAllowed();
    await connectDB();
    try {
        const result = await seedLocalData();
        console.log(
            `Dados locais preparados: ${result.users.length} utilizadores, ${result.categories.length} categorias, ${result.products.length} produtos e ${result.clientData.scenarios} cenários de cliente`,
        );
    } finally {
        await disconnectDB();
    }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
    await runSeedLocalScript();
}
