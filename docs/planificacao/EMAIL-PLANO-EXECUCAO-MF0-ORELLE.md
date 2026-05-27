# Plano de Execução - MF0 Orélle

Snapshot do backlog: `2026-04-18` (`orelle/docs/planificacao/backlogs/BACKLOG-MVP.md`).

Guias MF0 refinados: `2026-05-25` (`orelle/docs/planificacao/guias-bk/MF0/`).

## 1) Contexto principal

A `MF0` da Orélle é uma fase de **fundamentos e governance**, mas já inclui implementação real da aplicação.

Nesta macro entram as bases de:

- registo;
- login/logout com sessão segura;
- perfil personalizado;
- edição de perfil;
- roles;
- preferências;
- produtos;
- categorias.

Ao contrário da FaithFlix, esta `MF0` não é apenas documental. Aqui já se cria base técnica de backend, frontend e dados.

Stack/contrato técnico previsto nos guias:

- Node.js + Express;
- React;
- MongoDB/Mongoose;
- cookies `HttpOnly` para sessão;
- passwords com hash seguro (`bcrypt`);
- separação por camadas: `routes -> controller -> service -> model`;
- evidence obrigatória por BK.

---

## 2) BKs da MF0

Owner stream P0 da MF0: `Bruna`

Equipa envolvida na MF0: `Bruna` e `Izelicks`

| BK          | Título                                                                                   | Owner    | Apoio    | Pri | Esforço | Dependências | RF   |
| ----------- | ---------------------------------------------------------------------------------------- | -------- | -------- | --- | ------- | ------------ | ---- |
| `BK-MF0-01` | Registo de utilizadores com email e password                                             | Bruna    | Izelicks | P0  | M       | -            | RF01 |
| `BK-MF0-02` | Login e logout com sessão segura (cookie HttpOnly)                                       | Bruna    | Izelicks | P0  | M       | -            | RF02 |
| `BK-MF0-03` | Criação de perfil personalizado                                                          | Bruna    | Izelicks | P0  | M       | `BK-MF0-01`  | RF03 |
| `BK-MF0-04` | Editar perfil e atualizar fotografias periodicamente                                     | Izelicks | Bruna    | P1  | S       | `BK-MF0-03`  | RF04 |
| `BK-MF0-05` | Criação de roles: Cliente, Consultor, Administrador                                      | Bruna    | Izelicks | P0  | M       | `BK-MF0-01`  | RF05 |
| `BK-MF0-06` | Preferências de produtos e marcas favoritas                                              | Izelicks | Bruna    | P1  | S       | `BK-MF0-03`  | RF06 |
| `BK-MF0-07` | Registar produtos com nome, descrição, ingredientes, tipo de pele, imagem, preço e stock | Bruna    | Izelicks | P0  | M       | -            | RF07 |
| `BK-MF0-08` | Associar categorias                                                                      | Bruna    | Izelicks | P0  | M       | `BK-MF0-07`  | RF08 |

Todos estão planeados para `S01-S02`.

---

## 3) Regra principal obrigatória

Antes de começar qualquer BK:

1. Ler o guia completo do BK.
2. Confirmar `owner`, `apoio`, `prioridade`, `dependências`, `rf_rnf` e `proximo_bk`.
3. Perceber o que entra e o que fica fora.
4. Conseguir explicar o plano de implementação em 2-3 frases.
5. Confirmar comigo antes de implementar ou fechar o BK.

Nenhum BK pode ficar `DONE` sem:

- smoke;
- negativos;
- validação técnica;
- evidence `pr`, `proof`, `neg`;
- validação da planificação sem drift.

---

## 4) Atenção obrigatória a paths e estrutura

Há uma inconsistência que tem de ser tratada com cuidado:

- `BK-MF0-01` define estrutura inicial em `apps/api/` e `apps/web/`;
- alguns BKs seguintes referem paths como `server/src/...` e `client/src/...`.

Regra:

1. O `BK-MF0-01` define a estrutura real da app.
2. Depois disso, os BKs seguintes devem adaptar-se à estrutura real já criada.
3. Não criar duas estruturas paralelas (`apps/api` + `server`, ou `apps/web` + `client`) sem aprovação.
4. Se houver dúvida, parar e perguntar.

Isto é blocker de arquitetura. Não é detalhe cosmético.

---

## 5) Dados e variáveis de ambiente

Nunca meter segredos no repositório.

Usar apenas `.env` local para:

- `MONGODB_URI`;
- `SESSION_SECRET` ou `JWT_SECRET`, conforme estratégia aprovada para sessão;
- `ADMIN_EMAIL` e `ADMIN_PASSWORD`, se for usado seed local de administrador.

Antes de qualquer commit:

```bash
git status
```

Confirmar:

- `.env` não está staged;
- não há passwords, tokens, URIs privadas ou cookies reais em commits;
- evidence está sanitizada;
- screenshots/logs não expõem dados sensíveis.

---

## 6) Ordem de execução

0. Fazer refresh de tabs GitHub/IDE abertas.
1. Ler `orelle/docs/planificacao/README.md`.
2. Confirmar hierarquia de verdade:
    - `MATRIZ-CANONICA-BK`;
    - `BACKLOG-MVP`;
    - `PLANO-SPRINTS`;
    - `SCORECARD-SPRINTS`;
    - `GUIAO-DOCENTE-SEMANAL`;
    - `GATES-S4-S8-S12`;
    - `guias-bk/*`.
3. Abrir `orelle/docs/planificacao/PLANO-IMPLEMENTACAO-TOTAL.md`.
4. Confirmar `MF0 - Fundamentos e governance`.
5. Abrir `orelle/docs/planificacao/backlogs/MF-VIEWS.md`.
6. Confirmar sequência:
    - `BK-MF0-01`;
    - `BK-MF0-02`;
    - `BK-MF0-03`;
    - `BK-MF0-04`;
    - `BK-MF0-05`;
    - `BK-MF0-06`;
    - `BK-MF0-07`;
    - `BK-MF0-08`.
7. Abrir `orelle/docs/planificacao/backlogs/BACKLOG-MVP.md`.
8. Confirmar estado, dependências, owner, apoio, prioridade, esforço e RF.
9. Abrir o guia específico do BK em `orelle/docs/planificacao/guias-bk/MF0/`.
10. Validar o scope-out antes de escrever código.
11. Implementar em ciclos curtos, mantendo PR pequeno.
12. Validar smoke + negativos + evidence.
13. Correr validação documental:

```bash
bash scripts/validate-planificacao.sh
```

---

## 7) SSOT mínimo da MF0

Ler apenas as partes relevantes:

- `orelle/docs/RF.md`
    - `RF01..RF08`.

- `orelle/docs/RNF.md`
    - `RNF10`: passwords com hash seguro;
    - `RNF14`: sessões com cookies `HttpOnly`;
    - RNF de segurança/privacidade relevantes quando houver fotografia ou dados sensíveis.

- `orelle/docs/planificacao/PLANO-IMPLEMENTACAO-TOTAL.md`
    - `## Tabela MF0..MF8`;
    - `## Regras transversais por macro`;
    - `## Gates S4/S8/S12`.

- `orelle/docs/planificacao/backlogs/BACKLOG-MVP.md`
    - linhas `BK-MF0-01..BK-MF0-08`;
    - contrato pedagógico comum;
    - matriz mínima de negativos por prioridade.

- `orelle/docs/planificacao/backlogs/MF-VIEWS.md`
    - `## MF0 - Fundamentos e governance`.

- `orelle/docs/planificacao/sprints/PLANO-SPRINTS.md`
    - `S01` e `S02`;
    - matriz mínima de testes por prioridade.

