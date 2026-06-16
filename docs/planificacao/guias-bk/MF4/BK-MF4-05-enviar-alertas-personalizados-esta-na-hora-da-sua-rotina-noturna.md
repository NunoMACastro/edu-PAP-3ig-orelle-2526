# BK-MF4-05 - Enviar alertas personalizados (“Está na hora da sua rotina noturna”)

## Header
- `doc_id`: `GUIA-BK-MF4-05`
- `bk_id`: `BK-MF4-05`
- `macro`: `MF4`
- `owner`: `Izelicks`
- `apoio`: `Bruna`
- `prioridade`: `P1`
- `estado`: `TODO`
- `esforco`: `S`
- `dependencias`: `BK-MF2-05`
- `rf_rnf`: `RF37`
- `fase_documental`: `Fase 2`
- `sprint`: `S08-S09`
- `core_or_reforco`: `Core`
- `proximo_bk`: `BK-MF4-08`
- `guia_path`: `docs/planificacao/guias-bk/MF4/BK-MF4-05-enviar-alertas-personalizados-esta-na-hora-da-sua-rotina-noturna.md`
- `last_updated`: `2026-06-15`

#### Objetivo
Criar alertas personalizados de rotina diária para o utilizador autenticado, usando a rotina gerada em `BK-MF2-05` e as notificações internas criadas em `BK-MF4-04`.

#### Importância
Rotinas só ajudam se forem seguidas. Um alerta simples, consentido e configurável aumenta adesão sem fazer promessas clínicas nem pressionar compra. O utilizador deve poder ligar/desligar horários.

#### Scope-in
- Criar preferências de alerta por utilizador.
- Permitir configurar alertas de manhã e noite.
- Criar função que gera notificações internas quando há rotina ativa.
- Criar endpoint do utilizador para guardar preferências.
- Criar endpoint admin protegido para executar a criação de alertas devidos.
- Criar página React de configuração.

#### Scope-out
- Não criar notificações push externas.
- Não enviar email ou SMS.
- Não criar agendador distribuído complexo.
- Não criar recomendação nova neste BK.
- Não prometer resultado clínico por cumprir rotina.

#### Estado antes e depois
- Antes: `BK-MF2-05` gerava rotina, mas não havia lembretes.
- Depois: cada utilizador pode guardar horários de alerta e receber notificações internas de rotina.

#### Pre-requisitos
- `BK-MF2-05`: `DailyRoutine` com passos de manhã e noite.
- `BK-MF4-04`: `Notification` e inbox interna.
- `BK-MF0-02`: sessão autenticada.
- `RF37`: alertas personalizados de rotina.

#### Glossário
- Rotina: conjunto de passos de manhã/noite gerado a partir de recomendações.
- Preferência de alerta: configuração do utilizador para receber lembretes.
- Janela de envio: momento lógico em que a app cria o alerta.
- Notificação interna: mensagem visível na app, sem provider externo.
- Idempotência mínima: evitar criar o mesmo alerta várias vezes no mesmo dia e período.

#### Conceitos teóricos essenciais
Um alerta personalizado deve respeitar escolha do utilizador. Por isso, a preferência fica por utilizador e pode ser desligada.

Gerar alertas não deve recalcular recomendações nem alterar rotina. O service apenas lê `DailyRoutine` e cria uma `Notification` curta.

Para manter o BK executável sem introduzir agendador distribuído, a regra fica isolada em `createDueRoutineAlerts(now)` e é exposta por `POST /api/admin/routine-alerts/run`. Esta rota é protegida por role admin, recebe opcionalmente um `now` ISO para teste controlado e mantém idempotência por dia e período.

#### Arquitetura do BK
- `routine-alert-preference.model.js`: guarda horários e estado.
- `routine-alert.validator.js`: valida preferências.
- `routine-alert.service.js`: guarda preferências e cria alertas devidos.
- `routine-alert.controller.js`: endpoints do utilizador e execução admin.
- `routine-alert.routes.js`: routes autenticadas e route admin protegida.
- `RoutineAlertsPage.jsx`: UI de configuração.
- `notification.service.js`: contrato consumido para criar notificações.

