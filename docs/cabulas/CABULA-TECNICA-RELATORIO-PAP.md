# Cábula Técnica Para Relatório PAP - Orélle

## Objetivo Do Documento

Este documento serve como apoio aos alunos para escreverem e apresentarem o relatório técnico da PAP. A linguagem é técnica, mas explicada de forma acessível, para que possa ser usada tanto no relatório como na preparação da defesa.

A Orélle é uma plataforma de consultoria cosmética inteligente que junta contas de utilizador, perfil personalizado, catálogo de produtos, análise facial assistida por IA, recomendações, rotinas, simulação visual, compras, privacidade biométrica e revisão humana por consultores. Algumas secções descrevem funcionalidades centrais do MVP; outras podem ser usadas como visão final, evolução futura ou enquadramento técnico, quando indicado.

> **Contrato corrente (2026-07-11).** A consulta é um percurso OpenAI-only: objetivo principal e até dois secundários entre sete objetivos, consentimento v2, fotografia frontal + perfil/ângulo lateral, controlo de qualidade, análise multimodal, 5–8 perguntas, catálogo pré-filtrado, relatório v2, revisão humana opcional, congelamento, desbloqueio por pagamento académico simulado de 10% e voucher. `gpt-image-2` edita maquilhagem apenas a pedido, depois do desbloqueio. Sem chave OpenAI, a aplicação arranca degradada e mantém as áreas não IA; não existe análise cosmética de demonstração nem fallback local que fabrique resultados.

## Visão Técnica Geral

Tecnicamente, a Orélle segue uma arquitetura web cliente-servidor. O frontend é a aplicação usada pelo utilizador no browser. O backend é responsável pelas regras de negócio, validação, autenticação, autorização, acesso à base de dados e exposição da API.

O frontend comunica com o backend através de uma API REST. Cada área funcional tem páginas e clientes próprios no frontend, por exemplo para autenticação, perfil, catálogo, análise facial, relatórios, recomendações, carrinho, checkout, notificações, privacidade, consultoria e administração.

O backend está organizado por módulos de domínio. Cada módulo concentra uma responsabilidade principal:

- autenticação e sessão;
- utilizadores, perfis e preferências;
- catálogo, produtos e categorias;
- consulta cosmética OpenAI, consentimentos separados, fotografias e controlo de qualidade;
- sessões e jobs retomáveis, relatórios versionados, histórico e evolução;
- recomendações de catálogo allowlisted, rotinas e feedback;
- edição OpenAI de maquilhagem e comparação original/preview;
- carrinho, encomendas, pagamentos e stock;
- notificações;
- privacidade/RGPD e auditoria biométrica;
- consulta de 5–8 perguntas, histórico seguro, revisão humana e congelamento;
- administração, métricas, exportações e operação.

Esta separação facilita manutenção e evolução, porque cada domínio pode ser alterado sem misturar responsabilidades com os restantes.

## Identidade, Contas E Perfis

O sistema de identidade é a base da plataforma. Antes de guardar fotografias, histórico de pele, recomendações, carrinho, encomendas ou preferências, o sistema precisa de saber quem é o utilizador.

Este domínio inclui:

- registo de utilizador;
- login;
- logout;
- sessão autenticada;
- edição de perfil;
- fotografia de perfil;
- papéis de utilizador, como `cliente`, `consultor` e `administrador`;
- bloqueio de contas suspensas ou eliminadas.

Depois do login, o backend associa os pedidos a um utilizador autenticado. Isto permite que cada operação pessoal seja feita sobre a conta correta. O frontend não deve enviar manualmente o `userId` para operações sensíveis; o backend deve obter a identidade a partir da sessão.

A sessão é opaca e persistida: o browser recebe no cookie `orelle_session` um token aleatório de 256 bits, mas a base de dados guarda apenas o respetivo hash, o titular, a expiração, `revokedAt`, `lastSeenAt` e o hash da prova CSRF. O cookie mantém `HttpOnly` e `SameSite=Lax`, e usa `Secure` quando o transporte HTTPS é obrigatório. `POST /api/auth/logout` revoga a sessão atual; `POST /api/auth/logout-all` revoga todas as sessões do utilizador, pelo que limpar apenas o cookie não é considerado logout completo.

As mutações autenticadas obtêm primeiro uma prova em `GET /api/auth/csrf` e enviam-na no header `X-CSRF-Token`. A API aceita a mutação apenas se a prova coincidir com a sessão ativa e o header `Origin` pertencer à allowlist configurada. O frontend mantém esta prova apenas em memória e usa `/api` same-origin, sem host de desenvolvimento incorporado no bundle.

As permissões também dependem deste domínio. Um cliente pode gerir a sua própria conta, perfil, recomendações, carrinho e pedidos de privacidade. Um consultor pode rever recomendações ou sessões IA. Um administrador pode aceder a operações críticas, como gestão de utilizadores, stock, exportações, métricas e auditoria.

