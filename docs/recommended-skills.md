# Recommended Claude Code Skills

brand-forge is a CLI tool, not a skill collection. It's authored *against* skills rather than shipping them. This document lists the skills that improve the brand-forge development experience.

## Why brand-forge ships no skills

Brand work is contract-driven (Zod schema → deterministic output). The interesting decisions happen in the brand kit JSON, not in agent prompts. Skills that *consume* brand kits (forge-signal's `validate-content`, image-gen) live in those projects. brand-forge stays narrow.

The one thing brand-forge *does* contribute to the skill ecosystem is the `glossary` exporter — generates a `CONTEXT.md`-style file from a brand kit so other projects can use it as a domain glossary for their own skills.

```bash
brand-forge export glossary --kit my-brand.json --output ./output
# → ./output/my-brand.CONTEXT.md
# Drop into the consuming project as CONTEXT.md
```

## Recommended workspace skills

Install these once at `~/.claude/skills/`. They are not bundled here.

### From [matt-pocock/skills](https://github.com/mattpocock/skills) (MIT)

| Skill | Why |
|---|---|
| `tdd` | Schema changes, exporters, and generators all benefit from test-first — `npm test` already runs Vitest, write the test first. |
| `diagnose` | Generator output drift, schema validation failures, contrast-gate flakiness — structured diagnosis loop helps. |
| `grill-with-docs` | Use before adding a new exporter category or schema field — stress-test the addition against the four-module rule (extractor / generator / review gate / exporter). |
| `triage` | Useful if/when this becomes a public OSS project and issues come in. |

### Custom workspace skills (Nino's setup)

| Skill | Why |
|---|---|
| `deepen` | Apply the deletion test when reviewing whether a new helper module pulls its weight. brand-forge's strict module categorization makes deletion-test verdicts unambiguous. |
| `simplify` | Code review on diffs (built into Claude Code). |

## Installation

```bash
mkdir -p ~/.claude/skills
git clone https://github.com/mattpocock/skills /tmp/pocock-skills
for skill in tdd diagnose grill-with-docs triage; do
  cp -r /tmp/pocock-skills/skills/*/$skill ~/.claude/skills/$skill 2>/dev/null
done
```

## Convention: don't bundle general skills

brand-forge deliberately does not redistribute upstream skills. Reasons in [forge-signal's recommended-skills doc](../forge-signal/docs/recommended-skills.md). Same convention here.
