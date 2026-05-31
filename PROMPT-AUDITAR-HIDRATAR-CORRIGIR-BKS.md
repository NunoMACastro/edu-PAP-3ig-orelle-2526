# Orélle - Prompt para auditoria, hidratação e correção de guias BK

Estás no repositório Orélle.

Trabalha como arquiteto de software sénior, professor de programação e revisor de planificação PAP.

O objetivo desta prompt é auditar, hidratar e corrigir guias BK de uma macrofase da Orélle para que fiquem completos, pedagógicos, tecnicamente executáveis e coerentes com os documentos canónicos do projeto.

---

## Variáveis desta execução

```md
MF_ALVO: MF1
MODO: auditar_apenas
```

Valores possíveis para `MODO`:

- `auditar_apenas`: cria/atualiza relatório, mas não edita BKs.
- `hidratar_corrigir`: audita, corrige e reescreve BKs incompletos.
- `corrigir_apenas`: usa relatório existente e corrige BKs já identificados como `PARCIAL` ou `CRÍTICO`.

Valores esperados para `MF_ALVO`:

- `MF0` a `MF8`, conforme `docs/planificacao/backlogs/MATRIZ-CANONICA-BK.md`.
- Se a macrofase recebida não existir na matriz, para e regista `TODO (BLOCKER)`.

---

## Regra crítica sobre código existente

O repositório pode estar em estado `sem_codigo`, `codigo_parcial` ou `codigo_existente`.

Nesta execução:

- NÃO uses código existente como contrato técnico final se ele contradisser documentos canónicos ou BKs anteriores já corrigidos.
- NÃO copies padrões, imports, DTOs, services, schemas, componentes ou rotas como se estivessem corretos sem os validar contra a documentação.
- Podes usar código existente apenas para perceber estrutura provável de pastas, convenções já adotadas e nomes realmente implementados.
- A fonte de verdade funcional e documental são os documentos canónicos e os BKs anteriores já corrigidos.
- Se precisares de mencionar código existente no relatório, diz apenas que foi tratado como implementação inicial a validar.
- Nos BKs destinados aos alunos, não escrevas frases sobre scaffold, auditoria, hidratação, código não corrigido ou conversa interna.

Estrutura técnica base atualmente recomendada pela documentação da Orélle:

- Backend: Node.js + Express, ES Modules.
- Frontend: React + Vite.
- Estilos: Tailwind CSS, quando a fase envolver UI.
- Base de dados: MongoDB/Mongoose.
- Upload: Multer ou abordagem equivalente segura.
- IA: provider isolado, com Azure Face API, TensorFlow/FastAPI ou stub funcional quando a documentação permitir.
- Pagamentos: `Stripe` real controlado no MVP; `PayPal/MBWay` apenas em stub funcional, salvo decisão canónica posterior.

Se algum BK anterior já estabeleceu uma estrutura mais concreta, essa estrutura prevalece desde que não contrarie os documentos canónicos.

---

## Objetivo

Melhorar todos os guias BK da `MF_ALVO` para que fiquem tutoriais guiados, autocontidos, pedagógicos e tecnicamente coerentes para alunos do 12.º ano.

Cada BK deve permitir ao aluno implementar aquele requisito sem depender de adivinhação, pseudo-código, helpers por criar, snippets incompletos ou explicações fora do próprio BK.

No fim, os BKs da macrofase devem formar uma sequência coerente da aplicação Orélle, sem:

- imports partidos;
- endpoints contraditórios;
- schemas incompatíveis;
- regras de ownership/autorização incompletas;
- tratamento inseguro de dados biométricos;
- fluxos de IA sem fontes, consentimento ou fallback honesto;
- código solto;
- linguagem interna;
- funcionalidades prometidas mas não implementadas.

---

## Documentos obrigatórios a consultar antes de editar

Lê obrigatoriamente:

- `README.md`
- `docs/RF.md`
- `docs/RNF.md`
- `docs/planificacao/README.md`
- `docs/planificacao/CORE-DUAL-CONTRATO.md`
- `docs/planificacao/PLANO-IMPLEMENTACAO-TOTAL.md`
- `docs/planificacao/backlogs/BACKLOG-MVP.md`
- `docs/planificacao/backlogs/MATRIZ-CANONICA-BK.md`
- `docs/planificacao/backlogs/CONTRATO-CAMPOS-BK.md`
- `docs/planificacao/backlogs/MF-VIEWS.md`
- `docs/planificacao/backlogs/ANEXO-RF-PARA-BKS.md`
- `docs/planificacao/backlogs/ANEXO-RNF-PARA-BKS.md`
- `docs/planificacao/backlogs/ANEXO-CORE-DUAL-BK.md`
- `docs/planificacao/sprints/PLANO-SPRINTS.md`
- `docs/planificacao/sprints/SCORECARD-SPRINTS.md`
- `docs/planificacao/guias-bk/_TEMPLATE-BK.md`
- `docs/planificacao/guias-bk/AUDITORIA-HIDRATACAO-MF0.md`, quando existir, como referência de relatório.
- todos os BKs em `docs/planificacao/guias-bk/MF0/`
- todos os BKs da `MF_ALVO`
- todos os BKs das macrofases anteriores à `MF_ALVO`
- BKs posteriores que dependam de BKs da `MF_ALVO`

Usa os BKs da `MF0` já hidratados como referência mínima de qualidade, densidade pedagógica, explicação, estrutura linear e completude técnica.

Se algum documento obrigatório não existir, não inventes. Regista `TODO (BLOCKER)` no relatório com o caminho em falta e o impacto.

---

## Regra de fundamentação documental por BK

Antes de escrever teoria, arquitetura ou código de cada BK, consulta a documentação canónica relevante para o domínio desse BK.

Para cada BK, consulta no mínimo:

- RF/RNF associados no header do BK.
- BKs declarados em `dependencias`.
- BK anterior e BK seguinte na sequência.
- BKs posteriores que dependem deste BK.
- `MATRIZ-CANONICA-BK.md`.
- `BACKLOG-MVP.md`.
- `CONTRATO-CAMPOS-BK.md`.
- `MF-VIEWS.md`.
- `ANEXO-RF-PARA-BKS.md` ou `ANEXO-RNF-PARA-BKS.md`, conforme aplicável.
- `ANEXO-CORE-DUAL-BK.md`.
- `CORE-DUAL-CONTRATO.md`.
- `PLANO-SPRINTS.md`.

A teoria, nomes de entidades, endpoints, permissões, fluxos, campos e validações devem nascer destas fontes.

Usa estas marcas quando necessário:

- `CANONICO`: decisão que vem diretamente dos documentos oficiais.
- `DERIVADO`: decisão técnica mínima necessária para implementar sem contrariar a documentação.
- `TODO (BLOCKER)`: falta informação indispensável para implementar com segurança.

Não marques todas as frases com `CANONICO` ou `DERIVADO`. Usa estas marcas em metadados, decisões técnicas, notas de escopo ou quando uma decisão possa ser ambígua.

---

## Regra de formato obrigatório: MF0 é contrato mínimo

Os BKs da `MF_ALVO` devem seguir o padrão estrutural dos BKs da `MF0` já hidratados.

É proibido trocar a estrutura por um resumo genérico ou por uma checklist superficial.

Cada passo de implementação deve seguir exatamente esta estrutura, nesta ordem:

```md
### Passo N - Nome claro

1. Explicação simples do objetivo.
2. Ficheiros envolvidos.
    - CRIAR: `caminho`
    - EDITAR: `caminho`
    - REVER: `caminho`
    - LOCALIZAÇÃO: ficheiro completo, função completa, classe completa ou zona exata.
3. O que fazer.
4. Código completo, correto e integrado.
5. Explicação do código.
6. Como validar este passo.
7. Erros comuns ou cenário negativo.
```

Não substituas esta estrutura por tabelas, mapas pedagógicos, resumos globais, secções alternativas ou qualquer layout inventado.

Se o BK já tiver uma estrutura herdada do template antigo, reescreve a zona operacional para o formato acima, mantendo os metadados canónicos.

---

## Separação obrigatória entre relatório e BKs

O relatório de auditoria pode conter linguagem interna de trabalho.

Os BKs dos alunos NÃO podem conter linguagem interna.

Nos BKs, é proibido escrever expressões como:

- hidratação;
- pós-auditoria;
- scaffold;
- scaffold real;
- scaffold parcial;
- roteiro genérico;
- conversa interna;
- este guia deixa de ser;
- código ainda não corrigido;
- snippet;
- exemplo simplificado;
- implementar depois;
- quando aplicável;
- helpers chamados;
- substituir mocks;
- pseudo-código;
- solução parcial;
- código ilustrativo;
- mock temporário, quando usado como substituto da implementação final do BK.

