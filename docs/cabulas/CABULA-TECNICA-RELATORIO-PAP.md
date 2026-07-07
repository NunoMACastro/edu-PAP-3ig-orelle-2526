# Cábula Técnica Para Relatório PAP - Orélle

## Objetivo Do Documento

Este documento serve como apoio aos alunos para escreverem e apresentarem o relatório técnico da PAP. A linguagem é técnica, mas explicada de forma acessível, para que possa ser usada tanto no relatório como na preparação da defesa.

A Orélle é uma plataforma de consultoria cosmética inteligente que junta contas de utilizador, perfil personalizado, catálogo de produtos, análise facial assistida por IA, recomendações, rotinas, simulação visual, compras, privacidade biométrica e revisão humana por consultores. Algumas secções descrevem funcionalidades centrais do MVP; outras podem ser usadas como visão final, evolução futura ou enquadramento técnico, quando indicado.

## Visão Técnica Geral

Tecnicamente, a Orélle segue uma arquitetura web cliente-servidor. O frontend é a aplicação usada pelo utilizador no browser. O backend é responsável pelas regras de negócio, validação, autenticação, autorização, acesso à base de dados e exposição da API.

O frontend comunica com o backend através de uma API REST. Cada área funcional tem páginas e clientes próprios no frontend, por exemplo para autenticação, perfil, catálogo, análise facial, relatórios, recomendações, carrinho, checkout, notificações, privacidade, consultoria e administração.

O backend está organizado por módulos de domínio. Cada módulo concentra uma responsabilidade principal:

- autenticação e sessão;
- utilizadores, perfis e preferências;
- catálogo, produtos e categorias;
- fotografias faciais, consentimento e análise IA;
- relatórios, histórico de pele e evolução;
- recomendações, rotinas e feedback;
- simulação de maquilhagem e antes/depois;
- carrinho, encomendas, pagamentos e stock;
- notificações;
- privacidade/RGPD e auditoria biométrica;
- consulta IA guiada, histórico IA e revisão humana;
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
- disponibilidade operacional baseada no stock.

No estado atual de `real_dev`, a disponibilidade operacional é controlada sobretudo pelo stock. Produtos sem stock não devem seguir para recomendações, simulação visual ou compra. O catálogo administrável não tem um campo separado de publicação; por isso, se o relatório falar em produtos publicados/indisponíveis, deve explicar que essa parte seria uma evolução futura. O frontend pode apresentar informação visual, mas a autoridade sobre preço, stock e disponibilidade deve continuar no backend.

Na Orélle, o equivalente ao "conteúdo principal" do produto não é um vídeo, mas sim o conjunto produto + fotografia facial + análise cosmética. O utilizador pode enviar fotografias do rosto, normalmente frontal e perfil, e o backend valida consentimento, tipo de ficheiro, tamanho e armazenamento privado.

A análise facial usa essas fotografias para gerar sinais cosméticos, como tipo de pele, oleosidade, acne, manchas, rugas ou textura. O resultado deve ser apresentado como apoio cosmético, não como diagnóstico médico.

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

O sistema de recomendações sugere produtos personalizados ao utilizador. A recomendação deve ser útil, mas também transparente, segura e explicável.

A recomendação baseline usa sinais internos:

- tipo de pele;
- sinais da análise facial;
- relatório facial;
- histórico de pele;
- perfil e objetivos;
- alergias e ingredientes a evitar;
- restrições médicas leves;
- produtos reais com stock;
- feedback anterior do utilizador.

No estado atual de `real_dev`, a geração de recomendações não tem um modo de "cold start" com produtos gerais, populares ou editoriais. O backend exige análise facial concluída, relatório facial ativo, perfil cosmético e produtos compatíveis com stock. Se esses sinais não existirem, a API falha de forma controlada em vez de fingir personalização. Um modo de recomendações gerais com pouco contexto pode ser apresentado como evolução futura.

Cada recomendação deve incluir uma explicação simples, por exemplo:

- "porque corresponde ao seu tipo de pele";
- "porque ajuda no objetivo indicado";
- "porque evita ingredientes bloqueados no perfil";
- "com base na análise facial mais recente";
- "com base nas respostas da avaliação guiada".

### Contexto De Consulta E Histórico Seguro

No estado atual, a recomendação pode ser enriquecida com respostas da consulta IA guiada. A consulta guiada recolhe respostas estruturadas sobre objetivos, sensibilidade, hábitos, preferências e contexto cosmético.

Esse contexto deve ser tratado com minimização. O sistema deve guardar apenas o necessário para melhorar recomendações e continuidade da experiência.

Por privacidade:

- o histórico IA não deve expor fotografias;
- a API pública não deve devolver `storageKey`, `consentId`, prompts internos ou paths privados;
- o frontend não deve decidir ownership;
- qualquer provider externo deve ser opcional e sujeito a revisão de privacidade;
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

Num contexto PAP, os pagamentos podem funcionar em modo controlado. Isto permite demonstrar o fluxo funcional sem lidar com todos os riscos de pagamentos reais, cartões reais ou webhooks de produção.

O sistema deve suportar:

- criação de encomenda;
- cálculo de total em cêntimos;
- pagamento aceite;
- pagamento falhado;
- pagamento pendente;
- histórico de compras;
- alteração de estado da encomenda;
- atualização de stock quando aplicável.

Na Orélle, o MVP contempla Stripe em modo real controlado e PayPal/MBWay como stubs funcionais. Isto significa que PayPal/MBWay podem demonstrar o fluxo, mas não devem ser apresentados como integrações completas se não existir provider real configurado.

O ciclo de encomenda define o estado da compra. Uma encomenda pode estar pendente, paga, falhada, enviada ou entregue, dependendo do contrato implementado. O backend deve guardar datas, estado de pagamento, itens, totais e histórico suficiente para auditoria.

## Consulta Assistida E Revisão De Consultores

A consulta assistida é o mecanismo que junta IA e acompanhamento humano na Orélle. Em vez de depender apenas da fotografia, o sistema pode recolher respostas estruturadas e permitir revisão por consultores.

O fluxo tem várias etapas:

1. O cliente realiza análise facial e gera relatório.
2. O cliente inicia uma avaliação guiada.
3. O sistema valida e guarda respostas estruturadas.
4. As respostas podem enriquecer recomendações.
5. Uma sessão pode ficar disponível para revisão humana.
6. O consultor analisa a sessão com dados minimizados.
7. O consultor aprova, ajusta ou pede esclarecimentos.
8. O cliente vê apenas o insight público final.

A revisão humana deve ser auditável. Notas internas, identificadores de revisor e audit trail completo não devem ser mostrados ao cliente. O cliente deve ver a conclusão pública, as recomendações afetadas e o estado da revisão.

A consulta assistida garante que a IA não funciona como autoridade isolada. O sistema recomenda e organiza contexto; o consultor pode validar e corrigir.

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

A eliminação deve remover ou anonimizar dados pessoais, respeitando dependências do sistema. Em dados biométricos, pode existir eliminação lógica, anonimização, estados de privacidade e auditoria, em vez de apagar fisicamente todos os artefactos no mesmo momento.

Os consentimentos permitem controlar funcionalidades sensíveis, como análise facial e uso de imagem. A finalidade deve ser clara, por exemplo `analise_facial_cosmetica`. Em `real_dev`, existe aceitação/renovação de consentimento facial; uma revogação self-service explícita deve ser descrita como evolução futura se for mencionada. As imagens processadas não devem ser usadas para treino externo sem consentimento específico.

A exportação de dados implementada é administrativa e minimizada, por exemplo para vendas, utilizadores ou relatórios. Uma exportação self-service completa para o cliente deve ser apresentada como evolução futura.

Princípios importantes:

- minimização de dados;
- não guardar passwords em texto claro;
- não expor tokens;
- não enviar dados pessoais desnecessários ao frontend;
- não expor `storageKey`, paths internos ou consent IDs;
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

## Modos Avançados, Simulação Visual E Experiência Premium

Além do fluxo base de análise e recomendação, a Orélle pode oferecer funcionalidades avançadas de experiência.

Exemplos:

- simulação de maquilhagem virtual;
- visualização antes/depois;
- comparação após 30 dias de uso;
- consulta assistida integrada;
- insights de consultor;
- rotinas mais detalhadas;
- futuras experiências premium ou planos comerciais.

Na simulação visual, existe normalmente uma fotografia de referência e um produto escolhido. O sistema pode gerar uma pré-visualização segura para demonstrar o efeito. No MVP, esta simulação pode ser baseline e não fotorealista. O relatório deve ser honesto sobre essa limitação.

Regras importantes:

- o sistema deve validar consentimento antes de usar fotografia facial;
- a fotografia original não deve ser exposta diretamente;
- o preview deve ser apresentado como apoio visual, não como garantia de resultado;
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
- tratar CSRF token dedicado e rate limiting/brute force como pontos a reforçar se forem exigidos em produção;
- cifrar fotografias e relatórios sensíveis;
- limitar payloads enviados para providers externos.

### Testes

O projeto deve ter testes para validar:

- regras de backend;
- contratos HTTP;
- fluxos principais;
- autenticação;
- análise facial;
- recomendações;
- carrinho, checkout e encomendas;
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
- motivos da recomendação;
- limitações da análise;
- atributos protegidos que não podem discriminar;
- consentimento associado;
- retenção da imagem;
- revisão humana quando necessário.

Esta estrutura permite:

- explicar recomendações ao cliente;
- bloquear motivos discriminatórios;
- impedir treino externo sem consentimento;
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
4. fotografias, análise facial e relatório;
5. recomendações, rotinas e explicabilidade;
6. carrinho, checkout, encomendas e pagamentos;
7. consulta assistida e revisão humana;
8. experiência visual e acompanhamento;
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
- sessão protegida com cookie HttpOnly;
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
- pesquisa e filtros;
- produtos relacionados.

Também deve ser explicado que, no estado atual, a disponibilidade operacional é baseada sobretudo no stock. Não existe um campo separado de publicação do produto.

Mensagem-chave:

> A Orélle não recomenda produtos abstratos. As recomendações e compras usam produtos reais, com preço, stock e metadados controlados pelo backend.

### 4. Fotografias, Análise Facial E Relatório

Só depois do consentimento e do catálogo deve entrar a análise facial.

Inclui:

- upload de fotografia frontal e de perfil;
- validação de ficheiros;
- armazenamento privado;
- cifragem de fotografias;
- consentimento associado;
- análise cosmética;
- relatório facial;
- limitações da análise;
- separação entre apoio cosmético e diagnóstico médico.

Aqui deve ficar claro que a análise facial não é apresentada como decisão médica. É uma leitura cosmética para apoiar recomendações e rotinas.

Mensagem-chave:

> A análise facial transforma fotografias autorizadas em sinais cosméticos, mas sempre com consentimento, privacidade e limites claros.

### 5. Recomendações, Rotinas E Explicabilidade

Depois da análise facial e do relatório, faz sentido explicar as recomendações.

Inclui:

- recomendações personalizadas;
- análise facial mais recente;
- relatório facial ativo;
- perfil cosmético;
- alergias e ingredientes a evitar;
- produtos com stock;
- motivos da recomendação;
- limitações;
- rotina diária;
- alertas de rotina.

É importante dizer que, em `real_dev`, a geração de recomendações exige sinais suficientes. Se faltar análise, relatório, perfil ou produtos compatíveis, o backend falha de forma controlada em vez de fingir personalização.

Mensagem-chave:

> A recomendação só é útil se for explicável. A Orélle mostra não apenas o produto sugerido, mas também os motivos e limites dessa sugestão.

### 6. Carrinho, Checkout, Encomendas E Pagamentos

Depois das recomendações, deve entrar a camada comercial.

Inclui:

- carrinho;
- adicionar, alterar e remover produtos;
- validação de stock;
- checkout;
- encomendas;
- histórico de compras;
- recompra;
- Stripe em modo controlado;
- PayPal/MBWay como stubs funcionais;
- estado da encomenda.

Aqui deve ser reforçada a separação entre recomendação e compra. A aplicação pode sugerir um produto, mas não deve comprar automaticamente nem colocar produtos no carrinho sem ação clara do utilizador.

Mensagem-chave:

> A recomendação ajuda a escolher. A compra continua a ser uma decisão explícita do cliente e validada pelo backend.

### 7. Consulta Assistida E Revisão Humana

Depois das recomendações automáticas, deve ser apresentada a camada de acompanhamento humano.

Inclui:

- consulta guiada;
- respostas estruturadas;
- histórico IA minimizado;
- enriquecimento das recomendações;
- fila de revisão para consultores;
- decisão humana;
- nota pública;
- nota interna;
- insight visível ao cliente.

Aqui é importante distinguir o que o consultor vê do que o cliente vê. O cliente deve receber apenas a conclusão pública e segura; notas internas e audit trail não devem ser expostos.

Mensagem-chave:

> A IA organiza sinais e sugere caminhos, mas a Orélle mantém controlo humano quando a recomendação precisa de revisão.

### 8. Experiência Visual E Acompanhamento

Depois da recomendação e da revisão, podem ser apresentadas as funcionalidades de experiência avançada.

Inclui:

- simulação de maquilhagem;
- visualização antes/depois;
- evolução da pele;
- comparação temporal;
- histórico de relatórios;
- acompanhamento por rotina.

Deve ficar claro que a simulação visual é apoio à decisão, não promessa de resultado. No MVP, pode ser baseline e não fotorealista.

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

Também deve ser explicado que alguns fluxos, como exportação self-service completa ou revogação explícita de consentimento pela UI, podem ser apresentados como evolução futura se forem mencionados.

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
