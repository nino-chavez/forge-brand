# Supabase Dashboard — Design Reference Audit

> **Source**: https://supabase.com/dashboard
> **Audited**: 2026-03-23
> **Category**: Developer platform / BaaS (Backend as a Service)
> **Stack**: Next.js, dark mode default, icon-only collapsed sidebar
> **Screenshots**: `supabase-*.png` in project root

---

## 0. Nino's Supabase Inventory

### Organizations
| Org | Plan | Projects |
|-----|------|----------|
| Nino Chavez | Free | 3 |
| Nino Chavez Dev | Free | 0 |
| Signal x Studio LLC | Pro | 4 |

### Signal x Studio LLC Projects
| Project | Region | Status | Tier |
|---------|--------|--------|------|
| quantifai | us-west-2 | Active | Micro |
| quantifai-lite | us-east-2 | Active | Nano |
| rally-hq | us-west-1 | Active | Micro |
| Zero Specs | us-east-1 | Pausing | Nano |

### Rally HQ Database Tables (public schema)
admin_audit_log, admin_roles, analytics_events, api_keys, api_usage_logs, audit_log, divisions, event_teams, events, feature_flags, league_digest_log, league_matches, league_standings, matches, moderation_actions, notification_log, notification_preferences, notifications, oauth_apps, oauth_authorization_codes, oauth_tokens, partner_applications, partner_followed_tournaments, payment_history, pending_registrations, platform_profiles, push_subscriptions, rate_limits, scoring_attempts, seasons, sms_log, sse_events, subscriptions, teams, teams_public, tournament_purchases, tournament_roles, tournaments, webhook_deliveries, webhooks

**Security alerts**: RLS disabled on `moderation_actions`, `admin_audit_log`, `feature_flags` (flagged by Advisor)

---

## 1. Visual Identity

### Color System
| Token | Value | Usage |
|-------|-------|-------|
| Background | `#1C1C1C` (dark) / `#FAFAFA` (light) | Page background |
| Surface | `#232323` (dark) / `#FFFFFF` (light) | Cards, sidebar, panels |
| Surface elevated | `#2A2A2A` (dark) | Hover states, active items |
| Border | `#333333` (dark) / `#E5E7EB` (light) | Card borders, dividers |
| Brand green | `#3ECF8E` | Logo, primary CTA buttons, "Active" badges, chart bars, "Run" button |
| Text primary | `#EDEDED` (dark) / `#111827` (light) | Headings, content |
| Text secondary | `#A0A0A0` (dark) / `#6B7280` (light) | Metadata, descriptions |
| Text muted | `#666666` (dark) | Placeholder text, disabled items |
| Error red | `#EF4444` | "UNRESTRICTED" RLS warning badges |
| Warning amber | `#F59E0B` | "PAUSING" status, advisor warnings |
| Badge outline | `#444444` (dark) | "MICRO", "NANO" tier badges |
| Code bg | `#1A1A1A` (dark) | SQL editor, code blocks |

### Typography
| Role | Font | Size | Notes |
|------|------|------|-------|
| Project name | Sans-serif, bold | ~28px | "rally-hq" on dashboard |
| Page heading | Sans-serif, semibold | ~20px | "Table Editor", "SQL Editor", "Projects" |
| Section label | Uppercase sans, semibold | ~11px | "STATUS", "LAST MIGRATION", "DATABASE REQUESTS" |
| Stat number | Sans-serif, bold | ~28px | "1,771", "1,766", "5" — hero numbers |
| Table name | Monospace, regular | ~13px | Table list in editor sidebar |
| Code editor | Monospace | ~14px | SQL editor, line numbers |
| Breadcrumb | Sans-serif, medium | ~13px | "Signal x Studio LLC / rally-hq / main PRODUCTION" |
| Nav tooltip | Sans-serif, regular | ~12px | Appears on hover over icon-only nav |

### Spacing
- Icon sidebar width: ~48px (collapsed) / ~220px (expanded)
- Inner sidebar (table list): ~220px
- Content padding: ~24-32px
- Project card: ~120px height in grid, ~60px in list
- Chart card height: ~180px
- Stat card: ~80px height
- Top bar height: ~48px

---

## 2. Information Architecture

