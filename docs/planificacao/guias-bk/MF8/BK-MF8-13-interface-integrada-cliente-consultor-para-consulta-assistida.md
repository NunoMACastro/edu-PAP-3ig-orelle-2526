# BK-MF8-13 - Interface integrada cliente/consultor para consulta assistida

## Header
- `doc_id`: `GUIA-BK-MF8-13`
- `bk_id`: `BK-MF8-13`
- `macro`: `MF8`
- `owner`: `Aline`
- `apoio`: `Bruna`
- `prioridade`: `P0`
- `estado`: `TODO`
- `esforco`: `M`
- `dependencias`: `BK-MF8-08, BK-MF8-09, BK-MF8-10, BK-MF8-11, BK-MF8-12`
- `rf_rnf`: `RF42, RF45, RF46, RNF26`
- `fase_documental`: `Fase 3`
- `sprint`: `S11-S12`
- `core_or_reforco`: `Reforco`
- `proximo_bk`: `BK-MF8-14`
- `guia_path`: `docs/planificacao/guias-bk/MF8/BK-MF8-13-interface-integrada-cliente-consultor-para-consulta-assistida.md`
- `last_updated`: `2026-07-11`

> **Contrato OpenAI-only vigente:** a interface é um fluxo de rotas coeso, não uma página que incorpora ecrãs completos nem um formulário sequencial com estado de negócio próprio. O backend devolve `flowState`; o frontend apresenta o estado, mantém apenas o input ainda não submetido e retoma jobs persistentes após reload.

#### Objetivo

Integrar objetivos, consentimento, fotografias, conversa, relatório, revisão humana opcional, pagamento simulado, voucher e preview de maquilhagem numa navegação clara para cada role.

#### Importância

Um sistema tecnicamente correto pode falhar na PAP se o percurso estiver fragmentado. Uma interface server-driven reduz races, evita duplicar regras e torna visível a arquitetura da consulta.

#### Scope-in

- Criar as cinco rotas do cliente e a fila do consultor.
- Conduzir a UI por `flowState`.
- Retomar sessão e job após reload.
- Implementar polling de 2 a 10 segundos.
- Preservar transcript e conteúdo em 401, 409, timeout e falha OpenAI.
- Mostrar apenas um formulário de resposta ativo.
- Manter redirects temporários das rotas antigas.
- Separar menus de cliente, consultor e administrador.

#### Scope-out

- Não usar Redux, XState ou chatbot SDK.
- Não duplicar validação de negócio no browser.
- Não guardar fotografias, landmarks ou respostas em storage.
- Não mostrar percentagens falsas nem animação de typing.
- Não pedir ObjectIds em formulários.
- Não recuperar a antiga preview genérica.

#### Estado antes e depois

- Antes: páginas independentes obrigavam o utilizador a descobrir a ordem e mantinham um fluxo sequencial paralelo.
- Depois: cada URL corresponde a uma responsabilidade e o servidor indica a próxima ação permitida.

#### Pre-requisitos

- APIs canónicas dos BKs 08 a 12 disponíveis.
- `apiClient` same-origin com CSRF, AbortSignal e erros tipados.
- Layouts e guards por role.
- Relatório v2 com teaser e unlock.

#### Glossário

- **flowState:** estado público da sessão calculado pelo backend.
- **Polling progressivo:** espera que começa em 2 s e cresce até 10 s.
- **Transcript:** perguntas e respostas já persistidas.
- **Redirect de compatibilidade:** encaminhamento temporário sem manter a página antiga.
- **Server-driven:** o servidor é a fonte de verdade do percurso.

#### Conceitos teóricos essenciais

O frontend pode decidir como apresentar um estado, mas não se um pagamento, revisão ou resposta é válido. Um `409` significa que o estado mudou; a UI deve recarregar o recurso sem apagar o que já estava visível.

