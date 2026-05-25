# Andwell Innovation Command Center

Andwell Innovation Command Center is a Hostinger-ready Node.js app for public-website competitive intelligence, evidence-scrubbed field language, growth strategy, and executive reporting.

The app keeps the visible command center wired to real Next.js API routes. Supabase is the production source of truth when configured; MongoDB and local JSON remain fallback options for development and constrained hosting.

## What Is Included

- Executive home page with the Andwell Innovation and Growth purpose, read-only outcome previews, process model, and latest package snapshot
- Public competitor source intake wired to `/api/analyze`
- Asynchronous scan job flow (`/api/analyze` start + `/api/analyze/status` polling) to avoid gateway timeouts
- Source review, claim scrubbing, service-line mapping, and safe-language generation
- Full mockup-fidelity product surfaces for Advantage Matrix, Growth Map, Intelligence Library, Strategy, AI Coach, and Executive Report
- Intelligence library powered by stored reports and built outputs
- AI Intelligence Coach powered by `/api/ask` and stored evidence
- Executive report preview with strategy, guardrails, and print support
- Server-side APIs for analysis, competitors, reports, reviews (compatibility), catalog, diagnostics, runtime, health, version, enrichment, and intelligence rebuild checks
- Supabase production persistence, with MongoDB/local JSON fallback
- Hostinger Node.js startup through `app.js`, which delegates to `server.js`

## Local Development

```bash
npm install
npm run dev
```

Open:

```bash
http://localhost:3000
```

## Production Build

```bash
npm install
npm run build
npm start
```

`npm run build` creates the optimized Next.js production build. `npm start` runs `app.js`, which delegates to `server.js` and launches Next on Hostinger's provided `PORT`.

## Hostinger Settings

Use Node.js 20.x.

Build command:

```bash
npm run build
```

Start command:

```bash
npm start
```

Environment variables:

```bash
NODE_ENV=production
CRAWL_MAX_PAGES_PER_SITE=24
CRAWL_TIMEOUT_MS=12000
CIH_DATA_DIR=.data
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
MONGODB_URI=
OPENAI_API_KEY=
OPENAI_MODEL=gpt-4.1-mini
ANALYZE_MAX_COMPETITORS=25
ANALYZE_RATE_LIMIT=8
ANALYZE_RATE_WINDOW_MS=900000
```

Let Hostinger manage `PORT`. Do not set `HOST` to the public domain.

## GitHub To Hostinger

1. In Hostinger, connect the website to `Thordadpool5413/Andwell_Innovation`.
2. Use branch `main`.
3. Use Node.js 20.x.
4. Use `npm run build` as the build command.
5. Use `npm start` as the start command. If Hostinger asks for a startup file, use `app.js`.
6. Add the environment variables above.
7. Deploy.

After deployment, check:

```bash
/api/health
/api/version
/api/runtime
/api/diagnostics
/api/analyze
/api/analyze/status
/api/enrich/providers
/api/enrich/geography
/api/intelligence/rebuild
/api/intelligence/sources
```

The API routes should return JSON. If an API route returns HTML, the site is not running as the Node.js Next server.

Deployment fingerprint:

```bash
/api/version
```

The response should include `repository: "Thordadpool5413/Andwell_Innovation"` and `buildFingerprint: "andwell-innovation-main-full-app-mockup-completion"`. If the live app does not show the executive Home canvas, full Advantage Matrix workspace, Growth Map workspace, Strategy playbook, Coach, and leadership report surfaces, the deployment is not serving this build.

## Safety Rule

The competitive intelligence workflow uses public website evidence. It says "not found publicly" instead of claiming a competitor does not offer a service unless reliable source evidence supports that stronger statement.
