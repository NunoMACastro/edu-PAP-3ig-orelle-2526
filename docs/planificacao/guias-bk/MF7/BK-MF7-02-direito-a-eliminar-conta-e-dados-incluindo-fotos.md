# BK-MF7-02 - Direito a pedidos canónicos de privacidade e eliminação terminal da própria conta; decisões destrutivas só por administrador

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
- `last_updated`: `2026-07-11`

> **Contrato reconciliado com o runtime:** os endpoints canónicos são `POST|GET /api/me/privacy-requests`, `GET|PATCH /api/admin/privacy-requests`, `PATCH /api/admin/privacy-requests/:requestId`, `POST /api/admin/privacy-requests/:requestId/retry` e `DELETE /api/me/account`. Os aliases `biometric-data-requests` existem apenas para transição e não devem ser usados por novos clientes. Claims, metadados, jobs outbox e mutações multi-documento exigem MongoDB replica set e uma transação real; se a transação não puder iniciar, o fluxo falha sem mutar dados. Um pedido só fica `completed` depois de os ficheiros aplicáveis estarem fisicamente ausentes; eliminação de conta exige password e `ELIMINAR`, revoga sessões e deixa `deleted` terminal.

> **Autorização destrutiva canónica — 2026-07-11:** listagem, detalhe, decisão e retry sob `/api/admin/privacy-requests` exigem exclusivamente `ROLES.ADMIN`. Cliente e consultor recebem `403`. A role `consultor` só intervém na revisão humana cosmética em `/consultoria/revisoes`; não aprova, rejeita ou repete eliminações/anonymizações. `DELETE /api/me/account` é uma ação do próprio titular autenticado e não depende de aprovação administrativa.

> **Cobertura terminal OpenAI v2 e registry 001–015 — 2026-07-11:** `deleteOwnedDocuments` enumera explicitamente `AiConsultationSession`, `AiJob`, `AiConsultationReview`, `AiInteractionHistory`, `FaceAnalysis`, `FaceReport`, `FacePhoto`, `FaceConsent`, `ProductRecommendation`, `ReportUnlock`, `MakeupSimulation`, `MakeupSimulationQuota`, `BeforeAfterVisualization`, `SkinComparison` e os restantes documentos próprios. Remove também `ReportPhotoGrant`, `RecommendationReview`, `BiometricDataRequest` e os `AiConsultationAuditLog` ligados às revisões do titular; outputs de maquilhagem/fotografias entram no outbox e têm ausência física comprovada. `AuthSession` é revogada; encomendas simuladas não pagas são apagadas e as pagas são anonimizadas. O registry de migrations é append-only e completo de `001_payment_simulation_contract` a `015_photo_quality_and_openai_simulation`; nunca se alteram checksums de `001–009`.

> **Adenda canónica da migration 009:** `reason` e `decisionReason` são envelopes AES-GCM contextuais v2 ligados a `requesterId`, sem defaults em claro. Revogação, aprovação de pedido, eliminação terminal e novos writers disputam uma escrita transacional no mesmo `User`: o workflow destrutivo instala o tombstone e `claimFaceDataWrite` só reclama conta ativa/não bloqueada, revalidando consentimento/pedidos; a análise revalida também as `photoIds`. `faceDataGeneration` é incrementada como versão operacional, mas não é um token capturado no início. `009_privacy_barriers_and_face_file_encryption` normaliza a barreira, recifra fotografias/motivos e deduplica relatórios/drafts. O foco migration/privacidade passou `14/14`; a suite integral atual permanece obrigatória.

#### Objetivo

Neste BK vais fechar o direito de eliminação/anonimização de conta e dados sensíveis. O utilizador cliente deve conseguir pedir tratamento dos seus dados faciais; apenas um administrador decide o pedido, sem expor fotografias, relatórios completos, cookies, tokens ou caminhos internos. O titular pode eliminar terminalmente a própria conta com password e confirmação forte.

`CANONICO`: `RNF13` exige direito a eliminar conta e dados, incluindo fotos. `RF41` define um painel administrativo para pedidos de eliminação/anonymização de fotografias e relatórios. `RF44` reforça que acessos e decisões sobre dados biométricos devem ser auditáveis.

#### Importância

O direito de apagamento não pode ser um botão que remove dados sem controlo. A app precisa de pedido, decisão autorizada, auditoria e estado durável. Assim, se uma operação falhar, o pedido não fica perdido, e os dados deixam de aparecer nos fluxos normais sem destruir a rastreabilidade mínima necessária para defesa técnica e privacidade.

#### Scope-in

- Criar pedido de privacidade biométrica feito pelo próprio cliente.
- Permitir ação `delete` ou `anonymize` sobre fotografias e relatórios.
- Remover efetivamente os dados abrangidos; estados legados não substituem a ausência física/documental.
- Garantir decisão e retry apenas por administrador autenticado.
- Registar auditoria na listagem e em cada decisão.
- Criar UI de cliente para pedir eliminação/anonimização.
- Criar UI de revisão exclusivamente administrativa com dados minimizados.
- Eliminar a própria conta através de `DELETE /api/me/account`, com password, confirmação literal `ELIMINAR`, revogação de sessões e estado terminal.
- Abranger explicitamente todos os recursos da consulta OpenAI v2, jobs, grants, unlocks, recomendações e imagens derivadas.
- Manter e provar o registry append-only de migrations `001–015`.
- Executar jobs idempotentes de remoção física e permitir retry autorizado quando a limpeza falhar.
- Validar negativos de sessão, role, recurso inválido, pedido inexistente, pedido já decidido e falha operacional.

#### Scope-out

- Não marcar um pedido `completed` antes de confirmar que os ficheiros aplicáveis deixaram de existir.
- Não expor fotografias, relatórios completos, storage key, token, cookie ou paths internos no painel.
- Não permitir que o frontend escolha `requesterId`, `reviewerId` ou `subjectUserId`.
- Não apagar encomendas simuladas pagas sem preservar prova anonimizada; carrinho, vouchers e recomendações próprias são eliminados com a conta.
- Não criar novo consentimento RGPD; o consentimento facial fica no `BK-MF7-01`.
- Não substituir a encriptação em repouso definida no `BK-MF6-07`.

#### Estado antes e depois

- Antes: a app já tem fotografias, relatórios, consentimento e pedidos biométricos, mas o aluno ainda precisa de um fluxo completo para fechar `RNF13` sem inventar service, controller, rotas, auditoria ou UI.
- Depois: o aluno tem um fluxo seguro de pedido, revisão, decisão, auditoria e remoção efetiva, além da eliminação terminal da própria conta, com código completo para backend, frontend e testes.

#### Pre-requisitos

- `BK-MF0-02`: login/logout com sessão segura por cookie HttpOnly.
- `BK-MF1-05`: fotografias faciais associadas ao utilizador autenticado.
- `BK-MF1-07`: relatórios faciais associados ao utilizador autenticado.
- `BK-MF5-01`: painel inicial de pedidos de eliminação/anonymização.
- `BK-MF5-04`: auditoria de acessos biométricos.
- `BK-MF6-07`: `privacyStatus` em relatórios e `status` em fotografias.
- `BK-MF7-01`: consentimento separado dos dados sensíveis.

#### Glossário

- Eliminação física: remover os bytes sensíveis do storage; metadados mínimos de job/auditoria não podem conservar conteúdo biométrico nem ligação pessoal desnecessária.
- Anonimização: retirar a ligação pessoal útil entre o dado e a pessoa.
- Pedido pendente: pedido criado pelo cliente e ainda não decidido.
- Decisão autorizada: aprovação, rejeição ou retry feita exclusivamente por administrador autenticado.
- Auditoria sensível: registo mínimo de quem acedeu ou decidiu, sem copiar dados biométricos.
- DTO seguro: resposta preparada para API/UI que não devolve conteúdo sensível.
- Transação: grupo de alterações que deve confirmar tudo em conjunto quando o MongoDB suporta essa garantia.
- Fallback durável: estado persistido que permite recuperar uma operação quando não há transação real.

#### Conceitos teóricos essenciais

Um pedido de privacidade biométrica começa no cliente, mas o dono dos dados vem sempre da sessão. O frontend envia intenção (`action`, `resources`, `reason`); o backend coloca `requesterId` com `req.user.id`. Este desenho evita que um utilizador envie o ID de outra pessoa no body.

Eliminar e anonimizar são intenções diferentes. Para fotografias, ambas removem sempre os bytes. Para relatórios, `delete` elimina o documento e `anonymize` só poderia preservar um agregado sem IDs, texto livre, datas exatas ou ligação ao titular. Como esse agregado não existe no modelo atual, `anonymize` também elimina o documento pessoal.

