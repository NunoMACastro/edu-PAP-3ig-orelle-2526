# Orélle

## Metadados
- Nome da app: Orélle
- Ano letivo: 2025/2026
- Turma: 12º IG
- Nome dos alunos: Bruna, Aline, Daniel Bulica, Izelicks
- Orientador: Nuno Castro e Cláudia Marques

## 1. Visão Geral Extensa da Aplicação
A Orélle é uma plataforma académica de orientação cosmética que integra análise assistida, recomendação personalizada e uma experiência de encomenda demonstrativa. O sistema foi pensado para transformar aconselhamento de skincare e maquilhagem em processos consistentes, rastreáveis e pedagogicamente explicáveis, evitando apresentar resultados cosméticos como diagnóstico médico.

No âmbito da PAP, a Orélle representa um caso de produto digital com uso aplicado de IA em contexto sensível (dados biométricos). Por isso, além da componente funcional, o projeto enfatiza consentimento, proteção de dados, transparência de recomendações e limites claros entre MVP e funcionalidades de experiência premium.

## 2. Problema que Resolve e Proposta de Valor
A maioria das experiências de cosmética digital apresenta duas limitações: pouca personalização cosmética e fraca continuidade de acompanhamento. A Orélle resolve isto ao combinar:

- avaliação cosmética inicial assistida a partir de imagens do rosto;
- recomendação de rotina e produtos com racional explícito;
- evolução temporal do estado de pele para acompanhamento;
- pré-visualização de maquilhagem sobre a fotografia autorizada do cliente, gerada a pedido para apoio à decisão.

A proposta de valor da Orélle é unir aconselhamento técnico, visualização prática e privacidade biométrica num único fluxo de produto.

## 3. Público-Alvo e Stakeholders
- clientes finais que procuram orientação personalizada de skincare e maquilhagem;
- consultores/especialistas que validam e ajustam recomendações;
- equipa administrativa que gere catálogo, stock, métricas e conformidade;
- equipa técnica responsável pela integração de IA, segurança e operação.

## 4. Funcionalidades Principais por Domínio Funcional
### 4.1 Identidade e perfil do utilizador
- registo, autenticação e gestão de perfil;
- recolha de objetivos, preferências e restrições relevantes;
- histórico de avaliações para continuidade de aconselhamento.

### 4.2 Consulta cosmética OpenAI (núcleo obrigatório)
- escolha de um objetivo principal e até dois secundários entre acne e imperfeições, hidratação e barreira, controlo de oleosidade, sensibilidade e vermelhidão, manchas/tom/luminosidade, proteção solar e maquilhagem;
- consentimento OpenAI v2 e envio de fotografias frontal e de perfil/ângulo lateral, com instruções de captura;
- preflight local com MediaPipe e nova validação técnica no backend antes de enviar dados à OpenAI; qualidade remota `pass`, `warning` ou `inconclusive`;
- análise cosmética OpenAI seguida de 5–8 perguntas estruturadas, escolhidas dinamicamente segundo os objetivos e os factos ainda em falta;
- jobs duráveis e idempotentes para análise, pergunta seguinte, relatório e imagem, permitindo retomar a consulta após reload ou falha recuperável;
- relatório estruturado com observações, respostas resumidas, rotina, produtos, cautelas, provenance e limitações, sem se apresentar como diagnóstico médico.

### 4.3 Evolução temporal e acompanhamento
- visualização da evolução ao longo do tempo;
- comparação entre avaliações passadas e atuais;
- apoio a decisões de ajuste de rotina com base em progressão observada.

