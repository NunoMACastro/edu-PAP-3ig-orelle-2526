# BK-MF1-05 - Permitir upload de fotografias do rosto (frontal e perfil)

## Header
- `doc_id`: `GUIA-BK-MF1-05`
- `bk_id`: `BK-MF1-05`
- `macro`: `MF1`
- `owner`: `Bruna`
- `apoio`: `Izelicks`
- `prioridade`: `P0`
- `estado`: `TODO`
- `esforco`: `M`
- `dependencias`: `BK-MF0-02, BK-MF0-03`
- `rf_rnf`: `RF13`
- `fase_documental`: `Fase 1`
- `sprint`: `S03-S04`
- `core_or_reforco`: `Reforco`
- `proximo_bk`: `BK-MF1-06`
- `guia_path`: `docs/planificacao/guias-bk/MF1/BK-MF1-05-permitir-upload-de-fotografias-do-rosto-frontal-e-perfil.md`
- `last_updated`: `2026-05-31`

## Objetivo
Neste BK vais implementar upload autenticado de duas fotografias faciais: uma frontal e uma de perfil.

## Importância
As fotografias faciais são dados biométricos sensíveis. Antes de guardar ficheiros, a Orélle deve confirmar consentimento, validar tipo/tamanho e associar tudo ao utilizador autenticado.

## Scope-in
- Criar consentimento mínimo para análise facial.
- Criar upload com `Multer`.
- Aceitar exatamente `frontal` e `perfil`.
- Guardar ficheiros fora de pasta pública.
- Guardar metadados em MongoDB sem devolver caminho interno.

## Scope-out
- Não analisar fotografias com IA; isso fica para `BK-MF1-06`.
- Não gerar relatório; isso fica para `BK-MF1-07`.
- Não criar painel de eliminação/anonimização; isso fica para `BK-MF5-01`.

## Pré-requisitos
- `BK-MF0-02`: sessão com cookie HttpOnly e `requireAuth`.
- `BK-MF0-03`: perfil do cliente.
- `RNF12`: consentimento explícito para análise facial.

## Glossário
- Fotografia frontal: imagem tirada de frente para a câmara.
- Fotografia de perfil: imagem lateral do rosto.
- Consentimento: confirmação explícita de que o cliente aceita tratamento das fotografias para análise facial.
- Minimização: guardar apenas o necessário para o fluxo.

## Conceitos teóricos
Upload facial não é análise facial. Este BK só guarda fotografias e metadados; a IA começa no próximo BK.

O backend usa `requireAuth` para saber quem é o utilizador. O frontend nunca envia `userId`. O storage privado guarda ficheiros fora de uma pasta pública, e a API devolve apenas IDs e metadados seguros. `storageKey` fica no backend porque revela onde o ficheiro vive e pode abrir caminho a acesso indevido se escapar para o cliente.

Fotografias faciais são dados sensíveis. Nesta fase, a proteção mínima é consentimento explícito, validação de formato/tamanho, ownership por sessão, pasta privada e resposta minimizada. A encriptação de ficheiros, eliminação/anonimização e auditoria de acessos ficam preparadas para BKs posteriores, mas este BK não deve bloquear esses requisitos futuros.

Também existe uma falha operacional importante: o ficheiro pode chegar ao disco e a gravação em MongoDB falhar. O service deve limpar ficheiros recém-recebidos se a persistência falhar, reduzindo risco de ficheiros órfãos com dados biométricos.

`Multer` é usado porque o Express não processa multipart/form-data sozinho. A alternativa seria escrever um parser manual, mas isso aumenta risco e complexidade sem valor pedagógico.

## Arquitetura do BK
- `POST /api/face-consent`
- `POST /api/face-photos`
- `FaceConsent`
- `FacePhoto`
- `ensureActiveFaceConsent`
- `uploadFacePhotos`
- `FacePhotoUploadPage`

## Ficheiros a criar/editar/rever
- EDITAR: `server/package.json`
- CRIAR: `server/src/models/face-consent.model.js`
- CRIAR: `server/src/models/face-photo.model.js`
- CRIAR: `server/src/validators/face-photo.validator.js`
- CRIAR: `server/src/middlewares/face-photo-upload.middleware.js`
- CRIAR: `server/src/services/face-photo.service.js`
- CRIAR: `server/src/controllers/face-photo.controller.js`
- CRIAR: `server/src/routes/face-photo.routes.js`
- EDITAR: `server/src/app.js`
- EDITAR: `client/src/services/apiClient.js`
- CRIAR: `client/src/pages/FacePhotoUploadPage.jsx`
- EDITAR: `client/src/App.jsx`

