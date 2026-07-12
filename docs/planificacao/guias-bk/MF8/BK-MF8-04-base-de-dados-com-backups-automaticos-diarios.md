# BK-MF8-04 - Snapshot diário recuperável da base académica local

## Header

- `doc_id`: `GUIA-BK-MF8-04`
- `bk_id`: `BK-MF8-04`
- `macro`: `MF8`
- `owner`: `Daniel Bulica`
- `apoio`: `Aline`
- `prioridade`: `P1`
- `estado`: `TODO`
- `esforco`: `S`
- `dependencias`: `BK-MF8-03`
- `rf_rnf`: `RNF21`
- `fase_documental`: `Fase 3`
- `sprint`: `S11-S12`
- `core_or_reforco`: `Core`
- `proximo_bk`: `BK-MF8-05`
- `guia_path`: `docs/planificacao/guias-bk/MF8/BK-MF8-04-base-de-dados-com-backups-automaticos-diarios.md`
- `last_updated`: `2026-07-10`

> **Contrato atual:** este guia substitui o antigo export JSON redigido e o respetivo `--dry-run`. Uma cópia redigida pode servir de demonstração de export, mas não consegue restaurar a base e, por isso, não cumpre `RNF21`.
>
> **Estado da implementação de referência — 2026-07-10:** `10/10` testes do core e `3/3` integrações em `MongoMemoryReplSet` validaram round-trip/restore, BSON, índices, cifra/checksums e a nova fronteira completa. A leitura usa um único `readConcern:snapshot`; staging 0700 e ficheiros 0600 só são publicados por rename depois da verificação. Falha injetada ou drift de índice deixam zero parcial/órfão e preservam snapshots anteriores.

## Bloco pedagogico

### Objetivo

Implementar um snapshot diário recuperável da base MongoDB académica local. No fim, deves conseguir:

- preservar documentos BSON e índices em Extended JSON;
- construir cada snapshot numa pasta staging privada e publicá-lo apenas por rename atómico depois da validação completa;
- cifrar cada payload com AES-256-GCM, chave dedicada e AAD;
- detetar alterações através de checksums do payload e do manifest;
- restaurar apenas para uma base local isolada terminada em `_restore`;
- comparar documentos e índices depois do restore;
- manter os sete snapshots mais recentes;
- impedir que o scheduler arranque sem opt-in explícito `dev:local`.
- exigir `ORELLE_LOCAL_BACKUP_ENABLED=true`, chave dedicada e destino privado; `npm run dev` nunca pode ativá-lo.
- impedir overlap entre ticks e aguardar o job em curso durante shutdown/cleanup.

### Pre-requisitos

- concluir `BK-MF8-03` e ter uma base MongoDB local isolada;
- conhecer `async/await`, módulos ES, `node:crypto` e operações básicas MongoDB;
- executar os comandos dentro de `apps/api`;
- usar apenas URI loopback sem credenciais;
- criar uma chave exclusiva para backup, nunca reutilizar `SESSION_SECRET`;
- garantir que `storage/private/backups/` está ignorada pelo Git.

### Conceitos essenciais

Um backup só é recuperável quando o restore foi realmente testado. Um ficheiro que lista contagens, omite campos ou redige valores pessoais não recria o estado original e não pode ser tratado como backup.

Extended JSON preserva tipos BSON que JSON normal perde, como `ObjectId`, `Date`, `Decimal128` e binários. Cada coleção deve guardar os documentos e a definição reproduzível dos seus índices.

AES-GCM oferece confidencialidade e autenticação. A AAD liga o ficheiro ao par `snapshot:coleção`; trocar um payload entre snapshots ou coleções deve falhar. O manifest e o respetivo sidecar SHA-256 permitem detetar alterações antes do restore.

O restore nunca deve escrever diretamente na base académica principal. O alvo técnico é uma base efémera `_restore`, que é comparada e removida no final da verificação.

### Erros comuns