#### Ficheiros a criar/editar/rever
- CRIAR: `apps/api/src/models/routine-alert-preference.model.js`
- CRIAR: `apps/api/src/validators/routine-alert.validator.js`
- CRIAR: `apps/api/src/services/routine-alert.service.js`
- CRIAR: `apps/api/src/controllers/routine-alert.controller.js`
- CRIAR: `apps/api/src/routes/routine-alert.routes.js`
- EDITAR: `apps/api/src/app.js`
- CRIAR: `apps/web/src/pages/RoutineAlertsPage.jsx`
- EDITAR: `apps/web/src/App.jsx`
- REVER: `apps/api/src/models/daily-routine.model.js`
- REVER: `apps/api/src/models/notification.model.js`

#### Tutorial técnico linear
### Passo 1 - Confirmar contrato de alertas

1. Objetivo funcional do passo no contexto da app.

ligar `RF37` a rotinas existentes, não a novas recomendações.
2. Ficheiros envolvidos:
   - REVER: `docs/RF.md`
   - REVER: `docs/planificacao/guias-bk/MF2/BK-MF2-05-o-sistema-deve-sugerir-rotinas-diarias-manha-noite-com-base-nos-produtos-adquiridos.md`
   - REVER: `docs/planificacao/guias-bk/MF4/BK-MF4-04-enviar-notificacoes-sobre-promocoes-novos-produtos-e-estado-das-encomendas.md`
3. Instruções do que fazer.

confirmar que alerta consome `DailyRoutine` e produz `Notification`.
4. Código completo, correto e integrado com a app final.

```text
Contrato do BK: rotina existente + preferência ativa -> notificação interna de lembrete.
```

5. Explicação do código.

este contrato define o fluxo antes de criar ficheiros: o alerta não inventa rotinas novas, apenas observa uma rotina já existente e uma preferência ativa do utilizador. Para os alunos, isto ajuda a separar responsabilidades: o BK da rotina decide o que recomendar; este BK decide quando lembrar o utilizador. A saída também fica clara desde o início: uma notificação interna, coerente com o BK-MF4-04, sem depender de email, push ou SMS.
6. Validação do passo.

o PR não deve alterar ranking de recomendações.
7. Cenário negativo/erro esperado.

recalcular rotina dentro do alerta mistura responsabilidades e torna o fluxo difícil de testar.

### Passo 2 - Criar modelo de preferência

1. Objetivo funcional do passo no contexto da app.

guardar horários e estado por utilizador.
2. Ficheiros envolvidos:
   - CRIAR: `apps/api/src/models/routine-alert-preference.model.js`
   - LOCALIZAÇÃO: ficheiro completo.
3. Instruções do que fazer.

criar schema único por `userId`.
4. Código completo, correto e integrado com a app final.

```js
// apps/api/src/models/routine-alert-preference.model.js
import mongoose from "mongoose";

const { Schema, model } = mongoose;

const routineAlertWindowSchema = new Schema(
    {
        // Permite ligar/desligar cada período sem apagar o horário escolhido.
        enabled: {
            type: Boolean,
            default: false,
        },
        // O formato HH:mm é simples para UI, API e testes.
        time: {
            type: String,
            match: /^([01]\d|2[0-3]):[0-5]\d$/,
            default: "21:00",
        },
        // Guarda a última chave dia/período notificada, por exemplo 2026-06-15:night.
        // É o mecanismo que impede enviar o mesmo lembrete várias vezes no mesmo dia.
        lastNotificationKey: {
            type: String,
            default: "",
        },
    },
    { _id: false },
);

const routineAlertPreferenceSchema = new Schema(
    {
        // Uma preferência por utilizador evita configurações contraditórias.
        userId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
            unique: true,
            index: true,
        },
        morning: {
            type: routineAlertWindowSchema,
            default: () => ({ enabled: false, time: "08:00" }),
        },
        night: {
            type: routineAlertWindowSchema,
            default: () => ({ enabled: false, time: "21:00" }),
        },
    },
    { timestamps: true },
);

/**
 * Modelo Mongoose de preferências de alertas de rotina.
 *
 * @type {import("mongoose").Model}
 */
export const RoutineAlertPreference = model(
    "RoutineAlertPreference",
    routineAlertPreferenceSchema,
);
```

5. Explicação do código.

o modelo guarda uma única configuração por utilizador, com janelas independentes para manhã e noite. `enabled` decide se o alerta está ativo, `time` guarda a hora no formato `HH:mm` e `lastNotificationKey` regista o último dia/período já notificado. Esse último campo é didaticamente importante: sem ele, uma execução repetida do processo poderia criar várias notificações iguais para o mesmo lembrete.
6. Validação do passo.