## Bloco pedagógico

### Objetivo
Permitir upload seguro de fotografias frontal e perfil com consentimento mínimo antes de qualquer processamento.

### Pré-requisitos
- Ter autenticação por sessão em `BK-MF0-02`.
- Ter perfil de cliente em `BK-MF0-03`.
- Compreender que fotografia facial e dado sensível.

### Erros comuns
- Guardar fotografias em pasta pública.
- Aceitar ficheiros sem validar tipo, tamanho e quantidade.
- Devolver `storageKey` ou path interno na API.

### Check de compreensao
- Porque é que o consentimento vem antes do upload?
- Que campos de ficheiro são obrigatórios?
- Que dados nunca devem voltar para o frontend?

## Bloco operacional

### Entrada
- Sessão autenticada.
- Consentimento ativo.
- FormData com `frontal` e `perfil`.

### Passos
Executar cenários negativos obrigatórios (mínimo 3).

Segue os passos lineares abaixo e valida sem sessão, sem consentimento, ficheiro inválido e falta de uma fotografia.

## Passos lineares

### Passo 1 - Adicionar dependência de upload

1. Explicação simples do objetivo: permitir receber `multipart/form-data`.
2. Ficheiros envolvidos.
    - EDITAR: `server/package.json`
    - LOCALIZAÇÃO: objeto `dependencies`.
3. O que fazer: adiciona `multer`.
4. Código completo, correto e integrado:

```json
{
  "dependencies": {
    "multer": "^2.0.0"
  }
}
```

5. Explicação do código: `multer` fica responsável por receber ficheiros e aplicar limites antes do controller.
6. Como validar este passo: executar `npm install` dentro de `server`.
7. Erros comuns ou cenário negativo: aceitar ficheiros sem middleware permite pedidos sem limite de tamanho.

### Passo 2 - Criar modelo de consentimento

1. Explicação simples do objetivo: guardar prova de consentimento por utilizador.
2. Ficheiros envolvidos.
    - CRIAR: `server/src/models/face-consent.model.js`
    - LOCALIZAÇÃO: ficheiro completo.
3. O que fazer: cria o modelo.
4. Código completo, correto e integrado:

```js
import mongoose from "mongoose";

const { Schema, model } = mongoose;

const faceConsentSchema = new Schema(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
            unique: true,
            index: true,
        },
        acceptedAt: {
            type: Date,
            required: true,
        },
        version: {
            type: String,
            required: true,
            default: "face-analysis-v1",
        },
        purpose: {
            type: String,
            required: true,
            default: "analise_facial_cosmetica",
        },
        revokedAt: {
            type: Date,
            default: null,
        },
    },
    { timestamps: true },
);

export const FaceConsent = model("FaceConsent", faceConsentSchema);
```

5. Explicação do código: o consentimento fica ligado ao utilizador por `userId`. `revokedAt` prepara revogação futura sem apagar o histórico de decisão.
6. Como validar este passo: cria consentimento para o mesmo utilizador duas vezes e confirma que é atualizado, não duplicado.
7. Erros comuns ou cenário negativo: guardar consentimento apenas no frontend não prova nada no backend.

### Passo 3 - Criar modelo de fotografia facial

1. Explicação simples do objetivo: guardar metadados dos ficheiros sem expor caminho interno.
2. Ficheiros envolvidos.
    - CRIAR: `server/src/models/face-photo.model.js`
    - LOCALIZAÇÃO: ficheiro completo.
3. O que fazer: cria o modelo.
4. Código completo, correto e integrado:

```js
import mongoose from "mongoose";

const { Schema, model } = mongoose;

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
            enum: ["active", "deleted"],
            default: "active",
        },
    },
    { timestamps: true },
);

facePhotoSchema.index({ userId: 1, kind: 1, createdAt: -1 });

export const FacePhoto = model("FacePhoto", facePhotoSchema);
```

5. Explicação do código: `storageKey` usa `select: false` para não sair por engano em consultas comuns.
6. Como validar este passo: faz uma consulta normal e confirma que `storageKey` não aparece.
7. Erros comuns ou cenário negativo: devolver caminho físico do ficheiro expõe estrutura interna do servidor.

