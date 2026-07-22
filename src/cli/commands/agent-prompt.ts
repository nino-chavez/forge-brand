/**
 * Agent Prompt Command
 *
 * brand-forge agent-prompt [--kit <path>] [--task <task>] [--full]
 *
 * Emits a self-contained prompt payload that an AI agent can consume directly.
 * Designed to be copy-pasted into Claude Code, Cursor, Copilot, or any LLM agent.
 *
 * This is the agent-native ingress point — no docs to read, no interpretation needed.
 */

import { Command } from 'commander';
import fs from 'node:fs';
import path from 'node:path';
import { parseBrandKit, safeParseBrandKit } from '../../core/schema/brand-kit.js';
import { resolveDecisionState } from '../../core/review/decisions.js';
import { reviewBrandKit } from '../../core/review/index.js';
import { listTemplateIds } from '../../media/templates/index.js';

type Task = 'generate' | 'export' | 'media' | 'batch' | 'review' | 'site' | 'init' | 'all';

const TASKS: Record<Task, { label: string; description: string }> = {
  init: { label: 'Create Brand Kit', description: 'Create a new brand kit from scratch or from exploration files' },
  generate: { label: 'AI Creative Proposals', description: 'Generate palettes, fonts, voice, identity, or logos via AI' },
  export: { label: 'Export Formats', description: 'Export brand kit to CSS, Tailwind, Figma, Markdown, and more' },
  media: { label: 'Render Media', description: 'Render branded media assets (social cards, flyers, favicons, etc.)' },
  batch: { label: 'Full Asset Package', description: 'Export all formats + render all templates in one pass' },
  review: { label: 'QA Review', description: 'Run contrast, font compat, and consistency checks' },
  site: { label: 'Scaffold Site', description: 'Generate a branded Next.js, SvelteKit, or static site starter' },
  all: { label: 'Full Context', description: 'Complete brand-forge context for open-ended work' },
};

const EXPORT_FORMATS = ['css', 'tailwind', 'docs', 'markdown', 'signal-forge', 'signal-forge-voice', 'image-gen', 'figma', 'all'];
const SITE_FRAMEWORKS = ['nextjs', 'sveltekit', 'static'];

