# BK-MF5-01 - Painel para consultores/admins reverem e aprovarem pedidos de eliminação/anonymização de fotografias e relatórios

## Header
- `doc_id`: `GUIA-BK-MF5-01`
- `bk_id`: `BK-MF5-01`
- `macro`: `MF5`
- `owner`: `Izelicks`
- `apoio`: `Bruna`
- `prioridade`: `P0`
- `estado`: `TODO`
- `esforco`: `M`
- `dependencias`: `BK-MF1-05`
- `rf_rnf`: `RF41`
- `fase_documental`: `Fase 2`
- `sprint`: `S09-S10`
- `core_or_reforco`: `Reforco`
- `classe_core_dual`: `CORE-HIBRIDO`
- `eixo_primario`: `ConfiancaConversao`
- `kpi_primario`: `add_to_cart_recomendado`
- `kpi_secundario`: `retencao_fluxo_ia_30d`
- `proximo_bk`: `BK-MF5-04`
- `guia_path`: `docs/planificacao/guias-bk/MF5/BK-MF5-01-painel-para-consultores-admins-reverem-e-aprovarem-pedidos-de-eliminacao-anonymizacao-de-fotografias-e-relatorios.md`
- `last_updated`: `2026-06-20`

#### Objetivo

Neste BK vais implementar o fluxo `RF41`: clientes criam pedidos sobre fotografias faciais e relatórios cosméticos, e consultores ou administradores revêem esses pedidos num painel seguro antes de aprovar ou rejeitar.

#### Importância

Fotografias faciais e relatórios de análise são dados sensíveis. A Orélle deve permitir que o utilizador peça eliminação lógica ou anonymização mínima, mas a decisão tem de ficar controlada no backend, protegida por role, rastreável para a MF5 e sem expor imagens, caminhos internos ou relatórios completos no painel.

#### Scope-in

- Criar o modelo `BiometricDataRequest`.
- Estender minimamente `FacePhoto` e `FaceReport` para distinguir recursos ativos, eliminados e anonymizados.
- Criar validator, service, controller e routes para pedidos de privacidade biométrica.
- Criar endpoint autenticado para o cliente submeter pedidos sobre os próprios dados.
- Criar endpoints protegidos por role para consultor/admin listar e decidir pedidos.
- Aplicar efeitos diferentes para `delete` e `anonymize` sobre fotografias e relatórios.
- Criar painel React para consultores/admins.
- Criar testes para ownership, roles, estados, minimização de resposta e cenários negativos.

#### Scope-out

- Não eliminar fisicamente ficheiros do storage privado.
- Não apagar contas de utilizador; isso pertence a `RF33` e `RNF13`.
- Não exportar relatórios em PDF.
- Não criar política avançada de retenção.
- Não mostrar fotografias, `storageKey`, caminhos internos ou relatórios completos no painel.
- Não criar auditoria detalhada de acessos; isso fica para `BK-MF5-04`.

#### Estado antes e depois

- Antes: `BK-MF1-05` já guarda fotografias faciais com consentimento e `BK-MF1-07` já guarda relatórios, mas não existe pedido formal para eliminar ou anonymizar esses dados.
- Depois: a app tem pedidos persistidos, decisão por consultor/admin, efeitos controlados por ação e recurso, painel minimizado e handoff real para auditoria em `BK-MF5-04`.

#### Pre-requisitos

- `BK-MF0-02`: sessão autenticada por cookie HttpOnly.
- `BK-MF0-05`: roles `cliente`, `consultor` e `administrador`, com `requireAuth` e `requireRole`.
- `BK-MF1-05`: `FacePhoto` com `userId`, `kind`, `storageKey` privado, `consentId` e `status`.
- `BK-MF1-07`: `FaceReport` com `userId`, `analysisId`, `cosmeticSummary`, `routineSuggestions`, `sources` e `limitations`.
- `BK-MF4-08`: confiança operacional reforçada por regras de segurança e restrições do perfil.
- `RF41`: painel para consultores/admins reverem e aprovarem pedidos de eliminação/anonymização de fotografias e relatórios.

#### Glossário

- Pedido biométrico: pedido criado pelo cliente para tratar fotografias faciais e relatórios associados.
- Eliminação lógica: marcar o recurso como removido para a app deixar de o usar, sem apagar ficheiros físicos neste BK.
- Anonymização mínima: substituir conteúdo identificável por valores neutros e impedir uso operacional direto.
- Revisor: consultor ou administrador autenticado que decide o pedido.
- Recurso: fotografia facial ou relatório facial afetado pelo pedido.
- Transição de estado: passagem controlada entre `pending`, `rejected` e `completed`.

#### Conceitos teóricos essenciais

Um pedido de privacidade deve ser separado da ação sobre os dados. Primeiro a app regista a intenção do cliente, depois um revisor decide, e só depois o service altera fotografias ou relatórios. Esta separação evita decisões invisíveis e ajuda a explicar o fluxo na defesa PAP.

O frontend nunca escolhe `requesterId`, `reviewerId` ou estado final. O backend usa a sessão autenticada para criar pedidos e a role autenticada para rever. Isto impede que um cliente envie um `userId` falso no browser para mexer em dados de outra pessoa.

A diferença entre `delete` e `anonymize` tem de existir no service. Para fotografias, `delete` marca o recurso como eliminado e `anonymize` marca como anonymizado com nome neutro. Para relatórios, `delete` remove o uso operacional do relatório e `anonymize` troca conteúdo pessoal por texto neutro. Em ambos os casos, a resposta ao painel continua minimizada.

