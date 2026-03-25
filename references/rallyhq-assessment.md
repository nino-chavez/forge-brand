# Rally HQ — UI/UX & Design Assessment

> **Assessed**: 2026-03-23
> **Against**: 8 design references (ChatPRD, Vercel, Resend, Supabase, Stitch, Notion, Figma, Linear)
> **Project**: ~/Workspace/dev/apps/rally-hq (SvelteKit monorepo, Supabase, Stripe)

---

## Executive Summary

Rally HQ is the most mature project in the portfolio — 78 components, comprehensive design tokens, real-time scoring, Swiss pairings, billing integration, and public API. The design system (two-tier semantic tokens, dark mode, fluid type) is architecturally sound and ahead of most references. But the UI execution doesn't yet leverage this foundation fully. The product has grown organically and needs a design cohesion pass.

**Overall Grade**: B+ (system) / B- (execution)

---

## 1. Visual Design System

### What's Working (Strong)

| Strength | Evidence | Reference Match |
|----------|----------|-----------------|
| Two-tier token system | Semantic tokens auto-adjust for dark mode | **Beyond** all references — most use single-tier tokens |
| Status color vocabulary | Live (coral), Victory (gold), Brand (indigo), Success/Error/Warning | Matches Linear's single-accent + semantic approach |
| Fluid typography | `clamp()` for all sizes, `--text-xs` → `--text-6xl` | **Beyond** all references — none use fluid type |
| 8px spacing grid | `--space-0` through `--space-24` | Industry standard, well-executed |
| Navy-toned shadows | `--shadow-brand`, `--shadow-victory`, `--shadow-live` | Unique — colored shadows tied to status. None of the references do this. |
| Dark mode architecture | `@media (prefers-color-scheme: dark)` with arena color inversion | Solid, matches Supabase's approach |
| Logo system | "R" monogram + gradient + volleyball arcs + RallyHQ wordmark | More developed than most references (Resend has none, Linear has simple mark) |

### What's Not Working

| Gap | Current State | Reference Best Practice | Fix |
|-----|--------------|------------------------|-----|
| **Sora font is unusual** | Display font is Sora (geometric sans) | ChatPRD/Notion: serif for display warmth. Vercel: Geist (purpose-built). Linear: Inter (proven). | Sora is fine but anonymous. Consider if it communicates "tournament/sports" or just "generic SaaS." Space Grotesk (from QuantifAI/630) would at least unify the portfolio. |
| **No personality moment** | Clean but impersonal | ChatPRD: gradient headline. Linear: purple CTA. Supabase: green everything. | The indigo-to-purple gradient in the logo should extend to one hero moment — e.g., the tournament title on the detail page, or the "LIVE" badge glow. |
| **Card treatment is inconsistent** | Some cards have shadows, some have borders, some have both | Vercel: hairline separators (no shadows). Resend: borders only. Notion: warm subtle borders. | Standardize: Use `--card-radius: 1.5rem` + `--shadow-xs` for default. Use `--shadow-brand` only for elevated/interactive cards. Remove double-treatment. |
| **Tournament hero images are AI-generated** | Vibrant gradient images that don't match the clean UI | None of the references use AI-generated decorative images | Replace with structured hero: tournament name + format badge + status badge + key stats. Let the data be the hero, not a generated image. |
| **Dark mode is preference-based only** | `@media (prefers-color-scheme: dark)` — no manual toggle | Supabase/Linear: user-controlled toggle. Notion: light default, toggle available. | Add a theme toggle (in header or settings). Some organizers work in bright gyms (need light mode) and score in dark venues (need dark). |

---

## 2. Information Architecture

### Current Route Map (20+ routes, 4 custom layouts)

| Route Group | Routes | Layout | Notes |
|-------------|--------|--------|-------|
| Public | `/`, `/tournaments`, `/pricing`, `/docs/api`, content pages | Shared header/footer | Marketing + discovery |
| Auth | `/login`, `/auth/callback` | Custom (no nav) | Clean |
| Tournament Public | `/t/[slug]`, `/t/[slug]/[view]` | Custom (tournament chrome) | Bracket/pools/standings |
| Organizer | `/manage`, `/manage/new`, `/manage/demo` | Shared header/footer | Dashboard |
| Organizer Detail | `/manage/[slug]/*` | Custom (organizer sidebar?) | Tournament management |
| Scorekeeper | `/court/[slug]/[court]` | Custom (full-screen) | Minimal, touch-optimized |
| Captain | `/captain` | Custom (magic token) | Limited view |
| Admin | `/admin/*` | Shared + admin nav | Analytics, moderation |
| Partner | `/partner/*` | Shared + partner nav | Integration management |
| Account | `/account` | Shared header/footer | Settings |

