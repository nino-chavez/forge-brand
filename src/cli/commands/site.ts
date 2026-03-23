/**
 * Site Command
 *
 * brand-forge site <framework> --kit <path> --output <dir>
 * Scaffold a new web project with brand tokens pre-wired.
 */

import { Command } from 'commander';
import fs from 'node:fs';
import path from 'node:path';
import chalk from 'chalk';
import { parseBrandKit } from '../../core/schema/brand-kit.js';
import { exportCssTokens } from '../../core/exporters/css-tokens.js';
import { exportTailwindPreset } from '../../core/exporters/tailwind.js';

export function registerSiteCommand(program: Command) {
  program
    .command('site')
    .description('Scaffold a new site from a brand kit')
    .argument('<framework>', 'Target framework: nextjs, sveltekit, static')
    .option('-k, --kit <path>', 'Path to brand-kit.json', 'brand-kit.json')
    .option('-o, --output <dir>', 'Output directory', '.')
    .action(async (framework: string, options: { kit: string; output: string }) => {
      const kit = parseBrandKit(JSON.parse(fs.readFileSync(path.resolve(options.kit), 'utf-8')));
      const outDir = path.resolve(options.output);

      switch (framework) {
        case 'nextjs':
          scaffoldNextjs(kit, outDir);
          break;
        case 'sveltekit':
          scaffoldSveltekit(kit, outDir);
          break;
        case 'static':
          scaffoldStatic(kit, outDir);
          break;
        default:
          console.error(chalk.red(`Unknown framework: ${framework}. Available: nextjs, sveltekit, static`));
          process.exit(1);
      }
    });
}

function ensureDir(dir: string) {
  fs.mkdirSync(dir, { recursive: true });
}

function writeFile(filePath: string, content: string) {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, content, 'utf-8');
  console.log(chalk.green(`  ${path.relative(process.cwd(), filePath)}`));
}

// ---------------------------------------------------------------------------
// Next.js Scaffold
// ---------------------------------------------------------------------------

function scaffoldNextjs(kit: any, outDir: string) {
  console.log(chalk.bold(`\nScaffolding Next.js project for ${kit.identity.name}\n`));

  const cssTokens = exportCssTokens(kit);
  const tailwindPreset = exportTailwindPreset(kit);
  const { typography, identity } = kit;

  // CSS tokens
  writeFile(path.join(outDir, 'styles/brand-tokens.css'), cssTokens);

  // Tailwind preset
  writeFile(path.join(outDir, 'brand-preset.ts'), tailwindPreset);

  // Global CSS with font imports and token layer
  const globalCss = `@import 'tailwindcss';
@import './brand-tokens.css';

${typography.display.googleFonts ? `/* Display: ${typography.display.family} */` : ''}
${typography.body.googleFonts ? `/* Body: ${typography.body.family} */` : ''}
${typography.mono.googleFonts ? `/* Mono: ${typography.mono.family} */` : ''}

body {
  font-family: var(--brand-font-body);
  background-color: var(--brand-background);
  color: var(--brand-foreground);
}

h1, h2, h3 {
  font-family: var(--brand-font-display);
}

code, pre, kbd {
  font-family: var(--brand-font-mono);
}
`;
  writeFile(path.join(outDir, 'styles/globals.css'), globalCss);

  // Layout with font loading
  const googleFontsImport = [typography.display, typography.body, typography.mono]
    .filter((f: any) => f.googleFonts)
    .map((f: any) => `import { ${f.family.replace(/\s+/g, '_')} } from 'next/font/google';`)
    .join('\n');

  const fontInits = [typography.display, typography.body, typography.mono]
    .filter((f: any) => f.googleFonts)
    .map((f: any) => {
      const varName = f.family.replace(/\s+/g, '_').toLowerCase();
      return `const ${varName} = ${f.family.replace(/\s+/g, '_')}({
  subsets: ['latin'],
  variable: '${f.cssVariable || `--font-${varName}`}',
  weight: [${f.weights.map((w: number) => `'${w}'`).join(', ')}],
});`;
    })
    .join('\n\n');

  const fontClassNames = [typography.display, typography.body, typography.mono]
    .filter((f: any) => f.googleFonts)
    .map((f: any) => `\${${f.family.replace(/\s+/g, '_').toLowerCase()}.variable}`)
    .join(' ');

  const layout = `${googleFontsImport}
import './globals.css';

${fontInits}

export const metadata = {
  title: '${identity.name}',
  description: '${identity.tagline || identity.mission || ''}',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={\`${fontClassNames}\`}>
      <body>{children}</body>
    </html>
  );
}
`;
  writeFile(path.join(outDir, 'app/layout.tsx'), layout);

  // Landing page stub
  const page = `export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8">
      <h1 className="text-hero font-bold" style={{ fontFamily: 'var(--brand-font-display)' }}>
        ${identity.name}
      </h1>
      ${identity.tagline ? `<p className="text-body-lg mt-4 opacity-60">${identity.tagline}</p>` : ''}
    </main>
  );
}
`;
  writeFile(path.join(outDir, 'app/page.tsx'), page);

  console.log(chalk.dim(`\nNext steps: cd ${outDir} && npx create-next-app@latest . --typescript --tailwind --app --src-dir=false`));
  console.log(chalk.dim('Then replace the generated styles and layout with the files above.'));
}

