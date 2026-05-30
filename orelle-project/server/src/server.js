import { connectDB } from "./config/db.js";
import { env } from "./config/env.js";
import {createApp}  from "./app.js";

try {
    await connectDB();
} catch (error) {
    console.log("⚠️ Aviso: MongoDB não conectado. A avançar para o arranque do servidor...");
}
const app = createApp();

app.listen(env.port, () => {
    console.log(`Orelle API ativa em http://localhost:${env.port}`);
});