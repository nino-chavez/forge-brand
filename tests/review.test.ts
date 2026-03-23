/**
 * Review gate tests
 */

import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { parseBrandKit } from '../src/core/schema/brand-kit.js';
import { reviewBrandKit } from '../src/core/review/index.js';
import { contrastRatio, relativeLuminance } from '../src/core/schema/color.js';
import { checkFontCompatibility } from '../src/core/schema/typography.js';
import { diffBrandKits } from '../src/core/review/consistency.js';

const PRESETS_DIR = path.resolve(__dirname, '../presets');
const presetFiles = fs.readdirSync(PRESETS_DIR).filter((f) => f.endsWith('.json'));

describe('contrastRatio', () => {
  it('black on white is 21:1', () => {
    expect(contrastRatio('#000000', '#ffffff')).toBeCloseTo(21, 0);
  });

  it('white on white is 1:1', () => {
    expect(contrastRatio('#ffffff', '#ffffff')).toBeCloseTo(1, 0);
  });

  it('Flickday Yellow on black passes AA', () => {
    const ratio = contrastRatio('#facc15', '#000000');
    expect(ratio).toBeGreaterThan(4.5);
  });

  it('white on Flickday Yellow fails AA', () => {
    const ratio = contrastRatio('#ffffff', '#facc15');
    expect(ratio).toBeLessThan(4.5);
  });
});

describe('relativeLuminance', () => {
  it('black is 0', () => {
    expect(relativeLuminance('#000000')).toBeCloseTo(0, 2);
  });

  it('white is 1', () => {
    expect(relativeLuminance('#ffffff')).toBeCloseTo(1, 2);
  });
});

describe('checkFontCompatibility', () => {
  it('flags same-class pairing', () => {
    const a = { family: 'Inter', fallbacks: [], classification: 'sans-serif' as const, weights: [400, 700], variable: true, textTransform: 'none' as const, letterSpacing: 0 };
    const b = { family: 'Roboto', fallbacks: [], classification: 'sans-serif' as const, weights: [400, 700], variable: true, textTransform: 'none' as const, letterSpacing: 0 };
    const result = checkFontCompatibility(a, b);
    expect(result.compatible).toBe(false);
    expect(result.issues.length).toBeGreaterThan(0);
  });

  it('passes serif + sans-serif pairing', () => {
    const a = { family: 'Playfair Display', fallbacks: [], classification: 'serif' as const, weights: [400, 700], variable: true, textTransform: 'none' as const, letterSpacing: 0 };
    const b = { family: 'Inter', fallbacks: [], classification: 'sans-serif' as const, weights: [400, 700], variable: true, textTransform: 'none' as const, letterSpacing: 0 };
    const result = checkFontCompatibility(a, b);
    expect(result.compatible).toBe(true);
  });

  it('flags display + monospace pairing', () => {
    const a = { family: 'Bebas Neue', fallbacks: [], classification: 'display' as const, weights: [400], variable: false, textTransform: 'uppercase' as const, letterSpacing: 0 };
    const b = { family: 'JetBrains Mono', fallbacks: [], classification: 'monospace' as const, weights: [400, 700], variable: true, textTransform: 'none' as const, letterSpacing: 0 };
    const result = checkFontCompatibility(a, b);
    expect(result.compatible).toBe(false);
  });
});

describe('reviewBrandKit', () => {
  it.each(presetFiles)('preset passes review: %s', (file) => {
    const raw = JSON.parse(fs.readFileSync(path.join(PRESETS_DIR, file), 'utf-8'));
    const kit = parseBrandKit(raw);
    const report = reviewBrandKit(kit);
    expect(report.passed).toBe(true);
  });
});

describe('diffBrandKits', () => {
  it('detects no changes on identical kits', () => {
    const raw = JSON.parse(fs.readFileSync(path.join(PRESETS_DIR, 'flickday.json'), 'utf-8'));
    const kit = parseBrandKit(raw);
    const changes = diffBrandKits(kit, kit);
    expect(changes).toHaveLength(0);
  });

  it('detects color change', () => {
    const raw = JSON.parse(fs.readFileSync(path.join(PRESETS_DIR, 'flickday.json'), 'utf-8'));
    const kit1 = parseBrandKit(raw);
    const raw2 = JSON.parse(JSON.stringify(raw));
    raw2.colors.primary.hex = '#ff0000';
    const kit2 = parseBrandKit(raw2);
    const changes = diffBrandKits(kit1, kit2);
    expect(changes.length).toBeGreaterThan(0);
    expect(changes.some((c) => c.path.includes('primary') && c.type === 'changed')).toBe(true);
  });
});