### Navigation Model (Triple-Layer)
```
Layer 1: Top Bar (persistent, horizontal)
├── Logo (Supabase bolt)
├── Breadcrumb: Org > Project > Branch (PRODUCTION badge)
├── Connect button
├── Feedback, Search (⌘K), Help, Notifications, Settings, Avatar

Layer 2: Icon Sidebar (persistent, left, collapsible)
├── Home (dashboard)
├── Table Editor
├── SQL Editor
├── Database
├── Auth
├── Storage
├── Edge Functions
├── Realtime
├── Advisors (with red notification dot)
├── Reports/Analytics
├── Logs
├── API Docs
├── Settings

Layer 3: Inner Sidebar (contextual, per-feature)
├── Table Editor: schema selector + table list + search
├── SQL Editor: query categories (Shared, Favorites, Private, Community)
├── Auth: Users/Policies/Providers tabs
└── etc.
```

**Key insight**: Three navigation layers, each with a different purpose. The top bar = global context (org/project/branch). The icon sidebar = feature selection. The inner sidebar = feature-specific navigation. This is the most sophisticated nav model of all four references.

### Project Dashboard Layout
```
┌──────────────────────────────────────────────────────────┐
│  rally-hq  MICRO                                         │
│  https://htjesijxatzhbkjcezan.supabase.co                │
│                                                          │
│  ┌──────────┐ ┌──────────────┐   ┌─────────────────────┐│
│  │ STATUS   │ │LAST MIGRATION│   │ Primary Database    ││
│  │ Healthy  │ │sse_events_tbl│   │ West US (N. Calif) ││
│  ├──────────┤ ├──────────────┤   │ us-west-1 · t4g.mi ││
│  │LAST BCKUP│ │RECENT BRANCH │   └─────────────────────┘│
│  │ 7hrs ago │ │ No branches  │                          │
│  └──────────┘ └──────────────┘                          │
├──────────────────────────────────────────────────────────┤
│  1,771 Total Requests                    [Last 24h ▾]   │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ [>]   │
│  │ DB REQUESTS │ │AUTH REQUESTS │ │STORAGE REQ  │       │
│  │ 1,766       │ │ 5           │ │ 0           │       │
│  │ [bar chart] │ │ [bar chart] │ │ [bar chart] │       │
│  └─────────────┘ └─────────────┘ └─────────────┘       │
├──────────────────────────────────────────────────────────┤
│  Advisor found 4 issues              [Ask Assistant]    │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ [>]            │
│  │ SECURITY │ │ SECURITY │ │ SECURITY │                 │
│  │ RLS off  │ │ RLS off  │ │ RLS off  │                 │
│  │ table_nm │ │ table_nm │ │ table_nm │                 │
│  └──────────┘ └──────────┘ └──────────┘                 │
├──────────────────────────────────────────────────────────┤
│  Reports                              [+ Add block]     │
└──────────────────────────────────────────────────────────┘
```

---

## 3. Component Library

### Icon-Only Sidebar
```
  ┌────┐
  │ 🏠 │  ← Icon only (~20px), tooltip on hover
  │ 📋 │  ← Active: subtle left border accent + bg fill
  │ 📧 │
  │ 🗄 │
  │ 🔐 │
  │ 📦 │
  │ ⚡ │
  │ 📡 │
  │ 🔴 │  ← Red notification dot overlaid
  │ 📊 │
  │ 📝 │
  │ 🔌 │
  │ ⚙ │
  └────┘
```
- ~48px wide when collapsed — maximum content area
- Expands on hamburger click to show labels
- Active state: green left border accent + slightly lighter bg
- Notification dots (red) for items needing attention (Advisors)
- **Adopt for**: Complex tools where sidebar shouldn't steal content space

### Status Card Grid (Dashboard)
```
┌──────────┐ ┌──────────────┐
│ LABEL    │ │ LABEL        │
│ [icon]   │ │ [icon]       │
│ Value    │ │ Value        │
└──────────┘ └──────────────┘
```
- 2x2 grid of small cards
- Uppercase label (~11px), icon (left), value (bold)
- Examples: STATUS/Healthy, LAST MIGRATION/table_name, LAST BACKUP/7hrs ago, RECENT BRANCH/No branches
- **Adopt for**: Quick-glance project health panels

### Metric Bar Charts (Horizontally Scrollable)
```
┌──────────────┐ ┌──────────────┐ ┌──────────────┐ [>]
│ DB REQUESTS  │ │AUTH REQUESTS  │ │STORAGE REQ   │
│ 1,766        │ │ 5            │ │ 0            │
│ ▐▐▐▐▐▐▐▐▐▐▐ │ │  ▐ ▐ ▐▐ ▐▐  │ │              │
│ Mar 22  → 23 │ │ Mar 22  → 23 │ │ Mar 22  → 23 │
└──────────────┘ └──────────────┘ └──────────────┘
```
- Horizontally scrollable card carousel with arrow navigation
- Each card: uppercase label, hero number, bar chart (brand green), date range
- All charts share the same time range
- Carousel arrow (`>`) for overflow
- **Adopt for**: Multi-metric dashboards where you have 4+ metrics

