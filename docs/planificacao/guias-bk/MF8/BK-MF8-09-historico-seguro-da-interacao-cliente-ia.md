# BK-MF8-09 - Histórico cifrado, minimizado e retomável da consulta

## Header
- `doc_id`: `GUIA-BK-MF8-09`
- `bk_id`: `BK-MF8-09`
- `macro`: `MF8`
- `owner`: `Izelicks`
- `apoio`: `Bruna`
- `prioridade`: `P0`
- `estado`: `TODO`
- `esforco`: `M`
- `dependencias`: `BK-MF8-08, BK-MF6-07`
- `rf_rnf`: `RF47, RNF30`
- `fase_documental`: `Fase 3`
- `sprint`: `S11-S12`
- `core_or_reforco`: `Reforco`
- `classe_core_dual`: `CORE-IA`
- `eixo_primario`: `ConsultoriaInteligente`
- `kpi_primario`: `retencao_fluxo_ia_30d`
- `kpi_secundario`: `taxa_conformidade_gates`
- `proximo_bk`: `BK-MF8-10`
- `guia_path`: `docs/planificacao/guias-bk/MF8/BK-MF8-09-historico-seguro-da-interacao-cliente-ia.md`
- `last_updated`: `2026-07-11`

#### Objetivo

Implementar histórico e retoma da consulta OpenAI sem criar um dump de dados sensíveis. O cliente lista as próprias sessões em `GET /api/ai-consultation/sessions`, abre uma sessão própria pelo ID opaco da rota e retoma a sessão aberta em `GET .../current`.

Perguntas, respostas e factos derivados ficam cifrados com AAD. A listagem devolve apenas metadata; fotografias, storage keys, consent IDs, prompts internos, `userId` e conteúdo de relatórios bloqueados nunca entram no DTO. O campo opaco `id` da própria sessão é devolvido apenas para permitir navegação owner-only.

#### Importância

Histórico aumenta continuidade, mas junta dados pessoais, fotografia, decisões da OpenAI e paywall. Minimização, ownership e cifra precisam de existir desde a query até ao DOM, não apenas na base de dados.

#### Scope-in

- Guardar transcript/factos cifrados e versões/provenance necessárias.
- Listar sessões próprias com `limit` validado e metadata segura, sem cursor ou `page`.
- Obter/retomar sessão própria com `flowState` e operação corrente.
- Manter eventos internos minimizados para auditoria/handoff.
- Aplicar `private, no-store` e ownership em todos os DTOs.
- Não expor conteúdo integral de relatório antes do unlock.
- Incluir sessão/jobs/history em privacidade, erasure, export e backup.
- Criar página `/consulta/historico` sem IDs técnicos editáveis.

#### Scope-out

- Não criar uma segunda UI ou endpoint paralelo de histórico.
- Não devolver documentos Mongoose completos.
- Não guardar fotografias, payload OpenAI, prompts ou erros brutos no histórico.
- Não revelar report/recomendações bloqueadas por CSS.
- Não permitir pesquisa de sessões de outro utilizador.

#### Estado antes e depois

- Antes: a sessão pode ser retomável, mas sem contrato de listagem/minimização consolidado.
- Depois: histórico e retoma usam as rotas canónicas, cifra contextual, paywall backend e uma página acessível.

#### Pre-requisitos

- `BK-MF8-08`: sessão dinâmica e jobs.
- `BK-MF6-07`: AES-GCM contextual/AAD.
- Sessões autenticadas, `ReportUnlock` e account erasure.
- `RF47`, `RNF30`, `RNF11` e `RF15`.

#### Glossário

- Transcript: turnos ordenados de pergunta/resposta.
- Metadata: estado/data/objetivos resumidos sem conteúdo sensível.
- Envelope cifrado: ciphertext, IV/tag, `keyVersion` e `aadHash`.
- Paywall backend: exclusão do conteúdo na resposta, não ocultação visual.
- Retoma: continuar estado/job persistido depois de reload.

#### Conceitos teóricos essenciais

Cifrar não justifica guardar mais. A listagem precisa apenas de data, objetivos seguros, estado e referência pública. O detalhe pode devolver transcript próprio porque é necessário para retoma, mas continua a omitir material operacional e qualquer relatório ainda bloqueado.

#### Arquitetura do BK

- Model: `apps/api/src/models/ai-consultation-session.model.js`.
- Evento interno: `apps/api/src/models/ai-interaction-history.model.js`.
- Service: `apps/api/src/services/ai-consultation.service.js`.
- API: `GET /api/ai-consultation/sessions`, `GET .../current`, `GET .../:sessionId`.
- Frontend: `apps/web/src/features/consultation/ConsultationHistoryPage.jsx`.
- Privacidade: erasure, privacy requests, export metadata-only e backup cifrado.
- Testes: ownership, cifra, DTO, paywall, limite e reload.

