# BK-MF7-01 - Consentimento explícito para análise facial (RGPD)

## Header
- `doc_id`: `GUIA-BK-MF7-01`
- `bk_id`: `BK-MF7-01`
- `macro`: `MF7`
- `owner`: `Bruna`
- `apoio`: `Izelicks`
- `prioridade`: `P0`
- `estado`: `TODO`
- `esforco`: `M`
- `dependencias`: `-`
- `rf_rnf`: `RNF12`
- `fase_documental`: `Fase 3`
- `sprint`: `S11-S12`
- `core_or_reforco`: `Reforco`
- `classe_core_dual`: `CORE-HIBRIDO`
- `eixo_primario`: `ConfiancaConversao`
- `kpi_primario`: `add_to_cart_recomendado`
- `kpi_secundario`: `retencao_fluxo_ia_30d`
- `proximo_bk`: `BK-MF7-02`
- `guia_path`: `docs/planificacao/guias-bk/MF7/BK-MF7-01-consentimento-explicito-para-analise-facial-rgpd.md`
- `last_updated`: `2026-06-26`

#### Objetivo

Neste BK vais reforçar o consentimento explícito antes de qualquer análise facial. O fluxo deve guardar uma prova mínima de aceitação, associada ao utilizador autenticado, e bloquear upload, análise, simulação ou leitura de fotografias faciais se não existir consentimento ativo.

`CANONICO`: `RNF12` exige consentimento explícito para análise facial. `RF13`, `RF14`, `RF15`, `RF23`, `RF24`, `RNF11` e `RNF25` dependem deste contrato para tratar fotografias e relatórios como dados sensíveis.

#### Importância

Fotografias do rosto e relatórios de análise cosmética são dados sensíveis. O consentimento não pode ser apenas uma checkbox visual: tem de ser validado no backend, guardado com versão e finalidade, e usado como condição antes de processar imagens. Isto protege o utilizador, evita uso indevido de dados biométricos e cria uma evidência técnica defensável na PAP.

#### Scope-in

- Criar ou rever o modelo `FaceConsent`.
- Validar que o body enviado pela UI tem aceitação explícita.
- Criar o endpoint `POST /api/face-consent`.
- Garantir que upload e análise facial dependem de consentimento ativo.
- Atualizar a página de upload facial para enviar consentimento antes das fotografias.
- Criar validações negativas para ausência de consentimento, body inválido e tentativa de upload sem consentimento.

#### Scope-out

- Não criar fluxo de eliminação de conta; isso fica no `BK-MF7-02`.
- Não alterar encriptação em repouso de fotografias e relatórios; isso vem do `BK-MF6-07`.
- Não enviar fotografias para providers externos.
- Não criar consentimento para campanhas, marketing ou aprendizagem de terceiros.

#### Estado antes e depois

- Antes: os fluxos de fotografia e análise já existem, mas o aluno precisa de confirmar que o consentimento é explícito, persistido, versionado e aplicado em todos os pontos sensíveis.
- Depois: a app só aceita fotografias e só executa análise facial se existir consentimento ativo para `analise_facial_cosmetica`.

#### Pre-requisitos

- `BK-MF0-02`: sessão autenticada por cookie HttpOnly.
- `BK-MF1-05`: upload de fotografia frontal e de perfil.
- `BK-MF1-06`: análise facial com provider isolado e limites cosméticos.
- `BK-MF6-07`: fotografias e relatórios protegidos em repouso.
- Documentos: `docs/RNF.md`, `docs/RF.md`, `docs/planificacao/backlogs/MATRIZ-CANONICA-BK.md`.

#### Glossário

- Consentimento explícito: ação afirmativa do utilizador antes de tratar fotografias faciais.
- Finalidade: motivo concreto do tratamento, neste BK `analise_facial_cosmetica`.
- Versão de consentimento: identificador textual que permite provar que texto/contrato estava ativo quando o utilizador aceitou.
- Revogação: marca temporal que invalida consentimento antigo sem apagar a evidência histórica mínima.
- Ownership: regra em que o backend usa `req.user.id`, nunca um `userId` enviado pelo frontend.

#### Conceitos teóricos essenciais

