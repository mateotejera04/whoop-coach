# whoop-coach — Build Plan

> **Built on top of:** [`koala73/whoopskill`](https://github.com/koala73/whoopskill)  
> **One-liner:** Reads your WHOOP recovery data every morning and sends a personalized gym + running plan to your WhatsApp via Twilio — exposed as an MCP server so any AI agent can use it.

---

## What this repo adds on top of whoopskill

[`whoopskill`](https://github.com/koala73/whoopskill) already solves the hard part: OAuth with WHOOP API, token refresh, and a clean CLI for recovery, HRV, sleep, and strain data. This repo forks it and extends it in three layers:

| Layer | What it does |
|---|---|
| **WHOOP client** | Imports whoopskill logic as a TypeScript module (not CLI) |
| **MCP server** | Exposes health data + planning as tools for AI agents |
| **WhatsApp bot** | Twilio integration + daily cron job that sends the coaching message |

---

## Repo structure

```
whoop-coach/
├── src/
│   ├── whoop.ts          # WHOOP API client (based on whoopskill, importable module)
│   ├── planner.ts        # Adaptive training logic (recovery zones → gym + running plan)
│   ├── formatter.ts      # Builds the WhatsApp message (markdown-friendly format)
│   ├── sender.ts         # Twilio WhatsApp sender
│   ├── mcp-server.ts     # MCP server exposing 4 tools
│   └── scheduler.ts      # node-cron daily job (runs at 7am)
├── .env.example          # All required environment variables documented
├── README.md
├── PLAN.md               # This file
├── package.json
└── tsconfig.json
```

---

## MCP tools

| Tool | Description |
|---|---|
| `get_health_snapshot` | Today's recovery %, HRV, RHR, sleep, and strain |
| `get_trends` | Recovery + sleep trends for the last N days |
| `get_daily_plan` | Generates gym + running plan based on today's metrics |
| `send_daily_coaching` | Generates the plan and sends it via WhatsApp |

---

## Training zone logic

The planner reads recovery score + sleep performance and maps them to a training zone:

| Recovery | Sleep | Zone | Gym | Running |
|---|---|---|---|---|
| ≥ 67% | ≥ 70% | 🟢 High | 80% RM · 4×6-8 | Intervals / Tempo |
| 34–66% | any | 🟡 Medium | 70% RM · 3×10-12 | Easy run |
| 10–33% | any | 🟠 Low | 60% RM · 2-3×12-15 | Zone 2 jog |
| < 10% | any | 🔴 Rest | — | — |

Gym split rotates by day of week (chest/back/legs/shoulders/full-body/mobility).  
If accumulated strain > 14 and zone is not High, running is skipped.

---

## WhatsApp message format

Sent every morning at 7am (configurable). Example output:

```
🏋️ WhoopCoach — Monday 2026-05-09

📊 Your metrics today
• Recovery: 78%
• HRV: 44ms
• Resting HR: 58 bpm
• Sleep: 82% (6h 30min)
• Sleep debt: 1h 12min
• Strain: 9.2

🟢 Training zone: HIGH
Recovery 78% and sleep 82% — body is ready for high load

💪 Gym
Focus: Chest + triceps
Intensity: 80% RM · 4 sets x 6-8 reps
Exercises:
  - Bench press
  - Incline press
  - Dips
  - Tricep extensions

🏃 Running
Type: Intervals / Tempo
Distance: 8-12 km
Zone: Zone 4-5 (anaerobic threshold)
1km repeats at 90% HRmax with 90s recovery, or 6-8km continuous tempo

💡 Tip of the day
Perfect day to go for a PR or test a new load.
```

---

## Environment variables

| Variable | Description |
|---|---|
| `WHOOP_CLIENT_ID` | From developer.whoop.com |
| `WHOOP_CLIENT_SECRET` | From developer.whoop.com |
| `WHOOP_REDIRECT_URI` | OAuth callback URL |
| `TWILIO_ACCOUNT_SID` | From Twilio console |
| `TWILIO_AUTH_TOKEN` | From Twilio console |
| `TWILIO_FROM` | `whatsapp:+14155238886` (sandbox) or your verified number |
| `TWILIO_TO` | Your WhatsApp number e.g. `whatsapp:+5491112345678` |
| `CRON_TIME` | Cron expression, default `0 7 * * *` |
| `TZ` | Timezone, default `America/Argentina/Buenos_Aires` |

---

## Setup steps

1. Register a WHOOP app at [developer.whoop.com](https://developer.whoop.com) — apps with < 10 users need no review, immediate access
2. Authenticate with `whoopskill auth login` (tokens saved to `~/.whoop-cli/tokens.json`)
3. Create a Twilio account and activate the WhatsApp sandbox (free): send `join <keyword>` to `+1 415 523 8886`
4. Copy `.env.example` → `.env` and fill in credentials
5. Run `npm run preview` to see a simulated message (no WHOOP or Twilio needed)
6. Run `npm run send-now` to send today's real coaching message
7. Run `npm run scheduler` to start the daily cron job

---

## npm scripts

| Script | Description |
|---|---|
| `npm run preview` | Shows a simulated message in the console, no credentials needed |
| `npm run send-now` | Fetches real WHOOP data and sends WhatsApp immediately |
| `npm run scheduler` | Starts the daily cron job |
| `npm run mcp-server` | Starts the MCP server on stdio |
| `npm run build` | Compiles TypeScript |

---

## Optional: run 24/7 with PM2

```bash
npm install -g pm2
pm2 start "npm run scheduler" --name whoop-coach
pm2 save && pm2 startup
```

---

## Build roadmap

Phased so each step is shippable on its own and de-risks the next.

### Phase 0 — Foundation (½ day)
- Add deps: `@modelcontextprotocol/sdk`, `twilio`, `node-cron`
- Create `.env.example` with all vars listed above
- Add npm scripts: `preview`, `send-now`, `scheduler`, `mcp-server`
- Refactor `src/cli.ts` data fetchers into `src/whoop.ts` (importable, no `console.log` side effects)

**Exit:** `import { getRecovery, getSleep, getStrain } from "./whoop"` works from another file.

### Phase 1 — Pure logic, no external services (1 day)
- `planner.ts` — zone table + gym-split rotation + strain>14 rule
- `formatter.ts` — markdown WhatsApp message
- `npm run preview` — feeds mock metrics through planner+formatter, prints to stdout

**Exit:** can iterate on zones/copy with zero credentials. Cheapest validation loop.

### Phase 2 — Real data path (½ day)
- Wire `whoop.ts` → `planner.ts` → `formatter.ts`
- Resolve cycle-boundary question (WHOOP's "today" ≠ local midnight)
- Token reuse: read `~/.whoop-cli/tokens.json`, handle refresh failures gracefully

**Exit:** `npm run send-now --dry-run` prints the real message for today.

### Phase 3 — WhatsApp delivery (½ day)
- `sender.ts` (Twilio sandbox first)
- `npm run send-now` actually sends
- Failure handling: retry once, log, exit non-zero so cron can alert

**Exit:** message arrives on your phone.

### Phase 4 — Scheduler (¼ day)
- `scheduler.ts` with node-cron, respects `CRON_TIME` + `TZ`
- PM2 instructions verified

**Exit:** runs unattended for 3 days without intervention.

### Phase 5 — MCP server (1 day)
- `mcp-server.ts` exposing the 4 tools
- Each tool is a thin wrapper over Phase 1–3 functions (no new logic)
- Test with Claude Desktop or `mcp-inspector`

**Exit:** `get_daily_plan` callable from an MCP client.

### Phase 6 — Hardening
- Tip-of-the-day source decided (static map per zone is simplest; LLM later)
- Basic logging to a file so you can debug a missed 7am
- README updated with real screenshots

**MVP total (Phases 0–4): ~3 days of focused work. MCP adds another day.**

### Critical-path risks to resolve early
- **Cycle boundary** (Phase 2) — if you get this wrong, the message is for yesterday
- **Token refresh in headless cron** (Phase 2) — if refresh fails at 6:59am, no message
- **Twilio sandbox 24h session window** (Phase 3) — sandbox requires re-joining if you go quiet; production number costs money

---

## Future ideas (Phase 7+)

Ordered by value/effort:

- [ ] **Weekly summary** — Sunday cron, 7-day trends report. Reuses everything, ~½ day
- [ ] **Telegram adapter** — swap `sender.ts`, trivial
- [ ] **Reply handling** — *architectural shift*: needs an always-on webhook server, not just cron. Defer until actually wanted
- [ ] **Google Calendar integration** — skip intense sessions if a race/event is upcoming
- [ ] **Multi-user support** — serve a small group of athletes
- [ ] **Web dashboard** — visualize trends and plan history