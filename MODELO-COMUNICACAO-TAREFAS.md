# Plano de Execucao - MF1 Orelle

Snapshot do backlog: `2026-04-18` (`orelle/docs/planificacao/backlogs/BACKLOG-MVP.md`).

Guias MF1 refinados/reauditados: `2026-05-31` (`orelle/docs/planificacao/guias-bk/MF1/`).

Data de conclusão: `05-Junho-2026 às 13:00`.

## 1) Contexto principal

A `MF1` da Orelle e a primeira macrofase de nucleo funcional real depois dos fundamentos da `MF0`.

Esta macro junta dois eixos de produto:

- catalogo publico, descoberta de produtos e reviews;
- upload facial, analise cosmetica, relatorio e historico pessoal.

Ao contrario da `MF0`, que cria a base de autenticacao, perfil, roles, produtos e categorias, a `MF1` transforma essa base em experiencia de cliente. A regra principal e reutilizar o que ja existe na `MF0`, sem criar estruturas paralelas nem contratos novos de autenticacao.

Stack/contrato tecnico previsto:

- Node.js + Express;
- React + Vite;
- MongoDB/Mongoose;
- sessao por cookie `HttpOnly`;
- frontend com `credentials: "include"`;
- backend em `localhost:3001`;
- separacao por camadas: `routes -> controller -> service -> model/provider`;
- evidence obrigatoria por BK.

---

## 2) Tutorial Git/GitHub por BK (VS Code ou Codespaces)

Esta e a rotina obrigatoria para cada BK da `MF1`. O objetivo e garantir que cada aluno trabalha sempre sobre codigo atualizado, numa branch isolada, com commits pequenos e PR para `main`.

Podes fazer isto no VS Code local ou no GitHub Codespaces. Em ambos os casos, usa o terminal integrado:

- VS Code: `Terminal > New Terminal`;
- Codespaces: abrir o repositorio (O REPOSITÓRIO DA PAP!) no GitHub, escolher `Code > Codespaces`, entrar no codespace e usar o terminal integrado.

### Passo 1 - Pull antes de trabalhar

Antes de tocar no codigo, confirmar que estas na `main` e que tens a versao mais recente.

```bash
git status
```

Se aparecerem alteracoes tuas por guardar, nao fazer pull ainda. Primeiro confirmar se sao para commit, se sao temporarias ou se pertencem a outro BK.

Depois, ir para a `main` e atualizar:

```bash
git switch main
git pull origin main
```

Regra: a branch do BK deve nascer depois deste pull. Assim evita-se trabalhar em cima de codigo antigo.

### Passo 2 - Escolher o BK e criar a branch

Escolher o BK que vai ser implementado e criar a branch correspondente:

- `BK-MF1-01`: `feat/orelle-mf1-01-catalogo-pesquisa-bruna`
- `BK-MF1-02`: `feat/orelle-mf1-02-detalhe-produto-izelicks`
- `BK-MF1-03`: `feat/orelle-mf1-03-reviews-aline`
- `BK-MF1-04`: `feat/orelle-mf1-04-produtos-relacionados-izelicks`
- `BK-MF1-05`: `feat/orelle-mf1-05-upload-facial-bruna`
- `BK-MF1-06`: `feat/orelle-mf1-06-analise-facial-izelicks`
- `BK-MF1-07`: `feat/orelle-mf1-07-relatorio-facial-bruna`
- `BK-MF1-08`: `feat/orelle-mf1-08-historico-pele-izelicks`

Exemplo para o `BK-MF1-01`:

```bash
git switch -c feat/orelle-mf1-01-catalogo-pesquisa-bruna
```

Confirmar que a branch ativa e a correta:

```bash
git branch --show-current
```

### Passo 3 - Implementar em ciclos pequenos

Antes de escrever codigo:

1. Ler o guia do BK em `docs/planificacao/guias-bk/MF1/`.
2. Confirmar dependencias e scope-out.
3. Adaptar paths dos guias para a estrutura real:
    - `server/src/...` => `apps/api/src/...`;
    - `client/src/...` => `apps/web/src/...`.
4. Implementar uma parte pequena.
5. Verificar o que mudou.

