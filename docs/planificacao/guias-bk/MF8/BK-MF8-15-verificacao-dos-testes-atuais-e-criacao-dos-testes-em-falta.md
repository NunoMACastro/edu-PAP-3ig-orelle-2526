# BK-MF8-15 - Verificação dos testes atuais e criação dos testes em falta

## Header
- `doc_id`: `GUIA-BK-MF8-15`
- `bk_id`: `BK-MF8-15`
- `macro`: `MF8`
- `owner`: `Daniel Bulica`
- `apoio`: `Izelicks`
- `prioridade`: `P0`
- `estado`: `TODO`
- `esforco`: `M`
- `dependencias`: `BK-MF8-03, BK-MF8-14`
- `rf_rnf`: `RNF27`
- `fase_documental`: `Fase 3`
- `sprint`: `S11-S12`
- `core_or_reforco`: `Reforco`
- `proximo_bk`: `BK-MF8-16`
- `guia_path`: `docs/planificacao/guias-bk/MF8/BK-MF8-15-verificacao-dos-testes-atuais-e-criacao-dos-testes-em-falta.md`
- `last_updated`: `2026-07-11`

> **Contrato OpenAI-only vigente:** os testes determinísticos usam um transport OpenAI injetado exclusivamente em `NODE_ENV=test`; isto não cria um modo sintético persistido nem depende de internet/créditos. `test:ai:live` é opt-in e a ausência de chave resulta em `SKIP/BLOQUEADO`, nunca em `PASS`.

#### Objetivo

Inventariar a cobertura real, mapear lacunas contra o fluxo end-to-end e criar os testes necessários antes da bateria final. O inventário deve ser derivado dos manifests atuais, sem cristalizar contagens de ficheiros ou smokes.

#### Importância

Uma suite grande pode deixar o caminho crítico sem prova. A PAP precisa mostrar não só quantidade, mas cobertura dos contratos que distinguem esta aplicação: OpenAI multimodal, jobs duráveis, revisão humana, paywall de 10%, voucher e eliminação de dados.

#### Scope-in

- Inventariar unitários, contratos, integração, frontend, E2E, Axe e performance.
- Mapear cada passo da consulta para testes positivos e negativos.
- Cobrir concorrência, idempotência, restart e rollback.
- Cobrir consentimentos, privacidade, backup e eliminação física.
- Cobrir três browsers automatizados e quatro viewports.
- Verificar que `verify:all` descobre todos os scripts `smoke:*`.
- Manter o teste live separado e opt-in.

#### Scope-out

- Não chamar OpenAI em suites determinísticas.
- Não usar a URI remota nem ler o `.env` remoto.
- Não marcar testes não executados como verdes.
- Não substituir integração MongoDB por mocks quando se testa atomicidade.
- Não fixar uma contagem histórica de testes.

#### Estado antes e depois

- Antes: os testes podiam estar verdes sem representar o novo fluxo.
- Depois: uma matriz RF/RNF → runtime → teste mostra cobertura e cada lacuna P0/P1 tem um teste reproduzível.

#### Pre-requisitos

- Implementação OpenAI-only estabilizada.
- `MongoMemoryReplSet` disponível para integração.
- Vitest, Testing Library, jsdom, ESLint, Playwright e Axe configurados.
- Browsers Playwright instalados localmente ou blocker registado.

#### Glossário

- **Transport injetado:** implementação controlada do protocolo OpenAI usada só em testes.
- **Teste live:** chamada real opt-in, nunca parte da suite offline.
- **Contract test:** prova de forma, códigos e fronteiras entre módulos.
- **Fault injection:** falha deliberada para provar rollback/retoma.
- **Gate anti-órfão:** falha quando um script publicado não entra no plano integral.

#### Conceitos teóricos essenciais

Mocks são adequados para testar retries e schemas, mas não demonstram transações, índices únicos ou leases. Esses comportamentos exigem MongoDB real em replica set efémero.

Cobertura de linhas não substitui uma matriz de cenários. Um teste deve indicar requisito, risco, camada e resultado esperado.

#### Arquitetura do BK

A matriz mínima inclui:

1. auth, CSRF, rate limits e roles;
2. sete objetivos, 5–8 perguntas e retoma;
3. qualidade fotográfica e consentimentos;
4. provider primary/retry/fallback OpenAI;
5. jobs, leases e restart;
6. allowlist, relatório, revisão e freeze;
7. 10%, pagamento simulado e voucher;
8. makeup, privacidade, export e backup;
9. rotas, teclado, Axe, viewports e budgets.

#### Ficheiros a criar/editar/rever

- REVER: `apps/api/package.json`
- REVER: `apps/web/package.json`
- REVER: `apps/api/tests/`
- REVER: `apps/web/src/**/*.test.jsx`
- REVER: `apps/web/tests/e2e/`
- CRIAR/REVER: `docs/evidencias/MF8/TESTES-ATUAIS-E-LACUNAS.md`
- CRIAR/REVER: teste de contrato do manifest e do plano `verify:all`.

#### Tutorial técnico linear

### Passo 1 - Ler os manifests e runners

Lista scripts diretamente dos dois `package.json`. Regista comando, camada, dependências e se precisa de browser ou replica set. Não copies uma contagem antiga para o gate.

### Passo 2 - Criar matriz de cobertura

