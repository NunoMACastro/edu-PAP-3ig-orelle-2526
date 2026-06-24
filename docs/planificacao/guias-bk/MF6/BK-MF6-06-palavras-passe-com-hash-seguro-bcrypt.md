# BK-MF6-06 - Palavras-passe com hash seguro (bcrypt)

## Header
- `doc_id`: `GUIA-BK-MF6-06`
- `bk_id`: `BK-MF6-06`
- `macro`: `MF6`
- `owner`: `Izelicks`
- `apoio`: `Bruna`
- `prioridade`: `P0`
- `estado`: `TODO`
- `esforco`: `M`
- `dependencias`: `-`
- `rf_rnf`: `RNF10`
- `fase_documental`: `Fase 3`
- `sprint`: `S10-S11`
- `core_or_reforco`: `Reforco`
- `classe_core_dual`: `SUPORTE`
- `eixo_primario`: `FundacaoQualidade`
- `kpi_primario`: `taxa_incidentes_criticos`
- `kpi_secundario`: `taxa_conformidade_gates`
- `proximo_bk`: `BK-MF6-07`
- `guia_path`: `docs/planificacao/guias-bk/MF6/BK-MF6-06-palavras-passe-com-hash-seguro-bcrypt.md`
- `last_updated`: `2026-06-24`

#### Objetivo

Neste BK vais consolidar o uso de bcrypt para proteger palavras-passe na Orélle, cumprindo `RNF10` sem mudar o contrato de autenticação dos BKs anteriores.

O resultado observável é que a API nunca guarda password em claro, nunca devolve `passwordHash` em respostas públicas e valida registo/login com mensagens seguras.

#### Importância

Passwords são segredos de utilizadores. Mesmo numa PAP, guardar password em claro é uma falha grave. bcrypt reduz o risco porque guarda um hash lento e com salt, tornando ataques offline muito mais difíceis.

#### Scope-in

- Tornar explícito o custo bcrypt.
- Confirmar `passwordHash` com `select: false`.
- Validar regras mínimas de password no backend.
- Garantir mensagem de login igual para email inexistente e password errada.
- Criar testes para hash, ausência de password em resposta e login inválido.

#### Scope-out

- Não implementar recuperação de password.
- Não criar MFA.
- Não alterar cookies de sessão.
- Não trocar bcrypt por algoritmo sem contrato documental.
- Não guardar passwords ou hashes em logs.

#### Estado antes e depois

- Antes: o fluxo de autenticação já usa bcrypt, mas o guia não ensina nem valida formalmente `RNF10`.
- Depois: o BK documenta o contrato, torna o custo explícito e cria testes que provam proteção da password.

#### Pre-requisitos

- `BK-MF0-01`: registo com email/password.
- `BK-MF0-02`: login/logout e cookie HttpOnly.
- `BK-MF6-05`: transporte HTTPS em produção.
- `RNF10`: passwords com hash seguro bcrypt.
- Dependência existente: `bcryptjs` em `apps/api/package.json`.

#### Glossário

- Password em claro: texto original introduzido pelo utilizador.
- Hash: resultado irreversível usado para comparação segura.
- Salt: valor aleatório incorporado no hash bcrypt.
- Cost factor: número que controla a dificuldade do bcrypt.
- Enumeração de contas: ataque que tenta descobrir emails registados.

#### Conceitos teóricos essenciais

Hash não é encriptação. A app não deve conseguir recuperar a password original. No login, compara a password enviada com o hash guardado usando `bcrypt.compare`.

`select: false` no modelo Mongoose evita que `passwordHash` seja devolvido por queries normais. O login é a exceção controlada: pede explicitamente `+passwordHash` para comparar.

`CANONICO`: `RNF10` exige bcrypt. `DERIVADO`: usar custo `12` mantém equilíbrio entre segurança e execução pedagógica na stack atual.

O aluno deve perceber por que nunca se guarda password em claro, por que o hash acontece no backend e por que mensagens de login não devem revelar se o email existe.

Erros a evitar neste BK: guardar `password` no model, devolver `passwordHash` ao frontend, usar mensagens diferentes para email inexistente e password errada, ou fazer hash no frontend como substituto da validação backend.

#### Arquitetura do BK

- `apps/api/src/models/user.model.js`: `passwordHash` protegido por `select: false`.
- `apps/api/src/validators/auth.validator.js`: valida password.
- `apps/api/src/services/auth.service.js`: gera e compara bcrypt.
- `apps/api/tests/mf6.password-hash.test.js`: prova o contrato.