### Assessment

| Dimension | Rating | Notes |
|-----------|--------|-------|
| Route count | Good | ~20 routes is manageable |
| Layout system | Good | 4 custom layouts for distinct contexts (public, organizer, scorer, admin) |
| Hierarchy | Good | `/t/[slug]` (public) vs `/manage/[slug]` (organizer) is clear separation |
| Discoverability | Needs work | No search, no command palette |
| Mobile nav | Adequate | Hamburger menu, but could be better for tournament directors on the go |
| Admin complexity | Growing | 6+ admin pages — may need Supabase-style sidebar as it grows |

### Recommendations

| Issue | Current | Recommended (from references) |
|-------|---------|------------------------------|
| **No search/command palette** | Users navigate by clicking | **Vercel/Linear**: Add ⌘K to jump to any tournament, team, or match by name. Tournament directors manage 10+ events — they need fast navigation. |
| **Public nav is marketing-first** | Home, Tournaments, Gallery, Blog, About, Rules, Register | **Resend model**: Strip to essentials for logged-in users. Tournaments and Manage should be primary. Gallery/Blog/About are secondary. |
| **Organizer dashboard needs tabs** | `/manage/[slug]` is a single view | **Linear model**: Add tab bar — Overview / Teams / Schedule / Scoring / Settings. Currently all crammed into one page or separate routes. |
| **No breadcrumb in organizer context** | Inside `/manage/[slug]` users lose context | **Supabase model**: Add breadcrumb: My Tournaments > Summer Slam 2026 > Teams. Especially important when managing multiple tournaments. |
| **Admin pages will outgrow current nav** | 6+ admin pages with simple nav | **Supabase model**: When admin hits 10+ pages, convert to icon sidebar. Currently okay but plan for growth. |
| **Scorekeeper is isolated** | `/court/[slug]/[court]` has no way back | Add a minimal "Exit scoring" link. Full-screen is correct but trap doors frustrate users. |

---

## 3. Component Patterns

### What's Working (Strong)

| Component | Quality | Notes |
|-----------|---------|-------|
| `ScoringModal.svelte` | Excellent | 44KB — complex score validation with live feedback. This is the product's crown jewel. |
| `Badge.svelte` | Good | Status variants (brand, victory, warning, error) map to domain states |
| `LiveScoreIndicator.svelte` | Good | Real-time visual feedback |
| `SwissStandings.svelte` | Good | Complex tournament format handled well |
| `QRCode.svelte` | Good | Magic token access for teams — clever |
| Design token system | Excellent | `DESIGN_TOKENS.md` is comprehensive |
| `TutorialLauncher.svelte` | Good | Onboarding exists |

### Missing Patterns (from references)

| Missing Pattern | Reference Source | Why It Matters for Rally HQ |
|----------------|-----------------|---------------------------|
| **Empty state design** | ChatPRD (icon + heading + CTA), Linear (product icons + shortcut) | "No tournaments yet" needs an illustrated empty state with "Create your first tournament" CTA. Currently likely shows blank space. |
| **Tab bar for views** | Linear (All/Active/Backlog), Resend (Sending/Receiving) | Tournament list should have tabs: Upcoming / Live / Past / Draft. Organizer dashboard needs: Overview / Teams / Schedule / Scoring. |
| **Composable filter bar** | Resend (search + status + date + region dropdowns) | Tournament list should filter by: format (pools, Swiss, bracket), date range, status, location. Not just search. |
| **Data table with sort** | Resend (To, Status, Subject, Sent — all sortable) | Admin tables exist but team management, registration lists, and match schedules should use sortable data tables with pagination. |
| **Horizontal card carousel** | Supabase (metrics dashboard) | Tournament dashboard metrics (teams registered, matches completed, revenue collected) should carousel horizontally on mobile. |
| **Sparklines** | Vercel (project cards) | Tournament cards should show registration velocity — tiny chart showing signups over time. |
| **Notification badge** | Notion (Inbox with count) | Organizer header should show unread count: "3 pending registrations", "2 scoring disputes". |
| **What's New banner** | Linear (bottom-left), Figma (dismissible) | New features (Swiss format, league mode) go unnoticed. Add a What's New banner. |
| **Keyboard shortcuts** | Linear (in buttons) | Scoring modal should show shortcuts: "Enter to submit", "Tab to next set". Speeds up live scoring dramatically. |
| **Risk/threshold indicators** | Resend (RISK lines on charts) | Registration progress should show "capacity" threshold line. Revenue charts should show "break-even" threshold. |
| **Feed/activity view** | Notion (feed cards with author + timestamp) | Tournament activity feed: "Team Spike registered", "Match 3 scored by Court 2", "Payment received from Team Volley". Timeline of everything. |
| **Announcement banner** | ChatPRD (callout block), Notion (callout) | Tournament organizers need to post announcements: "Pool play starts at 9am", "Court 3 is delayed 15 min". Currently no mechanism. |
| **Grid/list toggle** | Figma (⊞/≡ toggle) | Tournament list should offer card grid (current) and dense list view for organizers managing many events. |