- Guias específicos:
    - `BK-MF0-01-registo-de-utilizadores-com-email-e-password.md`;
    - `BK-MF0-02-login-e-logout-com-sessao-segura-cookie-httponly.md`;
    - `BK-MF0-03-criacao-de-perfil-personalizado-com-nome-idade-tipo-de-pele-genero-e-objetivos-ex-hidratar-antiacne.md`;
    - `BK-MF0-04-possibilidade-de-editar-o-perfil-e-atualizar-fotografias-periodicamente.md`;
    - `BK-MF0-05-criacao-de-roles-cliente-consultor-administrador.md`;
    - `BK-MF0-06-cada-utilizador-pode-guardar-preferencias-de-produtos-e-marcas-favoritas.md`;
    - `BK-MF0-07-registar-produtos-com-nome-descricao-ingredientes-tipo-de-pele-indicado-imagem-preco-e-stock.md`;
    - `BK-MF0-08-associar-categorias-limpeza-maquilhagem-tratamento-protetor-solar-etc.md`.

---

## 8) Validação por BK

### `BK-MF0-01` - Registo

Smoke:

- criar utilizador com email novo e password válida;
- resposta `201`;
- resposta sem `password` e sem `passwordHash`.

Negativos:

- email em falta ou inválido => `400`;
- password fraca => `400`;
- email duplicado => `409`;
- resposta nunca expõe segredo.

Bloqueios:

- `MONGODB_URI` local tem de estar definido;
- password nunca pode ficar em texto claro;
- não confiar apenas na validação frontend.

### `BK-MF0-02` - Login/logout com cookie HttpOnly

Smoke:

- login válido devolve `200`;
- cookie `HttpOnly` é criado;
- `/api/auth/me` devolve utilizador seguro;
- logout limpa sessão/cookie.

Negativos:

- password errada => `401` sem cookie;
- `/me` sem cookie => `401`;
- frontend não guarda token em `localStorage` ou `sessionStorage`.

Bloqueios:

- definir `SESSION_SECRET` ou `JWT_SECRET` fora do código;
- confirmar comigo se a estratégia é JWT em cookie ou sessão opaca;
- não enumerar emails nas mensagens de erro.

### `BK-MF0-03` - Perfil personalizado

Smoke:

- utilizador autenticado cria perfil;
- consulta `/api/profile/me` devolve o próprio perfil.

Negativos:

- sem sessão => `401`;
- idade/tipo de pele inválidos => `400`;
- segundo perfil para o mesmo user => `409`;
- controller usa `req.user.id`, não `userId` enviado pelo cliente.

Fora de scope:

- fotografia facial;
- alergias/restrições médicas;
- diagnóstico médico;
- IA.

### `BK-MF0-04` - Editar perfil e fotografia controlada

Smoke:

- editar `nome` e `objetivos` de perfil existente;
- resposta `200`;
- ecrã mostra antes/depois.

Negativos:

- sem sessão => `401`;
- upload real sem consentimento/storage seguro => `403` ou `BLOCKER`;
- ficheiro inválido => `400`, se upload seguro estiver aprovado.

Regra crítica:

- este BK não implementa fotografia biométrica para análise facial;
- se não houver consentimento, storage seguro e controlo de acesso, usar apenas `profilePhotoUrl`/stub controlado.

### `BK-MF0-05` - Roles

Smoke:

- administrador altera role de utilizador para `consultor`;
- resposta `200`;
- novo utilizador continua com role `cliente`.

Negativos:

- cliente chama rota admin => `403`;
- pedido sem sessão => `401`;
- role fora de contrato, por exemplo `moderador`, => `400`;
- seed admin sem password hardcoded.

Bloqueios:

- sem `requireAuth`, rota admin não pode ser considerada segura;
- roles permitidas: `cliente`, `consultor`, `administrador`.

### `BK-MF0-06` - Preferências

Smoke:

- guardar duas marcas favoritas;
- consultar em `/api/preferences/me`;
- dados pertencem ao utilizador autenticado.

Negativos:

- sem sessão => `401`;
- strings vazias ou lista excessiva => `400`;
- `favoriteProductIds` antes de existir `Product` => erro controlado ou lista vazia documentada.

Fora de scope:

- produtos favoritos como fluxo final completo;
- recomendações automáticas;
- alergias/restrições médicas.

### `BK-MF0-07` - Produtos

Smoke:

- admin autenticado cria produto válido;
- resposta `201`;
- produto tem nome, descrição, ingredientes, tipo de pele indicado, imagem, preço e stock.

Negativos:

- cliente tenta criar produto => `403`;
- preço negativo => `400`;
- stock negativo => `400`;
- nome/descrição em falta => `400`.

Bloqueio obrigatório:

- sem `requireAuth` e `requireRole('administrador')`, não expor `POST /api/admin/products`.

### `BK-MF0-08` - Categorias

Smoke:

- seed cria categorias iniciais;
- admin associa categoria válida a produto;
- produto fica com `categoryIds`.

Negativos:

- categoria inexistente => `400`;
- cliente tenta gerir categoria => `403`;
- produto inexistente => `404`;
- seed não duplica categorias.

Handoff:

- `BK-MF1-01` deve reutilizar `categoryIds`, `priceCents`, `tipoDePeleIndicado` e `brandName` para pesquisa e filtragem.

---

## 9) Evidência obrigatória

Cada BK deve preencher:

- `pr`;
- `proof`;
- `neg`;
- `files`;
- `commands`;
- `screenshots`, quando houver UI;
- `notes`.

Para prioridades:

- `P0`: `unit + integration + e2e` e mínimo `3` negativos;
- `P1`: `unit/integration` e mínimo `2` negativos;
- `P2`: teste focal e mínimo `1` negativo.

Evidence nunca pode conter:

- passwords reais;
- tokens;
- cookies reais;
- URIs privadas;
- dados biométricos reais;
- dados pessoais não sanitizados.

---

## 10) Branches recomendadas

- `BK-MF0-01`: `feat/orelle-mf0-01-registo-bruna`
- `BK-MF0-02`: `feat/orelle-mf0-02-sessao-bruna`
- `BK-MF0-03`: `feat/orelle-mf0-03-perfil-bruna`
- `BK-MF0-04`: `feat/orelle-mf0-04-editar-perfil-izelicks`
- `BK-MF0-05`: `feat/orelle-mf0-05-roles-bruna`
- `BK-MF0-06`: `feat/orelle-mf0-06-preferencias-izelicks`
- `BK-MF0-07`: `feat/orelle-mf0-07-produtos-bruna`
- `BK-MF0-08`: `feat/orelle-mf0-08-categorias-bruna`

Como criar branch:

```bash
git checkout -b feat/orelle-mf0-01-registo-bruna
```

Isto cria e muda para a branch.
Depois de implementar, criar PR para `main` e preencher evidence.

Para criar um PR:

1. Push da branch local para remoto:

```bash
git push origin feat/orelle-mf0-01-registo-bruna
```

2. Ir ao GitHub, abrir PR da branch para `main`.
3. Preencher título, descrição e evidence.
4. Criar Pull Request.

---

## 11) Fecho da MF0

A `MF0` só está pronta quando:

- todos os BKs `BK-MF0-01..08` têm critérios de aceite cumpridos;
- smoke, negativos e evidence estão completos;
- não há drift entre matriz, backlog, guias e sprints;
- validação documental passa;
- sessão, roles, perfil e catálogo base estão coerentes;
- `BK-MF1-01` fica desbloqueado para pesquisa e filtragem.

Comando obrigatório:

```bash
bash scripts/validate-planificacao.sh
```

---

## 12) Se bloquearem mais de 45 minutos

Mandar-me:

1. 2-3 frases sobre o problema.
2. BK e path do guia.
3. heading/secção que causou dúvida.
4. erro/log relevante sem dados sensíveis.
5. o que já tentaram.
6. se o bloqueio é técnico, documental, de dependência ou de segurança.
