# BK-MF8-12 — Insights e correções do consultor visíveis para o cliente

## Header

- `doc_id`: `GUIA-BK-MF8-12`
- `bk_id`: `BK-MF8-12`
- `macro`: `MF8`
- `owner`: `Bruna`
- `apoio`: `Aline`
- `prioridade`: `P1`
- `estado`: `TODO`
- `esforco`: `S`
- `dependencias`: `BK-MF8-11`
- `rf_rnf`: `RF46`
- `fase_documental`: `Fase 3`
- `sprint`: `S12`
- `core_or_reforco`: `Core`
- `proximo_bk`: `BK-MF8-13`
- `guia_path`: `docs/planificacao/guias-bk/MF8/BK-MF8-12-insights-correcoes-do-consultor-visiveis-para-o-cliente.md`
- `last_updated`: `2026-07-11`

> **Contrato OpenAI-only vigente:** o cliente consulta uma única versão efetiva dentro do relatório v2. Não existe uma segunda página de insights nem uma revisão por recomendação. Antes do desbloqueio, a API entrega apenas o teaser e o estado da revisão; depois do pagamento simulado, entrega `machineResult` com o `humanOverride` público aplicado, mantendo ambas as origens identificáveis.

#### Objetivo

Mostrar ao cliente, no relatório e no histórico da consulta, quais observações vieram da OpenAI, quais foram ajustadas por um consultor e qual versão ficou congelada.

#### Importância

Uma correção humana só cria confiança se for compreensível e não expuser notas internas. A interface precisa distinguir provenance sem obrigar o utilizador a conhecer IDs, modelos de dados ou páginas administrativas.

#### Scope-in

- Resolver a versão efetiva do relatório.
- Mostrar estado de revisão no teaser.
- Mostrar nota pública, rotina e produtos ajustados depois do desbloqueio.
- Manter `machineResult` disponível para auditoria, sem duplicar conteúdo na UI.
- Encaminhar `needs_clarification` para a conversa ativa.
- Mostrar snapshots históricos e disponibilidade atual em campos separados.
- Aplicar ownership em todos os pedidos.

#### Scope-out

- Não expor `internalNote`, IDs técnicos ou identidade desnecessária do consultor.
- Não enviar o conteúdo completo e escondê-lo por CSS.
- Não recalcular o depósito depois de congelar.
- Não criar um endpoint público que aceite `userId`.
- Não permitir editar a versão congelada.

#### Estado antes e depois

- Antes: insights podiam existir numa página independente e sem relação clara com o relatório pago.
- Depois: o relatório é a fonte única; a proveniência humana aparece na secção afetada e o histórico aponta para a versão congelada.

#### Pre-requisitos

- Relatório v2 gerado.
- Revisão ausente, aprovada ou ajustada; pedidos pendentes não podem ser finalizados.
- Snapshot de produtos e preços disponível.
- Cliente autenticado e dono do relatório.

#### Glossário

- **Versão efetiva:** conteúdo automático com o override humano público aplicado.
- **Provenance:** provider, modelo, prompts/schemas e estado da revisão.
- **Conteúdo público:** texto aprovado para o cliente, sem notas internas.
- **Disponibilidade atual:** stock consultado agora, separado do snapshot histórico.

#### Conceitos teóricos essenciais

O backend decide o que pode ser publicado. O frontend não recebe notas internas para depois as esconder. A resposta bloqueada é estruturalmente diferente da resposta desbloqueada.

Um override é uma camada, não uma mutação destrutiva. Isto permite explicar numa defesa que a OpenAI produziu uma versão, o consultor alterou elementos concretos e o `contentHash` identifica exatamente o resultado final.

#### Arquitetura do BK

1. `GET /api/face-reports/:reportId` valida ownership.
2. O service consulta estado de revisão, freeze e unlock.
3. Se bloqueado, devolve apenas teaser e ações permitidas.
4. Se desbloqueado, devolve a versão efetiva e provenance pública.
5. `/consulta/historico` lista metadados e liga ao relatório, sem pedir IDs ao utilizador.
6. `needs_clarification` liga a `/consulta/ativa`.

#### Ficheiros a criar/editar/rever

- REVER: `apps/api/src/services/report-access.service.js`
- REVER: `apps/api/src/services/face-report.service.js`
- REVER: `apps/api/src/controllers/face-report.controller.js`
- REVER: `apps/api/src/routes/face-report.routes.js`
- REVER: `apps/web/src/features/consultation/ConsultationReportPage.jsx`
- REVER: `apps/web/src/features/consultation/ConsultationHistoryPage.jsx`
- REVER: `apps/web/src/features/consultation/consultationModel.js`
- CRIAR/REVER: testes de DTO, ownership, paywall e apresentação.

#### Tutorial técnico linear

### Passo 1 - Definir DTO bloqueado e desbloqueado

O DTO bloqueado contém objetivos, data, versão, estado da revisão, número de produtos, total elegível e depósito. O desbloqueado acrescenta o relatório completo, snapshots, versão efetiva e provenance.

### Passo 2 - Resolver a versão efetiva

