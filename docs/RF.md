# Requisitos Funcionais - Aplicação **Orélle**

## Índice

1. [Utilizadores e Perfis](#1-utilizadores-e-perfis)
2. [Gestão de Produtos e Catálogo](#2-gestão-de-produtos-e-catálogo)
3. [Análise e Consultoria com IA](#3-análise-e-consultoria-com-ia)
4. [Sistema de Recomendação e Personalização](#4-sistema-de-recomendação-e-personalização)
5. [Simulação Virtual e Fotografias](#5-simulação-virtual-e-fotografias)
6. [Carrinho, Pagamento simulado e Histórico](#6-carrinho-pagamento-simulado-e-histórico)
7. [Gestão Administrativa](#7-gestão-administrativa)
8. [Notificações e Comunicação](#8-notificações-e-comunicação)
9. [Privacidade Operacional e Conformidade](#9-privacidade-operacional-e-conformidade)
10. [Critérios de Aceitação](#critérios-de-aceitação)
11. [Sugestão de MVP organizado por fases e RF](#sugestão-de-mvp-organizado-por-fases-e-rf)
12. [Créditos do projeto](#créditos-do-projeto)
13. [Licença](#licença)
14. [Changelog](#changelog)

-   [Voltar ao início](../README.md)

---

## Requisitos Funcionais

### 1 Utilizadores e Perfis

| Código | Requisito                                                                                                       | Atores  | Prioridade | Dependências |
| :----- | :-------------------------------------------------------------------------------------------------------------- | :------ | :--------- | :----------- |
| RF01   | Registo de utilizadores com email e password.                                                                   | Cliente | Must       | -            |
| RF02   | Login e logout com sessão segura (cookie HttpOnly).                                                             | Cliente | Must       | -            |
| RF03   | Criação de **perfil personalizado** com nome, idade, tipo de pele, género e objetivos (ex: hidratar, antiacne). | Cliente | Must       | RF01         |
| RF04   | Possibilidade de **editar o perfil e atualizar fotografias** periodicamente.                                    | Cliente | Should     | RF03         |
| RF05   | Criação de **roles**: Cliente, Consultor, Administrador.                                                        | Admin   | Must       | RF01         |
| RF06   | Cada utilizador pode guardar **preferências de produtos e marcas favoritas**.                                   | Cliente | Should     | RF03         |

---

### 2 Gestão de Produtos e Catálogo

| Código | Requisito                                                                                                | Atores       | Prioridade | Dependências |
| :----- | :------------------------------------------------------------------------------------------------------- | :----------- | :--------- | :----------- |
| RF07   | Registar produtos com nome, descrição, ingredientes, tipo de pele indicado, imagem, preço e stock.       | Admin        | Must       | -            |
| RF08   | Associar **categorias** (limpeza, maquilhagem, tratamento, protetor solar, etc.).                        | Admin        | Must       | RF07         |
| RF09   | Permitir pesquisa e filtragem por categoria, preço, tipo de pele, marca.                                 | Cliente      | Must       | RF07         |
| RF10   | Página de **detalhes do produto** com descrição completa, imagem, notas de utilizadores e recomendações. | Cliente      | Must       | RF07         |
| RF11   | Permitir ao cliente **avaliar produtos** (1–5 estrelas) e deixar comentários.                            | Cliente      | Should     | RF10         |
| RF12   | Mostrar produtos semelhantes e complementares (“quem comprou isto também comprou…”).                     | Sistema (IA) | Should     | RF07         |

---

### 3 Análise e Consultoria com IA

| Código | Requisito                                                                                                 | Atores           | Prioridade | Dependências |
| :----- | :-------------------------------------------------------------------------------------------------------- | :--------------- | :--------- | :----------- |
| RF13   | Orientar e permitir o **upload de duas fotografias** do rosto (frontal e perfil/ângulo lateral), validar formato, resolução, pose, luz, exposição, enquadramento e blur e exigir confirmação dos warnings recuperáveis antes da análise. | Cliente, Sistema | Must | RF03 |
| RF14   | Após consentimento OpenAI v2, analisar as fotografias exclusivamente com OpenAI para produzir qualidade remota, observações cosméticas e avaliação específica dos objetivos selecionados, sem diagnóstico médico; qualidade `inconclusive` exige um novo par e não produz findings. | Sistema (IA) | Must | RF13 |
| RF15   | Gerar um **relatório versionado** com objetivos, qualidade, resumo das respostas, avaliação, rotina, 3–5 produtos quando o catálogo o permitir, utilização, cautelas, limitações e provenance. Antes do congelamento/desbloqueio, a API expõe apenas um teaser seguro; o conteúdo completo nunca é enviado escondido para o browser. | Sistema (IA), Cliente | Must | RF14, RF18 |
| RF16   | A análise deve ser guardada no histórico pessoal para futuras comparações.                                | Cliente, Sistema | Should     | RF15         |
| RF17   | O utilizador pode consultar **evolução da pele ao longo do tempo** através de gráficos.                   | Cliente          | Could      | RF16         |
| RF42   | Cliente inicia uma consulta com um objetivo principal e até dois secundários entre os sete objetivos canónicos; após a análise, a OpenAI escolhe 5–8 perguntas estruturadas segundo os factos obrigatórios ainda em falta, e a sessão pode ser retomada sem perder progresso. | Cliente, Sistema | Must | RF14, RF15 |
| RF45   | Antes de congelar, o cliente pode continuar com a versão IA ou pedir/retirar uma revisão humana ainda não decidida. O consultor pode aprovar, ajustar texto/rotina/produtos ou pedir esclarecimento, preservando `machineResult` e registando `humanOverride`; listagem, detalhe, fotografia e decisão são auditados e a decisão usa compare-and-set. | Cliente, Consultor | Must | RF42 |
| RF46   | O cliente consulta o estado da revisão e a versão final efetiva; um pedido de esclarecimento reabre a conversa e uma resposta cria uma nova revisão do relatório. Fotografias só ficam acessíveis ao consultor com grant explícito, revogável e temporário por relatório. | Cliente | Should | RF45 |
| RF47   | O histórico próprio apresenta consultas e transcript minimizados, cifrados e retomáveis, sem expor fotografias, storage keys, consent IDs, prompts internos ou conteúdo integral de relatórios bloqueados. | Cliente, Sistema | Must | RF42 |

---

### 4 Sistema de Recomendação e Personalização

| Código | Requisito                                                                                           | Atores      | Prioridade | Dependências |
| :----- | :-------------------------------------------------------------------------------------------------- | :---------- | :--------- | :----------- |
| RF18   | O backend filtra o catálogo por objetivos, pele, alergias, ingredientes a evitar, orçamento e elegibilidade; o relatório recomenda **3–5 produtos/variantes reais** quando existirem candidatos válidos e pode incluir indisponíveis claramente identificados. | IA, Cliente | Must | RF14, RF15 |
| RF19   | Cada recomendação indica **motivo, utilização, cautelas, snapshot histórico e disponibilidade atual**; produtos indisponíveis não têm CTA de compra, mas podem oferecer alerta de reposição. | Sistema | Should | RF18 |
| RF20   | O utilizador pode marcar recomendações como **“úteis” ou “não relevantes”**; o sistema regista o feedback sem treinar automaticamente qualquer modelo. | Cliente | Could | RF18 |
| RF21   | O relatório deve sugerir **rotinas diárias** (manhã/noite ou sequência equivalente ao objetivo), com instruções e cautelas para cada passo. | Sistema | Should | RF18 |
| RF22   | Consultores podem ajustar texto, rotina e recomendações do relatório; produtos e variantes ajustados passam pelos mesmos validadores de allowlist, alergias, preço e stock, sem sobrescrever o resultado automático. | Consultor | Could | RF18, RF45 |
| RF43   | O backend envia à OpenAI no máximo 15 candidatos minimizados; a resposta só pode referir IDs/variantes dessa allowlist e é revalidada no servidor. Relatório, recomendações e revisão são persistidos de forma atómica/idempotente por jobs duráveis. | IA, Cliente | Must | RF18, RF40, RF42 |

---

### 5 Simulação Virtual e Fotografias

| Código | Requisito                                                                             | Atores  | Prioridade | Dependências |
| :----- | :------------------------------------------------------------------------------------ | :------ | :--------- | :----------- |
| RF23   | Depois de desbloquear um relatório com objetivo de maquilhagem, permitir ao cliente pedir uma **edição OpenAI da fotografia frontal**, com consentimento generativo próprio e exclusivamente segundo as variantes recomendadas na versão congelada. | Cliente | Could | RF13, RF15, RF18 |
| RF24   | Mostrar original e resultado gerado por IA lado a lado, com aviso de variação real, acesso apenas do proprietário e expiração de sete dias. Outros objetivos nunca geram uma “pele futura”. | Sistema | Should | RF23 |
| RF25   | O sistema deve permitir **comparar dois momentos do histórico por data**, após pelo menos 30 dias, com imagens autorizadas do proprietário, métricas e tabela acessível. | Cliente | Could | RF16 |

---

### 6 Carrinho, Pagamento simulado e Histórico

| Código | Requisito                                                                              | Atores           | Prioridade | Dependências |
| :----- | :------------------------------------------------------------------------------------- | :--------------- | :--------- | :----------- |
| RF26   | Adicionar/remover produtos do **carrinho de compras**.                                 | Cliente          | Must       | RF07         |
| RF27   | Registar **encomendas com o método único “Pagamento simulado”**, calculado e confirmado localmente, sem integração financeira externa nem movimentação de dinheiro. | Cliente, Sistema | Must       | RF26         |
| RF28   | Histórico de compras com data, total, produtos e estado (pendente, enviado, entregue). | Cliente          | Must       | RF27         |
| RF30   | O cliente pode **recomprar produtos anteriores** com um clique.                        | Cliente          | Should     | RF28         |

---

### 7 Gestão Administrativa

| Código | Requisito                                                                            | Atores | Prioridade | Dependências |
| :----- | :----------------------------------------------------------------------------------- | :----- | :--------- | :----------- |
| RF31   | Dashboard de **estatísticas** (vendas, produtos mais vendidos, utilizadores ativos). | Admin  | Should     | RF27         |
| RF32   | Gestão de stock (alertas de baixo stock, atualização automática após compra).        | Admin  | Must       | RF27         |
| RF33   | Gestão administrativa de utilizadores: ativar, suspender e **desativar reversivelmente** uma conta. O `DELETE /api/admin/users/:id` é uma ação administrativa denominada “Desativar”: preserva email/dados, grava `suspended`, revoga as sessões na mesma transação e permite reativação posterior. Apenas `DELETE /api/me/account`, com password e confirmação `ELIMINAR`, pode criar o estado terminal `deleted` e tratar as coleções ligadas. | Admin | Must | RF01 |
| RF34   | Moderação de comentários e avaliações.                                               | Admin  | Should     | RF11         |
| RF35   | Exportação de dados para Excel/PDF (vendas, relatórios de IA, utilizadores).         | Admin  | Should     | RF31         |

---

### 8 Notificações e Comunicação

| Código | Requisito                                                                    | Atores             | Prioridade | Dependências |
| :----- | :--------------------------------------------------------------------------- | :----------------- | :--------- | :----------- |
| RF36   | Enviar notificações sobre promoções, novos produtos e estado das encomendas. | Sistema            | Must       | RF27         |
| RF37   | Enviar alertas personalizados (“Está na hora da sua rotina noturna”).        | Sistema (IA)       | Should     | RF21         |

---

### 9 Privacidade Operacional e Conformidade

| Código | Requisito                                                                                                                   | Atores           | Prioridade | Dependências |
| :----- | :-------------------------------------------------------------------------------------------------------------------------- | :--------------- | :--------- | :----------- |
| RF40   | Guardar **alergias, ingredientes a evitar e restrições médicas leves** no perfil e impedir recomendações que violem regras. | Cliente, Sistema | Must       | RF03         |
| RF41   | Painel exclusivo do administrador para rever, decidir e repetir de forma idempotente **pedidos de eliminação/anonimização de fotografias e relatórios**, concluindo apenas após tratamento físico dos ficheiros aplicáveis. Cada decisão aplicada e o respetivo evento de auditoria minimizado confirmam atomicamente na mesma transação. | Admin | Must | RF13 |
| RF44   | Registo/auditoria de acessos a dados biométricos, com alertas para usos indevidos.                                          | Sistema, Admin   | Should     | RF13         |

---

## Critérios de Aceitação

> Critérios de aceitação são descrições detalhadas que definem quando um requisito funcional está completo e funciona conforme esperado.

### Análise IA (RF13–RF17)

-   **Quando** o cliente seleciona objetivos, aceita o consentimento v2 e envia frontal + perfil, **então** o browser faz preflight local e o backend repete as verificações técnicas antes de criar o job OpenAI.
-   Rosto ausente/múltiplo, resolução insuficiente, pose incompatível, escuridão/sobre-exposição ou blur recusam o par sem chamar a OpenAI; warnings recuperáveis exigem confirmação.
-   A análise e o relatório são operações assíncronas retomáveis. Um timeout ou falha total deixa a etapa em `failed_retryable`; nunca é fabricado um resultado cosmético local.
-   Sem `OPENAI_API_KEY`, a capability informa indisponibilidade e apenas novas operações IA respondem `503 AI_NOT_CONFIGURED`; conta, catálogo e loja continuam funcionais.
-   A análise regista provider/modelo efetivo, request ID e versões de aviso, prompt e schema, e nunca é apresentada como diagnóstico médico.

### Consulta IA Guiada e Revisão Humana (RF42, RF45–RF47)

-   A seleção aceita exatamente um objetivo principal e, no máximo, dois secundários entre acne/imperfeições, hidratação/barreira, oleosidade, sensibilidade/vermelhidão, manchas/tom/luminosidade, proteção solar e maquilhagem.
-   **Quando** a qualidade é aceite, **então** a consulta apresenta entre 5 e 8 perguntas `single_select`, `multi_select`, `scale`, `number` ou `short_text`; cada resposta é validada e persistida antes da pergunta seguinte.
-   Reload, retry e duplo clique reutilizam a mesma sessão/operação; respostas concorrentes não alteram perguntas anteriores e recebem conflito quando aplicável.
-   **Quando** o cliente pede revisão, **então** o pagamento fica indisponível até aprovação, ajuste, esclarecimento ou retirada do pedido ainda não decidido.
-   O consultor não vê fotografias por defeito. Um grant explícito por relatório permite acesso autenticado `no-store`, expira ao concluir/cancelar a revisão ou no máximo em sete dias e pode ser revogado antes.
-   Geração/regeneração atualiza apenas dados automáticos (`machineResult`), preserva `humanOverride` e uma clarificação cria uma nova revisão do relatório.
-   Listagem, detalhe e decisão de consultor geram audit log minimizado; duas decisões concorrentes produzem um sucesso e um `409`, sem decisão dupla.
-   **Quando** há insight/correção de consultor, **então** o cliente consegue consultar o estado da revisão, a nota pública e as recomendações afetadas.

### Recomendação Personalizada (RF18–RF22, RF43)

-   O backend pré-filtra e minimiza no máximo 15 produtos/variantes; IDs fora da allowlist, alergias, ingredientes incompatíveis, preços ou stock inválidos são recusados antes de persistir o relatório.
-   O relatório inclui 3–5 recomendações quando o catálogo e o orçamento o permitirem; cobertura inferior é declarada sem inventar produtos. Itens sem stock podem ser explicados, mas não têm CTA de compra.
-   Antes do desbloqueio, `GET /api/face-reports/:reportId` devolve apenas teaser, estado da revisão, quantidade de produtos, total elegível e 10%; o conteúdo integral não entra no DOM.
-   A versão IA aceite ou a versão humana aprovada é congelada com `contentHash`, IDs finais e snapshot de preços/stock. Alterações posteriores do catálogo ou feedback não alteram essa versão.
-   `recommendedTotalCents` soma uma unidade de cada recomendação disponível no congelamento e `depositCents = ceil(recommendedTotalCents × 1000 / 10000)`; produtos sem stock ficam fora da base dos 10%.
-   **Quando** o cliente confirma `POST /api/face-reports/:reportId/unlock/simulate-payment` com `Idempotency-Key`, **então** desbloqueio e voucher do mesmo valor confirmam numa transação. Não existem dados financeiros, gateway, cobrança ou movimento de dinheiro.
-   Replay devolve o mesmo resultado; conflito material devolve `409`; falha faz rollback. Se nenhuma recomendação estiver disponível, o relatório é desbloqueado sem simulação e sem voucher de valor zero.
-   **Se** o utilizador marcar “não relevante”, o sistema regista esse feedback; não existe treino automático implícito.
-   **Quando** existir um ajuste humano, **então** o DTO mostra esse texto como `explanation`, mantém a versão automática em `machineExplanation` e não altera o snapshot persistido da máquina.

### Simulação Virtual (RF23–RF25)

-   **Com relatório desbloqueado, objetivo de maquilhagem, variante recomendada e consentimento generativo**, o cliente pode pedir uma edição OpenAI baseada exclusivamente no `simulationSpec` congelado; não existe prompt livre.
-   O output é convertido para WebP sem EXIF, cifrado, servido apenas ao proprietário por endpoint autenticado `no-store` e expira ao fim de sete dias.
-   Original e resultado aparecem lado a lado com “Pré-visualização gerada por IA — o resultado real poderá variar”. Uma falha de imagem não volta a bloquear o relatório nem invalida o voucher.
-   Objetivos que não sejam maquilhagem apresentam plano/zonas de aplicação e nunca uma evolução artificial da pele.
-   A comparação carrega `GET /api/me/skin-analyses/comparison-options`, apresenta datas em selects sem pedir IDs e usa `selectionKey` apenas como valor opaco; imagens vêm de `/api/me/skin-analyses/:analysisId/image`, autenticado e `no-store`.
-   O resultado compara métricas cosméticas numa tabela acessível e valida ownership, ordem temporal e intervalo mínimo de 30 dias no backend.

### Privacidade e eliminação (RF41, RNF13)

-   O titular cria e consulta pedidos através de `POST|GET /api/me/privacy-requests`; apenas o administrador lista e decide em `GET|PATCH /api/admin/privacy-requests`, podendo repetir jobs falhados em `POST /api/admin/privacy-requests/:requestId/retry`.
-   Um pedido só fica `completed` quando os bytes abrangidos deixaram de existir; retries são idempotentes e respostas públicas não expõem paths, conteúdo biométrico ou erros internos.
-   `DELETE /api/me/account` exige password e a confirmação literal `ELIMINAR`, revoga sessões e deixa a conta em estado terminal `deleted`; a eliminação/anonymização das coleções associadas respeita a política mínima definida para dados partilhados e auditáveis.

### Compras e Histórico (RF26–RF28, RF30)

-   **Quando** o utilizador finaliza o checkout com body vazio, **então** o backend cria a encomenda pendente com `payment.mode = "simulated"` e `payment.status = "awaiting_simulation"`.
-   **Quando** o cliente confirma `POST /api/orders/:orderId/payments/simulate` com `Idempotency-Key`, **então** o backend volta a validar ownership, carrinho, preços e stock e regista `simulated_paid` ou `simulated_failed`.
-   O desbloqueio do relatório referido em RF15 é uma simulação separada da encomenda, igualmente sem cobrança, e nunca consome stock/carrinho.
-   O fluxo não pede dados financeiros, não comunica com serviços de cobrança, não redireciona para páginas externas e não movimenta dinheiro.
-   **Se** o pedido de simulação repetir a mesma `Idempotency-Key`, **então** o sistema reaproveita o resultado anterior sem voltar a consumir stock, voucher ou carrinho.
-   O estado muda para “Entregue” apenas após confirmação do envio.

### Gestão Administrativa (RF31–RF35)

-   **O administrador** pode aceder ao painel com número total de utilizadores, encomendas e produtos em stock.
-   **Quando** um produto tem <5 unidades, **então** o sistema emite alerta de stock.

## Sugestão de MVP organizado por fases e RF

-   **Fase 1 - Núcleo Funcional Inicial:** RF01–RF24 (identidade, catálogo, consulta OpenAI, recomendação e preview de maquilhagem).
-   **Fase 2 - Produto, Operação e Privacidade:** RF25, RF26, RF27, RF28, RF30, RF31, RF32, RF33, RF34, RF35, RF36, RF37, RF40, RF41, RF44.
-   **Fase 3 - Hardening para defesa:** RF42, RF43, RF45, RF46, RF47, qualidade operacional, evidências e consolidação de critérios de aceitação.

---

## Ligacao com planificacao canonica

- Mapeamento RF -> BK: `docs/planificacao/backlogs/ANEXO-RF-PARA-BKS.md`.
- Backlog operativo: `docs/planificacao/backlogs/BACKLOG-MVP.md`.
- Matriz canónica: `docs/planificacao/backlogs/MATRIZ-CANONICA-BK.md`.

## Créditos do projeto

- Projeto académico desenvolvido no âmbito da PAP.
- Estrutura documental canónica mantida pela equipa do projeto para suporte a implementação e avaliação.

## Licença

Projeto académico destinado a fins educativos no âmbito da PAP.

---

## Changelog

-   **2026-07-11** - RF13–RF24, RF41–RF47 e critérios sincronizados com sete objetivos, qualidade fotográfica, consulta OpenAI de 5–8 perguntas, jobs retomáveis, relatório/revisão/freeze, fórmula dos 10%, voucher e edição OpenAI de maquilhagem.
-   **2024-04-27** - Reorganização do RF.md para formato padrão com novas secções (MVP, créditos, licença e changelog).
-   **2026-04-14** - Alinhamento editorial com planificacao canónica, scorecard comum e rastreabilidade BK.
-   **2026-04-17** - Removidos requisitos fora do escopo PAP para manter RF e planificação sem referências residuais.
-   **2026-06-30** - Adicionados RF42, RF43, RF45, RF46 e RF47 para consulta IA guiada, recomendações enriquecidas e revisão humana.
-   **2026-07-09** - RF27 e critérios de aceitação alinhados ao método único “Pagamento simulado”, exclusivamente académico/local e sem integração financeira externa.
-   **2026-07-09** - RF15, RF20, RF23 e RF24 reconciliados para avaliação cosmética, feedback sem treino automático e pré-visualização conceptual sem promessa de realismo.
-   **2026-07-10** - RF41/RNF13 reconciliados com os endpoints canónicos de privacidade, retry idempotente, eliminação física aplicável e eliminação terminal da conta.
-   **2026-07-10** - RF43/RF45 reconciliados com resolução automática da sessão, transações, separação `machineResult`/`humanOverride`, auditoria e CAS `409`.
-   **2026-07-10** - RF33 reconciliado: o `DELETE` administrativo significa “Desativar”, grava `suspended`, preserva dados, revoga sessões e é reversível; `deleted` pertence apenas à eliminação terminal do titular prevista em RNF13.
