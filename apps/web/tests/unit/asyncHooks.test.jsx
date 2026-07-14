/**
 * Testes de lifecycle dos hooks assíncronos reutilizáveis.
 */
import { act, renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useAsyncAction } from "../../src/hooks/useAsyncAction.js";
import { useAsyncResource } from "../../src/hooks/useAsyncResource.js";

/** Cria uma promise controlável sem temporizadores. */
function deferred() {
    let resolve;
    let reject;
    const promise = new Promise((resolvePromise, rejectPromise) => {
        resolve = resolvePromise;
        reject = rejectPromise;
    });

    return { promise, resolve, reject };
}

describe("useAsyncResource", () => {
    it("impede que uma resposta antiga substitua a leitura mais recente", async () => {
        const first = deferred();
        const second = deferred();
        const loader = vi
            .fn()
            .mockImplementationOnce(() => first.promise)
            .mockImplementationOnce(() => second.promise);
        const { result } = renderHook(() => useAsyncResource(loader));

        let firstRun;
        let secondRun;
        act(() => {
            firstRun = result.current.load("primeira");
        });
        act(() => {
            secondRun = result.current.load("segunda");
        });

        await act(async () => {
            second.resolve("resultado atual");
            await secondRun;
        });
        expect(result.current.data).toBe("resultado atual");

        await act(async () => {
            first.resolve("resultado antigo");
            await firstRun;
        });
        expect(result.current.data).toBe("resultado atual");
    });

    it("preserva dados válidos quando um refresh falha", async () => {
        const loader = vi
            .fn()
            .mockResolvedValueOnce({ total: 3 })
            .mockRejectedValueOnce(new Error("offline"));
        const { result } = renderHook(() => useAsyncResource(loader));

        await act(async () => {
            await result.current.load();
        });
        expect(result.current.data).toEqual({ total: 3 });

        await act(async () => {
            await result.current.load();
        });

        expect(result.current.status).toBe("error");
        expect(result.current.error.message).toBe("offline");
        expect(result.current.data).toEqual({ total: 3 });
    });

    it("aborta a leitura ativa quando o componente desmonta", async () => {
        let observedSignal;
        const loader = vi.fn(({ signal }) => {
            observedSignal = signal;
            return new Promise(() => {});
        });
        const { result, unmount } = renderHook(() => useAsyncResource(loader));

        act(() => {
            void result.current.load();
        });
        await waitFor(() => expect(observedSignal).toBeDefined());

        unmount();
        expect(observedSignal.aborted).toBe(true);
    });
});

describe("useAsyncAction", () => {
    it("mantém o último resultado quando uma ação posterior falha", async () => {
        const action = vi
            .fn()
            .mockResolvedValueOnce({ saved: true })
            .mockRejectedValueOnce(new Error("conflito"));
        const { result } = renderHook(() => useAsyncAction(action));

        await act(async () => {
            await result.current.run();
        });
        expect(result.current.result).toEqual({ saved: true });

        await act(async () => {
            await result.current.run();
        });
        expect(result.current.status).toBe("error");
        expect(result.current.error.message).toBe("conflito");
        expect(result.current.result).toEqual({ saved: true });
    });
});
