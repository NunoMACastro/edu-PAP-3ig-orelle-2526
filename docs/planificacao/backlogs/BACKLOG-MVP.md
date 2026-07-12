# BACKLOG-MVP

## Header
- `doc_id`: `BACKLOG-MVP`
- `path`: `docs/planificacao/backlogs/BACKLOG-MVP.md`
- `area`: `project`
- `owner`: `Nuno`
- `status`: `ativo`
- `last_updated`: `2026-07-11`

## Objetivo
Backlog atomico oficial do MVP com rastreabilidade canónica e contrato pedagógico comum entre as 4 PAPs.

## Meta documental oficial
- Score final alvo: `>=97/100`.
- Fecho exige validacao automatica em `PASS` + evidencias por gate.

## Contrato de dados canónico por BK
Campos obrigatorios: `bk_id`, `owner`, `prioridade`, `estado`, `esforco`, `dependencias`, `rf_rnf`, `sprint`, `core_or_reforco`, `proximo_bk`, `guia_path`.

## Contrato pedagogico comum
- `P0`: minimo `8` passos e `3` cenarios negativos.
- `P1`: minimo `6` passos e `2` cenarios negativos.
- `P2`: minimo `6` passos e `1` cenario negativo.
- Codigo tecnico aplicavel obrigatoriamente integrado nos passos do guia e ligado a `bk_id` e `rf_rnf`.

## Legenda
- Prioridade: `P0` (critico), `P1` (importante), `P2` (melhoria).
- Estado: `TODO`, `IN_PROGRESS`, `BLOCKED`, `BLOQUEADO_EXTERNO`, `ACEITE_RISCO`, `DONE`.
- Esforco: `S`, `M`, `L`.

## Snapshot por macro
| Macro | Total BK | P0 | P1 | P2 |
| --- | --- | --- | --- | --- |
| MF0 | 8 | 6 | 2 | 0 |
| MF1 | 8 | 5 | 3 | 0 |
| MF2 | 8 | 1 | 3 | 4 |
| MF3 | 7 | 4 | 2 | 1 |
| MF4 | 6 | 3 | 3 | 0 |
| MF5 | 6 | 3 | 2 | 1 |
| MF6 | 7 | 5 | 2 | 0 |
| MF7 | 7 | 5 | 2 | 0 |
| MF8 | 17 | 13 | 4 | 0 |