criar preferência e confirmar índice único por `userId`.
7. Cenário negativo/erro esperado.

guardar várias preferências por utilizador cria alertas contraditórios.

### Passo 3 - Criar validator

1. Objetivo funcional do passo no contexto da app.

normalizar checkboxes e horários.
2. Ficheiros envolvidos:
   - CRIAR: `apps/api/src/validators/routine-alert.validator.js`
   - LOCALIZAÇÃO: ficheiro completo.
3. Instruções do que fazer.

validar `HH:mm`, booleanos e o `now` ISO opcional da execução admin.
4. Código completo, correto e integrado com a app final.

```js
// apps/api/src/validators/routine-alert.validator.js
import { AppError } from "../middlewares/error.middleware.js";

const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

function parseOptionalDate(value) {
    if (value === undefined) {
        return new Date();
    }

    if (typeof value !== "string") {
        throw new AppError(400, "Campo now deve ser uma data ISO");
    }

    const parsed = new Date(value);

    if (Number.isNaN(parsed.getTime())) {
        throw new AppError(400, "Campo now deve ser uma data ISO valida");
    }

    return parsed;
}

/**
 * Valida preferências de alerta de rotina.
 *
 * @function validateRoutineAlertPreferenceInput
 * @param {Record<string, unknown>} body - Body recebido.
 * @returns {{morning: {enabled: boolean, time: string}, night: {enabled: boolean, time: string}}} Preferência normalizada.
 */
export function validateRoutineAlertPreferenceInput(body) {
    const input = {
        morning: {
            enabled: Boolean(body.morning?.enabled),
            time: String(body.morning?.time ?? "08:00").trim(),
        },
        night: {
            enabled: Boolean(body.night?.enabled),
            time: String(body.night?.time ?? "21:00").trim(),
        },
    };

    for (const period of ["morning", "night"]) {
        if (!TIME_RE.test(input[period].time)) {
            throw new AppError(400, "Horário de alerta invalido");
        }
    }

    return input;
}

/**
 * Valida input da execução admin de alertas devidos.
 *
 * @function validateRoutineAlertRunInput
 * @param {Record<string, unknown>} body - Body recebido.
 * @returns {{now: Date}} Momento de avaliação.
 */
export function validateRoutineAlertRunInput(body = {}) {
    return {
        now: parseOptionalDate(body.now),
    };
}
```

5. Explicação do código.

o backend volta a validar tudo mesmo que o frontend use `input type="time"`, porque qualquer pessoa pode chamar a API diretamente. A data opcional da execução admin torna os testes previsíveis: em vez de depender da hora real da máquina, o teste escolhe um `now` fixo e confirma se o alerta deve ou não ser criado. Isto torna a regra de idempotência mais fácil de compreender e provar.
6. Validação do passo.

enviar `25:90` e esperar `400`; enviar `now: "abc"` em execução admin e esperar `400`.
7. Cenário negativo/erro esperado.

confiar no input do browser permite payloads inválidos por API direta.

### Passo 4 - Criar service de preferências e alertas

1. Objetivo funcional do passo no contexto da app.

guardar preferências e criar notificações no momento devido.
2. Ficheiros envolvidos:
   - CRIAR: `apps/api/src/services/routine-alert.service.js`
   - LOCALIZAÇÃO: ficheiro completo.
3. Instruções do que fazer.

criar `get`, `update` e `createDueRoutineAlerts`.
4. Código completo, correto e integrado com a app final.