Para cada cenário, regista RF/RNF, ficheiro runtime, teste existente, lacuna, prioridade e decisão. Uma lacuna P0 impede o handoff ao BK16.

### Passo 3 - Verificar o gate anti-órfão

```js
/**
 * Devolve todos os smokes publicados pelo manifest, sem lista fixa.
 * @param {Record<string,string>} scripts
 * @returns {string[]}
 */
export function listSmokeScripts(scripts) {
    return Object.keys(scripts)
        .filter((name) => name.startsWith("smoke:"))
        .sort();
}

expect(plannedSmokeNames).toEqual(listSmokeScripts(webPackage.scripts));
```

O page-budget pode ter passo dedicado, mas deve aparecer exatamente uma vez no plano final.

### Passo 4 - Criar testes API em falta

Prioriza schemas inválidos, timeout, 429, 5xx, retry/fallback, falha total, lease expirada, duplo clique, allowlist, variantes, alergias, CAS, pagamento/voucher e eliminação física.

### Passo 5 - Criar testes frontend em falta

Cobre rotas, conversa, foco, relatório bloqueado, revisão, voucher, catálogo, polling e preservação de conteúdo. Usa queries acessíveis, não classes CSS como contrato.

### Passo 6 - Criar E2E e Axe

Executa o percurso de cliente e consultor em Chromium, Firefox e WebKit. Testa 320, 375, 768 e 1280 px. O ambiente E2E cria base própria e nunca aceita uma URI externa.

### Passo 7 - Executar cenários negativos obrigatórios (mínimo 3)

1. Retirar o transport test e confirmar que a suite offline falha, em vez de chamar a rede.
2. Publicar um novo `smoke:*` não planeado e confirmar falha anti-órfão.
3. Configurar uma URI não dedicada e confirmar recusa do runner E2E.
4. Forçar falha OpenAI total e confirmar ausência de análise/relatório fabricado.

#### Expected results

- Matriz completa sem lacunas P0/P1 silenciosas.
- Suites determinísticas independentes de OpenAI e da base remota.
- Todos os smokes publicados são executados uma vez.
- Integração usa replica set.
- Teste live tem estado explícito e separado.

#### Critérios de aceite

- Cada cenário crítico tem camada e teste identificados.
- Lacunas P0/P1 foram corrigidas ou bloqueadas externamente com justificação.
- Runners protegem base e rede.
- Cenarios negativos concluídos: mínimo `3`.
- Evidencia de testes por camada: syntax/lint, unitário, contrato, integração, E2E, Axe e performance.

### Matriz minima de testes por prioridade

| Prioridade | Camada | Prova |
|---|---|---|
| P0 | API/integração | Jobs, transações, consentimentos, freeze e voucher |
| P0 | E2E | Cliente e consultor nos três browsers |
| P1 | Frontend/Axe | Estados, foco, viewports e conteúdo bloqueado |
| P1 | Operacional | Backup/restore, migrations, audit e sem base remota |

#### Validação final

- [ ] Manifests e plano de execução coincidem.
- [ ] Nenhuma suite determinística requer internet.
- [ ] Migrations 010–015 têm dry-run e pós-condições.
- [ ] Catálogo conserva IDs e stock agregado.
- [ ] Negativos: mínimo `3` cenários.
- [ ] Lacunas restantes têm estado e responsável.

#### Evidence para PR/defesa

- Matriz de cobertura com caminhos e nomes de testes.
- Outputs sanitizados de cada camada.
- Prova de `MongoMemoryReplSet`.
- Resultado `SKIP/BLOQUEADO` do live test quando não existe chave.

#### Handoff

O `BK-MF8-16` recebe uma lista fechada de comandos, browsers, smokes e blockers, sem lacunas P0/P1 desconhecidas.

## Bloco pedagogico

### Objetivo

Aprender a escolher a camada de teste certa para cada risco.

### Pre-requisitos

Rever pirâmide de testes, mocks, integração, E2E e fault injection.

### Erros comuns

- Contar testes em vez de mapear comportamentos.
- Mockar transações.
- Usar credenciais reais no runner.
- Confundir `SKIP` com sucesso.

### Check de compreensao

1. Que riscos exigem replica set?
2. Por que o transport test não é um modo sintético de runtime?
3. Como o gate deteta um smoke novo?

## Bloco operacional

### Entrada

Código estabilizado, manifests atuais e requisitos canónicos.

### Passos

Inventariar, mapear, criar testes, executar focados e fechar lacunas.

### Validacao

Reexecutar cada teste novo isoladamente e depois a respetiva suite.

### Handoff

Entregar bateria final reproduzível e blockers honestos.

## Criterios de aceite

- Matriz runtime/teste atual.
- Zero lacunas P0/P1 silenciosas.
- Suites offline protegidas contra rede/base remota.
- Cenarios negativos concluidos: minimo `3`.
- Evidencia de testes por camada registada.

## Evidence para PR/defesa

Apresentar a matriz e demonstrar um teste de cada risco estrutural, incluindo job, transação, browser e privacidade.

## Snippet tecnico aplicavel

```sh
npm --prefix apps/api test
npm --prefix apps/web run test:unit
npm --prefix apps/web run test:contracts
```

#### Changelog

- `2026-07-11`: matriz atualizada para consulta OpenAI-only, jobs, relatório v2, revisão, 10%+voucher, makeup, privacidade e backup.