### 4.4 Pré-visualização OpenAI e comparação (núcleo obrigatório)
- edição fotorrealista de maquilhagem gerada pela OpenAI apenas depois de o relatório estar desbloqueado, mediante pedido e consentimento generativo próprios;
- uso exclusivo da fotografia frontal e das variantes recomendadas na versão congelada, sem prompt livre nem produtos adicionais;
- original e resultado apresentados lado a lado com o aviso de que a pré-visualização é gerada por IA e o resultado real pode variar;
- para objetivos que não sejam maquilhagem, nunca é fabricada uma “pele futura”; a evolução real continua a ser comparada por datas, imagens autorizadas e métricas;
- outputs cifrados, privados, sem EXIF e com expiração de sete dias.

### 4.5 Recomendação e rotina personalizada
- pré-filtragem no backend por objetivos, pele, alergias, ingredientes a evitar, orçamento e elegibilidade; a OpenAI recebe no máximo 15 candidatos minimizados;
- a OpenAI só pode devolver IDs e variantes dessa allowlist, e o backend volta a validar restrições, stock e preço;
- relatório com 3–5 produtos quando o catálogo elegível o permitir, incluindo indisponíveis claramente identificados e sem ação de compra;
- explicação do motivo, forma de utilização e cautelas de cada sugestão;
- recolha de feedback do utilizador para afinação progressiva de relevância;
- resultado automático (`machineResult`) imutável e separado da correção humana (`humanOverride`), com decisões concorrentes protegidas e auditadas.

### 4.6 Comércio e operação
- catálogo, carrinho e checkout com o método único «Pagamento simulado»;
- fluxo em dois passos: criar checkout pendente e carregar em «Simular pagamento», sem qualquer cobrança;
- opção entre aceitar o relatório IA ou pedir revisão humana antes de congelar a versão final;
- no congelamento, snapshot de recomendações, variantes, preços e disponibilidade; produtos indisponíveis permanecem explicados, mas não entram no valor elegível;
- desbloqueio por uma segunda simulação separada, calculada por `depositCents = ceil(recommendedTotalCents × 1000 / 10000)`, isto é, 10% de uma unidade de cada recomendação disponível;
- criação transacional e idempotente de voucher pelo mesmo valor simulado, sem afetar stock ou carrinho; sem produtos disponíveis, o relatório é desbloqueado sem pagamento e sem voucher de valor zero;
- gestão de encomendas e histórico de compra;
- painel operacional mínimo para administração.

### 4.7 Privacidade biométrica e conformidade
- consentimentos separados para consulta OpenAI, edição generativa e acesso temporário do consultor às fotografias;
- envio minimizado à OpenAI: fotografias autorizadas, respostas/factos necessários, perfil mínimo e catálogo filtrado, sem nome, email ou IDs pessoais/operacionais; apenas `productId`/`variantId` opacos da allowlist comercial podem seguir para permitir seleção verificável;
- grant fotográfico do consultor explícito por relatório, revogável e com duração máxima de sete dias; leituras são auditadas e as fotografias não carregam por defeito;
- pedidos canónicos de eliminação/anonimização, retry idempotente e confirmação de ausência física dos ficheiros abrangidos;
- `DELETE /api/admin/users/:id` executa apenas **Desativar**: preserva email e dados, muda a conta para `suspended`, revoga as sessões na mesma transação e permite reativação posterior; não substitui o direito de eliminação do titular;
- eliminação da própria conta com password, confirmação `ELIMINAR`, revogação de sessões e estado terminal;
- AES-GCM contextual v2 para dados sensíveis e derivados, com fronteiras append-only 005/006/008/009, owner/AAD exatos e dump sem plaintext; a 006 lê apenas os campos humanos legados necessários ao split máquina/humano e recifra-os de imediato, enquanto a 009 cifra motivos de privacidade, recifra fotografias e instala a barreira transacional contra novas escritas faciais durante destruição/revogação;
- trilho de auditoria para operações sensíveis.

Fontes funcionais canónicas: [docs/RF.md](docs/RF.md), [docs/planificacao/backlogs/BACKLOG-MVP.md](docs/planificacao/backlogs/BACKLOG-MVP.md).

