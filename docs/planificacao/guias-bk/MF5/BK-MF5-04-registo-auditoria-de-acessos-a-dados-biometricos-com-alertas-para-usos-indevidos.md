# BK-MF5-04 - Registo/auditoria de acessos a dados biométricos, com alertas para usos indevidos

## Header
- `doc_id`: `GUIA-BK-MF5-04`
- `bk_id`: `BK-MF5-04`
- `macro`: `MF5`
- `owner`: `Bruna`
- `apoio`: `Izelicks`
- `prioridade`: `P1`
- `estado`: `TODO`
- `esforco`: `S`
- `dependencias`: `BK-MF1-05`
- `rf_rnf`: `RF44`
- `fase_documental`: `Fase 2`
- `sprint`: `S09-S10`
- `core_or_reforco`: `Core`
- `classe_core_dual`: `CORE-HIBRIDO`
- `eixo_primario`: `ConfiancaConversao`
- `kpi_primario`: `add_to_cart_recomendado`
- `kpi_secundario`: `retencao_fluxo_ia_30d`
- `proximo_bk`: `BK-MF5-05`
- `guia_path`: `docs/planificacao/guias-bk/MF5/BK-MF5-04-registo-auditoria-de-acessos-a-dados-biometricos-com-alertas-para-usos-indevidos.md`
- `last_updated`: `2026-07-11`

#### Objetivo

Neste BK vais criar auditoria de acessos a dados biométricos e alertas simples para padrões de uso indevido, sem expor fotografias, relatórios completos, cookies, tokens ou caminhos internos.

#### Importância

Mesmo quando um ator tem uma permissão legítima e limitada, o acesso a dados biométricos deve deixar rasto. Apenas administradores listam, decidem ou repetem pedidos destrutivos de privacidade. Consultores ficam limitados ao domínio separado de revisão cosmética e só acedem a fotografias através de um grant explícito por relatório; esses acessos também são auditados, mas nunca lhes conferem autoridade sobre privacy requests.

#### Scope-in

- Criar modelo `BiometricAccessLog`.
- Criar service `recordBiometricAccess`.
- Registar acessos em listagem/decisão de pedidos biométricos do `BK-MF5-01`.
- Criar alerta quando o mesmo ator consulta muitos recursos sensíveis num período curto.
- Criar endpoint admin para consultar logs minimizados e alertas.
- Criar página React de auditoria.

#### Scope-out

- Não criar SIEM externo.
- Não enviar emails, SMS ou push.
- Não guardar fotografias ou relatórios completos no log.
- Não alterar consentimento facial.
- Não implementar encriptação em repouso, que fica para `RNF11`.

#### Estado antes e depois

- Antes: `FacePhoto` e `FaceReport` existem, mas a app não regista de forma dedicada quem consultou ou decidiu dados biométricos.
- Depois: acessos administrativos a recursos biométricos deixam registo minimizado e geram alerta quando ultrapassam um limite simples.

#### Pre-requisitos

- `BK-MF0-02`: sessão autenticada.
- `BK-MF0-05`: roles e `requireRole`.
- `BK-MF1-05`: fotografias faciais com storage privado.
- `BK-MF1-07`: relatórios faciais.
- `BK-MF5-01`: pedidos de eliminação/anonymização e painel de revisão.
- `RF44`: registo/auditoria de acessos a dados biométricos, com alertas para usos indevidos.

#### Glossário

- Evento de auditoria: registo técnico de uma ação sobre dados sensíveis.
- Ator: utilizador autenticado que executa a ação.
- Sujeito: utilizador a quem os dados pertencem.
- Recurso biométrico: fotografia facial, relatório facial ou pedido de privacidade biométrica.
- Alerta: sinal de volume ou padrão anómalo que deve ser revisto por administrador.

#### Conceitos teóricos essenciais

Auditoria não é `console.log`. Um log de auditoria deve ter estrutura, finalidade e minimização. Em vez de gravar o relatório facial, grava o tipo de recurso, o ID do recurso, o ator, o sujeito, a ação e o resultado.

O alerta deste BK é intencionalmente simples: volume elevado de acessos por ator num intervalo curto. Isto é suficiente para alunos do 12.º ano perceberem o princípio sem criar uma solução de monitorização empresarial.

O backend é o único local fiável para auditar. Se a UI registasse eventos sozinha, um utilizador poderia contornar o browser e chamar a API diretamente.

## Bloco pedagogico

### Objetivo

Compreender como registar acessos a dados biométricos de forma útil para auditoria sem transformar o log numa nova cópia de dados sensíveis.

### Pre-requisitos

- Saber que `BK-MF5-01` já cria e decide pedidos biométricos.
- Conhecer roles e autorização backend.
- Perceber o conceito de minimização de dados.
- Distinguir auditoria backend de mensagens de debug ou `console.log`.

### Erros comuns

- Guardar fotografia, relatório completo, `storageKey`, cookie ou token no log.
- Permitir que consultores consultem a auditoria global.
- Auditar apenas erros e não acessos bem-sucedidos.
- Criar alertas só na UI, sem registo persistido no backend.

### Check de compreensao

Consegues identificar ator, sujeito, ação, recurso e resultado num evento de auditoria? Consegues explicar porque é que o log deve ser minimizado?

## Bloco operacional

### Entrada

- Eventos vindos de listagem, decisão e consulta de recursos biométricos.
- Sessão autenticada com role persistida.
- Modelos de pedido, fotografia e relatório já existentes.

### Passos

1. Definir ações auditáveis para `RF44`.
2. Criar o modelo minimizado de auditoria.
3. Criar service para gravar eventos e calcular alerta por volume.
4. Integrar auditoria nos services de pedidos biométricos.
5. Expor logs e alertas apenas a administradores.
6. Testar pelo menos 2 negativos ligados a autorização e minimização.

### Validacao

- Evento de auditoria é criado sem dados biométricos brutos.
- Endpoint de logs devolve `200` para administrador.
- Consultor recebe `403` na auditoria global.
- [ ] Negativos: minimo `2` cenarios controlados com `403` e ausência de dados sensíveis na resposta.