---

## 4. Brand & Visual Identity

### Current State

| Element | Status | Notes |
|---------|--------|-------|
| Logo | Strong | "R" monogram with volleyball arcs + indigo gradient. Professional. |
| Color system | Strong | Electric indigo (brand), gold (victory), coral (live) — domain-appropriate |
| Typography | Adequate | Sora is clean but doesn't communicate "sports" or "tournament" |
| Tagline | Good | "Tournament Mission Control for Recreational Sports" — clear positioning |
| Favicon | Good | Multiple sizes, consistent with brand |
| Dark mode | Good architecture | But no user toggle — should be user-controlled |
| Mascot/illustration | None | No illustrated characters, no sport imagery beyond AI-generated heroes |

### Assessment

| Dimension | Rating | Notes |
|-----------|--------|-------|
| **Consistency** | B+ | Tokens are well-defined but not all components use them consistently. Some raw Tailwind values likely mixed in. |
| **Differentiation** | B+ | Indigo + gold + coral is distinctive and domain-appropriate. Better than generic blue SaaS. |
| **Personality** | B- | Clean but could be warmer. The brand says "sports" but the UI says "SaaS." Need more energy. |
| **Status communication** | A- | Live/Victory/Pending states are well-designed with dedicated color scales and shadows. This is a genuine strength. |
| **Cross-platform** | B | Web is solid. No native app, but scorekeeper view is touch-optimized. |

### Recommendations

1. **Add energy to the live experience**: The `--color-live-*` coral scale exists but isn't used aggressively enough. During a live tournament, the entire UI should feel alive — subtle pulsing borders on live matches, a persistent "LIVE" indicator in the header, live match count badge.

2. **Tournament announcements**: Organizers need a way to broadcast messages to all participants. Pattern: Notion's callout block with a coral/live background for urgent announcements, indigo for informational.

3. **Registration progress visualization**: Borrow Resend's risk threshold pattern — show a horizontal bar with "12/16 teams registered" and a dashed line at capacity. When capacity is near, the bar turns coral.

4. **Victory moments**: The gold `--color-victory-*` scale is defined but underutilized. When a tournament completes, the champion should get a moment — gold gradient banner, confetti animation, or at minimum a gold-bordered card. Compare to how ChatPRD uses gradient text for personality.

---

## 5. Specific Fixes — Prioritized

### P0 (Do Now)

| Fix | Effort | Impact | Reference |
|-----|--------|--------|-----------|
| Add tab bar to tournament list: Upcoming / Live / Past / Draft | Low | High | Linear |
| Add tab bar to organizer dashboard: Overview / Teams / Schedule / Scoring / Settings | Medium | High | Linear |
| Add breadcrumb to organizer context: My Tournaments > [Name] > [Section] | Low | High | Supabase |
| Design empty states for all empty views | Low | Medium | ChatPRD, Linear |
| Add theme toggle (light/dark, not just prefers-color-scheme) | Low | Medium | Supabase |

### P1 (Do Next)

| Fix | Effort | Impact | Reference |
|-----|--------|--------|-----------|
| Add composable filter bar to tournament list (format, status, date) | Medium | High | Resend |
| Add notification badge to organizer header (pending registrations, disputes) | Medium | High | Notion |
| Add keyboard shortcuts to scoring modal (Enter, Tab, Esc) and show them | Low | High | Linear |
| Add tournament activity feed (registration, scoring, payment events) | Medium | High | Notion feed cards |
| Add registration progress bar with capacity threshold | Low | Medium | Resend risk threshold |

### P2 (Do Later)