## Catálogo, Produtos, Fotografias E Análise Facial

O catálogo é a fonte principal dos produtos da plataforma. Cada produto deve ter metadados bem definidos para poder ser pesquisado, apresentado, recomendado e comprado.

Os metadados principais incluem:

- nome;
- descrição;
- ingredientes;
- marca;
- preço;
- stock;
- imagem;
- categorias;
- tipo de pele indicado;
- elegibilidade IA e tags de preocupação/rotina;
- ingredientes INCI normalizados e atributos cosméticos estruturados;
- variantes opcionais com cor, undertone, acabamento, cobertura, imagem e stock.

O backend controla elegibilidade, restrições, preço e disponibilidade. Um produto `aiEligible` sem stock pode aparecer no relatório claramente marcado e sem ação de compra, mas não entra no cálculo dos 10%. Apenas produtos/variantes disponíveis podem ser comprados; o frontend mostra o snapshot histórico separado da disponibilidade atual.

Na Orélle, o equivalente ao "conteúdo principal" do produto é o conjunto consulta + fotografia facial + análise cosmética + catálogo. O utilizador envia frontal e perfil/ângulo lateral com indicações de luz, pose, lente, enquadramento e ausência de filtros. O browser faz preflight local; o backend volta a validar formato, dimensão, pixels, iluminação, exposição e blur antes de preparar os bytes privados.

A análise multimodal OpenAI usa as fotografias autorizadas e os objetivos para produzir qualidade remota, observações cosméticas e avaliação específica. Um resultado `inconclusive` pede novas fotografias e não produz findings. Todo o conteúdo é apoio cosmético, nunca diagnóstico médico.

## Histórico De Pele, Rotinas E Acompanhamento

Histórico de pele, relatórios, rotinas e evolução formam a biblioteca pessoal do utilizador dentro da Orélle.

Cada conceito tem uma função diferente:

- histórico de análises: avaliações faciais já realizadas;
- relatório facial: explicação legível de uma análise;
- evolução da pele: leitura temporal dos sinais ao longo do tempo;
- comparação antes/depois: apoio visual para perceber evolução;
- rotina diária: passos recomendados para manhã e noite;
- alertas de rotina: lembretes para dar continuidade ao cuidado.

Estes dados pertencem ao utilizador autenticado. Por isso, devem ser guardados associados à sessão/conta e não devem aceitar um `userId` vindo livremente do frontend.

Esta informação também é útil para outros módulos. O histórico e os relatórios alimentam recomendações, consulta guiada, evolução temporal, exportações administrativas minimizadas e revisão humana por consultores.

## Avaliações, Feedback E Revisão Humana

As avaliações permitem que os utilizadores deixem feedback sobre produtos. O sistema guarda a avaliação individual e permite comentários associados ao produto.

Os comentários curtos permitem feedback textual. Como podem ser públicos, devem ter validação e moderação. Comentários inadequados, irrelevantes ou suspeitos podem ser ocultados por administração sem alterar a autoria original do cliente.

Este domínio tem duas utilidades:

- ajuda outros utilizadores a perceber a receção de um produto;
- gera sinais para recomendações e melhoria da experiência.

É importante distinguir feedback público de sinais internos. Um comentário pode aparecer na página de detalhe; um feedback sobre recomendação pode servir para ajustar o estado da recomendação. Na Orélle, existe ainda revisão humana por consultores, onde um consultor pode aprovar, ajustar ou pedir esclarecimentos sobre sessões IA e recomendações.

## Pesquisa, Filtragem E Descoberta

Pesquisa e descoberta não são a mesma coisa.

A pesquisa acontece quando o utilizador procura ativamente por um termo, produto, marca ou ingrediente. O backend recebe parâmetros, valida a query, aplica filtros e devolve produtos do catálogo que correspondem aos filtros.

A descoberta é mais guiada. Inclui:

- produtos relacionados;
- produtos complementares;
- recomendações personalizadas;
- sugestões com base no tipo de pele;
- rotinas sugeridas;
- produtos adequados a objetivos cosméticos;
- produtos excluídos por alergias ou ingredientes a evitar.

A pesquisa responde a uma intenção direta. A descoberta ajuda o utilizador a encontrar produtos relevantes mesmo sem saber exatamente o que procurar.

## Recomendações, Consulta Guiada, Explicabilidade E Contexto

O sistema de recomendações faz parte da geração do relatório v2. Deve ser útil, transparente, segura e explicável, sem permitir que o modelo invente produtos.

O backend constrói o contexto com:

- objetivo principal e até dois objetivos secundários;
- qualidade e observações da análise OpenAI;
- respostas/factos das 5–8 perguntas;
- tipo de pele e perfil cosmético mínimo;
- alergias, ingredientes a evitar e restrições;
- orçamento e preferências relevantes;
- produtos e variantes `aiEligible` reais, com preço e stock atuais.