O consentimento nasce na UI, mas só se torna válido quando o backend autenticado o valida e grava. A checkbox evita erro de utilização; o backend evita abuso.

O modelo guarda apenas metadados: `userId`, `acceptedAt`, `version`, `purpose` e `revokedAt`. Não guarda fotografias nem relatórios. Assim, a app consegue provar que havia consentimento sem duplicar dados sensíveis.

O upload facial e a análise usam sessão autenticada, fotografias frontal/perfil e consentimento ativo. O frontend não decide ownership, porque qualquer pessoa poderia manipular um body JSON. O dono é sempre o utilizador do cookie validado por `requireAuth`.

#### Arquitetura do BK

- Model: `FaceConsent`.
- Validator: `validateFaceConsentInput`.
- Service: `acceptFaceConsent`.
- Controller: `acceptFaceConsentController`.
- Routes: `POST /api/face-consent` e `POST /api/face-photos`.
- Frontend: `FacePhotoUploadPage`.
- Testes: contrato de aceitar consentimento e negar upload/análise sem consentimento.
- Handoff: `BK-MF7-02` reutiliza esta separação para tratar eliminação/anonimização sem perder rastreabilidade.

#### Ficheiros a criar/editar/rever

- EDITAR: `apps/api/src/models/face-consent.model.js`
- EDITAR: `apps/api/src/validators/face-photo.validator.js`
- EDITAR: `apps/api/src/services/face-photo.service.js`
- EDITAR: `apps/api/src/controllers/face-photo.controller.js`
- EDITAR: `apps/api/src/routes/face-photo.routes.js`
- EDITAR: `apps/web/src/pages/FacePhotoUploadPage.jsx`
- REVER: `apps/api/src/middlewares/face-photo-upload.middleware.js`
- REVER: `apps/api/src/services/face-analysis.service.js`

#### Tutorial técnico linear

### Passo 1 - Confirmar contrato de consentimento

1. Objetivo funcional do passo no contexto da app.

Confirmar que este BK trata `RNF12` e não substitui upload, encriptação ou eliminação.

2. Ficheiros envolvidos:
    - REVER: `docs/RNF.md`
    - REVER: `docs/RF.md`
    - REVER: `docs/planificacao/backlogs/MATRIZ-CANONICA-BK.md`
    - LOCALIZAÇÃO: linhas de `RNF12`, `RF13`, `RF14`, `RF15`, `BK-MF7-01`.

3. Instruções do que fazer.

Confirma que `RNF12` exige consentimento explícito e que `RF13`/`RF14` só fazem sentido depois dessa autorização. Regista no teu PR que o backend continua a decidir ownership.

4. Código completo, correto e integrado com a app final.

Sem código neste passo. É uma revisão de contrato para evitar que a implementação confunda consentimento com upload.

5. Explicação do código.

Sem código, porque ainda estás a confirmar fronteiras. A decisão técnica importante é que consentimento fica separado da fotografia: primeiro aceitas a finalidade, depois envias as imagens.

6. Validação do passo.

Executa `rg -n "RNF12|RF13|RF14|RF15|BK-MF7-01" docs/RNF.md docs/RF.md docs/planificacao/backlogs/MATRIZ-CANONICA-BK.md` e confirma que os requisitos existem.

7. Cenário negativo/erro esperado.

Se tratares a checkbox como única validação, o fluxo fica inseguro. A API deve recusar pedidos sem consentimento mesmo que o frontend esteja alterado.

### Passo 2 - Criar o modelo de consentimento facial

1. Objetivo funcional do passo no contexto da app.

Guardar metadados mínimos de consentimento por utilizador autenticado.

2. Ficheiros envolvidos:
    - EDITAR: `apps/api/src/models/face-consent.model.js`
    - LOCALIZAÇÃO: ficheiro completo.

3. Instruções do que fazer.

Cria ou substitui o ficheiro pelo modelo abaixo.

4. Código completo, correto e integrado com a app final.