### Passo 4 - Criar validação e middleware de upload

1. Explicação simples do objetivo: aceitar apenas imagens pequenas e nos campos certos.
2. Ficheiros envolvidos.
    - CRIAR: `server/src/validators/face-photo.validator.js`
    - CRIAR: `server/src/middlewares/face-photo-upload.middleware.js`
    - LOCALIZAÇÃO: ficheiros completos.
3. O que fazer: cria os dois ficheiros.
4. Código completo, correto e integrado:

```js
// server/src/validators/face-photo.validator.js
import { AppError } from "../middlewares/error.middleware.js";

export function validateFaceConsentInput(body) {
    if (body.accepted !== true) {
        throw new AppError(400, "Consentimento facial obrigatorio");
    }

    return {
        version: String(body.version ?? "face-analysis-v1"),
    };
}

export function validateUploadedFaceFiles(files) {
    const frontal = files?.frontal?.[0];
    const perfil = files?.perfil?.[0];

    if (!frontal || !perfil) {
        throw new AppError(400, "Fotografia frontal e de perfil são obrigatórias");
    }

    return [
        { kind: "frontal", file: frontal },
        { kind: "perfil", file: perfil },
    ];
}
```

```js
// server/src/middlewares/face-photo-upload.middleware.js
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import multer from "multer";
import { AppError } from "./error.middleware.js";
import { FaceConsent } from "../models/face-consent.model.js";

const PRIVATE_UPLOAD_DIR = path.resolve("storage/private/facial-photos");
const ALLOWED_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

fs.mkdirSync(PRIVATE_UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
    destination: PRIVATE_UPLOAD_DIR,
    filename(req, file, callback) {
        const extension = path.extname(file.originalname).toLowerCase();
        const safeName = `${crypto.randomUUID()}${extension}`;
        callback(null, safeName);
    },
});

export async function ensureActiveFaceConsent(req, res, next) {
    try {
        const consent = await FaceConsent.findOne({
            userId: req.user.id,
            revokedAt: null,
        });

        if (!consent) {
            return next(new AppError(403, "Consentimento facial em falta"));
        }

        req.faceConsent = consent;
        return next();
    } catch (err) {
        return next(err);
    }
}

function fileFilter(req, file, callback) {
    if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
        return callback(new AppError(400, "Formato de imagem não permitido"));
    }

    return callback(null, true);
}

export const uploadFacePhotos = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024,
        files: 2,
    },
}).fields([
    { name: "frontal", maxCount: 1 },
    { name: "perfil", maxCount: 1 },
]);
```

5. Explicação do código: `ensureActiveFaceConsent` corre depois de `requireAuth` e antes do upload. Assim, se o cliente ainda não tiver consentimento ativo, o pedido termina com `403` antes de `multer.diskStorage` escrever qualquer fotografia no disco. Depois disso, `uploadFacePhotos` limita formato, tamanho e quantidade antes do controller validar se chegaram as duas imagens obrigatórias.
6. Como validar este passo: tenta enviar imagens sem consentimento ativo e confirma `403`; confirma que não apareceu ficheiro novo em `storage/private/facial-photos`. Depois envia um ficheiro `.txt` com consentimento ativo e confirma `400`.
7. Erros comuns ou cenário negativo: guardar em `public/` permitiria acesso direto sem autorização; colocar a validação de consentimento só no service deixaria o ficheiro chegar ao disco antes da decisão de privacidade.

### Passo 5 - Criar service de consentimento e fotografias

1. Explicação simples do objetivo: guardar consentimento e metadados com ownership.
2. Ficheiros envolvidos.
    - CRIAR: `server/src/services/face-photo.service.js`
    - LOCALIZAÇÃO: ficheiro completo.
3. O que fazer: cria o service.
4. Código completo, correto e integrado:

```js
import { unlink } from "node:fs/promises";
import { AppError } from "../middlewares/error.middleware.js";
import { FaceConsent } from "../models/face-consent.model.js";
import { FacePhoto } from "../models/face-photo.model.js";

function toFacePhotoResponse(photo) {
    return {
        id: photo._id.toString(),
        kind: photo.kind,
        originalName: photo.originalName,
        mimeType: photo.mimeType,
        sizeBytes: photo.sizeBytes,
        status: photo.status,
        createdAt: photo.createdAt,
    };
}

export async function removeUploadedFiles(uploadedFiles = []) {
    await Promise.all(
        uploadedFiles.map(({ file }) => {
            if (!file?.path) return undefined;
            return unlink(file.path).catch(() => undefined);
        }),
    );
}

export async function acceptFaceConsent(userId, input) {
    const consent = await FaceConsent.findOneAndUpdate(
        { userId },
        {
            $set: {
                version: input.version,
                purpose: "analise_facial_cosmetica",
                acceptedAt: new Date(),
                revokedAt: null,
            },
        },
        { upsert: true, new: true, runValidators: true },
    );

    return {
        id: consent._id.toString(),
        version: consent.version,
        acceptedAt: consent.acceptedAt,
        purpose: consent.purpose,
    };
}

export async function saveFacePhotos(userId, uploadedFiles, activeConsent) {
    try {
        const consent =
            activeConsent ??
            (await FaceConsent.findOne({ userId, revokedAt: null }));

        if (!consent) {
            throw new AppError(403, "Consentimento facial em falta");
        }

        const photos = await FacePhoto.insertMany(
            uploadedFiles.map(({ kind, file }) => ({
                userId,
                kind,
                storageKey: file.path,
                originalName: file.originalname,
                mimeType: file.mimetype,
                sizeBytes: file.size,
                consentId: consent._id,
            })),
        );

        return photos.map(toFacePhotoResponse);
    } catch (err) {
        await removeUploadedFiles(uploadedFiles);
        throw err;
    }
}
```

5. Explicação do código: o service recebe o consentimento já confirmado pela route, mas volta a ter defesa se for chamado noutro contexto. A resposta não inclui `storageKey`. Se faltar consentimento nessa segunda verificação, se o insert em MongoDB falhar ou se qualquer erro acontecer depois de o upload escrever ficheiros no disco, `removeUploadedFiles` tenta apagar os ficheiros recém-recebidos para não deixar dados sensíveis órfãos.
6. Como validar este passo: simula falha de persistência e confirma que os ficheiros recém-recebidos não ficam na pasta privada; chama o service sem consentimento ativo e confirma `403` com limpeza.
7. Erros comuns ou cenário negativo: ignorar falhas intermédias cria ficheiros faciais sem registo associado e dificulta eliminação/anonymização futura.

### Passo 6 - Criar controller e route

1. Explicação simples do objetivo: expor consentimento e upload em endpoints protegidos.
2. Ficheiros envolvidos.
    - CRIAR: `server/src/controllers/face-photo.controller.js`
    - CRIAR: `server/src/routes/face-photo.routes.js`
    - LOCALIZAÇÃO: ficheiros completos.
3. O que fazer: cria controller e route.
4. Código completo, correto e integrado:

```js
// server/src/controllers/face-photo.controller.js
import {
    acceptFaceConsent,
    removeUploadedFiles,
    saveFacePhotos,
} from "../services/face-photo.service.js";
import {
    validateFaceConsentInput,
    validateUploadedFaceFiles,
} from "../validators/face-photo.validator.js";

export async function acceptFaceConsentController(req, res, next) {
    try {
        const input = validateFaceConsentInput(req.body);
        const consent = await acceptFaceConsent(req.user.id, input);

        return res.status(200).json({ consent });
    } catch (err) {
        return next(err);
    }
}

function collectUploadedFilesForCleanup(files) {
    return Object.values(files ?? {})
        .flat()
        .map((file) => ({ file }));
}

export async function uploadFacePhotosController(req, res, next) {
    try {
        const uploadedFiles = validateUploadedFaceFiles(req.files);
        const photos = await saveFacePhotos(
            req.user.id,
            uploadedFiles,
            req.faceConsent,
        );

        return res.status(201).json({ photos });
    } catch (err) {
        await removeUploadedFiles(collectUploadedFilesForCleanup(req.files));
        return next(err);
    }
}
```

