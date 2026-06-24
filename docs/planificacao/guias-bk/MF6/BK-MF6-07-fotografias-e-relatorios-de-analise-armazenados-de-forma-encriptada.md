# BK-MF6-07 - Fotografias e relatórios de análise armazenados de forma encriptada

## Header
- `doc_id`: `GUIA-BK-MF6-07`
- `bk_id`: `BK-MF6-07`
- `macro`: `MF6`
- `owner`: `Aline`
- `apoio`: `Izelicks`
- `prioridade`: `P0`
- `estado`: `TODO`
- `esforco`: `M`
- `dependencias`: `-`
- `rf_rnf`: `RNF11`
- `fase_documental`: `Fase 3`
- `sprint`: `S10-S11`
- `core_or_reforco`: `Reforco`
- `classe_core_dual`: `SUPORTE`
- `eixo_primario`: `FundacaoQualidade`
- `kpi_primario`: `taxa_incidentes_criticos`
- `kpi_secundario`: `taxa_conformidade_gates`
- `proximo_bk`: `BK-MF7-01`
- `guia_path`: `docs/planificacao/guias-bk/MF6/BK-MF6-07-fotografias-e-relatorios-de-analise-armazenados-de-forma-encriptada.md`
- `last_updated`: `2026-06-24`

#### Objetivo

Neste BK vais fechar o requisito `RNF11`: fotografias faciais e relatórios de análise da Orélle têm de ficar protegidos quando estão guardados em disco ou na base de dados.

No fim, o upload facial continua a devolver apenas metadados seguros, mas o ficheiro guardado deixa de ser a fotografia original. O relatório continua a poder ser usado por histórico, recomendações, exportações autorizadas e resposta ao cliente, mas os campos sensíveis ficam cifrados em repouso.

`CANONICO`: `RNF11` exige fotografias e relatórios de análise armazenados de forma encriptada. `DERIVADO`: neste projeto, a solução usa `node:crypto` com AES-256-GCM para evitar dependências novas e manter a implementação auditável por alunos do 12.º ano.

#### Importância

HTTPS protege a comunicação entre browser e API. Este BK trata outro problema: o que acontece depois de o backend receber e guardar dados sensíveis. Fotografias faciais e relatórios cosméticos podem revelar informação pessoal, por isso não devem ficar legíveis em ficheiros privados nem em campos de base de dados.

A encriptação em repouso não substitui autenticação, ownership, consentimento, minimização, eliminação, anonymização ou auditoria. Ela acrescenta uma camada de defesa: mesmo que alguém consiga ler storage ou dumps de base de dados, não deve obter diretamente fotografia ou relatório.

#### Scope-in

- Criar uma chave `DATA_ENCRYPTION_KEY` configurada fora do código-fonte.
- Criar service AES-256-GCM com IV único, tag de integridade e helpers para `Buffer` e JSON.
- Encriptar fotografias depois da validação de assinatura e antes de persistir metadados em `FacePhoto`.
- Guardar metadados de cifragem de fotografia com `select: false`.
- Guardar campos sensíveis de `FaceReport` cifrados, mantendo a interface pública que os services já usam.
- Preservar `privacyStatus` criado em `BK-MF5-01`.
- Rever consumidores internos de relatórios para garantir que usam campos decifrados pelo modelo.
- Criar testes unitários, de integração e de resposta pública, com três negativos obrigatórios.

#### Scope-out

- Não criar KMS externo, rotação automática de chaves ou múltiplas versões de chave.
- Não alterar endpoints públicos de fotografias ou relatórios.
- Não criar consentimento RGPD novo; isso fica para `BK-MF7-01`.
- Não alterar o contrato de eliminação/anonymização criado em `BK-MF5-01`.
- Não expor chave, IV, auth tag, `storageKey`, ficheiro privado ou texto cifrado ao frontend.
- Não usar fotografias para treinar modelos sem uma base documental própria.

#### Estado antes e depois

- Antes: a app validava upload, consentimento e ownership, mas `FacePhoto.storageKey` apontava para ficheiro original e `FaceReport` guardava `cosmeticSummary`, `routineSuggestions`, `sources` e `limitations` em claro.
- Depois: fotografias são gravadas como ficheiros `.enc`; `FacePhoto` guarda só metadados técnicos privados; `FaceReport` mantém a mesma interface de leitura, mas grava campos sensíveis cifrados; respostas públicas continuam minimizadas.

#### Pre-requisitos

- `BK-MF1-05`: upload de fotografias frontal e de perfil, consentimento facial e `FacePhoto`.
- `BK-MF1-06`: análise facial com provider isolado e limites cosméticos.
- `BK-MF1-07`: geração de relatório facial personalizado.
- `BK-MF1-08`: histórico pessoal baseado em análises e relatórios.
- `BK-MF2-02`: recomendações personalizadas que consomem relatório e análise.
- `BK-MF5-01`: estados `deleted`/`anonymized` e `privacyStatus`.
- `BK-MF5-04`: auditoria de acessos a dados biométricos.
- `BK-MF6-05`: transporte seguro.
- `BK-MF6-06`: disciplina de segredos e minimização de respostas.

#### Glossário

- Encriptação em repouso: proteção aplicada a dados guardados, não apenas a dados em trânsito.
- AES-256-GCM: algoritmo simétrico que protege confidencialidade e integridade.
- IV: valor aleatório usado uma única vez por cifragem.
- Auth tag: valor que permite detetar alteração do conteúdo cifrado.
- Chave de dados: segredo de ambiente usado para cifrar e decifrar.
- Ciphertext: conteúdo cifrado, ilegível sem chave correta.
- Metadados seguros: dados necessários para a app funcionar sem revelar imagem, relatório completo, chave ou ficheiro interno.

#### Conceitos teóricos essenciais

Na Orélle, fotografia facial e relatório de análise pertencem ao utilizador autenticado. O frontend nunca decide ownership; o backend recebe o `userId` da sessão e usa esse valor nas queries. Este BK mantém essa regra: a encriptação protege o conteúdo, mas a autorização continua a decidir quem pode criar, listar ou usar o recurso.

AES-256-GCM usa a mesma chave para cifrar e decifrar, por isso a chave tem de ficar fora do repositório. O IV muda em cada operação; reutilizar IV com a mesma chave enfraquece a proteção. A auth tag impede aceitar conteúdo alterado como se fosse válido.

Relatórios de análise têm campos úteis para histórico, recomendação e exportação autorizada. Encriptar não significa apagar esses contratos: significa guardar o valor cifrado e entregar o valor decifrado apenas dentro do backend, depois de a query correta aplicar ownership e `privacyStatus`.

Erros comuns a evitar neste BK: colocar a chave real no repositório, reutilizar IV fixo, guardar a fotografia original e a versão cifrada ao mesmo tempo, devolver `storageKey`, IV, auth tag ou ciphertext na resposta, ou cifrar relatório e esquecer histórico, recomendações e exportações autorizadas.

#### Arquitetura do BK

- Endpoint(s): nenhum endpoint novo; mantém `POST /api/face-photos` e `POST /api/face-reports/latest`.
- Modelo/schema: `FacePhoto` ganha metadados de cifragem privados; `FaceReport` passa a cifrar campos sensíveis no próprio schema.
- Service(s): `encryption.service.js`, `face-secure-storage.service.js`, `face-photo.service.js` e `face-report.service.js`.
- Controller/route: sem alteração de rota; os controllers continuam a devolver DTOs minimizados.
- Guard/middleware: reutiliza autenticação, consentimento e upload já criados.
- Cliente API: sem alteração; o frontend não recebe detalhes criptográficos.
- Testes: unit de cifragem, integração de upload cifrado, relatório cifrado e resposta pública minimizada.
- Handoff para o próximo BK: `BK-MF7-01` acrescenta consentimento RGPD sem remover esta proteção em repouso.