## 5. Arquitetura/Stack Recomendada (Alto Nível)
- frontend React/Vite conduzido por `flowState` do backend, com preflight MediaPipe carregado dinamicamente e assets servidos localmente;
- backend Node.js/Express/Mongoose modular (identidade, consulta, jobs, relatório, recomendação, comércio e privacidade);
- OpenAI Responses API para texto + imagem e Structured Outputs validados localmente; Image API para a edição de maquilhagem;
- MongoDB para sessões, relatórios e jobs duráveis com claim, lease, heartbeat, retry e recuperação após restart;
- Busboy e Sharp para upload limitado, validação, normalização WebP, remoção de EXIF e armazenamento privado cifrado;
- lógica de negócio autoritativa no backend: consentimento, autorização, catálogo, restrições, preços, 10%, pagamento simulado e voucher nunca são delegados ao modelo.

### 5.1 Configuração OpenAI

- novas operações IA exigem `OPENAI_API_KEY` e storage sensível configurado (`DATA_ENCRYPTION_KEY` com pelo menos 32 caracteres fora de teste); sem chave a capability devolve `AI_NOT_CONFIGURED`, e sem storage seguro devolve `AI_STORAGE_NOT_CONFIGURED`, mantendo autenticação, conta, catálogo, carrinho e loja disponíveis;
- modelos configuráveis: `OPENAI_ANALYSIS_MODEL` (default `gpt-5.4-mini`), `OPENAI_FALLBACK_MODEL` (default `gpt-5.4`) e `OPENAI_IMAGE_MODEL` (default `gpt-image-2`);
- versões persistidas: `OPENAI_NOTICE_VERSION`, `OPENAI_PROMPT_VERSION`, `OPENAI_SCHEMA_VERSION`, `OPENAI_IMAGE_PROMPT_VERSION` e `OPENAI_IMAGE_SCHEMA_VERSION`;
- timeouts configuráveis: 30 s para pergunta, 60 s para análise, 60 s para relatório e 150 s para imagem;
- “fallback” significa retry limitado do modelo primário e uma tentativa noutro modelo OpenAI. Nunca existe análise, relatório ou imagem sintética local para substituir uma falha total; apenas a escolha da pergunta seguinte pode recorrer ao banco canónico de perguntas já definido pelo backend.
- a edição com GPT Image pode exigir API Organization Verification na conta OpenAI; se a conta não estiver elegível, o preview fica bloqueado externamente sem invalidar relatório, unlock ou voucher.

### 5.2 Arranque académico local

Na implementação dos alunos, entra em `apps/api` e executa `npm run dev:local`; o guia completo está em [MF8 — Arranque local](docs/planificacao/guias-bk/MF8/00-ARRANQUE-LOCAL.md). O comando não carrega `.env` nem MongoDB remoto: cria um replica set efémero, aplica migrações e prepara idempotentemente 8 contas, 4 categorias, 25 produtos e 5 cenários de cliente.

A base é descartável. Ao parar/reiniciar o comando, consultas, encomendas e alterações locais desaparecem e as seeds são reaplicadas; isto não corresponde a apagar a base remota. Por defeito a OpenAI fica degradada. Para a ativar no mesmo runtime isolado, é obrigatório o opt-in `ORELLE_LOCAL_OPENAI_ENABLED=true` com `OPENAI_API_KEY` explicitamente exportada; o runner preserva apenas configuração OpenAI allowlisted e gera a chave de cifra local.

Todas as contas usam a password estritamente local `OrelleDemo123!`. O runner não imprime credenciais e estas contas desaparecem com a base efémera.

