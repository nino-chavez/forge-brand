/**
 * Voice Generator
 *
 * Synthesizes voice rules from brand identity and example content.
 * Produces VoiceSystem-compatible output with attributes, anti-patterns,
 * and paired good/bad examples.
 */

import type { VoiceSystem } from '../schema/voice.js';
import { callModel } from './provider.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface VoiceGeneratorOptions {
  /** Brand name */
  name: string;
  /** Brand personality traits */
  personality: string[];
  /** Target audience */
  audience: string[];
  /** Industry/domain */
  domain?: string;
  /** Example content that represents the brand's voice (optional) */
  exampleContent?: string;
  /** Existing voice rules to refine (optional) */
  existingVoice?: VoiceSystem;
}

// ---------------------------------------------------------------------------
// Prompt Construction
// ---------------------------------------------------------------------------

function buildVoicePrompt(options: VoiceGeneratorOptions): string {
  const { name, personality, audience, domain, exampleContent, existingVoice } = options;

  return `You are a brand voice strategist. Generate a complete voice system for "${name}".

BRAND CONTEXT:
- Personality: ${personality.join(', ')}
- Audience: ${audience.join(', ')}
${domain ? `- Industry: ${domain}` : ''}

${exampleContent ? `EXAMPLE CONTENT (analyze this for voice patterns):\n${exampleContent.slice(0, 2000)}\n` : ''}
${existingVoice ? `EXISTING VOICE RULES TO REFINE:\n${JSON.stringify(existingVoice, null, 2).slice(0, 1000)}\n` : ''}

GENERATE:
1. 4-6 voice attributes (trait + description + example sentence)
2. 3-5 anti-patterns (things this brand must NEVER sound like) with detection phrases
3. 2-4 structural patterns (how content is organized)
4. 3-5 paired good/bad examples showing the same intent expressed correctly and incorrectly

RULES:
- Anti-patterns must have concrete detection phrases (not vague categories)
- Good examples must embody the personality traits
- Bad examples must violate the anti-patterns
- Every attribute must be specific to THIS brand, not generic advice

OUTPUT FORMAT:
Return a JSON object with this exact structure:
{
  "attributes": [{ "trait": "string", "description": "string", "example": "string" }],
  "antiPatterns": [{ "category": "string", "patterns": ["string"], "severity": "error"|"warning", "suggestion": "string" }],
  "structuralPatterns": [{ "name": "string", "description": "string", "required": false, "example": "string" }],
  "examples": [{ "intent": "string", "good": "string", "bad": "string" }],
  "minimumScore": 70
}

Return ONLY the JSON object, no other text.`;
}

// ---------------------------------------------------------------------------
// Generator
// ---------------------------------------------------------------------------

export async function generateVoice(options: VoiceGeneratorOptions): Promise<VoiceSystem> {
  const prompt = buildVoicePrompt(options);
  const raw = await callModel(prompt);

  const jsonStr = raw.replace(/```json?\n?/g, '').replace(/```/g, '').trim();
  return JSON.parse(jsonStr) as VoiceSystem;
}