Comandos uteis:

```bash
git status
git diff
```

Regra: nao misturar varios BKs na mesma branch. Uma branch, um BK.

### Passo 4 - Testar antes de commit

Correr os testes relevantes ao tipo de alteracao.

Para backend/API:

```bash
npm run test:unit
npm run test:integration
npm run test:contracts
```

Se o BK tiver UI, validar tambem o fluxo no frontend e guardar evidence sanitizada, sem cookies, passwords, fotografias reais ou dados pessoais.

Se um teste falhar, corrigir antes de fazer commit. Se a falha for de infraestrutura externa, registar isso nas notas/evidence.

### Passo 5 - Fazer commits claros

Ver primeiro os ficheiros alterados:

```bash
git status
```

Adicionar apenas ficheiros do BK:

```bash
git add apps/api/src/caminho/do/ficheiro.js
git add apps/api/tests/ficheiro.test.js
```

Ou, se todas as alteracoes pertencerem mesmo ao BK:

```bash
git add .
```

Antes do commit, confirmar que nao entrou nada sensivel:

```bash
git diff --cached
```

Criar commit com mensagem curta e ligada ao BK:

```bash
git commit -m "feat(mf1-01): add catalog search filters"
```

Boas regras para commits:

- um commit deve representar uma unidade logica;
- nao juntar formatter, refactor grande e feature no mesmo commit sem necessidade;
- nao commitar `.env`, cookies, tokens, imagens reais ou evidence sensivel;
- se houver mais trabalho no mesmo BK, repetir ciclo: alterar, testar, `git add`, `git commit`.

### Passo 6 - Push da branch

Quando o BK estiver pronto localmente:

```bash
git push -u origin feat/orelle-mf1-01-catalogo-pesquisa-bruna
```

Nos pushes seguintes da mesma branch, basta:

```bash
git push
```

### Passo 7 - Abrir PR para `main`

No GitHub:

1. Abrir o repositorio.
2. Clicar em `Compare & pull request`, ou ir a `Pull requests > New pull request`.
3. Confirmar:
    - base: `main`;
    - compare: branch do BK.
4. Titulo recomendado:

```text
BK-MF1-01 - Pesquisa e filtragem de catalogo
```

5. Na descricao do PR, preencher:
    - BK implementado;
    - RF/RNF;
    - resumo tecnico;
    - ficheiros principais;
    - smoke test;
    - negativos;
    - comandos executados;
    - screenshots, se houver UI;
    - notas de seguranca/privacidade.
6. Criar Pull Request.

Regra: o PR e sempre para `main`, nunca diretamente para outra branch sem combinacao previa.

### Passo 8 - Rever checks e responder a feedback

Depois de abrir o PR:

1. Esperar pelos checks.
2. Se falharem, abrir logs e corrigir na mesma branch.
3. Fazer novo commit.
4. Fazer `git push`.

O PR atualiza automaticamente.

### Passo 9 - Depois do merge

Quando o PR for aprovado e merged:

```bash
git switch main
git pull origin main
```

Se a branch local ja nao for necessaria:

```bash
git branch -d feat/orelle-mf1-01-catalogo-pesquisa-bruna
```

No proximo BK, repetir o processo desde o Passo 1.

---

## 3) BKs da MF1

Owner stream P0 da MF1: `Bruna`

Equipa envolvida na MF1: `Bruna`, `Izelicks` e `Aline`

