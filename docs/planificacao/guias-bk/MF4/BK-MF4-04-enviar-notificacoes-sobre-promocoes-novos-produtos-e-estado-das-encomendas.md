# BK-MF4-04 - Enviar notificações sobre promoções, novos produtos e estado das encomendas

## Header
- `doc_id`: `GUIA-BK-MF4-04`
- `bk_id`: `BK-MF4-04`
- `macro`: `MF4`
- `owner`: `Izelicks`
- `apoio`: `Bruna`
- `prioridade`: `P0`
- `estado`: `TODO`
- `esforco`: `M`
- `dependencias`: `BK-MF3-03`
- `rf_rnf`: `RF36`
- `fase_documental`: `Fase 2`
- `sprint`: `S08-S09`
- `core_or_reforco`: `Reforco`
- `proximo_bk`: `BK-MF4-05`
- `guia_path`: `docs/planificacao/guias-bk/MF4/BK-MF4-04-enviar-notificacoes-sobre-promocoes-novos-produtos-e-estado-das-encomendas.md`
- `last_updated`: `2026-06-15`

#### Objetivo
Implementar notificações internas da Orélle para promoções, novos produtos e estado de encomendas, com criação controlada no backend e leitura pelo utilizador autenticado.

#### Importância
Notificações aproximam comércio e acompanhamento, mas podem expor dados pessoais se forem mal desenhadas. Este BK usa notificações internas, sem email ou push externo, para manter o MVP simples, seguro e demonstrável.

#### Scope-in
- Criar modelo `Notification`.
- Criar notificações admin para promoções e novos produtos.
- Criar notificação de estado de encomenda para o dono da encomenda.
- Criar função backend para alterar estado logístico e emitir a notificação transacional.
- Criar endpoints do cliente para listar e marcar como lida.
- Criar endpoints admin para criar campanhas internas.
- Criar página React de notificações.

#### Scope-out
- Não enviar email, SMS, push mobile ou integrações externas.
- Não incluir morada, dados de pagamento ou detalhes sensíveis da encomenda na mensagem.
- Não criar motor de campanhas avançado.
- Não alterar pagamento nem regras de stock.

#### Estado antes e depois
- Antes: `Order` existia e podia suportar mensagens transacionais, mas a app não tinha caixa de notificações.
- Depois: utilizadores têm notificações internas minimizadas, e admin consegue criar mensagens comerciais controladas.

#### Pre-requisitos
- `BK-MF0-02`: sessão por cookie HttpOnly.
- `BK-MF0-05`: role `administrador`.
- `BK-MF0-07`: produtos.
- `BK-MF3-03`: encomendas e pagamentos.
- `RF36`: notificações sobre promoções, novos produtos e estado de encomendas.

#### Glossário
- Notificação interna: mensagem visível dentro da app depois de login.
- Campanha: notificação criada por admin para vários clientes.
- Notificação transacional: mensagem ligada a uma encomenda do próprio utilizador.
- Lida: estado local que evita repetir alerta visual.
- Minimização: mensagem com contexto suficiente, sem dados desnecessários.

#### Conceitos teóricos essenciais
Uma notificação não deve transportar objetos completos. A mensagem deve ser curta, clara e com referência mínima ao recurso relacionado.

Promoções e novos produtos podem ir para vários utilizadores ativos. Já estado de encomenda pertence a um único cliente e deve usar `order.userId` do backend, nunca `userId` enviado pelo frontend.

Como não existe contrato de email/push neste ponto, a solução interna é suficiente para o MVP. Qualquer canal externo deve consumir o mesmo `Notification` ou um outbox seguro, sem copiar dados sensíveis.

#### Arquitetura do BK
- `notification.model.js`: guarda mensagens internas.
- `notification.validator.js`: valida campanhas admin e params.
- `notification.service.js`: cria/lista/marca notificações.
- `notification.controller.js`: endpoints de cliente e admin.
- `notification.routes.js`: routes protegidas.
- `order.service.js`: alteração controlada de estado com notificação transacional.
- `NotificationsPage.jsx`: inbox do utilizador.
- `AdminNotificationsPage.jsx`: criação de campanhas.
- `app.js` e `App.jsx`: integração.