#### Ficheiros a criar/editar/rever

- CRIAR: `apps/api/.env.example`
- EDITAR: `apps/api/src/config/env.js`
- CRIAR: `apps/api/src/services/encryption.service.js`
- CRIAR: `apps/api/src/services/face-secure-storage.service.js`
- EDITAR: `apps/api/src/models/face-photo.model.js`
- EDITAR: `apps/api/src/services/face-photo.service.js`
- EDITAR: `apps/api/src/models/face-report.model.js`
- EDITAR: `apps/api/src/services/face-report.service.js`
- REVER: `apps/api/src/services/skin-history.service.js`
- REVER: `apps/api/src/services/recommendation.service.js`
- REVER: `apps/api/src/services/admin-export.service.js`
- CRIAR: `apps/api/tests/mf6.encryption.test.js`

#### Tutorial técnico linear

### Passo 1 - Confirmar contrato e fronteiras de dados

1. Objetivo funcional do passo no contexto da app.

Confirmar que este BK protege dados guardados, sem mudar o contrato público dos endpoints.

2. Ficheiros envolvidos:
    - REVER: `docs/RNF.md`
    - REVER: `docs/RF.md`
    - REVER: `docs/planificacao/backlogs/MATRIZ-CANONICA-BK.md`
    - REVER: `docs/planificacao/guias-bk/MF1/BK-MF1-05-permitir-upload-de-fotografias-do-rosto-frontal-e-perfil.md`
    - REVER: `docs/planificacao/guias-bk/MF1/BK-MF1-07-gerar-um-relatorio-personalizado-com-diagnostico-e-sugestoes-de-rotina.md`
    - REVER: `docs/planificacao/guias-bk/MF5/BK-MF5-01-painel-para-consultores-admins-reverem-e-aprovarem-pedidos-de-eliminacao-anonymizacao-de-fotografias-e-relatorios.md`
    - LOCALIZAÇÃO: contrato documental antes de alterar código.

3. Instruções do que fazer.

Confirma que `RNF11` é `Must`, que o BK alvo não cria endpoint novo e que a proteção se aplica a dois tipos de conteúdo: fotografia facial em ficheiro privado e relatório facial em MongoDB.

4. Código completo, correto e integrado com a app final.

Sem código neste passo. Este passo é de confirmação documental porque uma decisão errada aqui criaria endpoints ou campos fora do contrato canónico.

5. Explicação do código.

Não há código porque o objetivo é impedir uma mudança técnica sem base documental. A decisão importante é manter endpoints e DTOs públicos estáveis: o backend muda a forma como guarda dados, mas o frontend continua a receber apenas metadados e conteúdo permitido.

6. Validação do passo.

Executa `rg -n "RNF11|BK-MF6-07|RF13|RF15|RF41|RF44" docs/RNF.md docs/RF.md docs/planificacao/backlogs/MATRIZ-CANONICA-BK.md` e confirma que os requisitos ligados são fotografia, relatório, privacidade, eliminação/anonymização e auditoria.

7. Cenário negativo/erro esperado.

Se encontrares uma proposta de endpoint novo para descarregar fotografia facial sem ownership, essa proposta deve ser rejeitada neste BK.

### Passo 2 - Criar configuração segura da chave

1. Objetivo funcional do passo no contexto da app.

Centralizar `DATA_ENCRYPTION_KEY` na configuração da API e documentar como gerar a chave local sem guardar segredo real.

2. Ficheiros envolvidos:
    - CRIAR: `apps/api/.env.example`
    - EDITAR: `apps/api/src/config/env.js`
    - LOCALIZAÇÃO: ficheiros completos.

3. Instruções do que fazer.

Cria `.env.example` com instrução controlada e edita `env.js` sem remover a validação de `SESSION_SECRET` em produção.

4. Código completo, correto e integrado com a app final.

```dotenv
# apps/api/.env.example
NODE_ENV=development
PORT=3001
MONGODB_URI=mongodb://127.0.0.1:27017/orelle
CLIENT_ORIGIN=http://localhost:5173
SESSION_SECRET=dev-only-change-me
SESSION_TTL=2h

# Gera uma chave local com:
# node -e "console.log(require('node:crypto').randomBytes(32).toString('base64'))"
# Cola aqui apenas no teu .env local. Não coloques uma chave real neste ficheiro.
DATA_ENCRYPTION_KEY=gerar-chave-local-com-randombytes-32-base64
```

```js
// apps/api/src/config/env.js
/**
 * Configuração central da API Orélle.
 *
 * O resto da aplicação importa `env` e não lê `process.env` diretamente.
 * Isto evita que segredos técnicos fiquem espalhados por vários módulos.
 */
import "dotenv/config";

const INSECURE_SESSION_SECRETS = new Set([
    "dev-only-change-me",
    "change-me",
    "change-me-use-a-long-random-string",
    "secret",
    "session-secret",
]);

/**
 * Identifica segredos de sessão que não são aceitáveis em produção.
 *
 * @function isUnsafeProductionSessionSecret
 * @param {string|undefined} secret - Valor de SESSION_SECRET.
 * @returns {boolean} Verdadeiro quando o segredo é ausente, fraco ou temporário.
 */
export function isUnsafeProductionSessionSecret(secret) {
    const normalizedSecret = String(secret ?? "").trim();

    return (
        normalizedSecret.length < 32 ||
        INSECURE_SESSION_SECRETS.has(normalizedSecret.toLowerCase())
    );
}

/**
 * Variáveis de ambiente normalizadas usadas pelo backend.
 *
 * @type {{
 *   nodeEnv: string,
 *   port: number,
 *   mongoUri: string,
 *   clientOrigin: string,
 *   sessionSecret: string,
 *   sessionTtl: string,
 *   stripeSecretKey: string|undefined,
 *   dataEncryptionKey: string|undefined
 * }}
 */
export const env = {
    nodeEnv: process.env.NODE_ENV ?? "development",
    port: Number(process.env.PORT ?? 3001),
    mongoUri: process.env.MONGODB_URI ?? "mongodb://127.0.0.1:27017/orelle",
    clientOrigin: process.env.CLIENT_ORIGIN ?? "http://localhost:5173",
    sessionSecret: process.env.SESSION_SECRET ?? "dev-only-change-me",
    sessionTtl: process.env.SESSION_TTL ?? "2h",
    stripeSecretKey: process.env.STRIPE_SECRET_KEY,
    dataEncryptionKey: process.env.DATA_ENCRYPTION_KEY,
};

// Em produção, uma sessão assinada com o segredo de desenvolvimento seria
// uma falha grave. Por isso, a aplicação bloqueia logo no arranque.
if (
    env.nodeEnv === "production" &&
    isUnsafeProductionSessionSecret(env.sessionSecret)
) {
    throw new Error("SESSION_SECRET forte obrigatorio em producao");
}
```

5. Explicação do código.

O `.env.example` ensina como gerar uma chave, mas não contém uma chave real. O `env.js` passa a disponibilizar `dataEncryptionKey` no mesmo objeto usado pelo resto do backend. A validação de `SESSION_SECRET` fica intacta porque este BK não pode enfraquecer autenticação.

6. Validação do passo.

Executa `rg -n "DATA_ENCRYPTION_KEY" apps/api/.env.example apps/api/src/config/env.js` e confirma que o valor real não está no repositório.

