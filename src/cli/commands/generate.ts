/**
 * Generate Command
 *
 * brand-forge generate <type> --kit <path>
 * AI-assisted creative proposals gated by review.
 */

import { Command } from 'commander';
import fs from 'node:fs';
import path from 'node:path';
import chalk from 'chalk';
import { select } from '@inquirer/prompts';
import { parseBrandKit } from '../../core/schema/brand-kit.js';
import { generatePalettes } from '../../core/generators/palette.js';
import { generateVoice } from '../../core/generators/voice.js';
import { generateFontPairings } from '../../core/generators/fonts.js';
import { generateIdentity } from '../../core/generators/identity.js';
import { generateLogos } from '../../core/generators/logo.js';
import {
  checkGenerationReadiness,
  type GenerationReadiness,
} from '../../core/review/decisions.js';

export function registerGenerateCommand(program: Command) {
  const gen = program
    .command('generate')
    .description('AI-assisted creative proposals');

  // --- Palette ---
  gen
    .command('palette')
    .description('Propose color palettes based on brand personality')
    .option('-k, --kit <path>', 'Path to brand-kit.json', 'brand-kit.json')
    .option('-n, --count <n>', 'Number of proposals', '3')
    .action(async (options: { kit: string; count: string }) => {
      const kit = parseBrandKit(JSON.parse(fs.readFileSync(path.resolve(options.kit), 'utf-8')));

      console.log(chalk.bold(`\nGenerating ${options.count} palette proposals for ${kit.identity.name}...\n`));

      const proposals = await generatePalettes({
        personality: kit.identity.personality,
        mode: kit.defaultMode,
        count: parseInt(options.count),
        anchorColor: kit.colors.primary.hex,
        domain: kit.identity.domain,
      });

      for (let i = 0; i < proposals.length; i++) {
        const p = proposals[i];
        const status = p.contrastReport.passing ? chalk.green('PASS') : chalk.red('FAIL');
        console.log(chalk.bold(`${i + 1}. ${p.name}`) + ` [contrast: ${status}]`);
        console.log(chalk.dim(`   ${p.description}`));
        console.log(`   Primary:   ${p.colors.primary.hex} ${p.colors.primary.name}`);
        console.log(`   Secondary: ${p.colors.secondary.hex} ${p.colors.secondary.name}`);
        console.log(`   Accent:    ${p.colors.accent.hex} ${p.colors.accent.name}`);
        console.log(`   Text/Bg:   ${p.contrastReport.textOnBg}:1  Primary/Bg: ${p.contrastReport.primaryOnBg}:1`);
        console.log('');
      }

      // Let user pick one
      const passing = proposals.filter((p) => p.contrastReport.passing);
      if (passing.length === 0) {
        console.log(chalk.yellow('No proposals pass contrast checks. Re-run or adjust constraints.'));
        return;
      }

      const choice = await select({
        message: 'Apply a palette to the brand kit?',
        choices: [
          ...passing.map((p, i) => ({ name: `${p.name} (${p.colors.primary.hex})`, value: i })),
          { name: 'None — discard all', value: -1 },
        ],
      });

      if (choice === -1) {
        console.log(chalk.dim('No changes made.'));
        return;
      }

      const selected = passing[choice];
      kit.colors = selected.colors;
      kit.meta.updated = new Date().toISOString();
      fs.writeFileSync(path.resolve(options.kit), JSON.stringify(kit, null, 2), 'utf-8');
      console.log(chalk.green(`Applied "${selected.name}" palette to ${options.kit}`));
    });

  // --- Voice ---
  gen
    .command('voice')
    .description('Synthesize voice rules from brand identity')
    .option('-k, --kit <path>', 'Path to brand-kit.json', 'brand-kit.json')
    .action(async (options: { kit: string }) => {
      const kit = parseBrandKit(JSON.parse(fs.readFileSync(path.resolve(options.kit), 'utf-8')));

      console.log(chalk.bold(`\nGenerating voice system for ${kit.identity.name}...\n`));

      const voice = await generateVoice({
        name: kit.identity.name,
        personality: kit.identity.personality,
        audience: kit.identity.audience,
        domain: kit.identity.domain,
        existingVoice: kit.voice.attributes.length > 0 ? kit.voice : undefined,
      });

      console.log(chalk.bold('Attributes:'));
      for (const attr of voice.attributes) {
        console.log(`  ${chalk.cyan(attr.trait)}: ${attr.description}`);
        if (attr.example) console.log(chalk.dim(`    "${attr.example}"`));
      }

      console.log(chalk.bold('\nAnti-patterns:'));
      for (const ap of voice.antiPatterns) {
        console.log(`  ${chalk.red(ap.category)} (${ap.severity}): ${ap.patterns.slice(0, 3).join(', ')}`);
      }

      console.log(chalk.bold('\nExamples:'));
      for (const ex of voice.examples) {
        console.log(`  ${chalk.bold(ex.intent)}`);
        console.log(chalk.green(`    Good: "${ex.good}"`));
        console.log(chalk.red(`    Bad:  "${ex.bad}"`));
      }

      const apply = await select({
        message: 'Apply this voice system to the brand kit?',
        choices: [
          { name: 'Yes', value: true },
          { name: 'No — discard', value: false },
        ],
      });

      if (!apply) {
        console.log(chalk.dim('No changes made.'));
        return;
      }

      kit.voice = voice;
      kit.meta.updated = new Date().toISOString();
      fs.writeFileSync(path.resolve(options.kit), JSON.stringify(kit, null, 2), 'utf-8');
      console.log(chalk.green(`Applied voice system to ${options.kit}`));
    });

  // --- Fonts ---
  gen
    .command('fonts')
    .description('Propose font pairings based on brand personality')
    .option('-k, --kit <path>', 'Path to brand-kit.json', 'brand-kit.json')
    .option('-n, --count <n>', 'Number of proposals', '3')
    .action(async (options: { kit: string; count: string }) => {
      const kit = parseBrandKit(JSON.parse(fs.readFileSync(path.resolve(options.kit), 'utf-8')));

      console.log(chalk.bold(`\nGenerating ${options.count} font pairings for ${kit.identity.name}...\n`));

      const proposals = await generateFontPairings({
        personality: kit.identity.personality,
        domain: kit.identity.domain,
        count: parseInt(options.count),
      });

      for (let i = 0; i < proposals.length; i++) {
        const p = proposals[i];
        const status = p.compatReport.passing ? chalk.green('PASS') : chalk.yellow('WARN');
        console.log(chalk.bold(`${i + 1}. ${p.name}`) + ` [compat: ${status}]`);
        console.log(chalk.dim(`   ${p.description}`));
        console.log(`   Display: ${p.typography.display.family} (${p.typography.display.classification})`);
        console.log(`   Body:    ${p.typography.body.family} (${p.typography.body.classification})`);
        console.log(`   Mono:    ${p.typography.mono.family}`);
        if (!p.compatReport.passing) {
          for (const issue of p.compatReport.displayBody.issues) {
            console.log(chalk.yellow(`   ⚠ ${issue}`));
          }
        }
        console.log('');
      }

      const passing = proposals.filter((p) => p.compatReport.passing);
      const allChoices = passing.length > 0 ? passing : proposals;

      const choice = await select({
        message: 'Apply a font pairing to the brand kit?',
        choices: [
          ...allChoices.map((p, i) => ({ name: `${p.name} (${p.typography.display.family} + ${p.typography.body.family})`, value: i })),
          { name: 'None — discard all', value: -1 },
        ],
      });

      if (choice === -1) {
        console.log(chalk.dim('No changes made.'));
        return;
      }

      const selected = allChoices[choice];
      kit.typography = selected.typography;
      kit.meta.updated = new Date().toISOString();
      fs.writeFileSync(path.resolve(options.kit), JSON.stringify(kit, null, 2), 'utf-8');
      console.log(chalk.green(`Applied "${selected.name}" typography to ${options.kit}`));
    });

  // --- Identity ---
  gen
    .command('identity')
    .description('Generate a brand identity from minimal input')
    .option('-k, --kit <path>', 'Path to brand-kit.json', 'brand-kit.json')
    .action(async (options: { kit: string }) => {
      const kit = parseBrandKit(JSON.parse(fs.readFileSync(path.resolve(options.kit), 'utf-8')));

      console.log(chalk.bold(`\nGenerating identity for ${kit.identity.name}...\n`));

      const identity = await generateIdentity({
        name: kit.identity.name,
        domain: kit.identity.domain,
        personality: kit.identity.personality.length > 0 ? kit.identity.personality : undefined,
      });

      console.log(chalk.bold('Tagline:') + ` "${identity.tagline}"`);
      console.log(chalk.bold('Mission:') + ` ${identity.mission}`);
      console.log(chalk.bold('Positioning:') + ` ${identity.positioning}`);
      console.log(chalk.bold('Audience:'));
      for (const a of identity.audience) console.log(`  - ${a}`);
      console.log(chalk.bold('Personality:'));
      for (const p of identity.personality) console.log(`  - ${p}`);

      const apply = await select({
        message: 'Apply this identity to the brand kit?',
        choices: [
          { name: 'Yes', value: true },
          { name: 'No — discard', value: false },
        ],
      });

      if (!apply) {
        console.log(chalk.dim('No changes made.'));
        return;
      }

      kit.identity = { ...kit.identity, ...identity };
      kit.meta.updated = new Date().toISOString();
      fs.writeFileSync(path.resolve(options.kit), JSON.stringify(kit, null, 2), 'utf-8');
      console.log(chalk.green(`Applied identity to ${options.kit}`));
    });

  // --- Logo ---
  gen
    .command('logo')
    .description('Generate logo concepts via AI image models')
    .option('-k, --kit <path>', 'Path to brand-kit.json', 'brand-kit.json')
    .option('-n, --count <n>', 'Number of concepts', '3')
    .option('-o, --output <dir>', 'Output directory', './output/logos')
    .option('-m, --model <model>', 'OpenRouter image model', 'google/gemini-2.5-flash-image')
    .option('-g, --gate <id>', 'Gate to generate at (required for kits with a decisions block)')
    .action(async (options: { kit: string; count: string; output: string; model: string; gate?: string }) => {
      const kitPath = path.resolve(options.kit);
      const kit = parseBrandKit(JSON.parse(fs.readFileSync(kitPath, 'utf-8')));

      // A managed kit does not generate freehand. Refusing here is cheap;
      // discovering afterward that a round was generated with no anchor, or
      // at a gate whose prerequisites are open, costs the round.
      let readiness: GenerationReadiness = { ready: true, blockers: [], avoid: [], criteria: [] };
      if (kit.decisions) {
        if (!options.gate) {
          console.error(
            chalk.red('This kit records decisions. Pass --gate so generation is scoped to an open decision point.'),
          );
          console.error(
            chalk.dim(`Gates: ${kit.decisions.gates.map((g) => g.id).join(', ') || '(none defined)'}`),
          );
          process.exit(1);
        }
        readiness = checkGenerationReadiness(kit, options.gate);
        if (!readiness.ready) {
          console.error(chalk.red('\nNot ready to generate:\n'));
          for (const b of readiness.blockers) console.error(chalk.red(`  - ${b}`));
          console.error('');
          process.exit(1);
        }
      }

      console.log(chalk.bold(`\nGenerating ${options.count} logo concepts for ${kit.identity.name}...\n`));
      if (readiness.anchor) {
        console.log(chalk.dim(`  anchor:   ${readiness.anchor}`));
        console.log(chalk.dim(`  avoiding: ${readiness.avoid.length} recorded rejections`));
        console.log('');
      }

      const concepts = await generateLogos({
        name: kit.identity.name,
        personality: kit.identity.personality,
        basePrompt: kit.media.creative?.basePrompt,
        avoid: kit.media.creative?.avoid,
        visualKeywords: kit.media.creative?.visualKeywords,
        count: parseInt(options.count),
        outputDir: options.output,
        model: options.model,
        anchor: readiness.anchor,
        rejected: readiness.avoid,
        criteria: readiness.criteria,
      });

      for (let i = 0; i < concepts.length; i++) {
        console.log(chalk.green(`  Concept ${i + 1} → ${concepts[i].path}`));
      }

      if (concepts.length === 0) {
        console.log(chalk.yellow('No concepts generated. Check API key and model availability.'));
        return;
      }

      console.log(chalk.dim(`\nReview the concepts in ${options.output}/`));

      if (kit.decisions && options.gate) {
        console.log(chalk.dim('\nRecord the ones worth keeping, describing the construction rather than the vibe:'));
        for (const c of concepts) {
          console.log(
            chalk.dim(
              `  brand-forge candidate add -k ${options.kit} -g ${options.gate} -m ai-image -a ${c.path} -d "<what it IS>"`,
            ),
          );
        }
      } else {
        console.log(chalk.dim('To add to the brand kit, update media.logos in the preset JSON.'));
      }
    });
}