| Fix | Effort | Impact | Reference |
|-----|--------|--------|-----------|
| Add ⌘K command palette (search tournaments, teams, matches) | Medium | Medium | Vercel/Linear |
| Add sparklines to tournament cards (registration velocity) | Medium | Medium | Vercel |
| Add grid/list toggle for tournament list | Low | Low | Figma |
| Add What's New banner for feature announcements | Low | Medium | Linear |
| Add tournament announcements system (organizer → participants) | High | High | Notion callout |
| Add victory celebration moment (gold gradient, animation) | Medium | Low | ChatPRD gradient + custom |
| Add horizontal metric carousel for mobile dashboard | Medium | Medium | Supabase |

---

## 6. Gap Summary by Reference

| Reference | What Rally HQ Already Has | What's Missing |
|-----------|---------------------------|----------------|
| **ChatPRD** | Landing page CTAs, guided flows | Empty state design, gradient personality moment, action card onboarding |
| **Vercel** | Project-level views (tournaments) | Sparklines on cards, hairline separators, split buttons |
| **Resend** | Status badges, data tables | Composable filter bar, risk threshold lines, relative timestamps |
| **Supabase** | Dark mode tokens, status cards | Breadcrumb, icon sidebar (for admin), advisor-style warnings |
| **Stitch** | N/A (different domain) | Suggestion chips for tournament setup (format recommendations) |
| **Notion** | Collapsible sections, help drawer | Activity feed, inline comments/annotations, warm palette refinement |
| **Figma** | Card grid layout | Grid/list toggle, thumbnail previews, dismissible recommendations |
| **Linear** | Issue/task tracking concepts | Tab bar for views, keyboard shortcuts in UI, saved custom views, What's New banner |

---

## 7. Competitive Position

Rally HQ's design system is **architecturally superior** to most of the references:
- Two-tier semantic tokens (none of the 8 references have this)
- Status-specific color scales with matching shadows (unique)
- Fluid typography with `clamp()` (unique)
- Domain-appropriate color vocabulary (live, victory, brand)

But the **execution** lags behind:
- No tab bars for view switching (Linear has this, it's critical for tournaments)
- No composable filters (Resend's pattern is directly needed)
- No activity feed (Notion's feed view maps perfectly to tournament events)
- No keyboard shortcuts for power users (scoring directors need speed)
- No breadcrumbs in deep navigation (Supabase solves this elegantly)

**The foundation is excellent. The surface needs polish and the patterns need updating to match 2026 SaaS standards.**

---

## 8. IA Restructure Proposal

### Current → Proposed (Organizer Dashboard)

```
CURRENT                              PROPOSED (Linear + Supabase hybrid)
─────────────                        ─────────────────────────────────────

/manage/[slug]  (monolithic)         Top Bar:
                                     ├── ← Back to My Tournaments
                                     ├── Breadcrumb: My Tournaments > Summer Slam 2026
                                     ├── [LIVE badge] or [DRAFT badge]
                                     ├── [Notification 🔔 3]
                                     └── [Settings ⚙]

                                     Tab Bar:
                                     [Overview] [Teams] [Schedule] [Scoring] [Standings]

                                     Overview tab:
                                     ├── 4-metric cards: Teams / Matches / Revenue / Check-ins
                                     ├── Registration progress bar (with capacity threshold)
                                     ├── Activity feed (last 10 events)
                                     └── Quick actions: "Start Pool Play", "Generate Bracket"

                                     Teams tab:
                                     ├── Filter bar: [Search] [Status ▾] [Pool ▾] [Sort ▾]
                                     ├── Data table: Name, Captain, Status, Pool, Seed, Payment
                                     └── [+ Register Team] button

                                     Schedule tab:
                                     ├── Filter bar: [Round ▾] [Court ▾] [Status ▾]
                                     ├── Match list (grouped by round)
                                     └── Court assignment view (grid)

                                     Scoring tab:
                                     ├── Live matches (coral border, pulsing)
                                     ├── Upcoming matches (queued)
                                     └── Completed matches (with scores)

                                     Standings tab:
                                     ├── Pool standings (if pool play)
                                     ├── Bracket view (if elimination)
                                     └── Swiss standings (if Swiss format)
```

### Public Tournament View

```
CURRENT                              PROPOSED
─────────────                        ─────────────────────────────────────

/t/[slug]                            Header:
/t/[slug]/[view]                     ├── Tournament Name + Status Badge
                                     ├── Date, Location, Format
                                     └── [Register] CTA (if open)

                                     Tab Bar:
                                     [Schedule] [Pools] [Bracket] [Standings] [Teams]

                                     (Same structure, public read-only)
```