O servidor pré-filtra e envia no máximo 15 candidatos minimizados. A OpenAI só pode devolver IDs/variant IDs dessa allowlist; o backend volta a validar restrições, preço e stock antes de guardar snapshots imutáveis. O relatório tenta incluir 3–5 recomendações quando o catálogo o permite, podendo apresentar produtos sem stock devidamente identificados. Se faltarem candidatos válidos, declara cobertura limitada em vez de inventar uma recomendação.

Cada recomendação deve incluir uma explicação simples, por exemplo:

- "porque corresponde ao seu tipo de pele";
- "porque ajuda no objetivo indicado";
- "porque evita ingredientes bloqueados no perfil";
- "com base na análise facial mais recente";
- "com base nas respostas da avaliação guiada".

### Contexto De Consulta E Histórico Seguro

A consulta começa pela escolha de um objetivo principal e até dois secundários entre acne/imperfeições, hidratação/barreira, oleosidade, sensibilidade/vermelhidão, manchas/tom/luminosidade, proteção solar e maquilhagem. Depois da análise, a OpenAI escolhe a próxima pergunta entre slots permitidos até recolher os factos obrigatórios, com mínimo de cinco e máximo de oito perguntas.

Cada resposta é validada e persistida antes do passo seguinte. Perguntas, respostas e factos derivados são cifrados; o `flowState` do backend permite retomar depois de reload ou falha. Análise, pergunta seguinte, relatório e imagem usam jobs persistentes com lease, retry e idempotência. Só a seleção da pergunta pode recorrer ao banco canónico quando ambos os modelos OpenAI falham.

Por privacidade:

- o histórico IA não deve expor fotografias;
- a API pública não deve devolver `storageKey`, `consentId`, prompts internos ou paths privados;
- o frontend não deve decidir ownership;
- o único provider de runtime é OpenAI e requer consentimento v2 específico;
- as recomendações devem manter limitações e explicabilidade.

## Planos De Compra, Carrinho E Acesso A Funcionalidades

Na Orélle, não existe uma subscrição central equivalente a uma plataforma de streaming, mas existe uma camada comercial que controla a passagem de recomendação para compra.

O carrinho funciona como área temporária onde o utilizador guarda produtos que pretende comprar. Uma recomendação não deve comprar automaticamente um produto nem colocá-lo no carrinho sem ação clara do utilizador.

Este domínio inclui:

- adicionar produtos ao carrinho;
- alterar quantidades;
- remover produtos;
- validar stock;
- preparar checkout;
- separar intenção de compra de recomendação;
- permitir recompra de encomendas anteriores.

O backend deve ser a autoridade sobre o carrinho, preço, stock e disponibilidade. O frontend pode mostrar botões e informação visual, mas não deve decidir sozinho se um produto pode ser comprado.

## Pagamentos, Checkout E Ciclo De Encomenda

Na Orélle, o pagamento é exclusivamente simulado. O objetivo é demonstrar o fluxo funcional de uma encomenda sem cobrança, cartão, webhook, redirect, chave ou chamada externa. A interface deve mostrar permanentemente que se trata de uma demonstração académica.

> **Estado atual reconciliado em 2026-07-10:** o fluxo simulado de dois passos está implementado no backend e na UI. O service calcula e compara o hash da `Idempotency-Key` e guarda o snapshot de cada tentativa terminal; repetir a mesma chave devolve exatamente o mesmo `simulated_paid` ou `simulated_failed`, sem repetir efeitos. Não existe gateway nem I/O financeiro externo.
>
> **Snapshot histórico de 2026-07-09:** nessa data, o registo de auditoria ainda indicava como pendentes a UI de dois passos e o replay específico por hash. Esta nota é preservada apenas como histórico e já não descreve o runtime reconciliado acima.

O sistema deve suportar:

- criação de encomenda;
- cálculo de total em cêntimos;
- checkout pendente com `awaiting_simulation`;
- ação explícita «Simular pagamento»;
- resultado `simulated_paid` ou `simulated_failed`;
- histórico de compras;
- alteração de estado da encomenda;
- atualização de stock quando aplicável.

O fluxo implementado tem dois passos. `POST /api/orders/checkout` cria ou reutiliza uma encomenda pendente e não altera carrinho, voucher ou stock. `POST /api/orders/:orderId/payments/simulate`, com `Idempotency-Key`, revalida ownership, itens, preços, stock e voucher e aplica os efeitos numa única transação MongoDB. Repetir a mesma chave devolve o snapshot terminal anteriormente associado, incluindo uma falha; depois de `simulated_failed`, uma nova ação explícita utiliza uma chave nova.