- usar `JSON.stringify` simples e perder tipos BSON;
- guardar a chave no `.env` geral, no Git ou na evidence;
- aceitar uma URI remota, `mongodb+srv://` ou credenciais embebidas;
- restaurar sobre a base principal;
- verificar apenas se o ficheiro existe;
- chamar “automático” a um helper de scheduler que nunca foi ativado;
- voltar a publicar `npm run backup:daily` para o export redigido legado.

### Check de compreensao

1. Porque é que um export redigido não é recuperável?
2. Que problema resolve a AAD além da cifra?
3. Porque é obrigatório preservar e comparar índices?
4. Porque é que o nome da base de restore termina em `_restore`?
5. Que evidência falta quando só passaram testes unitários com mocks?

## Bloco operacional

### Entrada

- base MongoDB local explicitamente indicada por `ORELLE_LOCAL_MONGODB_URI`;
- chave AES de 32 bytes em `ORELLE_BACKUP_KEY`;
- destino opcional `ORELLE_BACKUP_ROOT`, sempre dentro de `storage/private`;
- opt-in do scheduler exclusivamente por `ORELLE_LOCAL_BACKUP_ENABLED=true` e `npm run dev:local`;
- snapshot opcional `ORELLE_BACKUP_SNAPSHOT_ID`;
- base manual de restore opcional `ORELLE_RESTORE_DATABASE`, terminada em `_restore`.

### Passos

#### Passo 1 - Fixar o contrato e separar o legado

Confirma que o alvo público continua em `apps/api`. A implementação deve usar estes módulos:

| Ficheiro | Responsabilidade |
| --- | --- |
| `apps/api/scripts/backup-local.core.mjs` | EJSON, cifra, checksums, manifest, índices, restore, verify e retenção |
| `apps/api/scripts/backup-create.mjs` | criar snapshot e aplicar retenção |
| `apps/api/scripts/backup-restore.mjs` | restore manual restrito a `_restore` |
| `apps/api/scripts/backup-verify.mjs` | restore efémero, comparação e cleanup |
| `apps/api/scripts/backup-prune.mjs` | manter sete snapshots |
| `apps/api/scripts/backup-scheduler.mjs` | intervalo diário apenas com opt-in `dev:local` |
| `apps/api/scripts/run-local-dev.mjs` | resolve flag/chave/root antes de limpar o ambiente, liga o job recuperável apenas a `dev:local` e faz teardown ordenado |
| `apps/api/tests/backup-local.core.test.js` | contrato unitário sem rede |

O antigo `apps/api/scripts/backup-daily.mjs`, quando gera JSON redigido, fica fora da prova recuperável. Pode permanecer como artefacto histórico, mas não deve ter alias npm operacional nem ser usado para fechar `RNF21`.

#### Passo 2 - Proteger destino, comandos e segredos

Acrescenta ao `.gitignore`:

```gitignore
# Snapshots locais cifrados da API Orélle
storage/private/backups/
storage/private/backups-test/
*.ejson.enc
```

O `package.json` publica exclusivamente os quatro comandos recuperáveis:

```json
{
  "scripts": {
    "backup:create": "node scripts/backup-create.mjs",
    "backup:restore": "node scripts/backup-restore.mjs",
    "backup:verify": "node scripts/backup-verify.mjs",
    "backup:prune": "node scripts/backup-prune.mjs"
  }
}
```

Não coloques a chave em `.env.example`. Define-a apenas no terminal da sessão:

```bash
export ORELLE_LOCAL_MONGODB_URI='<mongodb://127.0.0.1:PORTA/orelle?replicaSet=REPLICA_SET_EFEMERO>'
export ORELLE_BACKUP_KEY='<32-bytes-em-base64-ou-64-caracteres-hex>'
```

#### Passo 3 - Implementar as fronteiras de segurança do core

O core deve recusar chave inválida, destino público e URI não local antes de ligar à base:

```js
// apps/api/scripts/backup-local.core.mjs
import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

const ALGORITHM = "aes-256-gcm";
const KEY_BYTES = 32;
const LOCAL_HOSTS = new Set(["127.0.0.1", "localhost", "::1", "[::1]"]);

export function sha256(value) {
    return createHash("sha256").update(value).digest("hex");
}

export function parseBackupEncryptionKey(rawKey) {
    const value = String(rawKey ?? "").trim();
    const key = /^[a-f0-9]{64}$/i.test(value)
        ? Buffer.from(value, "hex")
        : Buffer.from(value, "base64");

    if (key.length !== KEY_BYTES) {
        throw new Error("ORELLE_BACKUP_KEY deve conter exatamente 32 bytes");
    }

    return key;
}

export function assertLocalMongoUri(rawUri) {
    const uri = String(rawUri ?? "").trim();
    if (!uri.startsWith("mongodb://") || uri.includes("@")) {
        throw new Error("O backup exige URI MongoDB local sem credenciais");
    }

    const parsed = new URL(uri);
    const databaseName = decodeURIComponent(parsed.pathname.replace(/^\//, ""));
    if (!LOCAL_HOSTS.has(parsed.hostname) || !/^[a-zA-Z0-9_-]+$/.test(databaseName)) {
        throw new Error("A URI deve usar loopback e indicar uma base explícita");
    }

    return { uri, databaseName };
}

export function encryptBackupBuffer(plaintext, rawKey, aad) {
    const key = parseBackupEncryptionKey(rawKey);
    const iv = randomBytes(12);
    const cipher = createCipheriv(ALGORITHM, key, iv);
    cipher.setAAD(Buffer.from(aad, "utf8"));
    const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()]);

    return {
        format: "orelle-aes-gcm-envelope-v1",
        algorithm: ALGORITHM,
        aad,
        iv: iv.toString("base64"),
        authTag: cipher.getAuthTag().toString("base64"),
        plaintextSha256: sha256(plaintext),
        ciphertext: ciphertext.toString("base64"),
    };
}

export function decryptBackupBuffer(envelope, rawKey, expectedAad) {
    if (envelope?.aad !== expectedAad || envelope?.algorithm !== ALGORITHM) {
        throw new Error("Envelope fora de contexto");
    }

    const decipher = createDecipheriv(
        ALGORITHM,
        parseBackupEncryptionKey(rawKey),
        Buffer.from(envelope.iv, "base64"),
    );
    decipher.setAAD(Buffer.from(expectedAad, "utf8"));
    decipher.setAuthTag(Buffer.from(envelope.authTag, "base64"));
    const plaintext = Buffer.concat([
        decipher.update(Buffer.from(envelope.ciphertext, "base64")),
        decipher.final(),
    ]);

    if (sha256(plaintext) !== envelope.plaintextSha256) {
        throw new Error("Checksum original inválido");
    }

    return plaintext;
}
```

Além destas funções, `resolveBackupRoot` deve aceitar apenas uma subpasta de `storage/private`; nunca `public`, `dist`, `build` ou `node_modules`.

#### Passo 4 - Criar snapshots integrais

`createBackupSnapshot` deve executar, pela mesma ordem:

1. criar `<snapshotId>.staging-<nonce>` dentro do backup root privado com permissões `0700`;
2. listar coleções não `system.*`, ordenar documentos por `_id` e normalizar índices;
3. serializar `{ format, collectionName, documents, indexes }` com `mongoose.mongo.BSON.EJSON` em modo não relaxado;
4. cifrar com AAD `${snapshotId}:${collectionName}` e escrever cada payload apenas na pasta staging;
5. guardar no manifest contagens e SHA-256 cifrado/original;
6. escrever `manifest.json` e `manifest.sha256` na staging;
7. reler e autenticar todos os payloads, manifest e checksums;
8. publicar o snapshot completo com um único `rename(stagingDir, finalSnapshotDir)` atómico;
9. num `catch/finally`, remover staging incompleta sem tocar em snapshots já publicados;
10. aplicar retenção apenas a diretórios finais completos, mantendo os sete IDs mais recentes.

