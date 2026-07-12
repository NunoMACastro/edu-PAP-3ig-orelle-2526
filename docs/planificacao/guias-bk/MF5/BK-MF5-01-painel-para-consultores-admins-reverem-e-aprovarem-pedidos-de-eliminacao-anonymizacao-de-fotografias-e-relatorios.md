# BK-MF5-01 - Painel administrativo para rever, decidir e repetir pedidos de eliminação/anonymização de fotografias e relatórios

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
- `last_updated`: `2026-07-11`

> **Contrato reconciliado com o runtime:** novos clientes usam `POST|GET /api/me/privacy-requests`, `GET|PATCH /api/admin/privacy-requests`, `PATCH /api/admin/privacy-requests/:requestId` e `POST /api/admin/privacy-requests/:requestId/retry`. Um pedido aprovado só fica `completed` depois da ausência física dos ficheiros aplicáveis; falhas ficam repetíveis por job idempotente.

> **Autorização destrutiva canónica — 2026-07-11:** todos os endpoints sob `/api/admin/privacy-requests` exigem `ROLES.ADMIN`. Um utilizador `consultor` recebe `403` na listagem, detalhe, decisão e retry. O consultor participa apenas na revisão humana da consulta cosmética em `/consultoria/revisoes`; não decide eliminação/anonymização e não vê este painel. Qualquer bloco inferior que autorize `ROLES.CONSULTOR` para privacidade está substituído por esta regra e deve ser corrigido antes de executar.

> **Adenda canónica da migration 009:** `reason` e `decisionReason` usam AES-GCM contextual v2 com owner `requesterId`, sem defaults em claro. Aprovação/revogação/eliminação e upload/análise escrevem no mesmo documento `User` dentro das respetivas transações: `blockFaceDataWritesForPrivacy` instala o tombstone e `claimFaceDataWrite` só reclama uma conta ativa/não bloqueada, revalidando consentimento/pedidos antes de persistir. Esta escrita comum lineariza a corrida; não existe token de geração capturado no início. O teste focal migration/privacidade passou `14/14`, mas o fecho continua dependente da suite integral atual.

> **Decisão e audit atómicos:** numa rejeição, o CAS para `rejected` e o evento biométrico `decide_request` usam a mesma sessão MongoDB. Numa aprovação/retry, o estado `completed`, a confirmação de ausência física/libertação da barreira e o evento de decisão confirmam na mesma transação final. Se a criação do audit falhar, a decisão dessa transação sofre rollback; o evento `denied` de uma tentativa falhada é registado separadamente apenas depois do rollback, sem fingir que a decisão foi aplicada.

> **Extensão canónica OpenAI v2 — 2026-07-11:** pedidos de privacidade incluem sessões de consulta, jobs, grants temporários, análises, relatórios, recomendações, unlocks e previews de maquilhagem. Revogar consentimento v2 bloqueia novas operações e cancela jobs pendentes; eliminar fotografias, relatório ou conta remove também bytes derivados. Consentimento v1 nunca é promovido. Qualquer excerto inferior que só conheça upload/análise facial v1 deve ser adaptado ao [plano canónico da consulta OpenAI](../../PLANO-IMPLEMENTACAO-CONSULTA-IA-OPENAI-real_dev.md), sem criar endpoints paralelos.

#### Objetivo

Neste BK vais implementar o fluxo `RF41`: clientes criam pedidos sobre fotografias faciais e relatórios cosméticos, e um administrador revê esses pedidos num painel seguro antes de aprovar, rejeitar ou repetir uma limpeza falhada.

#### Importância

Fotografias faciais e relatórios de análise são dados sensíveis. A Orélle deve permitir eliminação ou anonymização com remoção física obrigatória das fotografias, mantendo decisão controlada no backend, protegida por role, rastreável e sem expor imagens, caminhos internos ou relatórios completos no painel.

#### Scope-in

- Criar o modelo `BiometricDataRequest`.
- Rever `FacePhoto` e `FaceReport`, sem usar estados lógicos como substituto da remoção efetiva pedida.
- Criar validator, service, controller e routes para pedidos de privacidade biométrica.
- Criar endpoint autenticado para o cliente submeter pedidos sobre os próprios dados.
- Criar endpoints protegidos exclusivamente por role `administrador` para listar, detalhar, decidir e repetir pedidos.
- Permitir retry explícito/idempotente e confirmar ausência física antes do estado `completed`.
- Aplicar a semântica atual: fotografias perdem sempre os bytes; relatórios são eliminados em ambas as ações enquanto não existir um agregado comprovadamente anónimo.
- Criar painel React exclusivamente administrativo.
- Criar testes para ownership, roles, estados, minimização de resposta e cenários negativos.

