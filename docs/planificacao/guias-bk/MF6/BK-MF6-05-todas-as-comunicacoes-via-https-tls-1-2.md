# BK-MF6-05 - Todas as comunicações via HTTPS (TLS 1.2+)

## Header
- `doc_id`: `GUIA-BK-MF6-05`
- `bk_id`: `BK-MF6-05`
- `macro`: `MF6`
- `owner`: `Bruna`
- `apoio`: `Izelicks`
- `prioridade`: `P0`
- `estado`: `TODO`
- `esforco`: `M`
- `dependencias`: `-`
- `rf_rnf`: `RNF09`
- `fase_documental`: `Fase 3`
- `sprint`: `S10-S11`
- `core_or_reforco`: `Reforco`
- `classe_core_dual`: `SUPORTE`
- `eixo_primario`: `FundacaoQualidade`
- `kpi_primario`: `taxa_incidentes_criticos`
- `kpi_secundario`: `taxa_conformidade_gates`
- `proximo_bk`: `BK-MF6-06`
- `guia_path`: `docs/planificacao/guias-bk/MF6/BK-MF6-05-todas-as-comunicacoes-via-https-tls-1-2.md`
- `last_updated`: `2026-06-24`

#### Objetivo

Neste BK vais preparar a API e o frontend da Orélle para exigir comunicação HTTPS em ambientes publicados, cumprindo `RNF09`.

O resultado observável é uma app que aceita HTTP em desenvolvimento local, mas exige `https` quando `NODE_ENV=production`, devolve erro controlado para pedidos inseguros e usa cookies seguros em produção.

#### Importância

A Orélle processa sessão, perfil, fotografias, relatórios e checkout. Sem HTTPS, esses dados podem ser intercetados em trânsito. Este BK é suporte de qualidade e segurança para toda a aplicação.

#### Scope-in

- Criar middleware que exige HTTPS em produção.
- Configurar `trust proxy` para ambientes com reverse proxy.
- Enviar header HSTS em produção.
- Validar `VITE_API_BASE_URL` com HTTPS em build publicado.
- Criar testes para desenvolvimento, produção segura e produção insegura.

#### Scope-out

- Não gerar certificados TLS dentro da app.
- Não escolher fornecedor de alojamento.
- Não configurar DNS.
- Não alterar rotas funcionais.
- Não guardar segredos no repositório.

#### Estado antes e depois

- Antes: a API funciona em HTTP local e não documenta gate HTTPS para produção.
- Depois: produção exige HTTPS via proxy/plataforma, desenvolvimento continua simples e há testes para o gate.

#### Pre-requisitos

- `BK-MF0-02`: sessão com cookie HttpOnly.
- `BK-MF6-03`: timeout e health check.
- `RNF09`: HTTPS/TLS 1.2+.
- `apps/api/src/config/env.js`: ambiente centralizado.
- `apps/web/src/services/apiClient.js`: base URL do frontend.

#### Glossário

- HTTPS: HTTP protegido por TLS.
- TLS: camada criptográfica de transporte.
- Reverse proxy: componente que recebe HTTPS e encaminha para Node.
- HSTS: header que instrui o browser a preferir HTTPS no domínio.
- `x-forwarded-proto`: header usado por proxies para indicar protocolo original.

#### Conceitos teóricos essenciais

Numa aplicação Node publicada, o certificado TLS costuma ficar numa plataforma ou proxy. A API Express deve validar que o pedido original chegou por HTTPS e deve marcar cookies como seguros em produção.

Localhost pode usar HTTP para desenvolvimento. O gate deve distinguir `development` de `production`, caso contrário os alunos bloqueiam o próprio ambiente local.

`CANONICO`: `RNF09` exige HTTPS/TLS 1.2+. `DERIVADO`: validar `x-forwarded-proto` e aplicar HSTS são decisões técnicas padrão para Express atrás de proxy.

O aluno deve perceber que a app não "inventa TLS" no controller. O código valida ambiente, proxy, cookies e URL pública; o certificado real fica fora da app, na plataforma ou reverse proxy.

Erros a evitar neste BK: obrigar HTTPS em localhost, assumir que CORS substitui HTTPS, deixar `VITE_API_BASE_URL` de produção com `http://` e devolver detalhes internos quando há pedido inseguro.

#### Arquitetura do BK

- `apps/api/src/middlewares/secure-transport.middleware.js`: gate HTTPS e HSTS.
- `apps/api/src/app.js`: aplica proxy e middleware.
- `apps/web/src/services/apiClient.js`: valida base URL pública.
- `apps/api/tests/mf6.secure-transport.test.js`: cobre produção segura/insegura.

