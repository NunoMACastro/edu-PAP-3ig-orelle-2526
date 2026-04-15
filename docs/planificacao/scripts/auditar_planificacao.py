#!/usr/bin/env python3
from __future__ import annotations

from pathlib import Path
import re
import json
from collections import defaultdict

EXPECTED_RF = [f"RF{i:02d}" for i in range(1, 45)]
EXPECTED_RNF = [f"RNF{i:02d}" for i in range(1, 26)]
VALID_LAST_UPDATED = {'2026-04-14'}
GUIDE_FILENAME_RE = re.compile(r"^BK-MF[0-8]-\d{2}-[a-z0-9]+(?:-[a-z0-9]+)*\.md$")
PLACEHOLDER_PATTERNS = [
    re.compile(r"\{NOW\}"),
    re.compile(r"Adicionar aqui", re.IGNORECASE),
    re.compile(r"TODO snippet", re.IGNORECASE),
    re.compile(r"Trecho real e aplicavel", re.IGNORECASE),
    re.compile(r"Snippets de codigo \(evolucao\)", re.IGNORECASE),
    re.compile(r"\bTBD\b", re.IGNORECASE),
]


def read(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def extract_codes(path: Path, prefix: str) -> list[str]:
    text = read(path)
    return sorted(set(re.findall(rf"\b{prefix}\d{{2}}\b", text)))


def parse_table_rows(md_text: str, header_start: str, stop_heading: str | None = None) -> list[dict[str, str]]:
    lines = md_text.splitlines()
    start_idx = None
    for i, line in enumerate(lines):
        if line.startswith(header_start):
            start_idx = i
            break
    if start_idx is None:
        return []

    end_idx = len(lines)
    if stop_heading:
        for i in range(start_idx + 2, len(lines)):
            if lines[i].startswith(stop_heading):
                end_idx = i
                break

    headers = [p.strip() for p in lines[start_idx].strip().strip("|").split("|")]
    rows = []
    for line in lines[start_idx + 2 : end_idx]:
        if not line.strip().startswith("|"):
            continue
        parts = [p.strip() for p in line.strip().strip("|").split("|")]
        if len(parts) != len(headers):
            continue
        rows.append(dict(zip(headers, parts)))
    return rows


def parse_items(raw: str) -> list[str]:
    raw = raw.strip().replace("`", "")
    if raw in {"", "-", "transversal"}:
        return []
    out: list[str] = []
    for part in [x.strip() for x in raw.split(",") if x.strip()]:
        m = re.fullmatch(r"(RF|RNF)(\d{2})\.\.(\d{2})", part)
        if m:
            pref, s, e = m.groups()
            for n in range(int(s), int(e) + 1):
                out.append(f"{pref}{n:02d}")
        else:
            out.extend(re.findall(r"\b(?:RF|RNF)\d{2}\b", part))
    return out


def normalize_guia_path(cell: str) -> str:
    m = re.search(r"\(([^)]+)\)", cell)
    if not m:
        return ""
    rel = m.group(1).replace("../", "")
    return f"docs/planificacao/{rel}"


def extract_header_value(text: str, key: str) -> str:
    m = re.search(rf"^- `{re.escape(key)}`: `([^`]+)`", text, flags=re.MULTILINE)
    return m.group(1).strip() if m else ""


def has_required_blocks(text: str) -> bool:
    required = [
        "## Bloco pedagogico",
        "### Objetivo",
        "### Pre-requisitos",
        "### Erros comuns",
        "### Check de compreensao",
        "## Bloco operacional",
        "### Entrada",
        "### Passos",
        "### Validacao",
        "### Handoff",
        "## Snippet tecnico aplicavel",
        "## Criterios de aceite",
        "## Evidence para PR/defesa",
    ]
    return all(section in text for section in required)


def has_non_placeholder_snippet(text: str) -> bool:
    banned = ["Adicionar aqui", "placeholder", "TODO snippet", "Trecho real e aplicavel", "Snippets de codigo (evolucao)"]
    if any(b in text for b in banned):
        return False
    return re.search(r"```[a-zA-Z0-9]*\n.+?```", text, flags=re.DOTALL) is not None


def extract_min_negativos(text: str) -> int:
    m = re.search(r"Negativos: minimo `?(\d+)`?", text)
    if m:
        return int(m.group(1))
    m2 = re.search(r"minimo (\d+) cenarios", text)
    return int(m2.group(1)) if m2 else 0


def find_placeholders(path: Path, text: str) -> list[dict[str, str]]:
    issues: list[dict[str, str]] = []
    for patt in PLACEHOLDER_PATTERNS:
        m = patt.search(text)
        if m:
            issues.append({"file": str(path), "marker": m.group(0)})
    return issues


def find_local_md_links(path: Path, text: str) -> list[str]:
    links: list[str] = []
    for raw in re.findall(r"\[[^\]]+\]\(([^)]+)\)", text):
        target = raw.strip()
        if not target or target.startswith("#"):
            continue
        if re.match(r"^[a-z]+://", target):
            continue
        if target.startswith("mailto:"):
            continue
        links.append(target)
    return links


def resolve_link(path: Path, link: str) -> Path:
    clean = link.split("#", 1)[0].strip()
    if clean.startswith("/"):
        return Path(clean).resolve()
    return (path.parent / clean).resolve()


def scorecard_issues(score_text: str) -> list[str]:
    expected = {
        "Cobertura/rastreabilidade": 25,
        "Coerencia documental": 20,
        "Pedagogia/guidance/step-by-step": 25,
        "Adequacao ao 12o": 20,
        "Governanca/avaliacao": 10,
    }
    issues = []
    for name, weight in expected.items():
        if not re.search(rf"\|\s*{re.escape(name)}\s*\|\s*{weight}\s*\|", score_text):
            issues.append(f"missing_or_invalid_score_criterion:{name}")
    return issues


def main() -> None:
    repo = Path(__file__).resolve().parents[3]
    plan = repo / "docs" / "planificacao"
    backlogs = plan / "backlogs"
    guides_root = plan / "guias-bk"

    rf_codes = extract_codes(repo / "docs" / "RF.md", "RF")
    rnf_codes = extract_codes(repo / "docs" / "RNF.md", "RNF")

    matriz_rows = parse_table_rows(
        read(backlogs / "MATRIZ-CANONICA-BK.md"),
        "| bk_id | macro | titulo | owner | apoio | prioridade | estado | esforco | dependencias | rf_rnf | fase_documental | sprint | core_or_reforco | proximo_bk_recomendado | guia_path |",
    )
    backlog_rows = parse_table_rows(
        read(backlogs / "BACKLOG-MVP.md"),
        "| bk_id | macro | titulo | owner | apoio | prioridade | estado | esforco | dependencias | rf_rnf | fase_documental | sprint | core_or_reforco | proximo_bk | guia |",
        "## MF0",
    )

    rf_expected = set(EXPECTED_RF)
    rnf_expected = set(EXPECTED_RNF)

    matriz_by_bk = {r["bk_id"]: r for r in matriz_rows}
    backlog_by_bk = {r["bk_id"]: r for r in backlog_rows}

    matrix_refs = set()
    backlog_refs = set()
    invalid_refs = set()
    for row in matriz_rows:
        for req in parse_items(row["rf_rnf"]):
            matrix_refs.add(req)
            if req.startswith("RF") and req not in rf_expected:
                invalid_refs.add(req)
            if req.startswith("RNF") and req not in rnf_expected:
                invalid_refs.add(req)
    for row in backlog_rows:
        for req in parse_items(row["rf_rnf"]):
            backlog_refs.add(req)
            if req.startswith("RF") and req not in rf_expected:
                invalid_refs.add(req)
            if req.startswith("RNF") and req not in rnf_expected:
                invalid_refs.add(req)

    missing_rf_matrix = sorted(rf_expected - {x for x in matrix_refs if x.startswith("RF")})
    missing_rnf_matrix = sorted(rnf_expected - {x for x in matrix_refs if x.startswith("RNF")})
    missing_rf_backlog = sorted(rf_expected - {x for x in backlog_refs if x.startswith("RF")})
    missing_rnf_backlog = sorted(rnf_expected - {x for x in backlog_refs if x.startswith("RNF")})

    mismatches = []
    for bk_id, m in matriz_by_bk.items():
        b = backlog_by_bk.get(bk_id)
        if not b:
            mismatches.append({"bk_id": bk_id, "type": "missing_in_backlog"})
            continue
        if (
            m["owner"] != b["owner"]
            or m["prioridade"] != b["prioridade"]
            or m["dependencias"] != b["dependencias"]
            or sorted(parse_items(m["rf_rnf"])) != sorted(parse_items(b["rf_rnf"]))
            or m["sprint"] != b["sprint"]
            or m["core_or_reforco"] != b["core_or_reforco"]
            or m["proximo_bk_recomendado"] != b["proximo_bk"]
        ):
            mismatches.append({"bk_id": bk_id, "type": "field_mismatch"})

    guide_files = sorted(guides_root.glob("MF*/BK-MF*-*.md"))
    legacy_files = sorted(guides_root.glob("MF*/BK-MF[0-8]-[0-9][0-9].md"))

    missing_guides = []
    broken_guia_links = []
    guide_header_issues = []
    guide_content_issues = []
    naming_issues = []

    existing_guide_paths = {f"docs/planificacao/guias-bk/{p.parent.name}/{p.name}" for p in guide_files}

    for row in backlog_rows:
        guia_path = normalize_guia_path(row["guia"])
        if guia_path not in existing_guide_paths:
            broken_guia_links.append({"bk_id": row["bk_id"], "guia_path": guia_path})

    required_headers = [
        "doc_id",
        "bk_id",
        "macro",
        "owner",
        "apoio",
        "prioridade",
        "estado",
        "esforco",
        "dependencias",
        "rf_rnf",
        "fase_documental",
        "sprint",
        "core_or_reforco",
        "proximo_bk",
        "guia_path",
        "last_updated",
    ]

    for guide in guide_files:
        text = read(guide)
        bk_id = extract_header_value(text, "bk_id")

        if not bk_id:
            naming_issues.append({"guide": str(guide), "issue": "missing_bk_id_header"})
            continue

        row = backlog_by_bk.get(bk_id)
        if not row:
            missing_guides.append({"guide": str(guide), "reason": "bk_not_in_backlog"})
            continue

        if not GUIDE_FILENAME_RE.match(guide.name):
            naming_issues.append({"bk_id": bk_id, "issue": "filename_not_slug_pattern", "file": guide.name})
        if not guide.name.startswith(f"{bk_id}-"):
            naming_issues.append({"bk_id": bk_id, "issue": "filename_not_prefixed_by_bk_id", "file": guide.name})

        for header in required_headers:
            if not extract_header_value(text, header):
                guide_header_issues.append({"bk_id": bk_id, "missing": header})

        expected_core = "Reforco" if row["prioridade"] == "P0" else "Core"
        actual_core = extract_header_value(text, "core_or_reforco")
        if actual_core != expected_core:
            guide_header_issues.append({"bk_id": bk_id, "mismatch": f"core_or_reforco != {expected_core}"})

        expected_path = f"docs/planificacao/guias-bk/{guide.parent.name}/{guide.name}"
        actual_path = extract_header_value(text, "guia_path")
        if actual_path != expected_path:
            guide_header_issues.append({"bk_id": bk_id, "mismatch": "guia_path_not_matching_file"})

        if sorted(parse_items(extract_header_value(text, "rf_rnf"))) != sorted(parse_items(row["rf_rnf"])):
            guide_header_issues.append({"bk_id": bk_id, "mismatch": "rf_rnf_not_matching_backlog"})

        if not has_required_blocks(text):
            guide_content_issues.append({"bk_id": bk_id, "issue": "missing_pedagogic_or_operational_blocks"})

        if not has_non_placeholder_snippet(text):
            guide_content_issues.append({"bk_id": bk_id, "issue": "missing_or_placeholder_snippet"})

        min_negativos = extract_min_negativos(text)
        if row["prioridade"] == "P0" and min_negativos < 3:
            guide_content_issues.append({"bk_id": bk_id, "issue": f"P0_min_neg({min_negativos})"})
        if row["prioridade"] in {"P1", "P2"} and min_negativos < 2:
            guide_content_issues.append({"bk_id": bk_id, "issue": f"P1P2_min_neg({min_negativos})"})

        if extract_header_value(text, "proximo_bk") == "-":
            if re.search(r"Proximo BK recomendado: `BK-", text):
                guide_content_issues.append({"bk_id": bk_id, "issue": "terminal_bk_with_next_reference"})

    for lf in legacy_files:
        naming_issues.append({"file": str(lf), "issue": "legacy_filename_without_slug"})

    deps_invalid = []
    graph: dict[str, list[str]] = defaultdict(list)
    for row in matriz_rows:
        bk_id = row["bk_id"]
        deps = re.findall(r"\bBK-MF[0-8]-\d{2}\b", row["dependencias"])
        for dep in deps:
            if dep not in matriz_by_bk:
                deps_invalid.append({"bk_id": bk_id, "dep": dep})
            else:
                graph[bk_id].append(dep)

    seen, visiting = set(), set()
    cycles = []

    def dfs(node: str, stack: list[str]) -> None:
        if node in visiting:
            if node in stack:
                cycles.append(stack[stack.index(node) :] + [node])
            return
        if node in seen:
            return
        visiting.add(node)
        for nei in graph.get(node, []):
            dfs(nei, stack + [nei])
        visiting.remove(node)
        seen.add(node)

    for n in graph:
        dfs(n, [n])

    scorecard_text = read(plan / "sprints" / "SCORECARD-SPRINTS.md")
    scorecard_contract_issues = scorecard_issues(scorecard_text)

    required_artifacts = [
        plan / "README.md",
        plan / "PLANO-IMPLEMENTACAO-TOTAL.md",
        plan / "CONFORMIDADE-PLANIFICACAO.md",
        plan / "DISTRIBUICAO-RESPONSABILIDADES.md",
        plan / "sprints" / "PLANO-SPRINTS.md",
        plan / "sprints" / "SCORECARD-SPRINTS.md",
        plan / "sprints" / "GUIAO-DOCENTE-SEMANAL.md",
        plan / "sprints" / "GATES-S4-S8-S12.md",
        backlogs / "MATRIZ-CANONICA-BK.md",
        backlogs / "BACKLOG-MVP.md",
        backlogs / "MF-VIEWS.md",
        backlogs / "CONTRATO-CAMPOS-BK.md",
        backlogs / "ANEXO-RF-PARA-BKS.md",
        backlogs / "ANEXO-RNF-PARA-BKS.md",
        backlogs / "ANEXO-BK-SPRINT-OWNER.md",
    ]
    missing_artifacts = [str(p) for p in required_artifacts if not p.exists()]

    outdated_docs = []
    for p in required_artifacts:
        if not p.exists():
            continue
        text = read(p)
        if not any(f"`last_updated`: `{d}`" in text for d in VALID_LAST_UPDATED):
            outdated_docs.append(str(p))

    docs_to_scan = [
        repo / "README.md",
        repo / "docs" / "RF.md",
        repo / "docs" / "RNF.md",
        plan / "README.md",
        plan / "PLANO-IMPLEMENTACAO-TOTAL.md",
        plan / "CONFORMIDADE-PLANIFICACAO.md",
        plan / "DISTRIBUICAO-RESPONSABILIDADES.md",
        plan / "guias-bk" / "README.md",
        plan / "guias-bk" / "ROADMAP-BKS-RESTANTES.md",
        plan / "guias-bk" / "MAPA-MIGRACAO-LEGACY-PARA-CANONICO.md",
        plan / "sprints" / "PLANO-SPRINTS.md",
        plan / "sprints" / "SCORECARD-SPRINTS.md",
        plan / "sprints" / "GUIAO-DOCENTE-SEMANAL.md",
        plan / "sprints" / "GATES-S4-S8-S12.md",
        backlogs / "MATRIZ-CANONICA-BK.md",
        backlogs / "BACKLOG-MVP.md",
        backlogs / "MF-VIEWS.md",
        backlogs / "CONTRATO-CAMPOS-BK.md",
        backlogs / "ANEXO-RF-PARA-BKS.md",
        backlogs / "ANEXO-RNF-PARA-BKS.md",
        backlogs / "ANEXO-BK-SPRINT-OWNER.md",
    ] + guide_files

    placeholder_issues: list[dict[str, str]] = []
    broken_links_docs: list[dict[str, str]] = []
    seen_broken = set()
    for p in docs_to_scan:
        if not p.exists():
            continue
        text = read(p)
        placeholder_issues.extend(find_placeholders(p, text))
        for link in find_local_md_links(p, text):
            target = resolve_link(p, link)
            if not target.exists():
                key = (str(p), link)
                if key in seen_broken:
                    continue
                seen_broken.add(key)
                broken_links_docs.append({"file": str(p), "link": link})

    result = {
        "counts": {
            "rf_docs": len(rf_codes),
            "rnf_docs": len(rnf_codes),
            "matriz_bk": len(matriz_rows),
            "backlog_bk": len(backlog_rows),
            "guide_bk": len(guide_files),
        },
        "coverage": {
            "missing_rf_matrix": missing_rf_matrix,
            "missing_rnf_matrix": missing_rnf_matrix,
            "missing_rf_backlog": missing_rf_backlog,
            "missing_rnf_backlog": missing_rnf_backlog,
            "invalid_refs": sorted(invalid_refs),
        },
        "consistency": {
            "matriz_backlog_mismatches": mismatches,
            "broken_guia_links": broken_guia_links,
            "invalid_dependencies": deps_invalid,
            "cycles": cycles,
            "missing_artifacts": missing_artifacts,
            "outdated_docs": outdated_docs,
            "scorecard_contract_issues": scorecard_contract_issues,
            "broken_links_docs": broken_links_docs,
            "placeholder_issues": placeholder_issues,
        },
        "guides_quality": {
            "guide_header_issues": guide_header_issues,
            "guide_content_issues": guide_content_issues,
            "naming_issues": naming_issues,
            "missing_guides": missing_guides,
        },
        "status": {
            "coverage_pass": not missing_rf_matrix and not missing_rnf_matrix and not missing_rf_backlog and not missing_rnf_backlog and not invalid_refs,
            "consistency_pass": not mismatches and not broken_guia_links and not deps_invalid and not cycles and not missing_artifacts and not outdated_docs and not scorecard_contract_issues and not broken_links_docs and not placeholder_issues,
            "guides_pass": not guide_header_issues and not guide_content_issues and not naming_issues and not missing_guides,
            "naming_pass": not naming_issues,
            "overall_pass": not missing_rf_matrix and not missing_rnf_matrix and not missing_rf_backlog and not missing_rnf_backlog and not invalid_refs and not mismatches and not broken_guia_links and not deps_invalid and not cycles and not missing_artifacts and not outdated_docs and not scorecard_contract_issues and not broken_links_docs and not placeholder_issues and not guide_header_issues and not guide_content_issues and not naming_issues and not missing_guides,
        },
    }

    print(json.dumps(result, indent=2, ensure_ascii=False))


if __name__ == "__main__":
    main()
