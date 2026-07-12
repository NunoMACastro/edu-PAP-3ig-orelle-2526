# BK-MF8-16 - Execução final de testes com evidências

## Header
- `doc_id`: `GUIA-BK-MF8-16`
- `bk_id`: `BK-MF8-16`
- `macro`: `MF8`
- `owner`: `Bruna`
- `apoio`: `Daniel Bulica`
- `prioridade`: `P0`
- `estado`: `TODO`
- `esforco`: `S`
- `dependencias`: `BK-MF8-14, BK-MF8-15`
- `rf_rnf`: `RNF28`
- `fase_documental`: `Fase 3`
- `sprint`: `S12`
- `core_or_reforco`: `Reforco`
- `proximo_bk`: `BK-MF8-17`
- `guia_path`: `docs/planificacao/guias-bk/MF8/BK-MF8-16-execucao-final-de-testes-com-evidencias.md`
- `last_updated`: `2026-07-11`

> **Contrato vigente:** a bateria final corre no mesmo estado do código, sem base remota e sem internet para as suites determinísticas. Cada comando regista data, CWD, exit code e resumo sanitizado. Falhas ambientais ficam `BLOQUEADO_EXTERNO`; testes não executados nunca são apresentados como `PASS`.

#### Objetivo

Executar a bateria integral definida no BK15, guardar evidência reproduzível e entregar ao BK17 apenas falhas atuais, blockers legítimos e resultados verdes do mesmo snapshot.

#### Importância

Resultados obtidos em momentos diferentes podem contradizer-se. Fixar hashes e executar por ordem permite mostrar que API, frontend, browsers, migrations, backup e documentação pertencem à mesma versão.

#### Scope-in

- Registar Node/npm e hashes dos lockfiles.
- Executar syntax, lint, unitários, contratos e integração.
- Executar migrations e invariantes do catálogo.
- Executar build, smokes, E2E, Axe e performance.
- Verificar backup cifrado e restore isolado.
- Executar audits de dependências e planificação.
- Executar scans estáticos de contratos removidos e localhost.
- Registar live OpenAI como resultado separado.

#### Scope-out

- Não corrigir falhas neste BK.
- Não usar a base configurada no ambiente remoto.
- Não truncar logs para esconder o primeiro erro.
- Não substituir um browser falhado por outro.
- Não publicar segredos, cookies, PII ou fotografias.

#### Estado antes e depois

- Antes: existem suites focadas e uma matriz pronta.
- Depois: existe uma execução integral cronológica, com falhas encaminhadas e uma decisão que pode ser reproduzida.

#### Pre-requisitos

- BK15 sem lacunas P0/P1 desconhecidas.
- Dependências instaladas a partir dos lockfiles.
- Browsers Playwright disponíveis.
- MongoDB efémero protegido pelo runner.
- Snapshot local do catálogo e backup verificado.

#### Glossário

- **Snapshot de execução:** hashes, versões e instante que identificam o código testado.
- **Gate:** condição obrigatória para avançar.
- **Blocker externo:** dependência fora do código que foi realmente tentada.
- **Resumo sanitizado:** resultado sem dados sensíveis.
- **Reauditoria:** nova inspeção do estado final, independente do histórico.

#### Conceitos teóricos essenciais

Um exit code zero é evidence do comando, não prova universal. Por isso, cada gate está ligado a uma finalidade. Um audit de dependências não substitui testes funcionais; Axe não substitui teclado; build não substitui E2E.

A ordem também importa: começa por verificações rápidas e só abre browsers depois de syntax, lint e unitários. Uma falha não é apagada pelo reteste; é acrescentado um novo registo.

#### Arquitetura do BK

Ordem recomendada:

1. baseline e proteção ambiental;
2. syntax/lint;
3. unitários/contratos/integração;
4. migrations e catálogo;
5. frontend/build/smokes;
6. E2E/Axe/performance;
7. backup/audits/docs/scans e reauditoria.

#### Ficheiros a criar/editar/rever

- CRIAR/REVER: `docs/evidencias/MF8/EXECUCAO-FINAL-TESTES.md`
- REVER: `apps/api/package.json`
- REVER: `apps/web/package.json`
- REVER: scripts de `verify:all`, E2E, backup e migrations.
- REVER: matriz de cobertura do BK15.
- NÃO EDITAR: código funcional durante esta execução.

#### Tutorial técnico linear

### Passo 1 - Fixar baseline e ambiente

Regista `node --version`, `npm --version` e SHA-256 dos lockfiles. Confirma que a base E2E é efémera/dedicada e que nenhum processo lê o `.env` remoto. Guarda contagem, IDs e stock agregado do catálogo.

### Passo 2 - Executar gates rápidos

Executa syntax e lint nos dois pacotes. Se falharem, regista o primeiro erro e passa o finding ao BK17 antes de desperdiçar tempo em browsers.

### Passo 3 - Executar suites API e frontend