Nunca tornes visível um diretório final antes de todas as coleções, índices, manifest e sidecar estarem válidos. Restore/verify ignoram e recusam nomes staging; prune só pode limpar staging antiga com limite temporal explícito e dentro do root validado.

O CLI deve imprimir apenas contagens e o `snapshotId`:

```js
// apps/api/scripts/backup-create.mjs
const { client, db } = await connectLocalMongo(
    process.env.ORELLE_LOCAL_MONGODB_URI,
);

try {
    const manifest = await createBackupSnapshot({
        db,
        backupRoot: process.env.ORELLE_BACKUP_ROOT,
        encryptionKey: process.env.ORELLE_BACKUP_KEY,
    });
    const retention = await pruneBackupSnapshots({
        backupRoot: process.env.ORELLE_BACKUP_ROOT,
        keep: 7,
    });

    console.log(JSON.stringify({
        status: "created",
        snapshotId: manifest.snapshotId,
        collectionCount: manifest.collections.length,
        retainedSnapshots: retention.kept.length,
        prunedSnapshots: retention.pruned.length,
    }));
} finally {
    await client.close();
}
```

Nunca imprimas URI, chave, conteúdo dos documentos ou caminhos absolutos privados.

#### Passo 5 - Restaurar, verificar, limpar e agendar

`restoreBackupSnapshot` deve recusar qualquer base cujo nome não termine em `_restore`, autenticar o manifest e todos os envelopes antes de apagar o destino, recriar coleções/documentos e voltar a criar os índices exceto `_id_`.

`verifyBackupSnapshot` deve restaurar numa base efémera, comparar hashes EJSON de documentos e índices e executar `dropDatabase()` num `finally`.

O scheduler permanece isolado do arranque normal da API. `run-local-dev.mjs` só lê chave/root quando o modo é `dev:local` e a flag é exatamente `true`; no modo `dev` devolve configuração desativada sem tocar na chave:

```js
// apps/api/scripts/backup-scheduler.mjs
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

export function startLocalBackupScheduler({
    runtimeMode,
    enabled,
    runJob,
    setIntervalFn = setInterval,
    clearIntervalFn = clearInterval,
    onError = () => undefined,
}) {
    if (runtimeMode !== "dev:local" || enabled !== true) {
        return { started: false, timer: null };
    }
    if (typeof runJob !== "function") {
        throw new Error("Scheduler local exige um job de backup");
    }

    let activeJob = null;
    let stopping = false;
    const runScheduledJob = () => {
        if (stopping) return Promise.resolve();
        if (activeJob) return activeJob;

        activeJob = Promise.resolve()
            .then(runJob)
            .catch((error) => onError(error))
            .finally(() => {
                activeJob = null;
            });
        return activeJob;
    };
    const timer = setIntervalFn(runScheduledJob, ONE_DAY_MS);
    timer?.unref?.();
    return {
        started: true,
        timer,
        async stop() {
            stopping = true;
            clearIntervalFn(timer);
            await activeJob;
        },
    };
}
```

O wiring em `run-local-dev.mjs` exige simultaneamente `runtimeMode="dev:local"`, `ORELLE_LOCAL_BACKUP_ENABLED=true` e `ORELLE_BACKUP_KEY` válida; `ORELLE_BACKUP_ROOT` é opcional e privado. O job executa `createBackupSnapshot` seguido de `pruneBackupSnapshots({ keep: 7 })`. `npm run dev` publica `--runtime-mode=dev` e, por contrato, nunca inicia nem lê a chave do scheduler.

#### Passo 6 - Criar testes sem rede e negativos

O teste focal deve cobrir pelo menos:

```js
// apps/api/tests/backup-local.core.test.js
it("recusa URI remota, SRV e credenciais", () => {
    expect(() => assertLocalMongoUri("mongodb+srv://cluster/orelle")).toThrow();
    expect(() => assertLocalMongoUri("mongodb://user:pass@127.0.0.1/orelle")).toThrow();
    expect(() => assertLocalMongoUri("mongodb://192.0.2.10/orelle")).toThrow();
});

it("autentica chave, AAD e ciphertext", () => {
    const envelope = encryptBackupBuffer(
        Buffer.from("EJSON"),
        TEST_KEY,
        "snapshot:users",
    );
    expect(decryptBackupBuffer(envelope, TEST_KEY, "snapshot:users"))
        .toEqual(Buffer.from("EJSON"));
    expect(() => decryptBackupBuffer(envelope, TEST_KEY, "snapshot:orders"))
        .toThrow();
});

it("mantém exatamente sete snapshots", async () => {
    const result = await pruneBackupSnapshots({ backupRoot: TEST_ROOT, keep: 7 });
    expect(result.kept).toHaveLength(7);
});

it("não inicia scheduler sem opt-in dev:local", () => {
    expect(startLocalBackupScheduler({
        runtimeMode: "dev",
        enabled: true,
        runJob: vi.fn(),
    }).started).toBe(false);
});

it("não sobrepõe jobs e stop aguarda o job ativo", async () => {
    // Dispara dois ticks antes de resolver o primeiro job e confirma uma chamada.
    // Depois chama stop(), resolve o job e confirma cleanup do timer.
});
```

Acrescenta ainda round-trip de `ObjectId`/`Date` e índices, alteração do ficheiro cifrado, chave errada, manifest alterado, destino fora de `storage/private` e falha injetada depois de cada escrita. Cada falha deixa zero diretórios finais parciais e zero staging órfã.

Executar cenarios negativos obrigatorios (minimo 2). Para este BK, executa pelo menos URI remota e restore sem sufixo `_restore`; recomenda-se também tamper, chave errada e scheduler sem opt-in.

#### Passo 7 - Executar o ciclo real e recolher evidence

Primeiro executa a prova unitária:

```bash
npm --prefix apps/api test -- tests/backup-local.core.test.js
```

Depois, num MongoDB local configurado como replica set e com dados exclusivamente académicos/de teste:

```bash
cd apps/api
node scripts/backup-create.mjs
node scripts/backup-verify.mjs
node scripts/backup-prune.mjs
ORELLE_RESTORE_DATABASE=orelle_manual_restore node scripts/backup-restore.mjs
```

Confirma:

- `backup-create` criou manifest, sidecar e payloads `.ejson.enc`;
- `backup-verify` devolveu `status: "verified"`;
- todos os documentos e índices coincidiram;
- a base efémera de verificação foi removida;
- o restore manual só escreveu em `orelle_manual_restore`;
- ficaram no máximo sete snapshots;
- o terminal não mostrou URI, chave, documentos ou caminhos privados;
- `git status` não lista artefactos de backup.

### Validacao

- [ ] `node --check` passa nos seis módulos do pipeline.
- [ ] `npm --prefix apps/api test -- tests/backup-local.core.test.js` passa.
- [ ] O ciclo real `create -> restore _restore -> verify` passa num replica set local.
- [ ] Documentos BSON e índices coincidem depois do restore.
- [ ] Falha injetada durante create não publica snapshot parcial nem deixa staging órfã.
- [ ] Tamper, chave/AAD erradas, URI remota e restore não isolado são recusados.
- [ ] Retenção mantém exatamente sete snapshots.
- [ ] Scheduler fica parado sem `runtimeMode="dev:local"`, `ORELLE_LOCAL_BACKUP_ENABLED=true` e chave válida; `npm run dev` nunca o ativa nem lê a chave.
- [ ] Dois ticks sobrepostos executam um único job; `stop()` limpa o timer e aguarda o job ativo, incluindo no shutdown/erro de startup.
- [ ] O manifest não publica `backup:daily` nem referencia `backup-daily.mjs`.
- [ ] Negativos: minimo 2 cenarios com resultado controlado.
- [ ] `bash scripts/validate-planificacao.sh` passa.
- [ ] `git diff --check` passa.

### Handoff