#### Ficheiros a criar/editar/rever

- EDITAR: `apps/api/src/models/ai-consultation-session.model.js`
- EDITAR: `apps/api/src/models/ai-interaction-history.model.js`
- EDITAR: `apps/api/src/services/ai-consultation.service.js`
- EDITAR: `apps/api/src/controllers/ai-consultation.controller.js`
- EDITAR: `apps/api/src/routes/ai-consultation.routes.js`
- EDITAR: `apps/api/src/services/account-erasure.service.js`
- CRIAR/EDITAR: `apps/web/src/features/consultation/ConsultationHistoryPage.jsx`
- CRIAR/EDITAR: `apps/api/tests/mf8.ai-interaction-history.test.js`

#### Tutorial técnico linear

### Passo 1 - Classificar dados e fronteiras

1. Objetivo: escrever allowlists de persistência e DTO antes do código.
2. Ficheiros: model/service e teste.
3. Permitido na listagem: `id`, `schemaVersion`, `goals`, `flowState`, `status`, `reportId`, `isOpen`, `createdAt`, `updatedAt`, `completedAt` e `cancelledAt`. Permitido no detalhe próprio: transcript/factos estritamente necessários à retoma. Proibido: fotos, paths, consent IDs, prompts, `userId` e conteúdo do report bloqueado.

Explicação: implementa esta allowlist diretamente no `.select(...)` e no mapping explícito do Passo 4. Não cries uma constante desligada do serializer, porque o model pode ganhar campos sem que eles devam sair.

Validação: teste de chaves exatas no DTO.

Cenário negativo: acrescentar `userId` ou `photoIds` faz falhar o contrato.

### Passo 2 - Cifrar transcript e factos com AAD

1. Objetivo: impedir leitura direta do dump e troca entre titulares/campos.
2. Ficheiros: model/encryption service.
3. AAD inclui coleção, owner, documento e campo; o envelope guarda `keyVersion`/`aadHash`.

```js
conversation: contextualEncryptedField({
    collection: "aiconsultationsessions",
    field: "conversation",
    defaultValue: () => ({ turns: [], currentQuestion: null }),
}),
facts: contextualEncryptedField({
    collection: "aiconsultationsessions",
    field: "facts",
    defaultValue: () => ({}),
}),
```

Explicação do código: pergunta, resposta e provenance do turno ficam juntos; logs nunca recebem plaintext.

Validação: dump não contém texto da resposta e round-trip correto funciona com AAD exato.

Cenário negativo: owner/campo diferente falha autenticação AES-GCM.

### Passo 3 - Tratar o histórico auxiliar como compatibilidade

1. Objetivo: não confundir o modelo auxiliar legado com o histórico canónico da consulta v2.
2. Ficheiro: model/service de history interno.
3. O fluxo OpenAI v2 atual não cria `AiInteractionHistory`; a sessão cifrada é a fonte canónica de histórico/retoma. Preserva o modelo/service apenas para compatibilidade e contexto minimizado já existente. Se uma evolução futura o reativar, deve usar exclusivamente `recordAiInteractionHistoryEvent`, os tipos `consultation_submitted|answer_summary_ready|recommendation_context_ready` e preencher `purpose`, `safeSummary`, pelo menos um `safeSignal` não sensível e `source`, na mesma transação da entidade de origem.

Explicação: não inventes `answer_accepted` nem dupliques cada turno. O modelo auxiliar não substitui `conversation` e não deve ganhar uma rota de escrita pública.

Validação: o estado atual prova que a consulta v2 não depende deste modelo; um teste de compatibilidade recusa tipo livre, sinais vazios e `safeSummary` com PII.

Cenário negativo: integrar um evento sem consumidor/contrato explícito cria retenção adicional e deve ser recusado na revisão.

### Passo 4 - Listar sessões próprias e minimizadas

1. Objetivo: criar a fonte canónica de `/consulta/historico`.
2. Endpoint: `GET /api/ai-consultation/sessions?limit=20` (`limit` entre 1 e 50).
3. Query filtra `{ userId: req.user.id }`, seleciona apenas metadata + owner necessário para AAD e remove owner do DTO.