O estado logístico é separado do resultado da simulação. Uma encomenda nasce `pendente`; só depois de `simulated_paid` pode avançar para `enviado` e `entregue`. O backend guarda snapshots, totais, referência/data simuladas e histórico suficiente para auditoria, sem guardar qualquer referência financeira externa.

## Consulta Assistida E Revisão De Consultores

A consulta assistida junta fotografia, conversa estruturada, catálogo, relatório e acompanhamento humano num único fluxo. A revisão é opcional: o cliente pode aceitar a versão IA ou pedir análise a um consultor antes de congelar/desbloquear.

O fluxo tem várias etapas:

1. O cliente escolhe objetivos, aceita o consentimento OpenAI v2 e envia fotografias validadas.
2. Um job OpenAI analisa as imagens; qualidade `inconclusive` pede um novo par.
3. A conversa recolhe 5–8 respostas estruturadas e pode ser retomada.
4. O backend pré-filtra o catálogo e o job OpenAI gera um relatório v2 com recomendações allowlisted.
5. O cliente aceita o relatório IA ou pede revisão humana opcional.
6. O consultor aprova, ajusta texto/rotina/produtos ou pede esclarecimento; produtos ajustados passam pelos mesmos validadores.
7. A versão escolhida é congelada com `contentHash`, snapshots de recomendações, preços e stock.
8. O backend calcula `depositCents = ceil(recommendedTotalCents × 1000 / 10000)` sobre uma unidade de cada recomendação disponível; o cliente simula esse pagamento, o relatório desbloqueia e nasce um voucher do mesmo valor.
9. Se houver objetivo e variantes de maquilhagem, o cliente pode consentir e pedir uma edição `gpt-image-2` da fotografia frontal.

A revisão humana é auditável e usa compare-and-set: uma segunda decisão concorrente recebe `409`. `machineResult` nunca é sobrescrito; ajustes ocupam `humanOverride`. Fotografias só são servidas ao consultor com grant temporário explícito, endpoint autenticado `no-store` e audit log; não carregam por defeito na fila.

Antes do desbloqueio, a API devolve apenas um teaser seguro e não envia o relatório completo para o DOM. Enquanto a revisão está pendente, o pagamento fica desativado; o cliente pode retirar um pedido ainda não decidido. Se nenhum produto estiver disponível, o relatório desbloqueia sem pagamento e sem voucher de valor zero.

## Notificações

As notificações comunicam eventos importantes ao utilizador, ao consultor ou ao administrador. Podem ser transacionais, informativas ou de continuidade.

Em `real_dev`, os casos concretos cobertos pelas notificações internas são:

- alteração de estado da encomenda;
- produto novo ou promoção através de campanha administrativa;
- alerta de rotina diária;
- listagem das notificações do próprio utilizador;
- marcação de notificações como lidas.

Outros eventos, como pagamento aceite/falhado, pedido de privacidade aprovado ou rejeitado, revisão de consultor concluída ou alterações importantes na conta, podem ser tratados como evolução futura se se quiser automatizar mais notificações.

As preferências de notificação estão implementadas sobretudo nos alertas de rotina. Uma gestão global de preferências por tipo de notificação pode ser apresentada como evolução futura.

Tecnicamente, o backend cria notificações com tipo, destinatário, estado de leitura, mensagem e data. O frontend lista essas notificações e permite ao utilizador consultá-las.

## Privacidade, RGPD E Consentimentos

Como a aplicação trata dados pessoais e fotografias faciais, precisa de regras de privacidade mais fortes do que uma loja online simples. Isto inclui dados de conta, perfil, preferências, fotografias, análises, relatórios, histórico IA, recomendações, encomendas, notificações e pedidos de privacidade.

O utilizador deve poder:

- consultar os seus dados nas áreas próprias da aplicação;
- pedir eliminação ou anonimização de dados biométricos;
- aceitar ou renovar consentimento facial;
- perceber para que os dados são usados;
- pedir tratamento sobre fotografias e relatórios.

A eliminação/anonimização de fotografias elimina sempre os bytes físicos. Um pedido administrativo só fica `completed` depois de os jobs idempotentes confirmarem ausência dos ficheiros; relatórios eliminados desaparecem e relatórios anonimizados só podem conservar agregados não identificáveis. A eliminação da conta pelo titular exige password + confirmação `ELIMINAR`, revoga sessões, apaga dados ligados e cria o estado terminal `deleted`.

Os consentimentos têm propósitos separados: consulta OpenAI v2 (fotografias, respostas/factos, perfil mínimo e catálogo filtrado), edição generativa e acesso temporário do consultor às fotografias. Consentimentos antigos não são promovidos. A revogação bloqueia novas operações, cancela jobs ainda não concluídos e não elimina automaticamente resultados já criados; essa eliminação usa os pedidos de privacidade. O acesso fotográfico do consultor termina com a revisão, revogação ou ao fim de sete dias.

