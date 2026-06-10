import mongoose from "mongoose";

const { Schema, model } = mongoose;

const previewPanelSchema = new Schema(
    {
        label: { type: String, required: true },
        description: { type: String, required: true },
        accentColor: { type: String, default: null },
    },
    { _id: false },
);

const makeupPreviewSchema = new Schema(
    {
        mode: { type: String, enum: ["local_overlay"], required: true },
        beforePanel: { type: previewPanelSchema, required: true },
        afterPanel: { type: previewPanelSchema, required: true },
        overlayDescription: { type: String, required: true },
        limitations: { type: [String], required: true },
    },
    { _id: false },
);

const makeupSimulationSchema = new Schema(
    {
        userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
        consentId: { type: Schema.Types.ObjectId, ref: "FaceConsent", required: true },
        facePhotoId: { type: Schema.Types.ObjectId, ref: "FacePhoto", required: true },
        productId: { type: Schema.Types.ObjectId, ref: "Product", required: true },
        preview: { type: makeupPreviewSchema, required: true },
    },
    { timestamps: true },
);

makeupSimulationSchema.index({ userId: 1, createdAt: -1 });
export const MakeupSimulation = model("MakeupSimulation", makeupSimulationSchema);