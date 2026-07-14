/** Testes do card comercial partilhado e dos helpers visuais de produto. */
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { ProductCard } from "../../src/components/ProductCard.jsx";
import {
    formatProductPrice,
    formatProductSkinTypes,
    getSafeProductColor,
} from "../../src/services/productPresentation.js";

const PRODUCT = {
    id: "product-one",
    name: "Sérum Orélle",
    brandName: "Orélle",
    description: "Cuidado cosmético de teste.",
    imageUrl: "/products/serum.png",
    priceCents: 1_590,
    stock: 4,
    skinTypes: ["seca", "sensivel"],
};

function renderCard(props = {}) {
    return render(
        <MemoryRouter>
            <ul>
                <ProductCard product={PRODUCT} {...props}>
                    <a href="#acao">Ver produto</a>
                </ProductCard>
            </ul>
        </MemoryRouter>,
    );
}

describe("ProductCard", () => {
    it("apresenta produto e ação sem aninhar todos os controlos num link", () => {
        renderCard();

        expect(screen.getByRole("heading", { name: PRODUCT.name, level: 2 })).toBeVisible();
        expect(screen.getByRole("link", { name: `Ver ${PRODUCT.name}` })).toBeVisible();
        expect(screen.getByText("Seca / Sensível")).toBeVisible();
        expect(screen.getByText("15.90 EUR")).toBeVisible();
        expect(screen.getByText("Disponível")).toBeVisible();
        expect(screen.getByText(PRODUCT.description)).toBeVisible();
    });

    it("usa heading configurável e omite descrição no modo compacto", () => {
        renderCard({ headingLevel: 3, variant: "compact", statusLabel: null });

        expect(screen.getByRole("heading", { name: PRODUCT.name, level: 3 })).toBeVisible();
        expect(screen.queryByText(PRODUCT.description)).not.toBeInTheDocument();
        expect(screen.queryByText("Disponível")).not.toBeInTheDocument();
    });
});

describe("apresentação segura de produto", () => {
    it("formata preço e pele e aceita apenas cores hexadecimais completas", () => {
        expect(formatProductPrice(2_990)).toBe("29.90 EUR");
        expect(formatProductSkinTypes(["normal", "future_type"])).toBe(
            "Normal / Tipo de pele indisponível",
        );
        expect(getSafeProductColor("#AABBCC")).toBe("#AABBCC");
        expect(getSafeProductColor("red")).toBeNull();
        expect(getSafeProductColor("#fff; background:url(x)")).toBeNull();
    });
});