## Tabela global de ligacao BK -> guia -> estado documental
| bk_id | macro | titulo | owner | apoio | prioridade | estado | esforco | dependencias | rf_rnf | fase_documental | sprint | core_or_reforco | proximo_bk | guia |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| BK-MF0-01 | MF0 | Registo de utilizadores com email e password. | Bruna | Izelicks | P0 | TODO | M | - | RF01 | Fase 1 | S01-S02 | Reforco | BK-MF0-02 | [guia](../guias-bk/MF0/BK-MF0-01-registo-de-utilizadores-com-email-e-password.md) |
| BK-MF0-02 | MF0 | Login e logout com sessão segura (cookie HttpOnly). | Bruna | Izelicks | P0 | TODO | M | - | RF02 | Fase 1 | S01-S02 | Reforco | BK-MF0-03 | [guia](../guias-bk/MF0/BK-MF0-02-login-e-logout-com-sessao-segura-cookie-httponly.md) |
| BK-MF0-03 | MF0 | Criação de perfil personalizado com nome, idade, tipo de pele, género e objetivos (ex: hidratar, antiacne). | Bruna | Izelicks | P0 | TODO | M | BK-MF0-01 | RF03 | Fase 1 | S01-S02 | Reforco | BK-MF0-04 | [guia](../guias-bk/MF0/BK-MF0-03-criacao-de-perfil-personalizado-com-nome-idade-tipo-de-pele-genero-e-objetivos-ex-hidratar-antiacne.md) |
| BK-MF0-04 | MF0 | Possibilidade de editar o perfil e atualizar fotografias periodicamente. | Izelicks | Bruna | P1 | TODO | S | BK-MF0-03 | RF04 | Fase 1 | S01-S02 | Core | BK-MF0-05 | [guia](../guias-bk/MF0/BK-MF0-04-possibilidade-de-editar-o-perfil-e-atualizar-fotografias-periodicamente.md) |
| BK-MF0-05 | MF0 | Criação de roles: Cliente, Consultor, Administrador. | Bruna | Izelicks | P0 | TODO | M | BK-MF0-01 | RF05 | Fase 1 | S01-S02 | Reforco | BK-MF0-06 | [guia](../guias-bk/MF0/BK-MF0-05-criacao-de-roles-cliente-consultor-administrador.md) |
| BK-MF0-06 | MF0 | Cada utilizador pode guardar preferências de produtos e marcas favoritas. | Izelicks | Bruna | P1 | TODO | S | BK-MF0-03 | RF06 | Fase 1 | S01-S02 | Core | BK-MF0-07 | [guia](../guias-bk/MF0/BK-MF0-06-cada-utilizador-pode-guardar-preferencias-de-produtos-e-marcas-favoritas.md) |
| BK-MF0-07 | MF0 | Registar produtos com nome, descrição, ingredientes, tipo de pele indicado, imagem, preço e stock. | Bruna | Izelicks | P0 | TODO | M | - | RF07 | Fase 1 | S01-S02 | Reforco | BK-MF0-08 | [guia](../guias-bk/MF0/BK-MF0-07-registar-produtos-com-nome-descricao-ingredientes-tipo-de-pele-indicado-imagem-preco-e-stock.md) |
| BK-MF0-08 | MF0 | Associar categorias (limpeza, maquilhagem, tratamento, protetor solar, etc.). | Bruna | Izelicks | P0 | TODO | M | BK-MF0-07 | RF08 | Fase 1 | S01-S02 | Reforco | BK-MF1-01 | [guia](../guias-bk/MF0/BK-MF0-08-associar-categorias-limpeza-maquilhagem-tratamento-protetor-solar-etc.md) |
| BK-MF1-01 | MF1 | Permitir pesquisa e filtragem por categoria, preço, tipo de pele, marca. | Bruna | Izelicks | P0 | TODO | M | BK-MF0-02, BK-MF0-07, BK-MF0-08 | RF09 | Fase 1 | S03-S04 | Reforco | BK-MF1-02 | [guia](../guias-bk/MF1/BK-MF1-01-permitir-pesquisa-e-filtragem-por-categoria-preco-tipo-de-pele-marca.md) |
| BK-MF1-02 | MF1 | Página de detalhes do produto com descrição completa, imagem, notas de utilizadores e recomendações. | Izelicks | Bruna | P0 | TODO | M | BK-MF0-07, BK-MF1-01 | RF10 | Fase 1 | S03-S04 | Reforco | BK-MF1-03 | [guia](../guias-bk/MF1/BK-MF1-02-pagina-de-detalhes-do-produto-com-descricao-completa-imagem-notas-de-utilizadores-e-recomendacoes.md) |
| BK-MF1-03 | MF1 | Permitir ao cliente avaliar produtos (1–5 estrelas) e deixar comentários. | Aline | Izelicks | P1 | TODO | S | BK-MF0-02, BK-MF0-05, BK-MF1-02 | RF11 | Fase 1 | S03-S04 | Core | BK-MF1-04 | [guia](../guias-bk/MF1/BK-MF1-03-permitir-ao-cliente-avaliar-produtos-1-5-estrelas-e-deixar-comentarios.md) |
| BK-MF1-04 | MF1 | Mostrar produtos semelhantes e complementares (“quem comprou isto também comprou…”). | Izelicks | Bruna | P1 | TODO | S | BK-MF0-07, BK-MF0-08, BK-MF1-02 | RF12 | Fase 1 | S03-S04 | Core | BK-MF1-05 | [guia](../guias-bk/MF1/BK-MF1-04-mostrar-produtos-semelhantes-e-complementares-quem-comprou-isto-tambem-comprou.md) |
| BK-MF1-05 | MF1 | Recolher frontal e perfil com consentimento e controlo de qualidade. | Bruna | Izelicks | P0 | TODO | M | BK-MF0-02, BK-MF0-03 | RF13 | Fase 1 | S03-S04 | Reforco | BK-MF1-06 | [guia](../guias-bk/MF1/BK-MF1-05-permitir-upload-de-fotografias-do-rosto-frontal-e-perfil.md) |
| BK-MF1-06 | MF1 | Analisar fotografias exclusivamente com OpenAI no job da consulta cosmética. | Izelicks | Bruna | P0 | TODO | M | BK-MF1-05 | RF14 | Fase 1 | S03-S04 | Reforco | BK-MF1-07 | [guia](../guias-bk/MF1/BK-MF1-06-o-sistema-deve-analisar-as-fotos-com-ia-para-detetar-tipo-de-pele-acne-manchas-rugas-e-oleosidade.md) |
| BK-MF1-07 | MF1 | Gerar relatório OpenAI v2, revisão/freeze e desbloqueio simulado de 10% com voucher. | Bruna | Izelicks | P0 | TODO | M | BK-MF0-02, BK-MF1-06 | RF15 | Fase 1 | S03-S04 | Reforco | BK-MF1-08 | [guia](../guias-bk/MF1/BK-MF1-07-gerar-um-relatorio-personalizado-com-diagnostico-e-sugestoes-de-rotina.md) |
| BK-MF1-08 | MF1 | Guardar histórico próprio sem expor relatórios bloqueados. | Izelicks | Bruna | P1 | TODO | S | BK-MF0-02, BK-MF1-06, BK-MF1-07 | RF16 | Fase 1 | S03-S04 | Core | BK-MF2-01 | [guia](../guias-bk/MF1/BK-MF1-08-a-analise-deve-ser-guardada-no-historico-pessoal-para-futuras-comparacoes.md) |
| BK-MF2-01 | MF2 | O utilizador pode consultar evolução da pele ao longo do tempo através de gráficos. | Aline | Izelicks | P2 | TODO | S | BK-MF1-08 | RF17 | Fase 1 | S05-S06 | Core | BK-MF2-02 | [guia](../guias-bk/MF2/BK-MF2-01-o-utilizador-pode-consultar-evolucao-da-pele-ao-longo-do-tempo-atraves-de-graficos.md) |
| BK-MF2-02 | MF2 | Gerar no relatório recomendações de produtos/variantes validados. | Izelicks | Bruna | P0 | TODO | M | BK-MF1-06, BK-MF1-07 | RF18 | Fase 1 | S05-S06 | Reforco | BK-MF2-03 | [guia](../guias-bk/MF2/BK-MF2-02-com-base-na-analise-e-historico-o-sistema-recomenda-produtos-personalizados-para-o-utilizador.md) |
| BK-MF2-03 | MF2 | Explicar motivo, utilização e cautelas das recomendações. | Aline | Izelicks | P1 | TODO | S | BK-MF2-02 | RF19 | Fase 1 | S05-S06 | Core | BK-MF2-04 | [guia](../guias-bk/MF2/BK-MF2-03-as-recomendacoes-devem-indicar-motivo-da-sugestao-ex-ajuda-a-reduzir-oleosidade.md) |
| BK-MF2-04 | MF2 | Registar feedback sobre recomendações úteis ou não relevantes, sem treino automático. | Aline | Izelicks | P2 | TODO | S | BK-MF2-02 | RF20 | Fase 1 | S05-S06 | Core | BK-MF2-05 | [guia](../guias-bk/MF2/BK-MF2-04-o-utilizador-pode-marcar-recomendacoes-como-uteis-ou-nao-relevantes-para-treinar-o-modelo.md) |
| BK-MF2-05 | MF2 | Sugerir rotina do relatório com instruções e cautelas. | Izelicks | Bruna | P1 | TODO | S | BK-MF2-02 | RF21 | Fase 1 | S05-S06 | Core | BK-MF2-06 | [guia](../guias-bk/MF2/BK-MF2-05-o-sistema-deve-sugerir-rotinas-diarias-manha-noite-com-base-nos-produtos-adquiridos.md) |
| BK-MF2-06 | MF2 | Rever opcionalmente o relatório e preservar `machineResult`. | Aline | Izelicks | P2 | TODO | S | BK-MF2-02 | RF22 | Fase 1 | S05-S06 | Core | BK-MF2-07 | [guia](../guias-bk/MF2/BK-MF2-06-consultores-podem-rever-recomendacoes-e-sugerir-ajustes-manuais.md) |
| BK-MF2-07 | MF2 | Gerar edição OpenAI de maquilhagem após desbloqueio. | Daniel Bulica | Aline | P2 | TODO | S | BK-MF1-05, BK-MF1-07 | RF23 | Fase 1 | S05-S06 | Core | BK-MF2-08 | [guia](../guias-bk/MF2/BK-MF2-07-permitir-simular-aplicacao-de-maquilhagem-virtual-com-base-na-fotografia-enviada.md) |
| BK-MF2-08 | MF2 | Mostrar original e preview OpenAI lado a lado. | Bruna | Izelicks | P1 | TODO | S | BK-MF2-07 | RF24 | Fase 1 | S05-S06 | Core | BK-MF3-01 | [guia](../guias-bk/MF2/BK-MF2-08-a-ia-deve-gerar-uma-visualizacao-antes-depois-com-os-produtos-recomendados.md) |
| BK-MF3-01 | MF3 | Comparar momentos por data/`selectionKey`, imagens autenticadas `no-store` e tabela de métricas, sem IDs manuais. | Daniel Bulica | Bruna | P2 | TODO | S | BK-MF1-08 | RF25 | Fase 2 | S07-S08 | Core | BK-MF3-02 | [guia](../guias-bk/MF3/BK-MF3-01-o-sistema-deve-permitir-comparar-imagens-antes-vs-apos-30-dias-de-uso.md) |
| BK-MF3-02 | MF3 | Adicionar/remover produtos do carrinho de compras. | Bruna | Izelicks | P0 | TODO | M | BK-MF0-07 | RF26 | Fase 2 | S07-S08 | Reforco | BK-MF3-03 | [guia](../guias-bk/MF3/BK-MF3-02-adicionar-remover-produtos-do-carrinho-de-compras.md) |
| BK-MF3-03 | MF3 | Registar encomendas com o método único Pagamento simulado. | Izelicks | Bruna | P0 | TODO | M | BK-MF3-02 | RF27 | Fase 2 | S07-S08 | Reforco | BK-MF3-04 | [guia](../guias-bk/MF3/BK-MF3-03-registar-encomendas-com-pagamento-simulado.md) |
| BK-MF3-04 | MF3 | Histórico de compras com data, total, produtos e estado (pendente, enviado, entregue). | Bruna | Izelicks | P0 | TODO | M | BK-MF3-03 | RF28 | Fase 2 | S07-S08 | Reforco | BK-MF3-06 | [guia](../guias-bk/MF3/BK-MF3-04-historico-de-compras-com-data-total-produtos-e-estado-pendente-enviado-entregue.md) |
| BK-MF3-06 | MF3 | O cliente pode recomprar produtos anteriores com um clique. | Aline | Izelicks | P1 | TODO | S | BK-MF3-04 | RF30 | Fase 2 | S07-S08 | Core | BK-MF3-07 | [guia](../guias-bk/MF3/BK-MF3-06-o-cliente-pode-recomprar-produtos-anteriores-com-um-clique.md) |
| BK-MF3-07 | MF3 | Dashboard de estatísticas (vendas, produtos mais vendidos, utilizadores ativos). | Aline | Izelicks | P1 | TODO | S | BK-MF3-03 | RF31 | Fase 2 | S07-S08 | Core | BK-MF3-08 | [guia](../guias-bk/MF3/BK-MF3-07-dashboard-de-estatisticas-vendas-produtos-mais-vendidos-utilizadores-ativos.md) |
| BK-MF3-08 | MF3 | Gestão de stock (alertas de baixo stock, atualização automática após compra). | Izelicks | Bruna | P0 | TODO | M | BK-MF3-03 | RF32 | Fase 2 | S07-S08 | Reforco | BK-MF4-01 | [guia](../guias-bk/MF3/BK-MF3-08-gestao-de-stock-alertas-de-baixo-stock-atualizacao-automatica-apos-compra.md) |
| BK-MF4-01 | MF4 | Gestão de utilizadores: ativar, suspender e desativar reversivelmente (`suspended` + revogação de sessões); sem eliminação terminal de dados. | Bruna | Izelicks | P0 | TODO | M | BK-MF0-01 | RF33 | Fase 2 | S08-S09 | Reforco | BK-MF4-02 | [guia](../guias-bk/MF4/BK-MF4-01-gestao-de-utilizadores-ativar-suspender-eliminar-contas.md) |
| BK-MF4-02 | MF4 | Moderação de comentários e avaliações. | Daniel Bulica | Bruna | P1 | TODO | S | BK-MF1-03 | RF34 | Fase 2 | S08-S09 | Core | BK-MF4-03 | [guia](../guias-bk/MF4/BK-MF4-02-moderacao-de-comentarios-e-avaliacoes.md) |
| BK-MF4-03 | MF4 | Exportação administrativa para Excel/PDF, com relatórios IA apenas em metadados. | Aline | Izelicks | P1 | TODO | S | BK-MF3-07 | RF35 | Fase 2 | S08-S09 | Core | BK-MF4-04 | [guia](../guias-bk/MF4/BK-MF4-03-exportacao-de-dados-para-excel-pdf-vendas-relatorios-de-ia-utilizadores.md) |
| BK-MF4-04 | MF4 | Enviar notificações sobre promoções, novos produtos e estado das encomendas. | Izelicks | Bruna | P0 | TODO | M | BK-MF3-03 | RF36 | Fase 2 | S08-S09 | Reforco | BK-MF4-05 | [guia](../guias-bk/MF4/BK-MF4-04-enviar-notificacoes-sobre-promocoes-novos-produtos-e-estado-das-encomendas.md) |
| BK-MF4-05 | MF4 | Enviar alertas personalizados (“Está na hora da sua rotina noturna”). | Izelicks | Bruna | P1 | TODO | S | BK-MF2-05 | RF37 | Fase 2 | S08-S09 | Core | BK-MF4-08 | [guia](../guias-bk/MF4/BK-MF4-05-enviar-alertas-personalizados-esta-na-hora-da-sua-rotina-noturna.md) |
| BK-MF4-08 | MF4 | Guardar alergias, ingredientes a evitar e restrições médicas leves no perfil e impedir recomendações que violem regras. | Izelicks | Bruna | P0 | TODO | M | BK-MF0-03 | RF40 | Fase 2 | S08-S09 | Reforco | BK-MF5-01 | [guia](../guias-bk/MF4/BK-MF4-08-guardar-alergias-ingredientes-a-evitar-e-restricoes-medicas-leves-no-perfil-e-impedir-recomendacoes-que-violem-regras.md) |
| BK-MF5-01 | MF5 | Painel administrativo para rever, decidir e repetir pedidos de eliminação/anonymização de fotografias e relatórios. | Izelicks | Bruna | P0 | TODO | M | BK-MF1-05 | RF41 | Fase 2 | S09-S10 | Reforco | BK-MF5-04 | [guia](../guias-bk/MF5/BK-MF5-01-painel-para-consultores-admins-reverem-e-aprovarem-pedidos-de-eliminacao-anonymizacao-de-fotografias-e-relatorios.md) |
| BK-MF5-04 | MF5 | Registo/auditoria de acessos a dados biométricos, com alertas para usos indevidos. | Bruna | Izelicks | P1 | TODO | S | BK-MF1-05 | RF44 | Fase 2 | S09-S10 | Core | BK-MF5-05 | [guia](../guias-bk/MF5/BK-MF5-04-registo-auditoria-de-acessos-a-dados-biometricos-com-alertas-para-usos-indevidos.md) |
| BK-MF5-05 | MF5 | Interface moderna, intuitiva e _responsive_ (desktop e mobile). | Aline | Izelicks | P0 | TODO | M | - | RNF01 | Fase 2 | S09-S10 | Reforco | BK-MF5-06 | [guia](../guias-bk/MF5/BK-MF5-05-interface-moderna-intuitiva-e-responsive-desktop-e-mobile.md) |
| BK-MF5-06 | MF5 | Design coerente com estética da marca (cores suaves, tipografia moderna). | Aline | Izelicks | P1 | TODO | S | - | RNF02 | Fase 2 | S09-S10 | Core | BK-MF5-07 | [guia](../guias-bk/MF5/BK-MF5-06-design-coerente-com-estetica-da-marca-cores-suaves-tipografia-moderna.md) |
| BK-MF5-07 | MF5 | Mensagens claras, ícones acessíveis e feedback imediato em formulários. | Bruna | Izelicks | P0 | TODO | M | - | RNF03 | Fase 2 | S09-S10 | Reforco | BK-MF5-08 | [guia](../guias-bk/MF5/BK-MF5-07-mensagens-claras-icones-acessiveis-e-feedback-imediato-em-formularios.md) |
| BK-MF5-08 | MF5 | Modo escuro e contraste ajustado. | Daniel Bulica | Aline | P2 | TODO | S | - | RNF04 | Fase 2 | S09-S10 | Core | BK-MF6-01 | [guia](../guias-bk/MF5/BK-MF5-08-modo-escuro-e-contraste-ajustado.md) |
| BK-MF6-01 | MF6 | Executar operações OpenAI como jobs retomáveis com deadlines configurados. | Izelicks | Bruna | P0 | TODO | M | - | RNF05 | Fase 3 | S10-S11 | Reforco | BK-MF6-02 | [guia](../guias-bk/MF6/BK-MF6-01-processar-analise-de-fotografia-em-menos-de-10-segundos.md) |
| BK-MF6-02 | MF6 | Páginas principais devem carregar em ≤ 3 segundos. | Aline | Izelicks | P0 | TODO | M | - | RNF06 | Fase 3 | S10-S11 | Reforco | BK-MF6-03 | [guia](../guias-bk/MF6/BK-MF6-02-paginas-principais-devem-carregar-em-3-segundos.md) |
| BK-MF6-03 | MF6 | Suportar mínimo 50 utilizadores simultâneos sem falhas. | Aline | Izelicks | P1 | TODO | S | - | RNF07 | Fase 3 | S10-S11 | Core | BK-MF6-04 | [guia](../guias-bk/MF6/BK-MF6-03-suportar-minimo-50-utilizadores-simultaneos-sem-falhas.md) |
| BK-MF6-04 | MF6 | Imagens otimizadas (lazy loading e compressão automática). | Daniel Bulica | Aline | P1 | TODO | S | - | RNF08 | Fase 3 | S10-S11 | Core | BK-MF6-05 | [guia](../guias-bk/MF6/BK-MF6-04-imagens-otimizadas-lazy-loading-e-compressao-automatica.md) |
| BK-MF6-05 | MF6 | Todas as comunicações via HTTPS (TLS 1.2+). | Bruna | Izelicks | P0 | TODO | M | - | RNF09 | Fase 3 | S10-S11 | Reforco | BK-MF6-06 | [guia](../guias-bk/MF6/BK-MF6-05-todas-as-comunicacoes-via-https-tls-1-2.md) |
| BK-MF6-06 | MF6 | Palavras-passe com hash seguro (bcrypt). | Izelicks | Bruna | P0 | TODO | M | - | RNF10 | Fase 3 | S10-S11 | Reforco | BK-MF6-07 | [guia](../guias-bk/MF6/BK-MF6-06-palavras-passe-com-hash-seguro-bcrypt.md) |
| BK-MF6-07 | MF6 | Fotografias e relatórios de análise armazenados de forma encriptada. | Aline | Izelicks | P0 | TODO | M | - | RNF11 | Fase 3 | S10-S11 | Reforco | BK-MF7-01 | [guia](../guias-bk/MF6/BK-MF6-07-fotografias-e-relatorios-de-analise-armazenados-de-forma-encriptada.md) |
| BK-MF7-01 | MF7 | Consentimento v2 e propósitos separados para consulta OpenAI. | Bruna | Izelicks | P0 | TODO | M | - | RNF12 | Fase 3 | S11-S12 | Reforco | BK-MF7-02 | [guia](../guias-bk/MF7/BK-MF7-01-consentimento-explicito-para-analise-facial-rgpd.md) |
| BK-MF7-02 | MF7 | Direito a pedidos canónicos de privacidade e eliminação terminal da própria conta; decisões destrutivas só por administrador. | Izelicks | Bruna | P0 | TODO | M | - | RNF13 | Fase 3 | S11-S12 | Reforco | BK-MF7-03 | [guia](../guias-bk/MF7/BK-MF7-02-direito-a-eliminar-conta-e-dados-incluindo-fotos.md) |
| BK-MF7-03 | MF7 | Sessões autenticadas com cookies HttpOnly. | Aline | Izelicks | P0 | TODO | M | - | RNF14 | Fase 3 | S11-S12 | Reforco | BK-MF7-04 | [guia](../guias-bk/MF7/BK-MF7-03-sessoes-autenticadas-com-cookies-httponly.md) |
| BK-MF7-04 | MF7 | Compatível com Chrome, Safari, Edge e Firefox. | Bruna | Izelicks | P0 | TODO | M | - | RNF15 | Fase 3 | S11-S12 | Reforco | BK-MF7-05 | [guia](../guias-bk/MF7/BK-MF7-04-compativel-com-chrome-safari-edge-e-firefox.md) |
| BK-MF7-05 | MF7 | Exportação PDF administrativa minimizada; relatórios IA apenas em metadados. | Daniel Bulica | Bruna | P1 | TODO | S | - | RNF16 | Fase 3 | S11-S12 | Core | BK-MF7-06 | [guia](../guias-bk/MF7/BK-MF7-05-exportacao-de-relatorios-em-pdf.md) |
| BK-MF7-06 | MF7 | Validar Pagamento simulado sem integração financeira externa. | Bruna | Daniel Bulica | P0 | TODO | M | - | RNF17 | Fase 3 | S11-S12 | Reforco | BK-MF7-07 | [guia](../guias-bk/MF7/BK-MF7-06-validar-pagamento-simulado-sem-integracao-externa.md) |
| BK-MF7-07 | MF7 | Integração OpenAI-only resiliente e degradável. | Aline | Izelicks | P1 | TODO | S | - | RNF18 | Fase 3 | S11-S12 | Core | BK-MF8-01 | [guia](../guias-bk/MF7/BK-MF7-07-suporte-para-api-de-ia-externa-ex-azure-face-api-ou-tensorflow.md) |
| BK-MF8-01 | MF8 | Código modular (MVC) com documentação e _docstrings_. | Izelicks | Bruna | P0 | TODO | M | - | RNF19 | Fase 3 | S12 | Reforco | BK-MF8-02 | [guia](../guias-bk/MF8/BK-MF8-01-codigo-modular-mvc-com-documentacao-e-docstrings.md) |
| BK-MF8-02 | MF8 | Logs de erros e métricas de desempenho. | Daniel Bulica | Bruna | P1 | TODO | S | - | RNF20 | Fase 3 | S12 | Core | BK-MF8-03 | [guia](../guias-bk/MF8/BK-MF8-02-logs-de-erros-e-metricas-de-desempenho.md) |
| BK-MF8-03 | MF8 | Ambiente de testes isolado da base local principal da demonstração académica. | Daniel Bulica | Bruna | P1 | TODO | S | - | RNF22 | Fase 3 | S11-S12 | Core | BK-MF8-04 | [guia](../guias-bk/MF8/BK-MF8-03-ambiente-de-testes-separado-do-ambiente-de-producao.md) |
| BK-MF8-04 | MF8 | Snapshot diário EJSON cifrado, recuperável e verificado da base académica local. | Daniel Bulica | Aline | P1 | TODO | S | BK-MF8-03 | RNF21 | Fase 3 | S11-S12 | Core | BK-MF8-05 | [guia](../guias-bk/MF8/BK-MF8-04-base-de-dados-com-backups-automaticos-diarios.md) |
| BK-MF8-05 | MF8 | A IA deve indicar como chegou às recomendações (explicabilidade). | Aline | Izelicks | P0 | TODO | M | BK-MF7-07 | RNF23 | Fase 3 | S12 | Reforco | BK-MF8-06 | [guia](../guias-bk/MF8/BK-MF8-05-a-ia-deve-indicar-como-chegou-as-recomendacoes-explicabilidade.md) |
| BK-MF8-06 | MF8 | Aplicar controlos para reduzir risco de discriminação e testar invariância das recomendações. | Bruna | Izelicks | P0 | TODO | M | BK-MF8-05 | RNF24 | Fase 3 | S12 | Reforco | BK-MF8-07 | [guia](../guias-bk/MF8/BK-MF8-06-o-sistema-deve-garantir-nao-discriminacao-por-genero-idade-ou-tom-de-pele.md) |
| BK-MF8-07 | MF8 | As imagens processadas não devem ser usadas para treinar modelos externos sem consentimento. | Izelicks | Daniel Bulica | P0 | TODO | M | BK-MF7-01, BK-MF7-07 | RNF25 | Fase 3 | S12 | Reforco | BK-MF8-08 | [guia](../guias-bk/MF8/BK-MF8-07-as-imagens-processadas-nao-devem-ser-usadas-para-treinar-modelos-externos-sem-consentimento.md) |
| BK-MF8-08 | MF8 | Sessão guiada de avaliação cosmética com IA. | Bruna | Izelicks | P0 | TODO | M | BK-MF1-06, BK-MF1-07, BK-MF7-01 | RF42 | Fase 3 | S11-S12 | Reforco | BK-MF8-09 | [guia](../guias-bk/MF8/BK-MF8-08-sessao-guiada-de-avaliacao-cosmetica-com-ia.md) |
| BK-MF8-09 | MF8 | Histórico seguro da interação cliente-IA. | Izelicks | Bruna | P0 | TODO | M | BK-MF8-08, BK-MF6-07 | RF47, RNF30 | Fase 3 | S11-S12 | Reforco | BK-MF8-10 | [guia](../guias-bk/MF8/BK-MF8-09-historico-seguro-da-interacao-cliente-ia.md) |
| BK-MF8-10 | MF8 | Recomendações enriquecidas pela última sessão submetida resolvida no backend, com persistência transacional e sem IDs no browser. | Izelicks | Aline | P0 | TODO | M | BK-MF2-02, BK-MF4-08, BK-MF8-09 | RF43, RNF23 | Fase 3 | S11-S12 | Reforco | BK-MF8-11 | [guia](../guias-bk/MF8/BK-MF8-10-recomendacoes-enriquecidas-com-respostas-da-avaliacao-guiada.md) |
| BK-MF8-11 | MF8 | Revisão humana auditada com `machineResult`/`humanOverride`, transação e CAS `409`. | Aline | Izelicks | P0 | TODO | M | BK-MF2-06, BK-MF8-09, BK-MF8-10 | RF45, RNF31 | Fase 3 | S11-S12 | Reforco | BK-MF8-12 | [guia](../guias-bk/MF8/BK-MF8-11-revisao-humana-de-sessoes-ia-por-consultores.md) |
| BK-MF8-12 | MF8 | Insights/correções do consultor visíveis para o cliente. | Bruna | Aline | P1 | TODO | S | BK-MF8-11 | RF46 | Fase 3 | S12 | Core | BK-MF8-13 | [guia](../guias-bk/MF8/BK-MF8-12-insights-correcoes-do-consultor-visiveis-para-o-cliente.md) |
| BK-MF8-13 | MF8 | Interface integrada cliente/consultor para consulta assistida. | Aline | Bruna | P0 | TODO | M | BK-MF8-08, BK-MF8-09, BK-MF8-10, BK-MF8-11, BK-MF8-12 | RF42, RF45, RF46, RNF26 | Fase 3 | S11-S12 | Reforco | BK-MF8-14 | [guia](../guias-bk/MF8/BK-MF8-13-interface-integrada-cliente-consultor-para-consulta-assistida.md) |
| BK-MF8-14 | MF8 | Aproximação da UI ao mockup; revisão manual/Figma dispensada no alvo académico/local, com paridade visual não demonstrada. | Aline | Bruna | P0 | ACEITE_RISCO | M | BK-MF5-05, BK-MF5-06, BK-MF5-07, BK-MF8-13 | RNF26 | Fase 3 | S11-S12 | Reforco | BK-MF8-15 | [guia](../guias-bk/MF8/BK-MF8-14-aproximacao-da-ui-a-ui-do-mockup.md) |
| BK-MF8-15 | MF8 | Verificação dos testes atuais e criação dos testes em falta. | Daniel Bulica | Izelicks | P0 | TODO | M | BK-MF8-03, BK-MF8-14 | RNF27 | Fase 3 | S12 | Reforco | BK-MF8-16 | [guia](../guias-bk/MF8/BK-MF8-15-verificacao-dos-testes-atuais-e-criacao-dos-testes-em-falta.md) |
| BK-MF8-16 | MF8 | Execução final de testes com evidências. | Bruna | Daniel Bulica | P0 | TODO | S | BK-MF8-14, BK-MF8-15 | RNF28 | Fase 3 | S12 | Reforco | BK-MF8-17 | [guia](../guias-bk/MF8/BK-MF8-16-execucao-final-de-testes-com-evidencias.md) |
| BK-MF8-17 | MF8 | Correção dos erros encontrados e reexecução dos testes afetados. | Izelicks | Bruna | P0 | TODO | M | BK-MF8-16 | RNF29 | Fase 3 | S12 | Reforco | - | [guia](../guias-bk/MF8/BK-MF8-17-correcao-dos-erros-encontrados-e-reexecucao-dos-testes-afetados.md) |