7. Cenário negativo/erro esperado.

Se `DATA_ENCRYPTION_KEY` tiver menos de 32 bytes depois de decodificada de base64, o service do passo seguinte deve lançar erro antes de guardar dados sensíveis.

### Passo 3 - Criar service de encriptação AES-256-GCM

1. Objetivo funcional do passo no contexto da app.

Criar funções reutilizáveis para cifrar e decifrar fotografias e JSON de relatório.

2. Ficheiros envolvidos:
    - CRIAR: `apps/api/src/services/encryption.service.js`
    - LOCALIZAÇÃO: ficheiro completo.

3. Instruções do que fazer.

Usa `node:crypto`, valida a chave em base64, gera IV novo por operação e transforma erros criptográficos em erro controlado.

4. Código completo, correto e integrado com a app final.

```js
// apps/api/src/services/encryption.service.js
import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";
import { AppError } from "../middlewares/error.middleware.js";

export const DATA_ENCRYPTION_ALGORITHM = "aes-256-gcm";

const IV_BYTES = 12;
const KEY_BYTES = 32;

/**
 * Converte a chave base64 de ambiente em Buffer.
 *
 * @function parseEncryptionKey
 * @param {string|undefined} rawKey - Chave em base64.
 * @returns {Buffer} Chave binária de 32 bytes.
 * @throws {AppError} Quando a chave está ausente ou tem tamanho inválido.
 */
export function parseEncryptionKey(rawKey) {
    const key = Buffer.from(String(rawKey ?? ""), "base64");

    if (key.length !== KEY_BYTES) {
        throw new AppError(500, "Chave de encriptação inválida.");
    }

    return key;
}

/**
 * Encripta um Buffer com AES-256-GCM.
 *
 * @function encryptBuffer
 * @param {Buffer} plainBuffer - Conteúdo sensível original.
 * @param {Buffer} key - Chave validada.
 * @returns {{algorithm: string, iv: string, authTag: string, encrypted: Buffer}} Conteúdo cifrado.
 */
export function encryptBuffer(plainBuffer, key) {
    const iv = randomBytes(IV_BYTES);
    const cipher = createCipheriv(DATA_ENCRYPTION_ALGORITHM, key, iv);
    const encrypted = Buffer.concat([cipher.update(plainBuffer), cipher.final()]);

    // A tag de GCM permite detetar se alguém alterou o conteúdo guardado.
    return {
        algorithm: DATA_ENCRYPTION_ALGORITHM,
        iv: iv.toString("base64"),
        authTag: cipher.getAuthTag().toString("base64"),
        encrypted,
    };
}

/**
 * Decifra um Buffer protegido por AES-256-GCM.
 *
 * @function decryptBuffer
 * @param {{algorithm?: string, iv: string, authTag: string, encrypted: Buffer, key: Buffer}} input - Dados cifrados.
 * @returns {Buffer} Conteúdo original.
 * @throws {AppError} Quando o conteúdo foi alterado ou a chave não corresponde.
 */
export function decryptBuffer({ algorithm, iv, authTag, encrypted, key }) {
    if (algorithm && algorithm !== DATA_ENCRYPTION_ALGORITHM) {
        throw new AppError(500, "Algoritmo de encriptação não suportado.");
    }

    try {
        const decipher = createDecipheriv(
            DATA_ENCRYPTION_ALGORITHM,
            key,
            Buffer.from(iv, "base64"),
        );
        decipher.setAuthTag(Buffer.from(authTag, "base64"));

        return Buffer.concat([decipher.update(encrypted), decipher.final()]);
    } catch {
        throw new AppError(500, "Conteúdo sensível não pode ser decifrado.");
    }
}

/**
 * Encripta um valor JSON sem perder a estrutura original.
 *
 * @function encryptJson
 * @param {unknown} value - Valor sensível a guardar.
 * @param {Buffer} key - Chave validada.
 * @returns {{algorithm: string, iv: string, authTag: string, encrypted: string}} Payload cifrado serializável.
 */
export function encryptJson(value, key) {
    const plainBuffer = Buffer.from(JSON.stringify(value), "utf8");
    const encryptedPayload = encryptBuffer(plainBuffer, key);

    return {
        algorithm: encryptedPayload.algorithm,
        iv: encryptedPayload.iv,
        authTag: encryptedPayload.authTag,
        encrypted: encryptedPayload.encrypted.toString("base64"),
    };
}

/**
 * Decifra um payload JSON criado por `encryptJson`.
 *
 * @function decryptJson
 * @param {{algorithm: string, iv: string, authTag: string, encrypted: string}} payload - Payload persistido.
 * @param {Buffer} key - Chave validada.
 * @returns {unknown} Valor original.
 */
export function decryptJson(payload, key) {
    const plainBuffer = decryptBuffer({
        algorithm: payload.algorithm,
        iv: payload.iv,
        authTag: payload.authTag,
        encrypted: Buffer.from(payload.encrypted, "base64"),
        key,
    });

    return JSON.parse(plainBuffer.toString("utf8"));
}
```

5. Explicação do código.

O service fica isolado para que fotografia, relatório e testes usem a mesma regra. `parseEncryptionKey` bloqueia chave ausente ou fraca. `encryptBuffer` protege bytes de ficheiro. `encryptJson` protege campos de relatório sem perder arrays ou strings. `decryptBuffer` transforma falhas de integridade em erro controlado e não escreve dados sensíveis em logs.

6. Validação do passo.

Cria teste unitário com `randomBytes(32)`, cifra `Buffer.from("relatorio sensivel")`, confirma que o ciphertext é diferente e decifra de volta para o texto original.

7. Cenário negativo/erro esperado.

Se alterares um caractere em `authTag`, `decryptBuffer` deve lançar `"Conteúdo sensível não pode ser decifrado."`.

### Passo 4 - Criar storage seguro para fotografias

1. Objetivo funcional do passo no contexto da app.

Substituir a gravação durável da fotografia original por um ficheiro cifrado `.enc`.

2. Ficheiros envolvidos:
    - CRIAR: `apps/api/src/services/face-secure-storage.service.js`
    - LOCALIZAÇÃO: ficheiro completo.

3. Instruções do que fazer.

Lê a fotografia temporária validada, cifra o `Buffer`, grava `${sourcePath}.enc` e remove o ficheiro original depois da escrita cifrada terminar com sucesso.

4. Código completo, correto e integrado com a app final.