### Advisor Issue Cards (Horizontally Scrollable)
```
┌──────────────┐ ┌──────────────┐ ┌──────────────┐ [>]
│ ○ SECURITY ⚙▾│ │ ○ SECURITY ⚙▾│ │ ○ SECURITY ⚙▾│
│              │ │              │ │              │
│ RLS Disabled │ │ RLS Disabled │ │ RLS Disabled │
│ in Public    │ │ in Public    │ │ in Public    │
│ Table: xyz   │ │ Table: abc   │ │ Table: def   │
└──────────────┘ └──────────────┘ └──────────────┘
```
- Same carousel pattern as metrics
- Category label ("SECURITY") with icon
- Settings/dismiss controls per card
- Issue title + affected resource in monospace
- "Ask Assistant" CTA alongside section heading
- **Adopt for**: Actionable alerts, security warnings, optimization suggestions

### Table List Sidebar
```
┌───────────────────────┐
│ schema [public ▾]     │
│ + New table           │
│ 🔍 Search tables... ▾ │
├───────────────────────┤
│ ⊞ admin_audit_log 🔒  │  ← UNRESTRICTED badge (red)
│ ⊞ admin_roles    🔒  │
│ ⊞ analytics_events 🔒│
│ ⊞ api_keys       🔒  │
│ ...40+ tables         │
└───────────────────────┘
```
- Schema selector dropdown at top
- "New table" action button
- Search with filter toggle
- Each table: icon + name (monospace) + RLS indicator (shield icon)
- Red "UNRESTRICTED" pill for tables without RLS
- **Adopt for**: Any hierarchical list of database objects, API endpoints, or resources

### SQL Editor (Split Pane)
```
┌───────────────────────┬──────────────────────────────────┐
│ SQL Editor            │ + New        [tab: query name]   │
│                       │                                  │
│ 🔍 Search queries...  │  1  Hit CMD+K to generate...    │
│                       │  2                               │
│ > SHARED              │  3                               │
│ > FAVORITES           │  ...                             │
│ v PRIVATE (1)         │  [code editor area]              │
│   • Prevent RLS...    │                                  │
│ v COMMUNITY           │                                  │
│   Templates           ├──────────────────────────────────┤
│   Quickstarts         │ Results | Explain | Chart        │
│                       │ Source | DB ▾ | Role | [Run ⌘↵] │
│                       │                                  │
│ [View running queries]│ Click Run to execute your query. │
└───────────────────────┴──────────────────────────────────┘
```
- Left panel: saved queries organized by category (collapsible sections)
- Right panel: code editor (top) + results (bottom), split horizontally
- Tab bar for multiple open queries
- Results area has tabs: Results, Explain, Chart
- Status bar: Source, Database selector, Role, Run button (green, with shortcut)
- **Adopt for**: Any code/query interface, REPL-style tools

### Breadcrumb Navigation
```
  ⚡ / Signal x Studio LLC PRO ↕ / 🔗 rally-hq ↕ / main PRODUCTION ↕ / 🔌 Connect
```
- Logo + separator + org (with plan badge) + project + branch (with environment badge)
- Each segment has a dropdown switcher (↕)
- Environment badge: "PRODUCTION" in green pill
- **Adopt for**: Multi-tenant, multi-project, multi-environment contexts

### Organization Card
```
┌────────────────────────────────────────┐
│  [org-icon]  Organization Name        │
│              Plan · N projects        │
└────────────────────────────────────────┘
```
- Icon (monogram/logo) + name + plan + project count
- Card border, no shadow
- 3-column grid layout
- Three-dot menu per card
- **Adopt for**: Workspace/org selection pages

### Warning Badge (Inline)
```
  table_name  UNRESTRICTED     ← Red pill badge, inline with item
  table_name  🔒               ← Shield icon = RLS enabled (safe)
```
- Red "UNRESTRICTED" for security warnings
- Shield icon (green) for protected items
- Inline with the list item, no separate column
- **Adopt for**: Security/compliance indicators on resource lists

---

## 4. Design Principles Extracted