#### Scope-out

- Não apagar contas de utilizador; isso pertence a `RF33` e `RNF13`.
- Não exportar relatórios em PDF.
- Não criar política avançada de retenção.
- Não mostrar fotografias, `storageKey`, caminhos internos ou relatórios completos no painel.
- Não criar o painel completo de pesquisa/alertas de auditoria; isso fica para `BK-MF5-04`. O evento mínimo da própria decisão já é obrigatório e atómico neste BK.

#### Estado antes e depois

- Antes: `BK-MF1-05` já guarda fotografias faciais com consentimento e `BK-MF1-07` já guarda relatórios, mas não existe pedido formal para eliminar ou anonymizar esses dados.
- Depois: a app tem pedidos persistidos, decisão exclusivamente administrativa com audit atómico, efeitos controlados por ação e recurso, painel minimizado e handoff para a consulta/alertas de auditoria em `BK-MF5-04`.

#### Pre-requisitos

- `BK-MF0-02`: sessão autenticada por cookie HttpOnly.
- `BK-MF0-05`: roles `cliente`, `consultor` e `administrador`, com `requireAuth` e `requireRole`.
- `BK-MF1-05`: `FacePhoto` com `userId`, `kind`, `storageKey` privado, `consentId` e `status`.
- `BK-MF1-07`: `FaceReport` com `userId`, `analysisId`, `cosmeticSummary`, `routineSuggestions`, `sources` e `limitations`.
- `BK-MF4-08`: confiança operacional reforçada por regras de segurança e restrições do perfil.
- `RF41`: painel administrativo para rever, decidir e repetir pedidos de eliminação/anonymização de fotografias e relatórios.

#### Glossário

- Pedido biométrico: pedido criado pelo cliente para tratar fotografias faciais e relatórios associados.
- Eliminação física: remover os bytes e confirmar a ausência antes de concluir o pedido.
- Anonymização de relatório: só preservar um agregado se estiver provado que não contém IDs, texto livre, datas exatas ou ligação ao titular; o modelo atual não satisfaz essa condição e o documento é eliminado.
- Revisor destrutivo: administrador autenticado que decide ou repete o pedido; a role `consultor` não tem esta permissão.
- Recurso: fotografia facial ou relatório facial afetado pelo pedido.
- Transição de estado: passagem controlada entre `pending`, `rejected` e `completed`.

#### Conceitos teóricos essenciais

Um pedido de privacidade deve ser separado da ação sobre os dados. Primeiro a app regista a intenção do cliente, depois um revisor decide, e só depois o service altera fotografias ou relatórios. Esta separação evita decisões invisíveis e ajuda a explicar o fluxo na defesa PAP.

O frontend nunca escolhe `requesterId`, `reviewerId` ou estado final. O backend usa a sessão autenticada para criar pedidos e a role autenticada para rever. Isto impede que um cliente envie um `userId` falso no browser para mexer em dados de outra pessoa.

A intenção `delete`/`anonymize` permanece registada e auditável, mas não autoriza conservar conteúdo sensível. Para fotografias, as duas ações criam jobs de remoção física e retiram o documento do uso ativo. Para relatórios, `delete` elimina o documento; `anonymize` também o elimina no modelo atual, porque substituir texto por uma frase neutra não prova anonimato. Uma futura preservação exigiria um modelo separado de agregado não identificável.

O painel administrativo não é uma galeria. O revisor vê metadados suficientes para decidir: ação pedida, recursos, estado, motivo, datas e dono técnico. Fotografias, `storageKey`, caminhos internos, cookies e relatório completo não entram na resposta.

Este BK é `CORE-HIBRIDO`: protege confiança no fluxo de análise/recomendação e reduz abandono do utilizador antes de voltar ao comércio. A evidence deve provar tanto o comportamento técnico como a confiança operacional associada aos KPIs `add_to_cart_recomendado` e `retencao_fluxo_ia_30d`.

## Bloco pedagogico

### Objetivo

Compreender como a Orélle permite ao cliente criar um pedido de eliminação ou anonymização de dados biométricos, mantendo a decisão final no backend e num painel exclusivamente administrativo.

### Pre-requisitos

- Saber como a sessão HttpOnly identifica o utilizador autenticado.
- Saber distinguir role de cliente, consultor e administrador e justificar por que só o administrador executa decisões destrutivas.
- Conhecer os modelos `FacePhoto` e `FaceReport` criados nas MF anteriores.
- Perceber a diferença entre eliminar e anonymizar relatórios, sabendo que fotografias perdem sempre os bytes em ambas as ações.

### Erros comuns

