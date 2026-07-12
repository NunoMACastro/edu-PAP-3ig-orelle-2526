# BK-MF8-03 - Ambiente de testes isolado da base local principal da demonstração académica

## Header
- `doc_id`: `GUIA-BK-MF8-03`
- `bk_id`: `BK-MF8-03`
- `macro`: `MF8`
- `owner`: `Daniel Bulica`
- `apoio`: `Bruna`
- `prioridade`: `P1`
- `estado`: `TODO`
- `esforco`: `S`
- `dependencias`: `-`
- `rf_rnf`: `RNF22`
- `fase_documental`: `Fase 3`
- `sprint`: `S11-S12`
- `core_or_reforco`: `Core`
- `proximo_bk`: `BK-MF8-04`
- `guia_path`: `docs/planificacao/guias-bk/MF8/BK-MF8-03-ambiente-de-testes-separado-do-ambiente-de-producao.md`
- `last_updated`: `2026-07-11`

> **Contrato vigente:** desenvolvimento/integration/E2E usam `MongoMemoryReplSet` efémero em loopback e nunca carregam o `.env` remoto. Testes determinísticos podem injetar um transport OpenAI apenas em `NODE_ENV=test`; isto não cria um modo de produto. Sem chave, o runtime local arranca degradado. O teste OpenAI live é opt-in e ausência de credenciais fica `SKIP/BLOQUEADO`, nunca `PASS`. Consultar o [plano vivo OpenAI](../../PLANO-IMPLEMENTACAO-CONSULTA-IA-OPENAI-real_dev.md).

#### Objetivo

Garantir que desenvolvimento académico, testes, migrations e E2E usam bases efémeras próprias, secrets sintéticos e apenas listeners loopback. Nenhuma validação automática pode herdar uma URI MongoDB remota ou uma chave OpenAI real.

#### Importância

Uma suite ligada a dados reais pode apagar catálogo, consumir créditos ou produzir evidence irrepetível. O isolamento torna transações, concorrência, jobs, backup e privacidade demonstráveis sem depender de Docker, MongoDB instalado ou serviços externos.

#### Scope-in

- Criar `MongoMemoryReplSet` por execução e teardown obrigatório.
- Construir um environment allowlist-only com dotenv apontado para `/dev/null`.
- Aplicar migrations 001–015 antes do runtime local/E2E ficar ready.
- Usar transport OpenAI determinístico apenas em testes.
- Separar `test:ai:live` do agregador normal.
- Provar readiness transacional e shutdown gracioso.
- Proteger catálogo com contagem, IDs e stock antes/depois das migrations.

#### Scope-out

- Não usar `.env`, URI remota, credenciais ou base partilhada.
- Não ligar testes normais à internet ou à OpenAI.
- Não tratar o transport de teste como provider configurável no produto.
- Não criar deploy/cloud nem alegar produção.
- Não executar seed destrutivo ou `deleteMany(Product)`.

#### Estado antes e depois

- Antes: imports ou runners podiam herdar configuração externa e estado persistente.
- Depois: cada execução cria uma base descartável transacional, aplica migrations e termina sem deixar processos, ficheiros ou dados partilhados.

#### Pre-requisitos

- Node/npm fixados pelo projeto.
- `mongodb-memory-server` como devDependency.
- Migrations append-only 001–015 com status/dry-run/up.
- Chaves sintéticas de sessão/cifra/backup exclusivamente no processo filho.

#### Glossário

- **Replica set efémero:** MongoDB temporário que suporta sessões/transações.
- **Environment allowlist-only:** objeto criado apenas com variáveis aprovadas.
- **Transport de teste:** função injetada em `NODE_ENV=test` que devolve respostas determinísticas.
- **Modo degradado:** aplicação funcional sem novas operações OpenAI.
- **Readiness:** prova de que BD, migrations e capacidade transacional estão prontas.

#### Conceitos teóricos essenciais

Alterar apenas o nome da base não isola uma suite. A URI deve ser loopback, sem credenciais e criada pelo processo. O replica set precisa de WiredTiger para provar transações usadas no pagamento simulado, voucher, revisão, privacidade e jobs.

