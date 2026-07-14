/**
 * Integração comercial de variantes sobre replica set efémero.
 * Prova a identidade `productId + variantId` e a redução conjunta de stock.
 */
import mongoose from "mongoose";
import { MongoMemoryReplSet } from "mongodb-memory-server";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { Cart } from "../src/models/cart.model.js";
import { Order } from "../src/models/order.model.js";
import { Product } from "../src/models/product.model.js";
import { Voucher } from "../src/models/voucher.model.js";
import { addItemToCart } from "../src/services/cart.service.js";
import {
    checkoutMyCart,
    simulateOrderPayment,
} from "../src/services/order.service.js";

const DATABASE_NAME = "orelle_catalog_variants_test";
let replicaSet;

beforeAll(async () => {
    replicaSet = await MongoMemoryReplSet.create({
        replSet: { count: 1, storageEngine: "wiredTiger" },
        instanceOpts: [{ ip: "127.0.0.1" }],
    });
    const uri = replicaSet.getUri(DATABASE_NAME);
    if (!uri.startsWith("mongodb://127.0.0.1:") || uri.includes("@")) {
        throw new Error("Teste de variantes recusou URI não efémera");
    }
    await mongoose.connect(uri);
    await Promise.all([
        Product.syncIndexes(),
        Cart.syncIndexes(),
        Order.syncIndexes(),
        Voucher.syncIndexes(),
    ]);
}, 30_000);

afterAll(async () => {
    await mongoose.disconnect();
    await replicaSet?.stop();
});

describe("catálogo e checkout com variantes", () => {
    it("mantém linhas separadas e reduz variante e agregado atomicamente", async () => {
        const userId = new mongoose.Types.ObjectId();
        const product = await Product.create({
            name: "Base académica",
            brandName: "Orelle",
            description: "Base cosmética com variantes para teste comercial.",
            ingredientNames: ["iron oxides"],
            skinTypes: ["normal"],
            imageUrl: "https://example.test/base.webp",
            priceCents: 2000,
            stock: 10,
            createdBy: new mongoose.Types.ObjectId(),
            aiEligible: true,
            concernTags: ["makeup"],
            routineSteps: ["complexion"],
            inciIngredients: ["iron oxides"],
            variants: [
                {
                    variantId: "light-neutral",
                    label: "Claro neutro",
                    colorHex: "#D9AE8D",
                    undertone: "neutral",
                    finish: "natural",
                    coverage: "medium",
                    stock: 5,
                },
                {
                    variantId: "deep-warm",
                    label: "Profundo quente",
                    colorHex: "#74432D",
                    undertone: "warm",
                    finish: "natural",
                    coverage: "medium",
                    stock: 5,
                },
            ],
        });

        await addItemToCart(userId.toString(), {
            productId: product._id.toString(),
            variantId: "light-neutral",
            quantity: 2,
        });
        const cart = await addItemToCart(userId.toString(), {
            productId: product._id.toString(),
            variantId: "deep-warm",
            quantity: 1,
        });

        expect(cart.items).toHaveLength(2);
        expect(new Set(cart.items.map(({ variantId }) => variantId))).toEqual(
            new Set(["light-neutral", "deep-warm"]),
        );

        const checkout = await checkoutMyCart(userId.toString());
        expect(checkout.items.map(({ variantId }) => variantId).sort()).toEqual([
            "deep-warm",
            "light-neutral",
        ]);

        const paid = await simulateOrderPayment(
            userId.toString(),
            checkout.id,
            "variant-checkout-idempotency-key",
        );
        expect(paid.payment.status).toBe("simulated_paid");

        const persisted = await Product.findById(product._id);
        expect(persisted.stock).toBe(7);
        expect(
            Object.fromEntries(
                persisted.variants.map(({ variantId, stock }) => [
                    variantId,
                    stock,
                ]),
            ),
        ).toEqual({ "light-neutral": 3, "deep-warm": 4 });
        expect(await Cart.countDocuments({ userId })).toBe(0);
    });

    it("recusa carrinho legado sem variante quando o produto já tem variantes", async () => {
        const userId = new mongoose.Types.ObjectId();
        const product = await Product.create({
            name: "Corretor académico",
            brandName: "Orelle",
            description: "Corretor cosmético com duas variantes para teste.",
            ingredientNames: ["mica"],
            skinTypes: ["normal"],
            imageUrl: "https://example.test/corrector.webp",
            priceCents: 1500,
            stock: 6,
            createdBy: new mongoose.Types.ObjectId(),
            variants: [
                { variantId: "light", label: "Claro", stock: 3 },
                { variantId: "deep", label: "Profundo", stock: 3 },
            ],
        });
        await Cart.create({
            userId,
            items: [
                {
                    productId: product._id,
                    quantity: 1,
                    priceSnapshotCents: 1500,
                    productNameSnapshot: product.name,
                },
            ],
        });

        await expect(checkoutMyCart(userId.toString())).rejects.toMatchObject({
            statusCode: 400,
            message: "Escolhe uma variante do produto",
        });
        const unchanged = await Product.findById(product._id);
        expect(unchanged.stock).toBe(6);
        expect(unchanged.variants.map(({ stock }) => stock)).toEqual([3, 3]);
    });
});