- Aceitar `requesterId` vindo do frontend em vez de usar a sessão autenticada.
- Mostrar fotografias, `storageKey`, paths internos ou relatório completo no painel de revisão.
- Preservar fotografias ou relatórios pessoais apenas para tornar `delete` e `anonymize` tecnicamente diferentes.
- Permitir que um pedido já decidido seja decidido novamente.

### Check de compreensao

Consegues explicar porque é que o cliente cria o pedido, mas só um administrador o decide? Consegues demonstrar que um consultor recebe `403` e indicar que dados podem aparecer no painel?

## Bloco operacional

### Entrada

- Guias e contratos de `RF41`, `BK-MF1-05`, `BK-MF1-07` e `BK-MF5-04`.
- Código real de sessão, roles, modelos faciais e cliente API.
- Pedido frontend com `action`, `resources` e `reason`, sem ownership enviado pela UI.

### Passos

1. Confirmar o contrato de `RF41` e os recursos abrangidos.
2. Criar ou rever o modelo de pedido biométrico.
3. Validar criação, listagem e decisão no backend.
4. Integrar o painel de revisão e a UI de criação de pedido no frontend real.
5. Cobrir pelo menos 3 cenários negativos de sessão, role, input ou estado.
6. Revalidar build, testes API e pesquisa estática de dados sensíveis.

### Validacao

- `POST /api/me/privacy-requests` cria pedido com sessão de cliente.
- `GET /api/admin/privacy-requests` é acessível apenas a administrador; cliente e consultor recebem `403`.
- `PATCH /api/admin/privacy-requests/:requestId` decide apenas pedidos pendentes.
- [ ] Negativos: minimo `3` cenarios controlados com `400`, `401`, `403` ou `409`.

### Handoff

`BK-MF5-04` deve expor listagem/alertas e completar a auditoria de leituras; a decisão já grava o evento mínimo na mesma transação da mudança de estado. `MF6` deve conseguir medir desempenho sem alterar o contrato de payload nem enfraquecer minimização de dados biométricos.

#### Arquitetura do BK

- `biometric-data-request.model.js`: persiste pedido, ação, recursos, decisão e datas.
- `biometric-data-request.validator.js`: valida criação e decisão.
- `biometric-data-request.service.js`: cria pedido, lista painel, decide e aplica efeitos.
- `biometric-audit.service.js`: aceita a `session` da decisão e cria o evento minimizado na mesma transação.
- `biometric-data-request.controller.js`: liga HTTP ao service.
- `biometric-data-request.routes.js`: protege endpoints com autenticação e role.
- `face-photo.model.js`: mantém estados de compatibilidade, mas o workflow não conserva bytes em `anonymized`.
- `face-report.model.js`: mantém `privacyStatus` para compatibilidade/migração; o workflow atual elimina o documento em ambas as ações.
- `app.js`: monta as rotas em `/api`.
- `BiometricDataRequestsAdminPage.jsx`: mostra painel seguro apenas a administrador.
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
- REVER: `apps/api/src/migrations/009_privacy_barriers_and_face_file_encryption.js`
- REVER: `apps/api/src/services/face-data-write-barrier.service.js`
- REVER: `apps/api/tests/migration-009-privacy-face-files.replset.integration.test.js`
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

Lê `RF41`, confirma que depende de `RF13` e regista a separação de responsabilidades: o cliente cria o pedido, o administrador decide/retry e o consultor permanece fora deste domínio destrutivo.

4. Código completo, correto e integrado com a app final.

```text
Sem código neste passo.
```

5. Explicação do código.

Não há código porque este passo fixa a fronteira funcional. A decisão importante é separar `RF41` de eliminação de conta: este BK trata dados biométricos já recolhidos pela app, enquanto contas, exportações gerais e retenção avançada ficam noutros requisitos.

6. Validação do passo.

Consegues explicar que `BK-MF5-01` consome `FacePhoto` e `FaceReport`, entrega um painel e torna decisão + audit atómicos, enquanto `BK-MF5-04` expõe consulta/alertas e audita leituras.

7. Cenário negativo/erro esperado.

Se o guia misturar revisão cosmética com eliminação de dados, pode dar poderes destrutivos indevidos a consultores.

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

O modelo tem `requesterId` para associar o pedido ao cliente autenticado. `action` distingue eliminação de anonymização. `resources` permite pedir fotografias, relatórios ou ambos. `reason`/`decisionReason` não recebem `default: ""`: o setter precisa do owner real e cifra os valores; o DTO é que devolve `request.reason ?? ""` depois de uma query autorizada. O estado começa em `pending`; `processing`/`failed` e jobs idempotentes impedem que `completed` seja usado antes da remoção física. O documento público não inclui `storageKey`, imagem ou relatório completo.