| Conta | Cenário local preparado |
|---|---|
| `admin@orelle.test` | Administração, vendas simuladas, avaliações e utilizadores. |
| `consultor@orelle.test` | Fila de revisão humana, incluindo uma consulta pendente. |
| `consultor.skincare@orelle.test` | Segundo perfil de consultoria para demonstrações de roles. |
| `cliente@orelle.test` | Percurso principal completo: perfil, consultas, evolução, rotina, compras e notificações. |
| `cliente.maria@orelle.test` | Cliente recorrente com encomendas e avaliações. |
| `cliente.ines@orelle.test` | Consulta iniciada e pronta para receber fotografias. |
| `cliente.joao@orelle.test` | Relatório sintético a aguardar revisão humana. |
| `cliente.sofia@orelle.test` | Conta recente sem perfil, destinada ao onboarding. |

As fotografias dos cenários são ilustrações sintéticas geradas localmente. São normalizadas, têm os metadados removidos e ficam cifradas no storage privado pelo mesmo fluxo usado pela aplicação; os relatórios associados estão marcados como demonstração e não executam chamadas OpenAI durante o seed.

## 6. Escopo MVP vs Pós-PAP
### MVP (incluído)
- consulta OpenAI com sete objetivos, frontal + perfil, controlo de qualidade e 5–8 perguntas dinâmicas;
- relatório estruturado, histórico e revisão humana opcional antes do congelamento;
- evolução temporal funcional;
- recomendações validadas contra produtos/variantes reais e pré-visualização OpenAI de maquilhagem a pedido depois do desbloqueio;
- 10% simulado convertido em voucher para a loja;
- pagamento exclusivamente simulado, sem provider financeiro, redirect financeiro/externo, chave, chamada externa ou movimentação de dinheiro; a navegação interna same-origin depois da confirmação continua permitida;
- privacidade biométrica, consentimentos separados e eliminação dos dados derivados como requisitos obrigatórios.

### Pós-PAP (adiado)
- novos objetivos e maior profundidade cosmética, depois de validação pedagógica;
- automações comerciais complexas e comunicações avançadas;
- otimizações de custo, latência e avaliação do provider com um conjunto de casos consentidos.

> Estado de implementação e evidência atual: [plano vivo da consulta cosmética OpenAI](docs/planificacao/PLANO-IMPLEMENTACAO-CONSULTA-IA-OPENAI-real_dev.md). O projeto tem alvo académico/local; o documento distingue contratos validados, trabalho em curso e blockers externos.

## 7. Requisitos Não Funcionais Críticos
- segurança e proteção de dados biométricos;
- consentimento, transparência e direito ao apagamento;
- desempenho aceitável na análise e na visualização;
- estabilidade da experiência em desktop e mobile;
- documentação e rastreabilidade alinhadas com backlog canónico.

Fonte canónica RNF: [docs/RNF.md](docs/RNF.md).

## 8. Roadmap Resumido por Fases
1. onboarding, perfil e catálogo base;
2. objetivos, consentimento, fotografias, qualidade e conversa OpenAI;
3. relatório, revisão, congelamento, 10% simulado, voucher e preview de maquilhagem;
4. histórico/evolução, privacidade, qualidade transversal e evidência documental.

## 9. Créditos, Licença e Changelog
### Créditos
- Projeto: Orélle
- Tipo: PAP - Curso Profissional de Informática de Gestão
- Ano letivo: 2025/2026
- Equipa: Bruna, Aline, Daniel Bulica, Izelicks
- Orientador: Nuno Castro e Cláudia Marques

### Licença
Projeto académico para fins educativos.

### Changelog
- 2026-07-11: README sincronizado com a consulta OpenAI-only de sete objetivos, jobs retomáveis, controlo fotográfico, revisão/congelamento, fórmula dos 10%, voucher e edição OpenAI de maquilhagem.
- 2026-07-10: privacidade, consulta guiada/revisão humana, comparação conceptual e estado do mockup reconciliados com os contratos atuais.
- 2026-07-09: pagamento limitado a simulação académica, linguagem de IA/simulação tornada explícita e ligação ao report vivo da auditoria.
- 2026-04-17: README reescrito integralmente com estrutura canónica e reforço dos núcleos obrigatórios (análise facial, multi-ângulo, evolução temporal e simulação).
