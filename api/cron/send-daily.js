import { runDailyCoaching } from '../../src/run-daily.js';
export const config = { runtime: 'nodejs', maxDuration: 30 };
export default async function handler(req, res) {
    if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    try {
        const { sendResult } = await runDailyCoaching();
        return res.status(200).json({
            ok: true,
            sid: sendResult?.sid,
            status: sendResult?.status,
            ts: new Date().toISOString(),
        });
    }
    catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error('cron send-daily failed:', msg);
        return res.status(500).json({ ok: false, error: msg });
    }
}
//# sourceMappingURL=send-daily.js.map