#### Ficheiros a criar/editar/rever

- EDITAR: `apps/api/src/services/auth.service.js`
- REVER: `apps/api/src/models/user.model.js`
- REVER: `apps/api/src/validators/auth.validator.js`
- CRIAR: `apps/api/tests/mf6.password-hash.test.js`
- REVER: `apps/api/package.json`

#### Tutorial técnico linear

### Passo 1 - Confirmar o contrato de passwords da MF6

1. Objetivo funcional do passo no contexto da app.

Confirmar que `RNF10` trata passwords como segredos e exige hash seguro no backend.

2. Ficheiros envolvidos:
    - REVER: `docs/RNF.md`
    - REVER: `docs/RF.md`
    - REVER: `docs/planificacao/backlogs/MATRIZ-CANONICA-BK.md`
    - REVER: `docs/planificacao/guias-bk/MF0/BK-MF0-01-registo-de-utilizadores-com-email-e-password.md`
    - REVER: `docs/planificacao/guias-bk/MF0/BK-MF0-02-login-e-logout-com-sessao-segura-cookie-httponly.md`
    - REVER: `docs/planificacao/guias-bk/MF6/BK-MF6-05-todas-as-comunicacoes-via-https-tls-1-2.md`
    - LOCALIZAÇÃO: linhas de `RF01`, `RNF10`, `BK-MF6-06` e contratos de auth anteriores.

3. Instruções do que fazer.

Antes de editar código, confirma que a app já tem registo, login, cookie HttpOnly e canal HTTPS de produção. Este BK não muda a sessão; reforça a forma como a password é validada, transformada em hash e nunca devolvida.

4. Código completo, correto e integrado com a app final.

Sem código neste passo. Este passo é documental porque evita confundir hash com encriptação, trocar o algoritmo sem contrato ou mover a responsabilidade para o frontend.

5. Explicação do código.

Não há código novo. A decisão essencial é que a password entra pela API, é validada no backend, passa por bcrypt e nunca regressa ao frontend. `BK-MF6-05` protege o transporte; este BK protege o armazenamento e a comparação.

6. Validação do passo.

Confirma que `RNF10` está ligado a `BK-MF6-06`, prioridade `P0`, sprint `S10-S11` e classe `SUPORTE`.

7. Cenário negativo/erro esperado.

Se alguém propuser guardar `password` em claro ou fazer hash apenas no frontend, a solução deve ser rejeitada.

### Passo 2 - Validar password no backend

1. Objetivo funcional do passo no contexto da app.

Garantir que o service só recebe passwords com formato mínimo aceitável para registo.

2. Ficheiros envolvidos:
    - REVER: `apps/api/src/validators/auth.validator.js`
    - LOCALIZAÇÃO: ficheiro completo.

3. Instruções do que fazer.

Confirma que `validateRegisterInput` normaliza email, exige password com pelo menos 8 caracteres e exige letras e números. Mantém a validação no backend mesmo que a UI tenha campos obrigatórios.

4. Código completo, correto e integrado com a app final.

```js
// apps/api/src/validators/auth.validator.js
import { AppError } from "../middlewares/error.middleware.js";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Normaliza um email recebido do cliente.
 *
 * @function normalizeEmail
 * @param {unknown} value - Valor recebido em `body.email`.
 * @returns {string} Email em minúsculas e sem espaços laterais.
 */
function normalizeEmail(value) {
    return String(value ?? "")
        .trim()
        .toLowerCase();
}

/**
 * Valida o payload de registo do BK-MF0-01.
 *
 * @function validateRegisterInput
 * @param {{email?: unknown, password?: unknown}} body - Corpo do pedido HTTP.
 * @returns {{email: string, password: string}} Dados normalizados para o service.
 * @throws {AppError} Quando email ou password não cumprem o contrato RF01/RNF10.
 */
export function validateRegisterInput(body) {
    const email = normalizeEmail(body.email);
    const password = String(body.password ?? "");
    const errors = {};

    if (!EMAIL_RE.test(email)) {
        errors.email = "Email inválido";
    }

    if (password.length < 8) {
        errors.password = "A password deve ter pelo menos 8 caracteres";
    }

    if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) {
        // Esta regra impede passwords demasiado fracas antes de chegar ao hash.
        errors.password = "A password deve incluir letras e números";
    }

    if (Object.keys(errors).length > 0) {
        throw new AppError(400, "Dados de registo inválidos", errors);
    }

    return { email, password };
}
```