### Handoff

`BK-MF5-05` deve apresentar os painéis sem quebrar responsividade. `MF6` pode reforçar performance e segurança mantendo este contrato de auditoria minimizada.

#### Arquitetura do BK

- `biometric-access-log.model.js`: guarda eventos minimizados.
- `biometric-audit.service.js`: grava eventos e calcula alertas.
- `biometric-audit.controller.js`: lista logs e alertas para admin.
- `biometric-audit.routes.js`: protege endpoints por role.
- `biometric-data-request.service.js`: chama auditoria ao listar/decidir pedidos.
- `BiometricAuditPage.jsx`: mostra eventos e alertas.
- `App.jsx`: mostra página apenas a administrador.

#### Ficheiros a criar/editar/rever

- CRIAR: `apps/api/src/models/biometric-access-log.model.js`
- CRIAR: `apps/api/src/services/biometric-audit.service.js`
- CRIAR: `apps/api/src/controllers/biometric-audit.controller.js`
- CRIAR: `apps/api/src/routes/biometric-audit.routes.js`
- EDITAR: `apps/api/src/services/biometric-data-request.service.js`
- EDITAR: `apps/api/src/controllers/biometric-data-request.controller.js`
- EDITAR: `apps/api/src/app.js`
- CRIAR: `apps/web/src/pages/BiometricAuditPage.jsx`
- EDITAR: `apps/web/src/App.jsx`
- CRIAR: `apps/api/tests/mf5.biometric-audit.test.js`

#### Tutorial técnico linear

### Passo 1 - Definir eventos auditáveis de RF44

1. Objetivo funcional do passo no contexto da app.

Escolher que ações sobre dados biométricos geram evento de auditoria.

2. Ficheiros envolvidos:
    - REVER: `docs/RF.md`
    - REVER: `docs/planificacao/backlogs/MATRIZ-CANONICA-BK.md`
    - REVER: `docs/planificacao/guias-bk/MF5/BK-MF5-01-painel-para-consultores-admins-reverem-e-aprovarem-pedidos-de-eliminacao-anonymizacao-de-fotografias-e-relatorios.md`
    - LOCALIZAÇÃO: `RF44` e handoff do `BK-MF5-01`.

3. Instruções do que fazer.

Regista como auditáveis: listagem, decisão e retry administrativos de pedidos de privacidade; consulta administrativa do log global; e, num domínio separado, leitura de fotografia/relatório por consultor quando existe grant explícito da revisão cosmética. Os primeiros eventos só podem ter um ator `ADMIN`; o último nunca autoriza o consultor a gerir pedidos destrutivos.

4. Código completo, correto e integrado com a app final.

```text
Sem código neste passo.
```

5. Explicação do código.

Não há código porque este passo fixa a política. A app só deve auditar eventos com significado real para privacidade; eventos genéricos de UI não bastam para RF44.

6. Validação do passo.

Consegues indicar ator, sujeito, ação, recurso e resultado para cada evento.

7. Cenário negativo/erro esperado.

Auditar apenas erros não permite perceber acessos bem-sucedidos indevidos.

### Passo 2 - Criar modelo e service de auditoria

1. Objetivo funcional do passo no contexto da app.

Persistir eventos minimizados e calcular alerta por volume de acessos.

2. Ficheiros envolvidos:
    - CRIAR: `apps/api/src/models/biometric-access-log.model.js`
    - CRIAR: `apps/api/src/services/biometric-audit.service.js`
    - LOCALIZAÇÃO: ficheiros completos.

3. Instruções do que fazer.

Cria o model sem campos de imagem, path ou relatório completo. No service, limita o alerta a eventos recentes do mesmo ator.

4. Código completo, correto e integrado com a app final.

```js
// apps/api/src/models/biometric-access-log.model.js
import mongoose from "mongoose";

const { Schema, model } = mongoose;

export const BIOMETRIC_AUDIT_ACTIONS = Object.freeze({
    LIST_REQUESTS: "list_requests",
    DECIDE_REQUEST: "decide_request",
    VIEW_AUDIT: "view_audit",
    VIEW_RESOURCE: "view_resource",
});

export const BIOMETRIC_AUDIT_RESULTS = Object.freeze({
    ALLOWED: "allowed",
    DENIED: "denied",
});

/**
 * Registo minimizado de acesso a dados biométricos.
 *
 * Guarda metadados suficientes para auditoria sem duplicar dados sensíveis.
 */
const biometricAccessLogSchema = new Schema(
    {
        // O ator vem da sessão autenticada; nunca deve ser escolhido pelo frontend.
        actorId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
        actorRole: {
            type: String,
            required: true,
        },
        subjectUserId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            default: null,
            index: true,
        },
        // O par resourceType/resourceId identifica o alvo sem copiar imagem, relatório ou path interno.
        action: {
            type: String,
            enum: Object.values(BIOMETRIC_AUDIT_ACTIONS),
            required: true,
        },
        resourceType: {
            type: String,
            enum: ["request", "photo", "report", "audit"],
            required: true,
        },
        resourceId: {
            type: String,
            default: "",
        },
        result: {
            type: String,
            enum: Object.values(BIOMETRIC_AUDIT_RESULTS),
            required: true,
        },
        reason: {
            type: String,
            maxlength: 200,
            default: "",
        },
        // O alerta fica indexado para o painel administrativo conseguir listar sinais de risco rapidamente.
        alertRaised: {
            type: Boolean,
            default: false,
            index: true,
        },
    },
    { timestamps: true },
);

biometricAccessLogSchema.index({ createdAt: -1 });

/**
 * Modelo Mongoose dos eventos de auditoria biométrica.
 *
 * @type {import("mongoose").Model}
 */
export const BiometricAccessLog = model(
    "BiometricAccessLog",
    biometricAccessLogSchema,
);
```