```js
// apps/api/src/services/face-secure-storage.service.js
import { readFile, unlink, writeFile } from "node:fs/promises";
import { env } from "../config/env.js";
import { AppError } from "../middlewares/error.middleware.js";
import {
    decryptBuffer,
    encryptBuffer,
    parseEncryptionKey,
} from "./encryption.service.js";

/**
 * Cifra uma fotografia facial validada antes de a tornar durável.
 *
 * @async
 * @function encryptFacePhotoFile
 * @param {{sourcePath: string}} input - Caminho privado criado pelo upload.
 * @returns {Promise<{storageKey: string, encryption: {algorithm: string, iv: string, authTag: string}}>} Dados privados para o model.
 */
export async function encryptFacePhotoFile({ sourcePath }) {
    const key = parseEncryptionKey(env.dataEncryptionKey);
    const originalBuffer = await readFile(sourcePath);
    const encryptedPayload = encryptBuffer(originalBuffer, key);
    const encryptedPath = `${sourcePath}.enc`;

    // A escrita cifrada acontece antes de remover o original para evitar perda
    // de ficheiro se o disco falhar durante a operação.
    await writeFile(encryptedPath, encryptedPayload.encrypted);

    try {
        await unlink(sourcePath);
    } catch {
        await unlink(encryptedPath).catch(() => undefined);
        throw new AppError(500, "Não foi possível concluir o armazenamento cifrado.");
    }

    return {
        storageKey: encryptedPath,
        encryption: {
            algorithm: encryptedPayload.algorithm,
            iv: encryptedPayload.iv,
            authTag: encryptedPayload.authTag,
        },
    };
}

/**
 * Remove ficheiros cifrados quando a persistência de metadados falha.
 *
 * @async
 * @function removeEncryptedFacePhotoFiles
 * @param {{storageKey?: string}[]} encryptedFiles - Ficheiros cifrados criados neste pedido.
 * @returns {Promise<void>} Conclui mesmo que algum ficheiro já tenha sido removido.
 */
export async function removeEncryptedFacePhotoFiles(encryptedFiles = []) {
    await Promise.all(
        encryptedFiles.map(({ storageKey }) => {
            if (!storageKey) return undefined;
            return unlink(storageKey).catch(() => undefined);
        }),
    );
}

/**
 * Lê uma fotografia cifrada para uso interno autorizado.
 *
 * @async
 * @function readEncryptedFacePhotoFile
 * @param {{storageKey: string, encryption: {algorithm: string, iv: string, authTag: string}}} photo - Documento com campos privados selecionados.
 * @returns {Promise<Buffer>} Bytes originais para providers internos autorizados.
 */
export async function readEncryptedFacePhotoFile(photo) {
    const key = parseEncryptionKey(env.dataEncryptionKey);
    const encrypted = await readFile(photo.storageKey);

    // A decifragem fica no backend; o frontend nunca recebe a fotografia original.
    return decryptBuffer({
        ...photo.encryption,
        encrypted,
        key,
    });
}
```

5. Explicação do código.

Este service protege fotografias. O ficheiro original existe apenas durante o pedido de upload e é removido depois de a versão cifrada ser escrita. Se a remoção do original falhar, o pedido também falha e o `.enc` acabado de criar é limpo, para evitar manter original e ficheiro cifrado ao mesmo tempo. `removeEncryptedFacePhotoFiles` limpa o `.enc` se a base de dados falhar, evitando ficheiros órfãos. `readEncryptedFacePhotoFile` prepara providers internos autorizados, mas não cria uma rota pública para descarregar fotografia.

6. Validação do passo.

Depois de um upload válido, confirma que o ficheiro guardado termina em `.enc` e que o conteúdo não começa com assinatura PNG, JPEG ou WebP.

7. Cenário negativo/erro esperado.

Com chave inválida ou falha simulada em `unlink(sourcePath)`, `encryptFacePhotoFile` falha, limpa o `.enc` quando existir e `saveFacePhotos` não deve persistir metadados nem deixar ficheiro original como fallback durável.

### Passo 5 - Integrar encriptação no modelo e service de fotografias

1. Objetivo funcional do passo no contexto da app.

Garantir que `FacePhoto` guarda apenas ficheiro cifrado e metadados técnicos privados.

2. Ficheiros envolvidos:
    - EDITAR: `apps/api/src/models/face-photo.model.js`
    - EDITAR: `apps/api/src/services/face-photo.service.js`
    - LOCALIZAÇÃO: ficheiro completo do model e função completa `saveFacePhotos`.

3. Instruções do que fazer.

Adiciona `encryption` ao model com `select: false`, preserva `status: "anonymized"` de `BK-MF5-01` e troca `storageKey: file.path` por `encryptFacePhotoFile`.

4. Código completo, correto e integrado com a app final.

```js
// apps/api/src/models/face-photo.model.js
/**
 * Modelo de metadados de fotografias faciais.
 *
 * O ficheiro durável fica cifrado em storage privado. A API guarda e devolve
 * apenas metadados seguros; `storageKey` e `encryption` têm `select: false`.
 */
import mongoose from "mongoose";
import { DATA_ENCRYPTION_ALGORITHM } from "../services/encryption.service.js";

const { Schema, model } = mongoose;

const encryptionMetadataSchema = new Schema(
    {
        algorithm: {
            type: String,
            enum: [DATA_ENCRYPTION_ALGORITHM],
            required: true,
        },
        iv: {
            type: String,
            required: true,
        },
        authTag: {
            type: String,
            required: true,
        },
    },
    { _id: false },
);

const facePhotoSchema = new Schema(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
        kind: {
            type: String,
            enum: ["frontal", "perfil"],
            required: true,
        },
        storageKey: {
            type: String,
            required: true,
            // O path privado nunca entra em respostas públicas; só services internos
            // o selecionam explicitamente quando precisam de ler ou apagar o ficheiro.
            select: false,
        },
        encryption: {
            type: encryptionMetadataSchema,
            required: true,
            // IV e auth tag são necessários para decifrar, mas seriam dados
            // sensíveis demais para seguir no DTO enviado ao frontend.
            select: false,
        },
        originalName: {
            type: String,
            required: true,
        },
        mimeType: {
            type: String,
            required: true,
        },
        sizeBytes: {
            type: Number,
            required: true,
            min: 1,
        },
        consentId: {
            type: Schema.Types.ObjectId,
            ref: "FaceConsent",
            required: true,
        },
        status: {
            type: String,
            enum: ["active", "deleted", "anonymized"],
            // O estado `anonymized` vem de BK-MF5-01 e prepara a eliminação
            // seletiva sem quebrar histórico, auditoria ou evidência legal.
            default: "active",
        },
    },
    { timestamps: true },
);

facePhotoSchema.index({ userId: 1, kind: 1, createdAt: -1 });

/**
 * Modelo Mongoose de fotografias faciais.
 *
 * @type {import("mongoose").Model}
 */
export const FacePhoto = model("FacePhoto", facePhotoSchema);
```

```js
// apps/api/src/services/face-photo.service.js
import {
    encryptFacePhotoFile,
    removeEncryptedFacePhotoFiles,
} from "./face-secure-storage.service.js";

/**
 * Guarda metadados de fotografias faciais com ownership da sessão.
 *
 * @async
 * @function saveFacePhotos
 * @param {string} userId - Utilizador autenticado.
 * @param {{kind: string, file: Express.Multer.File}[]} uploadedFiles - Ficheiros validados.
 * @param {object|undefined} activeConsent - Consentimento já confirmado na rota.
 * @returns {Promise<object[]>} Fotografias seguras.
 */
export async function saveFacePhotos(userId, uploadedFiles, activeConsent) {
    let encryptedFiles = [];

    try {
        const consent =
            activeConsent ??
            (await FaceConsent.findOne({ userId, revokedAt: null }));

        if (!consent) {
            throw new AppError(403, "Consentimento facial em falta");
        }

        await ensureAllowedImageSignatures(uploadedFiles);

        for (const { kind, file } of uploadedFiles) {
            const encryptedFile = await encryptFacePhotoFile({
                sourcePath: file.path,
            });

            // A lista é atualizada logo após cada sucesso para permitir rollback
            // se o ficheiro seguinte falhar antes da inserção em MongoDB.
            encryptedFiles.push({
                kind,
                file,
                ...encryptedFile,
            });
        }

        const photos = await FacePhoto.insertMany(
            encryptedFiles.map(({ kind, file, storageKey, encryption }) => ({
                userId,
                kind,
                storageKey,
                encryption,
                originalName: file.originalname,
                mimeType: file.mimetype,
                sizeBytes: file.size,
                consentId: consent._id,
            })),
        );

        // A resposta mantém só metadados seguros; storage e dados criptográficos
        // ficam disponíveis apenas em queries internas com seleção explícita.
        return photos.map(toFacePhotoResponse);
    } catch (err) {
        await removeUploadedFiles(uploadedFiles);
        await removeEncryptedFacePhotoFiles(encryptedFiles);
        throw err;
    }
}
```

