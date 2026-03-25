# Vercel Dashboard — Design Reference Audit

> **Source**: https://vercel.com/nino-chavez
> **Audited**: 2026-03-23
> **Category**: Developer platform / infrastructure dashboard
> **Stack**: Next.js (App Router), Geist font, dark mode support
> **Screenshots**: `vercel-dashboard-*.png` in project root

---

## 0. Nino's Vercel Project Inventory

Captured from https://vercel.com/nino-chavez on 2026-03-23.

| Project | Domain | Repo | Last Deploy | Speed |
|---------|--------|------|-------------|-------|
| six | labs.signalx.studio | signal-x-studio/six | 12/24/25 | 0 |
| ninochavez.co | ninochavez.co | nino-chavez/website | Mar 17 | 100 |
| llm-visibility | llm-visibility-alpha.vercel.app | signal-x-studio/commerce-prompt-analyzer | 12/13/25 | 0 |
| blog | blog.ninochavez.co | nino-chavez/signal-dispatch-blog | Mar 19 | 0 |
| photography | photography.ninochavez.co | nino-chavez/gallery | Mar 9 | 0 |
| ai-analyst-academy | academy.ninochavez.co | nino-chavez/ai-analyst-academy | Mar 7 | 0 |
| simple-aes | simple-aes.vercel.app | nino-chavez/volleyball-tournament | Feb 1 | 0 |

**Plan**: Pro ($20 included credit, $1.57 used this cycle, 18 days remaining)

---

## 1. Visual Identity

### Color System
| Token | Value | Usage |
|-------|-------|-------|
| Background | `#FAFAFA` (light) / `#000` (dark) | Page background |
| Surface | `#FFFFFF` (light) / `#111` (dark) | Cards, sidebar |
| Border | `#EAEAEA` (light) / `#333` (dark) | Card borders, dividers, 1px |
| Text primary | `#000` (light) / `#FFF` (dark) | Headings, project names |
| Text secondary | `#666` (light) / `#888` (dark) | Descriptions, metadata, dates |
| Text tertiary | `#999` | Timestamps, subtle labels |
| Accent blue | `#0070F3` | Links, active states, progress bars |
| Success green | `#50E3C2` / `#0070F3` | Speed Insights score (100), deploy status |
| Warning/badge | `#F5A623` | Pro badge (amber) |
| Monospace text | Geist Mono | Deploy IDs, branch names, commit hashes |

### Typography
| Role | Font | Size | Notes |
|------|------|------|-------|
| Nav items | Geist Sans, medium | ~14px | Icon + label, consistent weight |
| Project name | Geist Sans, semibold | ~16px | Card title |
| Domain | Geist Sans, regular | ~14px | Subdued below project name |
| Repo link | Geist Sans, regular | ~13px | GitHub icon + org/repo, pill-shaped bg |
| Commit message | Geist Sans, regular | ~14px | Truncated with ellipsis |
| Metadata | Geist Sans, regular | ~13px | Date + branch, monospace for branch name |
| Deploy ID | Geist Mono | ~12px | Monospace, truncated |
| Section headers | Geist Sans, semibold | ~14px | "Usage", "Projects", "Recent Previews", "Alerts" |

### Spacing
- Sidebar width: ~220px (collapsible)
- Content padding: ~24px
- Project card height: ~140px
- Card gap: ~1px (hairline separator, not gap)
- Section gap: ~24px

---

## 2. Information Architecture

### Navigation Model (Left Sidebar)
```
Sidebar (persistent, collapsible)
├── Team/Org Switcher (top, with Pro badge)
├── Search ("Find..." with keyboard shortcut "F")
├── Primary Section
│   ├── Projects         (active = filled bg)
│   ├── Deployments
│   ├── Logs
│   ├── Analytics
│   ├── Speed Insights
│   ├── Observability    (expandable →)
│   ├── Firewall
│   └── CDN
├── Separator (thin line)
├── Resources Section
│   ├── Domains
│   ├── Integrations
│   ├── Storage
│   ├── Flags
│   ├── Agent            (expandable →)
│   ├── AI Gateway       (expandable →)
│   └── Sandboxes
├── Separator
├── Admin Section
│   ├── Usage
│   ├── Support
│   └── Settings         (expandable →)
└── User Profile (pinned bottom, avatar + name + notification badge)
```