#### Ficheiros a criar/editar/rever
- CRIAR: `real_dev/api/src/models/notification.model.js`
- CRIAR: `real_dev/api/src/validators/notification.validator.js`
- CRIAR: `real_dev/api/src/services/notification.service.js`
- CRIAR: `real_dev/api/src/controllers/notification.controller.js`
- CRIAR: `real_dev/api/src/routes/notification.routes.js`
- EDITAR: `real_dev/api/src/app.js`
- CRIAR: `real_dev/web/src/pages/NotificationsPage.jsx`
- CRIAR: `real_dev/web/src/pages/AdminNotificationsPage.jsx`
- EDITAR: `real_dev/web/src/App.jsx`
- REVER: `real_dev/api/src/models/order.model.js`
- EDITAR: `real_dev/api/src/services/order.service.js`
- REVER: `real_dev/api/src/models/product.model.js`
- REVER: `real_dev/api/src/models/user.model.js`

#### Tutorial técnico linear
### Passo 1 - Confirmar canais de notificação

1. Objetivo funcional do passo no contexto da app.

limitar este BK a notificações internas.
2. Ficheiros envolvidos:
   - REVER: `docs/RF.md`
   - REVER: `docs/planificacao/backlogs/MATRIZ-CANONICA-BK.md`
   - REVER: `real_dev/api/src/models/order.model.js`
   - LOCALIZAÇÃO: `RF36`, `BK-MF4-04`.
3. Instruções do que fazer.

registar que email/push/SMS ficam fora do scope.
4. Código completo, correto e integrado com a app final.

```text
Decisão DERIVADO: RF36 será cumprido no MVP por notificações internas autenticadas.
```

5. Explicação do código.

esta decisão fecha o scope técnico do BK antes de escrever código. Para os alunos, o ponto importante é perceber que "enviar notificação" não implica automaticamente email, SMS ou push real. Esses canais exigem fornecedores externos, configuração de segredos, consentimentos e tratamento operacional de falhas. No MVP, a solução fica interna, autenticada e testável dentro da própria app, o que permite validar o RF36 sem introduzir riscos de privacidade ou infraestrutura que ainda não fazem parte do projeto.
6. Validação do passo.

não adicionar variáveis de ambiente ou chaves de fornecedor.
7. Cenário negativo/erro esperado.

prometer email real sem provider seguro cria dívida e risco de privacidade.

### Passo 2 - Criar modelo Notification

1. Objetivo funcional do passo no contexto da app.

persistir mensagens internas com ownership.
2. Ficheiros envolvidos:
   - CRIAR: `real_dev/api/src/models/notification.model.js`
   - LOCALIZAÇÃO: ficheiro completo.
3. Instruções do que fazer.

criar schema com `userId`, tipo, título, mensagem e estado de leitura.
4. Código completo, correto e integrado com a app final.

```js
// real_dev/api/src/models/notification.model.js
import mongoose from "mongoose";

const { Schema, model } = mongoose;

export const NOTIFICATION_TYPES = Object.freeze({
    PROMOTION: "promotion",
    NEW_PRODUCT: "new_product",
    ORDER_STATUS: "order_status",
    ROUTINE_REMINDER: "routine_reminder",
});

export const NOTIFICATION_TYPE_VALUES = Object.freeze(
    Object.values(NOTIFICATION_TYPES),
);

const notificationSchema = new Schema(
    {
        // Ownership: a notificação pertence sempre a um utilizador concreto.
        // A inbox será filtrada por este campo, nunca por um userId vindo da UI.
        userId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
        // O tipo permite distinguir campanhas, produtos novos, encomendas e lembretes,
        // mas fica limitado à enumeração para evitar valores livres difíceis de tratar.
        type: {
            type: String,
            enum: NOTIFICATION_TYPE_VALUES,
            required: true,
            index: true,
        },
        title: {
            type: String,
            required: true,
            trim: true,
            maxlength: 120,
        },
        message: {
            type: String,
            required: true,
            trim: true,
            maxlength: 500,
        },
        // Guardamos apenas uma referência curta ao recurso relacionado.
        // A notificação não deve duplicar encomendas, produtos ou dados pessoais.
        resourceType: {
            type: String,
            enum: ["product", "order", "routine", "none"],
            default: "none",
        },
        resourceId: {
            type: Schema.Types.ObjectId,
            default: null,
        },
        // null significa "por ler"; uma data preenchida significa "lida".
        // Isto evita criar um booleano extra e ainda preserva quando a ação aconteceu.
        readAt: {
            type: Date,
            default: null,
        },
    },
    { timestamps: true },
);

notificationSchema.index({ userId: 1, readAt: 1, createdAt: -1 });

/**
 * Modelo Mongoose de notificações internas.
 *
 * @type {import("mongoose").Model}
 */
export const Notification = model("Notification", notificationSchema);
```

5. Explicação do código.