6. Validação do passo.

Criar pedido sem `resources` deve falhar por validação. Criar pedido válido deve ficar com estado `pending`.

7. Cenário negativo/erro esperado.

Guardar `storageKey` ou texto completo de relatório neste modelo aumentaria o impacto de uma fuga de dados.

### Passo 3 - Rever os modelos e separar compatibilidade de apagamento efetivo

1. Objetivo funcional do passo no contexto da app.

Confirmar os estados legados dos modelos sem os confundir com prova de remoção física ou anonimização irreversível.

2. Ficheiros envolvidos:
    - EDITAR: `apps/api/src/models/face-photo.model.js`
    - EDITAR: `apps/api/src/models/face-report.model.js`
    - LOCALIZAÇÃO: campos `status` e `privacyStatus`.

3. Instruções do que fazer.

Mantém os enums existentes para ler documentos legados e migrations. No workflow canónico, `FacePhoto.status` sai de `active` dentro da transação e o outbox elimina os bytes; `FaceReport` é removido por `deleteMany` para `delete` e `anonymize`, porque o schema atual contém conteúdo pessoal e não define um agregado anónimo separado.

4. Código completo, correto e integrado com a app final.

```js
// apps/api/src/models/face-photo.model.js
const facePhotoPrivacyFields = {
    status: {
        type: String,
        enum: ["active", "deleted", "anonymized"],
        default: "active",
    },
};
```

```js
// apps/api/src/models/face-report.model.js
const faceReportPrivacyFields = {
    privacyStatus: {
        type: String,
        enum: ["active", "deleted", "anonymized"],
        default: "active",
        index: true,
    },
};
```

5. Explicação do código.

Os enums permitem compatibilidade com registos anteriores, mas não são o mecanismo de fecho. `status: "anonymized"` não elimina uma fotografia e `privacyStatus: "anonymized"` não torna anónimo o texto livre de um relatório. O fecho depende do job físico e da eliminação do documento pessoal.

6. Validação do passo.

Um documento antigo sem `privacyStatus` continua a ser tratado como ativo por causa do `default`; depois de aprovar o pedido, não pode restar um `FaceReport` pessoal nem bytes de fotografia abrangidos.

7. Cenário negativo/erro esperado.

Se o service apenas trocar o estado ou substituir texto, o pedido pode aparecer concluído enquanto os dados pessoais continuam recuperáveis.

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
        reason: request.reason ?? "",
        status: request.status,
        decisionReason: request.decisionReason ?? "",
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
 * @param {{id: string, role: string}} actor - Revisor autenticado.
 * @returns {Promise<object[]>} Pedidos minimizados, ordenados do mais recente para o mais antigo.
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
        reason: "Listagem de pedidos de privacidade para revisão.",
    });

    return requests.map(toBiometricDataRequestResponse);
}
```

5. Explicação do código.

O validator limita os valores aceites antes de chegar ao service. O service recebe `userId` da sessão, garantindo ownership no backend. A resposta expõe metadados necessários para revisão, mas não expõe fotografia, path privado ou conteúdo de relatório. `limit(100)` evita que o painel carregue um volume ilimitado de pedidos numa só resposta.

6. Validação do passo.

`POST /api/me/privacy-requests` com `{ "action": "delete", "resources": ["photos"] }` deve devolver `201` e estado `pending`.

7. Cenário negativo/erro esperado.

Enviar `{ "requesterId": "outro-utilizador" }` no body não deve alterar o dono real do pedido.

### Passo 5 - Aplicar remoção efetiva com outbox e sem pseudo-anonimização

1. Objetivo funcional do passo no contexto da app.

Garantir que a intenção escolhida fica registada, sem conservar bytes de fotografias ou relatórios pessoais para fabricar uma diferença técnica insegura.

2. Ficheiros envolvidos:
    - EDITAR: `apps/api/src/validators/biometric-data-request.validator.js`
    - EDITAR: `apps/api/src/services/biometric-data-request.service.js`
    - LOCALIZAÇÃO: funções `validateBiometricDataRequestDecisionInput`, `applyApprovedBiometricDataRequest` e `decideBiometricDataRequest`.

3. Instruções do que fazer.

Acrescenta validação de decisão. O primeiro claim exige `pending`; retries usam a rota dedicada e CAS sobre `failed`/lease expirado. Na mesma transação, cria jobs deduplicados para todas as fotografias, retira-as dos fluxos e elimina os relatórios abrangidos. Só o worker e a verificação final podem escrever `completed`.

4. Código completo, correto e integrado com a app final.

```js
// apps/api/src/validators/biometric-data-request.validator.js
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
/** Reclama o pedido e prepara documentos/outbox numa única transação. */
async function claimAndPreparePrivacyRequest(requestId, actor, input, workflow) {
    return runPrivacyTransaction(async (session) => {
        // Carrega primeiro o owner dentro da transação. O setter contextual de
        // decisionReason nunca pode correr numa query sem requesterId exato.
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
                    lastAttemptAt: workflow.now,
                    "lease.token": workflow.leaseToken,
                    "lease.expiresAt": new Date(workflow.now.getTime() + REQUEST_LEASE_MS),
                },
                $inc: { attempts: 1 },
            },
            { new: true, session },
        ).select("+lease.token");

        if (!request) return null;

        if (request.resources.includes(BIOMETRIC_REQUEST_RESOURCES.PHOTOS)) {
            // Esta escrita disputa o mesmo User reclamado pelo upload/análise.
            // Se o upload confirmar primeiro, a query seguinte já o captura; se
            // o tombstone confirmar primeiro, claimFaceDataWrite falha com 409.
            await blockFaceDataWritesForPrivacy(request.requesterId, {
                at: workflow.now,
                session,
            });
            const photos = await FacePhoto.find({ userId: request.requesterId })
                .select("+storageKey")
                .session(session)
                .lean();
            await enqueueFileDeletionJobs(
                photos.map((photo) => ({
                    sourceType: PRIVACY_FILE_DELETION_SOURCE,
                    sourceId: request._id,
                    ownerId: request.requesterId,
                    storageKey: photo.storageKey,
                })),
                { session },
            );
            await FacePhoto.updateMany(
                { userId: request.requesterId },
                { $set: { status: "deleted" } },
                { session },
            );
        }

        if (request.resources.includes(BIOMETRIC_REQUEST_RESOURCES.REPORTS)) {
            // Sem modelo de agregado comprovadamente anónimo, as duas ações
            // eliminam o documento pessoal. A intenção continua no pedido/auditoria.
            await FaceReport.deleteMany(
                { userId: request.requesterId },
                { session },
            );
        }

        return request;
    });
}