### Dashboard Layout (3-Column Feel)
```
┌─────────┬──────────────────┬──────────────────────────────┐
│ Sidebar │  Left Column     │  Right Column                │
│         │  (Usage + Alerts │  (Project List)              │
│ (nav)   │   + Previews)    │                              │
│         │  ~380px          │  ~flex                       │
└─────────┴──────────────────┴──────────────────────────────┘
```
- Left column: Usage summary card, Alerts card, Recent Previews list
- Right column: Project list (filterable, searchable)
- Both columns scroll independently

---

## 3. Component Library

### Project Card (List Item)
```
┌────────────────────────────────────────────────────────────┐
│  [favicon]  project-name                    [sparkline] ⋯ │
│             domain.vercel.app                             │
│             [GH icon] org/repo                            │
│  commit message text truncated...                         │
│  Mar 17 on ⑂ main                                        │
└────────────────────────────────────────────────────────────┘
```
- Favicon/logo (circular, ~40px)
- Project name (semibold) + domain (subdued) on right
- GitHub repo as pill/badge with icon
- Latest commit message (full width, truncated)
- Date + branch as metadata row (branch in monospace with git icon)
- Sparkline chart (tiny, ~60x20px) for speed insights
- Three-dot menu for actions
- **No shadows, no colored borders** — hairline separators between cards
- **Adopt for**: Any list of deployable projects, sites, or environments

### Usage Summary Card
```
┌────────────────────────────────────────────────────┐
│  18 days remaining in cycle          [Billing]     │
│                                                    │
│  Included Credit      On-Demand Charges            │
│  $1.57 / $20          $0                           │
│  [████░░░░░░░░░░]                                  │
│                                                    │
│  Speed Insights Data Points        $0.65           │
│  Function Invocations              $0.60           │
│  Fluid Provisioned Memory          $0.08           │
│  ...                                               │
│  [Show More Usage]                                 │
└────────────────────────────────────────────────────┘
```
- Progress bar for credit usage
- Line items with label + cost right-aligned
- Expandable "Show More" for long lists
- **Adopt for**: Budget/usage dashboards, quota displays

### Alerts/Upsell Card
```
┌────────────────────────────────────────────────────┐
│  Get alerted for anomalies                         │
│  Automatically monitor your projects for           │
│  anomalies and get notified.                       │
│                                                    │
│  [Upgrade to Observability Plus]                   │
└────────────────────────────────────────────────────┘
```
- Simple text + single CTA button
- Dark button style (filled, not outline)
- **Adopt for**: Feature upsells, empty state + upgrade prompts

### Preview Deployment Row
```
┌────────────────────────────────────────────────────┐
│  [avatar][avatar]  claude/branch-name-...    ⋯     │
│  👁 Preview   🔗 Source   ● BRvFLgRFW              │
└────────────────────────────────────────────────────┘
```
- Stacked avatars (author + bot)
- Branch name truncated
- Action links: Preview, Source, Deploy ID (monospace)
- Compact — two rows per item
- **Adopt for**: Activity feeds, recent action logs

### Search Bar (Top of Content)
```
┌────────────────────────────────────────────────────┐
│  🔍 Search Projects...                [⊞] [Add New... ▾] │
└────────────────────────────────────────────────────┘
```
- Full-width search with icon
- Filter button (icon only)
- "Add New..." dropdown (split button with chevron)
- **Adopt for**: Any filterable list page header

