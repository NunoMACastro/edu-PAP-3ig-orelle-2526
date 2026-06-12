/**
 * Modelo de simulacao de maquilhagem da MF2.
 */
import mongoose from "mongoose";

const { Schema, model } = mongoose;

const panelSchema = new Schema(
    {
        label: { type: String, required: true },
        description: { type: String, required: true },
        accentColor: { type: String, required: true },
    },
    { _id: false },
);

const visualPreviewSchema = new Schema(
    {
        type: {
            type: String,
            enum: ["safe_svg_preview"],
            required: true,
        },
        beforeImageUrl: { type: String, required: true },
        afterImageUrl: { type: String, required: true },
        altText: { type: String, required: true },
    },
    { _id: false },
);

const makeupSimulationSchema = new Schema(
    {
        userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
        facePhotoId: { type: Schema.Types.ObjectId, ref: "FacePhoto", required: true },
        consentId: { type: Schema.Types.ObjectId, ref: "FaceConsent", required: true },
        productId: { type: Schema.Types.ObjectId, ref: "Product", required: true },
        providerName: { type: String, required: true },
        preview: {
            beforePanel: { type: panelSchema, required: true },
            afterPanel: { type: panelSchema, required: true },
            overlay: {
                style: { type: String, required: true },
                productName: { type: String, required: true },
                accentColor: { type: String, required: true },
            },
            visual: { type: visualPreviewSchema, required: true },
            limitations: { type: [String], required: true },
        },
    },
    { timestamps: true },
);

export const MakeupSimulation = model("MakeupSimulation", makeupSimulationSchema);