#### Ficheiros a criar/editar/rever

- CRIAR: `apps/api/src/middlewares/secure-transport.middleware.js`
- EDITAR: `apps/api/src/app.js`
- EDITAR: `apps/web/src/services/apiClient.js`
- CRIAR: `apps/api/tests/mf6.secure-transport.test.js`
- REVER: `apps/api/src/services/session.service.js`
- REVER: `apps/api/src/config/env.js`

#### Tutorial técnico linear

### Passo 1 - Confirmar o contrato HTTPS da MF6

1. Objetivo funcional do passo no contexto da app.

Confirmar que `RNF09` protege comunicação em trânsito e não substitui autenticação, consentimento, ownership ou encriptação em repouso.

2. Ficheiros envolvidos:
    - REVER: `docs/RNF.md`
    - REVER: `docs/planificacao/backlogs/MATRIZ-CANONICA-BK.md`
    - REVER: `docs/planificacao/guias-bk/MF6/BK-MF6-04-imagens-otimizadas-lazy-loading-e-compressao-automatica.md`
    - REVER: `docs/planificacao/guias-bk/MF6/BK-MF6-06-palavras-passe-com-hash-seguro-bcrypt.md`
    - LOCALIZAÇÃO: linhas de `RNF09`, `BK-MF6-05`, handoff de `BK-MF6-04` e pre-requisitos de `BK-MF6-06`.

3. Instruções do que fazer.

Revê os documentos antes de escrever código. Garante que o objetivo é exigir HTTPS/TLS em ambientes publicados, mantendo HTTP local para desenvolvimento e sem criar certificados dentro da aplicação.

4. Código completo, correto e integrado com a app final.

Sem código neste passo. Este passo é documental e preparatório porque uma decisão errada aqui pode bloquear `localhost`, duplicar regras de segurança ou prometer configuração TLS que pertence à plataforma de alojamento.

5. Explicação do código.

Não há código para explicar. A decisão importante é separar responsabilidades: a plataforma ou reverse proxy termina TLS; a API Express valida que o pedido original chegou por HTTPS; o frontend publicado aponta para uma URL `https://`; os BKs seguintes continuam a tratar passwords e dados guardados.

6. Validação do passo.

Confirma que `RNF09` está ligado a `BK-MF6-05`, prioridade `P0`, sprint `S10-S11` e classe `SUPORTE`.

7. Cenário negativo/erro esperado.

Se o aluno tentar resolver `RNF09` apenas com CORS ou cookies, a solução deve ser rejeitada porque CORS não encripta tráfego.

### Passo 2 - Rever ambiente, proxy e cookies de sessão

1. Objetivo funcional do passo no contexto da app.

Preparar a aplicação para distinguir desenvolvimento local de produção publicada antes de ativar o gate HTTPS.

2. Ficheiros envolvidos:
    - REVER: `apps/api/src/config/env.js`
    - REVER: `apps/api/src/services/session.service.js`
    - REVER: `apps/api/src/app.js`
    - LOCALIZAÇÃO: export `env`, configuração de cookie e início de `createApp`.

3. Instruções do que fazer.

Confirma que `env.nodeEnv` existe, que os cookies ficam `secure` em produção e que `createApp` é o ponto único onde middlewares globais entram.

4. Código completo, correto e integrado com a app final.

Sem código neste passo. Este passo é de revisão porque o código existente de ambiente e sessão deve ser preservado; o BK só vai acrescentar o gate HTTPS.

5. Explicação do código.

Não há código novo. A revisão evita dois erros comuns: forçar HTTPS também em `development` e esquecer que cookies de sessão precisam de `secure: true` quando a app é publicada. `BK-MF6-06` depende deste canal seguro para que credenciais não viajem por HTTP em produção.

6. Validação do passo.

Confirma que `apps/api/src/services/session.service.js` não guarda tokens no browser e que a sessão continua baseada em cookie HttpOnly.

7. Cenário negativo/erro esperado.

Se `NODE_ENV=production` usar cookies sem flag `secure`, a sessão fica desalinhada com `RNF09` e deve ser corrigida antes de publicar.

### Passo 3 - Criar o helper que deteta pedidos seguros

1. Objetivo funcional do passo no contexto da app.

Isolar a regra que decide se o pedido original chegou por HTTPS.

2. Ficheiros envolvidos:
    - CRIAR: `apps/api/src/middlewares/secure-transport.middleware.js`
    - LOCALIZAÇÃO: topo do ficheiro.

3. Instruções do que fazer.