## Navegacao por macro (IDs BK)
- Contrato editorial: estado/sprint vivem na tabela global; as secoes abaixo sao apenas navegacao por IDs BK.

### MF0 - Fundamentos e governance
- `BK-MF0-01`, `BK-MF0-02`, `BK-MF0-03`, `BK-MF0-04`, `BK-MF0-05`, `BK-MF0-06`, `BK-MF0-07`, `BK-MF0-08`

### MF1 - Nucleo funcional I
- `BK-MF1-01`, `BK-MF1-02`, `BK-MF1-03`, `BK-MF1-04`, `BK-MF1-05`, `BK-MF1-06`, `BK-MF1-07`, `BK-MF1-08`

### MF2 - Nucleo funcional II
- `BK-MF2-01`, `BK-MF2-02`, `BK-MF2-03`, `BK-MF2-04`, `BK-MF2-05`, `BK-MF2-06`, `BK-MF2-07`, `BK-MF2-08`

### MF3 - Capacidades de produto I
- `BK-MF3-01`, `BK-MF3-02`, `BK-MF3-03`, `BK-MF3-04`, `BK-MF3-06`, `BK-MF3-07`, `BK-MF3-08`

### MF4 - Capacidades de produto II
- `BK-MF4-01`, `BK-MF4-02`, `BK-MF4-03`, `BK-MF4-04`, `BK-MF4-05`, `BK-MF4-08`

