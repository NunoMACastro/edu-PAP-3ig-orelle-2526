# BK-MF7-02 - Direito a eliminar conta e dados (incluindo fotos)

## Header
- `doc_id`: `GUIA-BK-MF7-02`
- `bk_id`: `BK-MF7-02`
- `macro`: `MF7`
- `owner`: `Izelicks`
- `apoio`: `Bruna`
- `prioridade`: `P0`
- `estado`: `TODO`
- `esforco`: `M`
- `dependencias`: `-`
- `rf_rnf`: `RNF13`
- `fase_documental`: `Fase 3`
- `sprint`: `S11-S12`
- `core_or_reforco`: `Reforco`
- `classe_core_dual`: `CORE-HIBRIDO`
- `eixo_primario`: `ConfiancaConversao`
- `kpi_primario`: `add_to_cart_recomendado`
- `kpi_secundario`: `retencao_fluxo_ia_30d`
- `proximo_bk`: `BK-MF7-03`
- `guia_path`: `docs/planificacao/guias-bk/MF7/BK-MF7-02-direito-a-eliminar-conta-e-dados-incluindo-fotos.md`
- `last_updated`: `2026-06-26`

#### Objetivo

Neste BK vais fechar o direito de eliminação/anonimização de conta e dados sensíveis. O utilizador cliente deve conseguir pedir tratamento dos seus dados faciais, e a equipa autorizada deve decidir o pedido sem expor fotografias, relatórios completos, cookies, tokens ou caminhos internos.

`CANONICO`: `RNF13` exige direito a eliminar conta e dados, incluindo fotos. `RF41` já define painel para consultores/admins reverem pedidos de eliminação/anonymização de fotografias e relatórios. `RF44` reforça que acessos e decisões sobre dados biométricos devem ser auditáveis.

#### Importância

O direito de apagamento não pode ser um botão que remove dados sem controlo. A app precisa de pedido, decisão autorizada, auditoria e estado durável. Assim, se uma operação falhar, o pedido não fica perdido, e os dados deixam de aparecer nos fluxos normais sem destruir a rastreabilidade mínima necessária para defesa técnica e privacidade.

#### Scope-in

- Criar pedido de privacidade biométrica feito pelo próprio cliente.
- Permitir ação `delete` ou `anonymize` sobre fotografias e relatórios.
- Aplicar estados `deleted` e `anonymized` nos modelos sensíveis.
- Garantir decisão apenas por consultor ou administrador autenticado.
- Registar auditoria na listagem e em cada decisão.
- Criar UI de cliente para pedir eliminação/anonimização.
- Criar UI de revisão para consultor/admin com dados minimizados.
- Validar negativos de sessão, role, recurso inválido, pedido inexistente, pedido já decidido e falha operacional.

#### Scope-out

- Não apagar ficheiros físicos sem desenho operacional de retenção e backups.
- Não expor fotografias, relatórios completos, storage key, token, cookie ou paths internos no painel.
- Não permitir que o frontend escolha `requesterId`, `reviewerId` ou `subjectUserId`.
- Não alterar pagamentos, carrinho, encomendas ou recomendações.
- Não criar novo consentimento RGPD; o consentimento facial fica no `BK-MF7-01`.
- Não substituir a encriptação em repouso definida no `BK-MF6-07`.

#### Estado antes e depois

- Antes: a app já tem fotografias, relatórios, consentimento e pedidos biométricos, mas o aluno ainda precisa de um fluxo completo para fechar `RNF13` sem inventar service, controller, rotas, auditoria ou UI.
- Depois: o aluno tem um fluxo seguro de pedido, revisão, decisão, auditoria e alteração dos estados de privacidade, com código completo para backend, frontend e testes.

#### Pre-requisitos

- `BK-MF0-02`: login/logout com sessão segura por cookie HttpOnly.
- `BK-MF1-05`: fotografias faciais associadas ao utilizador autenticado.
- `BK-MF1-07`: relatórios faciais associados ao utilizador autenticado.
- `BK-MF5-01`: painel inicial de pedidos de eliminação/anonymização.
- `BK-MF5-04`: auditoria de acessos biométricos.
- `BK-MF6-07`: `privacyStatus` em relatórios e `status` em fotografias.
- `BK-MF7-01`: consentimento separado dos dados sensíveis.

#### Glossário

- Eliminação lógica: marcar dados como removidos dos fluxos normais sem destruir imediatamente todos os metadados.
- Anonimização: retirar a ligação pessoal útil entre o dado e a pessoa.
- Pedido pendente: pedido criado pelo cliente e ainda não decidido.
- Decisão autorizada: aprovação ou rejeição feita por consultor/admin autenticado.
- Auditoria sensível: registo mínimo de quem acedeu ou decidiu, sem copiar dados biométricos.
- DTO seguro: resposta preparada para API/UI que não devolve conteúdo sensível.
- Transação: grupo de alterações que deve confirmar tudo em conjunto quando o MongoDB suporta essa garantia.
- Fallback durável: estado persistido que permite recuperar uma operação quando não há transação real.

#### Conceitos teóricos essenciais

Um pedido de privacidade biométrica começa no cliente, mas o dono dos dados vem sempre da sessão. O frontend envia intenção (`action`, `resources`, `reason`); o backend coloca `requesterId` com `req.user.id`. Este desenho evita que um utilizador envie o ID de outra pessoa no body.

Eliminar e anonimizar são ações diferentes. Eliminar retira fotografia ou relatório dos fluxos normais. Anonimizar conserva estrutura mínima, mas remove conteúdo pessoal útil. Em ambos os casos, os services seguintes devem filtrar dados com `status` ou `privacyStatus`.

A decisão pertence a consultor/admin. O cliente pode pedir, mas não deve aprovar o próprio pedido. A listagem e a decisão mostram metadados: `id`, `action`, `resources`, `status`, datas e motivos. Não mostram fotografia, relatório completo, storage key, cookie, token ou detalhes internos.

A auditoria existe porque `RF44` trata acessos biométricos. O log deve dizer quem listou ou decidiu, que pedido foi tocado, se a tentativa foi aceite ou recusada e qual foi a razão operacional. O log não deve guardar cópia de relatório, imagem ou segredo.

`DERIVADO`: quando o MongoDB suporta transações, a decisão aprovada deve usar sessão transacional. Quando o runtime local não suporta transações, o pedido passa por `processing` e pode terminar em `failed`, permitindo recuperação sem fingir sucesso.

#### Arquitetura do BK

- Model: `BiometricDataRequest`.
- Validator: `validateCreateBiometricDataRequestInput` e `validateBiometricDataRequestDecisionInput`.
- Service: criação, listagem, auditoria, decisão, eliminação, anonimização e fallback durável.
- Controller: handlers HTTP com `201`, `200`, `400`, `401`, `403`, `404`, `409` e erro controlado.
- Routes: `/api/me/biometric-data-requests` e `/api/admin/biometric-data-requests`.
- Frontend: `BiometricDataRequestPage` para cliente e `BiometricDataRequestsAdminPage` para consultor/admin.
- Testes: integração HTTP com sessão, roles, recursos inválidos, decisão repetida, rejeição, aprovação, ownership e falha operacional.
- Handoff: `BK-MF7-03` mantém estes endpoints protegidos por cookie HttpOnly e `credentials: "include"`.

#### Ficheiros a criar/editar/rever

- EDITAR: `apps/api/src/models/biometric-data-request.model.js`
- EDITAR: `apps/api/src/validators/biometric-data-request.validator.js`
- EDITAR: `apps/api/src/services/biometric-data-request.service.js`
- EDITAR: `apps/api/src/controllers/biometric-data-request.controller.js`
- EDITAR: `apps/api/src/routes/biometric-data-request.routes.js`
- REVER: `apps/api/src/app.js`
- EDITAR: `apps/web/src/pages/BiometricDataRequestPage.jsx`
- EDITAR: `apps/web/src/pages/BiometricDataRequestsAdminPage.jsx`
- REVER: `apps/web/src/App.jsx`
- CRIAR: `apps/api/tests/mf7.biometric-data-requests.test.js`
- REVER: `apps/api/src/services/biometric-audit.service.js`
- REVER: `apps/api/src/models/face-photo.model.js`
- REVER: `apps/api/src/models/face-report.model.js`

#### Tutorial técnico linear

### Passo 1 - Confirmar fronteiras do direito de eliminação

1. Objetivo funcional do passo no contexto da app.

Separar pedido de privacidade, decisão autorizada, alteração real dos dados e auditoria.

2. Ficheiros envolvidos:
    - REVER: `docs/RNF.md`
    - REVER: `docs/RF.md`
    - REVER: `docs/planificacao/backlogs/MATRIZ-CANONICA-BK.md`
    - REVER: `docs/planificacao/backlogs/ANEXO-RNF-PARA-BKS.md`
    - REVER: `docs/planificacao/backlogs/ANEXO-RF-PARA-BKS.md`
    - LOCALIZAÇÃO: linhas de `RNF13`, `RF41`, `RF44`, `BK-MF7-02`.

