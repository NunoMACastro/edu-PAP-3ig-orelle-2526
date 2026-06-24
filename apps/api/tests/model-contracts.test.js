/**
 * Testes de contrato dos modelos MF0.
 *
 * Estes testes garantem defaults documentados nos guias BK sem abrir ligacao
 * MongoDB. O campo `isActive` fica preparado para fases posteriores, sem criar
 * fluxos de ativacao/desativacao nesta macrofase.
 */
import { describe, expect, it } from "vitest";
import { Category } from "../src/models/category.model.js";
import { User } from "../src/models/user.model.js";

describe("Contratos de modelos MF0", () => {
    it("cria User ativo por defeito", () => {
        const user = new User({
            email: "cliente@orelle.test",
            passwordHash: "hash-seguro",
        });

        expect(user.isActive).toBe(true);
    });

    it("cria Category ativa por defeito", () => {
        const category = new Category({
            name: "Limpeza",
            slug: "limpeza",
        });

        expect(category.isActive).toBe(true);
    });
});
