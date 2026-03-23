/**
 * Template Registry
 *
 * Maps template IDs to their render functions.
 */

import type { BrandKit } from '../../core/schema/brand-kit.js';
import { SocialCard } from './social-card.js';
import { Story } from './story.js';
import { Flyer } from './flyer.js';
import { Favicon } from './favicon.js';

type TemplateRenderer = (kit: BrandKit, data: Record<string, unknown>) => any;

const TEMPLATES: Record<string, { render: TemplateRenderer; defaultWidth: number; defaultHeight: number }> = {
  'social-card': {
    render: (kit, data) => SocialCard(kit, { title: data.title as string, subtitle: data.subtitle as string | undefined }),
    defaultWidth: 1200,
    defaultHeight: 675,
  },
  'story': {
    render: (kit, data) => Story(kit, { title: data.title as string, date: data.date as string | undefined, location: data.location as string | undefined }),
    defaultWidth: 1080,
    defaultHeight: 1920,
  },
  'flyer': {
    render: (kit, data) => Flyer(kit, {
      eventName: data.eventName as string,
      date: data.date as string,
      location: data.location as string,
      price: data.price as string | undefined,
      tagline: data.tagline as string | undefined,
    }),
    defaultWidth: 1080,
    defaultHeight: 1080,
  },
  'favicon': {
    render: (kit, data) => Favicon(kit, { letter: data.letter as string | undefined }),
    defaultWidth: 512,
    defaultHeight: 512,
  },
};

export function getTemplate(id: string) {
  return TEMPLATES[id];
}

export function listTemplateIds(): string[] {
  return Object.keys(TEMPLATES);
}
