/**
 * Init Command
 *
 * brand-forge init [--from <preset>]
 * Interactive brand discovery that produces a brand-kit.json.
 */

import { Command } from 'commander';
import fs from 'node:fs';
import path from 'node:path';
import chalk from 'chalk';
import { input, select } from '@inquirer/prompts';
import { safeParseBrandKit } from '../../core/schema/brand-kit.js';
import { reviewBrandKit } from '../../core/review/index.js';

export function registerInitCommand(program: Command) {
  program
    .command('init')
    .description('Create a new brand kit through interactive discovery')
    .option('--from <preset>', 'Fork from an existing brand kit preset')
    .option('-o, --output <path>', 'Output path', 'brand-kit.json')
    .action(async (options: { from?: string; output: string }) => {
      console.log(chalk.bold('\nbrand-forge — Brand Discovery\n'));

      let kit: Record<string, unknown>;

      if (options.from) {
        // Fork from existing preset
        const fromPath = path.resolve(options.from);
        if (!fs.existsSync(fromPath)) {
          console.error(chalk.red(`Preset not found: ${fromPath}`));
          process.exit(1);
        }
        kit = JSON.parse(fs.readFileSync(fromPath, 'utf-8'));
        console.log(chalk.dim(`Forking from: ${fromPath}\n`));
      } else {
        kit = await runDiscovery();
      }

      // Validate
      const result = safeParseBrandKit(kit);
      if (!result.success) {
        console.error(chalk.red('\nGenerated kit has validation errors:'));
        for (const issue of result.error.issues) {
          console.error(chalk.red(`  [${issue.path.join('.')}] ${issue.message}`));
        }
        // Write anyway so user can fix manually
        const outPath = path.resolve(options.output);
        fs.writeFileSync(outPath, JSON.stringify(kit, null, 2), 'utf-8');
        console.log(chalk.yellow(`\nWrote incomplete kit to ${outPath} — fix the errors above and re-run: brand-forge review --kit ${outPath}`));
        process.exit(1);
      }

      // Review
      const report = reviewBrandKit(result.data);
      if (report.warningCount > 0) {
        console.log(chalk.yellow(`\n${report.warningCount} warning(s) — run brand-forge review for details`));
      }
      if (!report.passed) {
        console.log(chalk.red(`\n${report.errorCount} error(s) found — you'll need to fix these before exporting`));
      }

      // Write
      const outPath = path.resolve(options.output);
      fs.writeFileSync(outPath, JSON.stringify(result.data, null, 2), 'utf-8');
      console.log(chalk.green(`\nBrand kit written to ${outPath}`));
    });
}

// ---------------------------------------------------------------------------
// Interactive Discovery Flow
// ---------------------------------------------------------------------------