Cria o ficheiro do middleware e começa por exportar `isSecureRequest`. A função deve aceitar HTTPS direto (`req.secure`) e HTTPS terminado num proxy (`x-forwarded-proto`).

4. Código completo, correto e integrado com a app final.

```js
// apps/api/src/middlewares/secure-transport.middleware.js
import { AppError } from "./error.middleware.js";

/**
 * Confirma se o pedido original chegou por HTTPS.
 *
 * @function isSecureRequest
 * @param {import("express").Request} req - Pedido HTTP recebido pela API.
 * @returns {boolean} Verdadeiro quando Express ou o proxy indicam HTTPS.
 */
export function isSecureRequest(req) {
    // Em produção com proxy, Express precisa deste header para conhecer o protocolo original.
    return req.secure || req.get("x-forwarded-proto") === "https";
}
```

5. Explicação do código.

`isSecureRequest` não cria TLS; apenas interpreta a informação disponível no pedido. `req.secure` cobre o caso em que Express recebe HTTPS diretamente. `x-forwarded-proto` cobre a publicação comum em que um proxy recebe HTTPS e encaminha para Node. Esta função prepara o middleware do próximo passo e evita duplicar a regra em vários controllers.

6. Validação do passo.

Num teste unitário, `isSecureRequest` deve devolver `true` quando `req.secure` é verdadeiro ou quando `req.get("x-forwarded-proto")` devolve `"https"`.

7. Cenário negativo/erro esperado.

Se o header vier como `"http"`, a função deve devolver `false` para permitir bloqueio em produção.

### Passo 4 - Criar middleware HTTPS e HSTS

1. Objetivo funcional do passo no contexto da app.

Bloquear HTTP em produção sem bloquear desenvolvimento local.

2. Ficheiros envolvidos:
    - EDITAR: `apps/api/src/middlewares/secure-transport.middleware.js`
    - LOCALIZAÇÃO: abaixo de `isSecureRequest`.

3. Instruções do que fazer.

Acrescenta `requireHttps(env)`. Em desenvolvimento, o middleware deixa passar. Em produção insegura, devolve erro controlado. Em produção segura, aplica HSTS.

4. Código completo, correto e integrado com a app final.

```js
// apps/api/src/middlewares/secure-transport.middleware.js
import { AppError } from "./error.middleware.js";

/**
 * Confirma se o pedido original chegou por HTTPS.
 *
 * @function isSecureRequest
 * @param {import("express").Request} req - Pedido HTTP recebido pela API.
 * @returns {boolean} Verdadeiro quando Express ou o proxy indicam HTTPS.
 */
export function isSecureRequest(req) {
    // Em produção com proxy, Express precisa deste header para conhecer o protocolo original.
    return req.secure || req.get("x-forwarded-proto") === "https";
}

/**
 * Exige HTTPS em produção e aplica HSTS quando o pedido é seguro.
 *
 * @function requireHttps
 * @param {{nodeEnv: string}} env - Configuração normalizada da aplicação.
 * @returns {import("express").RequestHandler} Middleware Express.
 */
export function requireHttps(env) {
    return (req, res, next) => {
        if (env.nodeEnv !== "production") {
            return next();
        }

        if (!isSecureRequest(req)) {
            // A mensagem não revela topologia interna, nomes de proxy ou portas privadas.
            return next(new AppError(403, "Comunicação HTTPS obrigatória."));
        }

        // HSTS só é enviado depois de confirmar HTTPS para reforçar o browser em produção.
        res.setHeader("Strict-Transport-Security", "max-age=15552000; includeSubDomains");
        return next();
    };
}
```

5. Explicação do código.

`requireHttps` recebe `env` para ser testável sem alterar variáveis globais. Em `development`, o aluno continua a usar `http://localhost`. Em `production`, pedidos sem HTTPS são bloqueados com `403` e mensagem segura. Quando o pedido é seguro, HSTS reduz o risco de o browser voltar a usar HTTP naquele domínio. O middleware não lê cookies, não devolve paths internos e não altera rotas funcionais.

6. Validação do passo.

Em produção simulada com header `x-forwarded-proto: https`, o pedido deve seguir e a resposta deve receber `Strict-Transport-Security`.

7. Cenário negativo/erro esperado.

Em produção simulada com `x-forwarded-proto: http`, a API deve devolver erro `403` com a mensagem `Comunicação HTTPS obrigatória.`.

### Passo 5 - Aplicar o middleware na app

1. Objetivo funcional do passo no contexto da app.

Ativar validação HTTPS no ponto de entrada comum da API.

2. Ficheiros envolvidos:
    - EDITAR: `apps/api/src/app.js`
    - LOCALIZAÇÃO: início de `createApp`.