| BK          | Titulo                                                                       | Owner    | Apoio    | Pri | Esforco | Dependencias                          | RF   |
| ----------- | ---------------------------------------------------------------------------- | -------- | -------- | --- | ------- | ------------------------------------- | ---- |
| `BK-MF1-01` | Pesquisa e filtragem por categoria, preco, tipo de pele e marca              | Bruna    | Izelicks | P0  | M       | `BK-MF0-02`, `BK-MF0-07`, `BK-MF0-08` | RF09 |
| `BK-MF1-02` | Pagina de detalhes do produto                                                | Izelicks | Bruna    | P0  | M       | `BK-MF0-07`, `BK-MF1-01`              | RF10 |
| `BK-MF1-03` | Avaliar produtos com 1-5 estrelas e comentarios                              | Aline    | Izelicks | P1  | S       | `BK-MF0-02`, `BK-MF0-05`, `BK-MF1-02` | RF11 |
| `BK-MF1-04` | Produtos semelhantes e complementares                                        | Izelicks | Bruna    | P1  | S       | `BK-MF0-07`, `BK-MF0-08`, `BK-MF1-02` | RF12 |
| `BK-MF1-05` | Upload de fotografias do rosto frontal e perfil                              | Bruna    | Izelicks | P0  | M       | `BK-MF0-02`, `BK-MF0-03`              | RF13 |
| `BK-MF1-06` | Analise de fotos com IA para tipo de pele, acne, manchas, rugas e oleosidade | Izelicks | Bruna    | P0  | M       | `BK-MF1-05`                           | RF14 |
| `BK-MF1-07` | Relatorio personalizado com diagnostico cosmetico e sugestoes de rotina      | Bruna    | Izelicks | P0  | M       | `BK-MF0-02`, `BK-MF1-06`              | RF15 |
| `BK-MF1-08` | Historico pessoal de analises para comparacoes futuras                       | Izelicks | Bruna    | P1  | S       | `BK-MF0-02`, `BK-MF1-06`, `BK-MF1-07` | RF16 |

Todos estao planeados para `S03-S04`.

---

## 4) Regra principal obrigatoria

Antes de comecar qualquer BK:

1. Ler o guia completo do BK.
2. Confirmar `owner`, `apoio`, `prioridade`, `dependencias`, `rf_rnf` e `proximo_bk`.
3. Confirmar se o BK pertence ao eixo de catalogo ou ao eixo facial/IA.
4. Perceber o que entra e o que fica fora.
5. Conseguir explicar o plano de implementacao em 2-3 frases.
6. Confirmar comigo antes de implementar ou fechar o BK.

Nenhum BK pode ficar `DONE` sem:

- smoke;
- negativos;
- validacao tecnica;
- evidence `pr`, `proof`, `neg`;
- validacao de seguranca/privacidade quando houver dados de utilizador;
- validacao da planificacao sem drift.

---

## 5) Atencao obrigatoria a paths e estrutura

Ha uma divergencia documental herdada dos guias:

- alguns guias da `MF1` referem paths como `server/src/...` e `client/src/...`;
- a estrutura real criada na `MF0` neste repositorio e `apps/api/src/...` e `apps/web/src/...`.

Regra:

1. A estrutura real da app tem prioridade.
2. Adaptar `server/src/...` para `apps/api/src/...`.
3. Adaptar `client/src/...` para `apps/web/src/...`.
4. Nao criar duas apps paralelas.
5. Se um guia mencionar um ficheiro equivalente ja existente, editar o existente.
6. Se houver duvida de arquitetura, parar e perguntar.

Isto e blocker de arquitetura. Nao e detalhe cosmetico.

---

## 6) Dados, privacidade e variaveis de ambiente

Nunca meter segredos no repositorio.

Usar apenas `.env` local para:

- `MONGODB_URI`;
- `SESSION_SECRET` ou segredo equivalente da sessao;
- configuracoes locais de upload/storage, se existirem;
- chaves de provider IA apenas quando forem explicitamente aprovadas.

Na `MF1`, os riscos principais sao:

- dados pessoais;
- reviews criadas por utilizadores;
- fotografias faciais;
- consentimento;
- relatorios derivados de analise facial;
- historico pessoal.

Antes de qualquer commit:

```bash
git status
```

Confirmar:

- `.env` nao esta staged;
- nao ha passwords, tokens, URIs privadas ou cookies reais em commits;
- evidence esta sanitizada;
- screenshots/logs nao expoem dados sensiveis;
- fotografias reais de alunos/clientes nao entram no repositorio;
- paths internos de storage nao aparecem em respostas publicas.

---

## 7) Ordem de execucao

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
4. Confirmar `MF1 - Nucleo funcional I`.
5. Abrir `orelle/docs/planificacao/backlogs/MF-VIEWS.md`.
6. Confirmar sequencia:
    - `BK-MF1-01`;
    - `BK-MF1-02`;
    - `BK-MF1-03`;
    - `BK-MF1-04`;
    - `BK-MF1-05`;
    - `BK-MF1-06`;
    - `BK-MF1-07`;
    - `BK-MF1-08`.
