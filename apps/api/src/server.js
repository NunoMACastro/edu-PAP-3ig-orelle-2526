/**
 * Entrada do servidor HTTP da API Orélle.
 *
 * Este ficheiro faz apenas duas coisas: liga ao MongoDB e abre a porta HTTP.
 * A configuracao das rotas fica em `app.js`, para manter responsabilidades
 * separadas e facilitar testes.
 */
import { connectDB } from "./config/db.js";
import { env } from "./config/env.js";
import { createApp } from "./app.js";

await connectDB();

const app = createApp();

app.listen(env.port, () => {
    console.log(`Orelle API ativa em http://localhost:${env.port}`);
});
