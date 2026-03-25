# Resend — Design Reference Audit

> **Source**: https://resend.com
> **Audited**: 2026-03-23
> **Category**: Developer-focused email API SaaS
> **Stack**: Next.js, monochrome design system, dark mode capable
> **Screenshots**: `resend-*.png` in project root
> **Account**: abelino.chavez — domains: rallyhq.app, mail.quantifai.app

---

## 0. Nino's Resend Inventory

| Domain | Status | Region | Created |
|--------|--------|--------|---------|
| mail.quantifai.app | Verified | us-east-1 | 12 days ago |
| rallyhq.app | Verified | us-east-1 | 3 months ago |

**Email templates**: 15+ Rally HQ beta lifecycle templates (Day 0 → Day 90), payment templates, verification codes — all Draft status.

**Recent activity**: 27 emails in last 15 days, 96.3% deliverability. Mostly "Sign in to Rally HQ" magic links across rallyhq.app and mail.quantifai.app domains.

---

## 1. Visual Identity

### Color System
| Token | Value | Usage |
|-------|-------|-------|
| Background | `#FFFFFF` | Pure white, no warm tint |
| Surface/cards | `#FFFFFF` with `1px #E5E7EB` border | Cards, chart containers |
| Sidebar bg | `#FAFAFA` | Very subtle off-white |
| Sidebar active | `#F3F4F6` with left accent | Active nav item bg |
| Text primary | `#111827` | Headings, table content |
| Text secondary | `#6B7280` | Descriptions, metadata |
| Text tertiary | `#9CA3AF` | Timestamps, slugs |
| Success green | `#10B981` | "Delivered" status, "Verified" badge, deliverability % |
| Error red | `#EF4444` | Bounce rate bar, "RISK" threshold line |
| Warning amber | `#F59E0B` | Complaint indicators |
| Chart green | `#10B981` | Delivery line |
| Chart red | `#EF4444` | Bounce line |
| Chart gray | `#9CA3AF` | Undelivered/pending line |
| Accent black | `#000000` | Primary buttons ("+ Create template", "+ Add domain") |
| Code text | monospace, `#6B7280` | Template slugs (e.g., `beta-welcome-day-0`) |

### Typography
| Role | Font | Size | Notes |
|------|------|------|-------|
| Page heading | Sans-serif, bold | ~28px | "Emails", "Metrics", "Domains" — large, black |
| Section label | Uppercase sans, semibold | ~12px | "EMAILS", "BOUNCE RATE", "COMPLAIN RATE" |
| Table header | Sans-serif, medium | ~13px | Gray text, no bg fill |
| Table body | Sans-serif, regular | ~14px | Standard row content |
| Template name | Sans-serif, medium | ~14px | Below preview thumbnail |
| Template slug | Monospace, regular | ~12px | Gray, below template name |
| Status badge | Sans-serif, medium | ~12px | Pill-shaped ("Delivered", "Verified", "Draft") |
| Metric value | Sans-serif, bold | ~32-40px | "27", "96.3%", "3.7%" — hero numbers |
| Chart axis | Sans-serif, regular | ~11px | Date labels, percentage scales |
| Feedback shortcut | Monospace | ~12px | Keyboard shortcut badge ("F") |

### Spacing
- Sidebar width: ~200px
- Content padding: ~32px
- Table row height: ~52px
- Card padding: ~24px
- Chart height: ~200px (main), ~160px (secondary)
- Template card: ~200px thumbnail + ~60px info area
- Template grid gap: ~16px

---

## 2. Information Architecture

### Navigation Model (Left Sidebar)
```
Sidebar (persistent, minimal)
├── Org Switcher (top — avatar initial + org name + chevron)
├── Primary Nav (10 items, flat list, icon + label)
│   ├── Emails        (envelope icon)
│   ├── Broadcasts    (megaphone icon)
│   ├── Templates     (layout icon)
│   ├── Audience      (people icon)
│   ├── Metrics       (chart icon)
│   ├── Domains       (globe icon)
│   ├── Logs          (terminal icon)
│   ├── API Keys      (lock icon)
│   ├── Webhooks      (link icon)
│   └── Settings      (gear icon)
└── User Account (pinned bottom — avatar initial + email, truncated)
```

**Key difference from Vercel/ChatPRD**: No section groups, no separators, no collapsible sections. Flat list of 10 items — the entire product surface is visible at once. Extremely simple.

### Top Bar (Per Page)
```
┌─────────────────────────────────────────────────────────────┐
│                            [Feedback F]  [Help]  [Docs]     │
├─────────────────────────────────────────────────────────────┤
│  Page Title                              [+ Action] [</>]   │
└─────────────────────────────────────────────────────────────┘
```
- Global: Feedback (with keyboard shortcut "F"), Help, Docs links
- Per-page: Title + primary action button + API drawer toggle (`</>`)
- API drawer toggle is unique to Resend — shows API code for current context