3. Instruções do que fazer.

Confirma que `RNF13` é sobre direito de eliminação, que `RF41` define revisão por consultores/admins para fotografias e relatórios, e que `RF44` exige auditoria de acessos biométricos. Não transformes este BK em gestão genérica de contas; aqui o foco é tratamento seguro de fotografias e relatórios faciais.

4. Código completo, correto e integrado com a app final.

Sem código neste passo. A decisão é documental e evita criar um endpoint destrutivo sem autorização, ownership ou auditoria.

5. Explicação do código.

Sem código. Este passo protege o domínio: cliente pede, consultor/admin decide, backend aplica estados e auditoria regista a operação. Esta divisão evita que a UI decida ownership ou que a app apague dados sensíveis sem prova mínima.

6. Validação do passo.

Executa:

```bash
rg -n "RNF13|RF41|RF44|BK-MF7-02" docs/RNF.md docs/RF.md docs/planificacao/backlogs/MATRIZ-CANONICA-BK.md docs/planificacao/backlogs/ANEXO-RNF-PARA-BKS.md docs/planificacao/backlogs/ANEXO-RF-PARA-BKS.md
```

7. Cenário negativo/erro esperado.

Se tentares tratar eliminação como remoção global sem pedido, sem role e sem auditoria, perdes rastreabilidade e podes alterar fotografias ou relatórios de outro utilizador.

### Passo 2 - Definir modelo completo do pedido de privacidade

1. Objetivo funcional do passo no contexto da app.

Guardar o pedido do cliente sem copiar fotografias, relatórios completos ou paths internos.

2. Ficheiros envolvidos:
    - EDITAR: `apps/api/src/models/biometric-data-request.model.js`
    - LOCALIZAÇÃO: ficheiro completo.

3. Instruções do que fazer.

Substitui o ficheiro pelo código completo abaixo. O model guarda apenas metadados: dono do pedido, ação, recursos, estado, revisor, motivo da decisão e datas. O conteúdo sensível continua nos modelos `FacePhoto` e `FaceReport`.

4. Código completo, correto e integrado com a app final.

```js
// apps/api/src/models/biometric-data-request.model.js
/**
 * Modelo de pedidos de privacidade sobre dados biométricos.
 *
 * O pedido guarda apenas metadados de decisão. Fotografias, storage keys,
 * paths internos e relatórios completos continuam nos modelos de origem.
 */
import mongoose from "mongoose";

const { Schema, model } = mongoose;

export const BIOMETRIC_REQUEST_ACTIONS = Object.freeze({
    DELETE: "delete",
    ANONYMIZE: "anonymize",
});

export const BIOMETRIC_REQUEST_RESOURCES = Object.freeze({
    PHOTOS: "photos",
    REPORTS: "reports",
});

export const BIOMETRIC_REQUEST_STATUSES = Object.freeze({
    PENDING: "pending",
    PROCESSING: "processing",
    FAILED: "failed",
    REJECTED: "rejected",
    COMPLETED: "completed",
});

const biometricDataRequestSchema = new Schema(
    {
        requesterId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
        action: {
            type: String,
            enum: Object.values(BIOMETRIC_REQUEST_ACTIONS),
            required: true,
        },
        resources: {
            type: [String],
            enum: Object.values(BIOMETRIC_REQUEST_RESOURCES),
            required: true,
            validate: {
                validator(resources) {
                    // Um pedido sem recurso não tem alvo seguro para aplicar RNF13.
                    return Array.isArray(resources) && resources.length > 0;
                },
                message: "Indica pelo menos um tipo de recurso.",
            },
        },
        reason: {
            type: String,
            trim: true,
            maxlength: 500,
            default: "",
        },
        status: {
            type: String,
            enum: Object.values(BIOMETRIC_REQUEST_STATUSES),
            default: BIOMETRIC_REQUEST_STATUSES.PENDING,
            index: true,
        },
        reviewerId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            default: null,
        },
        decisionReason: {
            type: String,
            trim: true,
            maxlength: 500,
            default: "",
        },
        decisionError: {
            type: String,
            trim: true,
            maxlength: 500,
            default: "",
        },
        reviewedAt: {
            type: Date,
            default: null,
        },
        completedAt: {
            type: Date,
            default: null,
        },
    },
    { timestamps: true },
);

// Estes índices suportam o painel de revisão sem procurar por conteúdo biométrico.
biometricDataRequestSchema.index({ status: 1, createdAt: -1 });
biometricDataRequestSchema.index({ requesterId: 1, status: 1 });

/**
 * Modelo Mongoose dos pedidos de eliminação/anonymização de dados biométricos.
 *
 * @type {import("mongoose").Model}
 */
export const BiometricDataRequest = model(
    "BiometricDataRequest",
    biometricDataRequestSchema,
);
```

5. Explicação do código.

O ficheiro define listas fechadas para ações, recursos e estados. Isto impede texto livre como `all`, `database` ou outro alvo fora de `RNF13`. O campo `requesterId` fica indexado porque todas as alterações posteriores devem respeitar ownership. O model não guarda fotografia, relatório completo, storage key, cookie ou token; guarda apenas metadados de decisão. Os estados `processing` e `failed` preparam o fallback operacional usado no service quando não existe transação MongoDB real.

6. Validação do passo.

Executa:

```bash
rg -n "BIOMETRIC_REQUEST_ACTIONS|BIOMETRIC_REQUEST_STATUSES|requesterId|decisionError" apps/api/src/models/biometric-data-request.model.js
```

Confirma que `resources` exige pelo menos um valor e que não existe campo para guardar fotografia, relatório completo ou storage key.

7. Cenário negativo/erro esperado.

Um pedido com `resources: []` deve falhar no validator e no schema. Um pedido que tente recurso `orders` deve falhar porque encomendas não fazem parte deste BK.

### Passo 3 - Validar criação e decisão do pedido

1. Objetivo funcional do passo no contexto da app.

Recusar ações, recursos e decisões fora do contrato antes de chamar o service.

2. Ficheiros envolvidos:
    - EDITAR: `apps/api/src/validators/biometric-data-request.validator.js`
    - LOCALIZAÇÃO: ficheiro completo.

3. Instruções do que fazer.

Substitui o ficheiro pelo código abaixo. A criação aceita `action`, `resources` e `reason`. A decisão aceita `approved` ou `rejected`; rejeitar exige motivo mínimo para a decisão não ficar opaca.

4. Código completo, correto e integrado com a app final.

```js
// apps/api/src/validators/biometric-data-request.validator.js
/**
 * Validadores HTTP para pedidos de privacidade biométrica.
 */
import { AppError } from "../middlewares/error.middleware.js";
import {
    BIOMETRIC_REQUEST_ACTIONS,
    BIOMETRIC_REQUEST_RESOURCES,
} from "../models/biometric-data-request.model.js";

const ACTIONS = new Set(Object.values(BIOMETRIC_REQUEST_ACTIONS));
const RESOURCES = new Set(Object.values(BIOMETRIC_REQUEST_RESOURCES));
const DECISIONS = new Set(["approved", "rejected"]);

/**
 * Normaliza texto curto vindo do frontend sem o transformar em requisito novo.
 *
 * @function normalizeShortText
 * @param {unknown} value - Valor recebido no body.
 * @returns {string} Texto aparado e limitado.
 */
function normalizeShortText(value) {
    return String(value ?? "").trim().slice(0, 500);
}

/**
 * Valida o pedido criado pelo próprio cliente.
 *
 * @function validateCreateBiometricDataRequestInput
 * @param {Record<string, unknown>} body - Corpo recebido pela API.
 * @returns {{action: string, resources: string[], reason: string}} Dados normalizados.
 * @throws {AppError} Quando a ação ou os recursos são inválidos.
 */
export function validateCreateBiometricDataRequestInput(body = {}) {
    const action = String(body.action ?? "").trim();
    const resources = Array.isArray(body.resources)
        ? [...new Set(body.resources.map((item) => String(item).trim()))]
        : [];
    const reason = normalizeShortText(body.reason);

    if (!ACTIONS.has(action)) {
        throw new AppError(400, "Tipo de pedido inválido.");
    }

    if (!resources.length || resources.some((resource) => !RESOURCES.has(resource))) {
        // O backend não aceita recursos livres para impedir apagamentos fora do escopo RNF13.
        throw new AppError(400, "Recursos do pedido inválidos.");
    }

    return { action, resources, reason };
}

/**
 * Valida a decisão tomada por consultor ou administrador.
 *
 * @function validateBiometricDataRequestDecisionInput
 * @param {Record<string, unknown>} body - Corpo recebido pela API.
 * @returns {{decision: "approved"|"rejected", decisionReason: string}} Decisão normalizada.
 * @throws {AppError} Quando a decisão é inválida.
 */
export function validateBiometricDataRequestDecisionInput(body = {}) {
    const decision = String(body.decision ?? "").trim();
    const decisionReason = normalizeShortText(body.decisionReason);

    if (!DECISIONS.has(decision)) {
        throw new AppError(400, "Decisão do pedido inválida.");
    }

    if (decision === "rejected" && decisionReason.length < 5) {
        throw new AppError(400, "Justificação obrigatória ao rejeitar pedido.");
    }

    return { decision, decisionReason };
}
```