- Próximo BK recomendado: `BK-MF8-05`.
- Entrega ao próximo BK apenas o estado objetivo: unitários, ciclo replica-set, negativos e riscos.
- No projeto dos alunos, regista `PENDENTE` enquanto faltar o gate completo. Na referência, consulta o plano mestre para a evidence atual; não reutilizes a linha histórica de “primeira metade” nem contagens deste guia como prova corrente.

## Criterios de aceite

- Snapshot integral em Extended JSON preserva documentos e índices.
- AES-256-GCM usa chave dedicada, IV aleatório, auth tag e AAD por snapshot/coleção.
- Manifest, sidecar e payloads têm checksums verificados antes do restore.
- Snapshot só fica visível depois de rename atómico da staging completa e validada.
- Restore só aceita uma base local terminada em `_restore`.
- Verify compara documentos e índices e limpa a base efémera.
- Retenção mantém sete snapshots.
- Scheduler só inicia por opt-in `dev:local` com flag exata, chave válida e destino privado; não sobrepõe jobs e o shutdown aguarda cleanup.
- Cenarios negativos concluidos: minimo `2` com resultado controlado.
- Evidencia de testes por camada conforme prioridade (`P1`): unit/integration e negativos.
- Nenhum segredo, documento ou caminho privado aparece na evidence.

### Matriz minima de testes por prioridade

- `P0`: `unit + integration + e2e` e mínimo 3 negativos.
- `P1`: `unit/integration` e mínimo 2 negativos.
- `P2`: teste focal e mínimo 1 negativo.
- Para este `P1`, o teste unitário do formato e a integração real de restore são ambos obrigatórios.

## Evidence para PR/defesa

- `proof_unit`: resultado do teste `backup-local.core.test.js`.
- `proof_create`: `snapshotId`, número de coleções e contagem de snapshots retidos, sem paths.
- `proof_atomicity`: falhas injetadas deixam zero snapshot parcial/staging órfã e preservam snapshots anteriores.
- `proof_restore`: nome sanitizado da base `_restore` e número de coleções restauradas.
- `proof_verify`: `status="verified"` e igualdade de documentos/índices.
- `proof_cleanup`: ausência da base efémera depois da verificação.
- `proof_retention`: sete snapshots mantidos e número eliminado.
- `proof_negativos`: URI remota, restore sem `_restore`, tamper e chave/AAD erradas recusados.
- `proof_scheduler`: `npm run dev` nunca arranca/lê chave; `dev:local` sem flag também não; flag inválida falha; com opt-in exato há create+prune, anti-overlap e stop aguardado.
- `proof_git`: nenhum `.ejson.enc`, manifest ou sidecar em `git status`.
- `proof_runtime_current`: remissão para a evidence atual do plano mestre sobre atomicidade, ponto temporal consistente, permissões, failure injection, restore e seleção apenas de snapshots completos.

## Changelog

- `2026-07-10`: estado corrente posterior: staging/snapshot/rename passaram 10/10 core e 3/3 replica-set, incluindo escrita concorrente consistente e drift de índice fail-closed.
- `2026-07-10`: alvo do tutorial endurecido para staging privada, validação integral e rename atómico do snapshot completo; validação runtime desta fronteira permanece pendente.
- `2026-07-10`: implementação de referência validada com `7/7` unitários e `1/1` integração `MongoMemoryReplSet` para `create -> restore _restore -> verify`, incluindo BSON, índices, checksums, recusa da origem e cleanup.
- `2026-07-10`: a linha anterior fica preservada como evidence histórica do round-trip e não deve ser interpretada como validação da posterior publicação por staging.
- `2026-07-09`: contrato reescrito de export redigido para snapshot recuperável: EJSON integral, AES-256-GCM/AAD, checksums, índices, restore `_restore`, verify com cleanup, retenção sete, scheduler opt-in e prova replica-set obrigatória ainda pendente.
- `2026-07-01`: versão pedagógica anterior com `backup-daily.mjs`, redacção e `--dry-run`; supersedida por não ser recuperável.
- `2026-06-30`: estrutura tutorial MF8 e caminhos públicos `apps/...`.