```js
// apps/api/src/models/face-consent.model.js
/**
 * Modelo de consentimento facial da Orélle.
 *
 * Guarda apenas a prova mínima de aceitação para análise facial cosmética.
 * Fotografias e relatórios continuam nos seus próprios modelos protegidos.
 */
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

/**
 * Modelo Mongoose de consentimentos faciais.
 *
 * @type {import("mongoose").Model}
 */
export const FaceConsent = model("FaceConsent", faceConsentSchema);
```

5. Explicação do código.

O campo `userId` liga consentimento ao utilizador autenticado. `acceptedAt` prova quando o consentimento foi aceite. `version` permite evoluir o texto da autorização sem perder rastreabilidade. `purpose` limita a finalidade a análise facial cosmética. `revokedAt` prepara revogação sem apagar a prova mínima. O índice único evita vários consentimentos ativos contraditórios para o mesmo utilizador.

6. Validação do passo.

Confirma que o ficheiro exporta `FaceConsent` e que não contém campos para imagem, path interno, token ou relatório completo.

7. Cenário negativo/erro esperado.

Se removeres `unique: true`, o utilizador pode ficar com versões duplicadas e o backend pode escolher uma prova errada.

### Passo 3 - Validar aceitação explícita no backend

1. Objetivo funcional do passo no contexto da app.

Recusar qualquer consentimento que não venha como ação afirmativa.

2. Ficheiros envolvidos:
    - EDITAR: `apps/api/src/validators/face-photo.validator.js`
    - LOCALIZAÇÃO: função `validateFaceConsentInput`.

3. Instruções do que fazer.

Mantém a função abaixo no ficheiro de validadores de fotografia facial.

4. Código completo, correto e integrado com a app final.

```js
/**
 * Valida consentimento facial explícito.
 *
 * @function validateFaceConsentInput
 * @param {Record<string, unknown>} body - Corpo JSON do pedido.
 * @returns {{version: string}} Consentimento normalizado.
 * @throws {AppError} Quando o consentimento não foi aceite.
 */
export function validateFaceConsentInput(body) {
    if (body.accepted !== true) {
        // A API exige ação afirmativa; texto visível no frontend não chega para cumprir RNF12.
        throw new AppError(400, "Consentimento facial obrigatório");
    }

    return {
        version: String(body.version ?? "face-analysis-v1"),
    };
}
```

5. Explicação do código.

A validação aceita apenas `accepted: true`. Strings como `"true"`, valores omitidos ou objetos manipulados são rejeitados. A função devolve só a versão, porque o dono do consentimento vem de `req.user.id` no controller. Isto evita que o frontend escolha outro utilizador.

6. Validação do passo.

Testa com body `{ "accepted": true }` e com `{ "accepted": false }`. O primeiro deve avançar; o segundo deve devolver erro `400`.

7. Cenário negativo/erro esperado.

Um pedido sem `accepted` deve falhar com mensagem controlada e sem stack trace.

### Passo 4 - Guardar ou renovar consentimento no service

1. Objetivo funcional do passo no contexto da app.

Persistir consentimento ativo e devolver só metadados seguros.

2. Ficheiros envolvidos:
    - EDITAR: `apps/api/src/services/face-photo.service.js`
    - LOCALIZAÇÃO: função `acceptFaceConsent`.

3. Instruções do que fazer.

Garante que o service usa `findOneAndUpdate` com `upsert` para renovar o consentimento do mesmo utilizador.

4. Código completo, correto e integrado com a app final.

```js
/**
 * Aceita ou renova consentimento facial do utilizador.
 *
 * @async
 * @function acceptFaceConsent
 * @param {string} userId - Utilizador autenticado.
 * @param {{version: string}} input - Consentimento validado.
 * @returns {Promise<object>} Consentimento seguro.
 */
export async function acceptFaceConsent(userId, input) {
    // O filtro por userId vem da sessao e impede consentimento criado para outra conta.
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
```

5. Explicação do código.

O service procura por `userId`, que veio da sessão, e não pelo body. Se o utilizador aceitar novamente, atualiza `acceptedAt`, `version` e limpa `revokedAt`. A resposta não devolve dados internos, cookies, fotografia ou campos de auditoria desnecessários.

6. Validação do passo.

Confirma que dois pedidos seguidos do mesmo utilizador mantêm um único documento `FaceConsent` atualizado.