### Sidebar Navigation Item
```
  [icon]  Label                    → (if expandable)
  ─── active state: subtle bg fill, no bold change
```
- Icon (16px, monoline) + label
- Active: background fill (very subtle, ~#F0F0F0 light / ~#1A1A1A dark)
- No color change on active — just background
- Expandable items show right arrow
- Separators between logical groups (not every item)
- **Adopt for**: All sidebar navs across projects

### Team/Org Switcher
```
  [avatar] Nino Chavez  Pro  [↕]
```
- Small avatar + name + plan badge (amber "Pro")
- Dropdown chevron for switching
- **Adopt for**: Multi-workspace or multi-org contexts

---

## 4. Design Principles Extracted

1. **Information density done right** — Many items on screen, but spacing and typography hierarchy prevent overwhelm. No wasted vertical space.
2. **Monospace for machine values** — Branch names, deploy IDs, commit hashes all use Geist Mono. Human-readable text uses Geist Sans. Clear visual distinction.
3. **Hairline separators, not card gaps** — Project list items separated by 1px lines, not gaps or shadows. Denser layout without visual clutter.
4. **Metadata as quiet bottom row** — Dates, branches, and status sit below the main content in smaller, subdued text. Never competes with the title.
5. **Sparklines as ambient data** — Tiny charts next to project names give performance signal without taking space. Data without demand.
6. **Pill badges for context** — Repo links, plan tiers, and deploy statuses use small pill-shaped badges. Consistent shape language.
7. **Split buttons for primary + options** — "Add New..." has a primary action + dropdown. Reduces UI elements while expanding options.
8. **Dark mode as first-class** — Not an afterthought. Color tokens work in both modes. Borders, not shadows, enable this.
9. **Command palette culture** — "Find... F" in sidebar. Keyboard-first, search-first navigation for power users.
10. **No color coding for nav** — Active nav items use subtle background fill only. No accent color splash in sidebar.

---

## 5. Applicability Matrix

| Pattern | Rally HQ | QuantifAI | 630 Apps | brand-forge |
|---------|----------|-----------|----------|-------------|
| Project card (list item) | Yes (tournaments) | Yes (tracked sites) | Maybe (app list) | N/A |
| Usage summary card | No | Yes (API costs) | No | N/A |
| Hairline separators (not card gaps) | Yes | Yes | Consider | N/A |
| Monospace for machine values | Yes (IDs, scores) | Yes (metrics, IDs) | Yes (codes) | N/A |
| Sparkline ambient data | Maybe | Yes (trends) | Yes (rankings) | N/A |
| Pill badges for context | Yes | Yes | Yes | N/A |
| Split button (Add New...) | Yes | Yes | Maybe | N/A |
| Command palette / search-first | Consider | Yes | No | N/A |
| Metadata quiet bottom row | Yes | Yes | Yes | N/A |
| 3-column dashboard layout | Consider | Yes | No | N/A |

### Rally HQ priorities
1. Project card pattern for tournament/team list views
2. Hairline separators instead of card gaps for dense lists
3. Pill badges for tournament status, division, season
4. Metadata row pattern (date + branch → date + venue + status)

### QuantifAI priorities
1. Usage summary card for API cost tracking
2. 3-column dashboard layout (summary left, data right)
3. Sparklines for trend visualization
4. Command palette for power-user navigation
5. Monospace for metric values and IDs

### 630 Apps priorities
1. Pill badges for status indicators across E-Sign, CCI, VB Ranking
2. Metadata quiet row for timestamps and contextual info
3. Sparklines in VB Ranking for team performance trends

---

## 6. Contrast with ChatPRD

| Dimension | ChatPRD | Vercel Dashboard |
|-----------|---------|-----------------|
| Density | Low (generous spacing) | High (information-dense) |
| Typography | Serif display + sans body | Sans only (Geist Sans + Mono) |
| Accent usage | Violet everywhere | Almost none — monochrome + blue links |
| Card style | Bordered cards with gaps | Hairline-separated list items |
| Empty states | Designed illustrations | Minimal text + CTA |
| Target user | Product managers | Developers |
| Nav active state | Accent color highlight | Subtle background fill |
| Data viz | None | Sparklines, progress bars |

**Key insight**: ChatPRD optimizes for approachability and guidance. Vercel optimizes for density and speed. Your projects need both — approachability for first-time users (ChatPRD patterns), density for power users (Vercel patterns). Consider progressive disclosure: start with ChatPRD's empty states and guided flows, then transition to Vercel's density as users accumulate data.