Jobs de análise, relatório e imagem sobrevivem à navegação. O browser não espera com um pedido HTTP aberto: inicia a operação, recebe o estado e consulta-o de forma gradual.

#### Arquitetura do BK

Rotas do cliente:

- `/consulta`: dashboard, retomar e último relatório.
- `/consulta/nova`: objetivos, consentimento, instruções e fotografias.
- `/consulta/ativa`: análise, perguntas, retry e esclarecimentos.
- `/consulta/relatorios/:reportId`: revisão, freeze, pagamento, voucher e makeup.
- `/consulta/historico`: sessões anteriores.

Rota do consultor:

- `/consultoria/revisoes`: fila e detalhe, protegidos por role.

#### Ficheiros a criar/editar/rever

- REVER: `apps/web/src/App.jsx`
- REVER: `apps/web/src/features/consultation/ConsultationDashboardPage.jsx`
- REVER: `apps/web/src/features/consultation/NewConsultationPage.jsx`
- REVER: `apps/web/src/features/consultation/ActiveConsultationPage.jsx`
- REVER: `apps/web/src/features/consultation/ConsultationReportPage.jsx`
- REVER: `apps/web/src/features/consultation/ConsultationHistoryPage.jsx`
- REVER: `apps/web/src/features/consultation/ConsultationReviewsPage.jsx`
- REVER: `apps/web/src/features/consultation/consultationApi.js`
- REVER: `apps/web/src/features/consultation/consultationModel.js`
- CRIAR/REVER: testes de rotas, componentes, contratos e E2E.

#### Tutorial técnico linear

### Passo 1 - Definir rotas e guards

Usa lazy loading e layouts por role. As rotas antigas de fotografia, análise, recomendações, insights e simulação fazem apenas `Navigate` para a rota canónica adequada.

```jsx
<Route path="/consulta" element={<ConsultationDashboardPage />} />
<Route path="/consulta/nova" element={<NewConsultationPage />} />
<Route path="/consulta/ativa" element={<ActiveConsultationPage />} />
<Route
    path="/consulta/relatorios/:reportId"
    element={<ConsultationReportPage />}
/>
<Route path="/consulta/historico" element={<ConsultationHistoryPage />} />
<Route
    element={
        <RequireRole allowedRoles={CONSULTANT_ROLES}>
            <ConsultantLayout />
        </RequireRole>
    }
>
    <Route
        path="/consultoria/revisoes"
        element={<ConsultationReviewsPage />}
    />
</Route>
```

### Passo 2 - Mapear estados públicos

Suporta `collecting_goal`, `collecting_photos`, `analyzing`, `asking_questions`, `ready_for_report`, `generating_report`, `draft_ready`, `review_pending`, `needs_clarification`, `frozen_locked` e `unlocked`. Qualquer operação pode expor `failed_retryable`.

### Passo 3 - Implementar nova consulta

Carrega capacidades e sete objetivos do backend. Permite um objetivo principal e até dois secundários. Recolhe consentimento v2, mostra instruções de fotografia e só inicia análise quando o backend aceitar o par.

### Passo 4 - Implementar conversa retomável

Renderiza um log ordenado com “Pergunta 3 de até 8”. Persiste a resposta antes de pedir a seguinte. Desativa duplo clique, trata `409` recarregando a sessão e move o foco para a nova pergunta.

### Passo 5 - Integrar relatório e revisão

A página do relatório apresenta teaser, decisão de pedir/retirar revisão, esclarecimento, freeze, pagamento académico simulado, voucher e, quando aplicável, preview OpenAI. Nenhum conteúdo protegido é renderizado antes do unlock.

### Passo 6 - Integrar polling e erros

Centraliza a decisão em `shouldPollConsultation(session)`: faz polling nos estados assíncronos (`analyzing`, `generating_report` e equivalentes), sempre que `operation.status` está pendente e também em `asking_questions|needs_clarification` quando ainda não existe `currentQuestion` — janela em que `select_next_question` está a materializar a pergunta. Aumenta o intervalo 2 s → 4 s → 8 s → 10 s, cancela no unmount e preserva o último recurso válido durante erros.