5. Explicação do código.

O validator protege o service de dados crus do request. `normalizeEmail` reduz duplicação causada por maiúsculas ou espaços. A password continua em memória apenas o tempo necessário para ser validada e enviada ao service. Esta validação não substitui bcrypt; prepara uma entrada minimamente aceitável antes do hash.

6. Validação do passo.

Envia password curta e confirma que a API devolve `400` com erro de validação.

7. Cenário negativo/erro esperado.

Uma password como `abcdefg` deve falhar porque tem menos de 8 caracteres e não cumpre o contrato mínimo.

### Passo 3 - Confirmar modelo seguro

1. Objetivo funcional do passo no contexto da app.

Impedir que hashes sejam devolvidos em queries normais.

2. Ficheiros envolvidos:
    - REVER: `apps/api/src/models/user.model.js`
    - LOCALIZAÇÃO: campo `passwordHash`.

3. Instruções do que fazer.

Confirma que `passwordHash` é obrigatório e tem `select: false`.

4. Código completo, correto e integrado com a app final.

Sem código neste passo. Este passo é de revisão do schema existente: o aluno deve confirmar o campo `passwordHash` dentro de `apps/api/src/models/user.model.js`, sem criar outro modelo de utilizador.

5. Explicação do código.

Não há código novo. `select: false` é uma proteção contra fugas acidentais. Services de perfil, admin e sessão não recebem o hash por defeito. O login usa `+passwordHash` apenas no ponto onde precisa comparar credenciais.

6. Validação do passo.

`User.findOne({ email })` sem `+passwordHash` não deve incluir o campo.

7. Cenário negativo/erro esperado.

Um endpoint que devolva `passwordHash` ao frontend deve ser corrigido imediatamente.

### Passo 4 - Tornar o custo bcrypt explícito

1. Objetivo funcional do passo no contexto da app.

Centralizar o custo de hash para ser auditável.

2. Ficheiros envolvidos:
    - EDITAR: `apps/api/src/services/auth.service.js`
    - LOCALIZAÇÃO: topo do ficheiro e função `registerUser`.

3. Instruções do que fazer.

Cria `BCRYPT_COST = 12` e usa a constante no registo.

4. Código completo, correto e integrado com a app final.

```js
// apps/api/src/services/auth.service.js
import bcrypt from "bcryptjs";
import { User } from "../models/user.model.js";
import { AppError } from "../middlewares/error.middleware.js";

export const BCRYPT_COST = 12;
const ACTIVE_ACCOUNT_STATUS = "active";

/**
 * Regista um novo utilizador com password protegida por bcrypt.
 *
 * @async
 * @function registerUser
 * @param {{email: string, password: string}} input - Dados validados pelo validator.
 * @returns {Promise<{id: string, email: string, role: string, createdAt: Date|undefined}>} Utilizador seguro.
 * @throws {AppError} Quando o email já existe.
 */
export async function registerUser({ email, password }) {
    const existing = await User.findOne({ email }).select("_id");

    if (existing) {
        throw new AppError(409, "Já existe uma conta com este email");
    }

    // O backend faz hash da password; a UI nunca decide como guardar segredos.
    const passwordHash = await bcrypt.hash(password, BCRYPT_COST);
    const user = await User.create({ email, passwordHash, role: "cliente" });

    return toSafeUser(user);
}
```

5. Explicação do código.

A constante torna o custo visível para revisão. `bcrypt.hash` recebe a password validada e guarda apenas `passwordHash`. A resposta passa por `toSafeUser`, por isso não devolve segredo. O aluno pode ajustar o custo com orientação técnica, mas não deve reduzir para acelerar testes sem decisão documentada.

6. Validação do passo.

Regista um utilizador e confirma na base de dados que o valor guardado começa por `$2`.

7. Cenário negativo/erro esperado.

Se `passwordHash` for igual à password enviada, o BK falha `RNF10`.

### Passo 5 - Manter login com mensagem segura

1. Objetivo funcional do passo no contexto da app.

Evitar que atacantes descubram se um email existe.

2. Ficheiros envolvidos:
    - EDITAR: `apps/api/src/services/auth.service.js`
    - LOCALIZAÇÃO: função `loginUser`.

3. Instruções do que fazer.

Mantém a mesma mensagem para email inexistente e password errada. O login pode pedir `+passwordHash`, mas só neste ponto controlado do service.

4. Código completo, correto e integrado com a app final.