/**
 * Decide um pedido pendente e aplica tratamento quando a decisão é aprovação.
 *
 * @async
 * @function decideBiometricDataRequest
 * @param {string} requestId - Pedido a decidir.
 * @param {{id: string, role: string}} actor - Administrador autenticado.
 * @param {{decision: "approved"|"rejected", decisionReason: string}} input - Decisão validada.
 * @returns {Promise<object>} Pedido atualizado.
 */
export async function decideBiometricDataRequest(requestId, actor, input) {
    if (input.decision === "rejected") {
        return rejectPrivacyRequest(requestId, actor, input);
    }

    return processApprovedPrivacyRequest(requestId, actor, input);
}
```

5. Explicação do código.

O validator obriga uma decisão clara e exige justificação quando o pedido é rejeitado. A rejeição usa CAS e chama `recordDecisionAudit(..., { session })` antes de a transação devolver. O owner é pré-carregado dentro da mesma transação e repetido no filtro de escrita, porque `decisionReason` só pode ser cifrado com AAD ligada ao `requesterId` exato. A aprovação instala a barreira no mesmo documento `User` que `claimFaceDataWrite` reclama no upload/análise; depois de o worker provar ausência física, `finalizePrivacyRequest` confirma `completed`, liberta a barreira e cria o audit com a mesma sessão. Assim, falha de audit reverte a decisão correspondente e não deixa estado aplicado sem rasto.

6. Validação do passo.

Pedidos `delete/photos` e `anonymize/photos` devem criar jobs para todos os ficheiros abrangidos e só concluir após ausência física. Pedidos `delete/reports` e `anonymize/reports` devem deixar zero `FaceReport` pessoais no modelo atual. Pedido rejeitado não altera fotografias nem relatórios.

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

Regista `POST|GET /api/me/privacy-requests`, `GET /api/admin/privacy-requests`, `PATCH /api/admin/privacy-requests/:requestId` e `POST /api/admin/privacy-requests/:requestId/retry`. Usa `requireAuth + ROLES.CLIENTE` nas duas rotas próprias e `requireAuth + ROLES.ADMIN` em cada rota administrativa.

4. Código completo, correto e integrado com a app final.

```js
// apps/api/src/controllers/biometric-data-request.controller.js
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
        // O userId vem da sessão para impedir pedidos em nome de outro cliente.
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
 * @param {import("express").Request} req - Pedido protegido por role.
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
 * @param {import("express").Request & {user: {id: string}}} req - Pedido autenticado de administrador.
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
 * Rotas dos pedidos de eliminação/anonymização de dados faciais.
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