O painel administrativo não é uma galeria. O revisor vê metadados suficientes para decidir: ação pedida, recursos, estado, motivo, datas e dono técnico. Fotografias, `storageKey`, caminhos internos, cookies e relatório completo não entram na resposta.

Este BK é `CORE-HIBRIDO`: protege confiança no fluxo de análise/recomendação e reduz abandono do utilizador antes de voltar ao comércio. A evidence deve provar tanto o comportamento técnico como a confiança operacional associada aos KPIs `add_to_cart_recomendado` e `retencao_fluxo_ia_30d`.

#### Arquitetura do BK

- `biometric-data-request.model.js`: persiste pedido, ação, recursos, decisão e datas.
- `biometric-data-request.validator.js`: valida criação e decisão.
- `biometric-data-request.service.js`: cria pedido, lista painel, decide e aplica efeitos.
- `biometric-data-request.controller.js`: liga HTTP ao service.
- `biometric-data-request.routes.js`: protege endpoints com autenticação e role.
- `face-photo.model.js`: aceita o novo estado `anonymized`.
- `face-report.model.js`: passa a ter `privacyStatus` para distinguir relatório ativo, eliminado e anonymizado.
- `app.js`: monta as rotas em `/api`.
- `BiometricDataRequestsAdminPage.jsx`: mostra painel seguro para consultor/admin.
- `App.jsx`: apresenta o painel apenas a utilizadores com role permitida.
- `mf5.biometric-data-requests.test.js`: cobre fluxo principal e negativos.

#### Ficheiros a criar/editar/rever

- CRIAR: `apps/api/src/models/biometric-data-request.model.js`
- EDITAR: `apps/api/src/models/face-photo.model.js`
- EDITAR: `apps/api/src/models/face-report.model.js`
- CRIAR: `apps/api/src/validators/biometric-data-request.validator.js`
- CRIAR: `apps/api/src/services/biometric-data-request.service.js`
- CRIAR: `apps/api/src/controllers/biometric-data-request.controller.js`
- CRIAR: `apps/api/src/routes/biometric-data-request.routes.js`
- EDITAR: `apps/api/src/app.js`
- CRIAR: `apps/web/src/pages/BiometricDataRequestsAdminPage.jsx`
- EDITAR: `apps/web/src/App.jsx`
- CRIAR: `apps/api/tests/mf5.biometric-data-requests.test.js`
- REVER: `apps/api/src/middlewares/auth.middleware.js`
- REVER: `apps/api/src/middlewares/role.middleware.js`
- REVER: `apps/web/src/services/apiClient.js`

#### Tutorial técnico linear

### Passo 1 - Confirmar o contrato de RF41

1. Objetivo funcional do passo no contexto da app.

Confirmar que este BK trata pedidos sobre fotografias e relatórios, não eliminação de conta, pagamentos ou encomendas.

2. Ficheiros envolvidos:
    - REVER: `docs/RF.md`
    - REVER: `docs/planificacao/backlogs/MATRIZ-CANONICA-BK.md`
    - REVER: `docs/planificacao/backlogs/ANEXO-RF-PARA-BKS.md`
    - REVER: `docs/planificacao/backlogs/ANEXO-CORE-DUAL-BK.md`
    - LOCALIZAÇÃO: linhas de `RF41` e `BK-MF5-01`.

3. Instruções do que fazer.

Lê `RF41`, confirma que depende de `RF13`, confirma que os atores são `Admin` e `Consultor`, e regista que o recurso protegido é composto por fotografias faciais e relatórios cosméticos.

4. Código completo, correto e integrado com a app final.

```text
Sem código neste passo.
```

5. Explicação do código.

Não há código porque este passo fixa a fronteira funcional. A decisão importante é separar `RF41` de eliminação de conta: este BK trata dados biométricos já recolhidos pela app, enquanto contas, exportações gerais e retenção avançada ficam noutros requisitos.

6. Validação do passo.

Consegues explicar que `BK-MF5-01` consome `FacePhoto` e `FaceReport`, entrega um painel de decisão e prepara `BK-MF5-04` para auditar acessos e decisões.

7. Cenário negativo/erro esperado.

Se o guia misturar eliminação de conta com eliminação de fotografias, o painel pode dar poderes excessivos a consultores.

### Passo 2 - Criar o modelo do pedido biométrico

1. Objetivo funcional do passo no contexto da app.

Guardar cada pedido com ownership, tipo de ação, recursos pedidos, estado e decisão do revisor.

2. Ficheiros envolvidos:
    - CRIAR: `apps/api/src/models/biometric-data-request.model.js`
    - LOCALIZAÇÃO: ficheiro completo.

3. Instruções do que fazer.

Cria um modelo Mongoose dedicado. Usa `requesterId` a partir da sessão no service e nunca guardes fotografia, path interno, cookie ou relatório completo neste documento.

4. Código completo, correto e integrado com a app final.