export function registerAgentPromptCommand(program: Command) {
  program
    .command('agent-prompt')
    .description('Emit a self-contained prompt for AI agents')
    .option('-k, --kit <path>', 'Path to brand-kit.json (omit for kit selection prompt)')
    .option('-t, --task <task>', `Task focus: ${Object.keys(TASKS).join(', ')}`, 'all')
    .option('--full', 'Include full brand kit JSON in output', false)
    .option('--list-presets', 'List available presets and exit')
    .action(async (options: { kit?: string; task: string; full: boolean; listPresets?: boolean }) => {
      // List presets mode
      if (options.listPresets) {
        const presetsDir = path.resolve('presets');
        if (fs.existsSync(presetsDir)) {
          const files = fs.readdirSync(presetsDir).filter((f) => f.endsWith('.json'));
          for (const file of files) {
            const raw = JSON.parse(fs.readFileSync(path.join(presetsDir, file), 'utf-8'));
            const result = safeParseBrandKit(raw);
            if (result.success) {
              console.log(`${file}: ${result.data.identity.name} — ${result.data.identity.tagline || result.data.identity.mission || ''}`);
            }
          }
        }
        return;
      }

      const task = options.task as Task;
      if (!TASKS[task]) {
        console.error(`Unknown task: ${task}. Available: ${Object.keys(TASKS).join(', ')}`);
        process.exit(1);
      }

      // Build prompt payload
      const sections: string[] = [];

      sections.push('# brand-forge — Agent Prompt');
      sections.push('');
      sections.push('You are working with brand-forge, a CLI-first design agency toolkit.');
      sections.push('This prompt contains everything you need. Do not read external docs.');
      sections.push('');

      // Kit context
      if (options.kit) {
        const kitPath = path.resolve(options.kit);
        if (!fs.existsSync(kitPath)) {
          console.error(`Brand kit not found: ${kitPath}`);
          process.exit(1);
        }

        const raw = JSON.parse(fs.readFileSync(kitPath, 'utf-8'));
        const kit = parseBrandKit(raw);
        const report = reviewBrandKit(kit);

        sections.push('## Brand Kit');
        sections.push('');
        sections.push(`- **Name:** ${kit.identity.name}`);
        sections.push(`- **Kit file:** ${options.kit}`);
        sections.push(`- **ID:** ${kit.meta.id}`);
        sections.push(`- **Version:** ${kit.meta.version}`);
        if (kit.identity.tagline) sections.push(`- **Tagline:** ${kit.identity.tagline}`);
        if (kit.identity.mission) sections.push(`- **Mission:** ${kit.identity.mission}`);
        if (kit.identity.domain) sections.push(`- **Domain:** ${kit.identity.domain}`);
        sections.push(`- **Theme:** ${kit.defaultMode}`);
        sections.push(`- **Personality:** ${kit.identity.personality.join(', ') || 'not set'}`);
        sections.push(`- **Audience:** ${kit.identity.audience.join(', ') || 'not set'}`);
        sections.push('');

        // Design summary
        sections.push('### Design Tokens');
        sections.push('');
        sections.push(`- Primary: ${kit.colors.primary.hex} (${kit.colors.primary.name})`);
        sections.push(`- Secondary: ${kit.colors.secondary.hex} (${kit.colors.secondary.name})`);
        sections.push(`- Accent: ${kit.colors.accent.hex} (${kit.colors.accent.name})`);
        sections.push(`- Background: ${kit.colors.surfaces.background}`);
        sections.push(`- Foreground: ${kit.colors.surfaces.foreground}`);
        sections.push(`- Display font: ${kit.typography.display.family} (${kit.typography.display.classification})`);
        sections.push(`- Body font: ${kit.typography.body.family}`);
        sections.push(`- Mono font: ${kit.typography.mono.family}`);
        sections.push('');

        // Review status
        sections.push('### QA Status');
        sections.push('');
        sections.push(`- Contrast: ${report.gates.contrast.passed ? 'PASS' : 'FAIL'}`);
        sections.push(`- Font Compatibility: ${report.gates.fontCompat.passed ? 'PASS' : 'FAIL'}`);
        sections.push(`- Consistency: ${report.gates.consistency.passed ? 'PASS' : 'FAIL'}`);
        if (kit.decisions) {
          sections.push(`- Decisions: ${report.gates.decisions.passed ? 'PASS' : 'FAIL'}`);
        }
        sections.push(`- Overall: ${report.passed ? 'PASS' : 'FAIL'} (${report.errorCount} errors, ${report.warningCount} warnings)`);
        if (!report.passed) {
          sections.push('');
          sections.push('**Issues to fix:**');
          const allIssues = [
            ...report.gates.contrast.issues.map((i) => `- Contrast: ${i.pair} — ${i.ratio}:1 (need ${i.required}:1)`),
            ...report.gates.fontCompat.issues.filter((i) => i.severity === 'error').map((i) => `- Font: ${i.pair} — ${i.message}`),
            ...report.gates.consistency.issues.filter((i) => i.severity === 'error').map((i) => `- Consistency: ${i.area} — ${i.message}`),
            ...report.gates.decisions.issues.filter((i) => i.severity === 'error').map((i) => `- Decisions: ${i.area} — ${i.message}`),
          ];
          sections.push(...allIssues);
        }
        sections.push('');

        // Creative state — the whole point of this surface. An agent that
        // can't see the recorded rejections will relitigate them.
        if (kit.decisions) {
          const d = kit.decisions;
          sections.push('### Creative State');
          sections.push('');

          const anchor = d.constitution?.conceptualAnchor;
          sections.push(`- Conceptual anchor: ${anchor ?? '**NOT SET**'}`);
          if (!anchor) {
            sections.push('');
            sections.push(
              '> Strategy is not locked. Do not generate visual candidates yet. Find the conceptual metaphor first and record it at `decisions.constitution.conceptualAnchor` — generating against camera parts instead of an idea is the failure this field exists to prevent.',
            );
          }
          sections.push('');

          const open = d.constitution?.openQuestions ?? [];
          if (open.length > 0) {
            sections.push('**Open questions — do not resolve these yourself**');
            sections.push('');
            for (const q of open) {
              const scope = q.blocks.length > 0 ? ` _(blocks: ${q.blocks.join(', ')})_` : '';
              sections.push(`- \`${q.id}\`${scope} — ${q.question}`);
              for (const s of q.sources) sections.push(`  - source: ${s}`);
            }
            sections.push('');
            sections.push(
              '> These are recorded because two real sources disagree or nobody has decided yet. Surface them; do not pick an answer and proceed as though it were settled.',
            );
            sections.push('');
          }

          // Shared resolver, `decided` semantics: a gate whose winner has
          // since been rejected is not decided, however many approvals its
          // history holds. This used to be computed here independently and
          // said DECIDED for a gate holding nothing.
          const state = resolveDecisionState(d);
          sections.push('**Gates**');
          sections.push('');
          for (const g of d.gates) {
            const blockedBy = g.requires.filter((r) => !state.decided(r));
            const winner = state.winner(g.id);
            let label: string;
            if (state.decided(g.id)) {
              label = `DECIDED (${winner})`;
            } else if (state.everApproved(g.id)) {
              label = 'UNRESOLVED — approved once, but no candidate holds it now';
            } else if (blockedBy.length > 0) {
              label = `BLOCKED (needs ${blockedBy.join(', ')})`;
            } else {
              label = 'OPEN';
            }
            sections.push(`- ${g.id} — ${label}`);
          }
          sections.push('');

          if (d.rejections.length > 0) {
            sections.push('**Recorded rejections — do not re-propose these**');
            sections.push('');
            for (const r of d.rejections) {
              const tail = r.suggestion ? ` Instead: ${r.suggestion}` : '';
              sections.push(`- \`${r.id}\` (${r.class}): ${r.reason}.${tail}`);
            }
            sections.push('');
            sections.push(
              '> `mechanical` constraints are enforced against candidate descriptors and block review. `judgment` constraints cannot be checked from text — approving in their scope requires a human to look at the artifact and record it in `decisions.ledger[].reviewed`. Do not mark that field yourself.',
            );
            sections.push('');
          }

          if (d.rubric.length > 0) {
            sections.push('**Evaluation criteria**');
            sections.push('');
            for (const c of d.rubric) {
              const scope = c.gates.length > 0 ? ` [${c.gates.join(', ')}]` : '';
              sections.push(`- ${c.criterion} (weight ${c.weight})${scope}`);
            }
            sections.push('');
          }

          sections.push(
            '> A gate advances only on a `decisions.ledger` entry written by the human. Do not set `status: "approved"` on a candidate; propose, and let the decision be recorded.',
          );
          sections.push('');
        }

        // Full kit JSON if requested
        if (options.full) {
          sections.push('### Full Kit JSON');
          sections.push('');
          sections.push('```json');
          sections.push(JSON.stringify(kit, null, 2));
          sections.push('```');
          sections.push('');
        }
      } else {
        // No kit specified — list available presets
        sections.push('## Available Brand Kits');
        sections.push('');
        const presetsDir = path.resolve('presets');
        if (fs.existsSync(presetsDir)) {
          const files = fs.readdirSync(presetsDir).filter((f) => f.endsWith('.json'));
          for (const file of files) {
            try {
              const raw = JSON.parse(fs.readFileSync(path.join(presetsDir, file), 'utf-8'));
              const result = safeParseBrandKit(raw);
              if (result.success) {
                const k = result.data;
                sections.push(`- **${k.identity.name}** — \`presets/${file}\``);
                if (k.identity.tagline) sections.push(`  ${k.identity.tagline}`);
              }
            } catch {
              // Skip invalid presets
            }
          }
        }
        sections.push('');
        sections.push('Specify a kit with `--kit presets/<name>.json` to include brand context.');
        sections.push('Or create a new one with: `npm run dev -- init`');
        sections.push('');
      }

      // Task-specific instructions
      sections.push(`## Task: ${TASKS[task].label}`);
      sections.push('');
      sections.push(TASKS[task].description);
      sections.push('');

      const kitFlag = options.kit ? `--kit ${options.kit}` : '--kit <brand-kit.json>';

      switch (task) {
        case 'init':
          sections.push('### Commands');
          sections.push('');
          sections.push('```bash');
          sections.push('# Interactive discovery (prompts for brand name, colors, fonts, etc.)');
          sections.push('npm run dev -- init');
          sections.push('');
          sections.push('# Fork from existing preset');
          sections.push(`npm run dev -- init --from presets/<name>.json -o brand-kit.json`);
          sections.push('');
          sections.push('# Extract from website-exploration variant directory');
          sections.push('npm run dev -- init --from-exploration <dir> -o brand-kit.json');
          sections.push('```');
          sections.push('');
          sections.push('**Note:** init is interactive — it prompts the human for input. Run it and respond to the prompts.');
          break;

        case 'generate':
          sections.push('### Commands');
          sections.push('');
          sections.push('```bash');
          sections.push(`# Propose color palettes (requires AI key)`);
          sections.push(`npm run dev -- generate palette ${kitFlag} --count 3`);
          sections.push('');
          sections.push(`# Synthesize voice/tone rules`);
          sections.push(`npm run dev -- generate voice ${kitFlag}`);
          sections.push('');
          sections.push(`# Propose font pairings`);
          sections.push(`npm run dev -- generate fonts ${kitFlag} --count 3`);
          sections.push('');
          sections.push(`# Generate brand identity (tagline, mission, positioning)`);
          sections.push(`npm run dev -- generate identity ${kitFlag}`);
          sections.push('');
          sections.push(`# Generate logo concepts (requires AI key)`);
          sections.push(`npm run dev -- generate logo ${kitFlag} --count 3 --output ./output/logos`);
          sections.push('```');
          sections.push('');
          sections.push('**Note:** Each generator is interactive — it proposes options and asks the human to pick one or discard. You cannot auto-apply results.');
          sections.push('');
          sections.push('**Requires:** `OPENROUTER_API_KEY` or `ANTHROPIC_API_KEY` in `.env`');
          break;

        case 'export':
          sections.push('### Commands');
          sections.push('');
          sections.push('```bash');
          sections.push(`# Export a specific format`);
          sections.push(`npm run dev -- export <format> ${kitFlag} --output ./output`);
          sections.push('');
          sections.push(`# Export all formats at once`);
          sections.push(`npm run dev -- export all ${kitFlag} --output ./output`);
          sections.push('```');
          sections.push('');
          sections.push(`**Available formats:** ${EXPORT_FORMATS.join(', ')}`);
          sections.push('');
          sections.push('Export runs QA review gates first. If review fails, export is blocked. Use `--skip-review` only if the human explicitly agrees.');
          break;

        case 'media':
          sections.push('### Commands');
          sections.push('');
          sections.push('```bash');
          sections.push(`# Render a specific template`);
          sections.push(`npm run dev -- media render <template-id> ${kitFlag} --data '{"title":"..."}' --output ./output.png`);
          sections.push('');
          sections.push(`# Generate favicon set (16, 32, 180, 512)`);
          sections.push(`npm run dev -- media favicon ${kitFlag} --output ./output/favicons`);
          sections.push('');
          sections.push(`# Render at 300dpi for print`);
          sections.push(`npm run dev -- media render flyer ${kitFlag} --data '{"eventName":"...","date":"...","location":"..."}' --print --output ./output/flyer-print.png`);
          sections.push('```');
          sections.push('');
          sections.push(`**Available templates:** ${listTemplateIds().join(', ')}`);
          sections.push('');
          sections.push('Template data fields:');
          sections.push('- `social-card`: title, subtitle?');
          sections.push('- `story`: title, date?, location?');
          sections.push('- `flyer`: eventName, date, location, price?, tagline?');
          sections.push('- `favicon`: letter?');
          sections.push('- `prescription-label`: rxName, format, date, location, price?, dosage?, sideEffects?, rxNumber?');
          sections.push('- `heat-card`: variety, heatLevel (1-5), tournamentName, date?, format?, tagline?');
          sections.push('- `email-header`: title?, subtitle?');
          sections.push('- `business-card`: name, title?, email?, phone?, website?');
          break;

        case 'batch':
          sections.push('### Commands');
          sections.push('');
          sections.push('```bash');
          sections.push(`npm run dev -- batch ${kitFlag} --output ./output`);
          sections.push('```');
          sections.push('');
          sections.push('Exports all formats + renders all media templates + generates favicon set. One command, full brand asset package.');
          sections.push('');
          sections.push('Output structure: `output/{brand-id}/exports/`, `output/{brand-id}/media/`, `output/{brand-id}/favicons/`');
          break;

        case 'review':
          sections.push('### Commands');
          sections.push('');
          sections.push('```bash');
          sections.push(`npm run dev -- review ${kitFlag}`);
          sections.push('```');
          sections.push('');
          sections.push('Runs three QA gates: contrast (WCAG), font compatibility, consistency. Exits 0 on pass, 1 on fail.');
          sections.push('');
          sections.push('```bash');
          sections.push('# Compare two kit versions');
          sections.push('npm run dev -- diff <prev.json> <next.json>');
          sections.push('```');
          break;

        case 'site':
          sections.push('### Commands');
          sections.push('');
          sections.push('```bash');
          sections.push(`npm run dev -- site <framework> ${kitFlag} --output ./output`);
          sections.push('```');
          sections.push('');
          sections.push(`**Frameworks:** ${SITE_FRAMEWORKS.join(', ')}`);
          sections.push('');
          sections.push('Generates CSS tokens, font loading, global styles, layout, and a landing page stub — all pre-wired with the brand kit.');
          break;

        case 'all':
          sections.push('This is open-ended work. Here are all available commands:');
          sections.push('');
          sections.push('```bash');
          sections.push(`npm run dev -- init                           # Create new brand kit`);
          sections.push(`npm run dev -- generate palette ${kitFlag}    # AI palette proposals`);
          sections.push(`npm run dev -- generate voice ${kitFlag}      # AI voice synthesis`);
          sections.push(`npm run dev -- generate fonts ${kitFlag}      # AI font pairings`);
          sections.push(`npm run dev -- generate identity ${kitFlag}   # AI brand identity`);
          sections.push(`npm run dev -- generate logo ${kitFlag}       # AI logo concepts`);
          sections.push(`npm run dev -- export <format> ${kitFlag}     # Export to format`);
          sections.push(`npm run dev -- export all ${kitFlag}          # Export all formats`);
          sections.push(`npm run dev -- media render <id> ${kitFlag}   # Render media template`);
          sections.push(`npm run dev -- media favicon ${kitFlag}       # Favicon set`);
          sections.push(`npm run dev -- batch ${kitFlag}               # Full asset package`);
          sections.push(`npm run dev -- review ${kitFlag}              # QA review`);
          sections.push(`npm run dev -- diff <prev> <next>             # Compare kit versions`);
          sections.push(`npm run dev -- site <framework> ${kitFlag}    # Scaffold branded site`);
          sections.push('```');
          break;
      }

      sections.push('');

      // Rules (always included)
      sections.push('## Rules');
      sections.push('');
      sections.push('1. Exporters are pure functions — no AI, no network, no randomness.');
      sections.push('2. Generators are interactive — they propose, the human approves. Never auto-apply.');
      sections.push('3. All colors must be `#rrggbb` (6-digit hex with `#` prefix).');
      sections.push('4. All imports use `.js` extension (ESM project).');
      sections.push('5. Schema changes cascade to all presets — update and test all of them.');
      sections.push('6. Review gates must pass before export. Do not skip unless the human says to.');
      sections.push('');

      // Validation (always included)
      sections.push('## Validation');
      sections.push('');
      sections.push('Run these before committing any changes:');
      sections.push('');
      sections.push('```bash');
      sections.push('npm run lint    # Type-check');
      sections.push('npm test        # Run tests');
      if (options.kit) {
        sections.push(`npm run dev -- review ${kitFlag}  # QA gates`);
      } else {
        sections.push('npm run dev -- review --kit <brand-kit.json>  # QA gates');
      }
      sections.push('```');

      // Output
      console.log(sections.join('\n'));
    });
}