5. Explicação do código.

Os `Set` fecham o vocabulário permitido. A criação não aceita recursos livres, e a decisão não aceita valores como `done`, `ok` ou `delete-now`. O helper `normalizeShortText` limita motivo e justificação a 500 caracteres para evitar payloads enormes e mensagens inesperadas. A rejeição exige motivo mínimo porque o cliente precisa de explicação auditável.

6. Validação do passo.

Executa:

```bash
rg -n "validateCreateBiometricDataRequestInput|validateBiometricDataRequestDecisionInput|Tipo de pedido inválido|Justificação obrigatória" apps/api/src/validators/biometric-data-request.validator.js
```

Testa criação com recurso inválido, sem recurso e decisão `rejected` sem motivo suficiente.

7. Cenário negativo/erro esperado.

Um cliente não pode pedir recurso `orders`, porque encomendas não fazem parte deste BK. Um consultor/admin não pode decidir com `decision: "maybe"`.

### Passo 4 - Implementar service com ownership, auditoria e fallback durável

1. Objetivo funcional do passo no contexto da app.

Criar, listar e decidir pedidos, garantindo que os recursos alterados pertencem ao cliente do pedido.

2. Ficheiros envolvidos:
    - EDITAR: `apps/api/src/services/biometric-data-request.service.js`
    - LOCALIZAÇÃO: ficheiro completo.

3. Instruções do que fazer.

Substitui o ficheiro pelo código abaixo. Este service é o centro do BK: converte respostas para DTO seguro, lista pedidos com auditoria, aplica eliminação ou anonimização com filtro por `requesterId`, usa transação quando possível e grava `failed` quando a aplicação falha sem transação.

4. Código completo, correto e integrado com a app final.

