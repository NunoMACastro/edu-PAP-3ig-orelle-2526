/**
 * Concorrência real do carrinho sobre replica set efémero loopback.
 */
import mongoose from "mongoose";
import { MongoMemoryReplSet } from "mongodb-memory-server";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { Cart } from "../src/models/cart.model.js";
import { Product } from "../src/models/product.model.js";
import { addItemToCart } from "../src/services/cart.service.js";

const DATABASE_NAME = "orelle_cart_concurrency_test";
let replicaSet;

function assertEphemeralUri(uri) {
    if (
        !uri.startsWith("mongodb://127.0.0.1:") ||
        !uri.includes(`/${DATABASE_NAME}?`) ||
        !uri.includes("replicaSet=") ||
        uri.includes("@")
    ) {
        throw new Error("URI externa recusada no teste concorrente do carrinho");
    }
}

async function createProduct(label, stock = 100) {
    return Product.create({
        name: `Produto cart ${label}`,
        brandName: "Orélle Test",
        description: "Produto efémero para concorrência do carrinho.",
        ingredientNames: ["teste"],
        skinTypes: ["normal"],
        imageUrl: `/test/${label}.webp`,
        priceCents: 900,
        stock,
        categoryIds: [],
        createdBy: new mongoose.Types.ObjectId(),
    });
}

beforeAll(async () => {
    replicaSet = await MongoMemoryReplSet.create({
        replSet: { count: 1, storageEngine: "wiredTiger" },
        instanceOpts: [{ ip: "127.0.0.1" }],
    });
    const uri = replicaSet.getUri(DATABASE_NAME);
    assertEphemeralUri(uri);
    await mongoose.connect(uri);
    await Promise.all([Cart.syncIndexes(), Product.syncIndexes()]);
}, 30_000);

afterEach(async () => {
    await Promise.all([Cart.deleteMany({}), Product.deleteMany({})]);
});

afterAll(async () => {
    await mongoose.disconnect();
    await replicaSet?.stop();
});

describe("carrinho concorrente", () => {
    it("soma 25 adds sem duplicar carrinho nem perder incrementos", async () => {
        const userId = new mongoose.Types.ObjectId();
        const product = await createProduct("same", 50);

        await Promise.all(
            Array.from({ length: 25 }, () =>
                addItemToCart(userId.toString(), {
                    productId: product._id.toString(),
                    quantity: 1,
                }),
            ),
        );

        const cart = await Cart.findOne({ userId });
        expect(await Cart.countDocuments({ userId })).toBe(1);
        expect(cart.items).toHaveLength(1);
        expect(cart.items[0].quantity).toBe(25);
    });

    it("preserva produtos diferentes adicionados em paralelo", async () => {
        const userId = new mongoose.Types.ObjectId();
        const [first, second] = await Promise.all([
            createProduct("first"),
            createProduct("second"),
        ]);

        await Promise.all([
            ...Array.from({ length: 10 }, () =>
                addItemToCart(userId.toString(), {
                    productId: first._id.toString(),
                    quantity: 1,
                }),
            ),
            ...Array.from({ length: 10 }, () =>
                addItemToCart(userId.toString(), {
                    productId: second._id.toString(),
                    quantity: 1,
                }),
            ),
        ]);

        const cart = await Cart.findOne({ userId });
        expect(cart.items).toHaveLength(2);
        expect(cart.items.map((item) => item.quantity).sort()).toEqual([10, 10]);
    });

    it("não ultrapassa stock quando 30 adds disputam 20 unidades", async () => {
        const userId = new mongoose.Types.ObjectId();
        const product = await createProduct("stock", 20);

        const outcomes = await Promise.allSettled(
            Array.from({ length: 30 }, () =>
                addItemToCart(userId.toString(), {
                    productId: product._id.toString(),
                    quantity: 1,
                }),
            ),
        );

        expect(outcomes.filter((outcome) => outcome.status === "fulfilled")).toHaveLength(20);
        expect(
            outcomes
                .filter((outcome) => outcome.status === "rejected")
                .every((outcome) => outcome.reason?.statusCode === 409),
        ).toBe(true);
        const cart = await Cart.findOne({ userId });
        expect(cart.items[0].quantity).toBe(20);
    });
});