Os BKs devem falar diretamente com o aluno, como tutorial:

- "Neste BK vais implementar..."
- "Este ficheiro guarda..."
- "Este service valida..."
- "Este erro evita..."

---

## Regras fundamentais

1. Não alteres IDs BK, RF, RNF, owners, prioridades, esforço, sprints, dependências, macrofase ou escopo sem evidência documental clara.
2. Não inventes requisitos, entidades, endpoints, campos, roles, permissões ou regras de negócio.
3. Se algo for inferido, marca como `DERIVADO`.
4. Se vier dos documentos oficiais, marca como `CANONICO`.
5. Se faltar contexto indispensável, usa `TODO (BLOCKER)` e explica o bloqueio no relatório.
6. Não uses pseudo-código como solução final.
7. Não deixes snippets soltos.
8. Todo o código escrito no BK deve ser código final previsto para aquele BK.
9. Todo o código deve encaixar com BKs anteriores e preparar BKs seguintes.
10. Preserva contratos definidos em fases anteriores.
11. Escreve em português de Portugal.
12. O texto deve ser adequado a alunos do 12.º ano.
13. Explica teoria antes da prática quando o conceito for novo.
14. Depois de cada bloco de código, explica o que faz, por que existe e que erro evita.
15. Trata segurança, privacidade e consentimento como requisitos de produto, não como extras.
16. Não uses tokens no `localStorage`.
17. Não exponhas `passwordHash`, tokens, caminhos internos de ficheiro, chaves de API, dados biométricos ou detalhes sensíveis em respostas frontend/API.

---

## Regra de conceitos teóricos completos

A secção `Conceitos teóricos` deve explicar mais do que o domínio da aplicação.

Para cada BK, inclui conceitos das categorias aplicáveis:

1. Conceitos de domínio da Orélle.
   Ex.: cliente, consultor, administrador, perfil cosmético, tipo de pele, objetivos, preferências, produto, categoria, stock, análise facial, fotografia frontal/perfil, relatório, recomendação, rotina, simulação antes/depois, carrinho, encomenda, consentimento, pedido de eliminação/anonymização.

2. Conceitos backend.
   Ex.: route, controller, service, middleware, DTO, validator, schema Mongoose, ObjectId, upload middleware, tratamento centralizado de erros, HTTP status.

3. Conceitos frontend.
   Ex.: componente React, `useState`, `useEffect`, formulário, estados `loading`, `error`, `empty`, `success`, cliente API, `fetch`, `credentials: 'include'`, proteção de rotas por sessão.

4. Conceitos de segurança e privacidade.
   Ex.: sessão autenticada, cookie HttpOnly, role-based access control, ownership, validação no backend, consentimento explícito, minimização de dados, encriptação de fotografias/relatórios, auditoria de acessos biométricos, não confiar em IDs enviados pelo frontend.

5. Conceitos de IA.
   Ex.: provider isolado, input permitido, fontes da análise, guardrails, explicabilidade, não discriminação, bloqueio sem consentimento/fotografia válida, fallback honesto, separação entre recomendação e ação automática.

6. Conceitos de comércio.
   Ex.: catálogo, preço, stock, carrinho, checkout, encomenda, estado da encomenda, pagamento Stripe, stub PayPal/MBWay, idempotência mínima, atualização de stock após compra.

Cada conceito importante deve responder:

- o que é;
- de onde vem no fluxo;
- para onde vai;
- para que serve;
- que erro evita.

---

## Regra de código completo

Um BK só pode incluir código se esse código estiver completo para o contexto do BK.

É proibido deixar:

- funções chamadas mas não implementadas;
- services que dependem de helpers inexistentes;
- imports sem origem clara;
- DTOs sem validação;
- controllers sem service correspondente;
- schemas sem relação com o service;
- frontend com `payload: unknown`;
- testes com `as any` como solução final;
- mocks como substituto da implementação;
- comentários tipo "implementar depois";
- integrações externas reais sem tratamento de configuração, erro e fallback;
- código de IA que inventa diagnóstico sem fonte, sem consentimento ou sem limites explícitos.