```js
// apps/api/src/services/biometric-data-request.service.js
/**
 * Service do fluxo RNF13/RF41 para pedidos de eliminação/anonymização biométrica.
 */
import mongoose from "mongoose";
import { AppError } from "../middlewares/error.middleware.js";
import {
    BIOMETRIC_REQUEST_ACTIONS,
    BIOMETRIC_REQUEST_RESOURCES,
    BIOMETRIC_REQUEST_STATUSES,
    BiometricDataRequest,
} from "../models/biometric-data-request.model.js";
import { FacePhoto } from "../models/face-photo.model.js";
import { FaceReport } from "../models/face-report.model.js";
import {
    BIOMETRIC_AUDIT_ACTIONS,
    BIOMETRIC_AUDIT_RESOURCE_TYPES,
    BIOMETRIC_AUDIT_RESULTS,
    recordBiometricAccess,
} from "./biometric-audit.service.js";

const RECOVERABLE_DECISION_ERROR =
    "Falha operacional ao aplicar pedido de privacidade. Pode ser reprocessado.";

/**
 * Converte um valor de ID para string sem assumir ObjectId real em testes.
 *
 * @function idToString
 * @param {unknown} value - ID vindo de documento real ou mock.
 * @returns {string|null} ID textual ou null.
 */
function idToString(value) {
    return value ? value.toString() : null;
}

/**
 * Converte pedido para DTO seguro para cliente e painel.
 *
 * @function toBiometricDataRequestResponse
 * @param {object} request - Documento Mongoose ou objeto equivalente.
 * @returns {object} Pedido sem dados biométricos brutos.
 */
function toBiometricDataRequestResponse(request) {
    return {
        id: idToString(request._id),
        requesterId: idToString(request.requesterId),
        action: request.action,
        resources: request.resources,
        reason: request.reason ?? "",
        status: request.status,
        reviewerId: idToString(request.reviewerId),
        decisionReason: request.decisionReason ?? "",
        decisionError: request.decisionError ?? "",
        createdAt: request.createdAt,
        reviewedAt: request.reviewedAt ?? null,
        completedAt: request.completedAt ?? null,
    };
}

/**
 * Devolve options de Mongoose apenas quando uma transação real está ativa.
 *
 * @function sessionOptions
 * @param {import("mongoose").ClientSession|null} session - Sessão transacional opcional.
 * @returns {{session: import("mongoose").ClientSession}|undefined} Options para queries/saves.
 */
function sessionOptions(session) {
    return session ? { session } : undefined;
}

/**
 * Indica se a ligação atual parece suportar transações MongoDB.
 *
 * MongoDB standalone não suporta transações. Nesses ambientes, o service usa um
 * estado durável `processing`/`failed` para evitar pedidos presos em `pending`
 * após mutações parciais e permitir recuperação operacional.
 *
 * @function canUseMongoTransactions
 * @returns {boolean} True quando a ligação está pronta e não parece standalone.
 */
function canUseMongoTransactions() {
    const topologyType =
        mongoose.connection?.client?.topology?.description?.type ?? "";

    return mongoose.connection.readyState === 1 && topologyType !== "Single";
}

/**
 * Inicia sessão transacional apenas quando o runtime MongoDB a suporta.
 *
 * @async
 * @function createOptionalSession
 * @returns {Promise<import("mongoose").ClientSession|null>} Sessão ou null para fallback durável.
 */
async function createOptionalSession() {
    if (!canUseMongoTransactions()) return null;

    return mongoose.startSession();
}

/**
 * Executa uma decisão com transação quando disponível.
 *
 * @async
 * @function runWithOptionalTransaction
 * @param {(session: import("mongoose").ClientSession|null) => Promise<object>} handler - Mutação a executar.
 * @returns {Promise<object>} Resultado do handler.
 */
async function runWithOptionalTransaction(handler) {
    const session = await createOptionalSession();

    if (!session) return handler(null);

    try {
        let result;

        await session.withTransaction(async () => {
            result = await handler(session);
        });

        return result;
    } finally {
        await session.endSession();
    }
}

/**
 * Carrega pedido com a sessão transacional quando existir.
 *
 * @async
 * @function findBiometricDataRequestById
 * @param {string} requestId - ID validado do pedido.
 * @param {import("mongoose").ClientSession|null} session - Sessão transacional opcional.
 * @returns {Promise<object|null>} Documento de pedido ou null.
 */
async function findBiometricDataRequestById(requestId, session) {
    const options = sessionOptions(session);

    return options
        ? BiometricDataRequest.findById(requestId, null, options)
        : BiometricDataRequest.findById(requestId);
}

/**
 * Grava pedido com a transação recebida pelo caller.
 *
 * @async
 * @function saveBiometricDataRequest
 * @param {object} request - Documento Mongoose ou mock equivalente.
 * @param {import("mongoose").ClientSession|null} session - Sessão transacional opcional.
 * @returns {Promise<void>} Conclui após persistência.
 */
async function saveBiometricDataRequest(request, session) {
    const options = sessionOptions(session);

    if (options) {
        await request.save(options);
        return;
    }

    await request.save();
}

/**
 * Cria pedido de tratamento dos dados faciais do cliente autenticado.
 *
 * @async
 * @function createMyBiometricDataRequest
 * @param {string} userId - Utilizador autenticado pela sessão.
 * @param {{action: string, resources: string[], reason: string}} input - Dados validados.
 * @returns {Promise<object>} Pedido criado em formato seguro.
 */
export async function createMyBiometricDataRequest(userId, input) {
    const request = await BiometricDataRequest.create({
        // O requesterId vem da sessão, nunca do body, para preservar ownership.
        requesterId: userId,
        action: input.action,
        resources: input.resources,
        reason: input.reason,
    });

    return toBiometricDataRequestResponse(request);
}

/**
 * Lista pedidos para o painel de revisão e regista auditoria RF44.
 *
 * @async
 * @function listBiometricDataRequestsForReview
 * @param {{id: string, role: string}} actor - Consultor/admin autenticado.
 * @returns {Promise<object[]>} Pedidos minimizados, mais recentes primeiro.
 */
export async function listBiometricDataRequestsForReview(actor) {
    const requests = await BiometricDataRequest.find()
        .sort({ createdAt: -1 })
        .limit(100);

    await recordBiometricAccess({
        actorId: actor.id,
        actorRole: actor.role,
        action: BIOMETRIC_AUDIT_ACTIONS.LIST_REQUESTS,
        resourceType: BIOMETRIC_AUDIT_RESOURCE_TYPES.REQUEST,
        reason: "Listagem de pedidos biométricos para revisão.",
    });

    return requests.map(toBiometricDataRequestResponse);
}

/**
 * Regista uma tentativa de decisão sobre pedido biométrico.
 *
 * @async
 * @function recordDecisionAudit
 * @param {{id: string, role: string}} actor - Consultor/admin autenticado.
 * @param {object|null} request - Pedido encontrado, quando existir.
 * @param {{resourceId: string, result: string, reason: string}} event - Metadados do resultado.
 * @returns {Promise<void>} Conclui após gravar auditoria.
 */
async function recordDecisionAudit(actor, request, event) {
    await recordBiometricAccess({
        actorId: actor.id,
        actorRole: actor.role,
        subjectUserId: idToString(request?.requesterId),
        action: BIOMETRIC_AUDIT_ACTIONS.DECIDE_REQUEST,
        resourceType: BIOMETRIC_AUDIT_RESOURCE_TYPES.REQUEST,
        resourceId: event.resourceId,
        result: event.result,
        reason: event.reason,
    });
}

/**
 * Aplica eliminação lógica aos recursos selecionados.
 *
 * @async
 * @function applyDeleteAction
 * @param {import("mongoose").Types.ObjectId|string} requesterId - Dono dos recursos.
 * @param {string[]} resources - Recursos pedidos.
 * @param {import("mongoose").ClientSession|null} session - Sessão transacional opcional.
 * @returns {Promise<void>} Conclui quando os recursos ficam fora da operação normal.
 */
async function applyDeleteAction(requesterId, resources, session) {
    const options = sessionOptions(session);

    if (resources.includes(BIOMETRIC_REQUEST_RESOURCES.PHOTOS)) {
        const filter = { userId: requesterId, status: "active" };
        const update = { $set: { status: "deleted" } };

        // O filtro por userId impede decisões administrativas sobre recursos de outro cliente.
        if (options) await FacePhoto.updateMany(filter, update, options);
        else await FacePhoto.updateMany(filter, update);
    }

    if (resources.includes(BIOMETRIC_REQUEST_RESOURCES.REPORTS)) {
        const filter = { userId: requesterId, privacyStatus: { $ne: "deleted" } };
        const update = {
            $set: {
                privacyStatus: "deleted",
                cosmeticSummary: "Relatório removido por pedido de privacidade.",
                routineSuggestions: [],
                sources: ["privacy_request_delete"],
                limitations: ["Conteúdo indisponível após eliminação lógica."],
            },
        };

        // O relatório fica sem conteúdo útil, mas mantém metadados mínimos para auditoria.
        if (options) await FaceReport.updateMany(filter, update, options);
        else await FaceReport.updateMany(filter, update);
    }
}

/**
 * Aplica anonymização mínima aos recursos selecionados.
 *
 * @async
 * @function applyAnonymizeAction
 * @param {import("mongoose").Types.ObjectId|string} requesterId - Dono dos recursos.
 * @param {string[]} resources - Recursos pedidos.
 * @param {import("mongoose").ClientSession|null} session - Sessão transacional opcional.
 * @returns {Promise<void>} Conclui quando os dados deixam de ser úteis para identificação.
 */
async function applyAnonymizeAction(requesterId, resources, session) {
    const options = sessionOptions(session);

    if (resources.includes(BIOMETRIC_REQUEST_RESOURCES.PHOTOS)) {
        const filter = { userId: requesterId, status: "active" };
        const update = {
            $set: {
                status: "anonymized",
                originalName: "fotografia-anonimizada",
            },
        };

        if (options) await FacePhoto.updateMany(filter, update, options);
        else await FacePhoto.updateMany(filter, update);
    }

    if (resources.includes(BIOMETRIC_REQUEST_RESOURCES.REPORTS)) {
        const filter = { userId: requesterId, privacyStatus: { $ne: "deleted" } };
        const update = {
            $set: {
                privacyStatus: "anonymized",
                cosmeticSummary: "Relatório anonimizado a pedido do utilizador.",
                routineSuggestions: [],
                sources: ["privacy_request_anonymize"],
                limitations: ["Conteúdo pessoal removido por pedido de privacidade."],
            },
        };

        if (options) await FaceReport.updateMany(filter, update, options);
        else await FaceReport.updateMany(filter, update);
    }
}

/**
 * Aplica a ação aprovada aos recursos pedidos.
 *
 * @async
 * @function applyApprovedBiometricDataRequest
 * @param {object} request - Pedido aprovado.
 * @param {import("mongoose").ClientSession|null} session - Sessão transacional opcional.
 * @returns {Promise<void>} Conclui quando os recursos foram tratados.
 * @throws {AppError} Quando a ação gravada no pedido não é suportada.
 */
async function applyApprovedBiometricDataRequest(request, session) {
    if (request.action === BIOMETRIC_REQUEST_ACTIONS.DELETE) {
        await applyDeleteAction(request.requesterId, request.resources, session);
        return;
    }

    if (request.action === BIOMETRIC_REQUEST_ACTIONS.ANONYMIZE) {
        await applyAnonymizeAction(request.requesterId, request.resources, session);
        return;
    }

    throw new AppError(400, "Ação do pedido inválida.");
}

/**
 * Garante que o pedido pode ser decidido ou reprocessado de forma segura.
 *
 * @function assertRequestCanBeDecided
 * @param {object} request - Pedido carregado.
 * @param {{decision: "approved"|"rejected"}} input - Decisão validada.
 * @returns {void}
 * @throws {AppError} Quando o estado atual não aceita a decisão.
 */
function assertRequestCanBeDecided(request, input) {
    if (request.status === BIOMETRIC_REQUEST_STATUSES.PENDING) return;

    if (
        request.status === BIOMETRIC_REQUEST_STATUSES.FAILED &&
        input.decision === "approved"
    ) {
        return;
    }

    if (request.status === BIOMETRIC_REQUEST_STATUSES.PROCESSING) {
        throw new AppError(409, "Pedido ainda está em processamento.");
    }

    throw new AppError(409, "Pedido já foi decidido.");
}

/**
 * Guarda estado falhado recuperável sem expor detalhes internos ao frontend.
 *
 * @async
 * @function markDecisionAsFailed
 * @param {object} request - Pedido cuja aprovação falhou.
 * @returns {Promise<void>} Conclui quando o estado recuperável fica gravado.
 */
async function markDecisionAsFailed(request) {
    request.status = BIOMETRIC_REQUEST_STATUSES.FAILED;
    request.decisionError = RECOVERABLE_DECISION_ERROR;
    await saveBiometricDataRequest(request, null);
}

/**
 * Aplica aprovação com transação quando possível e fallback durável quando não.
 *
 * @async
 * @function approveBiometricDataRequest
 * @param {object} request - Pedido a aprovar.
 * @param {string} reviewerId - Revisor autenticado.
 * @param {{decisionReason: string}} input - Input validado.
 * @param {import("mongoose").ClientSession|null} session - Sessão transacional opcional.
 * @returns {Promise<object>} Pedido atualizado em DTO seguro.
 */
async function approveBiometricDataRequest(request, reviewerId, input, session) {
    request.reviewerId = reviewerId;
    request.decisionReason = input.decisionReason;
    request.reviewedAt = new Date();
    request.status = BIOMETRIC_REQUEST_STATUSES.PROCESSING;
    request.decisionError = "";
    await saveBiometricDataRequest(request, session);

    try {
        await applyApprovedBiometricDataRequest(request, session);
        request.status = BIOMETRIC_REQUEST_STATUSES.COMPLETED;
        request.completedAt = new Date();
        request.decisionError = "";
        await saveBiometricDataRequest(request, session);
    } catch (err) {
        // Sem transação real, o estado `failed` permite retomar a decisão sem mascarar a falha.
        if (!session) await markDecisionAsFailed(request);
        throw err;
    }

    return toBiometricDataRequestResponse(request);
}

/**
 * Decide um pedido pendente e aplica tratamento quando há aprovação.
 *
 * @async
 * @function decideBiometricDataRequest
 * @param {string} requestId - Pedido a decidir.
 * @param {{id: string, role: string}} actor - Consultor/admin autenticado.
 * @param {{decision: "approved"|"rejected", decisionReason: string}} input - Decisão validada.
 * @returns {Promise<object>} Pedido atualizado.
 * @throws {AppError} Quando o pedido não existe, já foi decidido ou tem ID inválido.
 */
export async function decideBiometricDataRequest(requestId, actor, input) {
    if (!mongoose.isValidObjectId(requestId)) {
        await recordDecisionAudit(actor, null, {
            resourceId: requestId,
            result: BIOMETRIC_AUDIT_RESULTS.DENIED,
            reason: "Tentativa de decidir pedido com ID inválido.",
        });
        throw new AppError(400, "ID de pedido inválido.");
    }

    return runWithOptionalTransaction(async (session) => {
        const request = await findBiometricDataRequestById(requestId, session);

        if (!request) {
            await recordDecisionAudit(actor, null, {
                resourceId: requestId,
                result: BIOMETRIC_AUDIT_RESULTS.DENIED,
                reason: "Tentativa de decidir pedido inexistente.",
            });
            throw new AppError(404, "Pedido não encontrado.");
        }

        try {
            assertRequestCanBeDecided(request, input);
        } catch (err) {
            await recordDecisionAudit(actor, request, {
                resourceId: idToString(request._id) ?? requestId,
                result: BIOMETRIC_AUDIT_RESULTS.DENIED,
                reason: "Tentativa de decidir pedido em estado fechado.",
            });
            throw err;
        }

        request.reviewerId = actor.id;
        request.decisionReason = input.decisionReason;
        request.reviewedAt = new Date();
        request.decisionError = "";

        if (input.decision === "rejected") {
            request.status = BIOMETRIC_REQUEST_STATUSES.REJECTED;
            await saveBiometricDataRequest(request, session);
            await recordDecisionAudit(actor, request, {
                resourceId: idToString(request._id) ?? requestId,
                result: BIOMETRIC_AUDIT_RESULTS.ALLOWED,
                reason: "Pedido biométrico rejeitado por revisor autorizado.",
            });
            return toBiometricDataRequestResponse(request);
        }

        try {
            const approvedRequest = await approveBiometricDataRequest(
                request,
                actor.id,
                input,
                session,
            );

            await recordDecisionAudit(actor, request, {
                resourceId: idToString(request._id) ?? requestId,
                result: BIOMETRIC_AUDIT_RESULTS.ALLOWED,
                reason: "Pedido biométrico aprovado por revisor autorizado.",
            });

            return approvedRequest;
        } catch (err) {
            await recordDecisionAudit(actor, request, {
                resourceId: idToString(request._id) ?? requestId,
                result: BIOMETRIC_AUDIT_RESULTS.DENIED,
                reason: "Falha operacional ao aplicar decisão biométrica.",
            });
            throw err;
        }
    });
}
```