3. Instruções do que fazer.

Adiciona `app.set("trust proxy", 1)` e aplica `requireHttps(env)` antes das rotas. Mantém as rotas existentes depois dos middlewares globais.

4. Código completo, correto e integrado com a app final.

```js
// apps/api/src/app.js
import { requireHttps } from "./middlewares/secure-transport.middleware.js";

export function createApp() {
    const app = express();

    app.set("trust proxy", 1);
    app.use(cors({ origin: env.clientOrigin, credentials: true }));
    app.use(express.json());
    app.use(cookieParser());
    app.use(requireHttps(env));

    app.get("/api/health", (req, res) => {
        // Health check continua sem dados sensíveis e passa pelo gate HTTPS em produção.
        res.json({ status: "ok", app: "orelle" });
    });

    return app;
}
```

5. Explicação do código.

`trust proxy` permite que Express interprete corretamente headers do proxy. O middleware fica antes das rotas para proteger toda a API. No ficheiro real, mantém todas as rotas existentes depois do health check; não removas controllers nem middlewares de autenticação.

6. Validação do passo.

O health check local continua a funcionar com `NODE_ENV=development`.

7. Cenário negativo/erro esperado.

Se esqueceres `trust proxy`, a API pode rejeitar pedidos HTTPS encaminhados pelo proxy.

### Passo 6 - Validar base URL do frontend

1. Objetivo funcional do passo no contexto da app.

Evitar que o frontend publicado aponte para API `http://`.

2. Ficheiros envolvidos:
    - EDITAR: `apps/web/src/services/apiClient.js`
    - LOCALIZAÇÃO: definição de `API_BASE_URL`.

3. Instruções do que fazer.

Cria uma função de validação que só bloqueia quando o build está em produção.

4. Código completo, correto e integrado com a app final.

```js
// apps/web/src/services/apiClient.js
const configuredApiBaseUrl =
    import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3001/api";

/**
 * Valida a URL pública da API no frontend.
 *
 * @function resolveApiBaseUrl
 * @param {string} value - URL configurada.
 * @returns {string} URL pronta a usar pelo cliente HTTP.
 * @throws {Error} Quando produção usa HTTP inseguro.
 */
export function resolveApiBaseUrl(value) {
    const isProduction = import.meta.env.PROD;

    if (isProduction && value.startsWith("http://")) {
        throw new Error("VITE_API_BASE_URL deve usar HTTPS em produção.");
    }

    // Em desenvolvimento, localhost pode usar HTTP para facilitar testes.
    return value;
}

export const API_BASE_URL = resolveApiBaseUrl(configuredApiBaseUrl);
```

5. Explicação do código.

O frontend mantém HTTP local, mas impede build publicado com API insegura. Isto fecha uma falha comum: backend exigir HTTPS, mas frontend chamar uma URL HTTP. A função não altera cookies nem guarda dados.

6. Validação do passo.

Build local sem `VITE_API_BASE_URL` deve continuar a funcionar.

7. Cenário negativo/erro esperado.

Build de produção com `VITE_API_BASE_URL=http://api.exemplo.pt/api` deve falhar.

### Passo 7 - Criar testes de transporte seguro

1. Objetivo funcional do passo no contexto da app.

Provar desenvolvimento local, produção segura e produção insegura.

2. Ficheiros envolvidos:
    - CRIAR: `apps/api/tests/mf6.secure-transport.test.js`
    - LOCALIZAÇÃO: ficheiro completo.

3. Instruções do que fazer.

Testa o middleware diretamente para não depender de certificados reais.

4. Código completo, correto e integrado com a app final.

```js
// apps/api/tests/mf6.secure-transport.test.js
import { describe, expect, it, vi } from "vitest";
import { requireHttps } from "../src/middlewares/secure-transport.middleware.js";

function buildReq(proto = "http") {
    // O mock representa o protocolo original recebido do proxy sem depender de certificados reais.
    return { secure: false, get: () => proto };
}

describe("BK-MF6-05 transporte seguro", () => {
    it("permite desenvolvimento local por HTTP", () => {
        const next = vi.fn();
        requireHttps({ nodeEnv: "development" })(buildReq("http"), {}, next);
        expect(next).toHaveBeenCalledWith();
    });

    it("permite produção quando proxy indica HTTPS", () => {
        const next = vi.fn();
        const res = { setHeader: vi.fn() };
        requireHttps({ nodeEnv: "production" })(buildReq("https"), res, next);
        // HSTS só deve surgir no caminho seguro para não mascarar pedidos de produção inseguros.
        expect(res.setHeader).toHaveBeenCalledWith(
            "Strict-Transport-Security",
            expect.stringContaining("max-age"),
        );
    });

    it("bloqueia produção insegura", () => {
        const next = vi.fn();
        requireHttps({ nodeEnv: "production" })(buildReq("http"), {}, next);
        // O erro é controlado e não revela detalhes da infraestrutura.
        expect(next.mock.calls[0][0]).toMatchObject({ statusCode: 403 });
    });
});
```