// ---------------------------------------------------------------------------
// SvelteKit Scaffold
// ---------------------------------------------------------------------------

function scaffoldSveltekit(kit: any, outDir: string) {
  console.log(chalk.bold(`\nScaffolding SvelteKit project for ${kit.identity.name}\n`));

  const cssTokens = exportCssTokens(kit);
  const { typography, identity } = kit;

  // CSS tokens
  writeFile(path.join(outDir, 'src/styles/brand-tokens.css'), cssTokens);

  // App CSS
  const appCss = `@import './brand-tokens.css';

body {
  font-family: var(--brand-font-body);
  background-color: var(--brand-background);
  color: var(--brand-foreground);
  margin: 0;
}

h1, h2, h3 {
  font-family: var(--brand-font-display);
}

code, pre, kbd {
  font-family: var(--brand-font-mono);
}
`;
  writeFile(path.join(outDir, 'src/styles/app.css'), appCss);

  // Root layout
  const googleFontsUrl = [typography.display, typography.body, typography.mono]
    .filter((f: any) => f.googleFonts)
    .map((f: any) => `family=${f.googleFonts}`)
    .join('&');

  const layout = `<script>
  import '../styles/app.css';
</script>

<svelte:head>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
  <link href="https://fonts.googleapis.com/css2?${googleFontsUrl}&display=swap" rel="stylesheet" />
  <title>${identity.name}</title>
</svelte:head>

<slot />
`;
  writeFile(path.join(outDir, 'src/routes/+layout.svelte'), layout);

  // Landing page
  const page = `<main class="min-h-screen flex flex-col items-center justify-center p-8">
  <h1 style="font-size: var(--brand-text-hero); font-family: var(--brand-font-display);">
    ${identity.name}
  </h1>
  ${identity.tagline ? `<p style="font-size: var(--brand-text-body-lg); opacity: 0.6; margin-top: 1rem;">${identity.tagline}</p>` : ''}
</main>
`;
  writeFile(path.join(outDir, 'src/routes/+page.svelte'), page);

  console.log(chalk.dim(`\nBrand tokens and layout generated. Wire into your SvelteKit project.`));
}

// ---------------------------------------------------------------------------
// Static HTML Scaffold
// ---------------------------------------------------------------------------

function scaffoldStatic(kit: any, outDir: string) {
  console.log(chalk.bold(`\nScaffolding static site for ${kit.identity.name}\n`));

  const cssTokens = exportCssTokens(kit);
  const { typography, identity } = kit;

  writeFile(path.join(outDir, 'styles.css'), cssTokens + `

body {
  font-family: var(${typography.body.cssVariable || '--brand-font-body'});
  background-color: var(--brand-background);
  color: var(--brand-foreground);
  margin: 0;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
}

h1 {
  font-family: var(${typography.display.cssVariable || '--brand-font-display'});
  font-size: var(--brand-text-hero);
  line-height: var(--brand-leading-hero);
${typography.display.textTransform !== 'none' ? `  text-transform: ${typography.display.textTransform};\n` : ''}}

.subtitle {
  font-size: var(--brand-text-body-lg);
  opacity: 0.6;
  margin-top: 1rem;
}
`);

  const googleFontsUrl = [typography.display, typography.body, typography.mono]
    .filter((f: any) => f.googleFonts)
    .map((f: any) => `family=${f.googleFonts}`)
    .join('&');

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${identity.name}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?${googleFontsUrl}&display=swap" rel="stylesheet" />
  <link rel="stylesheet" href="styles.css" />
</head>
<body>
  <main>
    <h1>${identity.name}</h1>
${identity.tagline ? `    <p class="subtitle">${identity.tagline}</p>` : ''}
  </main>
</body>
</html>
`;
  writeFile(path.join(outDir, 'index.html'), html);

  console.log(chalk.dim(`\nOpen ${path.join(outDir, 'index.html')} in a browser.`));
}