5. Explicação do código.

O service cria pedidos com `requesterId` vindo da sessão, lista apenas metadados e regista auditoria de listagem. A decisão começa por validar o ID, carregar o pedido e confirmar que o estado ainda permite decisão. Se a decisão for rejeição, só muda metadados do pedido. Se for aprovação, aplica `delete` ou `anonymize` sobre `FacePhoto` e `FaceReport` usando filtros por `requesterId`.

A transação é `DERIVADO`: não vem de um RF específico, mas é a forma técnica segura de agrupar decisão e mutações quando MongoDB suporta. Em MongoDB standalone, o fallback durável grava `processing` e depois `failed` se a aplicação falhar. Isto evita dizer ao cliente que o pedido foi concluído quando os recursos não foram tratados.

6. Validação do passo.

Executa:

```bash
rg -n "createMyBiometricDataRequest|listBiometricDataRequestsForReview|decideBiometricDataRequest|recordDecisionAudit|privacyStatus|status: \"deleted\"|status: \"anonymized\"" apps/api/src/services/biometric-data-request.service.js
```

Confirma que todas as queries que alteram fotografias ou relatórios filtram por `requesterId` e nunca por ID vindo do frontend.

7. Cenário negativo/erro esperado.

Um pedido de um cliente não pode alterar relatórios de outro cliente. Uma decisão repetida sobre pedido `completed` deve devolver `409`. Se a aplicação de recursos falhar sem transação, o pedido deve ficar `failed`.

### Passo 5 - Ligar controllers, rotas e montagem da API

1. Objetivo funcional do passo no contexto da app.

Expor endpoints autenticados para criação, listagem e decisão sem aceitar identidade pelo body.

2. Ficheiros envolvidos:
    - EDITAR: `apps/api/src/controllers/biometric-data-request.controller.js`
    - EDITAR: `apps/api/src/routes/biometric-data-request.routes.js`
    - REVER: `apps/api/src/app.js`
    - LOCALIZAÇÃO: ficheiros completos de controller/rotas e montagem `app.use("/api", biometricDataRequestRoutes)`.

3. Instruções do que fazer.

Substitui controller e rotas pelos ficheiros abaixo. Depois confirma em `apps/api/src/app.js` que existe `import { biometricDataRequestRoutes } from "./routes/biometric-data-request.routes.js";` e `app.use("/api", biometricDataRequestRoutes);`.

4. Código completo, correto e integrado com a app final.

```js
// apps/api/src/controllers/biometric-data-request.controller.js
/**
 * Controllers HTTP para pedidos de privacidade biométrica.
 */
import {
    validateBiometricDataRequestDecisionInput,
    validateCreateBiometricDataRequestInput,
} from "../validators/biometric-data-request.validator.js";
import {
    createMyBiometricDataRequest,
    decideBiometricDataRequest,
    listBiometricDataRequestsForReview,
} from "../services/biometric-data-request.service.js";

/**
 * Cria pedido de eliminação/anonymização para o cliente autenticado.
 *
 * @async
 * @function createMyBiometricDataRequestController
 * @param {import("express").Request & {user: {id: string}}} req - Pedido autenticado.
 * @param {import("express").Response} res - Resposta Express.
 * @param {import("express").NextFunction} next - Próximo middleware.
 * @returns {Promise<import("express").Response|void>} Resposta 201 com pedido minimizado.
 */
export async function createMyBiometricDataRequestController(req, res, next) {
    try {
        const input = validateCreateBiometricDataRequestInput(req.body);
        const request = await createMyBiometricDataRequest(req.user.id, input);

        return res.status(201).json({ request });
    } catch (err) {
        return next(err);
    }
}

/**
 * Lista pedidos para revisão por consultor ou administrador.
 *
 * @async
 * @function listBiometricDataRequestsController
 * @param {import("express").Request & {user: {id: string, role: string}}} req - Pedido protegido por role.
 * @param {import("express").Response} res - Resposta Express.
 * @param {import("express").NextFunction} next - Próximo middleware.
 * @returns {Promise<import("express").Response|void>} Resposta 200 com pedidos minimizados.
 */
export async function listBiometricDataRequestsController(req, res, next) {
    try {
        const requests = await listBiometricDataRequestsForReview(req.user);

        return res.status(200).json({ requests });
    } catch (err) {
        return next(err);
    }
}

/**
 * Aprova ou rejeita pedido biométrico pendente.
 *
 * @async
 * @function decideBiometricDataRequestController
 * @param {import("express").Request & {user: {id: string, role: string}}} req - Pedido autenticado de consultor/admin.
 * @param {import("express").Response} res - Resposta Express.
 * @param {import("express").NextFunction} next - Próximo middleware.
 * @returns {Promise<import("express").Response|void>} Resposta 200 com decisão aplicada.
 */
export async function decideBiometricDataRequestController(req, res, next) {
    try {
        const input = validateBiometricDataRequestDecisionInput(req.body);
        const request = await decideBiometricDataRequest(
            req.params.requestId,
            req.user,
            input,
        );

        return res.status(200).json({ request });
    } catch (err) {
        return next(err);
    }
}
```

```js
// apps/api/src/routes/biometric-data-request.routes.js
/**
 * Rotas de pedidos de eliminação/anonymização de dados faciais.
 */
import { Router } from "express";
import { ROLES } from "../constants/roles.js";
import {
    createMyBiometricDataRequestController,
    decideBiometricDataRequestController,
    listBiometricDataRequestsController,
} from "../controllers/biometric-data-request.controller.js";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { requireRole } from "../middlewares/role.middleware.js";

/**
 * Router Express para RNF13/RF41.
 *
 * @type {import("express").Router}
 */
export const biometricDataRequestRoutes = Router();

biometricDataRequestRoutes.post(
    "/me/biometric-data-requests",
    requireAuth,
    requireRole(ROLES.CLIENTE),
    createMyBiometricDataRequestController,
);

biometricDataRequestRoutes.get(
    "/admin/biometric-data-requests",
    requireAuth,
    requireRole(ROLES.CONSULTOR, ROLES.ADMIN),
    listBiometricDataRequestsController,
);

biometricDataRequestRoutes.patch(
    "/admin/biometric-data-requests/:requestId/decision",
    requireAuth,
    requireRole(ROLES.CONSULTOR, ROLES.ADMIN),
    decideBiometricDataRequestController,
);
```

5. Explicação do código.

O controller faz validação antes de chamar o service. A criação usa `req.user.id`, por isso ignora qualquer `requesterId` enviado pelo frontend. A listagem e a decisão recebem `req.user`, permitindo registar auditoria com ator e role. As rotas usam `requireAuth` em todos os endpoints e `requireRole` para separar cliente de consultor/admin.

6. Validação do passo.

Executa:

```bash
rg -n "biometricDataRequestRoutes|createMyBiometricDataRequestController|listBiometricDataRequestsController|decideBiometricDataRequestController|app.use\\(\"/api\", biometricDataRequestRoutes\\)" apps/api/src
```

7. Cenário negativo/erro esperado.

Sem sessão, os endpoints devem devolver `401`. Cliente autenticado não pode aceder a `/api/admin/biometric-data-requests`. Consultor/admin não pode criar pedido em nome de cliente pela rota `/me`.

### Passo 6 - Criar UI de cliente e revisão minimizada

1. Objetivo funcional do passo no contexto da app.

Permitir ao cliente criar pedido e permitir ao consultor/admin decidir pedidos sem mostrar dados biométricos.

2. Ficheiros envolvidos:
    - EDITAR: `apps/web/src/pages/BiometricDataRequestPage.jsx`
    - EDITAR: `apps/web/src/pages/BiometricDataRequestsAdminPage.jsx`
    - REVER: `apps/web/src/App.jsx`
    - LOCALIZAÇÃO: ficheiros completos das páginas e rotas já existentes no shell.

3. Instruções do que fazer.

