import 'dotenv/config';
import { connectDB } from "./config/db.js";
import { env } from "./config/env.js";
import { createApp } from "./app.js";

//await connectDB();

const app = createApp();

app.listen(env.port, () => {
    console.log(`Orelle API ativa em http://localhost:${env.port}`);
});