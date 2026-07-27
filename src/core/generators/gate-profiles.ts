/**
 * What tool fits which gate
 *
 * Generation was scoped by gate but never shaped by it. One generic image
 * prompt served every gate, and it contradicted itself: the variation hints
 * asked for "wordmark with custom letterforms" and "icon + wordmark lockup"
 * while the same prompt ended with `NO text, words, letters, or typography`.
 * So the wordmark gate could not produce a wordmark, and the territory gate —
 * where the point is to choose an idea before anything is drawn — produced
 * artwork on request.
 *
 * The fix is not five new pipelines. It is admitting which gates an image
 * model is the right tool for, and refusing the rest with the reason and the
 * thing to do instead. A refusal that names the alternative beats a
 * capability that silently produces the wrong artifact.
 *
 * Add a profile when you have evidence a gate generates well, not before.
 */

export interface GateProfile {
  /** Variation directions, all consistent with `rules` */
  hints: string[];
  /** Hard constraints appended to every prompt at this gate */
  rules: string[];
}

/** Why an image model is the wrong tool here, and what to use instead. */
export interface GateRefusal {
  reason: string;
  instead: string;
}

const SYMBOL: GateProfile = {
  hints: [
    'minimal geometric mark — simple shapes, one or two colors, works at any size',
    'abstract mark — non-literal, captures the brand feeling through shape and movement',
    'negative-space mark — the idea reads in what is left out',
    'single-stroke mark — one continuous gesture, consistent weight',
    'monogram — initials stylized until they read as a shape first',
  ],
  rules: [
    'NO text, words, letters, or typography in the image',
    'Generate ONLY the graphic mark / symbol / icon',
    'Typography is composited separately',
    'Must survive a 32px favicon and a one-color garment print',
    'Vector-quality: clean edges, solid shapes, flat color',
  ],
};

const STRESS_TEST: GateProfile = {
  hints: [
    'the mark in situ on a dark athletic garment',
    'the mark as a small watermark over action footage',
    'the mark in a circular social avatar crop',
    'the mark at favicon scale beside browser chrome',
    'the mark on a printed tournament credential',
  ],
  rules: [
    'Show the mark IN CONTEXT at realistic scale — the point is whether it survives, not whether it looks good isolated',
    'Do not redesign the mark; render the one supplied',
    'No invented brand names or slogans in the scene',
  ],
};

export const GATE_PROFILES: Record<string, GateProfile> = {
  symbol: SYMBOL,
  'stress-test': STRESS_TEST,
};

/**
 * Gates where an image model is the wrong instrument. Each names the reason
 * and the actual next step, so the refusal is directive rather than a wall.
 */
export const GATE_REFUSALS: Record<string, GateRefusal> = {
  territory: {
    reason:
      'A territory is a strategic idea, not an artifact. Drawing before the idea is settled is the drift this whole system exists to stop — the first image becomes the thing everyone argues about.',
    instead:
      'Write the territories out and record them: brand-forge candidate add -g territory -m other -d "<the idea, in a sentence>"',
  },
  wordmark: {
    reason:
      'Image models do not set type. They approximate letterforms, so spacing, weight and curve quality are decorative rather than real — and a wordmark is nothing but those three things.',
    instead:
      'Set specimens in actual fonts (fontTools / a browser sheet), export SVG, then record each as a candidate with -m type-setting.',
  },
  lockup: {
    reason:
      'A lockup is the geometric relationship between an approved wordmark and an approved symbol. Regenerating either one from a prompt means you are no longer composing what was approved.',
    instead:
      'Compose the approved assets deterministically, then record the arrangement with -m hand-vector.',
  },
  production: {
    reason:
      'Masters must be true editable vectors. Anything a raster model emits is a picture of a logo, not a logo.',
    instead:
      'Rebuild the geometry by hand and record it with -m hand-vector, with parent set to the approved candidate.',
  },
  motion: {
    reason: 'Motion is behavior over time, not a still frame.',
    instead: 'Build it in HyperFrames against the approved mark, once production has signed off.',
  },
};

/** Profile for a gate, or null when no profile is declared. */
export function profileFor(gate: string): GateProfile | null {
  return GATE_PROFILES[gate] ?? null;
}

/** Refusal for a gate, or null when image generation is appropriate. */
export function refusalFor(gate: string): GateRefusal | null {
  if (GATE_PROFILES[gate]) return null;
  return GATE_REFUSALS[gate] ?? null;
}