5. Explicação do código.

O model passa a guardar `encryption` com algoritmo, IV e auth tag, mas esse campo não é selecionado por defeito. O service valida consentimento e assinatura antes de cifrar, cifra cada ficheiro e só depois cria documentos `FacePhoto`. A cifragem é acumulada de forma incremental: se a segunda fotografia falhar, a primeira já está em `encryptedFiles` e pode ser removida no `catch`. Se a base de dados falhar, limpa os ficheiros cifrados para não deixar artefactos sem dono.

6. Validação do passo.

No teste de upload, confirma que `FacePhoto.insertMany` recebe `storageKey` terminado em `.enc` e `encryption.iv`, mas a resposta `201` não contém `storageKey`, `iv` nem `authTag`.

7. Cenário negativo/erro esperado.

Se uma fotografia tiver MIME válido mas assinatura inválida, o service deve devolver `400`, não deve chamar `FacePhoto.insertMany` e não deve criar ficheiro `.enc`. Se a segunda cifragem falhar depois de a primeira ter criado `.enc`, o rollback deve remover a primeira versão cifrada.

### Passo 6 - Integrar encriptação no modelo e service de relatórios

1. Objetivo funcional do passo no contexto da app.

Guardar campos sensíveis de `FaceReport` cifrados sem obrigar histórico, recomendações e exportações autorizadas a mudar o DTO público.

2. Ficheiros envolvidos:
    - EDITAR: `apps/api/src/models/face-report.model.js`
    - EDITAR: `apps/api/src/services/face-report.service.js`
    - LOCALIZAÇÃO: ficheiro completo do model e funções completas de criação/resposta.

3. Instruções do que fazer.

Usa setters/getters Mongoose para cifrar no momento de escrita e decifrar quando o backend lê o documento. Preserva `privacyStatus` de `BK-MF5-01`.

4. Código completo, correto e integrado com a app final.

```js
// apps/api/src/models/face-report.model.js
/**
 * Modelo de relatório facial personalizado.
 *
 * Os campos sensíveis mantêm os mesmos nomes usados pelos services, mas ficam
 * guardados como JSON cifrado em MongoDB. O backend recebe valores decifrados
 * através dos getters do schema.
 */
import mongoose from "mongoose";
import { env } from "../config/env.js";
import {
    decryptJson,
    encryptJson,
    parseEncryptionKey,
} from "../services/encryption.service.js";

const { Schema, model } = mongoose;

/**
 * Verifica se um valor textual já tem o formato cifrado esperado.
 *
 * @function isEncryptedJsonString
 * @param {unknown} value - Valor guardado no campo.
 * @returns {boolean} Verdadeiro quando o valor parece payload cifrado.
 */
function isEncryptedJsonString(value) {
    if (typeof value !== "string") return false;

    try {
        const parsed = JSON.parse(value);
        return Boolean(parsed?.encrypted && parsed?.iv && parsed?.authTag);
    } catch {
        return false;
    }
}

/**
 * Cifra qualquer valor de relatório antes de o guardar.
 *
 * @function encryptReportField
 * @param {unknown} value - Valor original do campo.
 * @returns {string|undefined} Payload cifrado serializado.
 */
function encryptReportField(value) {
    if (value === undefined || value === null) return value;
    // Updates internos podem receber um valor já cifrado; cifrar duas vezes
    // impediria os getters de devolverem o relatório ao backend autorizado.
    if (isEncryptedJsonString(value)) return value;

    const key = parseEncryptionKey(env.dataEncryptionKey);
    return JSON.stringify(encryptJson(value, key));
}

/**
 * Decifra um campo de relatório quando o backend lê o documento.
 *
 * @function decryptReportField
 * @param {unknown} value - Valor persistido em MongoDB.
 * @returns {unknown} Valor original do campo.
 */
function decryptReportField(value) {
    if (value === undefined || value === null) return value;
    // Campos antigos ou fixtures de teste podem ainda estar em claro durante a
    // migração; o getter não deve rebentar esses dados antes da correção manual.
    if (!isEncryptedJsonString(value)) return value;

    const key = parseEncryptionKey(env.dataEncryptionKey);
    return decryptJson(JSON.parse(value), key);
}

const encryptedReportField = {
    type: String,
    required: true,
    // O setter cifra antes da persistência; os services continuam a trabalhar
    // com strings e arrays legíveis sem conhecer IV, auth tag ou ciphertext.
    set: encryptReportField,
    get: decryptReportField,
};

const faceReportSchema = new Schema(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
        analysisId: {
            type: Schema.Types.ObjectId,
            ref: "FaceAnalysis",
            required: true,
            index: true,
        },
        cosmeticSummary: encryptedReportField,
        routineSuggestions: encryptedReportField,
        sources: encryptedReportField,
        limitations: encryptedReportField,
        privacyStatus: {
            type: String,
            enum: ["active", "deleted", "anonymized"],
            default: "active",
            index: true,
        },
    },
    {
        timestamps: true,
        // Os getters só expõem valores decifrados depois de a query autorizada
        // carregar o documento; o MongoDB continua a guardar JSON cifrado.
        toJSON: { getters: true },
        toObject: { getters: true },
    },
);

faceReportSchema.index({ userId: 1, createdAt: -1 });

/**
 * Modelo Mongoose de relatórios faciais.
 *
 * @type {import("mongoose").Model}
 */
export const FaceReport = model("FaceReport", faceReportSchema);
```

```js
// apps/api/src/services/face-report.service.js
/**
 * Converte relatório para resposta segura.
 *
 * @function toFaceReportResponse
 * @param {object} report - Documento Mongoose ou duplo de teste equivalente.
 * @returns {{id: string, analysisId: string, cosmeticSummary: string, routineSuggestions: object[], sources: string[], limitations: string[], privacyStatus: string, createdAt: Date|undefined}} Relatório público.
 */
function toFaceReportResponse(report) {
    return {
        id: report._id.toString(),
        analysisId: report.analysisId.toString(),
        cosmeticSummary: report.cosmeticSummary,
        routineSuggestions: report.routineSuggestions,
        sources: report.sources,
        limitations: report.limitations,
        privacyStatus: report.privacyStatus ?? "active",
        createdAt: report.createdAt,
    };
}

/**
 * Gera relatório da última análise concluída do utilizador.
 *
 * @async
 * @function generateReportFromLatestAnalysis
 * @param {string} userId - Utilizador autenticado.
 * @returns {Promise<object>} Relatório criado.
 */
export async function generateReportFromLatestAnalysis(userId) {
    const analysis = await FaceAnalysis.findOne({
        userId,
        status: "completed",
    }).sort({ createdAt: -1 });

    if (!analysis) {
        throw new AppError(400, "Análise facial concluída obrigatória");
    }

    const report = await FaceReport.create({
        userId,
        analysisId: analysis._id,
        cosmeticSummary: buildCosmeticSummary(analysis),
        routineSuggestions: buildRoutineSuggestions(analysis),
        sources: analysis.sources,
        limitations: analysis.limitations,
        privacyStatus: "active",
    });

    // A criação recebe valores legíveis, mas o model cifra antes de persistir.
    return toFaceReportResponse(report);
}
```

5. Explicação do código.

