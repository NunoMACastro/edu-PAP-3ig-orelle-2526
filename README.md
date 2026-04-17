# Orélle

## Metadados
- Nome da app: Orélle
- Ano letivo: 2025/2026
- Turma: 12º IG
- Nome dos alunos: Bruna, Aline, Daniel Bulica, Aline
- Orientador: Nuno Castro e Cláudia Marques

## 1. Visão Geral Extensa da Aplicação
A Orélle é uma plataforma de consultoria cosmética inteligente que integra análise facial por IA, recomendação personalizada e experiência de compra orientada por dados. O sistema foi pensado para transformar aconselhamento de skincare e maquilhagem em processos consistentes, rastreáveis e pedagogicamente explicáveis, evitando respostas genéricas e promovendo acompanhamento evolutivo do utilizador.

No âmbito da PAP, a Orélle representa um caso de produto digital com uso aplicado de IA em contexto sensível (dados biométricos). Por isso, além da componente funcional, o projeto enfatiza consentimento, proteção de dados, transparência de recomendações e limites claros entre MVP e funcionalidades de experiência premium.

## 2. Problema que Resolve e Proposta de Valor
A maioria das experiências de cosmética digital apresenta duas limitações: pouca personalização clínica e fraca continuidade de acompanhamento. A Orélle resolve isto ao combinar:

- diagnóstico inicial com apoio de IA a partir de imagens do rosto;
- recomendação de rotina e produtos com racional explícito;
- evolução temporal do estado de pele para acompanhamento;
- simulação visual de maquilhagem/antes-depois para apoio à decisão.

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

### 4.2 Análise facial por IA (núcleo obrigatório)
- upload multi-ângulo em modo MVP controlado (frontal e perfil);
- deteção assistida de sinais relevantes (ex.: oleosidade, acne, textura);
- geração de relatório com pontos de atenção e recomendações iniciais;
- armazenamento histórico para comparações futuras.

### 4.3 Evolução temporal e acompanhamento
- visualização da evolução ao longo do tempo;
- comparação entre avaliações passadas e atuais;
- apoio a decisões de ajuste de rotina com base em progressão observada.

### 4.4 Simulação de maquilhagem e antes/depois (núcleo obrigatório)
- simulação virtual sobre fotografia do utilizador;
- vista comparativa antes/depois orientada a suporte de decisão;
- integração com recomendação de produtos no mesmo fluxo de consulta.

### 4.5 Recomendação e rotina personalizada
- recomendações por perfil, histórico e preferências;
- explicação da lógica de recomendação em linguagem clara;
- recolha de feedback do utilizador para afinação progressiva de relevância.

### 4.6 Comércio e operação
- catálogo, carrinho e checkout em escopo controlado;
- gestão de encomendas e histórico de compra;
- painel operacional mínimo para administração.

### 4.7 Privacidade biométrica e conformidade
- consentimento explícito antes de processamento de imagem;
- políticas de eliminação/retirada de dados;
- trilho de auditoria para operações sensíveis.

Fontes funcionais canónicas: [docs/RF.md](docs/RF.md), [docs/planificacao/backlogs/BACKLOG-MVP.md](docs/planificacao/backlogs/BACKLOG-MVP.md).

## 5. Arquitetura/Stack Recomendada (Alto Nível)
- frontend focado em fluxo assistido de diagnóstico e visualização;
- backend modular (identidade, análise, recomendação, comércio, privacidade);
- camada de IA desacoplada da lógica de negócio central;
- armazenamento seguro para imagens e relatórios;
- monitorização de tempos de análise e fiabilidade operacional.

## 6. Escopo MVP vs Pós-PAP
### MVP (incluído)
- análise facial IA com frontal + perfil;
- relatório e histórico de avaliações;
- evolução temporal funcional;
- simulação de maquilhagem com antes/depois em nível baseline;
- recomendação personalizada e operação de comércio em modo controlado;
- privacidade biométrica e consentimentos como requisito obrigatório.

### Pós-PAP (adiado)
- realismo avançado de simulação;
- integrações de pagamento e campanhas em modo enterprise;
- automações comerciais complexas e comunicações avançadas;
- otimizações de IA de maior custo computacional.

## 7. Requisitos Não Funcionais Críticos
- segurança e proteção de dados biométricos;
- consentimento, transparência e direito ao apagamento;
- desempenho aceitável na análise e na visualização;
- estabilidade da experiência em desktop e mobile;
- documentação e rastreabilidade alinhadas com backlog canónico.

Fonte canónica RNF: [docs/RNF.md](docs/RNF.md).

## 8. Roadmap Resumido por Fases
1. onboarding, perfil e catálogo base;
2. análise facial, relatório e histórico;
3. evolução temporal e simulação antes/depois;
4. consolidação operacional, privacidade e qualidade documental.

## 9. Créditos, Licença e Changelog
### Créditos
- Projeto: Orélle
- Tipo: PAP - Curso Profissional de Informática de Gestão
- Ano letivo: 2025/2026
- Equipa: Bruna, Aline, Daniel Bulica, Aline
- Orientador: Nuno Castro e Cláudia Marques

### Licença
Projeto académico para fins educativos.

### Changelog
- 2026-04-17: README reescrito integralmente com estrutura canónica e reforço dos núcleos obrigatórios (análise facial, multi-ângulo, evolução temporal e simulação).
