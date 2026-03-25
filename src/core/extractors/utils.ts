/**
 * Extractor Utilities
 *
 * Shared helpers for parsing design tokens from source files.
 */

import fs from 'node:fs';
import path from 'node:path';
import type { FontClassification } from '../schema/typography.js';

// ---------------------------------------------------------------------------
// File Reading
// ---------------------------------------------------------------------------

const SUPPORTED_EXTENSIONS = new Set([
  '.tsx', '.jsx', '.ts', '.js', '.svelte', '.html', '.css', '.scss', '.vue',
]);

const SKIP_DIRS = new Set([
  'node_modules', '.next', 'dist', '.svelte-kit', '.nuxt', '.output', '__pycache__',
]);

const MAX_FILES = 100;
const MAX_TOTAL_BYTES = 5 * 1024 * 1024; // 5MB

export interface SourceFile {
  path: string;
  content: string;
}

/**
 * Recursively read all source files from a directory.
 * Filters to supported extensions, skips build artifacts.
 * Caps at 100 files / 5MB total to avoid memory issues.
 */
export function readSourceFiles(dirPath: string): SourceFile[] {
  const files: SourceFile[] = [];
  let totalBytes = 0;

  function walk(dir: string) {
    if (files.length >= MAX_FILES || totalBytes >= MAX_TOTAL_BYTES) return;

    let entries: fs.Dirent[];
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }

    for (const entry of entries) {
      if (files.length >= MAX_FILES || totalBytes >= MAX_TOTAL_BYTES) break;

      if (entry.isDirectory()) {
        if (!SKIP_DIRS.has(entry.name) && !entry.name.startsWith('.')) {
          walk(path.join(dir, entry.name));
        }
      } else if (entry.isFile()) {
        const ext = path.extname(entry.name).toLowerCase();
        if (SUPPORTED_EXTENSIONS.has(ext)) {
          try {
            const content = fs.readFileSync(path.join(dir, entry.name), 'utf-8');
            totalBytes += content.length;
            files.push({ path: path.join(dir, entry.name), content });
          } catch {
            // Skip unreadable files
          }
        }
      }
    }
  }

  walk(dirPath);

  if (files.length >= MAX_FILES) {
    console.warn(`Warning: capped at ${MAX_FILES} files — results may be incomplete`);
  }
  if (totalBytes >= MAX_TOTAL_BYTES) {
    console.warn(`Warning: capped at 5MB total — results may be incomplete`);
  }

  return files;
}

// ---------------------------------------------------------------------------
// Hex Normalization
// ---------------------------------------------------------------------------

/**
 * Normalize a raw hex string to #rrggbb format.
 * Handles 3-char shorthand (#abc → #aabbcc) and strips alpha (#rrggbbaa → #rrggbb).
 * Returns null for invalid input.
 */
export function normalizeHex(raw: string): string | null {
  let hex = raw.trim().toLowerCase();
  if (!hex.startsWith('#')) hex = '#' + hex;

  // 3-char shorthand
  if (/^#[0-9a-f]{3}$/.test(hex)) {
    return '#' + hex[1] + hex[1] + hex[2] + hex[2] + hex[3] + hex[3];
  }

  // 6-char (standard)
  if (/^#[0-9a-f]{6}$/.test(hex)) {
    return hex;
  }

  // 8-char (with alpha) — strip alpha
  if (/^#[0-9a-f]{8}$/.test(hex)) {
    return hex.slice(0, 7);
  }

  return null;
}

// ---------------------------------------------------------------------------
// Frequency Analysis
// ---------------------------------------------------------------------------

/**
 * Given an array of items with duplicates, return unique entries sorted by frequency (descending).
 */
export function deduplicateByFrequency<T>(items: T[]): T[] {
  const counts = new Map<T, number>();
  for (const item of items) {
    counts.set(item, (counts.get(item) ?? 0) + 1);
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([item]) => item);
}

/**
 * Return items with their frequency counts, sorted descending.
 */
export function countFrequency<T>(items: T[]): Array<{ item: T; count: number }> {
  const counts = new Map<T, number>();
  for (const item of items) {
    counts.set(item, (counts.get(item) ?? 0) + 1);
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([item, count]) => ({ item, count }));
}

// ---------------------------------------------------------------------------
// Font Classification Lookup
// ---------------------------------------------------------------------------

/**
 * Known Google Fonts → FontClassification mapping.
 * Used to classify extracted fonts without requiring user input.
 */
export const FONT_CLASSIFICATIONS: Record<string, FontClassification> = {
  // Sans-serif
  'inter': 'sans-serif',
  'roboto': 'sans-serif',
  'open sans': 'sans-serif',
  'lato': 'sans-serif',
  'poppins': 'sans-serif',
  'nunito': 'sans-serif',
  'montserrat': 'sans-serif',
  'raleway': 'sans-serif',
  'dm sans': 'sans-serif',
  'manrope': 'sans-serif',
  'plus jakarta sans': 'sans-serif',
  'figtree': 'sans-serif',
  'geist': 'sans-serif',
  'work sans': 'sans-serif',
  'outfit': 'sans-serif',
  'sora': 'sans-serif',
  'albert sans': 'sans-serif',
  'space grotesk': 'sans-serif',
  'rival sans': 'sans-serif',

  // Serif
  'playfair display': 'serif',
  'merriweather': 'serif',
  'lora': 'serif',
  'georgia': 'serif',
  'libre baskerville': 'serif',
  'source serif pro': 'serif',
  'dm serif display': 'serif',
  'fraunces': 'serif',
  'instrument serif': 'serif',

  // Slab-serif
  'roboto slab': 'slab-serif',
  'zilla slab': 'slab-serif',

  // Display
  'bebas neue': 'display',
  'righteous': 'display',
  'oswald': 'display',
  'passion one': 'display',
  'anton': 'display',
  'archivo black': 'display',

  // Condensed
  'barlow condensed': 'condensed',
  'roboto condensed': 'condensed',

  // Monospace
  'jetbrains mono': 'monospace',
  'fira code': 'monospace',
  'source code pro': 'monospace',
  'ibm plex mono': 'monospace',
  'geist mono': 'monospace',
  'cascadia code': 'monospace',

  // Handwritten
  'caveat': 'handwritten',
  'dancing script': 'handwritten',
  'pacifico': 'handwritten',
};

/**
 * Classify a font family name. Returns null if unknown.
 */
export function classifyFont(family: string): FontClassification | null {
  return FONT_CLASSIFICATIONS[family.toLowerCase()] ?? null;
}