1. **Icon sidebar for power users** — Collapse the nav to 48px icons to maximize content area. Labels appear on hover or expand. Trades discoverability for density.
2. **Breadcrumb as context stack** — Org > Project > Branch > Environment shown horizontally with dropdowns. Users always know where they are in a deep hierarchy.
3. **Horizontal card carousels** — Metrics and advisor cards scroll horizontally with arrow navigation. Better than vertical stacking when you have 4+ items of equal importance.
4. **Green as the only brand color** — Supabase green (`#3ECF8E`) used for active states, CTAs, chart data, and the logo. Everything else is monochrome. Similar to Resend's restraint.
5. **Three-layer navigation** — Top bar (context), icon sidebar (features), inner sidebar (feature-specific). Each layer serves a different cognitive purpose.
6. **Monospace for database objects** — Table names, column names, and SQL use monospace. Consistent with Vercel's treatment of machine values.
7. **Split pane for code** — Editor top, results bottom. Standard IDE pattern applied to web dashboard. Tab bar for multiple queries.
8. **Security as inline visual** — RLS status shown as shield icons and red "UNRESTRICTED" badges directly in the table list. Security is ambient, not hidden in settings.
9. **Advisor as proactive guardian** — Red notification dot on nav + dedicated issue cards on dashboard. The system tells you what's wrong without you asking.
10. **Dark mode as default** — Dashboard is dark by default, matching developer tool conventions. Light mode available but secondary.

---

## 5. Applicability Matrix

| Pattern | Rally HQ | QuantifAI | 630 Apps | brand-forge |
|---------|----------|-----------|----------|-------------|
| Icon-only sidebar | Consider | Yes | No | N/A |
| Breadcrumb context stack | Yes (org/event/division) | Yes (project/pipeline) | Maybe | N/A |
| Horizontal card carousel | Yes (match stats) | Yes (metrics) | No | N/A |
| Status card grid (2x2) | Yes (event health) | Yes (system health) | No | N/A |
| Split pane (code/results) | No | Maybe (query builder) | No | N/A |
| Advisor/warning cards | Yes (RLS, config) | Yes (cost alerts) | Maybe | N/A |
| Inline security badges | Yes (already uses Supabase) | Yes | Yes | N/A |
| Bar chart metric cards | Yes (match activity) | Yes (API usage) | No | N/A |
| Dark mode default | Consider | Yes | No (has own theme) | N/A |
| Table list with search | Yes (admin views) | Yes | Maybe | N/A |

### Rally HQ priorities
1. Breadcrumb context stack: Org > Tournament > Division > Match
2. Status card grid for tournament/event health overview
3. Horizontal card carousel for multi-metric match stats
4. Advisor-style warning cards for configuration issues
5. Inline security badges (already familiar from Supabase)

### QuantifAI priorities
1. Icon-only sidebar for maximum data/chart area
2. Bar chart metric cards in horizontal carousel
3. Split pane for query/analysis interfaces
4. Advisor cards for cost threshold warnings
5. Dark mode as default for analytics dashboard

### 630 Apps priorities
1. Breadcrumb for app context (630 > E-Sign > Contract > Signer)
2. Inline status badges (borrow from table list pattern)

---

## 6. Contrast with Previous References

| Dimension | ChatPRD | Vercel | Resend | Supabase |
|-----------|---------|--------|--------|----------|
| Nav model | Sidebar (expanded) | Sidebar (expanded) | Sidebar (flat) | 3-layer (icon + breadcrumb + inner) |
| Color accent | Violet | None (monochrome) | None (semantic only) | Green (brand) |
| Dark mode | No | Yes (opt-in) | No | Yes (default) |
| Card layout | Vertical list | Hairline-separated | Grid + table | Horizontal carousel |
| Data viz | None | Sparklines | Area/bar charts | Bar charts in cards |
| Security viz | None | None | None | Inline badges + advisor cards |
| Code support | None | Monospace values | Monospace slugs | Full code editor |
| Nav density | Low (4 items) | Medium (15 items) | Low (10 items) | High (13 icons) |
| Target user | Product managers | Developers | Developers | Database developers |

**Key insight**: Supabase's three-layer navigation is the most sophisticated model. It handles the challenge of "org > project > branch > feature > sub-feature" without overwhelming the user. The icon sidebar lets power users navigate by muscle memory while keeping maximum screen real estate for content. This is the right pattern for Rally HQ and QuantifAI which both have deep navigation hierarchies.

**Progressive complexity model (updated)**:
- **ChatPRD** = onboarding-first (guide to first action)
- **Resend** = data-first (show what happened)
- **Vercel** = density-first (show everything)
- **Supabase** = depth-first (navigate deep hierarchies)