Executa testes API completos, unitários frontend e contratos frontend. Os testes de integração devem iniciar `MongoMemoryReplSet` e terminar sem processos pendurados.

### Passo 4 - Validar migrations e catálogo

Corre status, dry-run e testes 010–015. Compara contagem, conjunto de IDs e stock agregado antes/depois. Qualquer diferença não justificada é P0.

### Passo 5 - Executar build, E2E, Axe e budgets

Executa build e todos os smokes descobertos pelo manifest. Depois corre Playwright em Chromium, Firefox e WebKit nos viewports definidos. Regista separadamente violações Axe e budgets.

### Passo 6 - Verificar backup, audits e documentação

Cria backup cifrado, restaura apenas numa base terminada em `_restore` e compara documentos, índices e checksums. Executa `npm audit`, validator da planificação, links/fences e scans semânticos.

### Passo 7 - Executar cenários negativos obrigatórios (mínimo 3)

1. Apontar o restore para uma base sem sufixo `_restore` e confirmar recusa.
2. Remover uma entrada smoke do plano e confirmar falha anti-órfão.
3. Simular ausência de browser e registar `BLOQUEADO_EXTERNO`, não `PASS`.
4. Injetar um host financeiro ou localhost no bundle de teste e confirmar falha do scan.

#### Expected results

- Todos os resultados referem o mesmo baseline.
- Zero ligação à base remota.
- Catálogo conserva IDs e stock.
- Pagamento continua estritamente simulado.
- Falhas e retestes aparecem cronologicamente.
- Ausência de chave OpenAI live permanece `SKIP/BLOQUEADO`.

#### Critérios de aceite

- Evidence inclui comando, CWD, data, exit code e resumo.
- Suites determinísticas, build, E2E, Axe, performance, backup e docs executados.
- Nenhum high/critical fica sem decisão.
- Cenarios negativos concluídos: mínimo `3`.
- Evidencia de testes por camada: todas as camadas do `verify:all` e validações manuais efetivamente realizadas.

### Matriz minima de testes por prioridade

| Prioridade | Gate | Prova |
|---|---|---|
| P0 | API/integração | Suite completa, migrations e catálogo |
| P0 | E2E | Cliente/consultor em Chromium, Firefox e WebKit |
| P1 | Qualidade | lint, build, Axe, budgets e audits |
| P1 | Operacional | backup → restore → verify e docs |

#### Validação final

- [ ] Baseline e hashes registados.
- [ ] `npm --prefix apps/api run verify:all` executado.
- [ ] Browsers e viewports registados individualmente.
- [ ] Backup restaurado em base isolada.
- [ ] Negativos: mínimo `3` cenários.
- [ ] Cada falha tem ID para o BK17.

#### Evidence para PR/defesa

- Tabela cronológica append-only.
- Saídas resumidas, sem URI, chave, cookie, fotografia ou resposta pessoal.
- Lista de browsers realmente executados.
- Invariantes do catálogo e do pagamento simulado.
- Decisão clara para cada blocker.

#### Handoff

O `BK-MF8-17` recebe findings individuais com reprodução, severidade, contrato afetado, teste falhado e último resultado. Não recebe um “falhou” genérico.

## Bloco pedagogico

### Objetivo

Aprender a construir evidence repetível sem confundir ausência de prova com sucesso.

### Pre-requisitos

Rever exit codes, hashes, runners, browsers, audits e restore.

### Erros comuns

- Misturar resultados de snapshots diferentes.
- Copiar segredos para a evidence.
- Corrigir durante a bateria e continuar sem reiniciar os gates afetados.
- Marcar blocker sem tentar o comando.

### Check de compreensao

1. Por que se guardam hashes dos lockfiles?
2. Que diferenças existem entre falha de produto e blocker externo?
3. Que invariantes protegem o catálogo?

## Bloco operacional

### Entrada

Matriz do BK15, código estabilizado e ambiente local isolado.

### Passos

Fixar baseline, executar por camadas, registar resultados e encaminhar falhas.

### Validacao

Confirmar que a evidence tem todos os gates e que nenhum resultado foi sobrescrito.

### Handoff

Entregar findings reproduzíveis ao BK17.

## Criterios de aceite

- Bateria integral executada no mesmo estado.
- Evidence sanitizada e append-only.
- Falhas e blockers classificados honestamente.
- Cenarios negativos concluidos: minimo `3`.
- Evidencia de testes por camada registada.

## Evidence para PR/defesa

Apresentar o baseline, o quadro de gates e um exemplo de falha seguida de reteste, sem expor dados sensíveis.

## Snippet tecnico aplicavel

```sh
npm --prefix apps/api run verify:all
npm --prefix apps/web run build
./scripts/validate-planificacao.sh
```

#### Changelog

- `2026-07-11`: bateria final alinhada com OpenAI-only, jobs, relatório v2, revisão, 10%+voucher, makeup, backup e validação documental.
