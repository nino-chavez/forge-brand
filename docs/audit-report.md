# Documentation Audit Report

> Generated: 2026-03-24
> Scope: full
> Auditor: Autonomous Knowledge Synthesis

## Executive Summary

### Documentation Health Score: 48/100

| Dimension | Score | Status |
|-----------|-------|--------|
| Coverage | 12/25 | Partial — strong inline docs, no structured docs/ layer |
| Accuracy | 22/25 | Current — CLAUDE.md and README reflect codebase |
| Completeness | 6/25 | Sparse — missing architecture, developer, user, and API docs |
| Accessibility | 8/25 | Poor — no docs/ directory, no navigation, no consumer guides |

### Key Findings

1. **No `docs/` directory exists** — 148 exported functions across 34 source files have zero structured documentation beyond JSDoc headers and README
2. **New extractors module is undocumented** — 7 files, 26 exports, no usage guide or integration documentation
3. **Consumer integration is undocumented** — signal-forge and image-gen depend on brand-forge output but no integration guide exists
4. **CLI command reference is missing** — 8 commands (init, generate, export, media, site, review, diff, batch) documented only in README examples

---

## Coverage Matrix

### Documentation by Layer

| Layer | Expected | Exists | Status | Priority |
|-------|----------|--------|--------|----------|
| Architecture | `docs/architecture/` | No | Missing | P1 |
| Developer | `docs/developer/` | No | Missing | P1 |
| DevOps | `docs/ops/` | No | Not needed (CLI tool) | P3 |
| Testing | `docs/testing/` | No | Missing | P2 |
| Functional | `docs/functional/` | No | Missing | P2 |
| Strategic | `docs/strategic/` | No | Missing | P3 |
| User Docs | `docs/user/` | No | Missing | P1 |

### Critical Components

| Component | Location | Has JSDoc | Has Usage Guide | Status |
|-----------|----------|-----------|-----------------|--------|
| Schema (BrandKit) | `src/core/schema/` | Yes (69 exports) | No | Gap |
| Exporters | `src/core/exporters/` | Yes (14 exports) | No | Gap |
| Generators | `src/core/generators/` | Yes (23 exports) | No | Gap |
| Extractors (NEW) | `src/core/extractors/` | Yes (26 exports) | No | Gap |
| Review Gates | `src/core/review/` | Yes (16 exports) | No | Gap |
| CLI Commands | `src/cli/commands/` | Partial | README only | Gap |
| Media Templates | `src/media/` | Partial | No | Gap |
| Presets | `presets/` | No | README only | Partial |

---

## Gap Analysis

### Missing Documentation

| Priority | Component | Missing | Skill to Run |
|----------|-----------|---------|--------------|
| P1 | System design | Architecture overview — schema contract, data flow, module boundaries | `/doc-architecture` |
| P1 | Onboarding | Developer setup, prerequisites, first brand kit walkthrough | `/doc-developer` |
| P1 | CLI reference | Complete command reference with all flags, examples, output formats | `/doc-user` |
| P1 | Extractors | Usage guide for `--from-exploration`, extraction strategy docs | `/doc-functional` |
| P2 | Testing | Test strategy, fixture patterns, how to test new exporters/generators | `/doc-testing` |
| P2 | Schema | BrandKit field reference, validation rules, constraint documentation | `/doc-functional` |
| P2 | Integration | How signal-forge and image-gen consume brand-kit.json | `/doc-architecture` |
| P3 | Strategic | Roadmap, tech debt assessment, evolution plan | `/doc-strategic` |

### Outdated Documentation

| File | Issue | Drift Level |
|------|-------|-------------|
| `README.md` | Does not mention `--from-exploration` flag or extractors module | Medium |
| `CLAUDE.md` | Does not mention extractors in Quick Reference or Dependency Direction | Medium |
| `AGENTS.md` | Does not mention extractors module | Low |

### Existing Documentation Quality