Substitui as duas páginas pelo código abaixo. Depois confirma que `apps/web/src/App.jsx` importa as páginas e tem entradas de navegação/rotas para cliente e revisão. A UI envia cookies através de `apiRequest`, que já usa `credentials: "include"`.

4. Código completo, correto e integrado com a app final.

```jsx
// apps/web/src/pages/BiometricDataRequestPage.jsx
/**
 * Página de cliente para criar pedidos de privacidade biométrica RNF13.
 */
import { useState } from "react";
import { FeedbackMessage } from "../components/FeedbackMessage.jsx";
import { SubmitButton } from "../components/SubmitButton.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { apiRequest } from "../services/apiClient.js";

const ACTION_OPTIONS = Object.freeze([
    {
        value: "delete",
        label: "Eliminar dados biométricos",
    },
    {
        value: "anonymize",
        label: "Anonimizar dados biométricos",
    },
]);

const RESOURCE_OPTIONS = Object.freeze([
    {
        value: "photos",
        label: "Fotografias faciais",
    },
    {
        value: "reports",
        label: "Relatórios cosméticos",
    },
]);

/**
 * Alterna um recurso numa lista de recursos selecionados.
 *
 * @function toggleResourceValue
 * @param {string[]} resources - Recursos atualmente selecionados.
 * @param {string} value - Recurso a adicionar ou remover.
 * @param {boolean} checked - Estado final do checkbox.
 * @returns {string[]} Próxima lista de recursos.
 */
function toggleResourceValue(resources, value, checked) {
    if (checked) {
        return [...new Set([...resources, value])];
    }

    return resources.filter((resource) => resource !== value);
}

/**
 * Formulário de cliente para pedir eliminação ou anonimização de dados faciais.
 *
 * @function BiometricDataRequestPage
 * @returns {JSX.Element} UI de criação de pedido RNF13 com feedback seguro.
 */
export function BiometricDataRequestPage() {
    const { user } = useAuth();
    const [form, setForm] = useState({
        action: "delete",
        resources: ["photos", "reports"],
        reason: "",
    });
    const [status, setStatus] = useState("idle");
    const [message, setMessage] = useState("");
    const [createdRequest, setCreatedRequest] = useState(null);

    /**
     * Atualiza campo simples do formulário.
     *
     * @function updateField
     * @param {import("react").ChangeEvent<HTMLSelectElement|HTMLTextAreaElement>} event - Evento do campo.
     * @returns {void}
     */
    function updateField(event) {
        const { name, value } = event.target;

        setForm((current) => ({
            ...current,
            [name]: value,
        }));
    }

    /**
     * Atualiza a lista de recursos sem aceitar ownership vindo da UI.
     *
     * @function updateResource
     * @param {import("react").ChangeEvent<HTMLInputElement>} event - Evento do checkbox.
     * @returns {void}
     */
    function updateResource(event) {
        const { value, checked } = event.target;

        setForm((current) => ({
            ...current,
            resources: toggleResourceValue(current.resources, value, checked),
        }));
    }

    /**
     * Cria o pedido no endpoint autenticado do cliente.
     *
     * @async
     * @function handleSubmit
     * @param {import("react").FormEvent<HTMLFormElement>} event - Evento do formulário.
     * @returns {Promise<void>}
     */
    async function handleSubmit(event) {
        event.preventDefault();

        if (form.resources.length === 0) {
            setStatus("error");
            setMessage("Escolhe pelo menos um tipo de dado para o pedido.");
            return;
        }

        setStatus("loading");
        setMessage("");
        setCreatedRequest(null);

        try {
            const data = await apiRequest("/me/biometric-data-requests", {
                method: "POST",
                body: JSON.stringify({
                    action: form.action,
                    resources: form.resources,
                    reason: form.reason,
                }),
            });

            setStatus("success");
            setMessage("Pedido criado. Um consultor ou administrador vai rever a decisão.");
            setCreatedRequest(data.request ?? null);
            setForm((current) => ({
                ...current,
                reason: "",
            }));
        } catch (err) {
            // A API decide sessão, ownership e role; a UI mostra apenas mensagem segura.
            setStatus("error");
            setMessage(err.message);
        }
    }

    const isBusy = status === "loading";
    const isClient = user?.role === "cliente";
    const isDisabled = !isClient || isBusy;
    const feedbackType = status === "error" ? "error" : "success";

    return (
        <section>
            <h1>Pedido de privacidade biométrica</h1>
            <p>
                Pede a eliminação ou anonimização das fotografias faciais e
                relatórios cosméticos associados à tua conta.
            </p>

            {!isClient && (
                <FeedbackMessage type="info">
                    Inicia sessão como cliente para criar um pedido.
                </FeedbackMessage>
            )}

            <form
                aria-describedby={message ? "biometric-request-feedback" : undefined}
                onSubmit={handleSubmit}
            >
                <label>
                    Tipo de pedido
                    <select
                        name="action"
                        value={form.action}
                        onChange={updateField}
                        disabled={isDisabled}
                    >
                        {ACTION_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </select>
                </label>

                {RESOURCE_OPTIONS.map((option) => (
                    <label key={option.value}>
                        <input
                            type="checkbox"
                            value={option.value}
                            checked={form.resources.includes(option.value)}
                            onChange={updateResource}
                            disabled={isDisabled}
                        />
                        {option.label}
                    </label>
                ))}

                <label>
                    Motivo opcional
                    <textarea
                        name="reason"
                        value={form.reason}
                        onChange={updateField}
                        maxLength={500}
                        disabled={isDisabled}
                    />
                </label>

                <SubmitButton
                    isBusy={isBusy}
                    disabled={!isClient}
                    busyText="A criar pedido..."
                >
                    Criar pedido de privacidade
                </SubmitButton>
            </form>

            <FeedbackMessage id="biometric-request-feedback" type={feedbackType}>
                {message}
            </FeedbackMessage>

            {createdRequest && (
                <article>
                    <h2>Pedido registado</h2>
                    <p>Estado: {createdRequest.status}</p>
                    <p>Pedido: {createdRequest.id}</p>
                </article>
            )}
        </section>
    );
}
```

```jsx
// apps/web/src/pages/BiometricDataRequestsAdminPage.jsx
/**
 * Painel RNF13/RF41 para revisão de pedidos de privacidade biométrica.
 */
import { useEffect, useState } from "react";
import { FeedbackMessage } from "../components/FeedbackMessage.jsx";
import { apiRequest } from "../services/apiClient.js";

/**
 * Formata listas curtas de recursos para leitura no painel.
 *
 * @function formatResources
 * @param {string[]} resources - Recursos pedidos pelo cliente.
 * @returns {string} Recursos formatados sem dados sensíveis.
 */
function formatResources(resources = []) {
    return resources.join(", ") || "sem recursos";
}

/**
 * Painel de revisão de pedidos de eliminação/anonymização de dados faciais.
 *
 * @function BiometricDataRequestsAdminPage
 * @returns {JSX.Element} Lista minimizada de pedidos e ações de decisão.
 */
export function BiometricDataRequestsAdminPage() {
    const [requests, setRequests] = useState([]);
    const [status, setStatus] = useState("idle");
    const [message, setMessage] = useState("");

    /**
     * Carrega pedidos minimizados do painel.
     *
     * @async
     * @function loadRequests
     * @returns {Promise<void>} Atualiza a lista e o estado visual.
     */
    async function loadRequests() {
        setStatus("loading");
        setMessage("");

        try {
            const data = await apiRequest("/admin/biometric-data-requests");
            const nextRequests = data.requests ?? [];

            setRequests(nextRequests);
            setStatus(nextRequests.length ? "success" : "empty");
        } catch (err) {
            setMessage(err.message);
            setStatus("error");
        }
    }

    useEffect(() => {
        loadRequests();
    }, []);

    /**
     * Envia a decisão do revisor para a API.
     *
     * @async
     * @function decideRequest
     * @param {string} requestId - Pedido biométrico a decidir.
     * @param {"approved"|"rejected"} decision - Decisão escolhida no painel.
     * @returns {Promise<void>} Recarrega a lista após decisão.
     */
    async function decideRequest(requestId, decision) {
        setStatus("loading");
        setMessage("");

        try {
            await apiRequest(
                `/admin/biometric-data-requests/${requestId}/decision`,
                {
                    method: "PATCH",
                    body: JSON.stringify({
                        decision,
                        decisionReason:
                            decision === "approved"
                                ? "Pedido aprovado no painel de privacidade."
                                : "Pedido rejeitado após revisão.",
                    }),
                },
            );
            await loadRequests();
        } catch (err) {
            // A mensagem vem do backend e não inclui fotografias, relatórios ou paths internos.
            setMessage(err.message);
            setStatus("error");
        }
    }

    const isBusy = status === "loading";

    return (
        <section>
            <h1>Pedidos de privacidade biométrica</h1>
            <button onClick={loadRequests} disabled={isBusy}>
                {isBusy ? "A carregar..." : "Atualizar pedidos"}
            </button>

            {isBusy && <p role="status">A carregar pedidos...</p>}
            {status === "empty" && <p>Sem pedidos para rever.</p>}
            {status === "error" && (
                <FeedbackMessage type="error">{message}</FeedbackMessage>
            )}

            {requests.length > 0 && (
                <ul>
                    {requests.map((item) => (
                        <li key={item.id}>
                            <strong>
                                {item.action} · {item.status}
                            </strong>
                            <p>Pedido: {item.id}</p>
                            <p>Utilizador: {item.requesterId}</p>
                            <p>Recursos: {formatResources(item.resources)}</p>
                            <p>Motivo: {item.reason || "Sem motivo indicado."}</p>
                            {item.status === "pending" && (
                                <p>
                                    <button
                                        type="button"
                                        disabled={isBusy}
                                        onClick={() => decideRequest(item.id, "approved")}
                                    >
                                        {isBusy ? "A aprovar..." : "Aprovar"}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => decideRequest(item.id, "rejected")}
                                        disabled={isBusy}
                                    >
                                        Rejeitar
                                    </button>
                                </p>
                            )}
                        </li>
                    ))}
                </ul>
            )}
        </section>
    );
}
```

