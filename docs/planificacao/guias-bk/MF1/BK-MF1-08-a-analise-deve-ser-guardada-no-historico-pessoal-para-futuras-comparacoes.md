# BK-MF1-08 - Guardar histórico próprio sem expor relatórios bloqueados

## Header

- `doc_id`: `GUIA-BK-MF1-08`
- `bk_id`: `BK-MF1-08`
- `macro`: `MF1`
- `owner`: `Izelicks`
- `apoio`: `Bruna`
- `prioridade`: `P1`
- `estado`: `DONE`
- `esforco`: `S`
- `dependencias`: `BK-MF0-02, BK-MF1-06, BK-MF1-07`
- `rf_rnf`: `RF16`
- `fase_documental`: `Fase 1`
- `sprint`: `S03-S04`
- `core_or_reforco`: `Core`
- `proximo_bk`: `BK-MF2-01`
- `guia_path`: `docs/planificacao/guias-bk/MF1/BK-MF1-08-a-analise-deve-ser-guardada-no-historico-pessoal-para-futuras-comparacoes.md`
- `last_updated`: `2026-07-11`

> **Contrato de acesso:** o histórico pertence ao utilizador autenticado e respeita o mesmo paywall do relatório. Um relatório bloqueado aparece apenas como teaser; análises, recomendações, insights, evolução e comparação não podem servir de atalho para o conteúdo protegido.

## Contexto do BK

A sessão de consulta já guarda objetivos, fotografias usadas, transcript, análise, relatório e revisões. Este BK não cria uma cópia mutável desses dados: expõe uma projeção histórica segura e liga cada entrada ao respetivo relatório versionado.

## Objetivo

Permitir ao utilizador consultar e retomar as suas sessões anteriores, mantendo snapshots históricos, ownership e a fronteira locked/unlocked em todas as superfícies derivadas.

## Importância

Um paywall só é real se todas as rotas derivadas o respeitarem. Se o histórico devolvesse findings, rotina ou recomendações de um relatório bloqueado, seria possível contornar o desbloqueio sem abrir a página do relatório.

## Scope-in

- Listar sessões próprias com `limit` validado e estados públicos, sem cursor/`page`.
- Retomar uma sessão aberta pelo `flowState` do backend.
- Mostrar teaser de relatórios bloqueados.
- Mostrar conteúdo completo apenas quando existe `ReportUnlock` válido.
- Preservar snapshot histórico e mostrar disponibilidade atual separadamente.
- Aplicar ownership também a evolução, comparação, recomendações e insights.
- Integrar eliminação de conta, privacidade, export e backup.

## Scope-out

- Não aceitar `userId` por query/body.
- Não devolver bytes das fotografias no histórico.
- Não usar CSS para esconder conteúdo protegido.
- Não recalcular recomendações, preços ou depósito ao listar histórico.
- Não expor relatórios de outro utilizador, mesmo conhecendo o `reportId`.

## Pré-requisitos

- Sessões e relatórios v2 de `BK-MF1-06`/`BK-MF1-07`.
- Autenticação por sessão e ownership nos services.
- `ReportUnlock` como fonte de verdade do acesso.
- Cifra contextual disponível para dados sensíveis.

## Glossário

- **Snapshot histórico:** valores fixados no momento do relatório/freeze.
- **Disponibilidade atual:** stock e estado atual do produto, mostrado sem alterar o snapshot.
- **Projeção:** DTO criado para uma finalidade e nível de acesso concretos.
- **Boundary de paywall:** regra comum aplicada antes de descifrar/devolver conteúdo.

## Conceitos teóricos

Guardar histórico não significa duplicar todos os documentos. A sessão liga análise, relatório, revisão e jobs; o DTO compõe apenas os campos necessários à lista. O detalhe é obtido pela rota canónica do relatório, que decide entre teaser e conteúdo completo.

O backend deve verificar `userId` em cada consulta e só depois procurar o unlock. O frontend nunca é a autoridade. Mesmo uma página secundária — evolução, comparação, recomendações ou insights do consultor — tem de filtrar análises sem relatório desbloqueado.