5. Explicação do código.

Os testes validam a regra sem precisar de certificado real. A produção segura recebe HSTS; a produção insegura é bloqueada; desenvolvimento continua simples. Isto prova `RNF09` no código que está sob controlo dos alunos.

6. Validação do passo.

Executa `npm --prefix apps/api test -- mf6.secure-transport.test.js`.

7. Cenário negativo/erro esperado.

Se produção insegura não devolver erro, o BK falha `RNF09`.

### Passo 8 - Preparar evidence e handoff para passwords e encriptação

1. Objetivo funcional do passo no contexto da app.

Fechar o BK com provas suficientes para a defesa e com handoff claro para `BK-MF6-06` e `BK-MF6-07`.

2. Ficheiros envolvidos:
    - REVER: `apps/api/tests/mf6.secure-transport.test.js`
    - REVER: `apps/web/src/services/apiClient.js`
    - REVER: `docs/planificacao/guias-bk/MF6/BK-MF6-06-palavras-passe-com-hash-seguro-bcrypt.md`
    - REVER: `docs/planificacao/guias-bk/MF6/BK-MF6-07-fotografias-e-relatorios-de-analise-armazenados-de-forma-encriptada.md`
    - LOCALIZAÇÃO: testes, critérios de aceite, evidence e handoff.

3. Instruções do que fazer.

Guarda no PR ou na defesa os outputs dos comandos finais, o negativo de produção HTTP, a validação de build web e a confirmação de que os BKs seguintes partem de canal seguro.

4. Código completo, correto e integrado com a app final.

Sem código neste passo. Este passo é de validação e evidence porque a implementação já ficou completa nos passos anteriores.

5. Explicação do código.

Não há código novo. A evidence mostra que `RNF09` foi aplicado no backend e no frontend. O handoff é importante porque passwords do `BK-MF6-06`, fotografias e relatórios do `BK-MF6-07` são dados sensíveis; eles continuam a precisar de hash e encriptação, mas já assumem comunicação segura em produção.

6. Validação do passo.

Confirma que existem pelo menos três negativos registados: produção HTTP bloqueada, URL pública HTTP bloqueada e localhost permitido sem falso bloqueio.

7. Cenário negativo/erro esperado.

Se a evidence só mostrar build web e não mostrar o negativo HTTPS, o BK não deve ser marcado como `OK`.

#### Expected results

- Desenvolvimento local permite HTTP.
- Produção com `x-forwarded-proto: https` segue.
- Produção com `x-forwarded-proto: http` devolve `403`.
- HSTS aparece em produção segura.

#### Critérios de aceite

##### Matriz minima de testes por prioridade

- Cenarios negativos concluidos: minimo `3`.
- Matriz minima de testes por prioridade: `P0 = unit + integration + e2e/smoke + minimo 3 negativos`.
- Evidencia de testes por camada: unit do middleware, build frontend e validação manual de headers.
- Gate HTTPS não quebra localhost.
- Cookies de sessão continuam HttpOnly e seguros em produção.
- Frontend publicado não usa `http://` para API.
- Evidence inclui testes do middleware e validação de build.

#### Validação final

Executar cenarios negativos obrigatorios (minimo 3) antes de fechar o BK.

- [ ] Negativos: minimo `3` cenarios.

```bash
npm --prefix apps/api test
npm --prefix apps/web run build
bash scripts/validate-planificacao.sh
```

#### Evidence para PR/defesa

- `proof_tecnico`: output dos testes de transporte seguro.
- `proof_negativos`: produção HTTP bloqueada, URL pública HTTP bloqueada, localhost permitido.
- `proof_privacidade`: sessão, fotografias, relatórios e checkout exigem canal seguro em produção.

#### Handoff

`BK-MF6-06` deve continuar a proteger passwords com bcrypt e assumir que, em produção, credenciais viajam apenas por HTTPS.

#### Changelog

- `2026-06-24`: removidas secções estruturais antigas, preservados conceitos essenciais dentro do contrato `####` e reforçados comentários didáticos no teste de transporte.
- `2026-06-22`: guia reescrito para gate HTTPS/TLS, HSTS, validação de base URL e testes de `RNF09`.