O teste live tem outra finalidade: validar a integração real com autorização explícita e imagens sintéticas/consentidas. Por ter custo, rede e credenciais, nunca faz parte de `verify:all`.

#### Arquitetura do BK

- `apps/api/scripts/run-local-dev.mjs`: orquestra replica set, migrations e API.
- `apps/api/scripts/local-dev-runtime.core.mjs`: valida URI e environment.
- `apps/api/scripts/run-e2e.mjs`: inicia API, frontend, workers e browsers.
- `apps/api/scripts/e2e-runtime.core.mjs`: base E2E própria, catálogo curado e teardown.
- `apps/api/src/migrations/index.js`: registry 001–015 append-only.
- `apps/api/tests/local-dev-runtime.replset.integration.test.js`: prova local transacional.
- `apps/api/tests/migrations-010-015.replset.integration.test.js`: migrations e invariantes.

#### Ficheiros a criar/editar/rever

- EDITAR: `apps/api/.env.example`
- EDITAR: `apps/api/scripts/run-local-dev.mjs`
- EDITAR: `apps/api/scripts/local-dev-runtime.core.mjs`
- EDITAR: `apps/api/scripts/run-e2e.mjs`
- EDITAR: `apps/api/scripts/e2e-runtime.core.mjs`
- REVER: `apps/api/src/migrations/index.js`
- CRIAR/REVER: testes de runtime, migrations e isolamento de credenciais.

#### Tutorial técnico linear

### Passo 1 - Definir a fronteira de ambiente

O runner aceita apenas variáveis necessárias: `NODE_ENV`, porta loopback, URI efémera, nomes/versionamento OpenAI não secretos e chaves sintéticas de teste. Define `DOTENV_CONFIG_PATH=/dev/null` e não espalha `process.env` inteiro para o processo filho.

### Passo 2 - Criar o replica set efémero

Usa um nó, WiredTiger e `127.0.0.1`. O nome da base inclui marcador de teste e a URI devolvida é validada antes de chegar à aplicação.

```js
import { MongoMemoryReplSet } from "mongodb-memory-server";

/**
 * Cria a persistência transacional de uma suite e devolve teardown explícito.
 *
 * @returns {Promise<{uri: string, stop: () => Promise<void>}>} Runtime Mongo isolado.
 */
export async function createTestReplicaSet() {
    const replSet = await MongoMemoryReplSet.create({
        replSet: { count: 1, storageEngine: "wiredTiger" },
        instanceOpts: [{ ip: "127.0.0.1" }],
    });
    return {
        uri: replSet.getUri("orelle_test"),
        stop: () => replSet.stop(),
    };
}
```

### Passo 3 - Aplicar migrations e proteger o catálogo

Antes de abrir readiness, executa registry 001–015 com lock/checksum. Captura contagem, IDs e stock do catálogo antes/depois de 010–015; qualquer diferença não declarada falha e faz rollback.

### Passo 4 - Injetar o transport determinístico só em teste

O provider OpenAI aceita um transport injetado apenas quando `NODE_ENV=test`. O runtime de desenvolvimento não expõe esta opção como configuração pública. Respostas de teste cumprem os mesmos JSON Schemas e validadores sem fazer rede.

### Passo 5 - Arrancar workers, readiness e shutdown

O E2E inicia worker de jobs IA e worker de ficheiros privados, espera `/api/health/ready`, executa browsers e termina frontend, API, workers, ligações e replica set mesmo perante erro ou sinal.

### Passo 6 - Executar cenários negativos obrigatórios (mínimo 2)

1. Injetar URI `mongodb+srv`, host não loopback ou credenciais e exigir recusa antes da ligação.
2. Injetar `OPENAI_API_KEY` herdada na suite normal e provar que o runner a remove.
3. Falhar migrations/transação de prova e confirmar readiness `503` sem abrir o fluxo E2E.
4. Interromper a suite e confirmar teardown dos workers/listeners/replica set.

#### Expected results

- `dev:local`, integration e E2E não carregam `.env` remoto.
- Cada execução usa base efémera própria e replica set transacional.
- Migrations 001–015 são aplicadas antes de readiness.
- Suite determinística não usa internet, créditos ou chave OpenAI.
- Sem chave, áreas não IA permanecem funcionais.
- Teardown não deixa processos, listeners ou bases partilhadas.