o schema ensina dois princípios importantes: ownership e minimização. O `userId` diz quem pode ver a notificação, enquanto `title` e `message` ficam com limites curtos para não transformar a inbox num local de armazenamento de dados completos. `resourceType` e `resourceId` servem apenas para criar uma ligação ao recurso original, por exemplo uma encomenda ou produto, sem copiar para a notificação informação sensível ou difícil de manter sincronizada.
6. Validação do passo.

criar notificação e confirmar que pertence a um único utilizador.
7. Cenário negativo/erro esperado.

guardar o objeto `Order` inteiro dentro da notificação expõe dados além da finalidade.

### Passo 3 - Criar validators

1. Objetivo funcional do passo no contexto da app.

impedir mensagens inválidas ou gigantes.
2. Ficheiros envolvidos:
   - CRIAR: `real_dev/api/src/validators/notification.validator.js`
   - LOCALIZAÇÃO: ficheiro completo.
3. Instruções do que fazer.

validar campanhas admin e IDs.
4. Código completo, correto e integrado com a app final.

```js
// real_dev/api/src/validators/notification.validator.js
import mongoose from "mongoose";
import { AppError } from "../middlewares/error.middleware.js";
import { NOTIFICATION_TYPES } from "../models/notification.model.js";

/**
 * Valida criação de campanha interna por admin.
 *
 * @function validateCampaignNotificationInput
 * @param {Record<string, unknown>} body - Body recebido.
 * @returns {{type: "promotion"|"new_product", title: string, message: string, productId: string|null}} Dados normalizados.
 */
export function validateCampaignNotificationInput(body) {
    const type = String(body.type ?? "").trim();
    const title = String(body.title ?? "").trim();
    const message = String(body.message ?? "").trim();
    const productId = body.productId ? String(body.productId).trim() : null;

    if (![NOTIFICATION_TYPES.PROMOTION, NOTIFICATION_TYPES.NEW_PRODUCT].includes(type)) {
        throw new AppError(400, "Tipo de campanha invalido");
    }

    if (title.length < 3 || title.length > 120) {
        throw new AppError(400, "Título de notificação invalido");
    }

    if (message.length < 5 || message.length > 500) {
        throw new AppError(400, "Mensagem de notificação invalida");
    }

    if (productId && !mongoose.isValidObjectId(productId)) {
        throw new AppError(400, "Produto invalido");
    }

    return { type, title, message, productId };
}

/**
 * Valida ID de notificação.
 *
 * @function validateNotificationIdParam
 * @param {Record<string, string>} params - Params da route.
 * @returns {string} ID validado.
 */
export function validateNotificationIdParam(params) {
    const notificationId = String(params.notificationId ?? "");

    if (!mongoose.isValidObjectId(notificationId)) {
        throw new AppError(400, "ID de notificação invalido");
    }

    return notificationId;
}
```

5. Explicação do código.

o validator funciona como uma primeira barreira de regras de negócio. O admin só pode criar campanhas dos tipos permitidos, porque `order_status` depende de uma encomenda real e não deve ser inventado no body. Para os alunos, a distinção essencial é esta: campanhas são mensagens criadas por admin; estado de encomenda é uma consequência de consultar e atualizar uma `Order` existente no backend.
6. Validação do passo.

mensagem com 700 caracteres devolve `400`.
7. Cenário negativo/erro esperado.

aceitar `order_status` no body admin permitiria inventar estado de encomenda sem consultar a encomenda.

### Passo 4 - Criar service de notificações

1. Objetivo funcional do passo no contexto da app.

criar notificações com ownership correto.
2. Ficheiros envolvidos:
   - CRIAR: `real_dev/api/src/services/notification.service.js`
   - LOCALIZAÇÃO: ficheiro completo.
3. Instruções do que fazer.

listar inbox, marcar como lida, criar campanhas e estado de encomenda.
4. Código completo, correto e integrado com a app final.

