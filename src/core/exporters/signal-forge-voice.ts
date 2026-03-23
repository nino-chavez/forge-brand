/**
 * Signal Forge Voice Bridge
 *
 * Pure function: BrandKit.voice → signal-forge VoiceRules format.
 * Maps brand-forge's VoiceSystem to signal-forge's VoiceRules interface.
 *
 * signal-forge VoiceRules shape:
 * {
 *   openingPatterns: { questionFirst, uncomfortableTruth, avoidAcademic[], avoidCasual[] },
 *   structuralPatterns: { evolution, compareContrast, provisional, boldHeaders },
 *   tonalElements: { selfInterrogation, culturalTouchstones, technicalDepth, conversational },
 *   avoid: { corporateJargon[], academicDistance[], humbleBragging[], prescriptiveAuthority[] }
 * }
 */

import type { BrandKit } from '../schema/brand-kit.js';

export function exportSignalForgeVoice(kit: BrandKit): string {
  const { voice } = kit;

  // Map anti-patterns to signal-forge's avoid categories
  const avoidMap: Record<string, string[]> = {
    corporateJargon: [],
    academicDistance: [],
    humbleBragging: [],
    prescriptiveAuthority: [],
  };

  for (const ap of voice.antiPatterns) {
    const category = ap.category.toLowerCase().replace(/[-\s]+/g, '');
    if (category.includes('corporate') || category.includes('jargon')) {
      avoidMap.corporateJargon.push(...ap.patterns);
    } else if (category.includes('academic') || category.includes('distance') || category.includes('passive')) {
      avoidMap.academicDistance.push(...ap.patterns);
    } else if (category.includes('humble') || category.includes('bragging')) {
      avoidMap.humbleBragging.push(...ap.patterns);
    } else if (category.includes('prescriptive') || category.includes('authority')) {
      avoidMap.prescriptiveAuthority.push(...ap.patterns);
    } else {
      // Default unmapped anti-patterns to corporate jargon bucket
      avoidMap.corporateJargon.push(...ap.patterns);
    }
  }

  // Map structural patterns to signal-forge booleans
  const structNames = voice.structuralPatterns.map((s) => s.name.toLowerCase());
  const hasAttribute = (trait: string) =>
    voice.attributes.some((a) => a.trait.toLowerCase().includes(trait));

  const voiceRules = {
    openingPatterns: {
      questionFirst: structNames.some((n) => n.includes('question')),
      uncomfortableTruth: hasAttribute('provocative') || hasAttribute('direct'),
      avoidAcademic: avoidMap.academicDistance.slice(0, 5),
      avoidCasual: avoidMap.corporateJargon.filter((p) =>
        /hey|gonna|wanna|today i want/i.test(p),
      ),
    },
    structuralPatterns: {
      evolution: structNames.some((n) => n.includes('evolution')),
      compareContrast: structNames.some((n) => n.includes('compare') || n.includes('contrast')),
      provisional: structNames.some((n) => n.includes('provisional')) || hasAttribute('provisional'),
      boldHeaders: true, // Default — most brands use bold headers
    },
    tonalElements: {
      selfInterrogation: hasAttribute('self-interrogating') || hasAttribute('provisional'),
      culturalTouchstones: hasAttribute('conversational') || hasAttribute('playful'),
      technicalDepth: hasAttribute('technical') || hasAttribute('analytical'),
      conversational: hasAttribute('conversational') || hasAttribute('direct'),
    },
    avoid: avoidMap,
  };

  return JSON.stringify(voiceRules, null, 2);
}
