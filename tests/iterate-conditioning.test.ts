/**
 * Iteration must actually send the mark
 *
 * `generate iterate` claimed to produce variants of a candidate while sending
 * only its text descriptor, so the model re-invented the mark each round and
 * geometry drifted. These assert the request payload rather than the console
 * banner, which is what made the claim look true.
 *
 * Stubs fetch — no network, no credits.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { iterateLogoConcept, encodeImage } from '../src/core/generators/logo-iterate.js';

let dir: string;
let bodies: any[];
let realFetch: typeof globalThis.fetch;

/** 1x1 transparent PNG. */
const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
  'base64',
);

beforeEach(() => {
  dir = fs.mkdtempSync(path.join(os.tmpdir(), 'forge-iter-'));
  bodies = [];
  realFetch = globalThis.fetch;
  process.env.OPENROUTER_API_KEY = 'test-key';

  globalThis.fetch = vi.fn(async (_url: any, init: any) => {
    bodies.push(JSON.parse(init.body));
    return {
      ok: true,
      json: async () => ({
        choices: [{ message: { images: [{ b64_json: PNG.toString('base64') }] } }],
      }),
    } as any;
  }) as any;
});

afterEach(() => {
  globalThis.fetch = realFetch;
  fs.rmSync(dir, { recursive: true, force: true });
});

const base = {
  direction: 'Asymmetric contact burst',
  name: 'Test Brand',
  accentHex: '#123456',
};

describe('image conditioning', () => {
  it('sends the source image with every variant request', async () => {
    const src = path.join(dir, 'mark.png');
    fs.writeFileSync(src, PNG);

    await iterateLogoConcept({ ...base, sourceImagePath: src, outputDir: path.join(dir, 'out') });

    expect(bodies.length).toBeGreaterThan(0);
    for (const body of bodies) {
      const content = body.messages[0].content;
      expect(Array.isArray(content)).toBe(true);
      const image = content.find((c: any) => c.type === 'image_url');
      expect(image).toBeDefined();
      expect(image.image_url.url).toMatch(/^data:image\/png;base64,/);
      const text = content.find((c: any) => c.type === 'text');
      expect(text.text).toContain('The attached image IS the mark');
    }
  });

  it('sends a plain text prompt when there is no source image', async () => {
    await iterateLogoConcept({ ...base, outputDir: path.join(dir, 'out') });

    for (const body of bodies) {
      expect(typeof body.messages[0].content).toBe('string');
      expect(body.messages[0].content).not.toContain('The attached image IS the mark');
    }
  });

  it('reads the image once regardless of variant count', async () => {
    const src = path.join(dir, 'mark.png');
    fs.writeFileSync(src, PNG);
    const spy = vi.spyOn(fs, 'readFileSync');

    await iterateLogoConcept({ ...base, sourceImagePath: src, outputDir: path.join(dir, 'out') });

    const reads = spy.mock.calls.filter((c) => String(c[0]) === src);
    expect(reads).toHaveLength(1);
    spy.mockRestore();
  });
});

describe('encodeImage', () => {
  it('produces a data URL with the right mime type', () => {
    const src = path.join(dir, 'mark.png');
    fs.writeFileSync(src, PNG);
    expect(encodeImage(src)).toBe(`data:image/png;base64,${PNG.toString('base64')}`);
  });

  it('refuses a format the model cannot read rather than sending garbage', () => {
    const svg = path.join(dir, 'mark.svg');
    fs.writeFileSync(svg, '<svg/>');
    expect(() => encodeImage(svg)).toThrow(/Supported/);
  });
});