```js
// real_dev/api/src/services/notification.service.js
import { AppError } from "../middlewares/error.middleware.js";
import { Notification, NOTIFICATION_TYPES } from "../models/notification.model.js";
import { Order } from "../models/order.model.js";
import { User, ACCOUNT_STATUSES } from "../models/user.model.js";

/**
 * Converte notificação para DTO público do próprio utilizador.
 *
 * @function toNotificationDto
 * @param {object} notification - Documento Mongoose.
 * @returns {object} Notificação segura.
 */
function toNotificationDto(notification) {
    return {
        // O DTO é uma lista branca: só entram campos que o cliente pode conhecer.
        id: notification._id.toString(),
        type: notification.type,
        title: notification.title,
        message: notification.message,
        resourceType: notification.resourceType,
        resourceId: notification.resourceId?.toString() ?? null,
        readAt: notification.readAt,
        createdAt: notification.createdAt,
    };
}

/**
 * Lista notificações do utilizador autenticado.
 *
 * @async
 * @function listMyNotifications
 * @param {string} userId - ID da sessão.
 * @returns {Promise<object[]>} Notificações do próprio utilizador.
 */
export async function listMyNotifications(userId) {
    // A sessão decide o utilizador. A route não recebe ?userId=... para evitar enumeração.
    const notifications = await Notification.find({ userId })
        .sort({ createdAt: -1 })
        // Um limite simples impede respostas enormes e mantém a inbox previsível.
        .limit(50);

    return notifications.map(toNotificationDto);
}

/**
 * Marca uma notificação do próprio utilizador como lida.
 *
 * @async
 * @function markMyNotificationAsRead
 * @param {string} userId - ID da sessão.
 * @param {string} notificationId - Notificação alvo.
 * @returns {Promise<object>} Notificação atualizada.
 */
export async function markMyNotificationAsRead(userId, notificationId) {
    const notification = await Notification.findOneAndUpdate(
        // A combinação _id + userId impede marcar como lida uma notificação de outra conta.
        { _id: notificationId, userId },
        { readAt: new Date() },
        { new: true, runValidators: true },
    );

    if (!notification) {
        throw new AppError(404, "Notificação não encontrada");
    }

    return toNotificationDto(notification);
}

/**
 * Cria campanha interna para utilizadores ativos.
 *
 * @async
 * @function createCampaignNotification
 * @param {{type: string, title: string, message: string, productId: string|null}} input - Campanha validada.
 * @returns {Promise<{createdCount: number}>} Contagem criada.
 */
export async function createCampaignNotification(input) {
    // Campanhas internas só são enviadas para contas ativas e operacionalmente válidas.
    const users = await User.find({
        isActive: true,
        accountStatus: ACCOUNT_STATUSES.ACTIVE,
    }).select("_id");

    const notifications = users.map((user) => ({
        // Cada documento gerado mantém ownership individual.
        userId: user._id,
        type: input.type,
        title: input.title,
        message: input.message,
        resourceType: input.productId ? "product" : "none",
        resourceId: input.productId,
    }));

    if (notifications.length === 0) {
        return { createdCount: 0 };
    }

    const result = await Notification.insertMany(notifications, { ordered: false });
    return { createdCount: result.length };
}

/**
 * Cria notificação de estado de encomenda para o dono da encomenda.
 *
 * @async
 * @function createOrderStatusNotification
 * @param {string} orderId - Encomenda alvo.
 * @returns {Promise<object>} Notificação criada.
 */
export async function createOrderStatusNotification(orderId) {
    // O dono da notificação vem da encomenda, não de input recebido do cliente/admin.
    const order = await Order.findById(orderId).select("userId status");

    if (!order) {
        throw new AppError(404, "Encomenda não encontrada");
    }

    const notification = await Notification.create({
        userId: order.userId,
        type: NOTIFICATION_TYPES.ORDER_STATUS,
        title: "Estado da encomenda atualizado",
        message: `A tua encomenda está com estado: ${order.status}.`,
        resourceType: "order",
        resourceId: order._id,
    });

    return toNotificationDto(notification);
}
```

5. Explicação do código.

o service concentra as regras que não podem depender da interface. Nas campanhas, primeiro procura apenas contas ativas e depois cria uma notificação separada para cada utilizador, mantendo ownership individual. Na notificação de encomenda, o backend consulta a `Order` e usa `order.userId`; isto é importante porque o destinatário não deve vir do body, onde poderia ser alterado por engano ou de forma maliciosa.
6. Validação do passo.

criar notificação para encomenda e confirmar que só o dono a lista.
7. Cenário negativo/erro esperado.

receber `userId` no body para estado de encomenda permitiria enviar mensagem a outra pessoa.

### Passo 5 - Criar controller e routes

1. Objetivo funcional do passo no contexto da app.

expor inbox do cliente e ações admin.
2. Ficheiros envolvidos:
   - CRIAR: `real_dev/api/src/controllers/notification.controller.js`
   - CRIAR: `real_dev/api/src/routes/notification.routes.js`
   - EDITAR: `real_dev/api/src/app.js`
3. Instruções do que fazer.

criar endpoints de cliente e admin.
4. Código completo, correto e integrado com a app final.