O model cifra `cosmeticSummary`, `routineSuggestions`, `sources` e `limitations` no momento de escrita. Isto preserva a interface já usada pelos services: `report.limitations` continua a devolver array no backend, mas em MongoDB fica payload cifrado. `privacyStatus` mantém o contrato de `BK-MF5-01`, permitindo distinguir relatório ativo, eliminado ou anonymizado.

6. Validação do passo.

Num teste, cria um relatório com `"Tipo de pele estimado"` e confirma que o valor passado para persistência contém `encrypted`, mas a resposta do service contém o resumo legível e não contém `authTag`.

7. Cenário negativo/erro esperado.

Se `DATA_ENCRYPTION_KEY` estiver ausente, criar relatório deve falhar com erro controlado em vez de guardar relatório em claro.

### Passo 7 - Rever consumidores internos de relatórios

1. Objetivo funcional do passo no contexto da app.

Confirmar que histórico, recomendações e exportações autorizadas continuam a usar relatórios sem receber ciphertext ou metadados criptográficos.

2. Ficheiros envolvidos:
    - REVER: `apps/api/src/services/skin-history.service.js`
    - REVER: `apps/api/src/services/recommendation.service.js`
    - REVER: `apps/api/src/services/admin-export.service.js`
    - LOCALIZAÇÃO: queries que leem `FaceReport`.

3. Instruções do que fazer.

Mantém as queries por `userId`, `analysisId` e `privacyStatus` sempre que a operação só deve usar relatórios ativos. Como os getters do model decifram os campos, estes services não devem tentar ler IV, auth tag ou chave.

4. Código completo, correto e integrado com a app final.

```js
// apps/api/src/services/skin-history.service.js
/**
 * Lista histórico pessoal do utilizador autenticado.
 *
 * @async
 * @function getPersonalSkinHistory
 * @param {string} userId - Utilizador autenticado.
 * @returns {Promise<object[]>} Histórico ordenado por data decrescente.
 */
export async function getPersonalSkinHistory(userId) {
    const [analyses, reports] = await Promise.all([
        FaceAnalysis.find({ userId })
            .select("providerName findings limitations createdAt")
            .sort({ createdAt: -1 })
            .limit(30),
        FaceReport.find({ userId, privacyStatus: "active" })
            .select("analysisId cosmeticSummary routineSuggestions limitations createdAt")
            .sort({ createdAt: -1 })
            .limit(30),
    ]);

    // O filtro por userId vem da sessão e impede histórico cruzado entre clientes.
    return [
        ...analyses.map(toAnalysisHistoryItem),
        ...reports.map(toReportHistoryItem),
    ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}
```

```js
// apps/api/src/services/recommendation.service.js
/**
 * Obtém a última análise concluída e relatório ativo correspondente.
 *
 * @async
 * @function getLatestAnalysisAndReport
 * @param {string} userId - Utilizador autenticado.
 * @returns {Promise<{analysis: object, report: object}>} Contrato de recomendação.
 */
async function getLatestAnalysisAndReport(userId) {
    const analysis = await FaceAnalysis.findOne({ userId, status: "completed" }).sort({
        createdAt: -1,
    });

    if (!analysis) {
        throw new AppError(400, "Análise facial concluída obrigatória");
    }

    const report = await FaceReport.findOne({
        userId,
        analysisId: analysis._id,
        privacyStatus: "active",
    }).sort({ createdAt: -1 });

    if (!report) {
        throw new AppError(400, "Relatório da análise mais recente obrigatório");
    }

    // As recomendações usam o relatório decifrado pelo model, mas nunca recebem
    // IV, auth tag, chave ou ficheiro privado.
    return { analysis, report };
}
```

```js
// apps/api/src/services/admin-export.service.js
/**
 * Lê linhas minimizadas de relatórios para exportação administrativa autorizada.
 *
 * @async
 * @function getReportDatasetRows
 * @returns {Promise<{headers: string[], rows: object[]}>} Dados exportáveis.
 */
async function getReportDatasetRows() {
    // Exportações administrativas só devem considerar relatórios ativos; dados
    // eliminados ou anonymizados não voltam a entrar no dataset.
    const reports = await FaceReport.find({ privacyStatus: "active" })
        .select("userId analysisId cosmeticSummary sources limitations createdAt")
        .sort({ createdAt: -1 })
        .limit(100);

    return {
        headers: [
            "id",
            "userId",
            "analysisId",
            "summary",
            "sources",
            "limitations",
            "createdAt",
        ],
        rows: reports.map((report) => ({
            id: report._id.toString(),
            userId: report.userId.toString(),
            analysisId: report.analysisId.toString(),
            // Os getters do model devolvem valores legíveis, mas esta exportação
            // continua minimizada e nunca inclui IV, auth tag ou storageKey.
            summary: report.cosmeticSummary,
            sources: (report.sources ?? []).join("; "),
            limitations: (report.limitations ?? []).join("; "),
            createdAt: report.createdAt?.toISOString?.() ?? "",
        })),
    };
}
```

5. Explicação do código.

Estes excertos mantêm ownership e minimização. O histórico só lê relatórios do próprio utilizador. A recomendação só usa o relatório da análise correspondente. A exportação administrativa continua limitada e autorizada pela rota/admin, mas evita relatórios eliminados ou anonymizados. Nenhum service tenta expor metadados criptográficos ao frontend.

6. Validação do passo.

Executa `rg -n "FaceReport\\.find|FaceReport\\.findOne" apps/api/src/services` e confirma que consumidores de relatório filtram por `userId`, `analysisId` ou contexto administrativo controlado.

7. Cenário negativo/erro esperado.

Uma recomendação para utilizador sem relatório ativo deve devolver `400` com `"Relatório da análise mais recente obrigatório"` e não deve gerar recomendação.

### Passo 8 - Criar testes e evidence da encriptação em repouso

1. Objetivo funcional do passo no contexto da app.

Provar que a cifragem funciona, que falhas são bloqueadas e que respostas públicas continuam minimizadas.

2. Ficheiros envolvidos:
    - CRIAR: `apps/api/tests/mf6.encryption.test.js`
    - REVER: `apps/api/tests/mf1.face.test.js`
    - LOCALIZAÇÃO: ficheiro completo novo e testes faciais existentes.

3. Instruções do que fazer.

Cria testes unitários de cifra/decifra, negativos de chave inválida e conteúdo adulterado, teste de persistência cifrada no model, integração HTTP de upload, integração HTTP de relatório e rollback quando a segunda fotografia falha.

4. Código completo, correto e integrado com a app final.