7. Cenário negativo/erro esperado.

Se o service aceitar `userId` vindo do frontend, um utilizador poderia tentar criar consentimento para outra conta.

### Passo 5 - Expor endpoint autenticado de consentimento

1. Objetivo funcional do passo no contexto da app.

Ligar HTTP, validação e service num endpoint protegido.

2. Ficheiros envolvidos:
    - EDITAR: `apps/api/src/controllers/face-photo.controller.js`
    - EDITAR: `apps/api/src/routes/face-photo.routes.js`
    - LOCALIZAÇÃO: controller `acceptFaceConsentController` e rota `/face-consent`.

3. Instruções do que fazer.

Mantém o controller e a rota abaixo. A rota tem de executar `requireAuth` antes do controller.

4. Código completo, correto e integrado com a app final.

```js
/**
 * Aceita consentimento facial do utilizador autenticado.
 *
 * @async
 * @function acceptFaceConsentController
 * @param {import("express").Request & {user: {id: string}}} req - Pedido autenticado.
 * @param {import("express").Response} res - Resposta Express.
 * @param {import("express").NextFunction} next - Próximo middleware.
 * @returns {Promise<import("express").Response|void>} Resposta com consentimento.
 */
export async function acceptFaceConsentController(req, res, next) {
    try {
        // A identidade usada pelo service vem de requireAuth, nao do body enviado pela UI.
        const input = validateFaceConsentInput(req.body);
        const consent = await acceptFaceConsent(req.user.id, input);

        return res.status(200).json({ consent });
    } catch (err) {
        return next(err);
    }
}

facePhotoRoutes.post(
    "/face-consent",
    requireAuth,
    acceptFaceConsentController,
);
```

5. Explicação do código.

O controller valida o body e chama o service com `req.user.id`. A rota protegida garante que não existe consentimento anónimo. O status `200` é adequado porque aceitar novamente consentimento renova o documento existente.

6. Validação do passo.

Com sessão válida, `POST /api/face-consent` deve devolver `{ consent }`. Sem sessão, deve devolver `401`.

7. Cenário negativo/erro esperado.

Um pedido não autenticado não pode criar consentimento.

### Passo 6 - Enviar consentimento antes das fotografias no frontend

1. Objetivo funcional do passo no contexto da app.

Garantir que a UI obriga o utilizador a aceitar a finalidade antes de enviar fotografias.

2. Ficheiros envolvidos:
    - EDITAR: `apps/web/src/pages/FacePhotoUploadPage.jsx`
    - LOCALIZAÇÃO: função `handleSubmit`.

3. Instruções do que fazer.

No submit, valida checkbox e ficheiros, chama `/face-consent` e só depois envia `FormData` para `/face-photos`.

4. Código completo, correto e integrado com a app final.

```jsx
/**
 * Aceita consentimento e envia fotografias para a API.
 *
 * @async
 * @function handleSubmit
 * @param {import("react").FormEvent<HTMLFormElement>} event - Evento do formulário.
 * @returns {Promise<void>}
 */
async function handleSubmit(event) {
    event.preventDefault();
    if (!accepted || !frontal || !perfil) {
        setStatus("error");
        setMessage("Aceita o consentimento e escolhe as duas fotografias.");
        return;
    }

    setStatus("loading");
    setMessage("");

    try {
        await apiRequest("/face-consent", {
            method: "POST",
            body: JSON.stringify({
                accepted,
                version: "face-analysis-v1",
            }),
        });

        const formData = new FormData();
        formData.append("frontal", frontal);
        formData.append("perfil", perfil);

        // FormData segue sem Content-Type manual para o browser definir boundary seguro.
        const data = await apiRequest("/face-photos", {
            method: "POST",
            body: formData,
        });

        setStatus("success");
        setMessage(`${data.photos.length} fotografias guardadas com segurança.`);
    } catch (err) {
        // A mensagem visível é controlada e não revela paths, cookies ou detalhes internos.
        setStatus("error");
        setMessage(err.message);
    }
}
```

5. Explicação do código.