A exportação de dados implementada é administrativa e minimizada, por exemplo para vendas, utilizadores ou relatórios. Uma exportação self-service completa para o cliente deve ser apresentada como evolução futura.

Princípios importantes:

- minimização de dados;
- não guardar passwords em texto claro;
- não expor tokens;
- não enviar dados pessoais desnecessários ao frontend;
- não expor `storageKey`, paths internos ou consent IDs;
- não enviar nome, email ou IDs MongoDB à OpenAI;
- usar dados de recomendação apenas para recomendação;
- manter logs sem informação sensível;
- cifrar fotografias e relatórios sensíveis em repouso.

## Administração, Métricas E Operação

A administração permite gerir a plataforma no dia a dia. Nem todas as operações devem estar disponíveis para utilizadores comuns.

Funções administrativas típicas:

- gerir utilizadores;
- bloquear ou reativar contas;
- alterar papéis;
- gerir produtos;
- gerir categorias;
- moderar comentários e avaliações;
- consultar pedidos de eliminação/anonimização;
- consultar auditoria biométrica;
- exportar dados minimizados;
- consultar métricas;
- gerir stock e alertas.

O painel de métricas ajuda a acompanhar o estado da plataforma. Pode apresentar:

- total de utilizadores;
- utilizadores ativos/bloqueados;
- produtos registados;
- produtos com baixo stock;
- encomendas;
- vendas;
- relatórios de IA;
- pedidos de privacidade;
- eventos de auditoria.

As operações críticas devem exigir role `administrador` e gerar evidência/auditoria quando possível. Quando envolvem dados biométricos, a resposta deve expor metadados mínimos e não payloads sensíveis.

## Edição Visual E Experiência Avançada

Além do fluxo base de análise e recomendação, a Orélle pode oferecer funcionalidades avançadas de experiência.

Exemplos:

- simulação de maquilhagem virtual;
- visualização antes/depois;
- comparação após 30 dias de uso;
- consulta assistida integrada;
- insights de consultor;
- rotinas mais detalhadas;
- futuras experiências premium ou planos comerciais.

Na edição de maquilhagem, `gpt-image-2` recebe a fotografia frontal e um `simulationSpec` fechado com as variantes recomendadas no relatório congelado. Não existe prompt livre nem possibilidade de juntar produtos externos ao relatório. A instrução pede preservação de identidade, estrutura facial, cabelo, fundo e características da pele, alterando apenas a maquilhagem; a interface mostra original e resultado lado a lado com aviso de que a pré-visualização é gerada por IA e o resultado real pode variar.

Regras importantes:

- o sistema deve validar consentimento antes de usar fotografia facial;
- a fotografia original não deve ser exposta diretamente;
- o preview deve ser apresentado como apoio visual, não como garantia de resultado;
- o resultado cifrado, normalizado e sem EXIF expira ao fim de sete dias;
- falha da imagem não invalida relatório, desbloqueio ou voucher;
- objetivos de tratamento nunca mostram uma “pele futura” artificial;
- recomendações e simulações não devem fazer promessas clínicas;
- a compra deve continuar separada da recomendação.

A experiência avançada deve ser imposta pelo backend quando envolver permissões, dados sensíveis ou regras de acesso. O frontend organiza a experiência, mas não deve ser a única camada de controlo.

## Segurança, Testes, Performance E Acessibilidade

Esta secção é transversal. Não é uma funcionalidade isolada, mas garante que a aplicação é confiável.

### Segurança

Pontos técnicos importantes:

- autenticação segura;
- sessão protegida com cookie HttpOnly;
- autorização por roles;
- validação de input;
- não guardar passwords em texto claro;
- usar hash seguro para passwords;
- proteger dados pessoais e biométricos;
- não expor IDs internos desnecessários;
- limitar operações administrativas;
- mitigar XSS e injeções com validação, React e respostas controladas;
- exigir prova CSRF ligada à sessão e `Origin` allowlisted em mutações autenticadas;
- limitar login, registo, API autenticada, upload e operações IA com políticas próprias;
- receber fotografias com Busboy em streaming, apenas nos campos `frontal` e `perfil`, com limites e cleanup em erro/abort;
- descodificar e normalizar imagens com Sharp, limitar dimensões/píxeis, auto-orientar, re-encodar para WebP e remover EXIF antes da cifra;
- cifrar campos sensíveis com AES-256-GCM contextual v2, ligando coleção, titular e campo na AAD;
- minimizar o payload enviado à OpenAI, usar Structured Outputs/allowlist e nunca incluir identificadores pessoais.

### Testes

O projeto deve ter testes para validar:

- regras de backend;
- contratos HTTP;
- fluxos principais;
- autenticação;
- análise facial;
- jobs, restart, lease expirada e replay idempotente;
- sete objetivos, limites de 5–8 perguntas e respostas concorrentes;
- recomendações;
- allowlist de catálogo, alergias, variantes, preço e stock;
- carrinho, checkout e encomendas;
- 10% simulado e criação transacional do voucher;
- edição OpenAI, ownership, expiração e eliminação física;
- privacidade/RGPD;
- revisão humana;
- regressão frontend;
- validações negativas.

Testes ajudam a garantir que alterações futuras não quebram funcionalidades existentes.

### Performance

Áreas críticas:

- catálogo;
- pesquisa;
- upload de imagem;
- análise facial;
- recomendações;
- páginas principais;
- checkout;
- consulta assistida.

O backend deve usar validação, timeouts e métricas de desempenho. O frontend deve evitar carregar dados desnecessários, otimizar imagens, usar lazy loading e apresentar feedback claro durante operações lentas.

### Acessibilidade

A aplicação deve ser utilizável com teclado, leitores de ecrã e diferentes tamanhos de ecrã.

Inclui:

- contraste adequado;
- modo escuro ou contraste ajustado;
- labels em formulários;
- estados de erro claros;
- navegação por teclado;
- foco visível;
- mensagens compreensíveis;
- layout responsivo;
- feedback imediato em formulários.

## Ética Da IA, Não Discriminação E Uso De Imagens

Nota de escopo: esta secção deve ser apresentada como requisito técnico e ético transversal. Algumas partes já pertencem ao MVP; outras podem ser usadas para explicar evolução futura e limites do produto.

A Orélle usa IA em contexto sensível, porque trabalha com fotografias do rosto e recomendações cosméticas. Isto exige cuidado com enviesamento, explicabilidade e finalidade dos dados.

A ética da IA deve ser tratada como dado estruturado e validável:

- finalidade do tratamento;
- fonte dos sinais usados;
- provider OpenAI, modelo efetivo e versões de prompt/schema;
- motivos da recomendação;
- limitações da análise;
- atributos protegidos que não podem discriminar;
- consentimento associado;
- retenção da imagem;
- revisão humana quando necessário.

Esta estrutura permite:

- explicar recomendações ao cliente;
- bloquear motivos discriminatórios;
- não autorizar o uso dos dados da consulta para treino de modelos externos; o consentimento v2 cobre apenas o processamento necessário à consulta;
- separar apoio cosmético de diagnóstico médico;
- permitir revisão humana por consultores;
- criar evidência para defesa e auditoria.

Como envolve IA e dados biométricos, a publicação de conclusões deve ser controlada. Isto evita recomendações opacas, promessas clínicas ou decisões automáticas sem validação humana.

## Como Fechar No Relatório

Uma forma forte de fechar a explicação técnica é mostrar que a Orélle não é apenas um conjunto de páginas, mas um sistema integrado.

Texto final sugerido:

> A Orélle foi estruturada como uma aplicação web modular, com separação clara entre frontend, backend, base de dados e domínios funcionais. Cada módulo responde a uma área do produto, como identidade, perfil, catálogo, análise facial, relatórios, recomendações, carrinho, encomendas, privacidade, revisão humana e administração. Esta organização permite manter o sistema escalável, seguro, testável e alinhado com os objetivos da PAP, especialmente por tratar dados sensíveis com consentimento, minimização, explicabilidade e controlo humano.

## Sugestão De Organização Para A Apresentação

Tendo em conta a complexidade da Orélle, a apresentação deve seguir uma ordem progressiva. O objetivo é evitar que os alunos comecem a explicar recomendações, IA ou compras antes de apresentarem a base que torna esses sistemas possíveis.

Em vez de apresentar a aplicação como uma lista de páginas, é melhor apresentar por camadas:

1. Base da plataforma;
2. cliente, perfil e consentimento;
3. catálogo, produtos e stock;
4. consulta OpenAI: objetivos, fotografias, análise e perguntas;
5. relatório, recomendações, revisão e congelamento;
6. desbloqueio/voucher, carrinho, checkout e encomendas;
7. histórico seguro e operação do consultor;
8. edição de maquilhagem e acompanhamento;
9. notificações, privacidade e RGPD;
10. administração, segurança, testes e operação.

### 1. Base Da Plataforma

Primeiro deve ser explicada a fundação técnica da aplicação.

Inclui:

- frontend React;
- backend Node.js/Express;
- MongoDB;
- API REST;
- autenticação;
- sessão opaca persistida com cookie HttpOnly, revogação imediata e proteção CSRF/origem;
- roles de cliente, consultor e administrador;
- validação, ownership, autorização e separação por módulos.

Mensagem-chave:

> Antes de falar de análise facial, recomendações ou compras, é preciso explicar como a Orélle sabe quem é o utilizador e como protege operações pessoais.

### 2. Cliente, Perfil E Consentimento