```js
// apps/api/tests/mf6.encryption.test.js
import fs from "node:fs/promises";
import path from "node:path";
import { randomBytes } from "node:crypto";
import request from "supertest";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createApp } from "../src/app.js";
import { ROLES } from "../src/constants/roles.js";
import { FaceAnalysis } from "../src/models/face-analysis.model.js";
import { FaceConsent } from "../src/models/face-consent.model.js";
import { FacePhoto } from "../src/models/face-photo.model.js";
import { FaceReport } from "../src/models/face-report.model.js";
import { createSessionToken } from "../src/services/session.service.js";
import * as secureStorage from "../src/services/face-secure-storage.service.js";
import {
    decryptBuffer,
    decryptJson,
    encryptBuffer,
    encryptJson,
    parseEncryptionKey,
} from "../src/services/encryption.service.js";
import { env } from "../src/config/env.js";

const userId = "66a000000000000000000001";
const consentId = "66b000000000000000000001";
const frontalId = "66f000000000000000000001";
const perfilId = "66f000000000000000000002";
const analysisId = "66e000000000000000000001";
const reportId = "66e000000000000000000002";
const uploadDir = path.resolve("storage/private/facial-photos");

/**
 * Cria um identificador mínimo com a interface usada pelos DTOs.
 *
 * @function objectId
 * @param {string} id - Valor textual a devolver por `toString`.
 * @returns {{toString: Function}} Objeto que simula um ObjectId Mongoose.
 */
function objectId(id) {
    return {
        toString() {
            return id;
        },
    };
}

/**
 * Cria um buffer PNG mínimo para testes multipart.
 *
 * @function makePngImageBuffer
 * @returns {Buffer} Imagem PNG 1x1 válida.
 */
function makePngImageBuffer() {
    return Buffer.from(
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/p9sAAAAASUVORK5CYII=",
        "base64",
    );
}

/**
 * Gera token de cliente para rotas faciais autenticadas.
 *
 * @function makeToken
 * @returns {string} JWT de sessão válido para testes.
 */
function makeToken() {
    return createSessionToken({
        id: userId,
        email: "cliente@orelle.test",
        role: ROLES.CLIENTE,
    });
}

/**
 * Cria consentimento facial ativo para o middleware de upload.
 *
 * @function makeConsent
 * @returns {object} Consentimento mock com `_id` e ownership.
 */
function makeConsent() {
    return {
        _id: objectId(consentId),
        userId,
        version: "face-analysis-v1",
        acceptedAt: new Date("2026-06-01T10:00:00.000Z"),
        purpose: "analise_facial_cosmetica",
    };
}

/**
 * Simula uma query Mongoose com `sort()`.
 *
 * @function queryWithSort
 * @param {unknown} result - Resultado final da query.
 * @returns {{sort: Function}} Query mock encadeável.
 */
function queryWithSort(result) {
    return {
        sort: vi.fn().mockResolvedValue(result),
    };
}

/**
 * Cria análise facial concluída para gerar relatório.
 *
 * @function makeAnalysis
 * @returns {object} Análise facial mock com findings cosméticos.
 */
function makeAnalysis() {
    return {
        _id: objectId(analysisId),
        findings: {
            skinType: { label: "mista" },
            acne: { label: "baixo" },
            manchas: { label: "baixo" },
            rugas: { label: "baixo" },
            oleosidade: { label: "moderada" },
        },
        sources: ["fotografia_frontal", "fotografia_perfil"],
        limitations: ["Leitura cosmética, não médica."],
        status: "completed",
    };
}

/**
 * Cria relatório já decifrado para resposta pública da API.
 *
 * @function makeReport
 * @returns {object} Relatório mock com a interface pública esperada.
 */
function makeReport() {
    return {
        _id: objectId(reportId),
        analysisId: objectId(analysisId),
        cosmeticSummary: "Tipo de pele estimado: mista.",
        routineSuggestions: [{ period: "manha", title: "Limpeza suave" }],
        sources: ["fotografia_frontal"],
        limitations: ["Leitura cosmética com limites explícitos."],
        privacyStatus: "active",
        createdAt: new Date("2026-06-01T10:00:00.000Z"),
    };
}

describe("BK-MF6-07 encriptação em repouso", () => {
    beforeEach(async () => {
        env.dataEncryptionKey = randomBytes(32).toString("base64");
        await fs.mkdir(uploadDir, { recursive: true });
    });

    afterEach(async () => {
        vi.restoreAllMocks();
        await fs.rm(uploadDir, { recursive: true, force: true });
    });

    it("cifra e decifra buffers sem guardar o original", () => {
        const key = randomBytes(32);
        const original = Buffer.from("relatorio cosmetico sensivel", "utf8");
        const encrypted = encryptBuffer(original, key);

        // O ciphertext tem de ser diferente para provar que o valor original
        // não ficou guardado em claro.
        expect(encrypted.encrypted.equals(original)).toBe(false);
        expect(
            decryptBuffer({ ...encrypted, key }).toString("utf8"),
        ).toBe("relatorio cosmetico sensivel");
    });

    it("cifra e decifra JSON preservando arrays de relatório", () => {
        const key = randomBytes(32);
        const reportPayload = {
            cosmeticSummary: "Resumo cosmético sensível",
            routineSuggestions: [{ period: "manha", title: "Limpeza suave" }],
            limitations: ["Leitura cosmética com limites explícitos."],
        };

        const encrypted = encryptJson(reportPayload, key);
        const decrypted = decryptJson(encrypted, key);

        expect(encrypted.encrypted).not.toContain("Resumo cosmético");
        expect(decrypted).toEqual(reportPayload);
    });

    it("rejeita chave inválida", () => {
        expect(() => parseEncryptionKey("curta")).toThrow(
            "Chave de encriptação inválida.",
        );
    });

    it("rejeita conteúdo adulterado pela auth tag", () => {
        const key = randomBytes(32);
        const encrypted = encryptBuffer(Buffer.from("fotografia"), key);

        expect(() =>
            decryptBuffer({
                ...encrypted,
                authTag: randomBytes(16).toString("base64"),
                key,
            }),
        ).toThrow("Conteúdo sensível não pode ser decifrado.");
    });

    it("guarda relatório cifrado no model e devolve valor legível ao backend", () => {
        const report = new FaceReport({
            userId,
            analysisId,
            cosmeticSummary: "Tipo de pele estimado: mista.",
            routineSuggestions: [{ period: "manha", title: "Limpeza suave" }],
            sources: ["fotografia_frontal"],
            limitations: ["Leitura cosmética com limites explícitos."],
        });

        const rawSummary = report.get("cosmeticSummary", null, {
            getters: false,
        });
        const persistedSummary = JSON.parse(rawSummary);

        // O valor bruto que seguiria para MongoDB é ciphertext, não texto
        // cosmético legível em dumps ou backups.
        expect(rawSummary).not.toContain("Tipo de pele");
        expect(persistedSummary).toEqual(
            expect.objectContaining({
                encrypted: expect.any(String),
                iv: expect.any(String),
                authTag: expect.any(String),
            }),
        );
        expect(report.cosmeticSummary).toContain("Tipo de pele");
    });

    it("faz upload HTTP e persiste fotografias como .enc sem expor storage", async () => {
        vi.spyOn(FaceConsent, "findOne").mockResolvedValue(makeConsent());
        vi.spyOn(secureStorage, "encryptFacePhotoFile").mockImplementation(
            async ({ sourcePath }) => ({
                storageKey: `${sourcePath}.enc`,
                encryption: {
                    algorithm: "aes-256-gcm",
                    iv: randomBytes(12).toString("base64"),
                    authTag: randomBytes(16).toString("base64"),
                },
            }),
        );
        vi.spyOn(FacePhoto, "insertMany").mockResolvedValue([
            {
                _id: objectId(frontalId),
                kind: "frontal",
                originalName: "frontal.png",
                mimeType: "image/png",
                sizeBytes: 68,
                status: "active",
                createdAt: new Date("2026-06-01T10:00:00.000Z"),
            },
            {
                _id: objectId(perfilId),
                kind: "perfil",
                originalName: "perfil.png",
                mimeType: "image/png",
                sizeBytes: 68,
                status: "active",
                createdAt: new Date("2026-06-01T10:00:00.000Z"),
            },
        ]);

        const response = await request(createApp())
            .post("/api/face-photos")
            .set("Cookie", [`orelle_session=${makeToken()}`])
            .attach("frontal", makePngImageBuffer(), {
                filename: "frontal.png",
                contentType: "image/png",
            })
            .attach("perfil", makePngImageBuffer(), {
                filename: "perfil.png",
                contentType: "image/png",
            });

        const publicBody = JSON.stringify(response.body);

        // A rota completa prova controller + service + model mockado, não apenas
        // um objeto fabricado dentro do teste.
        expect(response.status).toBe(201);
        expect(FacePhoto.insertMany).toHaveBeenCalledWith(
            expect.arrayContaining([
                expect.objectContaining({
                    storageKey: expect.stringMatching(/\.enc$/),
                    encryption: expect.objectContaining({
                        algorithm: "aes-256-gcm",
                        iv: expect.any(String),
                        authTag: expect.any(String),
                    }),
                }),
            ]),
        );
        expect(publicBody).not.toContain("storageKey");
        expect(publicBody).not.toContain("authTag");
        expect(publicBody).not.toContain("DATA_ENCRYPTION_KEY");
    });

    it("remove ficheiro cifrado se a segunda fotografia falhar", async () => {
        const firstEncryptedFile = {
            storageKey: path.join(uploadDir, "frontal.png.enc"),
            encryption: {
                algorithm: "aes-256-gcm",
                iv: randomBytes(12).toString("base64"),
                authTag: randomBytes(16).toString("base64"),
            },
        };

        vi.spyOn(FaceConsent, "findOne").mockResolvedValue(makeConsent());
        vi.spyOn(secureStorage, "encryptFacePhotoFile")
            .mockResolvedValueOnce(firstEncryptedFile)
            .mockRejectedValueOnce(new Error("Falha controlada na segunda cifra."));
        const removeEncryptedSpy = vi
            .spyOn(secureStorage, "removeEncryptedFacePhotoFiles")
            .mockResolvedValue();
        vi.spyOn(FacePhoto, "insertMany").mockResolvedValue([]);

        const response = await request(createApp())
            .post("/api/face-photos")
            .set("Cookie", [`orelle_session=${makeToken()}`])
            .attach("frontal", makePngImageBuffer(), {
                filename: "frontal.png",
                contentType: "image/png",
            })
            .attach("perfil", makePngImageBuffer(), {
                filename: "perfil.png",
                contentType: "image/png",
            });

        // A falha parcial não pode deixar `.enc` órfão nem persistir metadados
        // incompletos em MongoDB.
        expect(response.status).toBe(500);
        expect(FacePhoto.insertMany).not.toHaveBeenCalled();
        expect(removeEncryptedSpy).toHaveBeenCalledWith([
            expect.objectContaining(firstEncryptedFile),
        ]);
    });

    it("gera relatório HTTP sem expor metadados criptográficos", async () => {
        vi.spyOn(FaceAnalysis, "findOne").mockReturnValue(
            queryWithSort(makeAnalysis()),
        );
        vi.spyOn(FaceReport, "create").mockResolvedValue(makeReport());

        const response = await request(createApp())
            .post("/api/face-reports/latest")
            .set("Cookie", [`orelle_session=${makeToken()}`]);

        const publicBody = JSON.stringify(response.body);

        // O endpoint real continua a devolver resumo permitido, mas nunca envia
        // ciphertext, IV, auth tag, chave ou path interno ao frontend.
        expect(response.status).toBe(201);
        expect(response.body.report.cosmeticSummary).toContain("Tipo de pele");
        expect(FaceReport.create).toHaveBeenCalledWith(
            expect.objectContaining({
                privacyStatus: "active",
                cosmeticSummary: expect.stringContaining("Tipo de pele"),
            }),
        );
        expect(publicBody).not.toContain("storageKey");
        expect(publicBody).not.toContain("authTag");
        expect(publicBody).not.toContain("encrypted");
        expect(publicBody).not.toContain("DATA_ENCRYPTION_KEY");
    });
});
```

