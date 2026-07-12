# BK-MF7-01 - Consentimento v2 e propósitos separados para consulta OpenAI

## Header
- `doc_id`: `GUIA-BK-MF7-01`
- `bk_id`: `BK-MF7-01`
- `macro`: `MF7`
- `owner`: `Bruna`
- `apoio`: `Izelicks`
- `prioridade`: `P0`
- `estado`: `TODO`
- `esforco`: `M`
- `dependencias`: `-`
- `rf_rnf`: `RNF12`
- `fase_documental`: `Fase 3`
- `sprint`: `S11-S12`
- `core_or_reforco`: `Reforco`
- `classe_core_dual`: `CORE-HIBRIDO`
- `eixo_primario`: `ConfiancaConversao`
- `kpi_primario`: `add_to_cart_recomendado`
- `kpi_secundario`: `retencao_fluxo_ia_30d`
- `proximo_bk`: `BK-MF7-02`
- `guia_path`: `docs/planificacao/guias-bk/MF7/BK-MF7-01-consentimento-explicito-para-analise-facial-rgpd.md`
- `last_updated`: `2026-07-11`

#### Objetivo

Implementar consentimento explícito e versionado antes de enviar à OpenAI fotografias, respostas/factos, perfil mínimo e catálogo filtrado. O consentimento geral da consulta é obrigatório; edição generativa e acesso do consultor às fotografias têm decisões próprias e só são pedidos quando necessários.

Revogar bloqueia novas operações e cancela jobs ainda não concluídos, mas não apaga automaticamente resultados do titular. Consentimentos antigos nunca são promovidos para v2.

#### Importância

Uma checkbox no browser não chega: pedidos HTTP podem contornar a UI. O backend autenticado valida notice, propósitos, ownership e estado imediatamente antes de cada operação sensível. Esta separação permite explicar ao cliente exatamente que dados saem da aplicação e porquê.

#### Scope-in

- Consentimento v2 obrigatório para consulta/análise OpenAI.
- Texto explícito sobre fotografias, respostas/factos, perfil mínimo e catálogo filtrado.
- Propósito de edição generativa pedido apenas ao criar preview.
- Grant fotográfico de consultor por relatório, revogável e com máximo de sete dias.
- `GET|POST|DELETE /api/face-consent` autenticados e `no-store`.
- Bloqueio/cancelamento de novas operações após revogação.
- UI de objetivos/consentimento/fotos sem IDs técnicos.

#### Scope-out

- Não eliminar dados ao revogar; usar os pedidos de privacidade próprios.
- Não autorizar treino, marketing ou finalidade genérica.
- Não tornar a revisão textual dependente do acesso fotográfico.
- Não guardar fotografia, resposta ou prompt no documento de consentimento.

#### Estado antes e depois

- Antes: pode existir consentimento facial antigo sem aviso OpenAI v2.
- Depois: cada operação sensível prova propósito, notice atual e titular; decisões antigas ficam arquivadas e exigem nova aceitação.

#### Pre-requisitos

- Sessão opaca/CSRF e `requireAuth`.
- Upload frontal + perfil com armazenamento cifrado.
- `RNF12`, `RNF25`, `RF13`, `RF14`, `RF23` e `RF45`.

#### Glossário

- Notice version: versão do texto apresentado ao titular.
- Propósito: uso específico autorizado.
- Revogação: decisão que impede trabalho futuro, sem equivaler a apagamento.
- Grant: autorização limitada a um relatório e a uma janela temporal.
- Ownership: titular derivado da sessão, nunca do body.

#### Conceitos teóricos essenciais

Consentimento e autorização são verificações diferentes. O cliente pode ter consentido o processamento e ainda assim não ser dono do relatório pedido. Ambas têm de passar. A decisão é revalidada no momento do provider porque pode ser revogada enquanto um job aguarda na fila.

#### Arquitetura do BK

- Modelo: `apps/api/src/models/face-consent.model.js`.
- Constantes: `apps/api/src/constants/face-consent.js`.
- Service/middleware: consentimento, jobs e upload facial.
- API: `GET|POST|DELETE /api/face-consent`.
- Preview: `POST /api/face-reports/:reportId/makeup-simulations`.
- Grant opcional: `POST /api/face-reports/:reportId/review-request` com `grantPhotoAccess` e `photoAccessNoticeVersion`; revogação isolada por `DELETE /api/face-reports/:reportId/review-photo-access`.
- Frontend: `apps/web/src/features/consultation/NewConsultationPage.jsx`.