---

## 3. Component Library

### Data Table (Emails, Domains)
```
┌──────────────────────────────────────────────────────────────┐
│ 🔍 Search...          [Last 15 days ▾] [All Statuses ▾] [⬇]│
├──────────────────────────────────────────────────────────────┤
│ To            Status       Subject              Sent        │
├──────────────────────────────────────────────────────────────┤
│ [✉] email@    Delivered    Sign in to Rally HQ   41 min ago │
│ [✉] email@    Delivered    Sign in to Rally HQ   7 hrs ago  │
│ ...                                                          │
├──────────────────────────────────────────────────────────────┤
│                              Page 1 – 40 items ▾   [< >]   │
└──────────────────────────────────────────────────────────────┘
```
- Search + filter dropdowns above table
- Download/export button (right of filters)
- Row icon (envelope for emails, globe for domains)
- Status as colored pill badge ("Delivered" = green, "Verified" = green)
- Relative timestamps ("41 minutes ago", "1 day ago")
- Three-dot overflow menu per row
- Pagination footer with items-per-page dropdown
- Checkbox column for bulk actions (domains table)
- **Key pattern**: Filters are dropdowns, not tabs. Composable filtering.
- **Adopt for**: Any transactional log, email history, event feed

### Metrics Dashboard
```
┌────────────────────────────────────────────────────────────┐
│  EMAILS         DELIVERABILITY RATE        [All Events ▾]  │
│  27             96.3%                                      │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  [area chart with multiple series]                   │  │
│  │  green = delivered, gray = total, red = bounced      │  │
│  └──────────────────────────────────────────────────────┘  │
│  rallyhq.app (18)         ● 94%  ● 6%  ● 61%             │
│  mail.quantifai.app (9)   ● 100%                          │
└────────────────────────────────────────────────────────────┘

┌──────────────────────────┐  ┌──────────────────────────┐
│  BOUNCE RATE        (?)  │  │  COMPLAIN RATE      (?)  │
│  3.7%                    │  │  0%                      │
│  [bar chart]             │  │  [bar chart]             │
│  --- RISK threshold ---  │  │  --- RISK threshold ---  │
│  Transient    1   100%   │  │  Complained   0    0%    │
│  Permanent    0     0%   │  │                          │
│  Undetermined 0     0%   │  │                          │
└──────────────────────────┘  └──────────────────────────┘
```
- Hero numbers: large bold count + large bold percentage
- Uppercase section labels ("EMAILS", "BOUNCE RATE")
- Area chart for primary metric (multi-series, stacked)
- Per-domain breakdown as legend below chart (dot color + percentage)
- Secondary metrics in 2-column card grid
- "RISK" threshold line (dashed, red label) on bar charts — excellent pattern
- Help icon (?) on secondary cards
- Breakdown table below each chart (category + count + percentage)
- "Data is updated every 15 minutes" footer
- **Adopt for**: Any analytics/metrics page — QuantifAI especially

### Template Gallery (Card Grid)
```
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│                  │  │                  │  │                  │
│  [preview img]   │  │  [preview img]   │  │  [preview img]   │
│                  │  │                  │  │                  │
│                  │  │                  │  │                  │
├─────────────────┤  ├─────────────────┤  ├─────────────────┤
│ Template Name    │  │ Template Name    │  │ Template Name    │
│ slug-name   Draft│  │ slug-name   Draft│  │ slug-name   Draft│
└─────────────────┘  └─────────────────┘  └─────────────────┘
```
- 3-column responsive grid
- Large preview thumbnail (~200px tall, light gray bg)
- Three-dot menu overlaid on thumbnail (top-right)
- Name (medium weight) + slug (monospace, gray) + status badge ("Draft")
- Clean separation: visual preview above, metadata below
- **Adopt for**: Email templates, design previews, brand kit galleries

### Status Badge
```
  Delivered   →  green bg (#D1FAE5), green text (#065F46)
  Verified    →  green bg, green text
  Draft       →  gray bg (#F3F4F6), gray text (#6B7280)
```
- Pill-shaped, small, no border
- Color communicates meaning without labels
- Consistent across all contexts (tables, cards, lists)
- **Adopt for**: Any status indicator

### API Drawer Toggle
```
  [</>]  ← icon button, opens side drawer showing API code for current view
```
- Unique to Resend — every page has a corresponding API code drawer
- Context-aware: shows the right API call for what you're looking at
- **Adopt for**: Developer-facing tools where API access is relevant

