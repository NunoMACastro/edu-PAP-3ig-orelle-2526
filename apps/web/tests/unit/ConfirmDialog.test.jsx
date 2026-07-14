/**
 * Testes comportamentais do diálogo destrutivo acessível.
 */
import { useState } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ConfirmDialog } from "../../src/components/ConfirmDialog.jsx";

const DIALOG_PROPS = Object.freeze({
    title: "Eliminar conta",
    description: "Esta ação é irreversível.",
    confirmationText: "ELIMINAR",
    confirmLabel: "Eliminar definitivamente",
});

describe("ConfirmDialog", () => {
    it("exige a confirmação literal antes de executar a ação", async () => {
        const user = userEvent.setup();
        const onConfirm = vi.fn();

        render(
            <ConfirmDialog
                {...DIALOG_PROPS}
                open
                onCancel={vi.fn()}
                onConfirm={onConfirm}
            />,
        );

        const input = screen.getByRole("textbox", { name: /Escreve ELIMINAR/i });
        const confirmButton = screen.getByRole("button", {
            name: "Eliminar definitivamente",
        });

        expect(input).toHaveFocus();
        expect(confirmButton).toBeDisabled();

        await user.type(input, "eliminar");
        expect(confirmButton).toBeDisabled();

        await user.clear(input);
        await user.type(input, "ELIMINAR");
        await user.click(confirmButton);

        expect(onConfirm).toHaveBeenCalledTimes(1);
    });

    it("fecha por Escape e restitui o foco ao trigger", async () => {
        const user = userEvent.setup();

        function Harness() {
            const [open, setOpen] = useState(false);

            return (
                <>
                    <button type="button" onClick={() => setOpen(true)}>
                        Abrir eliminação
                    </button>
                    <ConfirmDialog
                        {...DIALOG_PROPS}
                        open={open}
                        onCancel={() => setOpen(false)}
                        onConfirm={vi.fn()}
                    />
                </>
            );
        }

        render(<Harness />);
        const trigger = screen.getByRole("button", { name: "Abrir eliminação" });

        await user.click(trigger);
        expect(screen.getByRole("dialog")).toBeInTheDocument();

        await user.keyboard("{Escape}");

        expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
        expect(trigger).toHaveFocus();
    });

    it("mantém o foco no modal quando a confirmação entra em estado busy", async () => {
        const user = userEvent.setup();

        function Harness() {
            const [open, setOpen] = useState(false);
            const [busy, setBusy] = useState(false);

            return (
                <>
                    <button type="button" onClick={() => setOpen(true)}>
                        Abrir operação
                    </button>
                    <ConfirmDialog
                        {...DIALOG_PROPS}
                        open={open}
                        busy={busy}
                        onCancel={() => setOpen(false)}
                        onConfirm={() => setBusy(true)}
                    />
                </>
            );
        }

        render(<Harness />);
        const trigger = screen.getByRole("button", { name: "Abrir operação" });
        await user.click(trigger);
        await user.type(
            screen.getByRole("textbox", { name: /Escreve ELIMINAR/i }),
            "ELIMINAR",
        );
        await user.click(
            screen.getByRole("button", { name: "Eliminar definitivamente" }),
        );

        const dialog = screen.getByRole("dialog");
        expect(dialog).toHaveAttribute("aria-busy", "true");
        expect(dialog).toHaveFocus();
        expect(trigger).not.toHaveFocus();
    });

    it("mantém um erro público da ação dentro do modal", () => {
        render(
            <ConfirmDialog
                {...DIALOG_PROPS}
                open
                error={{
                    message: "A conta já não pode ser eliminada.",
                    requestId: "req-delete-1",
                }}
                onCancel={vi.fn()}
                onConfirm={vi.fn()}
            />,
        );

        const dialog = screen.getByRole("dialog");
        expect(dialog).toHaveTextContent("A conta já não pode ser eliminada.");
        expect(dialog).toHaveTextContent("Referência do pedido: req-delete-1");
    });
});