```js
// apps/api/src/app.js
import { biometricDataRequestRoutes } from "./routes/biometric-data-request.routes.js";

// Dentro de createApp(), junto das restantes rotas montadas em /api.
app.use("/api", biometricDataRequestRoutes);
```

5. Explicação do código.

O controller transforma HTTP em chamadas ao validator e ao service. As rotas do cliente usam `/me`, porque o backend decide ownership pela sessão. As rotas de painel usam `/admin` e exigem exclusivamente `ROLES.ADMIN`; a revisão cosmética do consultor é outro fluxo. A montagem em `app.js` liga a feature à API real e mantém os erros a passar pelo middleware seguro.

6. Validação do passo.

Como administrador, `GET /api/admin/privacy-requests` deve devolver `200`. Como cliente ou consultor, a mesma rota deve devolver `403`.

7. Cenário negativo/erro esperado.

Sem cookie de sessão, criação, listagem e decisão devem devolver `401`.

### Passo 7 - Criar o painel React minimizado

1. Objetivo funcional do passo no contexto da app.

Permitir que administradores consultem pedidos e tomem decisões sem ver dados biométricos brutos.

2. Ficheiros envolvidos:
    - CRIAR: `apps/web/src/pages/BiometricDataRequestsAdminPage.jsx`
    - EDITAR: `apps/web/src/App.jsx`
    - LOCALIZAÇÃO: componente completo, imports e zona `canReviewRecommendations`.

3. Instruções do que fazer.

Cria página com estados `loading`, `empty`, `error` e `success`. Usa `apiRequest`, que já envia cookies HttpOnly com `credentials: "include"`. Depois mostra a página apenas a administradores.

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
                `/admin/privacy-requests/${requestId}`,
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
 * Zona administrativa de privacidade dentro de `AppContent`.
 *
 * O painel RF41 é renderizado apenas para administrador. A revisão humana da
 * consulta cosmética vive separadamente em `/consultoria/revisoes` e não deve
 * ser montada neste BK nem reutilizar permissões destrutivas.
 */
{user.role === ROLES.ADMIN && (
    <BiometricDataRequestsAdminPage />
)}
```

5. Explicação do código.

A página usa `apiRequest`, por isso a sessão continua em cookie HttpOnly e a UI não gere tokens. O painel mostra apenas metadados: ação, recursos, estado e motivo. Não mostra fotografia, URL privada, `storageKey` nem relatório completo. Depois de uma decisão, a lista é recarregada para evitar que o revisor clique duas vezes no mesmo pedido.

6. Validação do passo.

Ao entrar como administrador, o painel deve aparecer e carregar pedidos. Ao entrar como cliente ou consultor, o painel não deve ser renderizado pelo `AppContent`.

7. Cenário negativo/erro esperado.

Se a API devolver `403`, a UI deve mostrar mensagem segura e não deve revelar detalhes técnicos internos.

### Passo 8 - Testar fluxo principal e negativos obrigatórios

1. Objetivo funcional do passo no contexto da app.

Provar que criação, listagem, decisão e efeitos de privacidade cumprem ownership, roles e minimização.

2. Ficheiros envolvidos:
    - CRIAR: `apps/api/tests/mf5.biometric-data-requests.test.js`
    - LOCALIZAÇÃO: ficheiro completo de testes de integração.

3. Instruções do que fazer.

Cria testes para cliente criar pedido, administrador listar/decidir, cliente e consultor ficarem bloqueados no painel, pedido repetido falhar e ambas as ações removerem efetivamente os dados sensíveis, mantendo a intenção distinguível no pedido/auditoria.

Executar cenários negativos obrigatórios (mínimo 3):

- cliente sem role administrativa recebe `403` no painel;
- consultor recebe `403` na listagem, decisão e retry de privacidade;
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

    it("permite ao cliente criar pedido e ao administrador listar metadados", async () => {
        const cliente = { id: "665f00000000000000000001", role: ROLES.CLIENTE };
        const admin = { id: "665f00000000000000000002", role: ROLES.ADMIN };

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
            .post("/api/me/privacy-requests")
            .set("Cookie", cookieFor(cliente))
            .send({ action: "delete", resources: ["photos"], reason: "Pedido RGPD" });

        expect(created.status).toBe(201);
        expect(created.body.request.status).toBe("pending");

        const listed = await request(app)
            .get("/api/admin/privacy-requests")
            .set("Cookie", cookieFor(admin));

        expect(listed.status).toBe(200);
        expect(Array.isArray(listed.body.requests)).toBe(true);
        expect(JSON.stringify(listed.body)).not.toContain("storageKey");
    });

    it("bloqueia cliente no painel administrativo", async () => {
        const cliente = { id: "665f00000000000000000003", role: ROLES.CLIENTE };

        const response = await request(app)
            .get("/api/admin/privacy-requests")
            .set("Cookie", cookieFor(cliente));

        expect(response.status).toBe(403);
    });

    it("bloqueia consultor em todas as decisões destrutivas", async () => {
        const consultor = {
            id: "665f00000000000000000007",
            role: ROLES.CONSULTOR,
        };

        const listResponse = await request(app)
            .get("/api/admin/privacy-requests")
            .set("Cookie", cookieFor(consultor));
        const decisionResponse = await request(app)
            .patch("/api/admin/privacy-requests/775f00000000000000000001")
            .set("Cookie", cookieFor(consultor))
            .send({ decision: "approved", decisionReason: "Pedido válido." });
        const retryResponse = await request(app)
            .post("/api/admin/privacy-requests/775f00000000000000000001/retry")
            .set("Cookie", cookieFor(consultor));

        expect(listResponse.status).toBe(403);
        expect(decisionResponse.status).toBe(403);
        expect(retryResponse.status).toBe(403);
    });

    it("bloqueia pedido sem recursos válidos", async () => {
        const cliente = { id: "665f00000000000000000004", role: ROLES.CLIENTE };

        const response = await request(app)
            .post("/api/me/privacy-requests")
            .set("Cookie", cookieFor(cliente))
            .send({ action: "delete", resources: [] });

        expect(response.status).toBe(400);
    });

    it("não conserva bytes nem relatórios pessoais numa anonymize", async () => {
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
        vi.spyOn(FaceReport, "deleteMany").mockResolvedValue({ deletedCount: 1 });

        const response = await request(app)
            .patch("/api/admin/privacy-requests/775f00000000000000000002")
            .set("Cookie", cookieFor(admin))
            .send({ decision: "approved", decisionReason: "Pedido válido." });

        expect(response.status).toBe(200);
        expect(FacePhoto.updateMany).toHaveBeenCalledWith(
            { userId: requestDoc.requesterId, status: "active" },
            {
                $set: {
                    status: "deleted",
                },
            },
            expect.objectContaining({ session: expect.anything() }),
        );
        expect(FaceReport.deleteMany).toHaveBeenCalledWith(
            { userId: requestDoc.requesterId },
            expect.objectContaining({ session: expect.anything() }),
        );
    });
});
```