5. Explicação do código.

Os testes cobrem a camada unitária de criptografia, persistência cifrada no model, integração HTTP de upload, integração HTTP de relatório e três negativos: chave inválida, conteúdo adulterado e falha parcial na segunda fotografia. O teste de upload usa `POST /api/face-photos`, por isso prova controller, middleware de consentimento, service e persistência mockada. O teste de relatório usa `POST /api/face-reports/latest`, por isso já não fabrica uma resposta pública isolada dentro do teste. A resposta pública continua a ser validada por serialização do body real, garantindo que `storageKey`, IV, auth tag, ciphertext e chave não chegam ao frontend.

6. Validação do passo.

Executa `npm --prefix apps/api test -- mf6.encryption.test.js` e depois `npm --prefix apps/api test`.

7. Cenário negativo/erro esperado.

Se alguém adicionar `storageKey`, `authTag`, `encrypted`, IV ou `DATA_ENCRYPTION_KEY` à resposta pública, o teste deve falhar. Se a segunda cifragem falhar depois da primeira, o teste deve confirmar que não houve `FacePhoto.insertMany` e que o primeiro `.enc` entrou no rollback.

#### Expected results

- `DATA_ENCRYPTION_KEY` fica documentada sem segredo real no repositório.
- Fotografias faciais são escritas como `.enc` depois de validação de assinatura.
- `FacePhoto` guarda `storageKey` e `encryption` com `select: false`.
- `FaceReport` guarda campos sensíveis cifrados e mantém leitura interna decifrada.
- Histórico, recomendações e exportações autorizadas continuam coerentes com `privacyStatus`.
- Respostas públicas não devolvem chave, IV, auth tag, ciphertext, `storageKey` ou ficheiro interno.

#### Critérios de aceite

- Cenários negativos concluídos: mínimo `3`.
- Evidência de testes por camada: unit do service de encriptação, integração de upload/relatório e smoke HTTP de resposta pública.
- AES-256-GCM usa IV novo por cifragem.
- Chave real não fica no repositório.
- Ficheiro `.enc` não contém assinatura da imagem original.
- Relatório persistido não contém resumo legível em MongoDB.
- Frontend não recebe detalhes criptográficos nem caminhos internos.
- `privacyStatus` e `status: "anonymized"` de `BK-MF5-01` continuam preservados.

##### Matriz mínima de testes por prioridade

- `P0`: unit + integration + e2e/smoke + 3 negativos.
- `P1`: unit/integration + 2 negativos.
- `P2`: teste focal + 1 negativo.

#### Validação final

```bash
rg -n "DATA_ENCRYPTION_KEY|storageKey|authTag|encrypted" apps/api/src apps/api/tests
npm --prefix apps/api test
bash scripts/validate-planificacao.sh
```

#### Evidence para PR/defesa

- `proof_tecnico`: output de `npm --prefix apps/api test`.
- `proof_negativos`: chave inválida, auth tag adulterada, rollback quando a segunda fotografia falha e resposta pública sem detalhes criptográficos.
- `proof_privacidade`: ficheiro `.enc` ilegível como imagem e relatório persistido sem texto legível.
- `proof_operacional`: `POST /api/face-photos`, `POST /api/face-reports/latest`, histórico e recomendações continuam a funcionar com relatórios ativos.

#### Handoff

`BK-MF7-01` deve acrescentar consentimento explícito antes da análise facial, mantendo `DATA_ENCRYPTION_KEY`, `FacePhoto.encryption` e campos cifrados de `FaceReport`. `BK-MF7-02` deve usar `status`, `privacyStatus` e `storageKey` privado para eliminar ou anonymizar sem expor conteúdo sensível.

#### Changelog

- `2026-06-24`: guia corrigido para fechar lacunas de testes integrados, smoke HTTP, rollback parcial e comentários didáticos internos em blocos longos.
- `2026-06-23`: guia corrigido para integrar encriptação em fotografias, relatórios, configuração, consumidores internos, testes por camada e três negativos de `RNF11`.
