# Andwell Plugin Governance

This document defines the plugin-backed governance layer for the Andwell Intelligence Engine. The app remains fully functional without external design or export services, while the release process now has stronger proof, data shape, and design controls.

## Figma Design System

Target Figma file: `Andwell Intelligence Engine - Product System`.

Source-of-truth components:

- Navigation rail
- Executive canvas
- Dark intelligence cockpit
- Advantage Matrix grid and detail panel
- Growth Map market panel
- Confidence bar
- Evidence card
- Report block
- Briefing export block

Code Connect mapping targets:

- `components/command-center/AppShell.tsx`
- `components/command-center/screens/HomeScreen.tsx`
- `components/command-center/screens/BuildIntelligenceScreen.tsx`
- `components/command-center/screens/MatrixScreen.tsx`
- `components/command-center/screens/GrowthMapScreen.tsx`
- `components/command-center/screens/ReportScreen.tsx`
- `app/globals.css`

Release rule: a screen should not ship unless the browser QA screenshot matches the Figma system, has no horizontal overflow, and does not expose technical/internal language.

## Supabase Intelligence Tables

The schema keeps existing `cih_*` tables intact and adds only non-destructive, service-role-only tables:

- `cih_evidence_items`
- `cih_source_snapshots`
- `cih_package_metrics`
- `cih_market_signals`

`cih_reports.payload` remains the compatibility source. New tables mirror key report outputs for search, trend intelligence, and package quality diagnostics.

## AI Output Quality

The extraction layer now enforces additional guardrails before saving output:

- High-confidence output needs source context.
- Unsupported absence claims stay guarded.
- Superiority language is screened.
- Safe field language and what-not-to-say guidance are required.
- Healthcare evaluation cases cover hospice, home health, palliative care, behavioral health, mobile wound care, GUIDE dementia care, payer risk, and post-acute partnerships.

## GitHub Release Gates

The release workflow runs:

- `npm run typecheck`
- `npm run build:strict`
- `npm run build`
- `npm audit --omit=dev`
- `npm run qa:api`
- `npm run qa:ui`

Artifacts uploaded on every run:

- desktop screenshots
- mobile screenshots
- API smoke report
- UI QA report
- server log

## Browser QA

Browser QA validates:

- Home
- Build Intelligence
- Advantage Matrix
- Growth Map
- Intelligence Library
- Strategy
- AI Coach
- Executive Report

The QA script fails on visible technical language, user-mode build controls outside Build Intelligence, console errors, and horizontal overflow.

## Leadership Export

The app exposes `/api/export/briefing` for structured leadership content. Report users can copy the briefing, download JSON, and print the report. Canva remains optional; the export format is designed to feed branded Canva templates without making Canva required for the core app.

## Optional Cloudflare Reliability Layer

Hostinger remains the deployment target. Cloudflare can be added later as an external reliability layer for:

- uptime checks
- API health monitoring
- scheduled scan triggers
- public status page
- edge rate-limit shield

No hosting migration is required by this governance layer.