### Filter Bar
```
  🔍 Search...   [Last 15 days ▾]  [All Statuses ▾]  [All Regions ▾]  [⬇]
```
- Search input (full-width, left) + filter dropdowns (right)
- Dropdowns are comboboxes with default "All X" labels
- Download/export icon button at far right
- Composable: each filter is independent
- **Adopt for**: Any list/table page header

---

## 4. Design Principles Extracted

1. **Monochrome with semantic color** — No accent color at all. Black buttons, gray UI, green/red only for status and data. Color is reserved for meaning.
2. **Flat nav, no grouping** — 10 sidebar items, no sections, no separators. The product is simple enough that everything fits in one list. Resist adding hierarchy until absolutely necessary.
3. **API as first-class citizen** — Every page has an API drawer toggle (`</>`). The dashboard is a GUI over the API, not the other way around.
4. **Hero numbers** — Metrics pages lead with massive bold numbers (27 emails, 96.3% delivery). The most important data point is the biggest thing on screen.
5. **Risk thresholds on charts** — Dashed horizontal lines with "RISK" labels on bounce/complaint charts. Turns data into actionable awareness.
6. **Preview thumbnails for content** — Email templates show rendered previews, not just names. Visual recognition is faster than reading.
7. **Slug as secondary identifier** — Template names have human labels + machine slugs in monospace. Both identifiers visible, clear hierarchy.
8. **Relative timestamps everywhere** — "41 minutes ago", "1 day ago", "3 months ago". Never raw dates in activity views.
9. **Composable filters, not tabs** — Dropdowns that combine independently (time range + status + region) instead of pre-defined tab views.
10. **Keyboard shortcuts surfaced** — "Feedback F" and notification "alt+T" — shortcuts shown inline, not hidden in help docs.

---

## 5. Applicability Matrix

| Pattern | Rally HQ | QuantifAI | 630 Apps | brand-forge |
|---------|----------|-----------|----------|-------------|
| Hero numbers (metrics page) | Yes (match stats) | Yes (cost/performance) | Yes (ranking scores) | N/A |
| Risk threshold lines on charts | No | Yes (budget alerts) | No | N/A |
| Data table with composable filters | Yes | Yes | Yes | N/A |
| Template gallery (preview grid) | Maybe (email templates) | No | No | Yes (preset gallery) |
| Status badge system | Yes | Yes | Yes | N/A |
| Monospace slugs as secondary ID | Maybe | Yes (API-facing) | No | Yes (preset IDs) |
| Relative timestamps | Yes | Yes | Yes | N/A |
| API drawer toggle | No | Consider | No | N/A |
| Flat nav (no grouping) | No (too complex) | Maybe | Yes (3 apps) | N/A |
| Keyboard shortcut surfacing | Consider | Yes | No | N/A |

### Rally HQ priorities
1. Status badge system for tournament/team/match states
2. Data table with composable filters for match history, player lists
3. Hero numbers for dashboard (active tournaments, registered teams, matches played)
4. Relative timestamps for activity feeds
5. Template gallery pattern for email template management (already has 15+ Resend templates)

### QuantifAI priorities
1. Hero numbers as primary metrics display
2. Risk threshold lines on cost/performance charts
3. Composable filter bar for analytics views
4. Keyboard shortcut surfacing for power users
5. Monospace slugs for API-facing identifiers

### 630 Apps priorities
1. Status badges for contract status (E-Sign), assessment status (CCI), ranking status (VB Ranking)
2. Relative timestamps throughout
3. Data table pattern for any list views

---

## 6. Contrast with Previous References

| Dimension | ChatPRD | Vercel | Resend |
|-----------|---------|--------|--------|
| Color philosophy | One accent (violet) | Near-monochrome + blue links | Pure monochrome + semantic color |
| Nav complexity | 4 items + sections | 15+ items + 3 groups | 10 items, flat list |
| Card style | Bordered + gaps | Hairline separators | Bordered cards (metrics), hairline rows (tables) |
| Data visualization | None | Sparklines | Area charts, bar charts, thresholds |
| Typography personality | Serif display | Geist Sans/Mono | Plain sans + monospace slugs |
| Primary button style | Violet filled | Dark filled | Black filled |
| Empty states | Illustrated + CTA | Minimal text + CTA | Not observed (account has data) |
| Target user | Product managers | Developers | Developers (API-first) |

**Key insight**: Resend proves that a product can feel premium with zero accent color. Semantic color (green = good, red = bad) plus strong typography hierarchy does the work. This is the most restrained of the three references — and it works because the data tells the story, not the chrome.

**Progressive complexity model across all three**:
- **ChatPRD** = onboarding-first (guide the user to their first action)
- **Resend** = data-first (show what happened, let the user filter)
- **Vercel** = density-first (show everything, let the user navigate)

Choose the model that matches your users' maturity with the product.