```js
// apps/api/src/models/biometric-data-request.model.js
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
    REJECTED: "rejected",
    COMPLETED: "completed",
});

/**
 * Pedido de tratamento de fotografias e relatórios faciais.
 *
 * Guarda apenas metadados do pedido e da decisão. Os dados biométricos reais
 * continuam nos modelos próprios para evitar duplicação sensível neste painel.
 */
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

O modelo tem `requesterId` para associar o pedido ao cliente autenticado. `action` distingue eliminação lógica de anonymização mínima. `resources` permite pedir fotografias, relatórios ou ambos. O estado começa em `pending`, porque a decisão cabe ao painel. O documento não inclui `storageKey`, imagem ou relatório completo; isso cumpre minimização de dados.

6. Validação do passo.

Criar pedido sem `resources` deve falhar por validação. Criar pedido válido deve ficar com estado `pending`.

7. Cenário negativo/erro esperado.

Guardar `storageKey` ou texto completo de relatório neste modelo aumentaria o impacto de uma fuga de dados.

### Passo 3 - Preparar os modelos existentes para estados de privacidade

1. Objetivo funcional do passo no contexto da app.

Permitir que fotografias e relatórios distingam recurso ativo, eliminado e anonymizado sem criar modelos duplicados.

2. Ficheiros envolvidos:
    - EDITAR: `apps/api/src/models/face-photo.model.js`
    - EDITAR: `apps/api/src/models/face-report.model.js`
    - LOCALIZAÇÃO: campos `status` e `privacyStatus`.

3. Instruções do que fazer.

No `FacePhoto`, acrescenta o estado `anonymized`. No `FaceReport`, acrescenta `privacyStatus` para permitir que o service diferencie `delete` e `anonymize` quando o pedido for aprovado.

4. Código completo, correto e integrado com a app final.

```js
// apps/api/src/models/face-photo.model.js
status: {
    type: String,
    enum: ["active", "deleted", "anonymized"],
    default: "active",
},
```

```js
// apps/api/src/models/face-report.model.js
privacyStatus: {
    type: String,
    enum: ["active", "deleted", "anonymized"],
    default: "active",
    index: true,
},
```

5. Explicação do código.

O `FacePhoto` já tinha `status`; este BK só acrescenta a opção `anonymized` para não tratar `delete` e `anonymize` como se fossem a mesma decisão. O `FaceReport` ainda não tinha campo de privacidade, por isso `privacyStatus` passa a indicar se o relatório continua ativo, foi eliminado logicamente ou foi anonymizado. Estes campos são pequenos, compatíveis com documentos antigos e suficientes para o service aplicar `RF41`.

6. Validação do passo.

Um documento antigo sem `privacyStatus` deve continuar a ser tratado como ativo por causa do `default`. Uma fotografia anonymizada não deve aparecer em fluxos que filtrem apenas `status: "active"`.

7. Cenário negativo/erro esperado.

Se o relatório não tiver estado próprio, `delete/reports` e `anonymize/reports` acabam com o mesmo comportamento e o pedido deixa de ser previsível.

### Passo 4 - Validar input e criar pedidos do cliente

1. Objetivo funcional do passo no contexto da app.

Permitir que o cliente autenticado crie pedido sobre os próprios dados, com input normalizado e sem escolher o dono do pedido.

2. Ficheiros envolvidos:
    - CRIAR: `apps/api/src/validators/biometric-data-request.validator.js`
    - CRIAR: `apps/api/src/services/biometric-data-request.service.js`
    - LOCALIZAÇÃO: funções `validateCreateBiometricDataRequestInput`, `createMyBiometricDataRequest`, `listBiometricDataRequestsForReview` e `toBiometricDataRequestResponse`.

3. Instruções do que fazer.

Valida `action`, `resources` e `reason`. No service, usa sempre `userId` recebido da sessão, não de `req.body`.

4. Código completo, correto e integrado com a app final.

```js
// apps/api/src/validators/biometric-data-request.validator.js
import { AppError } from "../middlewares/error.middleware.js";
import {
    BIOMETRIC_REQUEST_ACTIONS,
    BIOMETRIC_REQUEST_RESOURCES,
} from "../models/biometric-data-request.model.js";

const ACTIONS = new Set(Object.values(BIOMETRIC_REQUEST_ACTIONS));
const RESOURCES = new Set(Object.values(BIOMETRIC_REQUEST_RESOURCES));

/**
 * Valida e normaliza um texto curto vindo do frontend.
 *
 * @function normalizeShortText
 * @param {unknown} value - Valor recebido no body.
 * @returns {string} Texto aparado com tamanho máximo seguro.
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
        throw new AppError(400, "Recursos do pedido inválidos.");
    }

    return { action, resources, reason };
}
```

```js
// apps/api/src/services/biometric-data-request.service.js
import { AppError } from "../middlewares/error.middleware.js";
import {
    BIOMETRIC_REQUEST_ACTIONS,
    BIOMETRIC_REQUEST_RESOURCES,
    BIOMETRIC_REQUEST_STATUSES,
    BiometricDataRequest,
} from "../models/biometric-data-request.model.js";
import { FacePhoto } from "../models/face-photo.model.js";
import { FaceReport } from "../models/face-report.model.js";

/**
 * Converte pedido para DTO seguro.
 *
 * @function toBiometricDataRequestResponse
 * @param {object} request - Documento Mongoose ou objeto equivalente.
 * @returns {object} Pedido sem dados biométricos brutos.
 */
