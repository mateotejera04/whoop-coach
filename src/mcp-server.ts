import 'dotenv/config';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { getTodaySnapshot, getTrends } from './whoop.js';
import { buildPlan } from './planner.js';
import { runDailyCoaching } from './run-daily.js';

const server = new McpServer({ name: 'whoop-coach', version: '0.1.0' });

const json = (data: unknown) => ({
  content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }],
});

server.registerTool(
  'get_health_snapshot',
  {
    description: "Today's recovery %, HRV, RHR, sleep, and strain from WHOOP",
    inputSchema: {},
  },
  async () => json(await getTodaySnapshot()),
);

server.registerTool(
  'get_trends',
  {
    description: 'Recovery + sleep + strain trends for the last N days (default 7)',
    inputSchema: {
      days: z.number().int().min(1).max(90).optional().describe('Window in days, default 7'),
    },
  },
  async ({ days }) => json(await getTrends(days ?? 7)),
);

server.registerTool(
  'get_daily_plan',
  {
    description: "Generate today's gym + running plan based on current WHOOP metrics",
    inputSchema: {},
  },
  async () => {
    const snapshot = await getTodaySnapshot();
    return json({ snapshot, plan: buildPlan(snapshot) });
  },
);

server.registerTool(
  'send_daily_coaching',
  {
    description: 'Generate the daily plan and send it via WhatsApp (Twilio)',
    inputSchema: {
      dryRun: z.boolean().optional().describe('If true, return message without sending'),
    },
  },
  async ({ dryRun }) => json(await runDailyCoaching({ dryRun: dryRun ?? false })),
);

await server.connect(new StdioServerTransport());
