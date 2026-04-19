# ANEXO-CORE-DUAL-BK

## Header
- `doc_id`: `ANEXO-CORE-DUAL-BK`
- `path`: `docs/planificacao/backlogs/ANEXO-CORE-DUAL-BK.md`
- `area`: `project`
- `owner`: `Nuno`
- `status`: `ativo`
- `last_updated`: `2026-04-19`

## Objetivo
Classificar cada BK no contrato de core dual da Orelle e ligar cada item a KPI primario/secundario auditavel.

## Rubrica deterministica
- `CORE-IA`: impacto direto em analise/recomendacao/evolucao/simulacao.
- `CORE-COM`: impacto direto em catalogo/carrinho/pagamento/compra/recompra/stock comercial.
- `CORE-HIBRIDO`: impacto simultaneo real nos dois eixos.
- `SUPORTE`: qualidade/operacao/governanca sem impacto funcional core direto.

## Schema
- Colunas oficiais: `bk_id | classe_core_dual | eixo_primario | kpi_primario | kpi_secundario | justificacao_classe`.
- Classes permitidas: `CORE-IA`, `CORE-COM`, `CORE-HIBRIDO`, `SUPORTE`.

## Mapeamento BK -> Core Dual
| bk_id | classe_core_dual | eixo_primario | kpi_primario | kpi_secundario | justificacao_classe |
| --- | --- | --- | --- | --- | --- |
| BK-MF0-01 | CORE-HIBRIDO | ConfiancaConversao | add_to_cart_recomendado | retencao_fluxo_ia_30d | impacto simultaneo em consultoria e monetizacao |
| BK-MF0-02 | CORE-HIBRIDO | ConfiancaConversao | add_to_cart_recomendado | retencao_fluxo_ia_30d | impacto simultaneo em consultoria e monetizacao |
| BK-MF0-03 | CORE-HIBRIDO | ConfiancaConversao | add_to_cart_recomendado | retencao_fluxo_ia_30d | impacto simultaneo em consultoria e monetizacao |
| BK-MF0-04 | CORE-HIBRIDO | ConfiancaConversao | add_to_cart_recomendado | retencao_fluxo_ia_30d | impacto simultaneo em consultoria e monetizacao |
| BK-MF0-05 | CORE-HIBRIDO | ConfiancaConversao | add_to_cart_recomendado | retencao_fluxo_ia_30d | impacto simultaneo em consultoria e monetizacao |
| BK-MF0-06 | CORE-HIBRIDO | ConfiancaConversao | add_to_cart_recomendado | retencao_fluxo_ia_30d | impacto simultaneo em consultoria e monetizacao |
| BK-MF0-07 | CORE-COM | MonetizacaoLoja | taxa_conversao_checkout | taxa_recompra_30d | impacto direto no funil comercial (catalogo/carrinho/checkout/recompra) |
| BK-MF0-08 | CORE-COM | MonetizacaoLoja | taxa_conversao_checkout | taxa_recompra_30d | impacto direto no funil comercial (catalogo/carrinho/checkout/recompra) |
| BK-MF1-01 | CORE-COM | MonetizacaoLoja | taxa_conversao_checkout | taxa_recompra_30d | impacto direto no funil comercial (catalogo/carrinho/checkout/recompra) |
| BK-MF1-02 | CORE-COM | MonetizacaoLoja | taxa_conversao_checkout | taxa_recompra_30d | impacto direto no funil comercial (catalogo/carrinho/checkout/recompra) |
| BK-MF1-03 | CORE-COM | MonetizacaoLoja | taxa_conversao_checkout | taxa_recompra_30d | impacto direto no funil comercial (catalogo/carrinho/checkout/recompra) |
| BK-MF1-04 | CORE-COM | MonetizacaoLoja | taxa_conversao_checkout | taxa_recompra_30d | impacto direto no funil comercial (catalogo/carrinho/checkout/recompra) |
| BK-MF1-05 | CORE-IA | ConsultoriaInteligente | taxa_recomendacao_util | tempo_analise_p95 | impacto direto no motor de analise/recomendacao/simulacao |
| BK-MF1-06 | CORE-IA | ConsultoriaInteligente | taxa_recomendacao_util | tempo_analise_p95 | impacto direto no motor de analise/recomendacao/simulacao |
| BK-MF1-07 | CORE-IA | ConsultoriaInteligente | taxa_recomendacao_util | tempo_analise_p95 | impacto direto no motor de analise/recomendacao/simulacao |
| BK-MF1-08 | CORE-IA | ConsultoriaInteligente | taxa_recomendacao_util | tempo_analise_p95 | impacto direto no motor de analise/recomendacao/simulacao |
| BK-MF2-01 | CORE-IA | ConsultoriaInteligente | taxa_recomendacao_util | tempo_analise_p95 | impacto direto no motor de analise/recomendacao/simulacao |
| BK-MF2-02 | CORE-IA | ConsultoriaInteligente | taxa_recomendacao_util | tempo_analise_p95 | impacto direto no motor de analise/recomendacao/simulacao |
| BK-MF2-03 | CORE-IA | ConsultoriaInteligente | taxa_recomendacao_util | tempo_analise_p95 | impacto direto no motor de analise/recomendacao/simulacao |
| BK-MF2-04 | CORE-IA | ConsultoriaInteligente | taxa_recomendacao_util | tempo_analise_p95 | impacto direto no motor de analise/recomendacao/simulacao |
| BK-MF2-05 | CORE-IA | ConsultoriaInteligente | taxa_recomendacao_util | tempo_analise_p95 | impacto direto no motor de analise/recomendacao/simulacao |
| BK-MF2-06 | CORE-IA | ConsultoriaInteligente | taxa_recomendacao_util | tempo_analise_p95 | impacto direto no motor de analise/recomendacao/simulacao |
| BK-MF2-07 | CORE-IA | ConsultoriaInteligente | taxa_recomendacao_util | tempo_analise_p95 | impacto direto no motor de analise/recomendacao/simulacao |
| BK-MF2-08 | CORE-IA | ConsultoriaInteligente | taxa_recomendacao_util | tempo_analise_p95 | impacto direto no motor de analise/recomendacao/simulacao |
| BK-MF3-01 | CORE-IA | ConsultoriaInteligente | taxa_recomendacao_util | tempo_analise_p95 | impacto direto no motor de analise/recomendacao/simulacao |
| BK-MF3-02 | CORE-COM | MonetizacaoLoja | taxa_conversao_checkout | taxa_recompra_30d | impacto direto no funil comercial (catalogo/carrinho/checkout/recompra) |
| BK-MF3-03 | CORE-COM | MonetizacaoLoja | taxa_conversao_checkout | taxa_recompra_30d | impacto direto no funil comercial (catalogo/carrinho/checkout/recompra) |
| BK-MF3-04 | CORE-COM | MonetizacaoLoja | taxa_conversao_checkout | taxa_recompra_30d | impacto direto no funil comercial (catalogo/carrinho/checkout/recompra) |
| BK-MF3-06 | CORE-COM | MonetizacaoLoja | taxa_conversao_checkout | taxa_recompra_30d | impacto direto no funil comercial (catalogo/carrinho/checkout/recompra) |
| BK-MF3-07 | CORE-COM | MonetizacaoLoja | taxa_conversao_checkout | taxa_recompra_30d | impacto direto no funil comercial (catalogo/carrinho/checkout/recompra) |
| BK-MF3-08 | CORE-COM | MonetizacaoLoja | taxa_conversao_checkout | taxa_recompra_30d | impacto direto no funil comercial (catalogo/carrinho/checkout/recompra) |
| BK-MF4-01 | CORE-HIBRIDO | ConfiancaConversao | add_to_cart_recomendado | retencao_fluxo_ia_30d | aumenta confianca/experiencia transversal que afeta ambos os eixos |
| BK-MF4-02 | CORE-HIBRIDO | ConfiancaConversao | add_to_cart_recomendado | retencao_fluxo_ia_30d | aumenta confianca/experiencia transversal que afeta ambos os eixos |
| BK-MF4-03 | CORE-HIBRIDO | ConfiancaConversao | add_to_cart_recomendado | retencao_fluxo_ia_30d | aumenta confianca/experiencia transversal que afeta ambos os eixos |
| BK-MF4-04 | CORE-COM | MonetizacaoLoja | taxa_conversao_checkout | taxa_recompra_30d | impacto direto no funil comercial (catalogo/carrinho/checkout/recompra) |
| BK-MF4-05 | CORE-HIBRIDO | ConfiancaConversao | add_to_cart_recomendado | retencao_fluxo_ia_30d | impacto simultaneo em consultoria e monetizacao |
| BK-MF4-08 | CORE-HIBRIDO | ConfiancaConversao | add_to_cart_recomendado | retencao_fluxo_ia_30d | aumenta confianca/experiencia transversal que afeta ambos os eixos |
| BK-MF5-01 | CORE-HIBRIDO | ConfiancaConversao | add_to_cart_recomendado | retencao_fluxo_ia_30d | aumenta confianca/experiencia transversal que afeta ambos os eixos |
| BK-MF5-04 | CORE-HIBRIDO | ConfiancaConversao | add_to_cart_recomendado | retencao_fluxo_ia_30d | aumenta confianca/experiencia transversal que afeta ambos os eixos |
| BK-MF5-05 | CORE-HIBRIDO | ConfiancaConversao | add_to_cart_recomendado | retencao_fluxo_ia_30d | aumenta confianca/experiencia transversal que afeta ambos os eixos |
| BK-MF5-06 | CORE-HIBRIDO | ConfiancaConversao | add_to_cart_recomendado | retencao_fluxo_ia_30d | aumenta confianca/experiencia transversal que afeta ambos os eixos |
| BK-MF5-07 | CORE-HIBRIDO | ConfiancaConversao | add_to_cart_recomendado | retencao_fluxo_ia_30d | aumenta confianca/experiencia transversal que afeta ambos os eixos |
| BK-MF5-08 | CORE-HIBRIDO | ConfiancaConversao | add_to_cart_recomendado | retencao_fluxo_ia_30d | aumenta confianca/experiencia transversal que afeta ambos os eixos |
| BK-MF6-01 | CORE-IA | ConsultoriaInteligente | taxa_recomendacao_util | tempo_analise_p95 | impacto direto no motor de analise/recomendacao/simulacao |
| BK-MF6-02 | CORE-HIBRIDO | ConfiancaConversao | add_to_cart_recomendado | retencao_fluxo_ia_30d | aumenta confianca/experiencia transversal que afeta ambos os eixos |
| BK-MF6-03 | CORE-HIBRIDO | ConfiancaConversao | add_to_cart_recomendado | retencao_fluxo_ia_30d | aumenta confianca/experiencia transversal que afeta ambos os eixos |
| BK-MF6-04 | CORE-HIBRIDO | ConfiancaConversao | add_to_cart_recomendado | retencao_fluxo_ia_30d | aumenta confianca/experiencia transversal que afeta ambos os eixos |
| BK-MF6-05 | SUPORTE | FundacaoQualidade | taxa_incidentes_criticos | taxa_conformidade_gates | qualidade/operacao/governanca sem entrega funcional core direta |
| BK-MF6-06 | SUPORTE | FundacaoQualidade | taxa_incidentes_criticos | taxa_conformidade_gates | qualidade/operacao/governanca sem entrega funcional core direta |
| BK-MF6-07 | SUPORTE | FundacaoQualidade | taxa_incidentes_criticos | taxa_conformidade_gates | qualidade/operacao/governanca sem entrega funcional core direta |
| BK-MF7-01 | CORE-HIBRIDO | ConfiancaConversao | add_to_cart_recomendado | retencao_fluxo_ia_30d | aumenta confianca/experiencia transversal que afeta ambos os eixos |
| BK-MF7-02 | CORE-HIBRIDO | ConfiancaConversao | add_to_cart_recomendado | retencao_fluxo_ia_30d | aumenta confianca/experiencia transversal que afeta ambos os eixos |
| BK-MF7-03 | CORE-HIBRIDO | ConfiancaConversao | add_to_cart_recomendado | retencao_fluxo_ia_30d | aumenta confianca/experiencia transversal que afeta ambos os eixos |
| BK-MF7-04 | CORE-HIBRIDO | ConfiancaConversao | add_to_cart_recomendado | retencao_fluxo_ia_30d | aumenta confianca/experiencia transversal que afeta ambos os eixos |
| BK-MF7-05 | CORE-HIBRIDO | ConfiancaConversao | add_to_cart_recomendado | retencao_fluxo_ia_30d | aumenta confianca/experiencia transversal que afeta ambos os eixos |
| BK-MF7-06 | CORE-COM | MonetizacaoLoja | taxa_conversao_checkout | taxa_recompra_30d | impacto direto no funil comercial (catalogo/carrinho/checkout/recompra) |
| BK-MF7-07 | CORE-IA | ConsultoriaInteligente | taxa_recomendacao_util | tempo_analise_p95 | impacto direto no motor de analise/recomendacao/simulacao |
| BK-MF8-01 | SUPORTE | FundacaoQualidade | taxa_incidentes_criticos | taxa_conformidade_gates | qualidade/operacao/governanca sem entrega funcional core direta |
| BK-MF8-02 | SUPORTE | FundacaoQualidade | taxa_incidentes_criticos | taxa_conformidade_gates | qualidade/operacao/governanca sem entrega funcional core direta |
| BK-MF8-03 | SUPORTE | FundacaoQualidade | taxa_incidentes_criticos | taxa_conformidade_gates | qualidade/operacao/governanca sem entrega funcional core direta |
| BK-MF8-04 | SUPORTE | FundacaoQualidade | taxa_incidentes_criticos | taxa_conformidade_gates | qualidade/operacao/governanca sem entrega funcional core direta |
| BK-MF8-05 | CORE-IA | ConsultoriaInteligente | taxa_recomendacao_util | tempo_analise_p95 | impacto direto no motor de analise/recomendacao/simulacao |
| BK-MF8-06 | CORE-IA | ConsultoriaInteligente | taxa_recomendacao_util | tempo_analise_p95 | impacto direto no motor de analise/recomendacao/simulacao |
| BK-MF8-07 | CORE-IA | ConsultoriaInteligente | taxa_recomendacao_util | tempo_analise_p95 | impacto direto no motor de analise/recomendacao/simulacao |

## Changelog
- `2026-04-19`: anexo atualizado com rubrica deterministica e coluna `justificacao_classe`.