```js
// apps/api/src/services/auth.service.js
/**
 * Autentica um utilizador por email/password.
 *
 * @async
 * @function loginUser
 * @param {{email: string, password: string}} input - Credenciais validadas.
 * @returns {Promise<{id: string, email: string, role: string, createdAt: Date|undefined}>} Utilizador autenticado.
 * @throws {AppError} Quando email ou password não correspondem.
 */
export async function loginUser({ email, password }) {
    const user = await User.findOne({ email }).select(
        "+passwordHash email role createdAt isActive accountStatus",
    );

    if (!user) {
        throw new AppError(401, "Credenciais inválidas");
    }

    ensureUserCanAuthenticate(user);

    const passwordMatches = await bcrypt.compare(password, user.passwordHash);

    if (!passwordMatches) {
        // A mesma mensagem evita enumeração de contas por tentativa/erro.
        throw new AppError(401, "Credenciais inválidas");
    }

    return toSafeUser(user);
}
```

5. Explicação do código.

O login pede `+passwordHash` apenas para comparação. `bcrypt.compare` valida a password sem revelar o hash ao frontend. A mensagem uniforme reduz enumeração de contas. `ensureUserCanAuthenticate` preserva regras de conta ativa, e `toSafeUser` continua a devolver apenas dados públicos.

6. Validação do passo.

Email inexistente e password errada devem devolver `401` com a mesma mensagem.

7. Cenário negativo/erro esperado.

Se email inexistente devolver "email não existe", a app expõe informação útil a atacantes.

### Passo 6 - Confirmar resposta pública sem hash

1. Objetivo funcional do passo no contexto da app.

Garantir que a API nunca devolve `passwordHash`, mesmo depois de pedir `+passwordHash` no login.

2. Ficheiros envolvidos:
    - REVER: `apps/api/src/services/auth.service.js`
    - LOCALIZAÇÃO: função `toSafeUser`.

3. Instruções do que fazer.

Confirma que todas as respostas de registo, login e sessão passam por uma função de mapeamento seguro.

4. Código completo, correto e integrado com a app final.

```js
// apps/api/src/services/auth.service.js
/**
 * Converte um documento User numa resposta segura para o cliente.
 *
 * @function toSafeUser
 * @param {{_id: {toString: () => string}, email: string, role: string, createdAt?: Date}} user - Documento Mongoose ou mock equivalente.
 * @returns {{id: string, email: string, role: string, createdAt: Date|undefined}} Utilizador sem campos sensíveis.
 */
function toSafeUser(user) {
    return {
        id: user._id.toString(),
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
    };
}
```

5. Explicação do código.

`toSafeUser` cria a fronteira entre dados internos e resposta pública. Mesmo quando `loginUser` carrega `+passwordHash`, a função devolve apenas `id`, `email`, `role` e `createdAt`. Isto protege o frontend, logs de resposta e screenshots de defesa contra fuga de hashes.

6. Validação do passo.

Faz login válido e confirma que o JSON de resposta não contém `password`, `passwordHash` nem campos técnicos de sessão.

7. Cenário negativo/erro esperado.

Se a resposta incluir `passwordHash`, a falha é crítica porque expõe um segredo derivado da password.

### Passo 7 - Criar testes do contrato bcrypt

1. Objetivo funcional do passo no contexto da app.

Provar que password em claro não é guardada nem devolvida.

2. Ficheiros envolvidos:
    - CRIAR: `apps/api/tests/mf6.password-hash.test.js`
    - LOCALIZAÇÃO: ficheiro completo.

3. Instruções do que fazer.

Usa mocks de `User` para validar chamadas sem depender de base de dados real.

4. Código completo, correto e integrado com a app final.

```js
// apps/api/tests/mf6.password-hash.test.js
import bcrypt from "bcryptjs";
import { describe, expect, it, vi } from "vitest";
import { registerUser, BCRYPT_COST } from "../src/services/auth.service.js";
import { User } from "../src/models/user.model.js";

// O mock captura o payload entregue ao model para provar que só o hash segue para persistência.
vi.mock("../src/models/user.model.js", () => ({
    User: {
        findOne: vi.fn(() => ({ select: vi.fn().mockResolvedValue(null) })),
        create: vi.fn(async (data) => ({
            _id: { toString: () => "user-1" },
            email: data.email,
            role: data.role,
            createdAt: new Date("2026-06-22T00:00:00.000Z"),
        })),
    },
}));

describe("BK-MF6-06 bcrypt", () => {
    it("guarda hash bcrypt e devolve utilizador seguro", async () => {
        const user = await registerUser({
            email: "cliente@orelle.test",
            password: "Senha12345",
        });

        const created = User.create.mock.calls[0][0];
        // Estas asserções separam contrato privado de persistência e contrato público da resposta.
        expect(created.passwordHash).not.toBe("Senha12345");
        expect(await bcrypt.compare("Senha12345", created.passwordHash)).toBe(true);
        expect(user).not.toHaveProperty("passwordHash");
        expect(BCRYPT_COST).toBeGreaterThanOrEqual(12);
    });
});
```