7. Abrir `orelle/docs/planificacao/backlogs/BACKLOG-MVP.md`.
8. Confirmar estado, dependencias, owner, apoio, prioridade, esforco e RF.
9. Abrir o guia especifico do BK em `orelle/docs/planificacao/guias-bk/MF1/`.
10. Validar o scope-out antes de escrever codigo.
11. Implementar em ciclos curtos, mantendo PR pequeno.
12. Validar smoke + negativos + evidence.
13. Correr validacao documental:

```bash
bash scripts/validate-planificacao.sh
```

Nota operacional: a reauditoria da `MF1` registou um bloqueio externo no script de validacao por caminho inexistente para `../scripts/validate_planificacao_canonica.py`. Se esse erro ainda acontecer, registar como blocker de infraestrutura, nao como falha do BK.

---

## 8) SSOT minimo da MF1

Ler apenas as partes relevantes:

- `orelle/docs/RF.md`
    - `RF09..RF16`.

- `orelle/docs/RNF.md`
    - RNFs de sessao/autenticacao;
    - RNFs de consentimento;
    - RNFs de privacidade;
    - RNFs de IA, explicabilidade, nao discriminacao e nao treino externo quando houver analise facial.

- `orelle/docs/planificacao/PLANO-IMPLEMENTACAO-TOTAL.md`
    - `## Tabela MF0..MF8`;
    - `## Regras transversais por macro`;
    - `## Gates S4/S8/S12`.

- `orelle/docs/planificacao/backlogs/BACKLOG-MVP.md`
    - linhas `BK-MF1-01..BK-MF1-08`;
    - contrato pedagogico comum;
    - matriz minima de negativos por prioridade.

- `orelle/docs/planificacao/backlogs/MF-VIEWS.md`
    - `## MF1 - Nucleo funcional I`.

- `orelle/docs/planificacao/sprints/PLANO-SPRINTS.md`
    - `S03` e `S04`;
    - matriz minima de testes por prioridade;
    - gate em `S04`.

- `orelle/docs/planificacao/guias-bk/AUDITORIA-HIDRATACAO-MF1.md`
    - decisoes tecnicas confirmadas;
    - drift documental corrigido;
    - riscos restantes.

- Guias especificos:
    - `BK-MF1-01-permitir-pesquisa-e-filtragem-por-categoria-preco-tipo-de-pele-marca.md`;
    - `BK-MF1-02-pagina-de-detalhes-do-produto-com-descricao-completa-imagem-notas-de-utilizadores-e-recomendacoes.md`;
    - `BK-MF1-03-permitir-ao-cliente-avaliar-produtos-1-5-estrelas-e-deixar-comentarios.md`;
    - `BK-MF1-04-mostrar-produtos-semelhantes-e-complementares-quem-comprou-isto-tambem-comprou.md`;
    - `BK-MF1-05-permitir-upload-de-fotografias-do-rosto-frontal-e-perfil.md`;
    - `BK-MF1-06-o-sistema-deve-analisar-as-fotos-com-ia-para-detetar-tipo-de-pele-acne-manchas-rugas-e-oleosidade.md`;
    - `BK-MF1-07-gerar-um-relatorio-personalizado-com-diagnostico-e-sugestoes-de-rotina.md`;
    - `BK-MF1-08-a-analise-deve-ser-guardada-no-historico-pessoal-para-futuras-comparacoes.md`.

---

## 9) Validacao por BK

### `BK-MF1-01` - Pesquisa e filtragem de catalogo

Smoke:

- listar produtos publicos em `GET /api/catalog/products`;
- filtrar por categoria;
- filtrar por intervalo de preco;
- filtrar por tipo de pele;
- filtrar por marca.

Negativos:

- preco minimo negativo => `400`;
- preco maximo menor que preco minimo => `400`;
- categoria invalida => `400`;
- caracteres especiais em `brandName` tratados como texto, nao como regex insegura.

Bloqueios:

- reutilizar `Product`, `Category`, `categoryIds`, `priceCents`, `skinTypes` e `brandName`;
- nao criar recomendacao personalizada por IA;
- nao devolver campos administrativos.

### `BK-MF1-02` - Detalhe de produto

Smoke:

- abrir detalhe de produto existente;
- resposta `200`;
- dados publicos incluem descricao completa, imagem, ingredientes, preco e stock;
- `reviewSummary` existe sem inventar reviews;
- `relatedProducts` fica preparado para `BK-MF1-04`.

Negativos:

- `productId` invalido => `400`;
- produto inexistente => `404`;
- resposta nao expoe `createdBy` nem campos administrativos.

Bloqueios:

- nao criar formulario de avaliacao neste BK;
- nao inventar avaliacoes;
- nao implementar checkout.

### `BK-MF1-03` - Reviews de produtos

Smoke:

- cliente autenticado cria review com rating `1..5`;
- comentario fica associado ao utilizador autenticado via `req.user.id`;
- listar reviews publicas do produto;
- media/contagem ficam consistentes.

Negativos:

- sem sessao => `401`;
- role que nao seja `cliente` tenta criar review => `403`;
- rating fora de `1..5` => `400`;
- segunda review do mesmo utilizador para o mesmo produto => `409`;
- `userId` vindo do frontend e ignorado/rejeitado.

Bloqueios:

- criar review exige `requireAuth` e `requireRole(ROLES.CLIENTE)`;
- nao expor dados internos do utilizador;
- moderacao fica para `BK-MF4-02`.

### `BK-MF1-04` - Produtos semelhantes e complementares

Smoke:

- chamar `GET /api/catalog/products/:productId/related`;
- devolver produtos relacionados por categoria, tipo de pele, marca e stock;
- excluir o produto atual da lista;
- devolver lista vazia com `200` se nao houver relacionados.

Negativos:

- `productId` invalido => `400`;
- produto inexistente => `404`;
- produto sem dados suficientes nao deve causar erro inesperado.

Bloqueios:

- nao usar historico de compras inexistente;
- nao usar dados biometricos;
- nao adicionar produtos ao carrinho automaticamente;
- explicar que a regra e deterministica e de catalogo.

### `BK-MF1-05` - Upload facial frontal e perfil

Smoke:

- cliente autenticado aceita consentimento facial minimo;
- upload com exatamente fotografia `frontal` e `perfil`;
- metadados ficam associados ao utilizador autenticado;
- ficheiros ficam fora de pasta publica;
- resposta nao devolve path interno nem `storageKey`.

Negativos:

- sem sessao => `401`;
- sem consentimento ativo => `403`;
- falta `frontal` ou `perfil` => `400`;
- tipo de ficheiro invalido => `400`;
- tamanho excessivo => `400`;
- erro posterior ao upload limpa ficheiros recebidos.

Bloqueios:

- nao guardar fotografia facial antes de confirmar consentimento;
- nao usar fotografias reais na evidence;
- nao analisar fotos neste BK;
- encriptacao, eliminacao/anonymizacao e auditoria ficam para BKs posteriores, mas o design nao pode bloquear esses fluxos.

### `BK-MF1-06` - Analise facial com IA/provider isolado

Smoke:

- cliente autenticado com consentimento e fotos validas chama `POST /api/face-analyses`;
- provider isolado devolve tipo de pele, acne, manchas, rugas, oleosidade, confianca e limitacoes;
- resultado fica associado ao utilizador autenticado;
- frontend mostra resultado sem prometer diagnostico medico.

Negativos:

- sem sessao => `401`;
- sem consentimento ativo => `403`;
- sem fotografias validas => `400` ou `409`, conforme contrato implementado;
- provider falha => erro controlado sem expor paths internos;
- tentativa de enviar `storageKey`/paths pelo frontend e ignorada/rejeitada.

Bloqueios:

- provider nao fica dentro do controller;
- nao recomendar produtos neste BK;
- nao enviar imagens para treino externo;
- nao apresentar conclusoes como diagnostico medico definitivo.

### `BK-MF1-07` - Relatorio personalizado

Smoke:

- cliente autenticado gera relatorio a partir da ultima analise concluida;
- resposta contem diagnostico cosmetico limitado;
- resposta contem rotina de manha/noite;
- resposta contem fontes, confianca e limitacoes;
- relatorio fica persistido.

Negativos:

- sem sessao => `401`;
- sem analise concluida => `409` ou erro controlado equivalente;
- resposta nao cria encomenda, carrinho ou compra automatica;
- resposta nao recomenda produtos personalizados ainda.

Bloqueios:

- nao exportar PDF;
- nao apresentar diagnostico medico definitivo;
- nao receber `analysisId` arbitrario do frontend se isso abrir acesso cruzado;
- recomendacao personalizada de produto fica para `BK-MF2-02`.

### `BK-MF1-08` - Historico pessoal de analises e relatorios

Smoke:

- cliente autenticado consulta `GET /api/me/skin-history`;
- resposta junta analises e relatorios do proprio utilizador;
- lista vem ordenada por data;
- resposta nao devolve paths internos;
- frontend tem estados `loading`, `error`, `empty` e `success`.

Negativos:

- sem sessao => `401`;
- tentativa de usar `?userId=outro` nao altera ownership;
- utilizador A nao consegue ler historico do utilizador B.

Bloqueios:

- nao criar graficos neste BK;
- nao comparar imagens antes/depois neste BK;
- nao devolver `storageKey`, paths, IDs de consentimento ou detalhes de ficheiro.

---

## 10) Evidencia obrigatoria

Cada BK deve preencher:

- `pr`;
- `proof`;
- `neg`;
- `files`;
- `commands`;
- `screenshots`, quando houver UI;
- `notes`.

Para prioridades:

- `P0`: `unit + integration + e2e` e minimo `3` negativos;
- `P1`: `unit/integration` e minimo `2` negativos;
- `P2`: teste focal e minimo `1` negativo.

Evidence nunca pode conter:

- passwords reais;
- tokens;
- cookies reais;
- URIs privadas;
- dados biometricos reais;
- fotografias reais de rosto;
- dados pessoais nao sanitizados;
- paths internos de ficheiros;
- outputs completos de provider com informacao sensivel.

---

## 11) Decisoes tecnicas confirmadas para MF1

- Catalogo publico nao e recomendacao personalizada.
- Produtos relacionados em `BK-MF1-04` sao deterministas por catalogo enquanto nao existe historico de compras.
- Reviews sao conteudo de cliente e exigem role `cliente`.
- Sessao autenticada usa cookie `HttpOnly`, nao `Authorization: Bearer` no frontend.
- Frontend deve usar `credentials: "include"`.
- Upload facial exige consentimento antes de guardar/processar dados.
- Fotografias faciais nao podem ficar em pasta publica.
- A API nao devolve `storageKey` nem paths internos.
- Analise facial e cosmetica, nao medica.
- Provider de IA deve ficar isolado.
- Relatorio nao recomenda produtos personalizados nem cria compra.
- Historico usa ownership por sessao e rota `/api/me/skin-history`.

---

## 12) Fecho da MF1

A `MF1` so esta pronta quando:

- todos os BKs `BK-MF1-01..08` tem criterios de aceite cumpridos;
- smoke, negativos e evidence estao completos;
- nao ha drift entre matriz, backlog, guias e sprints;
- validacao documental passa ou o blocker externo fica registado;
- catalogo publico, detalhe, reviews e relacionados funcionam sem expor dados internos;
- upload facial, analise, relatorio e historico preservam consentimento, ownership e minimizacao;
- `BK-MF2-01` fica desbloqueado para graficos de evolucao;
- `BK-MF2-02` fica desbloqueado para recomendacoes personalizadas.

Comando obrigatorio:

```bash
bash scripts/validate-planificacao.sh
```

---

## 13) Se bloquearem mais de 45 minutos

Mandar-me:

1. 2-3 frases sobre o problema.
2. BK e path do guia.
3. Heading/seccao que causou duvida.
4. Erro/log relevante sem dados sensiveis.
5. O que ja tentaram.
6. Se o bloqueio e tecnico, documental, de dependencia, privacidade ou seguranca.