```js
// apps/api/src/services/biometric-audit.service.js
import {
    BIOMETRIC_AUDIT_ACTIONS,
    BIOMETRIC_AUDIT_RESULTS,
    BiometricAccessLog,
} from "../models/biometric-access-log.model.js";

const ALERT_WINDOW_MINUTES = 15;
const ALERT_EVENT_LIMIT = 10;

/**
 * Converte evento de auditoria para resposta segura.
 *
 * @function toAuditLogResponse
 * @param {object} log - Documento Mongoose ou mock equivalente.
 * @returns {object} Evento sem dados biométricos brutos.
 */
function toAuditLogResponse(log) {
    return {
        id: log._id.toString(),
        actorId: log.actorId.toString(),
        actorRole: log.actorRole,
        subjectUserId: log.subjectUserId?.toString() ?? null,
        action: log.action,
        resourceType: log.resourceType,
        resourceId: log.resourceId,
        result: log.result,
        // A resposta devolve só metadados; não devolve fotografia, relatório, cookie, token ou storageKey.
        reason: log.reason,
        alertRaised: log.alertRaised,
        createdAt: log.createdAt,
    };
}

/**
 * Regista acesso biométrico e assinala alerta por volume recente.
 *
 * @async
 * @function recordBiometricAccess
 * @param {{actorId: string, actorRole: string, subjectUserId?: string|null, action: string, resourceType: string, resourceId?: string, result?: string, reason?: string}} event - Evento validado pelo ponto de chamada.
 * @param {{session?: import("mongoose").ClientSession|null}} [options] - Sessão da operação auditada.
 * @returns {Promise<object>} Evento registado.
 */
export async function recordBiometricAccess(event, { session = null } = {}) {
    const since = new Date(Date.now() - ALERT_WINDOW_MINUTES * 60 * 1000);
    // A janela curta torna o alerta previsível para alunos e evita depender de ferramentas externas.
    const recentCountQuery = BiometricAccessLog.countDocuments({
        actorId: event.actorId,
        createdAt: { $gte: since },
    });
    const recentCount = session
        ? await recentCountQuery.session(session)
        : await recentCountQuery;

    const payload = {
        actorId: event.actorId,
        actorRole: event.actorRole,
        subjectUserId: event.subjectUserId ?? null,
        action: event.action,
        resourceType: event.resourceType,
        resourceId: event.resourceId ?? "",
        result: event.result ?? BIOMETRIC_AUDIT_RESULTS.ALLOWED,
        reason: event.reason ?? "",
        // O alerta não bloqueia a ação; apenas sinaliza revisão administrativa.
        alertRaised: recentCount + 1 > ALERT_EVENT_LIMIT,
    };
    const log = session
        ? (await BiometricAccessLog.create([payload], { session }))[0]
        : await BiometricAccessLog.create(payload);

    return toAuditLogResponse(log);
}

/**
 * Lista eventos recentes para revisão administrativa.
 *
 * @async
 * @function listBiometricAuditLogs
 * @returns {Promise<object[]>} Eventos minimizados.
 */
export async function listBiometricAuditLogs() {
    const logs = await BiometricAccessLog.find()
        .sort({ createdAt: -1 })
        // A listagem é limitada para evitar respostas administrativas gigantes com metadados sensíveis.
        .limit(200);

    return logs.map(toAuditLogResponse);
}

/**
 * Lista alertas gerados por volume de acessos.
 *
 * @async
 * @function listBiometricAuditAlerts
 * @returns {Promise<object[]>} Eventos com alerta.
 */
export async function listBiometricAuditAlerts() {
    const alerts = await BiometricAccessLog.find({ alertRaised: true })
        .sort({ createdAt: -1 })
        // O painel de alertas mostra apenas sinais recentes que precisam de revisão humana.
        .limit(50);

    return alerts.map(toAuditLogResponse);
}

export { BIOMETRIC_AUDIT_ACTIONS, BIOMETRIC_AUDIT_RESULTS };
```

5. Explicação do código.

O model separa `actorId` de `subjectUserId`, porque quem acede e quem é dono dos dados podem ser pessoas diferentes. `resourceType` e `resourceId` identificam o alvo sem guardar conteúdo sensível. O service calcula `recentCount` antes de criar o evento e marca `alertRaised` se o limite for ultrapassado. Quando recebe `{ session }`, tanto a contagem como o insert participam na mesma transação da decisão: não pode existir decisão confirmada sem o respetivo evento `allowed`, nem evento de sucesso para uma decisão que fez rollback. O alerta não bloqueia a ação; sinaliza revisão.

6. Validação do passo.

Criar 11 eventos do mesmo ator em 15 minutos deve marcar alerta no último.

7. Cenário negativo/erro esperado.

Guardar `cosmeticSummary` ou `storageKey` no log transformaria a auditoria num novo risco de privacidade.

### Passo 3 - Integrar auditoria no fluxo do BK-MF5-01

1. Objetivo funcional do passo no contexto da app.

Registar quando um administrador lista, decide ou repete pedidos de dados biométricos. O consultor não entra neste service: os seus acessos legítimos pertencem à revisão cosmética/grant fotográfico e usam o audit trail próprio desse fluxo.

2. Ficheiros envolvidos:
    - EDITAR: `apps/api/src/services/biometric-data-request.service.js`
    - EDITAR: `apps/api/src/controllers/biometric-data-request.controller.js`
    - LOCALIZAÇÃO: chamadas a `listBiometricDataRequestsForReview` e `decideBiometricDataRequest`.

3. Instruções do que fazer.

Passa ator autenticado para o service. Leituras independentes podem chamar `recordBiometricAccess` sem sessão; rejeição, finalização de aprovação e finalização de retry têm de chamar `recordBiometricAccess(..., { session })` dentro da mesma transação que confirma a decisão. Eventos `denied` relativos a uma tentativa falhada ficam fora dessa transação e nunca substituem o evento `allowed` obrigatório no commit de sucesso.

4. Código completo, correto e integrado com a app final.