```js
// real_dev/api/src/controllers/notification.controller.js
import {
    createCampaignNotification,
    listMyNotifications,
    markMyNotificationAsRead,
} from "../services/notification.service.js";
import {
    validateCampaignNotificationInput,
    validateNotificationIdParam,
} from "../validators/notification.validator.js";

/**
 * Lista notificações do próprio utilizador.
 *
 * @async
 * @function listMyNotificationsController
 */
export async function listMyNotificationsController(req, res, next) {
    try {
        const notifications = await listMyNotifications(req.user.id);
        return res.status(200).json({ notifications });
    } catch (err) {
        return next(err);
    }
}

/**
 * Marca notificação própria como lida.
 *
 * @async
 * @function markNotificationAsReadController
 */
export async function markNotificationAsReadController(req, res, next) {
    try {
        const notificationId = validateNotificationIdParam(req.params);
        const notification = await markMyNotificationAsRead(req.user.id, notificationId);
        return res.status(200).json({ notification });
    } catch (err) {
        return next(err);
    }
}

/**
 * Cria campanha interna admin.
 *
 * @async
 * @function createCampaignNotificationController
 */
export async function createCampaignNotificationController(req, res, next) {
    try {
        const input = validateCampaignNotificationInput(req.body);
        const result = await createCampaignNotification(input);
        return res.status(201).json(result);
    } catch (err) {
        return next(err);
    }
}
```

```js
// real_dev/api/src/routes/notification.routes.js
import { Router } from "express";
import { ROLES } from "../constants/roles.js";
import {
    createCampaignNotificationController,
    listMyNotificationsController,
    markNotificationAsReadController,
} from "../controllers/notification.controller.js";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { requireRole } from "../middlewares/role.middleware.js";

/**
 * Router Express para notificações internas.
 *
 * @type {import("express").Router}
 */
export const notificationRoutes = Router();

notificationRoutes.get("/me/notifications", requireAuth, listMyNotificationsController);
notificationRoutes.patch(
    "/me/notifications/:notificationId/read",
    requireAuth,
    markNotificationAsReadController,
);
notificationRoutes.post(
    "/admin/notifications/campaigns",
    requireAuth,
    requireRole(ROLES.ADMIN),
    createCampaignNotificationController,
);
```

```js
// real_dev/api/src/app.js
import { notificationRoutes } from "./routes/notification.routes.js";

app.use("/api", notificationRoutes);
```

5. Explicação do código.

os endpoints `/me` trabalham sempre a partir da sessão autenticada, por isso o cliente não escolhe que inbox quer consultar. Já o endpoint `/admin` fica separado e protegido por `requireRole(ROLES.ADMIN)`, porque criar campanhas é uma ação de gestão. Esta separação ajuda os alunos a ver que routes públicas, routes autenticadas e routes administrativas têm responsabilidades e riscos diferentes.
6. Validação do passo.

cliente lista a própria inbox; cliente recebe `403` ao criar campanha.
7. Cenário negativo/erro esperado.

criar `GET /api/notifications?userId=...` permite enumeração de notificações.

### Passo 6 - Criar páginas React

1. Objetivo funcional do passo no contexto da app.

permitir uso visível por cliente e admin.
2. Ficheiros envolvidos:
   - CRIAR: `real_dev/web/src/pages/NotificationsPage.jsx`
   - CRIAR: `real_dev/web/src/pages/AdminNotificationsPage.jsx`
   - EDITAR: `real_dev/web/src/App.jsx`
3. Instruções do que fazer.

listar inbox e criar campanhas.
4. Código completo, correto e integrado com a app final.

```jsx
// real_dev/web/src/pages/NotificationsPage.jsx
import React, { useEffect, useState } from "react";
import { apiRequest } from "../services/apiClient.js";

/**
 * Caixa de notificações do utilizador autenticado.
 *
 * @function NotificationsPage
 * @returns {JSX.Element} Lista de notificações internas.
 */
export function NotificationsPage() {
    const [notifications, setNotifications] = useState([]);
    const [message, setMessage] = useState("");

    async function loadNotifications() {
        // A API usa a sessão/cookie para saber quem é o utilizador.
        // A página não envia userId e por isso não consegue pedir a inbox de outra pessoa.
        const data = await apiRequest("/me/notifications");
        setNotifications(data.notifications);
    }

    async function markAsRead(notificationId) {
        await apiRequest(`/me/notifications/${notificationId}/read`, { method: "PATCH" });
        // Recarregamos a lista para mostrar o estado confirmado pelo backend.
        await loadNotifications();
    }

    useEffect(() => {
        loadNotifications().catch((err) => setMessage(err.message));
    }, []);

    return (
        <section className="page-section">
            <h2>Notificações</h2>
            {message && <p role="alert">{message}</p>}
            {notifications.length === 0 && <p>Sem notificações.</p>}
            <ul>
                {notifications.map((notification) => (
                    <li key={notification.id}>
                        <strong>{notification.title}</strong>
                        <p>{notification.message}</p>
                        <span>{notification.readAt ? "Lida" : "Por ler"}</span>
                        {!notification.readAt && (
                            <button type="button" onClick={() => markAsRead(notification.id)}>
                                Marcar como lida
                            </button>
                        )}
                    </li>
                ))}
            </ul>
        </section>
    );
}
```

