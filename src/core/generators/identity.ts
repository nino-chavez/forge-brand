/**
 * Identity Generator
 *
 * Given minimal input (name + domain + a few personality words),
 * generates a complete BrandIdentity block: tagline, mission,
 * audience, personality expansion, positioning.
 *
 * This is the "brand strategist" persona.
 */

import type { BrandIdentity } from '../schema/brand-kit.js';
import { callModel } from './provider.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface IdentityGeneratorOptions {
  name: string;
  domain?: string;
  personality?: string[];
  /** Any additional context about the brand */
  context?: string;
}

// ---------------------------------------------------------------------------
// Prompt
// ---------------------------------------------------------------------------

function buildIdentityPrompt(options: IdentityGeneratorOptions): string {
  const { name, domain, personality, context } = options;

  return `You are a brand strategist. Generate a complete brand identity for "${name}".

INPUT:
- Name: ${name}
${domain ? `- Domain/Industry: ${domain}` : ''}
${personality?.length ? `- Initial personality traits: ${personality.join(', ')}` : ''}
${context ? `- Additional context: ${context}` : ''}

GENERATE a complete brand identity with:
1. tagline — short, memorable, captures the essence (under 8 words)
2. mission — why this brand exists, what problem it solves (1-2 sentences)
3. audience — 3-5 specific audience segments (not generic like "everyone")
4. personality — 4-6 traits that define how the brand communicates (expand from input if provided)
5. positioning — what makes this brand different from alternatives (1-2 sentences)

RULES:
- Tagline must be concise and distinctive, not generic
- Mission must state a specific value proposition, not just "we do X"
- Audience segments must be specific roles/types, not demographics
- Personality traits must be actionable (guide content creation), not vague ("quality")
- Positioning must reference the competitive landscape

DO NOT:
- Use buzzwords: innovative, disruptive, revolutionary, cutting-edge, next-level
- Be generic: "for everyone", "the best", "world-class"
- Use passive voice in the mission

OUTPUT FORMAT:
Return a JSON object:
{
  "name": "${name}",
  "tagline": "string",
  "mission": "string",
  "audience": ["string"],
  "personality": ["string"],
  "positioning": "string",
  "domain": "${domain || ''}"
}

Return ONLY the JSON object, no other text.`;
}

// ---------------------------------------------------------------------------
// Generator
// ---------------------------------------------------------------------------

export async function generateIdentity(
  options: IdentityGeneratorOptions,
): Promise<BrandIdentity> {
  const prompt = buildIdentityPrompt(options);
  const raw = await callModel(prompt);

  const jsonStr = raw.replace(/```json?\n?/g, '').replace(/```/g, '').trim();
  const parsed = JSON.parse(jsonStr) as {
    name: string;
    tagline: string;
    mission: string;
    audience: string[];
    personality: string[];
    positioning: string;
    domain?: string;
  };

  return {
    name: parsed.name,
    tagline: parsed.tagline,
    mission: parsed.mission,
    audience: parsed.audience,
    personality: parsed.personality,
    positioning: parsed.positioning,
    domain: parsed.domain || options.domain,
    links: {},
  };
}
