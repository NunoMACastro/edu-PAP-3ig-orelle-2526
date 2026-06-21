// apps/api/tests/mf4.routine-alerts.test.js
import { beforeEach, describe, expect, it, vi } from "vitest";
import { validateRoutineAlertPreferenceInput } from "../src/validators/routine-alert.validator.js";
import { createDueRoutineAlerts } from "../src/services/routine-alert.service.js";
import { DailyRoutine } from "../src/models/daily-routine.model.js";
import {
    Notification,
    NOTIFICATION_TYPES,
} from "../src/models/notification.model.js";
import { RoutineAlertPreference } from "../src/models/routine-alert-preference.model.js";

vi.mock("../src/models/daily-routine.model.js", () => ({
    DailyRoutine: { findOne: vi.fn() },
}));

vi.mock("../src/models/notification.model.js", () => ({
    NOTIFICATION_TYPES: Object.freeze({ ROUTINE_REMINDER: "routine_reminder" }),
    Notification: { create: vi.fn() },
}));

vi.mock("../src/models/routine-alert-preference.model.js", () => ({
    RoutineAlertPreference: { find: vi.fn() },
}));

function objectId(value) {
    // Simula o ObjectId usado nos documentos Mongoose dos testes.
    return { toString: () => value };
}

describe("BK-MF4-05 routine alerts", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("rejeita horários inválidos no validator", () => {
        expect(() =>
            validateRoutineAlertPreferenceInput({
                morning: { enabled: true, time: "25:90" },
                night: { enabled: true, time: "21:00" },
            }),
        ).toThrow("Horário de alerta invalido");
    });

    it("cria alerta devido e grava chave diária de idempotência", async () => {
        // Preferência com noite ativa exatamente à hora do teste.
        const preference = {
            userId: objectId("64b7f1a0f4e6f5c6d7e8f901"),
            morning: { enabled: false, time: "08:00", lastNotificationKey: null },
            night: { enabled: true, time: "21:00", lastNotificationKey: null },
            save: vi.fn().mockResolvedValue(undefined),
        };
        // O alerta só deve ser criado se já existir rotina para o utilizador.
        DailyRoutine.findOne.mockResolvedValueOnce({
            _id: objectId("64b7f1a0f4e6f5c6d7e8f902"),
            userId: preference.userId,
        });
        RoutineAlertPreference.find.mockResolvedValueOnce([preference]);
        Notification.create.mockResolvedValueOnce({
            _id: objectId("64b7f1a0f4e6f5c6d7e8f903"),
        });

        const result = await createDueRoutineAlerts(
            // Data fixa: o teste não depende do relógio real da máquina.
            new Date("2026-06-15T21:00:00.000Z"),
        );

        expect(Notification.create).toHaveBeenCalledWith(
            expect.objectContaining({
                userId: preference.userId,
                type: NOTIFICATION_TYPES.ROUTINE_REMINDER,
                title: "Hora da rotina noturna",
                resourceType: "routine",
            }),
        );
        expect(preference.night.lastNotificationKey).toBe("2026-06-15:night");
        // A preferência é guardada para impedir nova notificação igual.
        expect(preference.save).toHaveBeenCalledOnce();
        expect(result).toEqual({ createdCount: 1 });
    });

    it("não duplica alerta para o mesmo dia e período", async () => {
        // A chave já preenchida representa um alerta enviado anteriormente.
        const preference = {
            userId: objectId("64b7f1a0f4e6f5c6d7e8f901"),
            morning: { enabled: false, time: "08:00", lastNotificationKey: null },
            night: {
                enabled: true,
                time: "21:00",
                lastNotificationKey: "2026-06-15:night",
            },
            save: vi.fn().mockResolvedValue(undefined),
        };
        RoutineAlertPreference.find.mockResolvedValueOnce([preference]);

        const result = await createDueRoutineAlerts(
            new Date("2026-06-15T21:00:00.000Z"),
        );

        expect(Notification.create).not.toHaveBeenCalled();
        // Como nada foi criado, também não há motivo para persistir alterações.
        expect(preference.save).not.toHaveBeenCalled();
        expect(result).toEqual({ createdCount: 0 });
    });
});