#### Critérios de aceite

- URI efémera, loopback, sem credenciais e com replica set.
- Environment do processo filho é allowlist-only.
- Transport determinístico inacessível fora de `NODE_ENV=test`.
- `test:ai:live` permanece opt-in e fora de `verify:all`.
- Catálogo preserva contagem, IDs e stock nas migrations.
- Cenarios negativos concluídos: mínimo `2`.
- Evidencia de testes por camada: contracts, integration replica-set e E2E runtime.

### Matriz mínima de testes por prioridade

| Prioridade | Camada | Prova mínima |
|---|---|---|
| P1 | Contract | allowlist de env, URI e isolamento da chave |
| P1 | Integration | transação, migrations, readiness e teardown |
| P1 | E2E | API/web/workers/browsers numa base dedicada |
| P1 | Negativos | pelo menos dois cenários materiais |

#### Validação final

- [ ] Nenhuma URI remota ou credencial é aceite.
- [ ] `.env` não é carregado por dev:local/integration/E2E.
- [ ] Registry 001–015 e invariantes do catálogo passam.
- [ ] Suite determinística não faz chamadas OpenAI.
- [ ] Teste live ausente fica `SKIP/BLOQUEADO`, não `PASS`.
- [ ] Negativos: mínimo `2` cenários com resultado controlado.

#### Evidence para PR/defesa

Regista apenas host loopback, nome sanitizado da base, versões, comandos e exit codes. Nunca copies URI completa, chaves, fotografias ou payloads OpenAI.

#### Handoff

O `BK-MF8-04` usa o mesmo isolamento para criar/restaurar/verificar snapshots apenas numa base terminada em `_restore`.

## Bloco pedagogico

### Objetivo

Compreender por que o isolamento depende do processo, da URI e dos serviços usados, não apenas de `NODE_ENV`.

### Pre-requisitos

Rever variáveis de ambiente, MongoDB transactions, lifecycle de processos e hooks de testes.

### Erros comuns

- Copiar uma URI para `.env.test`.
- Herdar todas as variáveis do terminal.
- Contar um Mongo standalone como prova transacional.
- Chamar à ausência de chave uma validação OpenAI live.

### Check de compreensao

1. Por que `_test` no nome não basta?
2. Qual é a diferença entre transport determinístico e integração live?
3. O que readiness deve provar antes de abrir o E2E?

## Bloco operacional

### Entrada

Dependências instaladas, nenhum `.env` carregado e portas loopback disponíveis.

### Passos

Criar replica set, validar environment, migrar, arrancar workers/API/web, testar e terminar tudo.

### Validacao

```bash
npm --prefix apps/api test -- tests/local-dev-runtime.replset.integration.test.js
npm --prefix apps/api test -- tests/migrations-010-015.replset.integration.test.js tests/e2e-runtime.core.test.js
npm --prefix apps/api run test:e2e
```

### Handoff

Entregar prova de isolamento, transações, catálogo e teardown ao `BK-MF8-04`.

## Criterios de aceite

- Testes locais nunca usam a base principal/remota.
- OpenAI real não é requisito da suite determinística.
- Cenarios negativos concluidos: minimo `2`.
- Evidencia de testes por camada registada.

## Evidence para PR/defesa

Apresentar transação commit/rollback, readiness e teardown com configuração sanitizada.

## Snippet tecnico aplicavel

```js
const BK_ID = "BK-MF8-03";
const MIN_NEGATIVOS = 2;

/** Valida evidence sem receber URI nem segredos. */
export function validarEvidenceBkMf803(evidence) {
    const negativos = Array.isArray(evidence?.negativos) ? evidence.negativos.length : 0;
    if (evidence?.bkId !== BK_ID || negativos < MIN_NEGATIVOS) {
        throw new Error("Evidence incompleta para BK-MF8-03");
    }
    return true;
}
```

## Changelog

- `2026-07-11`: guia alinhado a OpenAI-only degradável, transport test-only, migrations 001–015, workers E2E e isolamento total de credenciais.
- `2026-07-10`: configuração de IA alternativa do contrato anterior ficou supersedida e apenas o histórico de auditoria a preserva.