A decisão pertence exclusivamente ao administrador. O cliente pode pedir, mas não deve aprovar o próprio pedido; o consultor recebe `403`. A listagem e a decisão mostram metadados: `id`, `action`, `resources`, `status`, datas e motivos. Não mostram fotografia, relatório completo, storage key, cookie, token ou detalhes internos.

A auditoria existe porque `RF44` trata acessos biométricos. O log deve dizer quem listou ou decidiu, que pedido foi tocado, se a tentativa foi aceite ou recusada e qual foi a razão operacional. O log não deve guardar cópia de relatório, imagem ou segredo.

`DERIVADO`: a aprovação cria trabalho idempotente e o pedido passa por `processing`; só chega a `completed` depois de verificação física. Uma falha fica `failed` e pode ser repetida pela rota canónica de retry, sem fingir sucesso.

#### Arquitetura do BK

- Model: `BiometricDataRequest`.
- Validator: `validateCreateBiometricDataRequestInput` e `validateBiometricDataRequestDecisionInput`.
- Service: criação, listagem, auditoria, decisão, remoção efetiva, retry durável e eliminação terminal de conta.
- Controller: handlers HTTP com `201`, `200`, `400`, `401`, `403`, `404`, `409` e erro controlado.
- Routes: `/api/me/privacy-requests`, `/api/admin/privacy-requests`, retry por pedido e `DELETE /api/me/account`.
- Frontend: `BiometricDataRequestPage` para cliente e `BiometricDataRequestsAdminPage` exclusivamente para administrador.
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
- CRIAR: `apps/api/tests/privacy-requests.replset.integration.test.js`
- REVER: `apps/api/src/services/biometric-audit.service.js`
- REVER: `apps/api/src/models/face-photo.model.js`
- REVER: `apps/api/src/models/face-report.model.js`
- REVER: `apps/api/src/services/face-data-write-barrier.service.js`
- REVER: `apps/api/src/migrations/009_privacy_barriers_and_face_file_encryption.js`
- REVER: `apps/api/src/migrations/010_openai_only_and_consent_v2.js`
- REVER: `apps/api/src/migrations/011_goal_consultation_and_ai_jobs.js`
- REVER: `apps/api/src/migrations/012_product_ai_metadata_and_variants.js`
- REVER: `apps/api/src/migrations/013_report_v2_and_recommendation_snapshots.js`
- REVER: `apps/api/src/migrations/014_report_review_and_unlock_snapshot.js`
- REVER: `apps/api/src/migrations/015_photo_quality_and_openai_simulation.js`
- REVER: `apps/api/src/migrations/index.js`
- REVER: `apps/api/tests/migration-009-privacy-face-files.replset.integration.test.js`
- EDITAR: `apps/api/src/routes/me-account.routes.js`
- EDITAR: `apps/api/src/controllers/account-erasure.controller.js`
- EDITAR: `apps/api/src/services/account-erasure.service.js`
- EDITAR: `apps/api/src/validators/account-erasure.validator.js`
- CRIAR: `apps/api/tests/account-erasure.replset.integration.test.js`
- CRIAR: `apps/api/tests/privacy-requests.replset.integration.test.js`

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

Confirma que `RNF13` é sobre direito de eliminação, que `RF41` define revisão exclusivamente administrativa para fotografias e relatórios, e que `RF44` exige auditoria de acessos biométricos. Mantém separado o fluxo de revisão cosmética do consultor. Não transformes este BK em gestão genérica de contas; aqui o foco é tratamento seguro de dados pessoais e eliminação terminal do próprio titular.

4. Código completo, correto e integrado com a app final.

Sem código neste passo. A decisão é documental e evita criar um endpoint destrutivo sem autorização, ownership ou auditoria.

5. Explicação do código.

Sem código. Este passo protege o domínio: cliente pede, administrador decide, backend aplica estados e auditoria regista a operação. Esta divisão evita que a UI decida ownership ou que a app apague dados sensíveis sem prova mínima.

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
import { contextualEncryptedField } from "../utils/contextual-encrypted-field.util.js";

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
        reason: contextualEncryptedField({
            collection: "biometricdatarequests",
            ownerField: "requesterId",
            field: "reason",
        }),
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
        decisionReason: contextualEncryptedField({
            collection: "biometricdatarequests",
            ownerField: "requesterId",
            field: "decisionReason",
        }),
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

O ficheiro define listas fechadas para ações, recursos e estados. Isto impede texto livre como `all`, `database` ou outro alvo fora de `RNF13`. O campo `requesterId` fica indexado porque todas as alterações posteriores devem respeitar ownership. `reason`/`decisionReason` não têm defaults: o setter cifra com o owner exato e o DTO aplica `?? ""` apenas depois da leitura autorizada. O model não guarda fotografia, relatório completo, storage key, cookie ou token. Os estados `processing` e `failed` suportam lease/retry do outbox depois do commit; nunca autorizam mutações multi-documento sem transação.

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
 * Valida a decisão tomada por administrador.
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

Um cliente não pode pedir recurso `orders`, porque encomendas não fazem parte do pedido biométrico. Um administrador não pode decidir com `decision: "maybe"`; um consultor nem sequer entra no validator, pois a rota devolve `403` antes do controller.

### Passo 4 - Implementar service fail-closed com ownership, transação e outbox

1. Objetivo funcional do passo no contexto da app.

Criar, listar e decidir pedidos, garantindo que os recursos alterados pertencem ao cliente do pedido.

2. Ficheiros envolvidos:
    - EDITAR: `apps/api/src/services/biometric-data-request.service.js`
    - LOCALIZAÇÃO: ficheiro completo.

3. Instruções do que fazer.

O listing longo abaixo documenta a sequência de migração para o workflow atual. **Não copies as transições antigas que marcam recursos ou `completed` diretamente:** a implementação final exige replica set, transação para claim/jobs/metadados, outbox `FileDeletionJob`, worker idempotente e `processApprovedPrivacyRequest`/`retryBiometricDataRequest`. Não existe fallback standalone para mutações multi-documento.

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
 * Exige options de Mongoose ligadas a uma transação real.
 *
 * @function transactionOptions
 * @param {import("mongoose").ClientSession} session - Sessão transacional obrigatória.
 * @returns {{session: import("mongoose").ClientSession}} Options para queries/saves.
 * @throws {AppError} Quando o caller tenta mutar sem transação.
 */
function transactionOptions(session) {
    if (!session) {
        throw new AppError(503, "Transação MongoDB obrigatória para este pedido");
    }

    return { session };
}

/**
 * Executa uma decisão obrigatoriamente dentro de uma transação replica-set.
 *
 * @async
 * @function runInRequiredTransaction
 * @param {(session: import("mongoose").ClientSession) => Promise<object>} handler - Mutação a executar.
 * @returns {Promise<object>} Resultado do handler.
 */