O histórico também distingue passado e presente. Nome, preço, variante e stock do relatório vêm do snapshot congelado. Um card pode ainda consultar disponibilidade atual, mas deve rotular os dois valores e nunca reescrever o passado.

## Arquitetura do BK

- `GET /api/ai-consultation/sessions`
- `GET /api/ai-consultation/sessions/current`
- `GET /api/ai-consultation/sessions/:sessionId`
- `GET /api/face-reports/:reportId`
- `ConsultationHistoryPage` + `ConsultationDashboardPage`
- boundary comum `ReportUnlock` antes de derivados sensíveis

## Ficheiros a criar/editar/rever

- EDITAR: `apps/api/src/services/ai-consultation.service.js`
- EDITAR: `apps/api/src/services/skin-history.service.js`
- EDITAR: `apps/api/src/services/report-analysis-access.service.js`
- EDITAR: `apps/api/src/services/skin-evolution.service.js`
- EDITAR: `apps/api/src/services/skin-comparison.service.js`
- EDITAR: `apps/api/src/services/recommendation.service.js`
- EDITAR: `apps/api/src/routes/ai-consultation.routes.js`
- EDITAR: `apps/web/src/features/consultation/ConsultationHistoryPage.jsx`
- EDITAR: `apps/web/src/features/consultation/ConsultationDashboardPage.jsx`
- EDITAR: `apps/web/src/features/consultation/consultationApi.js`

## Bloco pedagogico

### Objetivo

Compreender como ownership, paywall e imutabilidade atravessam várias páginas sem duplicar regras inconsistentes.

### Pre-requisitos

- Saber filtrar documentos por `userId` no service.
- Entender a diferença entre listagem e detalhe.
- Conhecer o contrato locked/unlocked de `BK-MF1-07`.

### Erros comuns

- Buscar por `_id` e só depois comparar o utilizador no controller.
- Devolver findings num card de histórico bloqueado.
- Tratar relatório como desbloqueado porque tem estado `frozen`.
- Misturar preço atual no snapshot histórico.
- Colocar transcript ou respostas no `localStorage`.

### Check de compreensao

- Porque é que `frozen_locked` não significa “conteúdo legível”?
- Que páginas derivadas podem contornar o paywall se não forem filtradas?
- Porque é que o stock atual não deve alterar o relatório antigo?

### Tempo estimado

`S` — DTOs, filtros de acesso e frontend.

## Bloco operacional

### Entrada

- Sessão autenticada.
- Query opcional `limit` entre 1 e 50; não aceita `page`, cursor nem `userId`.

### Saída

- Lista sanitizada das sessões próprias.
- Link para retomar a consulta aberta ou abrir o relatório.
- Teaser ou conteúdo completo de acordo com o unlock.

### Passos

Executar cenarios negativos obrigatorios (minimo 2).

#### Passo 1 - Definir o DTO da lista

Inclui ID da sessão, objetivos, datas, `flowState`, estado de operação, `reportId` e estado locked/unlocked. Exclui fotografias, findings, respostas, prompts e dados cifrados.

#### Passo 2 - Filtrar sempre pelo titular

Constrói a query com `{ userId: req.user.id }`. Não reutilizes um service administrativo nem aceites utilizador por parâmetro.

#### Passo 3 - Obter o estado atual agregado

`GET .../sessions/current` permite ao dashboard decidir entre “Nova consulta” e “Retomar”. A fonte é o backend, não um estado React antigo.

#### Passo 4 - Aplicar o boundary de unlock

Antes de projetar análise, relatório, recomendação, evolução, comparação ou insight, confirma a existência do unlock do mesmo relatório e titular.

```js
async function canReadFullReport({ reportId, userId }) {
    return Boolean(await ReportUnlock.exists({ reportId, userId, status: "unlocked" }));
}
```

#### Passo 5 - Projetar teaser ou detalhe

Sem unlock, usa o serializer locked de `BK-MF1-07`. Com unlock, descifra apenas os campos necessários ao detalhe pedido e aplica `Cache-Control: private, no-store`.

#### Passo 6 - Mostrar snapshot e estado atual