```js
// apps/api/src/services/biometric-data-request.service.js
import {
    BIOMETRIC_AUDIT_ACTIONS,
    recordBiometricAccess,
} from "./biometric-audit.service.js";

/**
 * Lista pedidos e regista auditoria do acesso administrativo.
 *
 * @async
 * @function listBiometricDataRequestsForReview
 * @param {{id: string, role: "admin"}} actor - Administrador autenticado e autorizado pela rota.
 * @returns {Promise<object[]>} Pedidos minimizados.
 */
export async function listBiometricDataRequestsForReview(actor) {
    const requests = await BiometricDataRequest.find()
        .sort({ createdAt: -1 })
        .limit(100);

    // A auditoria fica no service para ser executada mesmo que a UI mude no futuro.
    await recordBiometricAccess({
        actorId: actor.id,
        actorRole: actor.role,
        action: BIOMETRIC_AUDIT_ACTIONS.LIST_REQUESTS,
        resourceType: "request",
        reason: "Listagem de pedidos biométricos para revisão.",
    });

    return requests.map(toBiometricDataRequestResponse);
}
```

```js
// apps/api/src/services/biometric-data-request.service.js
async function recordDecisionAudit(actor, request, reason, { session } = {}) {
    await recordBiometricAccess(
        {
            actorId: actor.id,
            actorRole: actor.role,
            subjectUserId: request.requesterId.toString(),
            action: BIOMETRIC_AUDIT_ACTIONS.DECIDE_REQUEST,
            resourceType: "request",
            resourceId: request._id.toString(),
            result: "allowed",
            reason,
        },
        { session },
    );
}

async function rejectPrivacyRequest(requestId, actor, input) {
    return runPrivacyTransaction(async (session) => {
        // O CAS e o evento append-only pertencem ao mesmo commit.
        const request = await BiometricDataRequest.findOneAndUpdate(
            { _id: requestId, status: BIOMETRIC_REQUEST_STATUSES.PENDING },
            {
                $set: {
                    status: BIOMETRIC_REQUEST_STATUSES.REJECTED,
                    reviewerId: actor.id,
                    decisionReason: input.decisionReason,
                    reviewedAt: new Date(),
                },
            },
            { new: true, session },
        );
        if (!request) throw new AppError(409, "Pedido já foi decidido");

        await recordDecisionAudit(
            actor,
            request,
            "Pedido de privacidade rejeitado por revisor autorizado.",
            { session },
        );
        return request;
    });
}

async function finalizePrivacyRequest(request, leaseToken, actor, auditReason) {
    return runPrivacyTransaction(async (session) => {
        // A verificação de ausência física/documental ocorre antes deste CAS,
        // dentro deste mesmo handler transacional, como detalhado no BK-MF7-02.
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
                    "lease.token": null,
                    "lease.expiresAt": null,
                },
            },
            { new: true, session },
        );
        if (!completed) throw new AppError(409, "Lease deixou de ser válido");

        // Aprovação e retry chamam este helper com razões seguras distintas.
        await recordDecisionAudit(actor, completed, auditReason, { session });
        return completed;
    });
}
```

```js
// apps/api/src/controllers/biometric-data-request.controller.js
/**
 * Lista pedidos biométricos exclusivamente para administrador.
 *
 * @async
 * @function listBiometricDataRequestsController
 * @param {import("express").Request & {user: {id: string, role: string}}} req - Pedido autenticado.
 * @param {import("express").Response} res - Resposta Express.
 * @param {import("express").NextFunction} next - Proximo middleware.
 * @returns {Promise<import("express").Response|void>} Resposta com pedidos minimizados.
 */
export async function listBiometricDataRequestsController(req, res, next) {
    try {
        // O ator vem de `requireAuth`; o frontend nunca envia actorId ou role para auditoria.
        const requests = await listBiometricDataRequestsForReview(req.user);
        return res.status(200).json({ requests });
    } catch (err) {
        return next(err);
    }
}

/**
 * Decide pedido biométrico e passa ator autenticado ao service.
 *
 * @async
 * @function decideBiometricDataRequestController
 * @param {import("express").Request & {user: {id: string, role: string}}} req - Pedido autenticado.
 * @param {import("express").Response} res - Resposta Express.
 * @param {import("express").NextFunction} next - Próximo middleware.
 * @returns {Promise<import("express").Response|void>} Resposta com decisão minimizada.
 */
export async function decideBiometricDataRequestController(req, res, next) {
    try {
        const input = validateBiometricDataRequestDecisionInput(req.body);
        // A validação do body acontece antes do service para impedir decisões ambíguas.
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

5. Explicação do código.

A chamada de auditoria fica no backend, junto da ação real. A UI não consegue falsificar nem omitir o evento. A listagem regista `LIST_REQUESTS`; a decisão regista `DECIDE_REQUEST` com `resourceId` do pedido e `subjectUserId` do requerente. Tentativas inválidas também ficam registadas com `result: "denied"`, sem expor imagem, relatório ou dados pessoais no reason.

6. Validação do passo.

Depois de chamar a listagem admin, `BiometricAccessLog.find()` deve devolver evento `list_requests`.

7. Cenário negativo/erro esperado.

Se a auditoria for chamada antes da autorização por role, pode registar evento para ator sem permissão.

### Passo 4 - Criar endpoints e página de auditoria

1. Objetivo funcional do passo no contexto da app.

Permitir que administradores vejam eventos e alertas biométricos minimizados.

2. Ficheiros envolvidos:
    - CRIAR: `apps/api/src/controllers/biometric-audit.controller.js`
    - CRIAR: `apps/api/src/routes/biometric-audit.routes.js`
    - EDITAR: `apps/api/src/app.js`
    - CRIAR: `apps/web/src/pages/BiometricAuditPage.jsx`
    - EDITAR: `apps/web/src/App.jsx`
    - LOCALIZAÇÃO: ficheiros completos.

3. Instruções do que fazer.

Protege a leitura de auditoria apenas para `administrador`. Um consultor pode originar eventos apenas ao abrir uma revisão cosmética ou fotografia coberta por grant; nunca através da listagem, decisão ou retry de pedidos de privacidade e nunca pode ver o log global.

4. Código completo, correto e integrado com a app final.

```js
// apps/api/src/controllers/biometric-audit.controller.js
import {
    listBiometricAuditAlerts,
    listBiometricAuditLogs,
} from "../services/biometric-audit.service.js";