```js
/** Lista metadata própria; transcript e facts nunca entram nesta query pública. */
export async function listAiConsultationSessions(userId, { limit = 20 } = {}) {
    const rows = await AiConsultationSession.find({ userId, schemaVersion: 2 })
        .select("userId schemaVersion goalSelection flowState status reportId isOpen createdAt updatedAt completedAt cancelledAt")
        .sort({ createdAt: -1, _id: -1 })
        .limit(limit);
    return {
        items: rows.map((row) => ({
            id: row._id.toString(),
            schemaVersion: row.schemaVersion,
            goals: row.goalSelection,
            flowState: row.flowState,
            status: row.status,
            reportId: row.reportId?.toString() ?? null,
            isOpen: row.isOpen,
            createdAt: row.createdAt,
            updatedAt: row.updatedAt,
            completedAt: row.completedAt,
            cancelledAt: row.cancelledAt,
        })),
    };
}
```

Explicação do código: `userId` é selecionado apenas porque o AAD de `goalSelection` precisa do titular; não sai. Não se publicam `page`, cursor, `reviewStatus` ou `unlockStatus`, que não pertencem a este DTO.

Validação: `limit` validado entre 1 e 50, ordenação estável e `no-store`; não existe `page` nem cursor.

Cenário negativo: cliente A nunca recebe metadata de B.

### Passo 5 - Devolver detalhe retomável e seguro

1. Objetivo: reconstituir a conversa sem dados operacionais.
2. Endpoints: `GET .../current` e `GET .../:sessionId`.
3. DTO contém `flowState`, turns públicos, pergunta ativa, operação sanitizada e links/IDs públicos de report quando aplicável. Não contém prompt, storage key, job payload ou relatório integral bloqueado.

```js
// Reutiliza o serializer operacional central; não exponhas o documento Mongoose.
const operation = job ? toPublicAiJob(job) : null;
```

Explicação do código: erros são códigos/mensagens sanitizadas; nunca `error.stack` ou resposta OpenAI.

Validação: reload em cada flowState retoma a ação correta.

Cenário negativo: `sessionId` válido mas de outro owner devolve `404`/`403` coerente sem confirmar existência.

### Passo 6 - Aplicar o paywall no servidor

1. Objetivo: impedir fuga de relatório/recomendações por histórico/evolução.
2. Ficheiros: report access e DTO da sessão.
3. Antes do unlock, expor só teaser: objetivos/data/versão/estado review, quantidade, total elegível e depósito. Full report só quando `ReportUnlock` confirma acesso.

```js
// O service owner-only devolve teaser ou conteúdo, conforme ReportUnlock.
const report = await getFaceReportV2ForUser(req.user.id, reportId);
```

Explicação do código: conteúdo integral não chega ao DOM nem fica escondido por CSS. Histórico, recomendações, evolução e comparação reutilizam o mesmo gate.

Validação: pesquisa da resposta bloqueada não encontra findings/rotina/produtos completos.

Cenário negativo: conhecer `reportId` não contorna owner/unlock.

### Passo 7 - Criar a página `/consulta/historico`

1. Objetivo: mostrar cards resumidos e ações “Retomar”/“Ver relatório”.
2. Ficheiro: `ConsultationHistoryPage.jsx`.
3. UI usa `GET /sessions`; nunca pede ObjectId. Estado carregado permanece visível se uma ação falhar.

```jsx
<ul className="consultation-history" aria-label="Consultas anteriores">
    {items.map((item) => (
        <ConsultationHistoryCard key={item.id} consultation={item} />
    ))}
</ul>
```

Explicação do código: cada card mostra data, goals e estado; ações navegam por links emitidos/validados pela app.

Validação: teclado, foco, loading/empty/error e 320 px sem overflow.

Cenário negativo: 401/timeout preserva a lista já carregada e oferece retry.

### Passo 8 - Integrar privacidade, export e backup

1. Objetivo: não deixar dados órfãos.
2. Ficheiros: privacy requests, account erasure, export e backup.
3. Regras: cancelar jobs; eliminar/anonymizar conforme scope; export do admin apenas metadata; backup inclui coleções/índices e ciphertext, nunca o segredo de cifra. Reutiliza o domínio canónico de `account-erasure.service.js`: `AiConsultationSession`, `AiInteractionHistory`, `AiJob`, `AiConsultationReview` e os respetivos audit logs, `FaceAnalysis`, `FaceReport`, `ProductRecommendation`, `ReportUnlock`, `ReportPhotoGrant`, `MakeupSimulation`, `MakeupSimulationQuota`, fotografias e restantes dados pessoais ligados. Os bytes de fotografias/previews entram no outbox idempotente antes de apagar metadata.

Não cries uma mini-lista paralela neste guia: qualquer novo modelo pertencente ao titular deve ser acrescentado ao erasure canónico e à fixture transversal que cria todas as coleções.