```js
// apps/api/src/services/routine-alert.service.js
import { AppError } from "../middlewares/error.middleware.js";
import { DailyRoutine } from "../models/daily-routine.model.js";
import { Notification, NOTIFICATION_TYPES } from "../models/notification.model.js";
import { RoutineAlertPreference } from "../models/routine-alert-preference.model.js";

function toPreferenceDto(preference) {
    return {
        // DTO público: o cliente só precisa das janelas e da data de atualização.
        morning: preference.morning,
        night: preference.night,
        updatedAt: preference.updatedAt,
    };
}

/**
 * Consulta preferência de alertas do utilizador.
 *
 * @async
 * @function getMyRoutineAlertPreference
 * @param {string} userId - ID da sessão.
 * @returns {Promise<object|null>} Preferência ou null.
 */
export async function getMyRoutineAlertPreference(userId) {
    // A preferência é procurada pelo utilizador autenticado na sessão.
    const preference = await RoutineAlertPreference.findOne({ userId });
    return preference ? toPreferenceDto(preference) : null;
}

/**
 * Atualiza preferência de alertas do utilizador.
 *
 * @async
 * @function updateMyRoutineAlertPreference
 * @param {string} userId - ID da sessão.
 * @param {object} input - Preferência validada.
 * @returns {Promise<object>} Preferência atualizada.
 */
export async function updateMyRoutineAlertPreference(userId, input) {
    const preference = await RoutineAlertPreference.findOneAndUpdate(
        // O filtro usa a sessão; o body não pode escolher outro utilizador.
        { userId },
        { $set: input },
        // upsert cria a preferência na primeira gravação do utilizador.
        { upsert: true, new: true, runValidators: true },
    );

    return toPreferenceDto(preference);
}

/**
 * Cria alertas internos de rotina para preferências devidas.
 *
 * @async
 * @function createDueRoutineAlerts
 * @param {Date} now - Momento de avaliação.
 * @returns {Promise<{createdCount: number}>} Número de alertas criados.
 */
export async function createDueRoutineAlerts(now = new Date()) {
    // Comparamos apenas HH:mm para decidir se a janela está no momento devido.
    const currentTime = now.toISOString().slice(11, 16);
    // A chave diária separa "mesmo dia/manhã" de "mesmo dia/noite".
    const dayKey = now.toISOString().slice(0, 10);
    const preferences = await RoutineAlertPreference.find({});
    let createdCount = 0;

    for (const preference of preferences) {
        for (const [period, config] of [
            ["morning", preference.morning],
            ["night", preference.night],
        ]) {
            const notificationKey = `${dayKey}:${period}`;

            if (!config.enabled || config.time !== currentTime || config.lastNotificationKey === notificationKey) {
                // Saltamos preferências desligadas, fora de hora ou já notificadas.
                continue;
            }

            // O alerta só faz sentido se existir uma rotina previamente calculada.
            const routine = await DailyRoutine.findOne({ userId: preference.userId });

            if (!routine) {
                throw new AppError(400, "Rotina diária obrigatória para criar alerta");
            }

            await Notification.create({
                userId: preference.userId,
                type: NOTIFICATION_TYPES.ROUTINE_REMINDER,
                title: period === "morning" ? "Hora da rotina da manhã" : "Hora da rotina noturna",
                message: period === "morning"
                    ? "Está na hora de seguir a tua rotina da manhã."
                    : "Está na hora da tua rotina noturna.",
                resourceType: "routine",
                resourceId: routine._id,
            });

            // Atualizar a chave antes de terminar impede repetição na próxima execução.
            config.lastNotificationKey = notificationKey;
            await preference.save();
            createdCount += 1;
        }
    }

    return { createdCount };
}
```

5. Explicação do código.

o service percorre preferências e avalia três condições antes de criar uma notificação: o período está ativo, a hora configurada corresponde ao momento de execução e a chave diária ainda não foi usada. Depois confirma que existe uma `DailyRoutine`, porque o alerta deve apontar para algo real. A atualização de `lastNotificationKey` logo após criar a notificação torna a operação idempotente para o mesmo dia e período.
6. Validação do passo.

executar duas vezes com o mesmo `now`; a segunda execução deve criar `0`.
7. Cenário negativo/erro esperado.

criar alertas sem rotina gera mensagens vazias e confusas.

### Passo 5 - Criar controller e routes

1. Objetivo funcional do passo no contexto da app.

expor preferências ao utilizador.
2. Ficheiros envolvidos:
   - CRIAR: `apps/api/src/controllers/routine-alert.controller.js`
   - CRIAR: `apps/api/src/routes/routine-alert.routes.js`
   - EDITAR: `apps/api/src/app.js`
3. Instruções do que fazer.

criar `GET` e `PUT /api/me/routine-alerts` e `POST /api/admin/routine-alerts/run`.
4. Código completo, correto e integrado com a app final.