5. Explicação do código.

O teste confirma três contratos: o valor guardado não é password em claro, bcrypt consegue validar a password correta e a resposta pública não tem `passwordHash`. O mock evita persistência real e mantém o teste rápido.

6. Validação do passo.

Executa `npm --prefix apps/api test -- mf6.password-hash.test.js`.

7. Cenário negativo/erro esperado.

Se `created.passwordHash` for igual à password, o teste falha.

### Passo 8 - Preparar evidence e handoff para encriptação em repouso

1. Objetivo funcional do passo no contexto da app.

Fechar o BK com provas do contrato bcrypt e preparar `BK-MF6-07`, que aplica a mesma disciplina a fotografias e relatórios.

2. Ficheiros envolvidos:
    - REVER: `apps/api/tests/mf6.password-hash.test.js`
    - REVER: `apps/api/src/services/auth.service.js`
    - REVER: `apps/api/src/models/user.model.js`
    - REVER: `docs/planificacao/guias-bk/MF6/BK-MF6-07-fotografias-e-relatorios-de-analise-armazenados-de-forma-encriptada.md`
    - LOCALIZAÇÃO: testes, resposta pública, critérios de aceite, evidence e handoff.

3. Instruções do que fazer.

Guarda evidence dos testes, da ausência de `passwordHash` nas respostas públicas e dos negativos de password curta, password errada e email inexistente.

4. Código completo, correto e integrado com a app final.

Sem código neste passo. Este passo é de validação e evidence porque a implementação já ficou completa nos passos anteriores.

5. Explicação do código.

Não há código novo. A evidence demonstra que `RNF10` não depende de confiança no frontend: o backend valida, gera hash, compara com bcrypt e devolve DTO seguro. `BK-MF6-07` deve manter esta lógica de minimização para fotografias e relatórios sensíveis.

6. Validação do passo.

Confirma que existem pelo menos três negativos registados: password curta rejeitada, password errada com `401` e email inexistente com mensagem equivalente.

7. Cenário negativo/erro esperado.

Se a evidence só mostrar o caso feliz de registo, o BK não deve ser marcado como `OK`, porque `RNF10` exige proteção contra falhas e abuso.

#### Expected results

- Registo cria hash bcrypt.
- Login usa `bcrypt.compare`.
- Respostas públicas não incluem `passwordHash`.
- Email inexistente e password errada devolvem `401` com mensagem equivalente.

#### Critérios de aceite

##### Matriz minima de testes por prioridade

- Cenarios negativos concluidos: minimo `3`.
- Matriz minima de testes por prioridade: `P0 = unit + integration + e2e/smoke + minimo 3 negativos`.
- Evidencia de testes por camada: unit do service, integração de auth e revisão de resposta pública.
- `BCRYPT_COST >= 12`.
- `passwordHash` tem `select: false`.
- Nenhuma resposta pública devolve password ou hash.
- Teste de contrato passa.

#### Validação final

Executar cenarios negativos obrigatorios (minimo 3) antes de fechar o BK.

- [ ] Negativos: minimo `3` cenarios.

```bash
npm --prefix apps/api test
bash scripts/validate-planificacao.sh
```

#### Evidence para PR/defesa

- `proof_tecnico`: output dos testes bcrypt.
- `proof_negativos`: password curta rejeitada, password errada `401`, hash ausente da resposta.
- `proof_privacidade`: password em claro nunca é persistida.

#### Handoff

`BK-MF6-07` deve aplicar a mesma lógica de minimização a fotografias e relatórios: dados sensíveis guardados com proteção forte e respostas públicas sem segredos técnicos.

#### Changelog

- `2026-06-24`: removidas secções estruturais antigas, preservadas regras de segurança no contrato `####` e reforçados comentários didáticos no teste bcrypt.
- `2026-06-22`: guia reescrito para contrato bcrypt completo, custo explícito, validação backend e testes de `RNF10`.