Explicação: a transação elimina os documentos sequencialmente; os ficheiros privados são removidos pelo worker de outbox e o pedido só fica concluído quando não existem bytes pendentes.

Validação: eliminação deixa zero registos do titular; restore preserva ciphertext/índices.

Cenário negativo: job/file ainda presente impede marcar pedido `completed`.

### Passo 9 - Executar testes por camada

1. Objetivo: provar cifra, DTO, ownership, paywall e UI.
2. Comandos:

```bash
npm --prefix apps/api test -- tests/mf8.ai-interaction-history.test.js
npm --prefix apps/api test -- tests/report-paywall-boundaries.replset.integration.test.js
npm --prefix apps/web test -- ConsultationFlowV2.test.jsx
```

Explicação do código: usa dados sintéticos mínimos; não copia fotografias/respostas reais para fixtures.

Validação: reload/retoma, limite validado, no-store, report locked/unlocked e erasure.

Cenário negativo: acesso cruzado, AAD errado, `limit` inválido e report bloqueado falham sem conteúdo.

Executar cenarios negativos obrigatorios (minimo 3): ownership cruzado; AAD errado; tentativa de ler report bloqueado. Acrescenta `limit` inválido e erasure incompleto.

#### Expected results

- Histórico próprio, limitado, cifrado e minimizado.
- Retoma baseada no estado/job persistido.
- Conteúdo bloqueado ausente das respostas e do DOM.
- Sessões/history/jobs abrangidos por privacidade e backup.

#### Critérios de aceite

- [ ] Rotas canónicas de sessão; nenhum endpoint/UI paralelo.
- [ ] Transcript/facts cifrados com AAD e DTO por allowlist.
- [ ] Listagem metadata-only, detalhe owner-only e `no-store`.
- [ ] Paywall backend partilhado por todos os leitores derivados.
- [ ] Evidencia de testes por camada: unit cifra/DTO + integração ownership/paywall/erasure + frontend.
- [ ] Cenarios negativos concluidos: minimo `3`.

### Matriz minima de testes por prioridade

| Prioridade | Camada | Prova |
|---|---|---|
| P0 | unit | cifra/AAD, DTO e erros sanitizados |
| P0 | integração | ownership, limite, paywall, erasure/backup |
| P0 | HTTP | sessão atual/lista/detalhe e no-store |
| P0 | frontend | histórico, retoma, foco e falhas sem perda de conteúdo |

#### Validação final

- [ ] Negativos: minimo `3` cenarios executados e registados.
- [ ] Dump/log/DTO sem respostas, prompts, fotos ou IDs internos em claro.
- [ ] Relatório bloqueado ausente da payload.
- [ ] Links/fences e `git diff --check` verdes.

#### Evidence para PR/defesa

- Chaves exatas do DTO de listagem/detalhe.
- Assert de dump cifrado e acesso cruzado recusado.
- Screenshot de histórico sem PII/IDs/conteúdo bloqueado.

#### Handoff

O `BK-MF8-10` consome factos/revisões autorizados pelo backend, não um dump do histórico. A UI de relatório usa apenas o report/unlock canónico.

## Bloco pedagogico

### Objetivo

Aprender a combinar minimização, cifra, ownership e paywall numa feature de histórico.

### Pre-requisitos

- Mongoose, AES-GCM/AAD, REST pagination, React async state.

### Erros comuns

- Devolver `.toObject()` inteiro.
- Criar uma rota paralela para cada consumidor.
- Enviar relatório completo e escondê-lo com CSS.

### Check de compreensao

- [ ] Sei distinguir metadata da listagem e transcript do detalhe.
- [ ] Sei demonstrar que um ID conhecido não contorna owner/paywall.

## Bloco operacional

### Entrada

Sessões/turnos/jobs persistidos e titular autenticado.

### Passos

Filtrar owner → selecionar allowlist → decifrar só necessário → aplicar paywall → DTO/no-store → UI.

### Validacao

Testar cifra, acesso cruzado, report locked/unlocked, reload e erasure.

### Handoff

Histórico seguro e retomável para recomendação/revisão sem duplicar dados.

## Criterios de aceite

- Histórico canónico, cifrado e minimizado.
- Evidencia de testes por camada presente.
- Cenarios negativos concluidos: minimo `3`.

## Evidence para PR/defesa

Usar apenas fixtures sintéticas e outputs sanitizados; nunca transcript real, foto, cookie ou segredo.

#### Changelog

- `2026-07-11`: guia migrado para o histórico canónico das sessões OpenAI, cifra/AAD, retoma por flowState e paywall backend.