5. Explicação do código.

A página de cliente envia apenas intenção: `action`, `resources` e `reason`. Não envia `requesterId`. O cookie HttpOnly identifica a conta no backend através de `apiRequest`. A página de revisão lista apenas metadados minimizados e chama a rota de decisão. O painel nunca mostra fotografia, relatório completo, storage key, token ou cookie. O estado `loading`, `error`, `empty` e `success` ajuda o aluno a provar o fluxo na defesa.

6. Validação do passo.

Executa:

```bash
rg -n "BiometricDataRequestPage|BiometricDataRequestsAdminPage|/me/biometric-data-requests|/admin/biometric-data-requests|credentials: \"include\"" apps/web/src
```

7. Cenário negativo/erro esperado.

Se a lista de recursos estiver vazia, a UI bloqueia submissão e a API também devolve `400`. Se um visitante abrir a página e tentar criar pedido, a API devolve `401`.

### Passo 7 - Criar testes e evidence do fluxo RNF13

1. Objetivo funcional do passo no contexto da app.

Provar que criação, revisão, decisão, ownership e negativos funcionam sem expor dados sensíveis.

2. Ficheiros envolvidos:
    - CRIAR: `apps/api/tests/mf7.biometric-data-requests.test.js`
    - LOCALIZAÇÃO: ficheiro completo.

3. Instruções do que fazer.

Cria o ficheiro abaixo. O teste usa mocks de modelos para focar contrato HTTP, sessão, roles e efeitos nos recursos. Executar cenários negativos obrigatórios (mínimo 3): sem sessão, role errada, recurso inválido, pedido fechado e falha operacional.

4. Código completo, correto e integrado com a app final.

```js
// apps/api/tests/mf7.biometric-data-requests.test.js
/**
 * Testes de integração HTTP do BK-MF7-02.
 *
 * Cobrem criação, revisão e efeitos de pedidos de privacidade biométrica sem
 * depender de MongoDB real. O foco é provar ownership por sessão, roles,
 * auditoria e minimização das respostas.
 */
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createApp } from "../src/app.js";
import { ROLES } from "../src/constants/roles.js";
import { BiometricDataRequest } from "../src/models/biometric-data-request.model.js";
import { FacePhoto } from "../src/models/face-photo.model.js";
import { FaceReport } from "../src/models/face-report.model.js";
import { User } from "../src/models/user.model.js";
import { recordBiometricAccess } from "../src/services/biometric-audit.service.js";
import { createSessionToken } from "../src/services/session.service.js";

vi.mock("../src/models/user.model.js", () => ({
    User: {
        findById: vi.fn(),
    },
}));

vi.mock("../src/models/biometric-data-request.model.js", () => ({
    BIOMETRIC_REQUEST_ACTIONS: {
        DELETE: "delete",
        ANONYMIZE: "anonymize",
    },
    BIOMETRIC_REQUEST_RESOURCES: {
        PHOTOS: "photos",
        REPORTS: "reports",
    },
    BIOMETRIC_REQUEST_STATUSES: {
        PENDING: "pending",
        PROCESSING: "processing",
        FAILED: "failed",
        REJECTED: "rejected",
        COMPLETED: "completed",
    },
    BiometricDataRequest: {
        create: vi.fn(),
        find: vi.fn(),
        findById: vi.fn(),
    },
}));

vi.mock("../src/models/face-photo.model.js", () => ({
    FacePhoto: {
        updateMany: vi.fn(),
    },
}));

vi.mock("../src/models/face-report.model.js", () => ({
    FaceReport: {
        updateMany: vi.fn(),
    },
}));

vi.mock("../src/services/biometric-audit.service.js", () => ({
    BIOMETRIC_AUDIT_ACTIONS: {
        LIST_REQUESTS: "list_requests",
        DECIDE_REQUEST: "decide_request",
        VIEW_AUDIT: "view_audit",
        VIEW_RESOURCE: "view_resource",
    },
    BIOMETRIC_AUDIT_RESOURCE_TYPES: {
        REQUEST: "request",
        PHOTO: "photo",
        REPORT: "report",
        AUDIT: "audit",
    },
    BIOMETRIC_AUDIT_RESULTS: {
        ALLOWED: "allowed",
        DENIED: "denied",
    },
    recordBiometricAccess: vi.fn(),
}));

const clienteId = "665f00000000000000000001";
const consultorId = "665f00000000000000000002";
const adminId = "665f00000000000000000003";
const requestId = "775f00000000000000000001";

/**
 * Cria cookie de sessão igual ao usado pela API real.
 *
 * @function cookieFor
 * @param {{id: string, role: string, email?: string}} user - Utilizador de teste.
 * @returns {string[]} Header Cookie para Supertest.
 */
function cookieFor(user) {
    const token = createSessionToken({
        id: user.id,
        email: user.email ?? `${user.id}@orelle.test`,
        role: user.role,
    });

    return [`orelle_session=${token}`];
}

/**
 * Simula query `sort().limit()`.
 *
 * @function querySortLimit
 * @param {unknown[]} result - Resultado final da query.
 * @returns {object} Query mock encadeável.
 */
function querySortLimit(result) {
    return {
        sort: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue(result),
    };
}

/**
 * Revalida a sessão contra estado persistido por utilizador.
 *
 * @function mockSessionAccounts
 * @param {Record<string, {role: string}>} accounts - Contas disponíveis.
 * @returns {void}
 */
function mockSessionAccounts(accounts) {
    User.findById.mockImplementation((userId) => ({
        select: vi.fn().mockResolvedValue({
            role: accounts[userId]?.role ?? ROLES.CLIENTE,
            isActive: true,
            accountStatus: "active",
        }),
    }));
}

/**
 * Cria documento de pedido compatível com o service.
 *
 * @function makeRequestDoc
 * @param {object} [overrides={}] - Campos a sobrepor no pedido.
 * @returns {object} Documento mock.
 */
function makeRequestDoc(overrides = {}) {
    return {
        _id: requestId,
        requesterId: clienteId,
        action: "delete",
        resources: ["photos"],
        reason: "Pedido RGPD",
        status: "pending",
        reviewerId: null,
        decisionReason: "",
        decisionError: "",
        createdAt: new Date("2026-06-22T10:00:00.000Z"),
        reviewedAt: null,
        completedAt: null,
        save: vi.fn(),
        ...overrides,
    };
}

describe("BK-MF7-02 - direito a eliminar conta e dados", () => {
    beforeEach(() => {
        vi.resetAllMocks();
        mockSessionAccounts({
            [clienteId]: { role: ROLES.CLIENTE },
            [consultorId]: { role: ROLES.CONSULTOR },
            [adminId]: { role: ROLES.ADMIN },
        });
    });

    it("permite cliente criar pedido e consultor listar metadados", async () => {
        const requestDoc = makeRequestDoc();

        BiometricDataRequest.create.mockResolvedValue(requestDoc);
        BiometricDataRequest.find.mockReturnValue(querySortLimit([requestDoc]));

        const created = await request(createApp())
            .post("/api/me/biometric-data-requests")
            .set("Cookie", cookieFor({ id: clienteId, role: ROLES.CLIENTE }))
            .send({
                action: "delete",
                resources: ["photos"],
                reason: "Pedido RGPD",
                requesterId: adminId,
            });

        expect(created.status).toBe(201);
        expect(created.body.request.requesterId).toBe(clienteId);
        expect(JSON.stringify(created.body)).not.toContain("storageKey");
        expect(JSON.stringify(created.body)).not.toContain("cosmeticSummary");

        const listed = await request(createApp())
            .get("/api/admin/biometric-data-requests")
            .set("Cookie", cookieFor({ id: consultorId, role: ROLES.CONSULTOR }));

        expect(listed.status).toBe(200);
        expect(listed.body.requests).toHaveLength(1);
        expect(recordBiometricAccess).toHaveBeenCalledWith(
            expect.objectContaining({
                actorId: consultorId,
                action: "list_requests",
                resourceType: "request",
            }),
        );
    });

    it("bloqueia negativos de sessão, role e recurso inválido", async () => {
        const app = createApp();

        const noSession = await request(app)
            .post("/api/me/biometric-data-requests")
            .send({ action: "delete", resources: ["photos"] });
        const wrongRole = await request(app)
            .get("/api/admin/biometric-data-requests")
            .set("Cookie", cookieFor({ id: clienteId, role: ROLES.CLIENTE }));
        const invalidResource = await request(app)
            .post("/api/me/biometric-data-requests")
            .set("Cookie", cookieFor({ id: clienteId, role: ROLES.CLIENTE }))
            .send({ action: "delete", resources: ["orders"] });

        expect(noSession.status).toBe(401);
        expect(wrongRole.status).toBe(403);
        expect(invalidResource.status).toBe(400);
        expect(BiometricDataRequest.create).not.toHaveBeenCalled();
    });

    it("aplica aprovação apenas aos recursos do requesterId", async () => {
        const deleteRequest = makeRequestDoc({
            action: "delete",
            resources: ["photos", "reports"],
        });

        BiometricDataRequest.findById.mockResolvedValue(deleteRequest);
        FacePhoto.updateMany.mockResolvedValue({ modifiedCount: 1 });
        FaceReport.updateMany.mockResolvedValue({ modifiedCount: 1 });

        const response = await request(createApp())
            .patch(`/api/admin/biometric-data-requests/${requestId}/decision`)
            .set("Cookie", cookieFor({ id: adminId, role: ROLES.ADMIN }))
            .send({ decision: "approved", decisionReason: "Pedido válido." });

        expect(response.status).toBe(200);
        expect(response.body.request.status).toBe("completed");
        expect(FacePhoto.updateMany).toHaveBeenCalledWith(
            { userId: clienteId, status: "active" },
            { $set: { status: "deleted" } },
        );
        expect(FaceReport.updateMany).toHaveBeenCalledWith(
            { userId: clienteId, privacyStatus: { $ne: "deleted" } },
            expect.objectContaining({
                $set: expect.objectContaining({
                    privacyStatus: "deleted",
                    routineSuggestions: [],
                }),
            }),
        );
    });

    it("recusa decisão repetida e regista auditoria negada", async () => {
        BiometricDataRequest.findById.mockResolvedValue(
            makeRequestDoc({ status: "completed" }),
        );

        const response = await request(createApp())
            .patch(`/api/admin/biometric-data-requests/${requestId}/decision`)
            .set("Cookie", cookieFor({ id: adminId, role: ROLES.ADMIN }))
            .send({ decision: "approved", decisionReason: "Pedido válido." });

        expect(response.status).toBe(409);
        expect(FacePhoto.updateMany).not.toHaveBeenCalled();
        expect(FaceReport.updateMany).not.toHaveBeenCalled();
        expect(recordBiometricAccess).toHaveBeenCalledWith(
            expect.objectContaining({
                actorId: adminId,
                action: "decide_request",
                result: "denied",
            }),
        );
    });

    it("marca pedido como failed quando aplicação de recursos falha sem transação", async () => {
        const failingRequest = makeRequestDoc({
            action: "delete",
            resources: ["photos", "reports"],
        });

        BiometricDataRequest.findById.mockResolvedValue(failingRequest);
        FacePhoto.updateMany.mockRejectedValue(new Error("storage offline"));

        const response = await request(createApp())
            .patch(`/api/admin/biometric-data-requests/${requestId}/decision`)
            .set("Cookie", cookieFor({ id: adminId, role: ROLES.ADMIN }))
            .send({ decision: "approved", decisionReason: "Pedido válido." });

        expect(response.status).toBe(500);
        expect(failingRequest.status).toBe("failed");
        expect(failingRequest.decisionError).toContain("Falha operacional");
        expect(FaceReport.updateMany).not.toHaveBeenCalled();
    });
});
```