Se o código depende de algo de BK anterior:

- indica explicitamente qual BK criou esse ficheiro/função;
- não voltes a reimplementar tudo se isso quebrar a sequência;
- mostra apenas a integração necessária neste BK.

Se o código é novo neste BK:

- mostra o ficheiro completo ou a versão completa da função/classe/componente a substituir;
- indica caminho completo;
- indica localização exata;
- explica a ligação com os ficheiros anteriores.

---

## Regra de legibilidade do código

O código nos BKs deve estar formatado como código real de projeto.

É proibido:

- comprimir classes, services ou funções inteiras numa só linha;
- omitir quebras de linha para poupar espaço;
- escrever código difícil de copiar, ler ou explicar;
- juntar múltiplos ficheiros sem separação clara;
- misturar frontend, backend e testes no mesmo bloco sem título e caminho.

Cada bloco deve ter:

- comentário inicial com o caminho do ficheiro, quando for útil ao aluno;
- imports no topo;
- código formatado;
- nomes claros;
- separação visual entre responsabilidades.

---

## Contrato de executabilidade da aplicação

O objetivo não é apenas produzir BKs bem escritos. O objetivo é que, seguindo os BKs por ordem, a aplicação Orélle possa funcionar de forma real e coerente.

Todo o código apresentado nos BKs deve ser:

- funcional;
- integrado com a arquitetura global da app;
- coerente com os BKs anteriores;
- preparatório para os BKs seguintes;
- compatível com a stack definida;
- sem imports partidos;
- sem nomes de ficheiros contraditórios;
- sem endpoints duplicados ou inconsistentes;
- sem DTOs, schemas, services ou components que não encaixem entre si;
- sem funções chamadas mas não implementadas;
- sem código meramente ilustrativo apresentado como solução.

Cada BK deve ser tratado como uma entrega incremental da aplicação final.

Depois de aplicar os BKs por ordem, o resultado esperado é uma app que compila, arranca e executa os fluxos documentados.

---

## Regra de integração entre BKs

Antes de escrever código num BK, confirma:

1. Que ficheiros, funções, schemas, DTOs, services e endpoints já foram criados em BKs anteriores.
2. Que nomes estás a reutilizar exatamente com a mesma grafia.
3. Que não estás a criar outro endpoint para a mesma responsabilidade.
4. Que não estás a duplicar modelos ou conceitos já existentes.
5. Que o próximo BK conseguirá importar e usar o que este BK cria.
6. Que não estás a quebrar comportamento definido em `MF0` ou macrofases anteriores.
7. Que o BK respeita a classificação `Core/Reforco` do header e, quando aplicável, a classe `CORE-IA`, `CORE-COM`, `CORE-HIBRIDO` ou `SUPORTE` do anexo core dual.

Se precisares de alterar uma decisão técnica anterior para a app funcionar:

- não alteres silenciosamente;
- regista como drift ou blocker;
- explica a razão;
- atualiza o BK afetado apenas se o escopo permitir.

---

## Gate de app funcional

Antes de considerar um BK como `OK`, responde explicitamente:

- Este código compila no contexto da app final prevista?
- Os imports apontam para ficheiros existentes ou criados em BKs anteriores?
- O controller chama um service existente?
- O service usa schemas/models existentes?
- O frontend chama endpoints reais definidos no backend?
- Os tipos do frontend correspondem ao payload e resposta do backend?
- O fluxo funciona com autenticação real quando o requisito exige utilizador autenticado?
- O fluxo aplica role/ownership no backend, não apenas no frontend?
- O fluxo falha de forma controlada nos negativos?
- Este BK deixa a app num estado mais funcional do que antes?
- O próximo BK consegue construir sobre este sem reescrever tudo?

Se alguma resposta for "não" ou "não sei", o BK não pode ser marcado como `OK`.

---

## Regra de adequação semântica

Antes de escrever cada BK, identifica o domínio real do requisito.

Exemplos da Orélle:

- Pesquisa de produtos não é recomendação personalizada por IA.
- Detalhe do produto não é checkout.
- Avaliação de produto não é moderação administrativa.
- Produtos semelhantes por catálogo não são diagnóstico facial.
- Upload de fotografias não é análise facial.
- Análise facial não é recomendação automática de compra.
- Relatório personalizado não é histórico completo.
- Histórico de análise não é evolução visual com gráficos.
- Simulação de maquilhagem não é comparação após 30 dias de uso.
- Carrinho não é encomenda paga.
- Pagamento Stripe real não é o mesmo que stub PayPal/MBWay.
- Consentimento RGPD não é apenas checkbox visual.
- Eliminação/anonymização de dados biométricos não é apagar só o ficheiro da imagem.
- Auditoria de acessos biométricos não é log genérico de servidor.
- Explicabilidade da IA não é justificar com frases vagas.
- Não discriminação não é uma promessa textual sem evidência/testes.

O código, nomes de ficheiros, DTOs, schemas, endpoints, componentes e exemplos devem refletir o domínio real do BK.

---

## Proibição de domínio inventado

É proibido explicar ou implementar um conceito de domínio de forma genérica quando a Orélle já o define na documentação.

Regras específicas:

- Perfil cosmético vem de `RF03` e deve respeitar nome, idade, tipo de pele, género e objetivos.
- Preferências de produtos/marcas vêm de `RF06` e não substituem alergias/restrições médicas de `RF40`.
- Produto vem de `RF07` e deve preservar nome, descrição, ingredientes, tipo de pele indicado, imagem, preço e stock.
- Categorias vêm de `RF08` e devem servir catálogo/pesquisa.
- Pesquisa e filtragem de produtos vêm de `RF09`; não inventes ranking IA se não estiver no BK.
- Detalhe de produto vem de `RF10`; notas e recomendações devem ligar com avaliações/recomendações reais quando existirem.
- Avaliações vêm de `RF11`; clientes avaliam 1 a 5 estrelas e deixam comentários.
- Produtos semelhantes/complementares vêm de `RF12`; não prometas collaborative filtering avançado se não estiver previsto.
- Upload de fotografias vem de `RF13`; frontal e perfil são o contrato mínimo.
- Análise facial vem de `RF14`; deve tratar tipo de pele, acne, manchas, rugas e oleosidade.
- Relatório personalizado vem de `RF15`; deve conter diagnóstico e sugestões de rotina.
- Histórico pessoal vem de `RF16`; pertence ao utilizador autenticado.
- Evolução temporal vem de `RF17`; deve construir sobre histórico.
- Recomendação personalizada vem de `RF18` e depende de análise/histórico.
- Motivo da recomendação vem de `RF19` e deve ser explícito.
- Feedback "útil"/"não relevante" vem de `RF20`; não prometas treino real de modelo se a fase só registar feedback.
- Rotinas manhã/noite vêm de `RF21`.
- Revisão por consultores vem de `RF22` e exige role/permissão.
- Simulação virtual vem de `RF23`; visualização antes/depois vem de `RF24`.
- Comparação após 30 dias vem de `RF25`; não confundas com simulação imediata.
- Carrinho, encomenda, pagamento, histórico e recompra vêm de `RF26`, `RF27`, `RF28` e `RF30`.
- Administração, stock, notificações e exportações vêm de `RF31` a `RF37`.
- Alergias/restrições médicas leves vêm de `RF40` e devem bloquear recomendações incompatíveis.
- Pedidos de eliminação/anonymização vêm de `RF41`.
- Auditoria de acessos biométricos vem de `RF44`.
- RNF de segurança, privacidade, performance, acessibilidade, compatibilidade e IA ética devem ser tratados como critérios de qualidade verificáveis.

Se a documentação não definir uma regra de negócio, não a apresentes como facto.

---

## Regras específicas da Orélle

- Dados biométricos são sensíveis: fotografias e relatórios devem ser protegidos, minimizados e associados ao utilizador correto.
- Consentimento explícito é obrigatório antes de processar imagem facial.
- O frontend não decide ownership; o backend deve usar a sessão autenticada.
- Cliente, consultor e administrador têm responsabilidades diferentes.
- Consultores/admins só acedem a dados sensíveis quando o requisito o permite e com auditoria quando aplicável.
- Recomendação personalizada deve explicar motivo e respeitar alergias, ingredientes a evitar e restrições médicas leves quando esses dados existirem.
- IA não deve inventar diagnóstico, eficácia clínica ou garantia de resultado.
- IA deve ter fallback honesto quando não consegue analisar, quando faltam fotografias válidas ou quando não existe consentimento.
- Produtos recomendados não devem ser adicionados automaticamente ao carrinho sem ação do utilizador.
- Checkout deve separar carrinho, encomenda e pagamento.
- `Stripe` pode ser real em modo controlado; `PayPal/MBWay` ficam em stub funcional salvo decisão canónica.
- Não prometas uso de imagens para treino externo sem consentimento explícito.
- Performance de análise, tempos de carregamento e compatibilidade devem ser mensuráveis quando o BK/RNF os exigir.
- `CORE-IA`, `CORE-COM` e `CORE-HIBRIDO` devem ter evidência técnica e evidência de negócio.