```jsx
// real_dev/web/src/pages/AdminNotificationsPage.jsx
import React, { useState } from "react";
import { apiRequest } from "../services/apiClient.js";

/**
 * Página admin para campanhas internas.
 *
 * @function AdminNotificationsPage
 * @returns {JSX.Element} Formulário de campanhas.
 */
export function AdminNotificationsPage() {
    const [form, setForm] = useState({
        type: "promotion",
        title: "",
        message: "",
        productId: "",
    });
    const [feedback, setFeedback] = useState("");

    async function submitCampaign(event) {
        event.preventDefault();
        const data = await apiRequest("/admin/notifications/campaigns", {
            method: "POST",
            body: JSON.stringify({
                ...form,
                // Campo vazio vira null para o backend distinguir "sem produto" de texto inválido.
                productId: form.productId || null,
            }),
        });
        setFeedback(`Notificações criadas: ${data.createdCount}`);
    }

    return (
        <section className="page-section">
            <h2>Campanhas internas</h2>
            <form onSubmit={submitCampaign}>
                <select
                    value={form.type}
                    onChange={(event) => setForm({ ...form, type: event.target.value })}
                >
                    <option value="promotion">Promoção</option>
                    <option value="new_product">Novo produto</option>
                </select>
                <input
                    aria-label="Título da campanha"
                    value={form.title}
                    onChange={(event) => setForm({ ...form, title: event.target.value })}
                />
                <textarea
                    aria-label="Mensagem da campanha"
                    value={form.message}
                    onChange={(event) => setForm({ ...form, message: event.target.value })}
                />
                <input
                    aria-label="ID de produto opcional"
                    value={form.productId}
                    onChange={(event) => setForm({ ...form, productId: event.target.value })}
                />
                <button type="submit">Enviar campanha</button>
            </form>
            {feedback && <p>{feedback}</p>}
        </section>
    );
}
```

5. Explicação do código.

a UI existe para tornar o fluxo usável, mas não é a camada de segurança principal. A página de cliente chama `/me/notifications`, deixando o backend identificar o utilizador pela sessão. A página admin só recolhe os dados mínimos de uma campanha interna: tipo, título, mensagem e produto opcional. Não há dados de pagamento, documentos, imagens sensíveis ou informação biométrica nas mensagens, porque uma notificação deve ser curta e orientada para ação.
6. Validação do passo.

criar campanha, entrar como cliente e marcar mensagem como lida.
7. Cenário negativo/erro esperado.

usar canais externos na UI sem backend correspondente confunde o scope e a validação.

### Passo 7 - Integrar notificação na alteração de estado da encomenda

1. Objetivo funcional do passo no contexto da app.

alterar o estado logístico no backend e criar notificação para o dono real da encomenda.
2. Ficheiros envolvidos:
   - EDITAR: `real_dev/api/src/services/order.service.js`
   - REVER: `real_dev/api/src/models/order.model.js`
   - REVER: `real_dev/api/src/services/notification.service.js`
   - LOCALIZAÇÃO: imports do ficheiro e função `updateOrderStatusAndNotify`.
3. Instruções do que fazer.

adicionar uma função de service que valida o novo estado, actualiza a encomenda e chama `createOrderStatusNotification(order._id)`.
4. Código completo, correto e integrado com a app final.

```js
// real_dev/api/src/services/order.service.js
import { AppError } from "../middlewares/error.middleware.js";
import { Order, ORDER_STATUS } from "../models/order.model.js";
import { createOrderStatusNotification } from "./notification.service.js";

/**
 * Atualiza o estado logístico de uma encomenda e emite notificação interna.
 *
 * @async
 * @function updateOrderStatusAndNotify
 * @param {string} orderId - ID da encomenda.
 * @param {string} nextStatus - Estado permitido em `ORDER_STATUS`.
 * @returns {Promise<object>} DTO da encomenda atualizada.
 * @throws {AppError} Quando o estado é inválido ou a encomenda não existe.
 */
export async function updateOrderStatusAndNotify(orderId, nextStatus) {
    const allowedStatuses = Object.values(ORDER_STATUS);

    if (!allowedStatuses.includes(nextStatus)) {
        throw new AppError(400, "Estado de encomenda invalido");
    }

    // Procuramos a encomenda real para usar o estado e o dono guardados no backend.
    const order = await Order.findById(orderId);

    if (!order) {
        throw new AppError(404, "Encomenda nao encontrada");
    }

    if (order.status === nextStatus) {
        return toOrderResponse(order);
    }

    order.status = nextStatus;
    await order.save();
    // A notificação é uma consequência da alteração persistida.
    await createOrderStatusNotification(order._id);

    return toOrderResponse(order);
}
```