async function runDiscovery(): Promise<Record<string, unknown>> {
  // --- Identity ---
  console.log(chalk.bold.underline('Identity'));

  const name = await input({ message: 'Brand name:' });
  const tagline = await input({ message: 'Tagline (optional):', default: '' });
  const mission = await input({ message: 'Mission — why does this brand exist?' });
  const positioning = await input({ message: 'Positioning — what makes it different?' });
  const domain = await input({ message: 'Industry/domain:', default: '' });

  const audienceRaw = await input({
    message: 'Target audience (comma-separated):',
    default: '',
  });
  const audience = audienceRaw.split(',').map((s) => s.trim()).filter(Boolean);

  const personalityRaw = await input({
    message: 'Brand personality traits (comma-separated, e.g. bold, authentic, technical):',
    default: '',
  });
  const personality = personalityRaw.split(',').map((s) => s.trim()).filter(Boolean);

  // --- Theme Mode ---
  const defaultMode = await select({
    message: 'Default theme:',
    choices: [
      { name: 'Dark', value: 'dark' },
      { name: 'Light', value: 'light' },
    ],
  });

  // --- Colors ---
  console.log(chalk.bold.underline('\nColors'));
  console.log(chalk.dim('Enter 6-digit hex colors with # prefix (e.g. #facc15)\n'));

  const primaryHex = await input({ message: 'Primary color hex:' });
  const primaryName = await input({ message: 'Primary color name:' });
  const secondaryHex = await input({ message: 'Secondary color hex:' });
  const secondaryName = await input({ message: 'Secondary color name:' });
  const accentHex = await input({ message: 'Accent color hex:', default: primaryHex });
  const accentName = await input({ message: 'Accent color name:', default: primaryName });

  const bgHex = defaultMode === 'dark' ? '#0a0a0a' : '#fafaf9';
  const fgHex = defaultMode === 'dark' ? '#ffffff' : '#1c1917';
  const background = await input({ message: 'Background color:', default: bgHex });
  const foreground = await input({ message: 'Foreground (text) color:', default: fgHex });

  // --- Typography ---
  console.log(chalk.bold.underline('\nTypography'));

  const displayFont = await input({ message: 'Display font family:', default: 'Inter' });
  const displayClass = await select({
    message: 'Display font classification:',
    choices: [
      { name: 'sans-serif', value: 'sans-serif' },
      { name: 'serif', value: 'serif' },
      { name: 'display', value: 'display' },
      { name: 'slab-serif', value: 'slab-serif' },
      { name: 'condensed', value: 'condensed' },
      { name: 'monospace', value: 'monospace' },
      { name: 'handwritten', value: 'handwritten' },
    ],
  });
  const displayTransform = await select({
    message: 'Display text transform:',
    choices: [
      { name: 'none', value: 'none' },
      { name: 'UPPERCASE', value: 'uppercase' },
      { name: 'capitalize', value: 'capitalize' },
    ],
  });

  const bodyFont = await input({ message: 'Body font family:', default: 'Inter' });
  const monoFont = await input({ message: 'Mono font family:', default: 'JetBrains Mono' });

  const now = new Date().toISOString();
  const id = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

  // --- Assemble ---
  return {
    meta: {
      schemaVersion: 1,
      id,
      created: now,
      updated: now,
      author: 'Nino Chavez',
      version: '0.1.0',
    },
    identity: {
      name,
      tagline: tagline || undefined,
      mission,
      audience,
      personality,
      positioning,
      domain: domain || undefined,
      links: {},
    },
    colors: {
      primary: { hex: primaryHex, name: primaryName, usage: 'Primary accent' },
      secondary: { hex: secondaryHex, name: secondaryName, usage: 'Secondary accent' },
      accent: { hex: accentHex, name: accentName, usage: 'Accent' },
      neutral: defaultMode === 'dark'
        ? { '50': '#fafafa', '100': '#f5f5f5', '200': '#e5e5e5', '300': '#d1d5db', '400': '#a3a3a3', '500': '#6b7280', '600': '#525252', '700': '#374151', '800': '#262626', '900': '#111827', '950': '#0a0a0f' }
        : { '50': '#fafaf9', '100': '#f5f5f4', '200': '#e7e5e4', '300': '#d6d3d1', '400': '#a8a29e', '500': '#78716c', '600': '#57534e', '700': '#44403c', '800': '#292524', '900': '#1c1917', '950': '#0c0a09' },
      semantic: {
        success: { hex: '#22c55e', name: 'Success', usage: 'Positive states' },
        warning: { hex: '#f59e0b', name: 'Warning', usage: 'Caution states' },
        error: { hex: '#ef4444', name: 'Error', usage: 'Error states' },
        info: { hex: '#3b82f6', name: 'Info', usage: 'Informational states' },
      },
      surfaces: {
        background,
        foreground,
        card: defaultMode === 'dark' ? '#111827' : '#ffffff',
        cardForeground: foreground,
        muted: defaultMode === 'dark' ? '#1f2937' : '#f5f5f4',
        mutedForeground: defaultMode === 'dark' ? '#9ca3af' : '#57534e',
        border: defaultMode === 'dark' ? '#374151' : '#e7e5e4',
      },
    },
    typography: {
      display: {
        family: displayFont,
        fallbacks: ['system-ui', 'sans-serif'],
        classification: displayClass,
        weights: [400, 500, 600, 700],
        variable: true,
        cssVariable: '--font-display',
        textTransform: displayTransform,
        letterSpacing: 0,
      },
      body: {
        family: bodyFont,
        fallbacks: ['system-ui', 'sans-serif'],
        classification: 'sans-serif',
        weights: [400, 500, 600, 700],
        variable: true,
        cssVariable: '--font-body',
        textTransform: 'none',
        letterSpacing: 0,
      },
      mono: {
        family: monoFont,
        fallbacks: ['Menlo', 'monospace'],
        classification: 'monospace',
        weights: [400, 500, 700],
        variable: true,
        cssVariable: '--font-mono',
        textTransform: 'none',
        letterSpacing: 0,
      },
      scale: {
        baseSizePx: 16,
        ratio: 'perfect-fourth',
        steps: [
          { name: 'hero', sizeRem: 4, sizeMobileRem: 2.5, lineHeight: 1.1, weight: 700, font: 'display' },
          { name: 'h2', sizeRem: 2.25, sizeMobileRem: 1.75, lineHeight: 1.2, weight: 600, font: 'display' },
          { name: 'h3', sizeRem: 1.5, sizeMobileRem: 1.25, lineHeight: 1.3, weight: 500, font: 'display' },
          { name: 'body-lg', sizeRem: 1.125, lineHeight: 1.6, weight: 400, font: 'body' },
          { name: 'body', sizeRem: 1, lineHeight: 1.5, weight: 400, font: 'body' },
          { name: 'caption', sizeRem: 0.875, lineHeight: 1.5, weight: 400, font: 'body' },
          { name: 'label', sizeRem: 0.75, lineHeight: 1.4, weight: 500, font: 'mono' },
        ],
      },
    },
    spacing: { '1': 0.25, '2': 0.5, '3': 0.75, '4': 1, '6': 1.5, '8': 2, '12': 3, '16': 4, '24': 6 },
    radius: { none: 0, sm: 0.125, md: 0.375, lg: 0.5, xl: 0.75, '2xl': 1, full: 9999 },
    layout: {
      maxContentWidth: 80,
      breakpoints: { sm: 640, md: 768, lg: 1024, xl: 1280, '2xl': 1536 },
      sectionPadding: '16',
      containerPadding: '6',
    },
    voice: {
      attributes: personality.map((trait) => ({
        trait,
        description: `Brand communicates with a ${trait} tone`,
      })),
      antiPatterns: [],
      structuralPatterns: [],
      examples: [],
      minimumScore: 70,
    },
    media: {
      logos: { clearSpace: 0.25, minSizePx: 24, variations: [] },
      templates: [],
      assets: [],
    },
    defaultMode,
  };
}