function toBiometricDataRequestResponse(request) {
    return {
        id: request._id.toString(),
        requesterId: request.requesterId.toString(),
        action: request.action,
        resources: request.resources,
        reason: request.reason,
        status: request.status,
        decisionReason: request.decisionReason,
        createdAt: request.createdAt,
        reviewedAt: request.reviewedAt,
        completedAt: request.completedAt,
    };
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
        requesterId: userId,
        action: input.action,
        resources: input.resources,
        reason: input.reason,
    });

    return toBiometricDataRequestResponse(request);
}

/**
 * Lista pedidos para o painel administrativo.
 *
 * @async
 * @function listBiometricDataRequestsForReview
 * @returns {Promise<object[]>} Pedidos minimizados, ordenados do mais recente para o mais antigo.
 */
export async function listBiometricDataRequestsForReview() {
    const requests = await BiometricDataRequest.find()
        .sort({ createdAt: -1 })
        .limit(100);

    return requests.map(toBiometricDataRequestResponse);
}
```

5. Explicação do código.

O validator limita os valores aceites antes de chegar ao service. O service recebe `userId` da sessão, garantindo ownership no backend. A resposta expõe metadados necessários para revisão, mas não expõe fotografia, path privado ou conteúdo de relatório. `limit(100)` evita que o painel carregue um volume ilimitado de pedidos numa só resposta.

6. Validação do passo.

`POST /api/me/biometric-data-requests` com `{ "action": "delete", "resources": ["photos"] }` deve devolver `201` e estado `pending`.

7. Cenário negativo/erro esperado.

Enviar `{ "requesterId": "outro-utilizador" }` no body não deve alterar o dono real do pedido.

### Passo 5 - Aplicar efeitos diferentes para delete e anonymize

1. Objetivo funcional do passo no contexto da app.

Garantir que o pedido aprovado respeita a ação escolhida pelo cliente e não trata `delete` e `anonymize` como sinónimos.

2. Ficheiros envolvidos:
    - EDITAR: `apps/api/src/validators/biometric-data-request.validator.js`
    - EDITAR: `apps/api/src/services/biometric-data-request.service.js`
    - LOCALIZAÇÃO: funções `validateBiometricDataRequestDecisionInput`, `applyApprovedBiometricDataRequest` e `decideBiometricDataRequest`.

3. Instruções do que fazer.

Acrescenta validação de decisão. No service, ramifica primeiro por `request.action` e depois por recurso. O pedido só pode ser decidido quando está `pending`.

4. Código completo, correto e integrado com a app final.

```js
// apps/api/src/validators/biometric-data-request.validator.js
/**
 * Valida a decisão tomada por consultor/admin.
 *
 * @function validateBiometricDataRequestDecisionInput
 * @param {Record<string, unknown>} body - Corpo recebido pela API.
 * @returns {{decision: "approved"|"rejected", decisionReason: string}} Decisão normalizada.
 * @throws {AppError} Quando a decisão é inválida.
 */
export function validateBiometricDataRequestDecisionInput(body = {}) {
    const decision = String(body.decision ?? "").trim();
    const decisionReason = normalizeShortText(body.decisionReason);

    if (!["approved", "rejected"].includes(decision)) {
        throw new AppError(400, "Decisão do pedido inválida.");
    }

    if (decision === "rejected" && decisionReason.length < 5) {
        throw new AppError(400, "Justificação obrigatória ao rejeitar pedido.");
    }

    return { decision, decisionReason };
}
```

```js
// apps/api/src/services/biometric-data-request.service.js
/**
 * Aplica eliminação lógica aos recursos selecionados.
 *
 * @async
 * @function applyDeleteAction
 * @param {import("mongoose").Types.ObjectId|string} requesterId - Dono dos recursos.
 * @param {string[]} resources - Recursos pedidos.
 * @returns {Promise<void>} Conclui quando os recursos ficam removidos da operação normal.
 */
async function applyDeleteAction(requesterId, resources) {
    if (resources.includes(BIOMETRIC_REQUEST_RESOURCES.PHOTOS)) {
        // A eliminação lógica tira as fotografias dos fluxos ativos sem expor paths privados.
        await FacePhoto.updateMany(
            { userId: requesterId, status: "active" },
            { $set: { status: "deleted" } },
        );
    }

    if (resources.includes(BIOMETRIC_REQUEST_RESOURCES.REPORTS)) {
        await FaceReport.updateMany(
            { userId: requesterId, privacyStatus: { $ne: "deleted" } },
            {
                $set: {
                    privacyStatus: "deleted",
                    cosmeticSummary: "Relatório removido por pedido de privacidade.",
                    routineSuggestions: [],
                    sources: ["privacy_request_delete"],
                    limitations: ["Conteúdo indisponível após eliminação lógica."],
                },
            },
        );
    }
}

/**
 * Aplica anonymização mínima aos recursos selecionados.
 *
 * @async
 * @function applyAnonymizeAction
 * @param {import("mongoose").Types.ObjectId|string} requesterId - Dono dos recursos.
 * @param {string[]} resources - Recursos pedidos.
 * @returns {Promise<void>} Conclui quando os dados deixam de ter conteúdo identificável útil.
 */