5. Explicação do código.

a função usa a encomenda encontrada no backend como fonte de verdade. O `userId` da notificação vem de `Order`, não do body, e a notificação só é criada depois de a alteração de estado persistir.
6. Validação do passo.

em teste, chamar `updateOrderStatusAndNotify(orderId, ORDER_STATUS.ENVIADO)`, confirmar que `order.status` muda para `enviado` e que a notificação pertence a `order.userId`.
7. Cenário negativo/erro esperado.

criar notificação de encomenda para todos os utilizadores expõe informação transacional.

### Passo 8 - Validar negativos e evidência

1. Objetivo funcional do passo no contexto da app.

provar autorização, ownership e minimização.
2. Ficheiros envolvidos:
   - CRIAR/EDITAR: `real_dev/api/tests/mf4.notifications.test.js`
   - REVER: respostas JSON das routes.
3. Instruções do que fazer.

testar cliente/admin, notificação de outro utilizador, mensagem inválida e alteração de estado de encomenda.
4. Código completo, correto e integrado com a app final.

```js
// real_dev/api/tests/mf4.notifications.test.js
import { beforeEach, describe, expect, it, vi } from "vitest";
import { validateCampaignNotificationInput } from "../src/validators/notification.validator.js";
import {
    createOrderStatusNotification,
    markMyNotificationAsRead,
} from "../src/services/notification.service.js";
import {
    Notification,
    NOTIFICATION_TYPES,
} from "../src/models/notification.model.js";
import { Order, ORDER_STATUS } from "../src/models/order.model.js";

// Mockamos apenas as operações usadas pelo service para manter o teste focado.
vi.mock("../src/models/notification.model.js", () => ({
    NOTIFICATION_TYPES: Object.freeze({
        PROMOTION: "promotion",
        NEW_PRODUCT: "new_product",
        ORDER_STATUS: "order_status",
    }),
    Notification: {
        create: vi.fn(),
        findOneAndUpdate: vi.fn(),
    },
}));

// A Order é necessária para provar que o destinatário vem da encomenda real.
vi.mock("../src/models/order.model.js", () => ({
    ORDER_STATUS: Object.freeze({
        PENDENTE: "pendente",
        PAGO: "pago",
        ENVIADO: "enviado",
        ENTREGUE: "entregue",
        CANCELADO: "cancelado",
    }),
    Order: { findById: vi.fn() },
}));

vi.mock("../src/models/user.model.js", () => ({
    ACCOUNT_STATUSES: Object.freeze({ ACTIVE: "active" }),
    User: { find: vi.fn() },
}));

function objectId(value) {
    // Simula o comportamento mínimo de um ObjectId Mongoose usado pelos DTOs.
    return { toString: () => value };
}

function makeNotification(overrides = {}) {
    // Factory de teste: cria notificações completas e deixa cada teste alterar só o relevante.
    return {
        _id: objectId(overrides.id ?? "64b7f1a0f4e6f5c6d7e8f901"),
        userId: objectId(overrides.userId ?? "64b7f1a0f4e6f5c6d7e8f902"),
        type: overrides.type ?? NOTIFICATION_TYPES.PROMOTION,
        title: overrides.title ?? "Promoção",
        message: overrides.message ?? "Nova campanha disponível",
        resourceType: overrides.resourceType ?? "product",
        resourceId: overrides.resourceId ?? objectId("64b7f1a0f4e6f5c6d7e8f903"),
        readAt: overrides.readAt ?? null,
        createdAt: new Date("2026-06-15T10:00:00.000Z"),
    };
}

describe("BK-MF4-04 notifications", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("rejeita estado de encomenda vindo do body de campanha", () => {
        // order_status não é campanha; deve nascer da alteração de uma Order.
        expect(() =>
            validateCampaignNotificationInput({
                type: "order_status",
                title: "Estado",
                message: "Mensagem inválida para campanha",
            }),
        ).toThrow("Tipo de campanha invalido");
    });

    it("marca como lida apenas a notificação do próprio utilizador", async () => {
        const userId = "64b7f1a0f4e6f5c6d7e8f902";
        const notificationId = "64b7f1a0f4e6f5c6d7e8f901";
        // O mock representa a notificação encontrada para aquele par notificationId + userId.
        Notification.findOneAndUpdate.mockResolvedValueOnce(
            makeNotification({
                id: notificationId,
                userId,
                readAt: new Date("2026-06-15T11:00:00.000Z"),
            }),
        );

        const notification = await markMyNotificationAsRead(userId, notificationId);

        expect(Notification.findOneAndUpdate).toHaveBeenCalledWith(
            // Este filtro é o centro da regra: não basta conhecer o ID da notificação.
            { _id: notificationId, userId },
            expect.objectContaining({ readAt: expect.any(Date) }),
            expect.objectContaining({ new: true, runValidators: true }),
        );
        expect(notification).toMatchObject({
            id: notificationId,
            resourceType: "product",
        });
        // O DTO público não deve transportar dados que não pertencem à inbox.
        expect(notification).not.toHaveProperty("payment");
        expect(notification).not.toHaveProperty("passwordHash");
    });

    it("notifica o dono real quando o estado da encomenda muda", async () => {
        const order = {
            _id: objectId("64b7f1a0f4e6f5c6d7e8f904"),
            userId: objectId("64b7f1a0f4e6f5c6d7e8f902"),
            status: ORDER_STATUS.ENVIADO,
        };
        // O service seleciona userId/status da encomenda; o destinatário vem daqui.
        Order.findById.mockReturnValueOnce({
            select: vi.fn().mockResolvedValue(order),
        });
        Notification.create.mockResolvedValueOnce(
            makeNotification({
                type: NOTIFICATION_TYPES.ORDER_STATUS,
                title: "Estado da encomenda atualizado",
                message: "A tua encomenda está com estado: enviado.",
                resourceType: "order",
                resourceId: order._id,
                userId: order.userId.toString(),
            }),
        );

        const notification = await createOrderStatusNotification(order._id.toString());

        expect(Notification.create).toHaveBeenCalledWith(
            expect.objectContaining({
                // Garante que a notificação é enviada ao dono real da Order.
                userId: order.userId,
                type: NOTIFICATION_TYPES.ORDER_STATUS,
                resourceType: "order",
                resourceId: order._id,
            }),
        );
        expect(notification).toMatchObject({
            type: NOTIFICATION_TYPES.ORDER_STATUS,
            resourceType: "order",
        });
    });
});
```