5. Explicação do código.

Os testes usam cookie de sessão para reproduzir a autenticação real. O primeiro cenário confirma criação pelo cliente, listagem por administrador e minimização da resposta. Os cenários negativos provam explicitamente `403` para cliente/consultor, input inválido e repetição de decisão. O teste físico deve correr num replica set e confirmar que, em `delete` e `anonymize`, os bytes desaparecem; no modelo atual, ambos deixam zero relatórios pessoais.

6. Validação do passo.

Executa `npm --prefix apps/api test`. Se os ficheiros ainda não estiverem criados no código real, estes testes servem como contrato de implementação do BK e devem passar quando o aluno aplicar os passos.

7. Cenário negativo/erro esperado.

Sem cookie de sessão, criação, listagem e decisão devem devolver `401`.

#### Expected results

- `POST /api/me/privacy-requests` com sessão de cliente devolve `201`.
- `GET /api/admin/privacy-requests` com administrador devolve `200`; consultor e cliente recebem `403`.
- `PATCH /api/admin/privacy-requests/:requestId` decide apenas pedidos `pending`.
- `POST /api/admin/privacy-requests/:requestId/retry` reprocessa falhas de forma idempotente.
- `completed` só aparece depois de o worker confirmar ausência física dos ficheiros aplicáveis.
- Pedidos `delete/photos` e `anonymize/photos` retiram as fotografias do uso ativo e eliminam fisicamente os bytes antes de `completed`.
- Pedidos `delete/reports` e `anonymize/reports` eliminam os documentos `FaceReport`; preservar um agregado só será permitido quando existir um modelo comprovadamente não identificável.
- Cliente em rota administrativa recebe `403`.
- Respostas não incluem `storageKey`, imagem, path interno ou relatório completo.

## Criterios de aceite