No card do produto, apresenta “No relatório” e “Disponibilidade atual” separadamente. Uma alteração atual nunca muda preço, variante ou stock congelados.

#### Passo 7 - Integrar `/consulta/historico`

Usa links para `/consulta/relatorios/:reportId`. Apresenta estados vazios, loading e erro sem apagar a lista já carregada. O foco é movido para o título após navegação.

#### Passo 8 - Integrar lifecycle de privacidade

Inclui sessões, jobs, relatórios, grants e imagens derivadas no export, pedido de eliminação e backup cifrado. A eliminação de conta remove ligações e bytes privados.

### Cenarios negativos recomendados

- Sessão sem autenticação: `401`.
- Session/report ID de outro titular: `404`/`403` sem leak de existência.
- Relatório locked: findings/rotina/recomendações ausentes.
- Evolução/comparação tenta usar análise locked: entrada filtrada.
- Produto alterado depois do freeze: snapshot permanece igual.
- Falha de disponibilidade atual: histórico continua visível.

### Validacao

- [ ] Negativos: minimo 2 cenarios materiais executados.
- Gate documental: falhar se `negativos < 2`.
- Testes de ownership em lista e detalhe.
- Testes do paywall em histórico, evolução, comparação, recomendações e insights.
- Teste do DTO locked a provar ausência de conteúdo.
- Teste frontend de estado vazio, reload e erro parcial.
- Teste de export/eliminação com novas coleções.

### Matriz minima de testes por prioridade

| Prioridade | Cenário | Resultado esperado |
|---|---|---|
| P0 | utilizador tenta relatório alheio | conteúdo não é revelado |
| P0 | relatório locked em superfície derivada | análise/recomendações ausentes |
| P0 | relatório unlocked | conteúdo próprio disponível com `no-store` |
| P1 | preço/stock atual muda | snapshot histórico não muda |
| P1 | reload de sessão aberta | destino calculado pelo `flowState` |
| P1 | falha na disponibilidade atual | conteúdo histórico preservado |

### Evidencia de testes por camada

- Unit: serializers locked/unlocked e seleção de destino.
- Integração: ownership e filtro de análises derivadas.
- Frontend/E2E: histórico, retoma, erro parcial e snapshots.
- Privacidade: export, eliminação e backup das novas entidades.

### Handoff

`BK-MF2-01` pode calcular evolução apenas com análises pertencentes a relatórios desbloqueados. `BK-MF2-02` usa os snapshots congelados para apresentar recomendações históricas.

## Expected results

- Histórico paginado e pertencente ao titular.
- Retoma de sessão baseada no backend.
- Nenhum caminho lateral expõe relatório locked.
- Snapshots históricos permanecem imutáveis.
- Privacidade e backup abrangem os novos dados.

## Snippet tecnico aplicavel

O helper do Passo 4 ilustra o boundary. Na aplicação final, reutiliza um service comum e evita repetir a query de unlock em cada controller.

## Criterios de aceite

- Cenarios negativos concluidos: minimo 2.
- Todos os endpoints usam o utilizador autenticado.
- A lista não contém dados sensíveis nem bytes.
- Um relatório bloqueado só devolve teaser.
- Evolução, comparação, recomendações e insights respeitam o unlock.
- Relatório histórico distingue snapshot de disponibilidade atual.
- Respostas e fotografias nunca vão para storage do browser.
- Export, eliminação e backup incluem o lifecycle completo.

## Validação final

Executa testes focais de paywall/ownership, testes frontend, build e pesquisa estática por conteúdo sensível em serializers de listagem.

## Evidence para PR/defesa

- DTO de lista sanitizado.
- Prova negativa de acesso a relatório alheio.
- Prova de que relatório locked não aparece em derivados.
- Estado antes/depois de alteração de stock sem mudar snapshot.

## Handoff

As recomendações de `BK-MF2-02` são parte do relatório versionado. Não devem ser regeneradas por uma rota independente ao abrir o histórico.

## Changelog

- `2026-05-31`: guia inicial de histórico pessoal.
- `2026-07-11`: histórico alinhado com sessões v2, snapshots e boundary transversal locked/unlocked.
