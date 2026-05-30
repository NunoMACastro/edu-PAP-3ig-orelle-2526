import 'dotenv/config';
import mongoose from "mongoose";
import {env} from "./env.js";

export async function connectDB() {
    mongoose.set("strictQuery", true);
    await mongoose.connect(env.mongoUri);
}

export async function disconnectDB() {
    await mongoose.disconnect();
}