/**
 * Lista eventos de auditoria biométrica para administrador.
 *
 * @async
 * @function listBiometricAuditLogsController
 * @param {import("express").Request} req - Pedido autenticado de administrador.
 * @param {import("express").Response} res - Resposta Express.
 * @param {import("express").NextFunction} next - Próximo middleware.
 * @returns {Promise<import("express").Response|void>} Resposta com logs minimizados.
 */
export async function listBiometricAuditLogsController(req, res, next) {
    try {
        // O controller não monta DTOs manuais; confia no service minimizado para não expor dados biométricos.
        const logs = await listBiometricAuditLogs();

        return res.status(200).json({ logs });
    } catch (err) {
        return next(err);
    }
}

/**
 * Lista alertas de auditoria biométrica para administrador.
 *
 * @async
 * @function listBiometricAuditAlertsController
 * @param {import("express").Request} req - Pedido autenticado de administrador.
 * @param {import("express").Response} res - Resposta Express.
 * @param {import("express").NextFunction} next - Próximo middleware.
 * @returns {Promise<import("express").Response|void>} Resposta com alertas minimizados.
 */
export async function listBiometricAuditAlertsController(req, res, next) {
    try {
        // Alertas são uma vista filtrada dos logs e não uma segunda fonte de verdade.
        const alerts = await listBiometricAuditAlerts();

        return res.status(200).json({ alerts });
    } catch (err) {
        return next(err);
    }
}
```

```js
// apps/api/src/routes/biometric-audit.routes.js
import { Router } from "express";
import {
    listBiometricAuditAlertsController,
    listBiometricAuditLogsController,
} from "../controllers/biometric-audit.controller.js";
import { ROLES } from "../constants/roles.js";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { requireRole } from "../middlewares/role.middleware.js";

/**
 * Rotas administrativas de auditoria biométrica.
 *
 * @type {import("express").Router}
 */
export const biometricAuditRoutes = Router();

biometricAuditRoutes.get(
    "/biometric-audit/logs",
    requireAuth,
    // Só administrador consulta todos os eventos para reduzir exposição interna.
    requireRole(ROLES.ADMIN),
    listBiometricAuditLogsController,
);

biometricAuditRoutes.get(
    "/biometric-audit/alerts",
    requireAuth,
    // Consultores recebem 403; os seus acessos auditáveis existem apenas no fluxo separado de revisão cosmética/grant.
    requireRole(ROLES.ADMIN),
    listBiometricAuditAlertsController,
);
```

```js
// apps/api/src/app.js
import { biometricAuditRoutes } from "./routes/biometric-audit.routes.js";

/**
 * Montagem da auditoria biométrica administrativa.
 *
 * A rota fica sob `/api/admin` para manter o mesmo padrão dos restantes
 * painéis administrativos e para concentrar o controlo de acesso em rotas
 * explicitamente administrativas.
 */
// Deve ser montada antes do errorMiddleware para erros de auth/role seguirem o handler global.
app.use("/api/admin", biometricAuditRoutes);
```

```jsx
// apps/web/src/pages/BiometricAuditPage.jsx
import React, { useEffect, useState } from "react";
import { apiRequest } from "../services/apiClient.js";

/**
 * Mostra auditoria biométrica para administradores.
 *
 * @function BiometricAuditPage
 * @returns {JSX.Element} Lista de eventos e alertas minimizados.
 */
export function BiometricAuditPage() {
    const [logs, setLogs] = useState([]);
    const [alerts, setAlerts] = useState([]);
    const [status, setStatus] = useState("loading");
    const [error, setError] = useState("");

    useEffect(() => {
        async function loadAudit() {
            try {
                // Os dois pedidos usam o mesmo cookie HttpOnly através de `apiRequest`.
                const [logsData, alertsData] = await Promise.all([
                    apiRequest("/admin/biometric-audit/logs"),
                    apiRequest("/admin/biometric-audit/alerts"),
                ]);
                setLogs(logsData.logs ?? []);
                setAlerts(alertsData.alerts ?? []);
                setStatus("success");
            } catch (err) {
                setError(err.message);
                setStatus("error");
            }
        }

        loadAudit();
    }, []);

    return (
        <section>
            <h1>Auditoria biométrica</h1>
            {status === "loading" && <p role="status">A carregar auditoria...</p>}
            {status === "error" && <p role="alert">{error}</p>}
            {status === "success" && (
                <>
                    <h2>Alertas</h2>
                    {alerts.length === 0 && <p>Sem alertas recentes.</p>}
                    <ul>
                        {/* A UI mostra metadados de auditoria, não imagens nem relatórios completos. */}
                        {alerts.map((alert) => (
                            <li key={alert.id}>
                                <strong>{alert.action}</strong>
                                <p>Ator: {alert.actorId}</p>
                                <p>Recurso: {alert.resourceType}</p>
                            </li>
                        ))}
                    </ul>

                    <h2>Eventos recentes</h2>
                    <ul>
                        {/* O resultado permite defesa PAP sem revelar dados biométricos do sujeito. */}
                        {logs.map((log) => (
                            <li key={log.id}>
                                <strong>{log.action}</strong>
                                <p>Resultado: {log.result}</p>
                                <p>Alerta: {log.alertRaised ? "sim" : "não"}</p>
                            </li>
                        ))}
                    </ul>
                </>
            )}
        </section>
    );
}
```

```jsx
// apps/web/src/App.jsx
import { BiometricAuditPage } from "./pages/BiometricAuditPage.jsx";