O frontend melhora a experiência, mas não substitui o backend. Primeiro chama `/face-consent` com JSON; depois envia as fotografias por `FormData`. `apiRequest` envia cookies com `credentials: "include"`, por isso a API sabe quem é o utilizador. A mensagem de erro fica segura e não expõe detalhes internos.

6. Validação do passo.

Na UI, tenta submeter sem checkbox. Deve aparecer erro local. Com checkbox e duas fotografias válidas, devem ocorrer dois pedidos: consentimento e upload.

7. Cenário negativo/erro esperado.

Se manipulares a UI e tentares enviar `/face-photos` diretamente, o middleware deve responder `403` se não houver consentimento ativo.

### Passo 7 - Criar prova negativa de consentimento

1. Objetivo funcional do passo no contexto da app.

Provar que o backend bloqueia fluxos sensíveis sem consentimento.

2. Ficheiros envolvidos:
    - CRIAR: `apps/api/tests/mf7.consent.test.js`
    - LOCALIZAÇÃO: ficheiro completo.

3. Instruções do que fazer.

Cria testes focados no validator e no service. Mantém as fotografias fora dos asserts.

4. Código completo, correto e integrado com a app final.

```js
// apps/api/tests/mf7.consent.test.js
import { describe, expect, it } from "vitest";
import { validateFaceConsentInput } from "../src/validators/face-photo.validator.js";

describe("BK-MF7-01 consentimento facial", () => {
    it("aceita apenas consentimento afirmativo", () => {
        expect(validateFaceConsentInput({ accepted: true })).toEqual({
            version: "face-analysis-v1",
        });
    });

    it("recusa ausência de consentimento explícito", () => {
        // Este negativo prova que a API não depende apenas da checkbox visual.
        expect(() => validateFaceConsentInput({ accepted: false })).toThrow(
            "Consentimento facial obrigatório",
        );
    });
});
```

5. Explicação do código.

O teste valida a regra essencial sem precisar de fotografia real. O primeiro caso confirma o caminho positivo. O segundo confirma que ausência de aceitação falha no backend, que é a camada de segurança correta.

6. Validação do passo.

Executa `npm --prefix apps/api test -- mf7.consent.test.js` se o runner aceitar filtro de ficheiro. Se não aceitar, executa `npm --prefix apps/api test`.

7. Cenário negativo/erro esperado.

Se o validator aceitar `{ accepted: "true" }`, o teste deve ser expandido para falhar esse caso.

#### Expected results

- `POST /api/face-consent` com sessão e `accepted: true` devolve `200`.
- `POST /api/face-consent` sem sessão devolve `401`.
- `POST /api/face-consent` com `accepted: false` devolve `400`.
- `POST /api/face-photos` sem consentimento ativo devolve `403`.
- A resposta pública nunca devolve fotografia, path interno, cookie, token ou relatório completo.

#### Critérios de aceite

- `FaceConsent` guarda só metadados mínimos.
- O endpoint de consentimento usa `requireAuth`.
- O backend decide ownership por sessão autenticada.
- A UI envia consentimento antes das fotografias.
- Existem pelo menos três negativos: sem sessão, sem consentimento e upload direto.
- `BK-MF7-02` consegue reutilizar esta base para eliminação/anonimização.

#### Validação final

- `rg -n "face-consent|FaceConsent|Consentimento facial obrigatório" apps/api/src apps/web/src`
- `npm --prefix apps/api test`
- `npm --prefix apps/web run build`
- Confirmar manualmente que não há resposta com fotografia, path interno, cookie ou token.

#### Evidence para PR/defesa

- Screenshot ou log do pedido `POST /api/face-consent` com `200`.
- Log do negativo `accepted: false` com `400`.
- Log do upload direto sem consentimento com `403`.
- Nota técnica: consentimento é guardado separado de fotografias e relatórios.

#### Handoff

O `BK-MF7-02` deve tratar eliminação/anonimização mantendo `FaceConsent`, `FacePhoto`, `FaceReport` e os estados `deleted`/`anonymized` coerentes. O consentimento ativo deste BK não elimina o direito posterior de revogação ou apagamento.

#### Changelog

- 2026-06-26: Guia reescrito para tutorial técnico linear, com contrato RNF12, endpoint real, validação backend/frontend e negativos de consentimento.
