/** Teste comportamental da persistência exclusivamente visual do tema. */
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import { ThemeControls } from "../../src/components/ThemeControls.jsx";
import { THEME_STORAGE_KEY } from "../../src/hooks/useThemePreference.js";

afterEach(() => {
    localStorage.clear();
    delete document.documentElement.dataset.theme;
});

describe("ThemeControls", () => {
    it("restaura e persiste apenas a preferência visual allowlisted", async () => {
        localStorage.setItem(THEME_STORAGE_KEY, "dark");
        const user = userEvent.setup();
        render(<ThemeControls />);

        expect(screen.getByRole("button", { name: "Tema Escuro" })).toHaveAttribute(
            "aria-pressed",
            "true",
        );
        await user.click(screen.getByRole("button", { name: "Tema Contraste" }));

        expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe("contrast");
        expect(document.documentElement.dataset.theme).toBe("contrast");
        expect(localStorage.length).toBe(1);
    });
});