Depois da base técnica, deve entrar o utilizador e os dados que permitem personalizar a experiência.

Inclui:

- registo;
- login;
- logout;
- perfil cosmético;
- preferências;
- fotografia de perfil;
- consentimento facial;
- bloqueio de contas suspensas ou eliminadas.

Aqui é importante explicar que o frontend não deve enviar livremente o `userId` em operações sensíveis. O backend obtém a identidade a partir da sessão.

Mensagem-chave:

> Primeiro a aplicação identifica o cliente e recolhe dados mínimos de perfil e consentimento. Só depois pode trabalhar com fotografias, recomendações e histórico.

### 3. Catálogo, Produtos E Stock

Depois do perfil, deve ser explicado o catálogo, porque as recomendações e compras dependem de produtos reais.

Inclui:

- produtos;
- marcas;
- ingredientes;
- categorias;
- tipos de pele indicados;
- preço;
- imagem;
- stock;
- `aiEligible`, tags de preocupação e passos de rotina;
- variantes opcionais de cor/acabamento/cobertura;
- pesquisa e filtros;
- produtos relacionados.

Também deve ser explicado que a OpenAI só recebe produtos `aiEligible` já pré-filtrados. Um produto sem stock pode aparecer identificado no relatório, mas não pode ser comprado nem entra no cálculo dos 10%.

Mensagem-chave:

> A Orélle não recomenda produtos abstratos. As recomendações e compras usam produtos reais, com preço, stock e metadados controlados pelo backend.

### 4. Consulta OpenAI: Objetivos, Fotografias, Análise E Perguntas

Só depois do consentimento e do catálogo deve entrar a análise facial.

Inclui:

- upload de fotografia frontal e de perfil;
- objetivo principal e até dois secundários entre sete objetivos;
- instruções de captura e preflight MediaPipe/nativo;
- validação de ficheiros;
- armazenamento privado;
- cifragem de fotografias;
- consentimento OpenAI v2;
- análise multimodal OpenAI e qualidade `pass|warning|inconclusive`;
- conversa de 5–8 perguntas estruturadas;
- jobs retomáveis com `flowState` e `failed_retryable`;
- limitações da análise;
- separação entre apoio cosmético e diagnóstico médico.

Aqui deve ficar claro que a análise facial não é apresentada como decisão médica. É uma leitura cosmética para apoiar recomendações e rotinas.

Mensagem-chave:

> A consulta transforma objetivos, fotografias autorizadas e respostas estruturadas em contexto cosmético, mas sempre com consentimento, privacidade e limites claros.

### 5. Relatório, Recomendações, Revisão E Congelamento

Depois de concluir a conversa, faz sentido explicar como o job constrói o relatório e as recomendações.

Inclui:

- relatório v2 estruturado e versionado;
- recomendações personalizadas de 3–5 produtos quando o catálogo permitir;
- catálogo pré-filtrado e allowlist de até 15 candidatos;
- perfil cosmético;
- alergias e ingredientes a evitar;
- produtos/variantes disponíveis e indisponíveis claramente separados;
- motivos da recomendação;
- utilização e cautelas;
- limitações;
- rotina diária;
- revisão humana opcional com `machineResult`/`humanOverride`;
- congelamento com `contentHash` e snapshots imutáveis.

É importante explicar que a OpenAI só escolhe IDs da allowlist e o backend volta a validar catálogo, alergias, preço e stock. Se faltarem candidatos, o relatório declara cobertura limitada; se a OpenAI falhar, o job fica repetível em vez de fingir personalização.

Mensagem-chave:

> A recomendação só é útil se for explicável. A Orélle mostra não apenas o produto sugerido, mas também os motivos e limites dessa sugestão.

### 6. Desbloqueio, Voucher, Carrinho, Checkout E Encomendas

Depois das recomendações, deve entrar a camada comercial.

Inclui:

- carrinho;
- teaser seguro antes do desbloqueio;
- congelamento do total elegível e cálculo de 10%;
- pagamento académico simulado, idempotente e sem cobrança;
- voucher com exatamente o valor simulado;
- adicionar, alterar e remover produtos;
- validação de stock;
- checkout;
- encomendas;
- histórico de compras;
- recompra;
- checkout pendente sem consumo de recursos;
- botão «Simular pagamento», sem cobrança financeira;
- transação de voucher, stock, encomenda e carrinho, com replay exato de sucesso ou falha terminal por hash da chave;
- estado da encomenda.

Aqui deve ser reforçada a separação entre recomendação e compra. A aplicação pode sugerir um produto, mas não deve comprar automaticamente nem colocar produtos no carrinho sem ação clara do utilizador.

Existem duas simulações distintas: a do desbloqueio do relatório (10% convertido em voucher) e a do checkout de uma encomenda. Nenhuma faz transação financeira.