| File | Lines | Strengths | Issues |
|------|-------|-----------|--------|
| `README.md` | 150 | Good CLI examples, preset table, architecture diagram | Missing extractors, no prerequisites section |
| `CLAUDE.md` | 53 | Practical dev commands, clear rules, pre-commit checklist | Missing extractors in Quick Reference |
| `AGENTS.md` | 51 | Clear principles, dependency direction, anti-slop rules | Missing extractors |
| `.claude/skills/*.md` | 122 total | Actionable guard rails for each module | No extractor guard |

### Strong Points

- **100% JSDoc coverage** at file level — every module has a header explaining purpose and constraints
- **Guard rails** (`.claude/skills/`) enforce quality for each module type
- **AGENTS.md** clearly articulates core principles (schema is contract, exporters are pure, generators propose)
- **11 reference docs** in `references/` for design system research
- **3 output examples** showing real brand kit exports

---

## Recommendations

### Immediate Actions (This Week)

1. **Update README.md, CLAUDE.md, AGENTS.md** — Add extractors module to all three
   - Effort: Low

2. **Create extractor guard** — `.claude/skills/extractor-guard.md` mirroring exporter-guard pattern
   - Effort: Low

3. **Run `/doc-architecture`** — Generate system design docs covering the full pipeline: schema -> generators -> extractors -> exporters -> consumers
   - Effort: Medium

### Short-term Actions (This Month)

4. **Run `/doc-developer`** — Setup guide, prerequisites, first brand kit walkthrough
   - Effort: Medium

5. **Run `/doc-user type=reference`** — CLI command reference for all 8 commands + flags
   - Effort: Medium

6. **Run `/doc-functional`** — Document BrandKit schema fields, validation rules, extraction strategy
   - Effort: Medium

### Long-term Improvements

7. **Run `/doc-testing`** — Document test patterns, fixture conventions, snapshot testing for exporters
   - Effort: Low

8. **Run `/doc-strategic`** — Roadmap for website-exploration integration, consumer SDK, preset marketplace
   - Effort: Low

---

## Maintenance Recommendations

### Documentation Hygiene

- [ ] Add documentation updates to pre-commit checklist (CLAUDE.md rule #6)
- [ ] Create extractor-guard.md skill for new extractors module
- [ ] Update README when new commands or flags are added

### Suggested Cadence

| Doc Type | Review Frequency | Owner |
|----------|-----------------|-------|
| README / CLAUDE.md | On each feature addition | Nino |
| Architecture | Quarterly or on module addition | Nino |
| CLI Reference | On command changes | Nino |
| Schema Reference | On schema changes | Nino |

---

## Appendix: Full Inventory

### All Documentation Files (non-node_modules)

| Path | Type | Lines |
|------|------|-------|
| `README.md` | Root | 150 |
| `CLAUDE.md` | Project config | 53 |
| `AGENTS.md` | Architecture principles | 51 |
| `.claude/skills/brand-kit-guard.md` | Guard rail | 32 |
| `.claude/skills/generator-guard.md` | Guard rail | 33 |
| `.claude/skills/exporter-guard.md` | Guard rail | 26 |
| `.claude/skills/media-guard.md` | Guard rail | 31 |
| `.claude/commands/*.md` (12 files) | Doc generation skills | ~4,360 |
| `references/*.md` (11 files) | Design research | ~2,917 |
| `output/**/*.md` (3 files) | Generated examples | ~419 |

### Undocumented Entry Points

| File | Type | Priority |
|------|------|----------|
| `src/core/extractors/index.ts` | Module entry (NEW) | High |
| `src/core/extractors/colors.ts` | Extractor (NEW) | High |
| `src/core/extractors/typography.ts` | Extractor (NEW) | High |
| `src/core/extractors/spacing.ts` | Extractor (NEW) | Medium |
| `src/core/extractors/layout.ts` | Extractor (NEW) | Medium |
| `src/core/extractors/voice-hints.ts` | Extractor (NEW) | Medium |
| `src/core/extractors/utils.ts` | Utilities (NEW) | Medium |