/**
 * Zona administrativa dentro de `AppContent`.
 *
 * A auditoria biométrica só aparece quando `isAdmin` é verdadeiro. A proteção
 * real continua no backend, mas esconder a página reduz tentativas indevidas e
 * mantém a navegação coerente para clientes e consultores.
 */
{isAdmin && (
    <>
        <AdminDashboardPage />
        <StockAdminPage />
        {/* A navegação esconde a página de clientes/consultores; o backend continua a ser a proteção real. */}
        <BiometricAuditPage />
    </>
)}
```

5. Explicação do código.

O controller chama apenas services que devolvem DTOs minimizados. As rotas são montadas sob `/api/admin`, por isso os caminhos finais são `/api/admin/biometric-audit/logs` e `/api/admin/biometric-audit/alerts`. Apenas administradores consultam todos os logs, reduzindo exposição interna. A UI apresenta IDs e metadados, não imagens ou texto de relatórios. A integração em `App.jsx` coloca a página apenas no bloco de administração; o backend continua a aplicar `requireRole(ROLES.ADMIN)`.

6. Validação do passo.

Administrador recebe `200` nos endpoints. Consultor recebe `403` ao tentar consultar logs.

7. Cenário negativo/erro esperado.

Uma resposta que inclua `cosmeticSummary`, `storageKey` ou dados completos do relatório deve ser rejeitada em revisão.

### Passo 5 - Confirmar minimização dos DTOs de auditoria

1. Objetivo funcional do passo no contexto da app.

Provar que a auditoria cumpre `RF44` sem transformar logs, alertas ou UI administrativa numa cópia de dados biométricos sensíveis.

2. Ficheiros envolvidos:
    - REVER: `apps/api/src/services/biometric-audit.service.js`
    - REVER: `apps/api/src/controllers/biometric-audit.controller.js`
    - REVER: `apps/web/src/pages/BiometricAuditPage.jsx`
    - LOCALIZAÇÃO: DTOs devolvidos por `toAuditLogDto`, `listBiometricAccessLogs`, `listBiometricAccessAlerts` e renderização da página.

3. Instruções do que fazer.

Confirma que cada resposta contém apenas metadados auditáveis: identificador do evento, ator, role, utilizador afetado, ação, tipo de recurso, resultado, motivo controlado, estado de alerta e data. Não devolvas fotografia, `storageKey`, path interno, relatório completo, cookies, tokens, `passwordHash` ou resumo cosmético.

4. Código completo, correto e integrado com a app final.

```bash
rg -n "storageKey|cosmeticSummary|passwordHash|orelle_session|cookie|token" apps/api/src/services/biometric-audit.service.js apps/api/src/controllers/biometric-audit.controller.js apps/web/src/pages/BiometricAuditPage.jsx
```

5. Explicação do código.

Este comando é uma verificação estática da fronteira de minimização. Ele não substitui os testes HTTP, mas ajuda a encontrar regressões óbvias antes de executar a suite. Se aparecer uma ocorrência, o aluno deve confirmar se é comentário defensivo, teste negativo ou fuga real. Em respostas de produção, estes campos não podem sair porque `RF44` exige auditoria de acesso, não exposição dos dados auditados.

6. Validação do passo.

A pesquisa não deve encontrar campos sensíveis nos DTOs de resposta nem na página de auditoria. Ocorrências em testes negativos são aceitáveis apenas quando provam que esses campos não chegam à resposta final.

7. Cenário negativo/erro esperado.

Se `BiometricAuditPage` renderizar `storageKey` ou `cosmeticSummary`, a correção esperada é remover o campo do DTO/service e manter só metadados auditáveis.

### Passo 6 - Testar auditoria e alertas

1. Objetivo funcional do passo no contexto da app.

Garantir que os acessos são registados, os alertas aparecem e a consulta é restrita.

2. Ficheiros envolvidos:
    - CRIAR: `apps/api/tests/mf5.biometric-audit.test.js`
    - EDITAR: `apps/api/tests/privacy-requests.replset.integration.test.js`
    - LOCALIZAÇÃO: ficheiro completo de testes.

3. Instruções do que fazer.

Testa criação de evento, alerta por volume, listagem administrativa minimizada e bloqueio de consultor na leitura de logs. No replica set efémero, injeta falha no insert append-only e prova os dois limites atómicos: a rejeição regressa a `pending`; uma aprovação/retry nunca fica `completed` sem o evento `allowed` do mesmo commit. Executar cenarios negativos obrigatorios (minimo 2): tentativa sem role de administrador e falha de auditoria durante decisão.

4. Código completo, correto e integrado com a app final.

```js
// apps/api/tests/mf5.biometric-audit.test.js
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createApp } from "../src/app.js";
import { ROLES } from "../src/constants/roles.js";
import { BiometricAccessLog } from "../src/models/biometric-access-log.model.js";
import { User } from "../src/models/user.model.js";
import { createSessionToken } from "../src/services/session.service.js";
import {
    BIOMETRIC_AUDIT_ACTIONS,
    recordBiometricAccess,
} from "../src/services/biometric-audit.service.js";

vi.mock("../src/models/biometric-access-log.model.js", () => ({
    BIOMETRIC_AUDIT_ACTIONS: {
        LIST_REQUESTS: "list_requests",
        DECIDE_REQUEST: "decide_request",
        VIEW_AUDIT: "view_audit",
        VIEW_RESOURCE: "view_resource",
    },
    BIOMETRIC_AUDIT_RESULTS: {
        ALLOWED: "allowed",
        DENIED: "denied",
    },
    BiometricAccessLog: {
        countDocuments: vi.fn(),
        create: vi.fn(),
        find: vi.fn(),
    },
}));

vi.mock("../src/models/user.model.js", () => ({
    User: {
        findById: vi.fn(),
    },
}));

const adminId = "665f00000000000000000011";
const consultantId = "665f00000000000000000012";
const subjectUserId = "665f00000000000000000013";

/**
 * Cria objeto com `toString`, igual ao que os DTOs recebem de ObjectId.
 *
 * @function objectId
 * @param {string} id - Identificador textual.
 * @returns {{toString: () => string}} ObjectId mínimo para testes.
 */
function objectId(id) {
    return {
        toString() {
            return id;
        },
    };
}