```js
// apps/api/src/controllers/routine-alert.controller.js
import {
    createDueRoutineAlerts,
    getMyRoutineAlertPreference,
    updateMyRoutineAlertPreference,
} from "../services/routine-alert.service.js";
import {
    validateRoutineAlertPreferenceInput,
    validateRoutineAlertRunInput,
} from "../validators/routine-alert.validator.js";

export async function getRoutineAlertPreferenceController(req, res, next) {
    try {
        // req.user.id vem da sessão autenticada, não do body.
        const preference = await getMyRoutineAlertPreference(req.user.id);
        return res.status(200).json({ preference });
    } catch (err) {
        return next(err);
    }
}

export async function updateRoutineAlertPreferenceController(req, res, next) {
    try {
        // O controller valida primeiro e só depois entrega dados limpos ao service.
        const input = validateRoutineAlertPreferenceInput(req.body);
        const preference = await updateMyRoutineAlertPreference(req.user.id, input);
        return res.status(200).json({ preference });
    } catch (err) {
        return next(err);
    }
}

export async function runDueRoutineAlertsController(req, res, next) {
    try {
        // now é opcional para produção, mas útil para testes determinísticos.
        const input = validateRoutineAlertRunInput(req.body);
        const result = await createDueRoutineAlerts(input.now);
        return res.status(200).json(result);
    } catch (err) {
        return next(err);
    }
}
```

```js
// apps/api/src/routes/routine-alert.routes.js
import { Router } from "express";
import { ROLES } from "../constants/roles.js";
import {
    getRoutineAlertPreferenceController,
    runDueRoutineAlertsController,
    updateRoutineAlertPreferenceController,
} from "../controllers/routine-alert.controller.js";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { requireRole } from "../middlewares/role.middleware.js";

export const routineAlertRoutes = Router();

// Routes /me pertencem sempre ao utilizador autenticado.
routineAlertRoutes.get("/me/routine-alerts", requireAuth, getRoutineAlertPreferenceController);
routineAlertRoutes.put("/me/routine-alerts", requireAuth, updateRoutineAlertPreferenceController);
// A execução cria notificações para várias contas, por isso exige role admin.
routineAlertRoutes.post(
    "/admin/routine-alerts/run",
    requireAuth,
    requireRole(ROLES.ADMIN),
    runDueRoutineAlertsController,
);
```

5. Explicação do código.

as routes reforçam a separação entre ações do utilizador e ações administrativas. O utilizador consulta e guarda apenas a sua preferência, identificada pela sessão, sem enviar `userId` no body. A execução dos alertas devidos fica numa route admin porque cria notificações para várias contas; por isso precisa de autenticação, role adequada e input validado.
6. Validação do passo.

utilizador A não consegue alterar preferência de B porque não existe parâmetro para isso. Cliente recebe `403` em `POST /api/admin/routine-alerts/run`; admin recebe `{ "createdCount": 0 }` ou o número real criado.
7. Cenário negativo/erro esperado.

aceitar `now` inválido deve devolver `400`, e executar a rota duas vezes com o mesmo `now` não deve duplicar notificações.

### Passo 6 - Criar página React

1. Objetivo funcional do passo no contexto da app.

permitir ao utilizador ligar/desligar alertas.
2. Ficheiros envolvidos:
   - CRIAR: `apps/web/src/pages/RoutineAlertsPage.jsx`
   - EDITAR: `apps/web/src/App.jsx`
3. Instruções do que fazer.

criar formulário com manhã e noite.
4. Código completo, correto e integrado com a app final.

```jsx
// apps/web/src/pages/RoutineAlertsPage.jsx
import React, { useEffect, useState } from "react";
import { apiRequest } from "../services/apiClient.js";

export function RoutineAlertsPage() {
    const [form, setForm] = useState({
        morning: { enabled: false, time: "08:00" },
        night: { enabled: false, time: "21:00" },
    });
    const [message, setMessage] = useState("");

    useEffect(() => {
        // Ao abrir a página, carregamos a preferência já guardada para preencher o formulário.
        apiRequest("/me/routine-alerts")
            .then((data) => {
                if (data.preference) setForm(data.preference);
            })
            .catch((err) => setMessage(err.message));
    }, []);

    async function submitPreference(event) {
        event.preventDefault();
        // O frontend envia a preferência inteira, mas a validação final acontece no backend.
        const data = await apiRequest("/me/routine-alerts", {
            method: "PUT",
            body: JSON.stringify(form),
        });
        setForm(data.preference);
        setMessage("Preferências de alerta guardadas.");
    }

    function updatePeriod(period, patch) {
        // Atualização imutável: preserva o outro período e altera apenas o campo editado.
        setForm((current) => ({
            ...current,
            [period]: { ...current[period], ...patch },
        }));
    }

    // O mesmo formulário edita manhã e noite para deixar a comparação dos períodos visível.
    // Os inputs ajudam o utilizador, mas não substituem a validação da API.
    return (
        <section className="page-section">
            <h2>Alertas da rotina</h2>
            <form onSubmit={submitPreference}>
                <label>
                    <input
                        type="checkbox"
                        checked={form.morning.enabled}
                        onChange={(event) => updatePeriod("morning", { enabled: event.target.checked })}
                    />
                    Alerta de manhã
                </label>
                <input
                    type="time"
                    value={form.morning.time}
                    onChange={(event) => updatePeriod("morning", { time: event.target.value })}
                />
                <label>
                    <input
                        type="checkbox"
                        checked={form.night.enabled}
                        onChange={(event) => updatePeriod("night", { enabled: event.target.checked })}
                    />
                    Alerta noturno
                </label>
                <input
                    type="time"
                    value={form.night.time}
                    onChange={(event) => updatePeriod("night", { time: event.target.value })}
                />
                <button type="submit">Guardar alertas</button>
            </form>
            {message && <p role="alert">{message}</p>}
        </section>
    );
}
```

