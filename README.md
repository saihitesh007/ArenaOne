# ArenaOne

ArenaOne is a GenAI-enabled stadium companion for FIFA World Cup 2026 matchdays. It gives fans a multilingual assistant for navigation, accessibility, food, zone check-ins, and post-match transport while giving staff a lightweight operations dashboard for incidents, crowd intelligence, and situation summaries.

## Tech Stack

- **Framework:** Next.js 16 App Router
- **Language:** TypeScript
- **AI:** Google Gemini via server-side API routes
- **Data:** Firebase Admin SDK and Firestore
- **Validation:** Zod
- **Testing:** Vitest
- **Deployment Target:** Vercel

## Core Features

- **Fan Assistant:** Chat over the stadium graph for gates, sections, facilities, food, accessibility, parking, and transport.
- **Multilingual Responses:** Gemini is instructed to detect and answer in the fan's language.
- **Accessibility Mode:** Simple wording, larger text, higher contrast, keyboard-friendly controls, and live chat announcements.
- **Zone Check-In:** Anonymous, self-reported zone check-ins feed the shared crowd-density signal. No GPS or live tracking.
- **Post-Match Transport:** Metro, bus, parking-exit mappings, and sample wait times are included in the graph context.
- **Incident Submission:** Staff reports are structured into category, priority, location, and recommended action through the incident API.
- **Crowd Intelligence:** Staff reports, transport alerts, and anonymous fan check-ins share the same Firestore-backed density pipeline.
- **Staff Dashboard:** Incidents, crowd intelligence, transport congestion, and situation summary views share one operational shell.

## Problem Statement Coverage

| Theme | ArenaOne Coverage |
| --- | --- |
| Navigation | Stadium graph routing for gates, sections, washrooms, medical points, food, and exits. |
| Crowd Management | Shared `crowdDensityReports` pipeline blends staff-style reports with anonymous fan check-ins. |
| Accessibility | Simple Mode, accessible washroom guidance, ARIA live chat log, keyboard-visible focus states. |
| Transportation | Post-match metro, bus, and parking-exit guidance is included in the chat graph context and staff summary. |
| Sustainability | Shared density/reporting model supports sustainability-style alerts such as full bins in the dashboard narrative. |
| Multilingual Assistance | `/api/chat` prompt instructs Gemini to detect and respond in the user's language. |
| Operational Intelligence | Staff dashboard summarizes incident queues, crowd pressure, transport congestion, and recommended actions. |
| Real-Time Decision Support | Live-style UI states, check-ins, rate-limited API routes, and graceful AI fallbacks keep the app usable during outages. |

## Persona Coverage

| Persona | Supported Features |
| --- | --- |
| Fans | Chat assistant, zone check-in, accessibility mode, food lookup, route guidance, transport and parking help. |
| Venue Staff | Staff dashboard, active incident cards, crowd-density summaries, transport congestion indicators. |
| Volunteers | Clear operational recommendations and fan-safe routing language suitable for helping guests on the concourse. |
| Organizers | Situation summary panel maps crowd, transport, and incident signals into matchday priorities. |

## Project Structure

```text
app/
  api/
    chat/route.ts
    crowd-density/route.ts
    crowd-density/check-in/route.ts
    health/route.ts
    incidents/route.ts
  globals.css
  layout.tsx
  page.tsx
lib/
  __tests__/
  chat-utils.ts
  crowd-density.ts
  data/stadium-graph.ts
  firebase-admin.ts
  firestore-data.ts
  gemini.ts
  incidents.ts
  rate-limit.ts
  schemas.ts
```

## Local Setup

```bash
npm install
```

Create `.env.local` for server-only secrets:

```env
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=your-service-account-email
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
GEMINI_API_KEY=your-gemini-api-key
```

## Verification

```bash
npm run lint
npm run test:run
npm run build
```

Current local coverage: **12 Vitest files / 53 passing tests** covering prompt generation, schemas, Gemini fallback behavior, rate limiting, stadium graph transport data, incident parsing, crowd-density aggregation, and API route integration paths for chat, health, incidents, crowd reports, and check-ins.

The GitHub Actions workflow in `.github/workflows/test.yml` runs lint, unit/integration tests, and build on every push to `main`.
