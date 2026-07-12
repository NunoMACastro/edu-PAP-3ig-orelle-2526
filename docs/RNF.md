# Orélle - Requisitos Não Funcionais (RNF) e Stack Tecnológica

## Índice

1. [Usabilidade e Design](#1-usabilidade-e-design)
2. [Performance e Escalabilidade](#2-performance-e-escalabilidade)
3. [Segurança e Privacidade](#3-segurança-e-privacidade)
4. [Integração e Compatibilidade](#4-integração-e-compatibilidade)
5. [Manutenção e Qualidade](#5-manutenção-e-qualidade)
6. [Experiência de IA e Ética](#6-experiência-de-ia-e-ética)
7. [Stack Tecnológica Recomendada](#7-stack-tecnológica-recomendada)
8. [Licença](#licença)
9. [Changelog](#changelog)

-   [Voltar ao início](../README.md)

---

<a id="1-usabilidade-e-design"></a>

## 1 Usabilidade e Design

| Código | Requisito                                                                 | Tipo           | Prioridade |
| :----- | :------------------------------------------------------------------------ | :------------- | :--------- |
| RNF01  | Interface moderna, intuitiva e _responsive_ (desktop e mobile).           | Usabilidade    | Must       |
| RNF02  | Design coerente com estética da marca (cores suaves, tipografia moderna). | Usabilidade    | Should     |
| RNF03  | Mensagens claras, ícones acessíveis e feedback imediato em formulários.   | Usabilidade    | Must       |
| RNF04  | Modo escuro e contraste ajustado.                                         | Acessibilidade | Could      |

---

<a id="2-performance-e-escalabilidade"></a>

## 2 Performance e Escalabilidade

| Código | Requisito                                                    | Tipo           | Prioridade |
| :----- | :----------------------------------------------------------- | :------------- | :--------- |
| RNF05  | Análise, pergunta seguinte, relatório e imagem devem executar como jobs assíncronos retomáveis, sem manter o pedido HTTP aberto até à conclusão. O provider respeita deadlines configuráveis de 30 s (pergunta), 60 s (análise), 60 s (relatório) e 150 s (imagem); polling e reload reutilizam a operação em curso. | Performance | Must |
| RNF06  | Páginas principais devem carregar em **≤ 3 segundos**.       | Performance    | Must       |
| RNF07  | Suportar **mínimo 50 utilizadores simultâneos** sem falhas.  | Escalabilidade | Should     |
| RNF08  | Imagens otimizadas (lazy loading e compressão automática).   | Performance    | Should     |

---

<a id="3-segurança-e-privacidade"></a>

## 3 Segurança e Privacidade

| Código | Requisito                                                                | Tipo        | Prioridade |
| :----- | :----------------------------------------------------------------------- | :---------- | :--------- |
| RNF09  | Todas as comunicações via **HTTPS (TLS 1.2+)**.                          | Segurança   | Must       |
| RNF10  | Palavras-passe com **hash seguro (bcrypt)**.                             | Segurança   | Must       |
| RNF11  | Fotografias e previews normalizados são armazenados em ficheiro privado cifrado com AES-256-GCM; perguntas, respostas, factos derivados, findings, restrições e conteúdo sensível de relatório/revisão usam **AES-256-GCM contextual v2**, com `keyVersion`, `aadHash` e AAD ligado à coleção, titular e campo. Jobs guardam apenas referências e metadados sanitizados. Migrações append-only fazem qualquer recifra declarada sem expor plaintext persistente. | Privacidade | Must |
| RNF12  | Consentimento v2 explícito e versionado para enviar à OpenAI fotografias, respostas/factos, perfil mínimo e catálogo filtrado. Edição generativa e acesso temporário do consultor às fotografias exigem propósitos separados, revogáveis e nunca promovidos automaticamente a partir de consentimentos antigos. | Privacidade | Must |
| RNF13  | Direito a eliminar conta e dados, incluindo bytes das fotografias: pedidos canónicos e repetíveis, conclusão apenas após remoção física aplicável e eliminação da própria conta mediante password + confirmação literal, com sessões revogadas e estado `deleted` terminal. | Privacidade | Must |
| RNF14  | Sessões opacas persistidas com token aleatório de 256 bits num cookie `HttpOnly`, `SameSite=Lax` e `Secure` quando HTTPS é obrigatório; a BD guarda apenas o hash, TTL, `revokedAt`, `lastSeenAt` e hash CSRF. `logout`/`logout-all` revogam imediatamente e cada mutação autenticada exige token obtido em `GET /api/auth/csrf`, header `X-CSRF-Token` e `Origin` pertencente à allowlist configurada. | Segurança   | Must       |
| RNF30  | Histórico, transcript e jobs IA devem respeitar minimização e cifra, não expor fotografias, storage keys, consent IDs, prompts internos, IDs pessoais/operacionais desnecessários ou conteúdo integral de relatórios bloqueados. DTOs owner-only podem incluir apenas referências opacas indispensáveis para navegar/retomar a própria sessão ou relatório; a UI nunca pede IDs técnicos ao utilizador. | Privacidade | Must |
| RNF31  | Listagem, detalhe, fotografia e decisão de consultor sobre relatórios devem ser autenticados, autorizados e registados em audit log minimizado. Fotografias não carregam por defeito e exigem grant explícito por relatório, revogável e com máximo de sete dias; a decisão usa compare-and-set e uma segunda decisão concorrente recebe `409`. | Segurança / Auditoria | Must |

---

<a id="4-integração-e-compatibilidade"></a>

## 4 Integração e Compatibilidade

| Código | Requisito                                                              | Tipo            | Prioridade |
| :----- | :--------------------------------------------------------------------- | :-------------- | :--------- |
| RNF15  | Compatível com **Chrome, Safari, Edge e Firefox**.                     | Compatibilidade | Must       |
| RNF16  | Exportação de relatórios em **PDF**.                                   | Compatibilidade | Should     |
| RNF17  | Todo o pagamento é exclusivamente **“Pagamento simulado”**. O checkout e o desbloqueio de relatório são simulações separadas e idempotentes. No relatório, `recommendedTotalCents` soma uma unidade de cada recomendação disponível no congelamento e `depositCents = ceil(recommendedTotalCents × 1000 / 10000)`; o voucher tem exatamente esse valor. Sem produtos disponíveis, o relatório é desbloqueado sem simulação e sem voucher zero. Nenhum fluxo usa dados financeiros, cobrança, gateway, redirect financeiro/externo ou movimentação de dinheiro. | Integração | Must |
| RNF18  | IA de runtime exclusivamente OpenAI. Respostas usam Structured Outputs e validação local; falhas transitórias repetem uma vez o modelo primário e tentam uma vez o fallback OpenAI, com `AbortSignal`, deadline e limite de corpo. Falha total de análise/relatório/imagem fica `failed_retryable` e nunca produz resultado cosmético sintético; apenas a pergunta seguinte pode usar o banco canónico validado. Sem chave, a aplicação arranca degradada e só novas operações IA ficam indisponíveis. | Integração | Should |

---

<a id="5-manutenção-e-qualidade"></a>

## 5 Manutenção e Qualidade

| Código | Requisito                                             | Tipo        | Prioridade |
| :----- | :---------------------------------------------------- | :---------- | :--------- |
| RNF19  | Código modular (MVC) com documentação e _docstrings_. | Manutenção  | Must       |
| RNF20  | Logs de erros e métricas de desempenho.               | Operação    | Should     |
| RNF21  | A base académica local deve ter um _snapshot_ diário integral em Extended JSON, cifrado com AES-256-GCM e chave dedicada, com AAD, _checksums_, documentos e índices; devem manter-se os sete _snapshots_ mais recentes e cada cópia só conta como verificada depois de _restore_ isolado para uma base terminada em `_restore` e comparação de integridade. O agendamento é exclusivamente local, por _opt-in_ `dev:local`, sem alegar _disaster recovery_ de produção ou cloud. | Fiabilidade | Should     |
| RNF22  | O ambiente de testes deve estar isolado da base local principal usada na demonstração académica. | Operação    | Should     |
| RNF26  | A interface final deve aproximar-se do mockup aprovado nos ecrãs principais. | UX / UI | Must |
| RNF27  | Os testes atuais devem ser verificados e os testes em falta criados antes da bateria final. | Qualidade | Must |
| RNF28  | A bateria final de testes deve ser executada com evidências objetivas. | Qualidade | Must |
| RNF29  | Os erros encontrados nos testes finais devem ser corrigidos e revalidados. | Qualidade / Estabilização | Must |

> **Escopo operacional académico/local:** referências a release, deploy, rollback, backup ou restore significam apenas execução demonstrável no ambiente local da PAP. Não constituem alegação de operação em produção, cloud, alta disponibilidade ou recuperação de desastre.
>
> **Estado atual de RNF26 — `ACEITE_RISCO`:** no alvo académico/local, a validação manual/Figma foi dispensada por decisão explícita de scope. A árvore disponível não está confirmada como mockup aprovado e não existe prova de paridade visual; testes automatizados de responsive/acessibilidade validam qualidade técnica, não aprovação do design. O requisito mantém este risco residual documentado, sem screenshots ou aprovação inventadas.

---

<a id="6-experiência-de-ia-e-ética"></a>

## 6 Experiência de IA e Ética

| Código | Requisito                                                                                    | Tipo                  | Prioridade |
| :----- | :------------------------------------------------------------------------------------------- | :-------------------- | :--------- |
| RNF23  | Relatórios e recomendações devem indicar **como chegaram ao resultado**: objetivo, factos relevantes, motivo/utilização/cautelas por produto, limitações e provenance com provider, modelo pedido/efetivo, request ID e versões de aviso, prompt e schema. | Ética / Transparência | Must |
| RNF24  | O backend pré-filtra o catálogo e envia no máximo 15 candidatos; a OpenAI só pode devolver IDs/variantes da allowlist. A seleção não usa atributos protegidos no ranking, usa alergias/ingredientes apenas como barreira de segurança, exige invariância para perfis equivalentes e documenta limitações sem prometer ausência absoluta de viés. | Ética | Must |
| RNF25  | Fotografias e dados da consulta só podem ser enviados à OpenAI para os propósitos consentidos, de forma minimizada e sem nome, email ou IDs pessoais/operacionais. Apenas `productId`/`variantId` opacos pertencentes à allowlist comercial podem seguir para permitir uma seleção verificável; a aplicação não autoriza treino e a revogação impede/cancela novas operações ainda não concluídas. | Privacidade | Must |

---

<a id="7-stack-tecnológica-recomendada"></a>

## 7 Stack Tecnológica Recomendada

### Frontend

-   React.js com Vite e CSS da própria aplicação.
-   `@mediapipe/tasks-vision`, WASM e modelo servidos same-origin para preflight fotográfico local; a indisponibilidade deste preflight degrada para verificações nativas e validação final do backend/OpenAI, sem bloquear toda a aplicação.

### Backend

-   Node.js com Express para API RESTful e Mongoose para persistência.
-   `busboy` para parsing multipart em streaming, limitado aos campos `frontal` e `perfil`, com cleanup em erro/abort; `sharp` para descodificar, limitar píxeis/dimensões, auto-orientar, re-encodar para WebP e remover EXIF/metadados antes da cifra.

### Base de Dados

-   MongoDB para armazenamento de perfis, histórico e análises.
-   `MongoMemoryReplSet` efémero para integração local/transacional, sem ligar à URI remota existente.

### IA

-   OpenAI Responses API com texto + imagens, Structured Outputs e validação semântica local; Image API para edição de maquilhagem depois do desbloqueio.
-   Defaults configuráveis: `gpt-5.4-mini` (`OPENAI_ANALYSIS_MODEL`), `gpt-5.4` (`OPENAI_FALLBACK_MODEL`) e `gpt-image-2` (`OPENAI_IMAGE_MODEL`).
-   `OPENAI_API_KEY`, `DATA_ENCRYPTION_KEY` forte, versões de notice/prompt/schema e timeouts são configuração explícita; sem chave a capability devolve `AI_NOT_CONFIGURED`, sem storage sensível seguro devolve `AI_STORAGE_NOT_CONFIGURED`, e a loja permanece disponível.
-   Jobs MongoDB duráveis com claim, lease, heartbeat, retry, idempotência e recuperação após restart; os testes determinísticos injetam transport apenas em `NODE_ENV=test`, sem criar um modo alternativo de produto.
-   Resultados são consultoria cosmética, não diagnóstico médico. Sinais potencialmente clínicos geram cautela e recomendação de profissional de saúde; a edição de imagem não prova resultado futuro.

---

## Ligacao com planificacao canonica

- Mapeamento RNF -> BK: `docs/planificacao/backlogs/ANEXO-RNF-PARA-BKS.md`.
- Matriz canónica de execucao: `docs/planificacao/backlogs/MATRIZ-CANONICA-BK.md`.
- Planeamento temporal oficial: `docs/planificacao/sprints/PLANO-SPRINTS.md`.
- Estado e evidência da consulta OpenAI: `docs/planificacao/PLANO-IMPLEMENTACAO-CONSULTA-IA-OPENAI-real_dev.md`.

<a id="licença"></a>

## Licença

Projeto académico orientado ao contexto PAP.

---

<a id="changelog"></a>

## Changelog

-   **2026-07-11** - RNF05, RNF11–RNF12, RNF17–RNF18, RNF23–RNF25 e RNF30–RNF31 sincronizados com jobs OpenAI-only, consentimentos separados, provenance, fallback entre modelos OpenAI, 10%/voucher e preview de maquilhagem privado.
-   **2024-06-15** - Versão inicial dos Requisitos Não Funcionais (RNF) e Stack Tecnológica Sugerida.
-   **2026-04-14** - Normalizacao editorial para coerencia com planificacao canónica e contrato comum de avaliacao.
-   **2026-06-30** - Adicionados RNF30 e RNF31 para histórico IA minimizado e revisão humana segura/auditável.
-   **2026-07-09** - RNF17 normalizado para “Pagamento simulado”; RNF21 concretizado como snapshot EJSON cifrado, recuperável e verificável apenas por restore isolado; RNF21/RNF22 e deploy limitados ao contexto académico/local; RNF26 marcado `BLOQUEADO_EXTERNO` enquanto faltar o mockup aprovado.
-   **2026-07-09** - Stack recomendada reconciliada com o alvo de correção: CSS próprio, replica set efémero, upload busboy/sharp e IA dual sem fallback silencioso.
-   **2026-07-09** - RNF18 alinhado aos modos `demo`/`openai`/`external`; RNF24 deixou de prometer garantia absoluta e passou a exigir proibição de atributos protegidos, invariância e limitações documentadas.
-   **2026-07-10** - RNF24 concretizado com allowlist de sinais cosméticos estruturados, exclusão de texto livre e uso de restrições apenas como barreira de segurança.
-   **2026-07-10** - RNF26 reaberto para comparação manual após a disponibilização da árvore `mockup/`; presença não equivale a aprovação nem a alinhamento validado.
-   **2026-07-10** - Estado corrente sobrepõe a linha anterior: RNF26 passou a `ACEITE_RISCO` por dispensa explícita da revisão manual/Figma no alvo académico/local, sem alegar aprovação do artefacto ou paridade visual.
-   **2026-07-10** - RNF13 concretizado com pedidos canónicos, retry idempotente, verificação de ausência física e eliminação terminal da própria conta.
-   **2026-07-10** - RNF31 concretizado com auditoria de listagem/detalhe/decisão, separação máquina/humano e CAS transacional para decisões concorrentes.
-   **2026-07-10** - RNF11 alinhado à cifra contextual v2 e RNF14 concretizado com sessões opacas persistidas, revogação imediata, CSRF ligado à sessão e validação de origem.