### MF5 - Operacao e fluxos transversais
- `BK-MF5-01`, `BK-MF5-04`, `BK-MF5-05`, `BK-MF5-06`, `BK-MF5-07`, `BK-MF5-08`

### MF6 - Qualidade e robustez
- `BK-MF6-01`, `BK-MF6-02`, `BK-MF6-03`, `BK-MF6-04`, `BK-MF6-05`, `BK-MF6-06`, `BK-MF6-07`

### MF7 - Privacidade, seguranca e controlo
- `BK-MF7-01`, `BK-MF7-02`, `BK-MF7-03`, `BK-MF7-04`, `BK-MF7-05`, `BK-MF7-06`, `BK-MF7-07`

### MF8 - Consulta IA guiada, revisão humana, UI e testes finais
- `BK-MF8-01`, `BK-MF8-02`, `BK-MF8-03`, `BK-MF8-04`, `BK-MF8-05`, `BK-MF8-06`, `BK-MF8-07`, `BK-MF8-08`, `BK-MF8-09`, `BK-MF8-10`, `BK-MF8-11`, `BK-MF8-12`, `BK-MF8-13`, `BK-MF8-14`, `BK-MF8-15`, `BK-MF8-16`, `BK-MF8-17`

## Changelog
- `2026-07-09`: RF27/RNF17 alinhados ao método único Pagamento simulado; RNF21 concretizado como snapshot EJSON cifrado com restore `_restore`, retenção sete e prova replica-set pendente; RNF22 limitado ao ambiente académico/local; BK-MF8-14 marcado `BLOQUEADO_EXTERNO`.
- `2026-07-10` — histórico supersedido pela linha seguinte: BK-MF8-14 foi temporariamente reaberto para comparação manual após aparecer `mockup/`, sem alegação de aprovação ou conformidade visual.
- `2026-07-10`: estado corrente sobrepõe a linha anterior: BK-MF8-14/RNF26 ficam `ACEITE_RISCO`; revisão manual/Figma dispensada, sem alegação de aprovação ou paridade visual.
- `2026-06-30`: MF8 expandida para 17 BKs com consulta IA guiada, revisão humana, UI integrada e testes finais em BK-MF8-15..17.
- `2026-06-29`: MF8 expandida na primeira versão de fecho visual, cobertura de testes, execução final e correção/revalidação.
- `2026-04-12`: backlog canónico base da Orelle.
- `2026-04-14`: backlog normalizado com metadados completos, sprint em 12 semanas e naming semantico de guias.
- `2026-04-17`: removidos BK/RF fora do escopo PAP, ajustadas cadeias de `proximo_bk`, sprint normalizado para `Sxx`/`Sxx,Syy` e secoes macro convertidas para navegacao por IDs.