### Passo 7 - Executar cenários negativos obrigatórios (mínimo 3)

1. Recarregar durante análise e confirmar retomada do mesmo job.
2. Simular `409` numa resposta concorrente e confirmar transcript preservado.
3. Abrir a rota de consultor como cliente e confirmar redirect visual mais `403` na API.
4. Inspecionar relatório bloqueado e confirmar ausência de conteúdo integral no DOM.

#### Expected results

- O cliente encontra e retoma toda a consulta a partir de `/consulta`.
- A UI não mantém uma máquina de estados paralela.
- Cada role vê apenas navegação e ações compatíveis.
- Falhas transitórias não apagam transcript ou relatório carregado.
- Rotas antigas encaminham sem reintroduzir contratos antigos.

#### Critérios de aceite

- Rotas canónicas e redirects cobertos.
- `flowState` governa todas as ações.
- Polling cancela corretamente e retoma após reload.
- Teclado e foco funcionam na conversa.
- Cenarios negativos concluídos: mínimo `3`.
- Evidencia de testes por camada: unitário, componente, contrato e E2E.

### Matriz minima de testes por prioridade

| Prioridade | Camada | Prova |
|---|---|---|
| P0 | Contrato/E2E | Percurso completo e retomada de jobs |
| P0 | Segurança | Guards visuais e autorização backend por role |
| P1 | Frontend | Foco, polling, erros e conteúdo preservado |

#### Validação final

- [ ] Rotas cliente e consultor acessíveis pelos menus corretos.
- [ ] Nenhum formulário pede IDs técnicos.
- [ ] Reload durante job retoma a operação.
- [ ] Relatório bloqueado não contém dados escondidos.
- [ ] Negativos: mínimo `3` cenários.

#### Evidence para PR/defesa

- Mapa de rotas e estados.
- E2E de nova consulta até unlock.
- E2E de consultor com role correta e cliente bloqueado.
- Screenshots automatizados sem fotografias reais nem PII.

#### Handoff

O `BK-MF8-14` melhora apresentação, responsividade e acessibilidade destas rotas sem inventar validação manual do mockup.

## Bloco pedagogico

### Objetivo

Perceber como uma UI server-driven evita duplicação de regras.

### Pre-requisitos

Rever React Router, efeitos canceláveis, estados assíncronos e guards por role.

### Erros comuns

- Guardar respostas em `localStorage`.
- Criar um segundo fluxo sequencial.
- Apagar conteúdo ao falhar uma mutation.
- Fazer polling depois do unmount.

### Check de compreensao

1. Que decisões pertencem ao backend?
2. Como deve a UI reagir a `409`?
3. Por que o relatório bloqueado exige DTO próprio?

## Bloco operacional

### Entrada

Endpoints canónicos, layouts por role e estados públicos documentados.

### Passos

Configurar rotas, mapear estados, integrar páginas, tratar polling/erros e testar.

### Validacao

Executar unitários, contratos, build, Playwright e Axe nas rotas principais.

### Handoff

Entregar uma experiência integrada pronta para acabamento visual.

## Criterios de aceite

- Fluxo navegável sem páginas duplicadas.
- Estado vindo exclusivamente do backend.
- Retoma e erros assíncronos seguros.
- Cenarios negativos concluidos: minimo `3`.
- Evidencia de testes por camada registada.

## Evidence para PR/defesa

Demonstrar o mesmo job antes e depois de reload, a separação de roles e a inexistência de conteúdo bloqueado no DOM.

## Snippet tecnico aplicavel

```sh
npm --prefix apps/web run test:unit
npm --prefix apps/web run test:e2e
```

#### Changelog

- `2026-07-11`: removido o fluxo duplicado e documentadas as rotas canónicas server-driven da consulta OpenAI.