Mensagem-chave:

> A recomendação ajuda a escolher. A compra continua a ser uma decisão explícita do cliente e validada pelo backend.

### 7. Histórico Seguro E Operação Do Consultor

Depois do relatório, deve ser apresentada a retoma histórica e a operação opcional do consultor.

Inclui:

- retoma da consulta e histórico de sessões;
- histórico IA minimizado;
- fila de revisão para consultores;
- acesso fotográfico apenas com grant temporário;
- decisão humana auditada e CAS `409`;
- nota pública;
- nota interna;
- ajustes públicos na versão final.

Aqui é importante distinguir o que o consultor vê do que o cliente vê. O cliente deve receber apenas a conclusão pública e segura; notas internas e audit trail não devem ser expostos.

Mensagem-chave:

> A IA organiza sinais e sugere caminhos, mas a Orélle mantém controlo humano quando a recomendação precisa de revisão.

### 8. Edição De Maquilhagem E Acompanhamento

Depois da recomendação e da revisão, podem ser apresentadas as funcionalidades de experiência avançada.

Inclui:

- edição `gpt-image-2` de maquilhagem depois do desbloqueio;
- original e preview lado a lado;
- consentimento generativo, ownership, expiração e eliminação;
- evolução da pele;
- comparação temporal;
- histórico de relatórios;
- acompanhamento por rotina.

Deve ficar claro que a edição é uma pré-visualização gerada por IA, não promessa de resultado. Só usa variantes de maquilhagem do relatório congelado, sem prompt livre; os restantes objetivos nunca geram uma “pele futura”.

Mensagem-chave:

> A experiência visual ajuda o cliente a perceber melhor a evolução e o possível efeito dos produtos, mas não substitui avaliação profissional nem garante resultados.

### 9. Notificações, Privacidade E RGPD

Nesta fase devem entrar os sistemas que dão continuidade e proteção à experiência.

Inclui:

- notificações internas;
- campanhas administrativas de produto novo ou promoção;
- atualização de estado de encomenda;
- alertas de rotina;
- pedidos de eliminação ou anonimização;
- auditoria biométrica;
- consentimentos;
- minimização de dados;
- exportações administrativas minimizadas.

Também deve ser explicado que alguns fluxos, como exportação self-service completa ou uma ação visual dedicada de revogação na UI, podem ser apresentados como evolução futura se forem mencionados. A consulta e a revogação self-service já existem na API através de `GET` e `DELETE /api/face-consent` e não devem ser apresentadas como ausentes.

Mensagem-chave:

> Como a Orélle trabalha com dados pessoais e fotografias faciais, privacidade e RGPD não são extras; fazem parte da arquitetura principal.

### 10. Administração, Segurança, Testes E Operação

No fim devem entrar os sistemas que demonstram maturidade técnica.

Inclui:

- gestão de utilizadores;
- suspensão e reativação de contas;
- gestão de roles;
- gestão de produtos e categorias;
- moderação de avaliações;
- métricas administrativas;
- exportações;
- gestão de stock;
- HTTPS/HSTS quando exigido;
- timeouts;
- logs seguros;
- testes de backend;
- smokes e validações frontend.

Esta parte deve mostrar que a aplicação não é apenas uma interface bonita. Tem regras de operação, segurança, validação e manutenção.

Mensagem-chave:

> Para além das funcionalidades visíveis, a Orélle tem sistemas técnicos para proteger dados, controlar permissões, validar fluxos e facilitar manutenção.

### Regra Para Evitar Confusão

Sempre que surgir uma funcionalidade que depende de outra ainda não explicada, pode ser usada esta frase:

> Esta funcionalidade depende de conceitos que vamos explicar mais à frente, por isso agora só a vamos situar no mapa geral.

No início da apresentação, pode ser mostrado um mapa geral sem explicar tudo em detalhe.

Frase útil para abrir a parte técnica:

> A aplicação junta perfil cosmético, catálogo, análise facial, recomendações, compras, privacidade, revisão humana e administração. Vamos explicar por ordem, porque alguns sistemas dependem dos anteriores.

Esta organização ajuda a apresentação a ter uma narrativa clara: primeiro a base, depois o cliente e o catálogo, depois a análise facial, depois as recomendações, depois a compra e revisão humana, e no fim a privacidade, segurança e operação.

## Changelog

- `2026-07-11`: consulta e apresentação sincronizadas com OpenAI-only, sete objetivos, controlo de qualidade, 5–8 perguntas, jobs retomáveis, allowlist, relatório v2, revisão/freeze, 10% simulado/voucher e edição `gpt-image-2`.
- `2026-07-10`: autenticação alinhada com sessões opacas persistidas, revogação, CSRF e same-origin; uploads alinhados com Busboy/Sharp; cifra sensível alinhada com AES-GCM contextual v2.