#### Ficheiros a criar/editar/rever

- EDITAR: `apps/api/src/constants/face-consent.js`
- EDITAR: `apps/api/src/models/face-consent.model.js`
- EDITAR: `apps/api/src/services/face-photo.service.js`
- EDITAR: `apps/api/src/middlewares/face-photo-upload.middleware.js`
- EDITAR: `apps/api/src/routes/face-photo.routes.js`
- EDITAR: `apps/api/src/services/ai-job.service.js`
- EDITAR: `apps/web/src/features/consultation/NewConsultationPage.jsx`
- CRIAR/EDITAR: `apps/api/tests/face-consent.lifecycle.test.js`

#### Tutorial técnico linear

### Passo 1 - Definir propósitos e versões

1. Objetivo: criar nomes fechados controlados pelo servidor.
2. Ficheiro: `apps/api/src/constants/face-consent.js`.
3. Código:

```js
/** Finalidade fechada usada por fotos, consulta e relatórios cosméticos. */
export const FACE_ANALYSIS_CONSENT_PURPOSE = "analise_facial_cosmetica";
export const FACE_IMAGE_PROVIDER_RETENTION =
    "processamento_imediato_sem_aprendizagem_terceiros";
export const FACE_IMAGE_PURPOSE_POLICY = Object.freeze({
    purpose: FACE_ANALYSIS_CONSENT_PURPOSE,
    retention: FACE_IMAGE_PROVIDER_RETENTION,
    modelLearningAllowed: false,
});
```

Explicação do código: o browser não escolhe a finalidade nem a retenção. A versão `face-analysis-v2` é validada no boundary HTTP; a versão atual do aviso OpenAI vem de `GET /api/face-consent`/capabilities e tem de regressar no POST. Os notices `CONSULTANT_PHOTO_ACCESS_NOTICE_VERSION` e `GENERATIVE_MAKEUP_NOTICE_VERSION` pertencem a `purpose-grants.js` e só são usados quando essas ações são pedidas.

Validação: constantes partilhadas por model, validators e services.

Cenário negativo: versão antiga não satisfaz o aviso atual.

### Passo 2 - Persistir prova mínima

1. Objetivo: guardar decisão sem duplicar dados sensíveis.
2. Ficheiro: model de consentimento.
3. Campos: `userId`, `version`, `purpose`, `acceptedAt`, `revokedAt`, `externalProviderConsent` e propósitos booleanos. O provider aceite é sempre `openai` e o notice fica no subdocumento específico.

```js
const purposesSchema = new Schema({
    openAiAnalysis: { type: Boolean, required: true, default: true },
    generativeEdit: { type: Boolean, default: false },
    consultantPhotoAccess: { type: Boolean, default: false },
}, { _id: false });
```

Explicação do código: edição e fotografia do consultor começam desativadas. O grant por relatório continua noutro modelo para ter scope/expiração próprios.

Validação: índice único por utilizador e timestamps.

Cenário negativo: documento sem consentimento da consulta é inválido.

### Passo 3 - Validar a aceitação no backend

1. Objetivo: exigir decisão explícita e notice exato.
2. Ficheiro: validator de consentimento.
3. Código:

```js
const DEFAULT_FACE_CONSENT_VERSION = "face-analysis-v2";
const FACE_CONSENT_VERSION_PATTERN = /^face-analysis-v[1-9]\d{0,5}$/;

/** Normaliza apenas os campos públicos allowlisted. */
export function validateFaceConsentInput(body) {
    if (body?.accepted !== true) {
        throw new AppError(400, "Consentimento facial obrigatorio");
    }
    const version = body.version ?? DEFAULT_FACE_CONSENT_VERSION;
    if (!FACE_CONSENT_VERSION_PATTERN.test(version)) {
        throw new AppError(400, "Versao de consentimento facial invalida");
    }
    if (body.provider !== undefined && body.provider !== "openai") {
        throw new AppError(400, "Provider de consentimento invalido");
    }
    if (
        body.noticeVersion !== undefined &&
        (typeof body.noticeVersion !== "string" ||
            body.noticeVersion.trim().length < 1 ||
            body.noticeVersion.trim().length > 64)
    ) {
        throw new AppError(400, "Versao do aviso de provider invalida");
    }
    return {
        version,
        providerConsentAccepted: body.providerConsentAccepted === true,
        provider: body.provider,
        noticeVersion: body.noticeVersion?.trim(),
        generativeEditAccepted: body.generativeEditAccepted === true,
        consultantPhotoAccessAccepted:
            body.consultantPhotoAccessAccepted === true,
    };
}
```