/**
 * Cria cookie de sessão igual ao usado pela API real.
 *
 * @function cookieFor
 * @param {string} role - Role autenticada.
 * @param {string} id - ID do utilizador autenticado.
 * @returns {string[]} Header Cookie para Supertest.
 */
function cookieFor(role = ROLES.ADMIN, id = adminId) {
    const token = createSessionToken({
        id,
        email: `${id}@orelle.test`,
        role,
    });

    return [`orelle_session=${token}`];
}

/**
 * Simula a conta persistida consultada pelo middleware `requireAuth`.
 *
 * @function mockSessionAccount
 * @param {string} role - Role guardada na base de dados.
 * @returns {void}
 */
function mockSessionAccount(role = ROLES.ADMIN) {
    User.findById.mockReturnValue({
        // A role persistida confirma que a autorização não depende só do token enviado.
        select: vi.fn().mockResolvedValue({
            role,
            isActive: true,
            accountStatus: "active",
        }),
    });
}

/**
 * Simula query Mongoose `sort().limit()` usada pela listagem.
 *
 * @function querySortLimit
 * @param {object[]} result - Documentos devolvidos pela query.
 * @returns {object} Query encadeável.
 */
function querySortLimit(result) {
    return {
        sort: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue(result),
    };
}

describe("MF5 - auditoria biométrica", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("regista evento minimizado e assinala alerta por volume", async () => {
        BiometricAccessLog.countDocuments.mockResolvedValue(10);
        BiometricAccessLog.create.mockImplementation(async (payload) => ({
            _id: objectId("audit-log-1"),
            createdAt: new Date("2026-06-19T10:00:00.000Z"),
            ...payload,
            actorId: objectId(payload.actorId),
            subjectUserId: objectId(payload.subjectUserId),
        }));

        const log = await recordBiometricAccess({
            actorId: adminId,
            actorRole: ROLES.ADMIN,
            subjectUserId,
            action: BIOMETRIC_AUDIT_ACTIONS.VIEW_RESOURCE,
            resourceType: "report",
            resourceId: "report-1",
            reason: "Revisão administrativa autorizada.",
        });

        expect(log.action).toBe(BIOMETRIC_AUDIT_ACTIONS.VIEW_RESOURCE);
        expect(log.resourceType).toBe("report");
        expect(log.alertRaised).toBe(true);
        // A resposta de auditoria é minimizada para provar que o log não virou cópia do relatório.
        expect(JSON.stringify(log)).not.toContain("storageKey");
        expect(JSON.stringify(log)).not.toContain("cosmeticSummary");
    });

    it("lista logs e alertas apenas para administrador", async () => {
        const app = createApp();
        mockSessionAccount(ROLES.ADMIN);
        BiometricAccessLog.find.mockImplementation((filter = {}) => {
            const result = [
                {
                    _id: objectId("audit-log-2"),
                    actorId: objectId(adminId),
                    actorRole: ROLES.ADMIN,
                    subjectUserId: objectId(subjectUserId),
                    action: BIOMETRIC_AUDIT_ACTIONS.VIEW_AUDIT,
                    resourceType: filter.alertRaised ? "audit" : "request",
                    resourceId: "audit-resource-1",
                    result: "allowed",
                    reason: "Consulta administrativa.",
                    alertRaised: Boolean(filter.alertRaised),
                    createdAt: new Date("2026-06-19T10:05:00.000Z"),
                    storageKey: "/private/nao-deve-sair.png",
                    cosmeticSummary: "Resumo que não deve sair.",
                },
            ];

            // O service deve remover campos extra antes de responder ao frontend.
            return querySortLimit(result);
        });

        const logs = await request(app)
            .get("/api/admin/biometric-audit/logs")
            .set("Cookie", cookieFor(ROLES.ADMIN));
        const alerts = await request(app)
            .get("/api/admin/biometric-audit/alerts")
            .set("Cookie", cookieFor(ROLES.ADMIN));

        expect(logs.status).toBe(200);
        expect(alerts.status).toBe(200);
        expect(JSON.stringify(logs.body)).not.toContain("storageKey");
        expect(JSON.stringify(logs.body)).not.toContain("cosmeticSummary");
        expect(alerts.body.alerts[0].alertRaised).toBe(true);
    });

    it("bloqueia consultor na leitura completa da auditoria", async () => {
        const app = createApp();
        mockSessionAccount(ROLES.CONSULTOR);

        const response = await request(app)
            .get("/api/admin/biometric-audit/logs")
            .set("Cookie", cookieFor(ROLES.CONSULTOR, consultantId));

        // Consultores só geram eventos no fluxo separado de revisão cosmética/grant; a auditoria global é administrativa.
        expect(response.status).toBe(403);
    });
});
```

No teste de integração com `MongoMemoryReplSet`, acrescenta a failure injection abaixo dentro do `describe` já existente. Aqui não se mocka a transação: só o insert do audit é forçado a falhar.

```js
// apps/api/tests/privacy-requests.replset.integration.test.js
it("faz rollback da rejeição quando o audit append-only falha", async () => {
    const request = await BiometricDataRequest.create({
        requesterId: new mongoose.Types.ObjectId(),
        scope: "biometric",
        action: "delete",
        resources: ["reports"],
        reason: "Pedido com failure injection de audit.",
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
            decideBiometricDataRequest(request._id.toString(), actor, {
                decision: "rejected",
                decisionReason: "Rejeição exige audit atómico.",
            }),
        ).rejects.toThrow("falha-injetada-audit-rejeicao");
    } finally {
        auditSpy.mockRestore();
    }

    // A mutação e o ALLOWED abortam juntos; o DENIED da tentativa falhada é separado.
    expect(await BiometricDataRequest.findById(request._id).lean()).toMatchObject({
        status: "pending",
        reviewerId: null,
    });
    expect(await BiometricAccessLog.countDocuments({
        resourceId: request._id.toString(),
        result: "allowed",
    })).toBe(0);

    await expect(
        decideBiometricDataRequest(request._id.toString(), actor, {
            decision: "rejected",
            decisionReason: "Rejeição confirmada no retry.",
        }),
    ).resolves.toMatchObject({ status: "rejected" });
    expect(await BiometricAccessLog.countDocuments({
        resourceId: request._id.toString(),
        result: "allowed",
    })).toBe(1);
});