5. Explicação do código.

O teste cria cookies reais com `createSessionToken`, mas substitui os models por mocks para isolar o contrato HTTP. O primeiro teste prova o caminho principal e confirma que a resposta não devolve `storageKey` nem `cosmeticSummary`. O segundo reúne três negativos obrigatórios: sem sessão, role errada e recurso inválido. Os restantes testes provam ownership por `requesterId`, bloqueio de decisão repetida e fallback `failed` quando a aplicação falha sem transação.

6. Validação do passo.

Executa:

```bash
npm --prefix apps/api test -- mf7.biometric-data-requests
```

Depois executa a suite completa:

```bash
npm --prefix apps/api test
```

7. Cenário negativo/erro esperado.

Se removeres `requireAuth`, o negativo sem sessão deixa de devolver `401`. Se removeres o filtro por `requesterId`, o teste de ownership deixa de provar que só os recursos do dono do pedido são alterados.

#### Erros comuns

- Aceitar `requesterId`, `reviewerId` ou role pelo body. Esses valores vêm sempre da sessão e das permissões do backend.
- Tratar eliminação como remoção física imediata de ficheiros. Este BK ensina estado durável e minimização; remoção física exige política operacional própria.
- Listar fotografias, relatórios completos ou paths internos no painel de revisão. O painel deve mostrar apenas metadados.
- Aprovar o pedido sem auditoria. Em dados biométricos, listagem e decisão precisam de rasto técnico mínimo.
- Esquecer estados de falha. Se a operação falhar sem transação, o pedido deve ficar `failed` para ser revisto.
- Testar só o caminho feliz. Sem sessão, role errada, recurso inválido, pedido já decidido e falha operacional são negativos obrigatórios neste BK.

#### Expected results

- Cliente cria pedido com `201`.
- Pedido inválido devolve `400`.
- Pedido sem sessão devolve `401`.
- Role errada devolve `403`.
- Pedido inexistente devolve `404`.
- Pedido já decidido devolve `409`.
- Consultor/admin lista pedidos com `200` e sem dados biométricos brutos.
- Consultor/admin aprova ou rejeita pedido com `200`.
- Aprovação `delete` altera `FacePhoto.status` para `deleted` e `FaceReport.privacyStatus` para `deleted`.
- Aprovação `anonymize` altera `FacePhoto.status` para `anonymized` e `FaceReport.privacyStatus` para `anonymized`.
- Falha operacional sem transação deixa pedido em `failed`.
- Respostas públicas não expõem fotografia, relatório completo, storage key, cookie, token, password hash ou paths internos.

#### Critérios de aceite

- Não há `requesterId` enviado pela UI.
- Todas as mutações usam filtro por dono.
- Pedidos têm estado explícito.
- Rejeição exige justificação mínima.
- Listagem e decisão registam auditoria biométrica.
- Cliente não aprova o próprio pedido.
- Consultor/admin não cria pedido em nome do cliente pela rota `/me`.
- Fotografias e relatórios deixam de entrar nos fluxos normais após aprovação.
- Cenários negativos concluídos: mínimo `3`.

#### Validação final

### Matriz mínima de testes por prioridade

| Prioridade | Mínimo | Cenários cobertos neste BK |
| --- | ---: | --- |
| P0 | 3 negativos | sem sessão, role errada, recurso inválido, pedido já decidido, falha operacional |

Evidência de testes por camada:

- Backend/API: `npm --prefix apps/api test -- mf7.biometric-data-requests`
- Backend/API completo: `npm --prefix apps/api test`
- Frontend build: `npm --prefix apps/web run build`
- Pesquisa de contratos: `rg -n "biometric-data-requests|privacyStatus|anonymized|deleted|recordBiometricAccess" apps/api/src apps/web/src`
- Pesquisa de sessão: `rg -n "credentials: \"include\"|requireAuth|requireRole" apps/api/src apps/web/src`
- Pesquisa de leakage: `rg -n "storageKey|passwordHash|localStorage|sessionStorage" apps/api/src apps/web/src`
- [ ] Negativos: mínimo `3` cenários validados e registados em evidence.

#### Evidence para PR/defesa

- Output do teste focado `mf7.biometric-data-requests`.
- Pedido cliente criado com id e estado `pending`.
- Listagem admin/consultor com dados minimizados.
- Aprovação que muda `status`/`privacyStatus`.
- Rejeição que guarda `decisionReason` e não altera fotografias nem relatórios.
- Negativos: sem sessão, role errada, recurso inválido, pedido já decidido e falha operacional.
- Nota técnica: ownership vem de `req.user.id`; o frontend nunca envia `requesterId`.

#### Handoff

O `BK-MF7-03` deve garantir que estes endpoints continuam dependentes de cookies HttpOnly e que o frontend usa `credentials: "include"` em todos os pedidos autenticados. O `BK-MF8-01` deve preservar a documentação modular destes controllers/services, e o `BK-MF8-07` deve respeitar o estado de consentimento/privacidade antes de qualquer uso externo de imagens.

#### Changelog

- 2026-06-26: Guia corrigido para código completo por camada, incluindo model, validators, service, controllers, rotas, UI de cliente, UI de revisão, testes, auditoria, fallback operacional e negativos de `RNF13`.
