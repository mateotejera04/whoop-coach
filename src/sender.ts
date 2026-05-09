import twilio from 'twilio';

export interface SendResult {
  sid: string;
  status: string;
}

export async function sendWhatsApp(body: string): Promise<SendResult> {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_FROM;
  const to = process.env.TWILIO_TO;

  const missing = [
    !sid && 'TWILIO_ACCOUNT_SID',
    !token && 'TWILIO_AUTH_TOKEN',
    !from && 'TWILIO_FROM',
    !to && 'TWILIO_TO',
  ].filter(Boolean) as string[];
  if (missing.length) {
    throw new Error(`Missing Twilio env vars: ${missing.join(', ')}`);
  }

  const client = twilio(sid, token);
  const msg = await client.messages.create({ from: from!, to: to!, body });
  return { sid: msg.sid, status: msg.status };
}