async function runInRequiredTransaction(handler) {
    const session = await mongoose.startSession();

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
 * Carrega pedido dentro da sessão transacional obrigatória.
 *
 * @async
 * @function findBiometricDataRequestById
 * @param {string} requestId - ID validado do pedido.
 * @param {import("mongoose").ClientSession} session - Sessão transacional obrigatória.
 * @returns {Promise<object|null>} Documento de pedido ou null.
 */
async function findBiometricDataRequestById(requestId, session) {
    return BiometricDataRequest.findById(
        requestId,
        null,
        transactionOptions(session),
    );
}

/**
 * Grava pedido com a transação recebida pelo caller.
 *
 * @async
 * @function saveBiometricDataRequest
 * @param {object} request - Documento Mongoose ou mock equivalente.
 * @param {import("mongoose").ClientSession} session - Sessão transacional obrigatória.
 * @returns {Promise<void>} Conclui após persistência.
 */
async function saveBiometricDataRequest(request, session) {
    await request.save(transactionOptions(session));
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
 * @param {{id: string, role: string}} actor - Administrador autenticado.
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
 * @param {{id: string, role: string}} actor - Administrador autenticado.
 * @param {object|null} request - Pedido encontrado, quando existir.
 * @param {{resourceId: string, result: string, reason: string}} event - Metadados do resultado.
 * @param {{session?: import("mongoose").ClientSession|null}} [options] - Sessão da decisão aplicada.
 * @returns {Promise<void>} Conclui após gravar auditoria.
 */
async function recordDecisionAudit(
    actor,
    request,
    event,
    { session = null } = {},
) {
    await recordBiometricAccess(
        {
            actorId: actor.id,
            actorRole: actor.role,
            subjectUserId: idToString(request?.requesterId),
            action: BIOMETRIC_AUDIT_ACTIONS.DECIDE_REQUEST,
            resourceType: BIOMETRIC_AUDIT_RESOURCE_TYPES.REQUEST,
            resourceId: event.resourceId,
            result: event.result,
            reason: event.reason,
        },
        { session },
    );
}

/**
 * Exemplo de transição anterior: marca recursos antes do outbox físico.
 *
 * @async
 * @function applyDeleteAction
 * @param {import("mongoose").Types.ObjectId|string} requesterId - Dono dos recursos.
 * @param {string[]} resources - Recursos pedidos.
 * @param {import("mongoose").ClientSession} session - Sessão transacional obrigatória.
 * @returns {Promise<void>} Conclui quando os recursos ficam fora da operação normal.
 */
async function applyDeleteAction(requesterId, resources, session) {
    const options = transactionOptions(session);

    if (resources.includes(BIOMETRIC_REQUEST_RESOURCES.PHOTOS)) {
        const filter = { userId: requesterId, status: "active" };
        const update = { $set: { status: "deleted" } };

        // O filtro por userId impede decisões administrativas sobre recursos de outro cliente.
        await FacePhoto.updateMany(filter, update, options);
    }

    if (resources.includes(BIOMETRIC_REQUEST_RESOURCES.REPORTS)) {
        const filter = { userId: requesterId };

        await FaceReport.deleteMany(filter, options);
    }
}

/**
 * Aplica anonymização mínima aos recursos selecionados.
 *
 * @async
 * @function applyAnonymizeAction
 * @param {import("mongoose").Types.ObjectId|string} requesterId - Dono dos recursos.
 * @param {string[]} resources - Recursos pedidos.
 * @param {import("mongoose").ClientSession} session - Sessão transacional obrigatória.
 * @returns {Promise<void>} Conclui quando os dados deixam de ser úteis para identificação.
 */
async function applyAnonymizeAction(requesterId, resources, session) {
    const options = transactionOptions(session);

    if (resources.includes(BIOMETRIC_REQUEST_RESOURCES.PHOTOS)) {
        const filter = { userId: requesterId, status: "active" };
        // Anonymize também elimina os bytes; o estado só retira o documento
        // da operação enquanto o outbox confirma a remoção física.
        const update = { $set: { status: "deleted" } };

        await FacePhoto.updateMany(filter, update, options);
    }

    if (resources.includes(BIOMETRIC_REQUEST_RESOURCES.REPORTS)) {
        // O modelo atual não produz um agregado comprovadamente anónimo.
        const filter = { userId: requesterId };

        await FaceReport.deleteMany(filter, options);
    }
}

/**
 * Aplica a ação aprovada aos recursos pedidos.
 *
 * @async
 * @function applyApprovedBiometricDataRequest
 * @param {object} request - Pedido aprovado.
 * @param {import("mongoose").ClientSession} session - Sessão transacional obrigatória.
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
    // Este marcador isolado ocorre depois de uma falha do worker/outbox; não
    // executa nem tenta completar a mutação multi-documento original.
    await request.save();
}

/**
 * Encaminha a aprovação para o workflow canónico de claim, outbox e verificação.
 *
 * @async
 * @function approveBiometricDataRequest
 * @param {object} request - Pedido a aprovar.
 * @param {string} reviewerId - Revisor autenticado.
 * @param {{decisionReason: string}} input - Input validado.
 * @returns {Promise<object>} Pedido atualizado em DTO seguro.
 */
async function approveBiometricDataRequest(request, reviewerId, input) {
    return processApprovedPrivacyRequest(
        request._id.toString(),
        { id: reviewerId, role: "revisor_autorizado" },
        input,
    );
}

/**
 * Decide um pedido pendente e aplica tratamento quando há aprovação.
 *
 * @async
 * @function decideBiometricDataRequest
 * @param {string} requestId - Pedido a decidir.
 * @param {{id: string, role: string}} actor - Administrador autenticado.
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

    if (input.decision === "approved") {
        return processApprovedPrivacyRequest(requestId, actor, input);
    }

    return runInRequiredTransaction(async (session) => {
        // Primeiro resolve o owner na mesma snapshot transacional. Depois repete
        // requesterId no CAS para o setter cifrar decisionReason com AAD exata.
        const candidate = await BiometricDataRequest.findOne({
            _id: requestId,
            status: BIOMETRIC_REQUEST_STATUSES.PENDING,
        })
            .select("requesterId")
            .session(session);

        if (!candidate) {
            throw new AppError(409, "Pedido inexistente ou já decidido.");
        }

        const request = await BiometricDataRequest.findOneAndUpdate(
            {
                _id: requestId,
                requesterId: candidate.requesterId,
                status: BIOMETRIC_REQUEST_STATUSES.PENDING,
            },
            {
                $set: {
                    status: BIOMETRIC_REQUEST_STATUSES.REJECTED,
                    reviewerId: actor.id,
                    decisionReason: input.decisionReason,
                    reviewedAt: new Date(),
                    decisionError: "",
                },
            },
            { new: true, runValidators: true, session },
        );

        if (!request) throw new AppError(409, "Pedido já foi decidido.");
        await recordDecisionAudit(actor, request, {
            resourceId: requestId,
            result: BIOMETRIC_AUDIT_RESULTS.ALLOWED,
            reason: "Pedido biométrico rejeitado por revisor autorizado.",
        }, { session });
        return toBiometricDataRequestResponse(request);
    });
}
```

#### Implementação canónica atual do workflow físico

O fluxo final substitui `approveBiometricDataRequest` do listing anterior por esta fronteira operacional:

```js
// apps/api/src/services/biometric-data-request.service.js
import { randomUUID } from "node:crypto";

async function claimAndPreparePrivacyRequest(requestId, actor, input, workflow) {
    return runInRequiredTransaction(async (session) => {
        const candidate = await BiometricDataRequest.findOne(
            buildClaimFilter(requestId, workflow.retry, workflow.now),
        )
            .select("requesterId")
            .session(session);
        if (!candidate) return null;

        const request = await BiometricDataRequest.findOneAndUpdate(
            {
                ...buildClaimFilter(requestId, workflow.retry, workflow.now),
                requesterId: candidate.requesterId,
            },
            {
                $set: {
                    status: BIOMETRIC_REQUEST_STATUSES.PROCESSING,
                    reviewerId: actor.id,
                    decisionReason: input.decisionReason,
                    "lease.token": workflow.leaseToken,
                    "lease.expiresAt": new Date(
                        workflow.now.getTime() + REQUEST_LEASE_MS,
                    ),
                },
                $inc: { attempts: 1 },
            },
            { new: true, runValidators: true, session },
        );
        if (!request) return null;

        if (request.resources.includes(BIOMETRIC_REQUEST_RESOURCES.PHOTOS)) {
            await blockFaceDataWritesForPrivacy(request.requesterId, {
                at: workflow.now,
                session,
            });
        }

        await preparePrivacyResourcesAndDeletionJobs(request, { session });
        return request;
    });
}

async function finalizePrivacyRequest(request, leaseToken, actor, auditReason) {
    return runInRequiredTransaction(async (session) => {
        const jobsCompleted = await areFileDeletionJobsCompleted(
            { sourceType: "privacy_request", sourceId: request._id },
            { session },
        );
        if (!jobsCompleted) {
            throw new AppError(503, "Remoção física ainda não confirmada");
        }

        // Depois de o outbox provar ENOENT, removemos os metadados pessoais.
        if (request.resources.includes("photos")) {
            await FacePhoto.deleteMany(
                { userId: request.requesterId },
                { session },
            );
        }

        // As contagens e o CAS de conclusão pertencem à mesma snapshot.
        const remainingPhotos = request.resources.includes("photos")
            ? await FacePhoto.countDocuments({
                userId: request.requesterId,
            }).session(session)
            : 0;
        const remainingReports = request.resources.includes("reports")
            ? await FaceReport.countDocuments({
                userId: request.requesterId,
            }).session(session)
            : 0;
        if (remainingPhotos !== 0 || remainingReports !== 0) {
            throw new AppError(503, "Eliminação de dados ainda incompleta");
        }

        const completed = await BiometricDataRequest.findOneAndUpdate(
            {
                _id: request._id,
                status: BIOMETRIC_REQUEST_STATUSES.PROCESSING,
                "lease.token": leaseToken,
            },
            {
                $set: {
                    status: BIOMETRIC_REQUEST_STATUSES.COMPLETED,
                    completedAt: new Date(),
                    erasureVerifiedAt: new Date(),
                    "lease.token": null,
                    "lease.expiresAt": null,
                },
            },
            { new: true, session },
        );
        if (!completed) throw new AppError(409, "Lease deixou de ser válido");

        // Aprovação e retry só ficam concluídos se este audit também fizer commit.
        await recordDecisionAudit(
            actor,
            completed,
            {
                resourceId: completed._id.toString(),
                result: BIOMETRIC_AUDIT_RESULTS.ALLOWED,
                reason: auditReason,
            },
            { session },
        );
        return completed;
    });
}

export async function processApprovedPrivacyRequest(
    requestId,
    actor,
    input,
    { retry = false, fileWorker = {} } = {},
) {
    const successAuditReason = retry
        ? "Pedido de privacidade reprocessado com sucesso."
        : "Pedido de privacidade aprovado e aplicado.";
    const leaseToken = randomUUID();
    const request = await claimAndPreparePrivacyRequest(requestId, actor, input, {
        retry,
        leaseToken,
        now: new Date(),
    });

    if (!request) {
        const existing = await loadRequestOrThrow(requestId);
        if (retry && existing.status === "completed" && existing.erasureVerifiedAt) {
            return existing;
        }
        throw new AppError(409, "Pedido indisponível para reprocessamento");
    }

    try {
        const fileResult = await processFileDeletionJobs({
            sourceType: "privacy_request",
            sourceId: request._id,
            ...fileWorker,
        });
        if (fileResult.failed > 0 || fileResult.outstanding > 0) {
            throw new AppError(503, "Remoção física ainda não confirmada");
        }
        return finalizePrivacyRequest(
            request,
            leaseToken,
            actor,
            successAuditReason,
        );
    } catch (error) {
        await markPrivacyRequestFailed(requestId, leaseToken);
        throw error;
    }
}
```

`claimAndPreparePrivacyRequest` resolve primeiro o owner na transação, repete `requesterId` no filtro que cifra `decisionReason` e instala o tombstone no mesmo `User` escrito por `claimFaceDataWrite`. Esta escrita comum lineariza a corrida: se o writer confirmar primeiro, a captura posterior inclui o novo recurso; se o tombstone confirmar primeiro, upload/análise falha ao reclamar a conta. O writer revalida consentimento/pedidos e a análise revalida as `photoIds`; a ordem não depende de uma versão transportada desde o início. O restante CAS cria jobs deduplicados, marca fotografias fora dos fluxos e elimina relatórios tanto em `delete` como em `anonymize`. `finalizePrivacyRequest` volta a verificar jobs/bytes e grava `completed` e o audit `allowed` na mesma sessão; uma falha no audit faz rollback da conclusão e deixa o workflow recuperável. Aprovação e retry partilham esta fronteira, sem duplicar efeitos.

5. Explicação do código.

O service cria pedidos com `requesterId` vindo da sessão, lista apenas metadados e regista auditoria de listagem. A decisão começa por validar o ID, carregar o pedido e confirmar que o estado ainda permite decisão. Se for rejeição, só muda metadados. Se for aprovação, ambas as intenções removem bytes das fotografias e eliminam os relatórios pessoais, sempre com filtro por `requesterId`; a intenção original continua guardada no pedido/auditoria.

A transação agrupa o claim, jobs e mutações de documentos no replica set local. A remoção do filesystem ocorre depois do commit e é recuperável pelo outbox; `failed` permanece visível até retry, e `completed` exige verificação física explícita.

6. Validação do passo.

Executa:

```bash
rg -n "createMyBiometricDataRequest|listBiometricDataRequestsForReview|recordDecisionAudit|enqueueFileDeletionJobs|FaceReport.deleteMany|status: \"deleted\"" apps/api/src/services/biometric-data-request.service.js
```

Confirma que todas as queries que alteram fotografias ou relatórios filtram por `requesterId` e nunca por ID vindo do frontend.

7. Cenário negativo/erro esperado.

Um pedido de um cliente não pode alterar relatórios de outro cliente. Uma decisão repetida sobre pedido `completed` deve devolver `409`. Se o replica set/transação não estiver disponível, o pedido devolve erro controlado sem qualquer mutação; se a remoção física pós-commit falhar, o job fica `failed` e pode ser repetido idempotentemente.

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
    validateBiometricDataRequestRetryInput,
    validateCreateBiometricDataRequestInput,
} from "../validators/biometric-data-request.validator.js";
import {
    createMyBiometricDataRequest,
    decideBiometricDataRequest,
    listBiometricDataRequestsForReview,
    listMyBiometricDataRequests,
    retryBiometricDataRequest,
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

/** Lista apenas os pedidos pertencentes ao cliente autenticado. */
export async function listMyBiometricDataRequestsController(req, res, next) {
    try {
        const requests = await listMyBiometricDataRequests(req.user.id);
        return res.status(200).json({ requests });
    } catch (err) {
        return next(err);
    }
}

/**
 * Lista pedidos para revisão por administrador.
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
 * @param {import("express").Request & {user: {id: string, role: string}}} req - Pedido autenticado de administrador.
 * @param {import("express").Response} res - Resposta Express.
 * @param {import("express").NextFunction} next - Próximo middleware.
 * @returns {Promise<import("express").Response|void>} Resposta 200 com decisão aplicada.
 */
export async function decideBiometricDataRequestController(req, res, next) {
    try {
        const input = validateBiometricDataRequestDecisionInput(req.body);
        const requestId =
            req.params.requestId ?? req.body.requestId ?? req.body.id;
        const request = await decideBiometricDataRequest(
            requestId,
            req.user,
            input,
        );

        return res.status(200).json({ request });
    } catch (err) {
        return next(err);
    }
}

/** Repete idempotentemente um pedido falhado, sem alterar ação/recursos. */
export async function retryBiometricDataRequestController(req, res, next) {
    try {
        const input = validateBiometricDataRequestRetryInput(req.body);
        const request = await retryBiometricDataRequest(
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
    listMyBiometricDataRequestsController,
    retryBiometricDataRequestController,
} from "../controllers/biometric-data-request.controller.js";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { requireRole } from "../middlewares/role.middleware.js";

/**
 * Router Express para RNF13/RF41.
 *
 * @type {import("express").Router}
 */
export const biometricDataRequestRoutes = Router();

const requireClient = [requireAuth, requireRole(ROLES.CLIENTE)];
const requirePrivacyAdmin = [requireAuth, requireRole(ROLES.ADMIN)];

biometricDataRequestRoutes.post(
    "/me/privacy-requests",
    ...requireClient,
    createMyBiometricDataRequestController,
);

biometricDataRequestRoutes.get(
    "/me/privacy-requests",
    ...requireClient,
    listMyBiometricDataRequestsController,
);

biometricDataRequestRoutes.get(
    "/admin/privacy-requests",
    ...requirePrivacyAdmin,
    listBiometricDataRequestsController,
);

biometricDataRequestRoutes.patch(
    "/admin/privacy-requests",
    ...requirePrivacyAdmin,
    decideBiometricDataRequestController,
);

biometricDataRequestRoutes.patch(
    "/admin/privacy-requests/:requestId",
    ...requirePrivacyAdmin,
    decideBiometricDataRequestController,
);

biometricDataRequestRoutes.post(
    "/admin/privacy-requests/:requestId/retry",
    ...requirePrivacyAdmin,
    retryBiometricDataRequestController,
);
```

5. Explicação do código.

O controller faz validação antes de chamar o service. A criação usa `req.user.id`, por isso ignora qualquer `requesterId` enviado pelo frontend. A listagem, decisão e retry recebem `req.user`, permitindo registar auditoria com ator e role. As rotas usam `requireAuth` em todos os endpoints; todas as rotas `/admin/privacy-requests` exigem `requireRole(ROLES.ADMIN)`.

6. Validação do passo.

Executa:

```bash
rg -n "biometricDataRequestRoutes|createMyBiometricDataRequestController|listBiometricDataRequestsController|decideBiometricDataRequestController|app.use\\(\"/api\", biometricDataRequestRoutes\\)" apps/api/src
```

7. Cenário negativo/erro esperado.

Sem sessão, os endpoints devem devolver `401`. Cliente ou consultor autenticado não pode aceder a `/api/admin/privacy-requests`. Um administrador não pode criar pedido em nome de cliente pela rota `/me`.

### Passo 6 - Criar UI de cliente e revisão minimizada

1. Objetivo funcional do passo no contexto da app.

Permitir ao cliente criar pedido e ao administrador decidir/repetir pedidos sem mostrar dados biométricos.

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
            const data = await apiRequest("/me/privacy-requests", {
                method: "POST",
                body: JSON.stringify({
                    action: form.action,
                    resources: form.resources,
                    reason: form.reason,
                }),
            });

            setStatus("success");
            setMessage("Pedido criado. Um administrador vai rever a decisão.");
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
            const data = await apiRequest("/admin/privacy-requests");
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
                `/admin/privacy-requests/${requestId}`,
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
rg -n "BiometricDataRequestPage|BiometricDataRequestsAdminPage|/me/privacy-requests|/admin/privacy-requests|credentials: \"include\"" apps/web/src
```

7. Cenário negativo/erro esperado.

Se a lista de recursos estiver vazia, a UI bloqueia submissão e a API também devolve `400`. Se um visitante abrir a página e tentar criar pedido, a API devolve `401`.

### Passo 7 - Criar testes e evidence do fluxo RNF13

1. Objetivo funcional do passo no contexto da app.

Provar que criação, revisão, decisão, ownership e negativos funcionam sem expor dados sensíveis.

2. Ficheiros envolvidos:
    - CRIAR: `apps/api/tests/privacy-requests.replset.integration.test.js`
    - LOCALIZAÇÃO: ficheiro completo.

3. Instruções do que fazer.

O listing com mocks fica apenas como contrato HTTP auxiliar e, se for mantido, usa o nome `privacy-requests.http.contract.test.js`; não prova transações nem filesystem. A prova canónica em `privacy-requests.replset.integration.test.js` usa `MongoMemoryReplSet`, modelos reais, ficheiros temporários reais e failure injection no append-only audit. Executar cenários negativos obrigatórios (mínimo 3): sem sessão, role errada, recurso inválido, pedido fechado, falha operacional e falha do audit durante rejeição/aprovação.

4. Código completo, correto e integrado com a app final.

Bloco auxiliar de contrato HTTP — não o apresentar como evidence transacional:

```js
// apps/api/tests/privacy-requests.http.contract.test.js
/**
 * Testes de contrato HTTP do BK-MF7-02.
 *
 * Cobrem criação, revisão e efeitos de pedidos de privacidade biométrica sem
 * persistência real. O foco é apenas ownership por sessão, roles e DTOs;
 * esta suite nunca substitui a integração com replica set descrita abaixo.
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
        deleteMany: vi.fn(),
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

    it("permite cliente criar pedido e administrador listar metadados", async () => {
        const requestDoc = makeRequestDoc();

        BiometricDataRequest.create.mockResolvedValue(requestDoc);
        BiometricDataRequest.find.mockReturnValue(querySortLimit([requestDoc]));

        const created = await request(createApp())
            .post("/api/me/privacy-requests")
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
            .get("/api/admin/privacy-requests")
            .set("Cookie", cookieFor({ id: adminId, role: ROLES.ADMIN }));

        expect(listed.status).toBe(200);
        expect(listed.body.requests).toHaveLength(1);
        expect(recordBiometricAccess).toHaveBeenCalledWith(
            expect.objectContaining({
                actorId: adminId,
                action: "list_requests",
                resourceType: "request",
            }),
        );
    });

    it("bloqueia negativos de sessão, role e recurso inválido", async () => {
        const app = createApp();

        const noSession = await request(app)
            .post("/api/me/privacy-requests")
            .send({ action: "delete", resources: ["photos"] });
        const wrongRole = await request(app)
            .get("/api/admin/privacy-requests")
            .set("Cookie", cookieFor({ id: clienteId, role: ROLES.CLIENTE }));
        const consultantRole = await request(app)
            .get("/api/admin/privacy-requests")
            .set("Cookie", cookieFor({ id: consultorId, role: ROLES.CONSULTOR }));
        const consultantDecision = await request(app)
            .patch(`/api/admin/privacy-requests/${requestId}`)
            .set("Cookie", cookieFor({ id: consultorId, role: ROLES.CONSULTOR }))
            .send({ decision: "approved", decisionReason: "Pedido válido." });
        const consultantRetry = await request(app)
            .post(`/api/admin/privacy-requests/${requestId}/retry`)
            .set("Cookie", cookieFor({ id: consultorId, role: ROLES.CONSULTOR }));
        const invalidResource = await request(app)
            .post("/api/me/privacy-requests")
            .set("Cookie", cookieFor({ id: clienteId, role: ROLES.CLIENTE }))
            .send({ action: "delete", resources: ["orders"] });

        expect(noSession.status).toBe(401);
        expect(wrongRole.status).toBe(403);
        expect(consultantRole.status).toBe(403);
        expect(consultantDecision.status).toBe(403);
        expect(consultantRetry.status).toBe(403);
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
        FaceReport.deleteMany.mockResolvedValue({ deletedCount: 1 });

        const response = await request(createApp())
            .patch(`/api/admin/privacy-requests/${requestId}`)
            .set("Cookie", cookieFor({ id: adminId, role: ROLES.ADMIN }))
            .send({ decision: "approved", decisionReason: "Pedido válido." });

        expect(response.status).toBe(200);
        expect(response.body.request.status).toBe("completed");
        expect(FacePhoto.updateMany).toHaveBeenCalledWith(
            { userId: clienteId },
            { $set: { status: "deleted" } },
            expect.objectContaining({ session: expect.anything() }),
        );
        expect(FaceReport.deleteMany).toHaveBeenCalledWith(
            { userId: clienteId },
            expect.objectContaining({ session: expect.anything() }),
        );
    });

    it("recusa decisão repetida e regista auditoria negada", async () => {
        BiometricDataRequest.findById.mockResolvedValue(
            makeRequestDoc({ status: "completed" }),
        );

        const response = await request(createApp())
            .patch(`/api/admin/privacy-requests/${requestId}`)
            .set("Cookie", cookieFor({ id: adminId, role: ROLES.ADMIN }))
            .send({ decision: "approved", decisionReason: "Pedido válido." });

        expect(response.status).toBe(409);
        expect(FacePhoto.updateMany).not.toHaveBeenCalled();
        expect(FaceReport.deleteMany).not.toHaveBeenCalled();
        expect(recordBiometricAccess).toHaveBeenCalledWith(
            expect.objectContaining({
                actorId: adminId,
                action: "decide_request",
                result: "denied",
            }),
        );
    });

    it("mantém failed quando o worker físico falha e permite retry", async () => {
        const failingRequest = makeRequestDoc({
            action: "delete",
            resources: ["photos", "reports"],
        });

        BiometricDataRequest.findById.mockResolvedValue(failingRequest);
        processFileDeletionJobs.mockResolvedValue({ failed: 1, outstanding: 1 });

        const response = await request(createApp())
            .patch(`/api/admin/privacy-requests/${requestId}`)
            .set("Cookie", cookieFor({ id: adminId, role: ROLES.ADMIN }))
            .send({ decision: "approved", decisionReason: "Pedido válido." });

        expect(response.status).toBe(503);
        expect(failingRequest.status).toBe("failed");
        expect(failingRequest.decisionError).toContain("Falha operacional");
        expect(failingRequest.completedAt).toBeNull();
    });
});
```

Bloco canónico da integração real — acrescenta-o ao `describe` que já arranca e termina o `MongoMemoryReplSet` e usa o helper real `createPrivacyFixture`:

```js
// apps/api/tests/privacy-requests.replset.integration.test.js
it("faz rollback da rejeição quando o audit append-only falha", async () => {
    const privacyRequest = await BiometricDataRequest.create({
        requesterId: new mongoose.Types.ObjectId(),
        scope: "biometric",
        action: "delete",
        resources: ["reports"],
        reason: "Pedido com falha de audit",
    });
    const actor = {
        id: new mongoose.Types.ObjectId().toString(),
        role: "administrador",
    };
    const auditSpy = vi
        .spyOn(BiometricAccessLog, "create")
        .mockRejectedValueOnce(new Error("falha-injetada-audit-rejeicao"));

    try {
        await expect(
            decideBiometricDataRequest(privacyRequest._id.toString(), actor, {
                decision: "rejected",
                decisionReason: "Rejeição exige audit atómico.",
            }),
        ).rejects.toThrow("falha-injetada-audit-rejeicao");
    } finally {
        auditSpy.mockRestore();
    }

    expect(
        await BiometricDataRequest.findById(privacyRequest._id).lean(),
    ).toMatchObject({ status: "pending", attempts: 0, reviewerId: null });
    expect(
        await BiometricAccessLog.countDocuments({
            resourceId: privacyRequest._id.toString(),
            result: "allowed",
        }),
    ).toBe(0);

    const retried = await decideBiometricDataRequest(
        privacyRequest._id.toString(),
        actor,
        {
            decision: "rejected",
            decisionReason: "Rejeição confirmada no retry.",
        },
    );
    expect(retried).toMatchObject({ status: "rejected" });
});

it("não confirma aprovação quando o audit falha e permite retry", async () => {
    const fixture = await createPrivacyFixture("approval-audit-rollback");
    const actor = {
        id: new mongoose.Types.ObjectId().toString(),
        role: "administrador",
    };
    const auditSpy = vi
        .spyOn(BiometricAccessLog, "create")
        .mockRejectedValueOnce(new Error("falha-injetada-audit"));

    try {
        await expect(
            decideBiometricDataRequest(fixture.request._id.toString(), actor, {
                decision: "approved",
                decisionReason: "Pedido confirmado com audit atómico.",
            }),
        ).rejects.toThrow("falha-injetada-audit");
    } finally {
        auditSpy.mockRestore();
    }

    expect(
        await BiometricDataRequest.findById(fixture.request._id).lean(),
    ).toMatchObject({ status: "failed", attempts: 1, completedAt: null });
    expect(
        await BiometricAccessLog.countDocuments({
            resourceId: fixture.request._id.toString(),
            result: "allowed",
        }),
    ).toBe(0);

    const retried = await retryBiometricDataRequest(
        fixture.request._id.toString(),
        actor,
        { decisionReason: "Retry depois da indisponibilidade do audit." },
    );
    expect(retried).toMatchObject({ status: "completed", attempts: 2 });
    expect(
        await BiometricAccessLog.countDocuments({
            resourceId: fixture.request._id.toString(),
            result: "allowed",
        }),
    ).toBe(1);
});
```

5. Explicação do código.

Os testes de contrato HTTP confirmam minimização, sessão e roles. A prova de apagamento e atomicidade não pode ficar nesses mocks: `privacy-requests.replset.integration.test.js` cria ficheiros temporários reais, executa `delete` e `anonymize`, confirma `ENOENT`, zero relatórios pessoais, rollback transacional e retry idempotente. As duas failure injections provam que o audit `allowed` não é best-effort: rejeição + audit e finalização de aprovação/retry + audit são commits únicos. `completed` só é esperado depois da verificação física e do evento append-only na mesma sessão.

6. Validação do passo.

Executa:

```bash
npm --prefix apps/api test -- privacy-requests.replset.integration.test.js account-erasure.replset.integration.test.js
```

Depois executa a suite completa:

```bash
npm --prefix apps/api test
```

7. Cenário negativo/erro esperado.

Se removeres `requireAuth`, o negativo sem sessão deixa de devolver `401`. Se removeres o filtro por `requesterId`, o teste de ownership falha. Se substituíres o teste replica-set por mocks de `unlink`, deixas de provar a ausência física exigida.

### Passo 9 - Implementar a eliminação terminal da própria conta

1. Objetivo funcional do passo no contexto da app.

Permitir que o titular elimine irreversivelmente a conta sem depender de decisão administrativa, exigindo a password atual e a confirmação literal `ELIMINAR`. A operação revoga todas as sessões, remove os documentos pessoais, cria o outbox das fotografias e converte o utilizador num tombstone não autenticável.

2. Ficheiros envolvidos:
    - CRIAR: `apps/api/src/validators/account-erasure.validator.js`
    - CRIAR: `apps/api/src/services/account-erasure.service.js`
    - CRIAR: `apps/api/src/controllers/account-erasure.controller.js`
    - CRIAR: `apps/api/src/routes/me-account.routes.js`
    - EDITAR: `apps/web/src/pages/BiometricDataRequestPage.jsx`
    - EDITAR: `apps/web/src/services/privacyManagement.js`
    - CRIAR: `apps/api/tests/account-erasure.replset.integration.test.js`

3. Instruções do que fazer.

Valida a confirmação sem `trim` implícito e limita a password a 72 bytes UTF-8 antes do bcrypt. Monta o router em `/api/me`, pelo que a rota interna é `DELETE /account` e o contrato público fica `DELETE /api/me/account`. Dentro de uma transação replica-set: compara a password, faz compare-and-set sobre uma conta ainda não eliminada, substitui email/password por valores tombstone, cria jobs para os paths privados, elimina as coleções próprias, anonimiza apenas referências partilhadas justificadas, revoga `AuthSession` e faz commit. O processamento do outbox ocorre depois do commit e pode ficar `pending`, mas a conta já não pode voltar a autenticar-se nem ser reativada.

4. Código integrado das fronteiras públicas.

```js
// apps/api/src/validators/account-erasure.validator.js
import { AppError } from "../middlewares/error.middleware.js";

export const ACCOUNT_ERASURE_CONFIRMATION = "ELIMINAR";

export function validateAccountErasureInput(body) {
    const password = typeof body?.password === "string" ? body.password : "";
    const passwordBytes = Buffer.byteLength(password, "utf8");
    const errors = {};

    if (passwordBytes < 8 || passwordBytes > 72) {
        errors.password = "A password deve ter entre 8 e 72 bytes UTF-8";
    }
    if (body?.confirmation !== ACCOUNT_ERASURE_CONFIRMATION) {
        errors.confirmation = "Escreve ELIMINAR exatamente como apresentado";
    }
    if (Object.keys(errors).length) {
        throw new AppError(400, "Confirmação de eliminação inválida", errors);
    }

    return { password, confirmation: ACCOUNT_ERASURE_CONFIRMATION };
}
```

```js
// apps/api/src/routes/me-account.routes.js
import { Router } from "express";
import { eraseOwnAccountController } from "../controllers/account-erasure.controller.js";
import { requireAuth } from "../middlewares/auth.middleware.js";

export const meAccountRoutes = Router();
meAccountRoutes.delete("/account", requireAuth, eraseOwnAccountController);

// apps/api/src/controllers/account-erasure.controller.js
import { clearSessionCookie } from "../services/session.service.js";
import { eraseOwnAccount } from "../services/account-erasure.service.js";
import { validateAccountErasureInput } from "../validators/account-erasure.validator.js";

export async function eraseOwnAccountController(req, res, next) {
    try {
        const { password } = validateAccountErasureInput(req.body);
        const result = await eraseOwnAccount({ userId: req.user.id, password });
        clearSessionCookie(res);
        res.set("Cache-Control", "no-store");
        const pending = result.fileCleanupStatus === "pending";

        return res.status(pending ? 202 : 200).json({
            account: { status: result.status, deletedAt: result.deletedAt },
            fileCleanup: { status: result.fileCleanupStatus },
            message: pending
                ? "Conta eliminada. A remoção física dos ficheiros privados ficou agendada."
                : "Conta e dados pessoais eliminados.",
        });
    } catch (error) {
        return next(error);
    }
}
```

No service, o núcleo terminal tem de manter estas guardas:

```js
// apps/api/src/services/account-erasure.service.js (núcleo da transação)
await session.withTransaction(async () => {
    const account = await User.findOne({
        _id: userId,
        accountStatus: { $ne: "deleted" },
    }).select("+passwordHash").session(session);

    if (!account) throw new AppError(409, "A conta já não pode ser eliminada");
    if (!(await bcrypt.compare(password, account.passwordHash))) {
        throw new AppError(403, "Password atual incorreta");
    }

    const tombstone = await User.findOneAndUpdate(
        { _id: userId, accountStatus: { $ne: "deleted" } },
        { $set: {
            email: `deleted-${randomUUID()}@deleted.invalid`,
            passwordHash: buildErasedPasswordValue(),
            isActive: false,
            accountStatus: "deleted",
            deletedAt: now,
        } },
        { new: true, runValidators: true, session },
    );
    if (!tombstone) throw new AppError(409, "A conta já não pode ser eliminada");

    await enqueueOwnedPhotoDeletionJobs(userId, session);
    await deleteOwnedDocuments(userId, session);
    await eraseOrders(userId, now, session);
    await anonymizeSharedReferences(userId, now, session);
    await AuthSession.updateMany(
        { userId, revokedAt: null },
        { $set: { revokedAt: now, csrfHash: null } },
        { session },
    );
});
```

O helper `deleteOwnedDocuments` deve enumerar explicitamente todas as coleções ligadas ao titular; não uses descoberta por nome ou uma lista parcial. A allowlist canónica é:

```js
const OWNED_USER_MODELS = Object.freeze([
    AiConsultationReview,
    AiJob,
    AiConsultationSession,
    AiInteractionHistory,
    BeforeAfterVisualization,
    Cart,
    DailyRoutine,
    FaceAnalysis,
    FaceConsent,
    FacePhoto,
    FaceReport,
    MakeupSimulation,
    MakeupSimulationQuota,
    Notification,
    Preference,
    ProductRecommendation,
    Profile,
    ReportUnlock,
    Review,
    RoutineAlertPreference,
    SkinComparison,
    Voucher,
]);
```

Além dos documentos com `userId`, elimina `BiometricDataRequest` por `requesterId`, `RecommendationReview` e `ReportPhotoGrant` por `clientUserId`, e os `AiConsultationAuditLog` ligados às `AiConsultationReview` do titular. Antes de eliminar `FacePhoto` e `MakeupSimulation`, copia `storageKey`/`outputStorageKey` para `FileDeletionJob`; depois do commit, o worker remove os bytes e terminaliza o job sem conservar owner/path. `AuthSession` é revogada e perde `csrfHash`. Referências partilhadas de ator/revisor são anonimizadas, não usadas para conservar ownership.

Encomendas com pagamento simulado confirmado podem manter prova académica/logística apenas depois de remover `userId`, voucher, checkout key e hashes de idempotência; encomendas sem pagamento simulado confirmado são eliminadas. Contas `deleted` são terminais: login e operações administrativas de ativação têm de as recusar.

O teste `apps/api/tests/account-erasure.replset.integration.test.js` deve ter um `OWNED_MODELS` equivalente, inserir um documento marcador em cada coleção e provar `countDocuments(...) === 0`. Deve ainda provar ausência física (`ENOENT`) da fotografia e preview, grants/reviews/audit logs removidos, sessões revogadas, encomenda paga anonimizada, encomenda não paga eliminada e rollback total quando uma referência cifrada estiver adulterada.

Na UI, integra uma zona de perigo na página de privacidade; não uses um botão de um clique:

```jsx
// apps/web/src/pages/BiometricDataRequestPage.jsx
<section className="danger-zone" aria-labelledby="erase-account-title">
    <h2 id="erase-account-title">Eliminar a conta definitivamente</h2>
    <p role="alert">
        Esta ação é irreversível, revoga todas as sessões e não permite reativação.
    </p>
    <form onSubmit={eraseAccount}>
        <label>
            Password atual
            <input name="password" type="password" autoComplete="current-password" required />
        </label>
        <label>
            Escreve ELIMINAR para confirmar
            <input name="confirmation" type="text" autoComplete="off" required />
        </label>
        <button type="submit" disabled={!validateAccountErasureForm(erasureForm).isValid}>
            Eliminar a minha conta
        </button>
    </form>
</section>
```

Depois de `200` ou `202`, chama `forgetSession()` e navega para `/login` com uma mensagem segura. Nunca guardes a password, a confirmação ou o resultado em `localStorage`/`sessionStorage`.

5. Explicação do código.

O compare-and-set impede duas eliminações concorrentes. A transação garante que um erro antes do commit não deixa metade dos documentos apagados nem sessões ainda válidas. O outbox resolve a fronteira MongoDB/filesystem: os paths são preservados apenas no job cifrado/privado antes de apagar os metadados; uma falha posterior não reativa a conta.

6. Como validar este passo.

Executa `npm --prefix apps/api test -- account-erasure.validator.test.js account-erasure.replset.integration.test.js`. A integração deve usar `MongoMemoryReplSet` loopback e provar: `400` sem `ELIMINAR`, `403` com password errada, CSRF/sessão, rollback injetado, duas eliminações concorrentes com um único vencedor, revogação de todas as sessões, ausência em todas as coleções próprias, encomenda simulada anonimizada, ficheiro fisicamente ausente e login/reativação recusados depois do tombstone.

7. Cenário negativo/erro esperado.

Uma conta já `deleted` devolve conflito e nunca volta a `active`. Se a eliminação física pós-commit falhar, a resposta pode ser `202` com `fileCleanup.status="pending"`; isto não é falha da eliminação terminal e o job deve continuar repetível sem voltar a pedir a password.

### Passo 10 - Provar o registry append-only `001–015`

1. Objetivo funcional do passo no contexto da app.

Garantir que a eliminação terminal e os novos recursos OpenAI v2 são instalados sobre uma sequência de migrations completa, sem reescrever história nem perder proteção de privacidade.

2. Ficheiros envolvidos:
   - REVER: `apps/api/src/migrations/index.js`
   - REVER: `apps/api/src/migrations/001_payment_simulation_contract.js` até `apps/api/src/migrations/015_photo_quality_and_openai_simulation.js`
   - REVER: `apps/api/tests/migrations.replset.integration.test.js`
   - REVER: `apps/api/tests/account-erasure.replset.integration.test.js`

3. Instruções do que fazer.

Mantém exatamente este registry, por ordem, sem alterar os checksums já publicados:

| Versão | Migration |
| ---: | --- |
| 001 | `001_payment_simulation_contract` |
| 002 | `002_order_idempotency_and_legacy_states` |
| 003 | `003_auth_sessions` |
| 004 | `004_privacy_requests_and_erasure` |
| 005 | `005_sensitive_encryption_v2` |
| 006 | `006_ai_machine_human_split` |
| 007 | `007_retention_and_audit_indexes` |
| 008 | `008_sensitive_derivatives_encryption` |
| 009 | `009_privacy_barriers_and_face_file_encryption` |
| 010 | `010_openai_only_and_consent_v2` |
| 011 | `011_goal_consultation_and_ai_jobs` |
| 012 | `012_product_ai_metadata_and_variants` |
| 013 | `013_report_v2_and_recommendation_snapshots` |
| 014 | `014_report_review_and_unlock_snapshot` |
| 015 | `015_photo_quality_and_openai_simulation` |

4. Código completo, correto e integrado com a app final.

```js
it("mantém o registry completo e append-only de 001 a 015", () => {
    expect(MIGRATIONS.map(({ version }) => version)).toEqual([
        "001_payment_simulation_contract",
        "002_order_idempotency_and_legacy_states",
        "003_auth_sessions",
        "004_privacy_requests_and_erasure",
        "005_sensitive_encryption_v2",
        "006_ai_machine_human_split",
        "007_retention_and_audit_indexes",
        "008_sensitive_derivatives_encryption",
        "009_privacy_barriers_and_face_file_encryption",
        "010_openai_only_and_consent_v2",
        "011_goal_consultation_and_ai_jobs",
        "012_product_ai_metadata_and_variants",
        "013_report_v2_and_recommendation_snapshots",
        "014_report_review_and_unlock_snapshot",
        "015_photo_quality_and_openai_simulation",
    ]);
    expect(new Set(MIGRATIONS.map(({ version }) => version)).size).toBe(15);
    expect(MIGRATIONS.every(({ sourcePath }) => sourcePath.endsWith(".js"))).toBe(true);
});
```

5. Explicação do código.

A ordem garante que sessões, privacidade/cifra e barreiras faciais existem antes dos modelos OpenAI v2. O teste não substitui `dry-run`, `up`, replay e pós-condições; apenas impede omissões, duplicações e reordenação acidental.

6. Validação do passo.

Executa `npm --prefix apps/api test -- migrations.replset.integration.test.js account-erasure.replset.integration.test.js`. Confirma também que as invariantes de catálogo preservam IDs, contagem e stock agregado durante `010–015`.

7. Cenário negativo/erro esperado.

Uma versão em falta, duplicada, fora de ordem ou com checksum diferente deve falhar. Nunca marques essa falha como `PASS` nem edites `001–009` para a contornar.

#### Erros comuns

- Aceitar `requesterId`, `reviewerId` ou role pelo body. Esses valores vêm sempre da sessão e das permissões do backend.
- Marcar `completed` logo após a decisão. A remoção física corre num job idempotente e o estado final só é permitido depois de verificar ausência dos bytes.
- Listar fotografias, relatórios completos ou paths internos no painel de revisão. O painel deve mostrar apenas metadados.
- Aprovar o pedido sem auditoria. Em dados biométricos, listagem e decisão precisam de rasto técnico mínimo.
- Aceitar MongoDB standalone ou continuar sem transação. A API deve falhar antes das mutações; apenas falhas pós-commit do outbox ficam `failed` para retry.
- Testar só o caminho feliz. Sem sessão, role errada, recurso inválido, pedido já decidido e falha operacional são negativos obrigatórios neste BK.

#### Expected results

- Cliente cria pedido com `201`.
- Pedido inválido devolve `400`.
- Pedido sem sessão devolve `401`.
- Role errada devolve `403`.
- Pedido inexistente devolve `404`.
- Pedido já decidido devolve `409`.
- Administrador lista pedidos com `200` e sem dados biométricos brutos.
- Administrador aprova, rejeita ou repete pedido com `200`/estado controlado.
- Cliente e consultor recebem `403` em listagem, decisão e retry administrativos.
- Rejeição confirma estado + audit `allowed` na mesma transação; falha do audit deixa o pedido `pending`.
- Aprovação `delete` remove bytes de fotografias e elimina relatórios abrangidos antes de concluir.
- Aprovação `anonymize` remove sempre bytes de fotografias; no modelo atual elimina também o relatório, pois não existe um agregado cuja não identificação esteja provada.
- Falha operacional deixa pedido/job em `failed`; `POST /api/admin/privacy-requests/:requestId/retry` repete a limpeza de forma idempotente.
- Aprovação e retry só gravam `completed` se o audit `allowed` fizer commit na mesma sessão; failure injection impede falso sucesso.
- `DELETE /api/me/account` exige password + `ELIMINAR`, revoga todas as sessões e deixa a conta terminalmente `deleted`.
- Eliminação terminal remove `AiConsultationSession`, `AiJob`, `ReportPhotoGrant`, `MakeupSimulation`, `MakeupSimulationQuota`, `ReportUnlock`, `ProductRecommendation`, revisões/audit logs associados e todos os restantes documentos próprios enumerados.
- Fotografias e outputs derivados ficam fisicamente ausentes; jobs terminalizados não conservam owner/path.
- Registry `001–015` permanece completo, ordenado, sem checksums históricos alterados.
- Respostas públicas não expõem fotografia, relatório completo, storage key, cookie, token, password hash ou paths internos.

#### Critérios de aceite

- Não há `requesterId` enviado pela UI.
- Todas as mutações usam filtro por dono.
- Pedidos têm estado explícito.
- Rejeição exige justificação mínima.
- Listagem e decisão registam auditoria biométrica.
- `recordBiometricAccess(..., { session })` é obrigatório no commit de rejeição e na finalização comum a aprovação/retry.
- Cliente não aprova o próprio pedido.
- Administrador não cria pedido em nome do cliente pela rota `/me`; consultor não acede às rotas administrativas de privacidade.
- Ficheiros abrangidos estão fisicamente ausentes antes de `completed`.
- Retry de job falhado não duplica efeitos nem reabre recursos já eliminados.
- Eliminação de conta exige confirmação forte, revoga sessões e não permite reativação posterior.
- Eliminação de conta cobre explicitamente os recursos OpenAI v2 e prova ausência em cada coleção própria.
- Registry de migrations contém exatamente `001–015`, por ordem append-only, com dry-run/replay/pós-condições.
- `reason`/`decisionReason` persistem apenas como envelope contextual v2 por `requesterId`; owner ausente/divergente falha fechado.
- Aprovação/revogação/eliminação e writers são linearizados pela escrita comum em `User`; o destrutivo captura o writer vencedor ou `claimFaceDataWrite` recusa o writer após tombstone.
- Cenários negativos concluídos: mínimo `3`.

#### Validação final

### Matriz mínima de testes por prioridade

| Prioridade | Mínimo | Cenários cobertos neste BK |
| --- | ---: | --- |
| P0 | 3 negativos | sem sessão, role errada, recurso inválido, pedido já decidido, falha operacional |

Evidência de testes por camada:

- Backend/API: `npm --prefix apps/api test -- privacy-requests.replset.integration.test.js account-erasure.replset.integration.test.js migration-009-privacy-face-files.replset.integration.test.js migrations.replset.integration.test.js`
- Backend/API completo: `npm --prefix apps/api test`
- Frontend build: `npm --prefix apps/web run build`
- Pesquisa de contratos: `rg -n "privacy-requests|/me/account|FileDeletionJob|completed|retry" apps/api/src apps/web/src`
- Pesquisa de sessão: `rg -n "credentials: \"include\"|requireAuth|requireRole" apps/api/src apps/web/src`
- Pesquisa de leakage: `rg -n "storageKey|passwordHash|localStorage|sessionStorage" apps/api/src apps/web/src`
- [ ] Negativos: mínimo `3` cenários validados e registados em evidence.

#### Evidence para PR/defesa

- Output dos testes focados `privacy-requests.replset.integration.test.js` e `account-erasure.replset.integration.test.js`.
- Pedido cliente criado com id e estado `pending`.
- Listagem administrativa com dados minimizados e negativos `403` para cliente/consultor.
- Aprovação cuja evidence confirma ausência física antes de `completed`.
- Retry idempotente de uma falha injetada no job de remoção.
- Eliminação da própria conta com sessão revogada e estado `deleted` terminal.
- Rejeição que guarda `decisionReason` e não altera fotografias nem relatórios.
- Dump raw sem motivos em claro, corrida geracional bloqueada e replay idempotente do registry `001–015`.
- Contagem zero para cada modelo de `OWNED_USER_MODELS`, `ReportPhotoGrant`, pedido/review e audit log da consulta; `ENOENT` para fotografia e output de maquilhagem.
- Negativos: sem sessão, role errada, recurso inválido, pedido já decidido e falha operacional.
- Nota técnica: ownership vem de `req.user.id`; o frontend nunca envia `requesterId`.

#### Handoff

O `BK-MF7-03` deve garantir que estes endpoints continuam dependentes de cookies HttpOnly e que o frontend usa `credentials: "include"` em todos os pedidos autenticados. O `BK-MF8-01` deve preservar a documentação modular destes controllers/services, e o `BK-MF8-07` deve respeitar o estado de consentimento/privacidade antes de qualquer uso externo de imagens.

#### Changelog

- 2026-07-11: decisões destrutivas restringidas a `ROLES.ADMIN`; eliminação terminal expandida e documentada para todos os recursos OpenAI v2; registry/testes atualizados de `001–009` para `001–015`.
- 2026-07-10: rejeição, aprovação e retry alinhados com audit append-only transacional; o listing mockado foi rebaixado a contrato HTTP e foram adicionadas failure injections reais em `MongoMemoryReplSet`.
- 2026-07-10 (histórico, superseded pelo registry `001–015` de 2026-07-11): nessa data o estado estava reconciliado até `001–009`, com motivos contextuais por `requesterId`, owner exato no CAS e validação focal 14/14.
- 2026-07-10: Guia reconciliado com endpoints `privacy-requests`, retry idempotente, ausência física obrigatória e `DELETE /api/me/account` com estado terminal.
- 2026-07-10: Removido o fallback standalone; replica set/transação são obrigatórios e o outbox é a única recuperação pós-commit.
- 2026-06-26: Guia histórico corrigido por camada, incluindo o fallback operacional entretanto substituído pelo contrato fail-closed.

## Suplemento de validacao documental
Este suplemento fecha lacunas formais detetadas pelo validador de planificacao sem alterar o contrato funcional original do guia.

## Bloco pedagogico
### Objetivo
O aluno deve completar `Direito a pedidos canónicos de privacidade e eliminação terminal da própria conta; decisões destrutivas só por administrador.` com rastreabilidade direta a `RNF13`, mantendo evidence objetiva, negativos por prioridade e handoff claro.

### Pre-requisitos
- Rever `RNF13` nos documentos RF/RNF aplicáveis.
- Confirmar dependencias declaradas: `-`.
- Consultar `MATRIZ-CANONICA-BK.md`, `BACKLOG-MVP.md` e o guia atual antes de implementar.

### Erros comuns
- Fechar o BK sem negativos minimos por prioridade.
- Alterar comportamento sem alinhar matriz, backlog, anexos e guia.
- Registar evidence sem output, screenshot, request/response ou teste verificavel.

### Check de compreensao
- [ ] Sei explicar o objetivo do BK e o requisito associado.
- [ ] Sei quais sao entradas, saidas, dependencias e criterio de sucesso.
- [ ] Sei executar o smoke principal e os negativos obrigatorios.

## Bloco operacional
### Entrada
- BK: `BK-MF7-02`
- Requisito: `RNF13`
- Dependencias: `-`
- Sprint: `S11-S12`

### Passos
1. Confirmar no backlog e na matriz o contexto do `BK-MF7-02` e do requisito `RNF13`.
2. Validar pre-condicoes e dependencias declaradas (`-`).
3. Rever ficheiros reais ligados ao BK e identificar o fluxo principal.
4. Consolidar contrato de entrada/saida com validacao, ownership e erros controlados.
5. Executar smoke test do caminho principal e validar integracao com BKs adjacentes.
6. Registar evidencia tecnica objetiva antes do handoff.
7. Executar cenarios negativos obrigatorios (minimo 3) e registar o resultado.
8. Reexecutar validacao afetada e guardar evidence final para defesa/PR.

### Validacao
- [ ] Smoke: fluxo principal executa sem erro bloqueante.
- [ ] Negativos: minimo `3` cenarios com resultado controlado.
- [ ] Tecnico: metadados alinhados entre guia, backlog, matriz e anexos.
- [ ] Evidence: `pr`, `proof`, `neg` preenchidos com artefactos verificaveis.

### Matriz minima de testes por prioridade
- `P0`: unit + integration + e2e + 3 negativos.
- `P1`: unit/integration + 2 negativos.
- `P2`: teste focal + 1 negativo.

### Handoff
- Proximo BK recomendado: `BK-MF7-03`
- Registar riscos, dependencias pendentes e validacoes executadas antes do fecho.

## Criterios de aceite
- Entrega funcional específica de `Direito a pedidos canónicos de privacidade e eliminação terminal da própria conta; decisões destrutivas só por administrador.` validada contra `RNF13`.
- Cenarios negativos concluidos: minimo `3` com resultado controlado.
- Evidencia de testes por camada conforme prioridade (`P0`).
- Metadados do guia alinhados com matriz, backlog e anexos.

## Evidence para PR/defesa
- `proof_tecnico`: output, log, screenshot ou request/response do fluxo principal.
- `proof_negativos`: cenarios negativos executados e resultados observados.
- `proof_handoff`: estado final, riscos e proximo BK.

## Snippet tecnico aplicavel
```js
const BK_ID = 'BK-MF7-02';
const MIN_NEGATIVOS = 3;

export function validarEvidenceDocumental(evidence) {
  const negativos = Array.isArray(evidence?.negativos) ? evidence.negativos.length : 0;

  if (evidence?.bkId !== BK_ID) {
    throw new Error('Evidence fora do contrato do BK');
  }

  if (negativos < 3) {
    throw new Error('Cenarios negativos abaixo do minimo exigido');
  }

  return { bkId: BK_ID, estado: 'validado' };
}
```

## Changelog
- `2026-06-30`: suplemento documental adicionado para cumprir validador de planificacao.
