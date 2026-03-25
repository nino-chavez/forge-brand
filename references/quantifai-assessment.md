# QuantifAI — UI/UX & Design Assessment

> **Assessed**: 2026-03-23
> **Against**: 8 design references (ChatPRD, Vercel, Resend, Supabase, Stitch, Notion, Figma, Linear)
> **Projects**: quantifai-lite (SvelteKit, dark-only), quantifai-platform (SvelteKit + FastAPI, light+dark)

---

## Executive Summary

QuantifAI has strong technical foundations — custom components, warm color tokens, no UI library bloat, and a clear domain model. But measured against best-in-class SaaS products, it has **5 critical gaps** and **12 opportunities** for improvement. The Lite product is more polished per-page but limited in scope. The Platform is architecturally ambitious (46 routes, 65+ tables) but its UI doesn't yet match the sophistication of its backend.

**Overall Grade**: B- (Lite), C+ (Platform)

---

## 1. Visual Design System

### What's Working

| Strength | Evidence | Reference Match |
|----------|----------|-----------------|
| Warm neutrals | `#0a0a0a` bg, `#131210` surface — not cold `#000` | Matches Notion's warm palette philosophy |
| Gold accent discipline | Single accent (#f0c05e/#e8a735) used consistently | Matches Linear's single-accent discipline |
| Font stack | Space Grotesk (display) + Inter (body) + JetBrains Mono | Same stack as 630 apps — good family consistency |
| Metric typography | `.metric-number` with tabular numerals | Matches Resend's hero numbers pattern |
| Dark mode tokens | Full light/dark token set with semantic colors | Matches Supabase's dark-first approach |

### Gaps & Recommendations

| Gap | Current State | Reference Best Practice | Fix |
|-----|--------------|------------------------|-----|
| **No serif warmth** | All sans-serif headings | ChatPRD, Notion, Stitch use serif for display headings | Add a serif/display option for page titles (e.g., landing, executive views). Space Grotesk is geometric sans — consider pairing with a serif for hero moments. |
| **Card treatment is generic** | `.surface` = bg + border + radius | Vercel: hairline separators. Resend: bordered cards with hero numbers. Supabase: horizontal carousel. | Differentiate card types: metric cards (hero number + chart), status cards (2x2 grid like Supabase), list cards (hairline-separated like Vercel). |
| **No gradient/personality moment** | Flat colors everywhere | ChatPRD: one gradient headline. Stitch: zero-color but serif personality. | Add exactly one gold gradient moment — e.g., the dashboard greeting or the executive summary heading. One, not everywhere. |
| **Chart colors lack system** | Ad-hoc hex values for chart series | Resend: green=good, red=bad semantic. Supabase: brand green for all chart bars. | Formalize chart palette: gold for cost (primary metric), blue for usage, green for savings, red for overages. Document in design tokens. |
| **No empty state design** | `empty-state.svelte` exists but is basic | ChatPRD: icon + heading + description + CTA. Linear: product icons + shortcut in button. | Upgrade empty states with: relevant icon, explanatory heading, description of what will appear, primary CTA with keyboard shortcut. |

---

## 2. Information Architecture

### QuantifAI Lite (7 routes)

| Assessment | Rating | Notes |
|-----------|--------|-------|
| Route count | Good | 7 authenticated routes is appropriately scoped |
| Nav structure | Good | 5-item top nav (Dashboard, Patterns, Index, Settings, Help) |
| Hierarchy depth | Good | Flat — no nesting needed at this scale |
| Discoverability | Needs work | Help is a drawer, not contextual. No search. No command palette. |

**Reference comparison**: Lite's nav is closest to **Resend** (10 flat items) but simpler. This is appropriate for a solo-developer tool.

### QuantifAI Platform (46 routes)

| Assessment | Rating | Notes |
|-----------|--------|-------|
| Route count | Excessive | 46 routes is too many for the sidebar model being used |
| Nav structure | Problematic | 7 sidebar groups (Spend, Adoption, Outcomes, Governance, Executive, Admin, Platform) with sub-items |
| Hierarchy depth | Too deep | Org > BU > Team > Person > Session > Detail = 6 levels |
| Discoverability | Poor | Basic/Advanced toggle is a band-aid. Users shouldn't choose their nav complexity. |
| Role-based visibility | Good idea, risky execution | Hiding nav items by role can confuse users about what exists |

**Critical finding**: The Platform's IA doesn't match any reference. It's trying to be **Supabase** (deep hierarchy) but without Supabase's three-layer nav solution (top bar context + icon sidebar + inner sidebar).

### Recommendations

| Issue | Current | Recommended (from references) |
|-------|---------|------------------------------|
| **46 routes overwhelm sidebar** | 7-group sidebar with expanding items | **Supabase model**: Collapse to icon sidebar (~13 icons) for features, use breadcrumb for context (org > team > view). The icon sidebar at 48px gives maximum chart/data area. |
| **No command palette** | None | **Vercel/Linear model**: Add ⌘K command palette for power-user navigation. With 46 routes, search is mandatory. |
| **Basic/Advanced toggle** | Binary toggle hiding routes | **Linear model**: Show all routes but use "Views" concept — let users save custom filtered views instead of hiding features. |
| **No breadcrumb** | Route-based active state only | **Supabase model**: Add breadcrumb in top bar: Org > Team > Spend > Cost. Users need to know where they are in 6 levels. |
| **Executive views are separate routes** | `/executive`, `/executive/cfo` | **Notion model**: Executive views should be the same data with a different presentation — use view switcher tabs (Detailed / Executive / CFO) on existing pages, not separate routes. |
| **Help drawer is monolithic** | 103KB help-content.ts | **Notion model**: Contextual help — show help relevant to the current page, not a global drawer with everything. |

---

## 3. Component Patterns

### What's Working

| Component | Quality | Notes |
|-----------|---------|-------|
| `metric-card.svelte` | Good | Label + value + format. Matches Resend hero numbers. |
| `area-chart.svelte` (Lite) | Good | Pure SVG, no D3 bloat. Gold fill. |
| `stacked-bar-chart.svelte` (Platform) | Good | D3-powered, well-differentiated colors. |
| `filter-bar.svelte` | Adequate | Multi-filter, but not composable dropdowns. |
| `theme-toggle.svelte` | Good | Smooth 150ms transition. |
| `virtual-list.svelte` | Good | Performance-conscious for large datasets. |
| `autonomy-badge.svelte` | Good | Domain-specific, meaningful. |

### Missing Patterns (from references)

| Missing Pattern | Reference Source | Why It Matters |
|----------------|-----------------|----------------|
| **Horizontal card carousel** | Supabase metrics dashboard | Platform has 4+ metrics that could scroll horizontally instead of wrapping to rows. Saves vertical space. |
| **Risk threshold lines** | Resend bounce/complaint charts | Cost charts should show budget threshold lines (dashed + "OVER BUDGET" label). Currently no visual budget indicators on charts. |
| **Sparklines** | Vercel project cards | Session list and team list items should have tiny trend charts inline. Shows trajectory without opening details. |
| **Status badge system** | Resend (Delivered/Verified), Linear (status circles) | Platform has `status-pill.svelte` and `seat-status-badge.svelte` but they aren't standardized. Need a unified badge system: Active (green), Warning (amber), Over Budget (red), Paused (gray). |
| **Feed/activity view** | Notion feed cards | Session list is currently a table. A feed view (card per session with author, timestamp, cost, outcome) would be more scannable for recent activity. |
| **Announcement/What's New** | Linear (bottom-left banner), Figma (dismissible banner) | No feature announcement mechanism. New features go unnoticed. |
| **Keyboard shortcuts in buttons** | Linear | Primary CTAs should show shortcuts: "Create Session ⌘N", "Search ⌘K", "Export ⌘E". |
| **Product switcher pills** | Figma (Design/FigJam/Slides) | Lite and Platform are separate deployments. If they converge, a top-bar product pill switcher (Lite/Pro/Enterprise) would unify the experience. |
| **Grid/list toggle** | Figma | Project treemap is D3-only. Should offer grid (treemap) and list (table) views. |
| **Inline comments** | Notion | Sessions and attribution data would benefit from inline annotation — "This spike was from the demo" type comments. |

---

## 4. Brand & Visual Identity

### Current State

| Element | Lite | Platform |
|---------|------|----------|
| Logo | Wordmark "QuantifAI" with gold "AI" | Text-based, configurable via env var |
| Favicon | Gold magnifying glass SVG | PNG favicons (multiple sizes) |
| Accent | Gold (#f0c05e) — single accent | Blue (#3b82f6) primary + Gold (#e8a735) decorative |
| Tagline | "Know what your AI tools actually cost you" | "Quantify your AI" |
| Entity | Signal x Studio LLC | Configurable (white-label) |

### Brand Assessment

| Dimension | Rating | Notes |
|-----------|--------|-------|
| **Consistency** | C | Lite uses gold as primary CTA color. Platform uses blue for CTAs and gold as decorative only. This is a brand identity split. |
| **Differentiation** | B- | Gold accent is distinctive in a market of blue/purple SaaS tools. But it's not leveraged enough — no gradient, no personality moment. |
| **White-label vs Brand** | Problem | Platform's env-var-driven branding is good for enterprise but means the *default* brand is weak. Configurable ≠ designed. |
| **Typography personality** | B | Space Grotesk is a good choice — geometric but warm. But it's used the same way everywhere. No typographic hierarchy beyond size. |
| **Dark mode as brand** | B+ (Lite) / B- (Platform) | Lite's dark-only is a clear brand choice. Platform's dual-mode dilutes the identity. Pick one as default and commit. |

### Recommendations

1. **Resolve the gold/blue split**: Pick one. Gold is more distinctive. Make gold the primary interactive color on Platform too — blue is generic. Use blue only for links (like Vercel does).

2. **Create a brand moment**: Every reference has one — ChatPRD's gradient headline, Stitch's serif welcome, Linear's purple CTA, Supabase's green. QuantifAI should have a gold gradient headline on the dashboard welcome: "Your AI spend this week" with a subtle gold-to-amber gradient.

3. **Commit to dark as default**: The data analytics space (Grafana, Datadog, Linear) is dark-first. QuantifAI should follow. Make dark mode the default, light mode the option.

4. **Design a proper logo**: Both products use text wordmarks. Compare to Supabase (bolt icon), Vercel (triangle), Linear (stacked lines). QuantifAI needs a mark — something that works at 16x16 favicon size and represents "quantifying AI."

---

## 5. Specific Fixes — Prioritized

### P0 (Do Now)

| Fix | Project | Effort | Impact |
|-----|---------|--------|--------|
| Add ⌘K command palette | Platform | Medium | High — 46 routes demand keyboard nav |
| Add breadcrumb to top bar | Platform | Low | High — users are lost in 6-level hierarchy |
| Standardize empty states | Both | Low | Medium — every page needs one |
| Unify accent color (gold everywhere) | Platform | Low | High — brand consistency |
| Add budget threshold lines to charts | Both | Medium | High — turns charts into actionable tools |

### P1 (Do Next)

| Fix | Project | Effort | Impact |
|-----|---------|--------|--------|
| Convert sidebar to icon-only (Supabase model) | Platform | Medium | High — reclaims screen space for data |
| Add horizontal card carousel for metrics | Platform | Medium | Medium — better density for metric grids |
| Add sparklines to session/team list items | Both | Medium | Medium — shows trends at a glance |
| Implement What's New banner | Both | Low | Medium — feature discovery |
| Add keyboard shortcuts to primary CTAs | Both | Low | Medium — power user speed |

### P2 (Do Later)

| Fix | Project | Effort | Impact |
|-----|---------|--------|--------|
| Feed view for sessions (Notion-style cards) | Platform | High | Medium — better than table for recent activity |
| Saved views / custom filters | Platform | High | High — replaces Basic/Advanced toggle |
| Inline annotations on sessions | Platform | Medium | Medium — collaboration feature |
| Product switcher (Lite/Pro) | Both | Medium | Low — only matters when products converge |
| Design a proper logo mark | Both | External | High — brand identity |

---

## 6. Gap Summary by Reference

| Reference | What QuantifAI Already Has | What's Missing |
|-----------|---------------------------|----------------|
| **ChatPRD** | Action cards on landing | Empty state design, gradient personality moment |
| **Vercel** | Project-level views | Sparklines, hairline separators, split buttons |
| **Resend** | Hero metric numbers, data tables | Risk threshold lines, composable filter dropdowns, relative timestamps |
| **Supabase** | Dark mode, warm tokens | Icon sidebar, breadcrumb, 3-layer nav, advisor cards |
| **Stitch** | Prompt/AI features | Suggestion chips, zero-chrome for focus modes |
| **Notion** | Collapsible sections | Warm palette (Platform uses cold blues), inline comments, block composition |
| **Figma** | File/project browsing | Thumbnail previews, grid/list toggle, product switcher pills |
| **Linear** | Issue/session tracking | Keyboard shortcuts in UI, saved views, tab bar for status, What's New banner |

---

## 7. IA Restructure Proposal (Platform)

Current 7-group sidebar → Proposed 3-layer navigation:

```
CURRENT (problematic)                    PROPOSED (Supabase-inspired)
─────────────────────                    ──────────────────────────────

Sidebar (220px)                          Layer 1: Top Bar
├── Spend ▾                              ├── Logo
│   ├── Cost                             ├── Breadcrumb: Org > Team > View
│   ├── Seats                            ├── ⌘K Search
│   └── Timeline                         ├── Theme toggle
├── Adoption ▾                           └── User menu
│   ├── Teams
│   ├── Developers                       Layer 2: Icon Sidebar (48px)
│   └── Projects                         ├── 📊 Dashboard (home)
├── Outcomes ▾                           ├── 💰 Spend
│   ├── Attribution                      ├── 👥 Adoption
│   ├── Sessions                         ├── 🎯 Outcomes
│   ├── Knowledge                        ├── 📈 Analytics
│   └── Analytics (9 sub-tabs!)          ├── 🔒 Governance
├── Governance ▾                         ├── 🏢 Executive
│   ├── Queue                            ├── ⚙️ Settings
│   ├── Policies                         └── ❓ Help
│   └── Audit
├── Executive ▾                          Layer 3: Inner Sidebar (contextual)
│   ├── Summary                          Spend selected →
│   └── CFO Brief                        ├── Overview (was Cost)
├── Admin ▾                              ├── Seats
│   └── Settings                         ├── Timeline
└── Platform ▾                           └── Forecast
    ├── Organizations
    └── Users                            Outcomes selected →
                                         ├── Attribution
                                         ├── Sessions
                                         ├── Knowledge
                                         └── Quality Tax

                                         Analytics becomes TAB BAR on each page
                                         (not a separate 9-tab mega-page)
```

**Key changes**:
1. Icon sidebar gives maximum data area (48px vs 220px = 172px reclaimed)
2. Breadcrumb replaces mental model tracking
3. Analytics sub-tabs become per-page tab bars (correlations on Spend, forecasting on Cost, etc.)
4. Executive views become a "view mode" toggle on existing pages, not separate routes
5. Admin/Platform collapse into Settings with role-gated sections