```js
// server/src/routes/face-photo.routes.js
import { Router } from "express";
import { requireAuth } from "../middlewares/auth.middleware.js";
import {
    ensureActiveFaceConsent,
    uploadFacePhotos,
} from "../middlewares/face-photo-upload.middleware.js";
import {
    acceptFaceConsentController,
    uploadFacePhotosController,
} from "../controllers/face-photo.controller.js";

export const facePhotoRoutes = Router();

facePhotoRoutes.post(
    "/face-consent",
    requireAuth,
    acceptFaceConsentController,
);

facePhotoRoutes.post(
    "/face-photos",
    requireAuth,
    ensureActiveFaceConsent,
    uploadFacePhotos,
    uploadFacePhotosController,
);
```

5. Explicação do código: os dois endpoints exigem sessão. O `userId` vem da sessão e não do frontend. Na rota de fotografias, a ordem é importante: primeiro autenticação, depois consentimento ativo, só depois upload. O controller ainda limpa ficheiros se a validação das duas fotografias falhar depois de o multipart já ter sido recebido.
6. Como validar este passo: sem cookie, ambos devem responder `401`; com cookie mas sem consentimento, `/api/face-photos` deve responder `403` sem criar ficheiro; com apenas uma fotografia, deve responder `400` e apagar a fotografia recebida.
7. Erros comuns ou cenário negativo: permitir upload anónimo torna impossível provar ownership; colocar `uploadFacePhotos` antes de `ensureActiveFaceConsent` volta a permitir ficheiros biométricos sem consentimento.

### Passo 7 - Registar route e adaptar apiClient para FormData

1. Explicação simples do objetivo: ligar a API e permitir envio de ficheiros pelo frontend.
2. Ficheiros envolvidos.
    - EDITAR: `server/src/app.js`
    - EDITAR: `client/src/services/apiClient.js`
    - LOCALIZAÇÃO: imports, routes e função `apiRequest`.
3. O que fazer: adiciona a route e atualiza o cliente API.
4. Código completo, correto e integrado:

```js
// server/src/app.js
import { facePhotoRoutes } from "./routes/face-photo.routes.js";

app.use("/api", facePhotoRoutes);
```

```js
// client/src/services/apiClient.js
const API_BASE_URL =
    import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3001/api";

export async function apiRequest(path, options = {}) {
    const isFormData = options.body instanceof FormData;
    const response = await fetch(`${API_BASE_URL}${path}`, {
        credentials: "include",
        headers: isFormData
            ? options.headers
            : {
                  "Content-Type": "application/json",
                  ...(options.headers ?? {}),
              },
        ...options,
    });

    if (response.status === 204) return null;

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
        throw new Error(data?.error?.message ?? "Pedido falhou");
    }

    return data;
}
```

5. Explicação do código: em `FormData`, o browser define o boundary do multipart. Definir manualmente `Content-Type` quebraria o upload.
6. Como validar este passo: envia um `FormData` e confirma que o backend recebe `req.files`.
7. Erros comuns ou cenário negativo: esquecer `credentials: "include"` faz o upload falhar por falta de sessão.

### Passo 8 - Criar página de upload facial

1. Explicação simples do objetivo: permitir aceitar consentimento e enviar as duas fotografias.
2. Ficheiros envolvidos.
    - CRIAR: `client/src/pages/FacePhotoUploadPage.jsx`
    - EDITAR: `client/src/App.jsx`
    - LOCALIZAÇÃO: ficheiro completo e imports do `App`.
3. O que fazer: cria a página e regista no `App`.
4. Código completo, correto e integrado:

```jsx
// client/src/pages/FacePhotoUploadPage.jsx
import { useState } from "react";
import { apiRequest } from "../services/apiClient.js";

export function FacePhotoUploadPage() {
    const [accepted, setAccepted] = useState(false);
    const [frontal, setFrontal] = useState(null);
    const [perfil, setPerfil] = useState(null);
    const [status, setStatus] = useState("idle");
    const [message, setMessage] = useState("");

    async function handleSubmit(event) {
        event.preventDefault();
        setStatus("loading");
        setMessage("");

        try {
            await apiRequest("/face-consent", {
                method: "POST",
                body: JSON.stringify({ accepted, version: "face-analysis-v1" }),
            });

            const formData = new FormData();
            formData.append("frontal", frontal);
            formData.append("perfil", perfil);

            const data = await apiRequest("/face-photos", {
                method: "POST",
                body: formData,
            });

            setStatus("success");
            setMessage(`${data.photos.length} fotografias guardadas.`);
        } catch (err) {
            setStatus("error");
            setMessage(err.message);
        }
    }

    return (
        <section>
            <h1>Fotografias para análise facial</h1>
            <form onSubmit={handleSubmit}>
                <label>
                    <input
                        type="checkbox"
                        checked={accepted}
                        onChange={(event) => setAccepted(event.target.checked)}
                    />
                    Aceito o tratamento destas fotografias para análise facial cosmética.
                </label>
                <label>
                    Fotografia frontal
                    <input
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                        onChange={(event) => setFrontal(event.target.files[0])}
                    />
                </label>
                <label>
                    Fotografia de perfil
                    <input
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                        onChange={(event) => setPerfil(event.target.files[0])}
                    />
                </label>
                <button
                    type="submit"
                    disabled={!accepted || !frontal || !perfil || status === "loading"}
                >
                    {status === "loading" ? "A enviar..." : "Enviar fotografias"}
                </button>
            </form>
            {message && <p role={status === "error" ? "alert" : undefined}>{message}</p>}
        </section>
    );
}
```