Explicação do código: `userId` nunca vem do body. Provider e notice são allowlisted e o service exige exatamente `providerConsentAccepted: true`, `provider: "openai"` e o notice atual publicado pelo backend antes de criar `externalProviderConsent`. A UI envia ainda `version: "face-analysis-v2"`; edição generativa e fotografia do consultor começam `false` e são pedidas mais tarde nos fluxos próprios.

Validação: o POST válido usa `{ accepted: true, version: "face-analysis-v2", providerConsentAccepted: true, provider: "openai", noticeVersion }`, com `noticeVersion` obtido do backend.

Cenário negativo: `accepted: false`, provider diferente, notice ausente/desatualizado ou versão inválida devolve `400` antes de tocar em fotos.

### Passo 4 - Aceitar e revogar idempotentemente

1. Objetivo: criar/reaceitar v2 e cancelar futuro processamento na revogação.
2. Ficheiros: service de consentimento e `ai-job.service.js`.
3. Regra: aceitação atualiza timestamps e mantém propósitos opcionais `false`; revogação marca `revokedAt` e cancela jobs queued/processing na mesma transação.

```js
import { revokeFaceConsentForUser } from "../services/face-photo.service.js";

// O controller deriva o titular da sessão e delega todo o ciclo transacional.
const revokedConsent = await revokeFaceConsentForUser(req.user.id);
```

Explicação do código: não reimplementes a revogação no controller. `revokeFaceConsentForUser` aplica compare-and-set idempotente, write barrier, revoga também `externalProviderConsent`, cancela `AiJob`, revoga grants fotográficos ativos e cancela previews `queued|processing|failed_retryable` na mesma transação. A consulta própria já criada permanece legível pelo titular; eliminação física é outro fluxo.

Validação: repetir DELETE preserva o `revokedAt` original; nenhum job, grant ou preview continua ativo.

Cenário negativo: job que perdeu consentimento antes do commit não persiste resultado.

### Passo 5 - Expor GET, POST e DELETE seguros

1. Objetivo: ciclo autenticado, CSRF nas mutações e respostas sem cache.
2. Ficheiro: `apps/api/src/routes/face-photo.routes.js`.
3. Montagem:

```js
facePhotoRoutes.get("/face-consent", requireAuth, getFaceConsentController);
facePhotoRoutes.post("/face-consent", requireAuth, acceptFaceConsentController);
facePhotoRoutes.delete("/face-consent", requireAuth, revokeFaceConsentController);
```

Explicação do código: os controllers usam apenas `req.user.id` e aplicam `Cache-Control: private, no-store`.

Validação: DTO indica ativo/revogado e notice exigido sem IDs internos.

Cenário negativo: sem sessão devolve `401`; CSRF/origin inválidos bloqueiam POST/DELETE.

### Passo 6 - Guiar captura e consentimento no frontend

1. Objetivo: explicar os dados antes do upload.
2. Ficheiro: `apps/web/src/features/consultation/NewConsultationPage.jsx`.
3. UI: listar fotografias, respostas/factos, perfil mínimo e candidatos filtrados; pedir aceite antes do par frontal/perfil; nunca guardar fotos/landmarks em storage do browser.

```jsx
<label>
    <input type="checkbox" checked={accepted} onChange={onConsentChange} />
    Autorizo o envio à OpenAI das fotografias e do contexto mínimo descrito.
</label>
```

Explicação do código: a checkbox melhora compreensão, mas a decisão final continua no backend.

Validação: foco chega ao erro e o botão seguinte permanece desativado sem aceite.

Cenário negativo: reload não presume consentimento; volta a consultar a API.

### Passo 7 - Separar edição e fotografia do consultor

1. Objetivo: pedir cada uso no momento certo.
2. Ficheiros: relatório, preview e review grant.
3. Regras:
   - edição: apenas após unlock e clique explícito; revogar cancela o job/resultado aplicável;
   - consultor: grant por `reportId`, máximo sete dias, termina ao decidir/cancelar review;
   - revogar foto não cancela revisão textual.

