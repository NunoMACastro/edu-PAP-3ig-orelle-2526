/** Testes da identidade visual reutilizável da Orélle. */
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { BrandLogo } from "../../src/components/BrandLogo.jsx";

describe("BrandLogo", () => {
    it("mantém o símbolo decorativo e o nome legível na variante compacta", () => {
        const { container } = render(<BrandLogo priority />);

        expect(screen.getByText("Orélle")).toBeVisible();
        const image = container.querySelector("img");
        expect(image).toHaveAttribute("alt", "");
        expect(image).toHaveAttribute("fetchpriority", "high");
        expect(image).toHaveAttribute("width", "128");
        expect(container.querySelectorAll("source")).toHaveLength(2);
    });

    it("apresenta a assinatura completa com nome acessível", () => {
        render(<BrandLogo variant="full" />);

        const image = screen.getByRole("img", {
            name: "Orélle — Consultoria Cosmética Inteligente",
        });
        expect(image).toHaveAttribute("width", "640");
        expect(image).toHaveAttribute("height", "574");
        expect(image).toHaveAttribute("loading", "lazy");
    });

    it("permite escolher o contraste sem reintroduzir um fundo", () => {
        const { container } = render(<BrandLogo tone="light" />);

        expect(container.firstChild).toHaveClass("brand-logo--tone-light");
        expect(container.querySelector("img")).toHaveAttribute(
            "src",
            "/brand/orelle-mark-128.png",
        );
    });
});