```jsx
// client/src/App.jsx
import { FacePhotoUploadPage } from "./pages/FacePhotoUploadPage.jsx";

export function App() {
    return (
        <>
            <ProductSearchPage />
            <ProductDetailsPage />
            <ProductReviewPage />
            <RelatedProductsPage />
            <FacePhotoUploadPage />
        </>
    );
}
```

5. Explicação do código: a UI bloqueia envio sem consentimento e sem as duas imagens, mas a segurança real continua no backend.
6. Como validar este passo: tenta enviar sem marcar consentimento, sem login e com ficheiro não imagem.
7. Erros comuns ou cenário negativo: confiar só na checkbox visual permitiria chamada direta à API sem consentimento guardado.

### Validação
- [ ] Negativos: mínimo `3` cenários.
- [ ] Sem sessão devolve `401`.
- [ ] Sem consentimento devolve `403`.
- [ ] Ficheiro inválido devolve `400`.
- [ ] Upload incompleto devolve `400` e não deixa ficheiro órfão.
- [ ] Resposta não inclui `storageKey` nem path interno.

### Matriz mínima de testes por prioridade

| Camada | Evidência |
| --- | --- |
| Middleware | Consentimento ativo antes do upload; tipo e tamanho de ficheiro validados. |
| Service | Consentimento, ownership e limpeza em erro verificados. |
| Controller/route | Endpoints devolvem contrato público e limpam upload incompleto. |
| UI | Formulário envia `FormData` com duas fotografias. |

Evidência de testes por camada:
- API: output de upload válido e rejeicoes.
- Service: teste de consentimento ausente.
- UI: screenshot do formulário com sucesso.

## Expected results
- `POST /api/face-consent` autenticado responde `200`.
- `POST /api/face-photos` com duas imagens válidas responde `201`.
- Sem sessão responde `401`.
- Sem consentimento responde `403`.
- Ficheiro inválido responde `400`.
- Upload incompleto responde `400` sem deixar ficheiro órfão.

## Critérios de aceite
- Cenários negativos concluídos: mínimo `3`.
- Evidência de testes por camada documentada.
- O backend exige sessão.
- O backend exige consentimento ativo.
- O backend exige `frontal` e `perfil`.
- A rota confirma consentimento antes de `multer.diskStorage`.
- Erros depois do upload limpam ficheiros recém-recebidos.
- A resposta não devolve `storageKey`.
- O frontend não guarda tokens no `localStorage`.

## Validação final
- Enviar consentimento.
- Fazer upload com `frontal` e `perfil`.
- Repetir upload sem consentimento num utilizador novo e confirmar `403`.
- Enviar só `frontal` com consentimento ativo e confirmar `400` e ausência de ficheiro órfão.

## Evidence para PR/defesa
- Output de consentimento com `200`.
- Output de upload com `201`.
- Screenshot da página com mensagem de sucesso.
- Output de tentativa sem sessão com `401`.
- Output de tentativa sem consentimento com `403` e evidência de que não foi criado ficheiro.

## Handoff

### Handoff

`BK-MF1-06` deve usar `FacePhoto` e `FaceConsent`. A análise não deve procurar ficheiros por caminho público nem aceitar `userId` vindo do frontend.

## Changelog
- `2026-05-31`: guia revisto com consentimento mínimo antes do upload, limpeza de ficheiros em erro, storage privado, ownership e frontend com `FormData`.