```js
const expiresAt = new Date(Math.min(
    requestedUntil.getTime(),
    Date.now() + 7 * 24 * 60 * 60 * 1000,
));
```

Explicação do código: o limite é calculado no servidor. O consultor não recebe a fotografia na listagem/detalhe por defeito.

Validação: endpoint da foto usa `no-store` e gera audit log.

Cenário negativo: grant expirado/revogado devolve `403` sem bytes.

### Passo 8 - Provar ciclo completo

1. Objetivo: testar os três propósitos e as fronteiras de revogação.
2. Ficheiros: testes de consentimento/grants/preview.
3. Comandos:

```bash
npm --prefix apps/api test -- tests/face-consent.lifecycle.test.js tests/face-consent.replset.integration.test.js
npm --prefix apps/api test -- tests/makeup-simulation-consent.replset.integration.test.js
```

Explicação do código: usa replica set local e transport determinístico; não precisa de fotografia real nem chave OpenAI.

Validação: positivo, replay, revogação, ownership e concorrência.

Cenário negativo: consentimento antigo, acesso cruzado e revogação durante provider não persistem output.

Executar cenarios negativos obrigatorios (minimo 3): notice antigo; acesso cruzado; consentimento revogado. Acrescenta CSRF e grant expirado.

#### Expected results

- Consentimento OpenAI v2 obrigatório e verificável.
- Propósitos de imagem generativa e acesso do consultor independentes.
- Revogação cancela trabalho futuro sem fingir apagamento.
- Nenhum consentimento antigo é promovido automaticamente.

#### Critérios de aceite

- [ ] GET/POST/DELETE autenticados, `no-store` e ownership por sessão.
- [ ] Notice/propósitos versionados e DTO minimizado.
- [ ] Jobs revalidam consentimento antes e depois do provider.
- [ ] Grant por relatório com expiração máxima de sete dias.
- [ ] Evidencia de testes por camada: unit validator + integração transacional + HTTP/UI.
- [ ] Cenarios negativos concluidos: minimo `3`.

### Matriz minima de testes por prioridade

| Prioridade | Camada | Prova |
|---|---|---|
| P0 | unit | body, notice e propósitos |
| P0 | integração | aceite/revogação/jobs/grant em replica set |
| P0 | HTTP | 401, CSRF, ownership, no-store |
| P0 | frontend | explicação, foco e bloqueio sem aceite |

#### Validação final

- [ ] Negativos: minimo `3` cenarios executados e registados.
- [ ] Nenhum teste usa a base remota ou dados faciais reais.
- [ ] Link/fences e `git diff --check` verdes.

#### Evidence para PR/defesa

- DTO sanitizado antes/depois de revogar.
- Prova de cancelamento do job e 403 do grant expirado.
- Screenshot apenas da UI sem fotografia, email ou token.

#### Handoff

Entrega ao `BK-MF7-02` o estado revogado para pedidos de eliminação e ao `BK-MF8-07` a autorização v2 para envio minimizado à OpenAI.

## Bloco pedagogico

### Objetivo

Distinguir consentimento, autorização, revogação, eliminação e grant temporário.

### Pre-requisitos

- Sessões, CSRF, Mongoose, transações e formulários React.

### Erros comuns

- Confiar na checkbox sem validar no backend.
- Usar um consentimento para todas as finalidades.
- Apagar dados ao revogar sem pedido de privacidade.

### Check de compreensao

- [ ] Sei explicar por que o consultor não vê fotos por defeito.
- [ ] Sei provar que um notice antigo não é v2.

## Bloco operacional

### Entrada

Titular autenticado, notice v2 e decisão afirmativa.

### Passos

Apresentar → aceitar → revalidar → processar → revogar/cancelar quando pedido.

### Validacao

Testar ciclo e três negativos em MongoDB local isolado.

### Handoff

Estado de consentimento mínimo e auditável para consulta, privacidade e imagem.

## Criterios de aceite

- Três propósitos separados e sem promoção automática.
- Evidencia de testes por camada presente.
- Cenarios negativos concluidos: minimo `3`.

## Evidence para PR/defesa

Registar comandos/resultados sanitizados; nunca copiar fotos, cookies, PII ou URI MongoDB.

#### Changelog

- `2026-07-11`: guia reescrito para consentimento OpenAI v2, edição generativa pontual e grant fotográfico temporário por relatório.
