/**
 * Schema validation tests
 */

import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { parseBrandKit, safeParseBrandKit } from '../src/core/schema/brand-kit.js';

const PRESETS_DIR = path.resolve(__dirname, '../presets');
const presetFiles = fs.readdirSync(PRESETS_DIR).filter((f) => f.endsWith('.json'));

describe('parseBrandKit', () => {
  it.each(presetFiles)('validates preset: %s', (file) => {
    const raw = JSON.parse(fs.readFileSync(path.join(PRESETS_DIR, file), 'utf-8'));
    const kit = parseBrandKit(raw);
    expect(kit.meta.schemaVersion).toBe(1);
    expect(kit.identity.name).toBeTruthy();
  });

  it('rejects empty object', () => {
    expect(() => parseBrandKit({})).toThrow();
  });

  it('rejects missing meta', () => {
    const result = safeParseBrandKit({ identity: { name: 'Test' } });
    expect(result.success).toBe(false);
  });

  it('rejects invalid color hex', () => {
    const raw = JSON.parse(fs.readFileSync(path.join(PRESETS_DIR, 'flickday.json'), 'utf-8'));
    raw.colors.primary.hex = 'not-a-color';
    expect(() => parseBrandKit(raw)).toThrow();
  });

  it('rejects hex without # prefix', () => {
    const raw = JSON.parse(fs.readFileSync(path.join(PRESETS_DIR, 'flickday.json'), 'utf-8'));
    raw.colors.primary.hex = 'facc15';
    expect(() => parseBrandKit(raw)).toThrow();
  });
});