```js
/**
 * Aplica apenas campos públicos aprovados pelo consultor.
 * @param {object} machineResult
 * @param {object|null} humanOverride
 * @returns {object}
 */
export function resolveEffectiveReport(machineResult, humanOverride) {
    if (!humanOverride) return machineResult;
    return {
        ...machineResult,
        routine: humanOverride.routine ?? machineResult.routine,
        recommendations:
            humanOverride.recommendations ?? machineResult.recommendations,
        consultantNote: humanOverride.publicNote ?? null,
        source: "human_reviewed",
    };
}
```

O service nunca inclui `internalNote` neste objeto.

### Passo 3 - Respeitar o paywall no servidor

Verifica `ReportUnlock` antes de serializar conteúdo. Um utilizador autenticado sem unlock recebe o mesmo teaser, não um objeto completo com flag visual.

### Passo 4 - Integrar o relatório

Na rota `/consulta/relatorios/:reportId`, mostra um badge “Relatório IA” ou “Revisto por consultor”. Explica alterações apenas onde existem e conserva o aviso de consultoria cosmética não médica.

### Passo 5 - Integrar histórico e disponibilidade

O histórico lista data, objetivos, estado e versão. Cada card abre o relatório próprio. O snapshot mostra o que foi recomendado; uma consulta atual ao catálogo decide se o CTA pode ser usado agora.

### Passo 6 - Tratar esclarecimentos

Quando o estado é `needs_clarification`, apresenta a pergunta pública e uma ação “Responder na consulta”. Não mostra pagamento, freeze ou simulação enquanto faltar a resposta.

### Passo 7 - Executar cenários negativos obrigatórios (mínimo 2)

1. Outro cliente pede o relatório e recebe `404`/403 sem metadados.
2. Um cliente bloqueado inspeciona a resposta e não encontra rotina, observações ou produtos completos.
3. Um override com `internalNote` é persistido, mas o DTO público nunca o contém.

#### Expected results

- Uma única página apresenta teaser, revisão, desbloqueio e conteúdo final.
- O cliente distingue relatório automático de versão revista.
- O paywall é aplicado no backend.
- Notas internas e IDs técnicos não chegam ao browser.
- O histórico preserva snapshots sem fingir stock atual.

#### Critérios de aceite

- Ownership e paywall cobertos por testes.
- Versão efetiva não altera `machineResult`.
- Estados de esclarecimento têm navegação funcional.
- Cenarios negativos concluídos: mínimo `2`.
- Evidencia de testes por camada: unitário, contrato, frontend e E2E.

### Matriz minima de testes por prioridade

| Prioridade | Camada | Prova |
|---|---|---|
| P0 | API/contrato | Teaser não contém conteúdo protegido |
| P1 | Unitário | Resolução do override público |
| P1 | Frontend/E2E | Badge, esclarecimento, histórico e stock atual |

#### Validação final

- [ ] DTO bloqueado e desbloqueado têm schemas distintos.
- [ ] Nenhuma nota interna aparece em snapshots frontend.
- [ ] Outro utilizador não consegue inferir existência do relatório.
- [ ] Negativos: mínimo `2` cenários.
- [ ] A UI não contém uma página paralela de insights.

#### Evidence para PR/defesa

- Snapshot sanitizado do teaser e da versão desbloqueada.
- Teste que procura chaves proibidas na resposta bloqueada.
- E2E de esclarecimento e de versão humana.
- Prova de que disponibilidade atual não altera o snapshot.

#### Handoff

O `BK-MF8-13` integra esta experiência nas rotas canónicas da consulta e nos menus corretos para cliente e consultor.

## Bloco pedagogico

### Objetivo

Aprender a separar autorização de apresentação e conteúdo histórico de estado atual.

### Pre-requisitos

Rever DTOs, ownership, imutabilidade e composição de objetos.

### Erros comuns

- Esconder o relatório completo com CSS.
- Mostrar notas internas.
- Misturar stock atual com o snapshot congelado.
- Obrigar o cliente a escrever um ID.

### Check de compreensao

1. Por que existem dois schemas de resposta?
2. Como se conserva a autoria de uma alteração?
3. Que informação pode aparecer antes do desbloqueio?

## Bloco operacional

### Entrada

Relatório v2 e eventual decisão humana concluída.

### Passos

Autorizar, resolver versão, aplicar paywall, serializar DTO e apresentar no relatório/histórico.

### Validacao

Executar testes de service/controller, snapshots de componentes e E2E com dois utilizadores.

### Handoff

Entregar uma fonte única de verdade à navegação integrada.

## Criterios de aceite

- Versão humana pública claramente identificada.
- Paywall e ownership aplicados antes da serialização.
- Histórico e disponibilidade atual separados.
- Cenarios negativos concluidos: minimo `2`.
- Evidencia de testes por camada registada.

## Evidence para PR/defesa

Demonstrar a diferença estrutural entre teaser e relatório completo e a aplicação segura do override humano.

## Snippet tecnico aplicavel

```sh
npm --prefix apps/api test -- report-access face-report
npm --prefix apps/web run test:unit
```

#### Changelog

- `2026-07-11`: insights integrados no relatório v2, com versão efetiva, paywall server-side e remoção da UI paralela.