5. Explicação do código.

a página dá ao utilizador controlos simples para ativar/desativar manhã e noite e escolher horários. O `input type="time"` melhora a experiência, mas não substitui a validação do backend. Para os alunos, a regra é: a UI ajuda a introduzir dados corretos, enquanto a API continua responsável por proteger os dados quando alguém envia pedidos manualmente.
6. Validação do passo.

guardar horários, recarregar página e confirmar persistência.
7. Cenário negativo/erro esperado.

dizer ao utilizador que a rotina garante resultados seria uma claim indevida.

### Passo 7 - Validar negativos e evidência

1. Objetivo funcional do passo no contexto da app.

provar validação, idempotência e dependência de rotina.
2. Ficheiros envolvidos:
   - CRIAR/EDITAR: `apps/api/tests/mf4.routine-alerts.test.js`
   - REVER: `apps/api/src/services/routine-alert.service.js`
3. Instruções do que fazer.

testar horário inválido, sem rotina, duplicação e execução admin protegida.
4. Código completo, correto e integrado com a app final.

```js
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
```

5. Explicação do código.

os testes cobrem a regra a partir de três ângulos que são fáceis de defender em aula: input inválido deve falhar, uma preferência ativa à hora certa deve criar uma notificação, e uma chave diária já usada deve impedir duplicação. Assim os alunos não ficam apenas com o caso feliz; ficam também com a razão pela qual `lastNotificationKey` existe.
6. Validação do passo.

anexar output dos testes e screenshot da inbox com alerta.
7. Cenário negativo/erro esperado.

não testar duplicação pode encher a inbox com mensagens repetidas.

#### Expected results
- `GET /api/me/routine-alerts` devolve `200` com preferência ou `null`.
- `PUT /api/me/routine-alerts` devolve `200` com preferência guardada.
- `POST /api/admin/routine-alerts/run` permite execução protegida dos alertas devidos.
- Horário inválido devolve `400`.
- `createDueRoutineAlerts(now)` cria notificação interna quando há rotina e preferência ativa.
- Segunda execução para o mesmo dia/período não duplica notificação.

#### Critérios de aceite
- Entrega funcional especifica de `Enviar alertas personalizados (“Está na hora da sua rotina noturna”)` validada contra `RF37`.
- Cenários negativos concluídos: mínimo `3` com resultado controlado.
- Evidencia de testes por camada conforme prioridade (`P1`).
- Alertas dependem de rotina existente e preferência ativa.
- Execução manual de alertas exige role admin.
- Notificação não promete resultado clínico nem adiciona produtos ao carrinho.

#### Validação final
- Executar testes de API.
- Guardar preferências no frontend.
- Criar alerta e confirmar entrada em `GET /api/me/notifications`.
- Executar `bash scripts/validate-planificacao.sh`.

#### Evidence para PR/defesa
- `proof_tecnico`: endpoints de preferência e função de criação de alertas.
- `proof_negativos`: horário inválido, sem rotina e duplicação evitada.
- `proof_ui`: screenshot da configuração e da notificação.
- `proof_negocio`: rotina passa a ter lembrete, sem compra automática.

#### Handoff
`BK-MF4-08` deve filtrar recomendações por alergias/restrições antes de a rotina e os alertas serem usados. Se uma rotina ficar incompatível com novas restrições, o alerta deve ser regenerado depois de nova rotina válida.

#### Changelog
- `2026-06-15`: guia reescrito para alertas internos de rotina com preferências, idempotência mínima e negativos `P1`.