5. Explicação do código.

os testes não verificam apenas o caso feliz. Eles documentam regras que os alunos devem reconhecer como essenciais: uma campanha não pode fingir ser atualização de encomenda, uma notificação só pode ser marcada como lida pelo próprio dono e a notificação de estado usa o `userId` guardado na `Order`. Os asserts negativos sobre `payment` e `passwordHash` reforçam que a resposta pública deve ser minimizada.
6. Validação do passo.

anexar output dos testes e screenshots da inbox.
7. Cenário negativo/erro esperado.

testar só criação de campanha não prova que outro utilizador não lê a notificação.

#### Expected results
- `GET /api/me/notifications` devolve `200` com notificações do próprio utilizador.
- `PATCH /api/me/notifications/:notificationId/read` devolve `200` para o dono e `404` para outro utilizador.
- `POST /api/admin/notifications/campaigns` devolve `201` para admin.
- Cliente sem role admin recebe `403` ao tentar criar campanha.
- Mensagens inválidas devolvem `400`.

#### Critérios de aceite
- Entrega funcional especifica de `Enviar notificações sobre promoções, novos produtos e estado das encomendas` validada contra `RF36`.
- Cenários negativos concluídos: mínimo `3` com resultado controlado.
- Evidencia de testes por camada conforme prioridade (`P0`).
- Notificações internas não expõem dados de pagamento, dados biométricos, cookies ou documentos completos.
- Estado de encomenda usa ownership vindo de `Order.userId`.

#### Validação final
- Executar testes de API.
- Criar campanha admin e confirmar leitura por cliente.
- Confirmar que conta suspensa de `BK-MF4-01` não recebe nova campanha.
- Executar `bash scripts/validate-planificacao.sh`.

#### Evidence para PR/defesa
- `proof_tecnico`: endpoints de listagem, criação e marcação como lida.
- `proof_negativos`: `403`, `404` e `400`.
- `proof_privacidade`: DTO de notificação sem dados sensíveis.
- `proof_ui`: screenshots da inbox e da página admin.

#### Handoff
`BK-MF4-05` reutiliza o modelo `Notification` com `type: "routine_reminder"`. `BK-MF5-04` pode auditar acessos posteriores se notificações passarem a referenciar recursos sensíveis.

#### Changelog
- `2026-06-15`: guia reescrito para notificações internas seguras, com modelo, service, routes, UI e negativos `P0`.