---

## Auditoria obrigatória

Cria ou atualiza:

```md
docs/planificacao/guias-bk/AUDITORIA-HIDRATACAO-{MF_ALVO}.md
```

Classifica cada BK como:

- `OK`: pronto para aluno seguir.
- `PARCIAL`: tem estrutura, mas falta completude.
- `CRÍTICO`: o aluno não conseguiria implementar com segurança seguindo o guia.

Um BK só é `OK` se cumprir TODOS:

1. Objetivo claro.
2. Importância funcional e pedagógica.
3. Scope-in.
4. Scope-out.
5. Pré-requisitos concretos.
6. Dependências BK/RF/RNF.
7. Conceitos teóricos necessários.
8. Ficheiros a criar/editar/rever.
9. Localização exata das alterações.
10. Código completo e integrado.
11. Código comentado de forma didática quando a lógica não for óbvia.
12. Explicação após cada bloco de código.
13. Validação por passo.
14. Cenários negativos.
15. Expected results com HTTP status, mensagens ou comportamento.
16. Evidence para PR/defesa.
17. Handoff para próximo BK.
18. Coerência com BKs anteriores.
19. Preparação para BKs seguintes.
20. Sem linguagem interna.
21. Sem snippets soltos.
22. Sem pseudo-código.
23. Sem helpers por implementar.
24. Sem `payload: unknown` no frontend.
25. Sem `as any` em código apresentado como solução final.
26. Respeito por segurança, privacidade e consentimento quando há dados sensíveis.
27. Um BK não é `OK` se tiver código correto mas não explicado de forma suficiente para um aluno perceber por que está a escrevê-lo.

Para cada BK `PARCIAL` ou `CRÍTICO`, o relatório deve indicar:

- ficheiro;
- estado;
- problema principal;
- exemplos concretos;
- o que falta completar;
- risco pedagógico;
- risco técnico;
- risco de segurança/privacidade, quando aplicável;
- dependências a reler;
- prioridade de correção.

O relatório deve terminar com ordem recomendada de correção.

---

## Hidratação/correção dos BKs

Se `MODO` for `hidratar_corrigir`, audita primeiro e depois edita apenas os BKs da `MF_ALVO` marcados como `PARCIAL` ou `CRÍTICO`.

Se `MODO` for `corrigir_apenas`, usa o relatório existente como ponto de partida, corrige apenas os BKs da `MF_ALVO` já identificados como `PARCIAL` ou `CRÍTICO`, e atualiza o relatório com contagem antes/depois, BKs editados e validações executadas.

Para cada BK corrigido, inclui:

- objetivo;
- importância;
- scope-in;
- scope-out;
- estado antes;
- estado depois;
- pré-requisitos;
- glossário;
- conceitos teóricos;
- arquitetura do BK;
- ficheiros a criar/editar/rever;
- passos lineares;
- código completo;
- explicação do código;
- validação por passo;
- erros comuns;
- cenários negativos;
- expected results;
- critérios de aceite;
- validação final;
- evidence;
- handoff;
- changelog.

Cada passo deve seguir exatamente a estrutura definida em `Regra de formato obrigatório: MF0 é contrato mínimo`.

No fim do BK só podem ficar:

- Expected results;
- Critérios de aceite;
- Validação final;
- Evidence para PR/defesa;
- Handoff;
- Changelog.

Não deixes código novo solto no fim do BK.

---

## Regra de explicação e documentação didática do código

Todo o código incluído nos BKs deve ser documentado e explicado de forma didática, completa e explícita, adequada a alunos do 12.º ano.

A explicação fora do código e os comentários dentro do código são ambos importantes. Um não substitui o outro.

Cada ficheiro novo deve incluir:

- uma breve explicação antes do bloco de código;
- comentários no próprio código quando a lógica não for óbvia;
- nomes de funções, variáveis, DTOs, services e componentes claros;
- uma explicação depois do bloco de código.

Depois de cada bloco de código, a explicação deve cobrir:

1. O que o código faz.
2. Porque existe neste BK.
3. Que ficheiros ou BKs anteriores usa.
4. Que ficheiros ou BKs seguintes prepara.
5. Que dados entram.
6. Que dados saem.
7. Que validações acontecem.
8. Que regra de segurança, ownership, role ou privacidade aplica.
9. Que erro comum evita.
10. Como testar se ficou correto.

Não basta dizer "este código cria o service" ou "este componente mostra a página".

Quando houver funções, métodos, classes, DTOs, schemas, services, controllers ou componentes importantes, explica:

- responsabilidade;
- parâmetros;
- retorno;
- efeitos secundários;
- erros lançados;
- relação com a app final.

No código backend, documenta explicitamente:

- DTOs/validators;
- schemas/models;
- services;
- controllers;
- middleware/guards;
- providers de IA;
- regras de role/ownership;
- validações de upload;
- exceções e HTTP status esperados.

No código frontend, documenta explicitamente:

- cliente API;
- payload enviado;
- estados `loading`, `error`, `success` e `empty`;
- validação do formulário;
- relação entre componente e endpoint;
- por que se usa `credentials: 'include'`;
- por que não se guarda token no `localStorage`.

No código de IA, documenta explicitamente:

- input permitido;
- fontes usadas;
- motivo do bloqueio sem fotografia, consentimento ou dados suficientes;
- provider isolado;
- guardrails;
- explicabilidade;
- limite entre análise/recomendação e invenção;
- fallback quando a IA não consegue responder.

Os comentários no código devem ensinar o raciocínio, não repetir o óbvio.

Bom comentário:

```ts
// O userId vem da sessão para impedir que o frontend crie dados em nome de outro cliente.
```

Mau comentário:

```ts
// Define userId.
```

Um bloco de código sem explicação didática suficiente não pode ser considerado completo.

---

## Qualidade backend obrigatória

Quando houver backend, inclui:

- endpoint;
- método HTTP;
- payload;
- DTO/validator;
- validação;
- schema/model;
- service;
- controller;
- route/module;
- middleware/guard quando necessário;
- ownership/role;
- tratamento de dados sensíveis;
- erros esperados;
- códigos HTTP;
- cenários negativos de segurança.

---

## Qualidade frontend obrigatória

Quando houver frontend, inclui:

- cliente API tipado ou com contrato claro;
- página ou componente;
- estado local;
- formulário;
- loading;
- error;
- empty/success;
- validação mínima;
- `credentials: 'include'`;
- sem tokens em `localStorage`;
- sem `payload: unknown`;
- mensagens claras e adequadas ao utilizador.

---

## Qualidade IA obrigatória

Quando houver IA, inclui:

- input permitido;
- consentimento exigido;
- fontes usadas;
- bloqueio sem fontes/fotografia/dados suficientes;
- prompt de sistema ou instruções equivalentes enviadas ao provider, quando aplicável;
- provider isolado;
- guardrails;
- explicabilidade;
- fallback honesto;
- negativos contra alucinação;
- separação entre recomendação e ação automática;
- limites explícitos: a app não deve apresentar diagnóstico médico definitivo.

---

## Qualidade de privacidade biométrica obrigatória

Quando houver fotografias, relatórios de análise ou dados biométricos:

- exige sessão autenticada;
- confirma consentimento antes do processamento;
- valida tipo, tamanho e número de ficheiros;
- distingue fotografia frontal e perfil quando o RF exigir;
- evita guardar ficheiros em paths públicos sem controlo;
- evita devolver paths internos do servidor;
- aplica ownership em leitura, escrita, atualização e eliminação;
- regista auditoria quando o BK ou RF/RNF tratar acessos sensíveis;
- inclui cenário negativo para tentativa de acesso a dados de outro utilizador;
- explica como o BK prepara eliminação/anonymização futura.

---

## Qualidade comércio obrigatória

Quando houver catálogo, carrinho, encomendas ou pagamentos:

- separa produto, carrinho, encomenda e pagamento;
- valida stock e preço no backend;
- não confia em preço enviado pelo frontend;
- define estado da encomenda de forma explícita;
- evita duplicar pagamentos/encomendas quando o fluxo exigir idempotência mínima;
- trata falhas de gateway de forma controlada;
- deixa claro o que é Stripe real controlado e o que é stub funcional;
- inclui cenários negativos de stock insuficiente, produto inexistente e utilizador não autenticado.

---

## Validação de coerência global

Além de validar cada BK isoladamente, verifica a coerência da macrofase completa:

- endpoints únicos e consistentes;
- nomes de módulos coerentes;
- schemas reutilizados corretamente;
- DTOs alinhados com frontend;
- services com responsabilidades claras;
- ownership/role aplicado sempre no backend;
- fluxos principais executáveis do início ao fim;
- ausência de imports para ficheiros inexistentes;
- ausência de código que só funciona "em teoria";
- preservação do core dual da Orélle.

O critério final é: a app Orélle deve conseguir ser implementada seguindo os BKs por ordem, sem o aluno ter de inventar peças técnicas em falta.

---

## Gate de qualidade pedagógica antes de terminar cada BK

Antes de considerar um BK concluído, confirma manualmente:

- O guia segue o formato dos BKs da MF0.
- Todos os passos têm os pontos 1 a 7.
- Todos os passos indicam ficheiros envolvidos e localização exata.
- Todo o código novo tem explicação didática.
- Depois de cada bloco de código há explicação completa.
- A teoria inclui domínio Orélle e conceitos técnicos usados no BK.
- A teoria não inventa regras fora da documentação.
- Backend, frontend, segurança, privacidade, comércio e IA são explicados quando aparecem no BK.
- Um aluno do 12.º ano consegue seguir o BK sem adivinhar peças em falta.

---

## Gate de qualidade antes de terminar

Depois de editar, executa estas verificações textuais.

Antes de executar o comando, substitui `{MF_ALVO}` pelo valor real, por exemplo `MF1`.

```bash
rg -n "StudyFlow|sala de estudo|turma oficial|disciplina|material oficial|IA da sala|IA da turma|professor|aluno inscrito|hidrata|pós-auditoria|scaffold|roteiro genérico|conversa interna|este guia deixa de ser|código ainda não corrigido|snippet|exemplo simplificado|implementar depois|quando aplicável|helpers chamados|substitu(ir|i)r? mocks|pseudo-código|solução parcial|payload: unknown|as any|ContextAction|contextApi" docs/planificacao/guias-bk/{MF_ALVO}/*.md
```

Se aparecerem ocorrências nos BKs dos alunos, corrige.

Depois executa:

```bash
git diff --check
bash scripts/validate-planificacao.sh
```

Se o validador falhar:

- lê o erro;
- corrige se for causado pelas tuas alterações;
- se for bloqueio de infraestrutura ou dívida pré-existente, regista o erro exato no relatório e no resumo final;
- não escondas a falha.

---

## Mapa de integração obrigatório

No relatório de auditoria, mantém uma secção chamada `Mapa de integração da MF`.

Para cada BK editado, regista:

- ficheiros criados;
- ficheiros editados;
- exports produzidos;
- imports consumidos de BKs anteriores;
- endpoints criados;
- DTOs/validators criados;
- schemas/models criados;
- services criados;
- componentes/páginas frontend criados;
- providers de IA criados ou usados;
- recursos sensíveis tratados;
- BKs seguintes que dependem destes elementos.

Antes de fechar a MF, confirma que não existem:

- dois endpoints para a mesma ação;
- dois schemas para a mesma entidade;
- nomes diferentes para o mesmo conceito;
- frontend a chamar endpoint inexistente;
- service a importar ficheiro não criado;
- BK seguinte dependente de algo que este BK não entregou;
- código que contorne consentimento, sessão ou ownership.

---

## Resumo final obrigatório

No fim responde com:

- MF processada;
- número de BKs analisados;
- contagem OK/PARCIAL/CRÍTICO antes;
- contagem OK/PARCIAL/CRÍTICO depois;
- BKs editados;
- principais lacunas corrigidas;
- decisões técnicas confirmadas;
- decisões marcadas como `DERIVADO`;
- drift documental encontrado;
- riscos de segurança/privacidade restantes;
- verificações textuais executadas;
- resultado de `git diff --check`;
- resultado de `bash scripts/validate-planificacao.sh`;
- bloqueios ou TODOs restantes.