it("não confirma aprovação sem audit e o retry conclui uma única vez", async () => {
    const fixture = await createPrivacyFixture("approval-audit-rollback");
    const actor = {
        id: new mongoose.Types.ObjectId().toString(),
        role: "administrador",
    };
    const auditSpy = vi
        .spyOn(BiometricAccessLog, "create")
        .mockRejectedValueOnce(new Error("falha-injetada-audit-aprovacao"));

    try {
        await expect(
            decideBiometricDataRequest(fixture.request._id.toString(), actor, {
                decision: "approved",
                decisionReason: "Aprovação exige audit atómico.",
            }),
        ).rejects.toThrow("falha-injetada-audit-aprovacao");
    } finally {
        auditSpy.mockRestore();
    }

    expect(await BiometricDataRequest.findById(fixture.request._id).lean())
        .toMatchObject({ status: "failed", completedAt: null });
    expect(await BiometricAccessLog.countDocuments({
        resourceId: fixture.request._id.toString(),
        result: "allowed",
    })).toBe(0);

    await expect(
        retryBiometricDataRequest(fixture.request._id.toString(), actor, {
            decisionReason: "Retry depois da indisponibilidade do audit.",
        }),
    ).resolves.toMatchObject({ status: "completed", attempts: 2 });
    expect(await BiometricAccessLog.countDocuments({
        resourceId: fixture.request._id.toString(),
        result: "allowed",
    })).toBe(1);
});
```

5. Explicação do código.

O teste unitário valida o contrato central: guardar metadados sem copiar dados biométricos. A integração prova a propriedade que mocks não conseguem demonstrar: decisão e evento `allowed` usam a mesma sessão MongoDB. Se o audit falhar, a rejeição faz rollback para `pending`; a aprovação não fica `completed` e o retry volta a concluir com exatamente um evento de sucesso. O evento `denied` da tentativa falhada pode persistir fora da transação, mas nunca conta como prova de uma decisão aplicada.

6. Validação do passo.

Executa `npm --prefix apps/api test -- mf5.biometric-audit.test.js privacy-requests.replset.integration.test.js` e confirma: alerta por volume, `403` para consultor, ausência de dados sensíveis, rollback de rejeição, aprovação sem falso `completed` e retry com um único `allowed`. Depois executa a suite integral.

7. Cenário negativo/erro esperado.

Se `JSON.stringify(log)` contiver texto de relatório, o teste deve falhar.

#### Expected results

- Acesso administrativo a pedidos biométricos cria evento de auditoria.
- `GET /api/admin/biometric-audit/logs` devolve logs minimizados só a administrador.
- `GET /api/admin/biometric-audit/alerts` devolve eventos com `alertRaised=true`.
- Consultor sem role admin recebe `403` na leitura de auditoria completa.
- Logs não contêm imagens, paths internos, cookies, tokens ou relatório completo.
- Rejeição, conclusão de aprovação e conclusão de retry gravam o evento `allowed` na mesma transação da decisão.
- Falha injetada no audit faz rollback da rejeição e impede falso `completed`; o retry idempotente pode concluir depois.

## Criterios de aceite

- Todos os acessos sensíveis definidos neste BK geram evento.
- `recordBiometricAccess(event, { session })` participa na sessão da mutação quando o evento prova uma decisão aplicada.
- Evento identifica ator, role, sujeito, ação, recurso e resultado.
- Alertas são calculados por volume recente do ator.
- Auditoria completa é visível apenas a administrador.
- O guia tem 6 passos, com minimização de DTOs separada dos testes HTTP.
- Cenarios negativos concluidos: minimo `2` com resultado controlado.
- Evidência de testes por camada inclui service, HTTP admin, autorização e minimização de resposta.

#### Validação final

- Confirmar que `recordBiometricAccess` é chamado nos services que tratam pedidos biométricos.
- Confirmar que `BiometricAccessLog` não guarda dados biométricos brutos.
- Executar `npm --prefix apps/api test`.
- Confirmar que todos os paths pedagógicos do guia começam por `apps/api/` ou `apps/web/`.
- [ ] Negativos: minimo `2` cenarios controlados com `403` e ausência de dados sensíveis na resposta.

### Matriz mínima de testes por prioridade

| Prioridade | Camadas obrigatórias | Evidência esperada |
| --- | --- | --- |
| `P1` | Service + integration HTTP + 2 negativos | Output dos testes com evento de auditoria, alerta por volume, `403` para consultor e resposta sem `storageKey`/`cosmeticSummary`. |
| `P2` | Revisão estática de minimização | Pesquisa textual sem paths internos, imagens, cookies, tokens ou relatório completo no DTO. |
| `P3` | Smoke manual do painel | Print ou nota de defesa com alertas e eventos recentes sem dados biométricos brutos. |

## Evidence para PR/defesa

- Output de teste com evento de auditoria criado.
- Exemplo de resposta `/api/admin/biometric-audit/logs` sem dados sensíveis.
- Exemplo de alerta por volume recente.
- Prova de `403` para role não autorizada.

#### Handoff

`BK-MF5-05` deve usar estes estados e mensagens na UI sem quebrar responsividade. `MF6` e `MF7` podem reforçar performance, encriptação e consentimento mantendo este modelo de auditoria minimizada.

#### Changelog

- `2026-07-10`: decisão de privacidade e audit `allowed` tornados um único limite transacional em rejeição, aprovação e retry; adicionadas failure injections para rollback e recuperação idempotente.
- `2026-07-10`: paths pedagógicos normalizados para a estrutura pública `apps/api/` e `apps/web/`.
- `2026-06-20`: acrescentados campos core dual no header e passo 5 autónomo para minimização de DTOs, fechando a granularidade P1 do guia.
- `2026-06-18`: guia reescrito para RF44 com modelo de auditoria, service de alertas, integração com pedidos biométricos, endpoints admin, UI e testes.