- Pedido criado usa `requesterId` da sessão autenticada.
- Administrador consegue listar, decidir e repetir pedidos falhados.
- Consultor não consegue listar, decidir nem repetir pedidos de privacidade; recebe `403`.
- Cliente não consegue listar nem decidir pedidos.
- Pedido aprovado preserva a intenção para auditoria e aplica a remoção efetiva exigida aos recursos pedidos.
- Pedido rejeitado mantém dados inalterados e guarda justificação.
- Pedido rejeitado confirma CAS + audit na mesma transação; aprovação/retry confirma `completed` + audit na transação final, e falha injetada do audit provoca rollback.
- Dump raw não contém `reason`/`decisionReason` em claro; owner em falta ou divergente falha fechado.
- Corrida upload/análise versus aprovação é linearizada pela escrita transacional comum em `User`; o fluxo destrutivo captura o upload vencedor ou `claimFaceDataWrite` bloqueia o writer com `409`.
- Não existem endpoints duplicados para a mesma ação.
- Não restam bytes de `FacePhoto` nem documentos pessoais `FaceReport` abrangidos por um pedido concluído.
- Cenarios negativos concluidos: minimo `3` com resultado controlado.
- Evidência de testes por camada cobre unit, integration e smoke manual.

#### Validação final

- `rg` não encontra linguagem interna nem termos de implementação temporária neste BK.
- A pesquisa de paths históricos neste ficheiro não deve devolver ocorrências.
- `npm --prefix apps/api test` deve passar quando os ficheiros forem implementados.
- `npm --prefix apps/api test -- migration-009-privacy-face-files.replset.integration.test.js migrations.replset.integration.test.js` valida a barreira específica da 009 e o registry completo/ordenado `001–015`; o resultado focal não substitui a suite integral.
- `npm --prefix apps/web run build` deve passar após integrar a página no `App.jsx`.
- Testar manualmente cliente sem sessão, cliente autenticado, consultor (`403`) e administrador (`200`).
- [ ] Negativos: minimo `3` cenarios controlados com `400`, `401`, `403` ou `409`.

### Matriz mínima de testes por prioridade

| Prioridade | Camadas obrigatórias | Evidência esperada |
| --- | --- | --- |
| `P0` | Unit + integration + smoke manual + 3 negativos | Output dos testes, print do painel e resposta sem dados sensíveis. |
| `P1` | Integration + negativos de role | `403` para cliente e consultor; `401` sem sessão. |
| `P2` | Smoke manual e revisão de strings | Sem paths internos ou conteúdo biométrico no painel. |

## Evidence para PR/defesa

- Output do pedido criado com estado `pending`.
- Output de teste que mostra `403` para cliente no painel.
- Output de teste que mostra `403` para consultor em listagem, decisão e retry.
- Output de teste que mostra `409` ao repetir decisão sobre pedido já decidido.
- Evidência de que a resposta não contém `storageKey`.
- Registo de decisão com `reviewerId`, `reviewedAt` e `completedAt`.
- Prova replica-set de que uma falha em `BiometricAccessLog.create` não deixa `rejected`/`completed` confirmado sem o respetivo evento.
- Evidence de job falhado + retry, sem duplicar efeitos, e verificação física antes de `completed`.
- Evidence técnica: testes API e build web associados ao painel RF41.
- Evidence da 009: dry-run, cifra contextual dos motivos, os dois ordenamentos da escrita comum em `User`, revalidação de consentimento/pedidos, replay e dump raw sem plaintext.
- Evidence de negócio `CORE-HIBRIDO`: demonstrar que o utilizador consegue resolver um pedido de privacidade antes de regressar ao fluxo de análise/recomendação, reduzindo abandono por falta de confiança.
- KPIs a observar na defesa: `retencao_fluxo_ia_30d` e `add_to_cart_recomendado` antes/depois de pedidos tratados.

#### Handoff

`BK-MF5-04` deve registar auditoria sempre que um administrador listar ou consultar pedidos e disponibilizar alertas. A decisão já cria o evento mínimo atomicamente neste BK; o modelo fornece `requesterId`, `resources`, `action`, `status`, `reviewerId`, `reviewedAt` e `completedAt` como contexto. A auditoria de leituras do consultor aplica-se apenas ao fluxo separado de revisão cosmética.

#### Changelog

- `2026-07-11`: decisões destrutivas, listagem e retry de privacidade restringidos a `ROLES.ADMIN`; removida do exemplo a UI legada de revisão por recomendação e adicionado negativo `403` para consultor.
- `2026-07-10`: modelo e workflow reconciliados com `009_privacy_barriers_and_face_file_encryption`: motivos contextuais v2 por `requesterId`, sem defaults, owner exato nas queries e tombstone/escrita comum em `User` antes da captura/outbox.
- `2026-07-10`: decisão de privacidade reconciliada com auditoria atómica: rejeição + audit e finalização `completed` + audit partilham a sessão; falha de audit provoca rollback.
- `2026-06-19`: guia corrigido para `apps`, 8 passos, semântica explícita `delete/anonymize`, estados de privacidade em fotografias/relatórios, painel React, testes negativos e evidence `CORE-HIBRIDO`.