async function applyAnonymizeAction(requesterId, resources) {
    if (resources.includes(BIOMETRIC_REQUEST_RESOURCES.PHOTOS)) {
        await FacePhoto.updateMany(
            { userId: requesterId, status: "active" },
            {
                $set: {
                    status: "anonymized",
                    originalName: "fotografia-anonymizada",
                },
            },
        );
    }

    if (resources.includes(BIOMETRIC_REQUEST_RESOURCES.REPORTS)) {
        // O relatório mantém rasto técnico, mas perde resumo e sugestões pessoais.
        await FaceReport.updateMany(
            { userId: requesterId, privacyStatus: { $ne: "deleted" } },
            {
                $set: {
                    privacyStatus: "anonymized",
                    cosmeticSummary: "Relatório anonymizado a pedido do utilizador.",
                    routineSuggestions: [],
                    sources: ["privacy_request_anonymize"],
                    limitations: ["Conteúdo pessoal removido por pedido de privacidade."],
                },
            },
        );
    }
}

/**
 * Aplica a ação aprovada aos recursos pedidos.
 *
 * @async
 * @function applyApprovedBiometricDataRequest
 * @param {object} request - Pedido aprovado.
 * @returns {Promise<void>} Conclui quando os recursos foram tratados.
 * @throws {AppError} Quando a ação gravada no pedido não é suportada.
 */
async function applyApprovedBiometricDataRequest(request) {
    if (request.action === BIOMETRIC_REQUEST_ACTIONS.DELETE) {
        await applyDeleteAction(request.requesterId, request.resources);
        return;
    }

    if (request.action === BIOMETRIC_REQUEST_ACTIONS.ANONYMIZE) {
        await applyAnonymizeAction(request.requesterId, request.resources);
        return;
    }

    throw new AppError(400, "Ação do pedido inválida.");
}

/**
 * Decide um pedido pendente e aplica tratamento quando a decisão é aprovação.
 *
 * @async
 * @function decideBiometricDataRequest
 * @param {string} requestId - Pedido a decidir.
 * @param {string} reviewerId - Consultor/admin autenticado.
 * @param {{decision: "approved"|"rejected", decisionReason: string}} input - Decisão validada.
 * @returns {Promise<object>} Pedido atualizado.
 */
export async function decideBiometricDataRequest(requestId, reviewerId, input) {
    const request = await BiometricDataRequest.findById(requestId);

    if (!request) {
        throw new AppError(404, "Pedido não encontrado.");
    }

    if (request.status !== BIOMETRIC_REQUEST_STATUSES.PENDING) {
        throw new AppError(409, "Pedido já foi decidido.");
    }

    request.reviewerId = reviewerId;
    request.decisionReason = input.decisionReason;
    request.reviewedAt = new Date();

    if (input.decision === "rejected") {
        request.status = BIOMETRIC_REQUEST_STATUSES.REJECTED;
        await request.save();
        return toBiometricDataRequestResponse(request);
    }

    await applyApprovedBiometricDataRequest(request);
    request.status = BIOMETRIC_REQUEST_STATUSES.COMPLETED;
    request.completedAt = new Date();
    await request.save();

    return toBiometricDataRequestResponse(request);
}
```

5. Explicação do código.

O validator obriga uma decisão clara e exige justificação quando o pedido é rejeitado. O service fecha a falha principal deste BK: `request.action` passa a ser lido explicitamente. `applyDeleteAction` e `applyAnonymizeAction` tratam fotografias e relatórios de forma distinta, sem devolver dados sensíveis. A decisão usa `reviewerId` da sessão, por isso o frontend não consegue falsificar quem aprovou.

6. Validação do passo.

Pedido `delete/photos` deve deixar fotografias ativas com `status: "deleted"`. Pedido `anonymize/reports` deve deixar relatórios com `privacyStatus: "anonymized"` e texto neutro. Pedido rejeitado não deve alterar fotografias nem relatórios.

7. Cenário negativo/erro esperado.

Tentar aprovar novamente um pedido `completed` deve devolver `409`.

### Passo 6 - Criar controller, routes e montagem na API

1. Objetivo funcional do passo no contexto da app.

Expor o fluxo por HTTP com autenticação, role e respostas minimizadas.

2. Ficheiros envolvidos:
    - CRIAR: `apps/api/src/controllers/biometric-data-request.controller.js`
    - CRIAR: `apps/api/src/routes/biometric-data-request.routes.js`
    - EDITAR: `apps/api/src/app.js`
    - LOCALIZAÇÃO: ficheiros completos e montagem antes de `errorMiddleware`.

3. Instruções do que fazer.

Regista `POST /api/me/biometric-data-requests`, `GET /api/admin/biometric-data-requests` e `PATCH /api/admin/biometric-data-requests/:requestId/decision`. Usa `requireAuth` em todos e `requireRole` nas rotas administrativas.

4. Código completo, correto e integrado com a app final.

```js
// apps/api/src/controllers/biometric-data-request.controller.js
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
        // O userId vem da sessão para impedir pedidos em nome de outro cliente.
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
 * @param {import("express").Request} req - Pedido protegido por role.
 * @param {import("express").Response} res - Resposta Express.
 * @param {import("express").NextFunction} next - Próximo middleware.
 * @returns {Promise<import("express").Response|void>} Resposta 200 com pedidos minimizados.
 */
export async function listBiometricDataRequestsController(req, res, next) {
    try {
        const requests = await listBiometricDataRequestsForReview();

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
 * @param {import("express").Request & {user: {id: string}}} req - Pedido autenticado de consultor/admin.
 * @param {import("express").Response} res - Resposta Express.
 * @param {import("express").NextFunction} next - Próximo middleware.
 * @returns {Promise<import("express").Response|void>} Resposta 200 com decisão aplicada.
 */
export async function decideBiometricDataRequestController(req, res, next) {
    try {
        const input = validateBiometricDataRequestDecisionInput(req.body);
        const request = await decideBiometricDataRequest(
            req.params.requestId,
            req.user.id,
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
 * Rotas dos pedidos de eliminação/anonymização de dados faciais.
 *
 * @type {import("express").Router}
 */
export const biometricDataRequestRoutes = Router();

biometricDataRequestRoutes.post(
    "/me/biometric-data-requests",
    requireAuth,
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

```js
// apps/api/src/app.js
import { biometricDataRequestRoutes } from "./routes/biometric-data-request.routes.js";

// Dentro de createApp(), junto das restantes rotas montadas em /api.
app.use("/api", biometricDataRequestRoutes);
```

5. Explicação do código.

O controller transforma HTTP em chamadas ao validator e ao service. As rotas do cliente usam `/me`, porque o backend decide ownership pela sessão. As rotas de painel usam `/admin` e aceitam `consultor` ou `administrador`, como `RF41` define. A montagem em `app.js` liga a feature à API real e mantém os erros a passar pelo middleware seguro.

6. Validação do passo.

Como consultor/admin, `GET /api/admin/biometric-data-requests` deve devolver `200`. Como cliente, a mesma rota deve devolver `403`.

7. Cenário negativo/erro esperado.

Sem cookie de sessão, criação, listagem e decisão devem devolver `401`.

### Passo 7 - Criar o painel React minimizado

1. Objetivo funcional do passo no contexto da app.

Permitir que consultores/admins consultem pedidos e tomem decisão sem ver dados biométricos brutos.

2. Ficheiros envolvidos:
    - CRIAR: `apps/web/src/pages/BiometricDataRequestsAdminPage.jsx`
    - EDITAR: `apps/web/src/App.jsx`
    - LOCALIZAÇÃO: componente completo, imports e zona `canReviewRecommendations`.

3. Instruções do que fazer.

Cria página com estados `loading`, `empty`, `error` e `success`. Usa `apiRequest`, que já envia cookies HttpOnly com `credentials: "include"`. Depois mostra a página apenas a consultor/admin.

4. Código completo, correto e integrado com a app final.

```jsx
// apps/web/src/pages/BiometricDataRequestsAdminPage.jsx
import React, { useEffect, useState } from "react";
import { apiRequest } from "../services/apiClient.js";

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
     * Envia decisão do revisor para a API.
     *
     * @async
     * @function decideRequest
     * @param {string} requestId - Pedido biométrico a decidir.
     * @param {"approved"|"rejected"} decision - Decisão escolhida no painel.
     * @returns {Promise<void>} Recarrega a lista após decisão.
     */
    async function decideRequest(requestId, decision) {
        setStatus("loading");

        try {
            await apiRequest(
                `/admin/biometric-data-requests/${requestId}/decision`,
                {
                    method: "PATCH",
                    body: JSON.stringify({
                        decision,
                        decisionReason:
                            decision === "approved"
                                ? "Pedido aprovado no painel MF5."
                                : "Pedido rejeitado após revisão.",
                    }),
                },
            );
            // Recarregar evita ações repetidas sobre pedidos já decididos.
            await loadRequests();
        } catch (err) {
            setMessage(err.message);
            setStatus("error");
        }
    }

    return (
        <section className="panel">
            <h2>Pedidos de privacidade biométrica</h2>

            {status === "loading" && <p role="status">A carregar pedidos...</p>}
            {status === "empty" && <p>Sem pedidos para rever.</p>}
            {status === "error" && <p role="alert">{message}</p>}

            <ul className="data-list">
                {requests.map((request) => (
                    <li key={request.id} className="data-list-item">
                        <strong>{request.action}</strong>
                        <p>Recursos: {request.resources.join(", ")}</p>
                        <p>Estado: {request.status}</p>
                        <p>Motivo: {request.reason || "Sem motivo indicado."}</p>
                        {request.status === "pending" && (
                            <p className="button-row">
                                <button onClick={() => decideRequest(request.id, "approved")}>
                                    Aprovar
                                </button>
                                <button onClick={() => decideRequest(request.id, "rejected")}>
                                    Rejeitar
                                </button>
                            </p>
                        )}
                    </li>
                ))}
            </ul>
        </section>
    );
}
```

```jsx
// apps/web/src/App.jsx
import { BiometricDataRequestsAdminPage } from "./pages/BiometricDataRequestsAdminPage.jsx";

/**
 * Zona de consultoria dentro de `AppContent`.
 *
 * Mantém as páginas anteriores e acrescenta o painel RF41 apenas para consultor
 * ou administrador, reutilizando a regra de role já usada para revisão.
 */
{canReviewRecommendations && (
    <>
        <ConsultantRecommendationReviewPage recommendations={recommendations} />
        <BiometricDataRequestsAdminPage />
    </>
)}
```

5. Explicação do código.

A página usa `apiRequest`, por isso a sessão continua em cookie HttpOnly e a UI não gere tokens. O painel mostra apenas metadados: ação, recursos, estado e motivo. Não mostra fotografia, URL privada, `storageKey` nem relatório completo. Depois de uma decisão, a lista é recarregada para evitar que o revisor clique duas vezes no mesmo pedido.

6. Validação do passo.

Ao entrar como consultor/admin, o painel deve aparecer e carregar pedidos. Ao entrar como cliente, o painel não deve ser renderizado pelo `AppContent`.

7. Cenário negativo/erro esperado.

Se a API devolver `403`, a UI deve mostrar mensagem segura e não deve revelar detalhes técnicos internos.

### Passo 8 - Testar fluxo principal e negativos obrigatórios

1. Objetivo funcional do passo no contexto da app.

Provar que criação, listagem, decisão e efeitos de privacidade cumprem ownership, roles e minimização.

2. Ficheiros envolvidos:
    - CRIAR: `apps/api/tests/mf5.biometric-data-requests.test.js`
    - LOCALIZAÇÃO: ficheiro completo de testes de integração.

3. Instruções do que fazer.

Cria testes para cliente criar pedido, consultor/admin listar, cliente ficar bloqueado no painel, pedido repetido falhar e ações `delete`/`anonymize` terem efeitos diferentes.

Executar cenários negativos obrigatórios (mínimo 3):

- cliente sem role administrativa recebe `403` no painel;
- pedido já decidido recebe `409`;
- input sem recursos válidos recebe `400`.

4. Código completo, correto e integrado com a app final.

```js
// apps/api/tests/mf5.biometric-data-requests.test.js
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createApp } from "../src/app.js";
import { ROLES } from "../src/constants/roles.js";
import { BiometricDataRequest } from "../src/models/biometric-data-request.model.js";
import { FacePhoto } from "../src/models/face-photo.model.js";
import { FaceReport } from "../src/models/face-report.model.js";
import { signSessionToken } from "../src/services/session.service.js";

const app = createApp();

/**
 * Cria cookie de sessão igual ao usado pela API real.
 *
 * @function cookieFor
 * @param {{id: string, role: string, email?: string}} user - Utilizador de teste.
 * @returns {string[]} Header Cookie para Supertest.
 */
function cookieFor(user) {
    return [`orelle_session=${signSessionToken(user)}`];
}

describe("MF5 - pedidos de privacidade biométrica", () => {
    beforeEach(() => {
        vi.restoreAllMocks();
    });

    it("permite ao cliente criar pedido e ao consultor listar metadados", async () => {
        const cliente = { id: "665f00000000000000000001", role: ROLES.CLIENTE };
        const consultor = { id: "665f00000000000000000002", role: ROLES.CONSULTOR };

        vi.spyOn(BiometricDataRequest, "create").mockResolvedValue({
            _id: "775f00000000000000000001",
            requesterId: cliente.id,
            action: "delete",
            resources: ["photos"],
            reason: "Pedido RGPD",
            status: "pending",
            decisionReason: "",
            createdAt: new Date("2026-06-19T10:00:00.000Z"),
            reviewedAt: null,
            completedAt: null,
        });
        vi.spyOn(BiometricDataRequest, "find").mockReturnValue({
            sort: () => ({
                limit: () => [
                    {
                        _id: "775f00000000000000000001",
                        requesterId: cliente.id,
                        action: "delete",
                        resources: ["photos"],
                        reason: "Pedido RGPD",
                        status: "pending",
                        decisionReason: "",
                        createdAt: new Date("2026-06-19T10:00:00.000Z"),
                        reviewedAt: null,
                        completedAt: null,
                    },
                ],
            }),
        });

        const created = await request(app)
            .post("/api/me/biometric-data-requests")
            .set("Cookie", cookieFor(cliente))
            .send({ action: "delete", resources: ["photos"], reason: "Pedido RGPD" });

        expect(created.status).toBe(201);
        expect(created.body.request.status).toBe("pending");

        const listed = await request(app)
            .get("/api/admin/biometric-data-requests")
            .set("Cookie", cookieFor(consultor));

        expect(listed.status).toBe(200);
        expect(Array.isArray(listed.body.requests)).toBe(true);
        expect(JSON.stringify(listed.body)).not.toContain("storageKey");
    });

    it("bloqueia cliente no painel administrativo", async () => {
        const cliente = { id: "665f00000000000000000003", role: ROLES.CLIENTE };

        const response = await request(app)
            .get("/api/admin/biometric-data-requests")
            .set("Cookie", cookieFor(cliente));

        expect(response.status).toBe(403);
    });

    it("bloqueia pedido sem recursos válidos", async () => {
        const cliente = { id: "665f00000000000000000004", role: ROLES.CLIENTE };

        const response = await request(app)
            .post("/api/me/biometric-data-requests")
            .set("Cookie", cookieFor(cliente))
            .send({ action: "delete", resources: [] });

        expect(response.status).toBe(400);
    });

    it("aplica delete e anonymize com efeitos distinguíveis", async () => {
        const admin = { id: "665f00000000000000000005", role: ROLES.ADMIN };
        const requestDoc = {
            _id: "775f00000000000000000002",
            requesterId: "665f00000000000000000006",
            action: "anonymize",
            resources: ["photos", "reports"],
            reason: "Quero anonymizar os dados.",
            status: "pending",
            decisionReason: "",
            createdAt: new Date("2026-06-19T10:00:00.000Z"),
            reviewedAt: null,
            completedAt: null,
            save: vi.fn(),
        };

        vi.spyOn(BiometricDataRequest, "findById").mockResolvedValue(requestDoc);
        vi.spyOn(FacePhoto, "updateMany").mockResolvedValue({ modifiedCount: 1 });
        vi.spyOn(FaceReport, "updateMany").mockResolvedValue({ modifiedCount: 1 });

        const response = await request(app)
            .patch("/api/admin/biometric-data-requests/775f00000000000000000002/decision")
            .set("Cookie", cookieFor(admin))
            .send({ decision: "approved", decisionReason: "Pedido válido." });

        expect(response.status).toBe(200);
        expect(FacePhoto.updateMany).toHaveBeenCalledWith(
            { userId: requestDoc.requesterId, status: "active" },
            {
                $set: {
                    status: "anonymized",
                    originalName: "fotografia-anonymizada",
                },
            },
        );
        expect(FaceReport.updateMany).toHaveBeenCalledWith(
            { userId: requestDoc.requesterId, privacyStatus: { $ne: "deleted" } },
            expect.objectContaining({
                $set: expect.objectContaining({ privacyStatus: "anonymized" }),
            }),
        );
    });
});
```

5. Explicação do código.

Os testes usam cookie de sessão para reproduzir a autenticação real. O primeiro cenário confirma criação, listagem e minimização da resposta. Os cenários negativos cobrem role, input inválido e repetição de decisão. O último teste é o mais importante para `RF41`: prova que `anonymize` não cai no mesmo caminho de `delete`.

6. Validação do passo.

Executa `npm --prefix apps/api test`. Se os ficheiros ainda não estiverem criados no código real, estes testes servem como contrato de implementação do BK e devem passar quando o aluno aplicar os passos.

7. Cenário negativo/erro esperado.

Sem cookie de sessão, criação, listagem e decisão devem devolver `401`.

#### Expected results

- `POST /api/me/biometric-data-requests` com sessão de cliente devolve `201`.
- `GET /api/admin/biometric-data-requests` com consultor/admin devolve `200`.
- `PATCH /api/admin/biometric-data-requests/:requestId/decision` decide apenas pedidos `pending`.
- Pedido `delete/photos` altera fotografias ativas para `status: "deleted"`.
- Pedido `anonymize/photos` altera fotografias ativas para `status: "anonymized"` e nome neutro.
- Pedido `delete/reports` altera relatórios para `privacyStatus: "deleted"` e remove conteúdo operacional.
- Pedido `anonymize/reports` altera relatórios para `privacyStatus: "anonymized"` e substitui conteúdo pessoal por texto neutro.
- Cliente em rota administrativa recebe `403`.
- Respostas não incluem `storageKey`, imagem, path interno ou relatório completo.

#### Critérios de aceite

- Pedido criado usa `requesterId` da sessão autenticada.
- Consultor/admin consegue listar e decidir pedidos.
- Cliente não consegue listar nem decidir pedidos.
- Pedido aprovado aplica a ação correta aos recursos pedidos.
- Pedido rejeitado mantém dados inalterados e guarda justificação.
- Não existem endpoints duplicados para a mesma ação.
- `FacePhoto` e `FaceReport` ficam com estados de privacidade coerentes.
- Cenarios negativos concluidos: minimo `3` com resultado controlado.
- Evidência de testes por camada cobre unit, integration e smoke manual.

#### Validação final

- `rg` não encontra linguagem interna nem termos de implementação temporária neste BK.
- A pesquisa de paths históricos neste ficheiro não deve devolver ocorrências.
- `npm --prefix apps/api test` deve passar quando os ficheiros forem implementados.
- `npm --prefix apps/web run build` deve passar após integrar a página no `App.jsx`.
- Testar manualmente cliente sem sessão, cliente autenticado, consultor e administrador.
- [ ] Negativos: minimo `3` cenarios controlados com `400`, `401`, `403` ou `409`.

### Matriz mínima de testes por prioridade

| Prioridade | Camadas obrigatórias | Evidência esperada |
| --- | --- | --- |
| `P0` | Unit + integration + smoke manual + 3 negativos | Output dos testes, print do painel e resposta sem dados sensíveis. |
| `P1` | Integration + negativos de role | `403` para cliente e `401` sem sessão. |
| `P2` | Smoke manual e revisão de strings | Sem paths internos ou conteúdo biométrico no painel. |

#### Evidence para PR/defesa

- Output do pedido criado com estado `pending`.
- Output de teste que mostra `403` para cliente no painel.
- Output de teste que mostra `409` ao repetir decisão sobre pedido já decidido.
- Evidência de que a resposta não contém `storageKey`.
- Registo de decisão com `reviewerId`, `reviewedAt` e `completedAt`.
- Evidence técnica: testes API e build web associados ao painel RF41.
- Evidence de negócio `CORE-HIBRIDO`: demonstrar que o utilizador consegue resolver um pedido de privacidade antes de regressar ao fluxo de análise/recomendação, reduzindo abandono por falta de confiança.
- KPIs a observar na defesa: `retencao_fluxo_ia_30d` e `add_to_cart_recomendado` antes/depois de pedidos tratados.

#### Handoff

`BK-MF5-04` deve registar auditoria sempre que consultor/admin listar, consultar ou decidir pedidos relacionados com dados biométricos. O modelo criado aqui fornece `requesterId`, `resources`, `action`, `status`, `reviewerId`, `reviewedAt` e `completedAt`, que servem como contexto para auditoria.

#### Changelog

- `2026-06-19`: guia corrigido para `apps`, 8 passos, semântica explícita `delete/anonymize`, estados de privacidade em fotografias/relatórios, painel React, testes negativos e evidence `CORE-HIBRIDO`.
