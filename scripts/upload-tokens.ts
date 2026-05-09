import 'dotenv/config';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { homedir } from 'node:os';
import { Redis } from '@upstash/redis';

const tokenFile = join(homedir(), '.whoop-cli', 'tokens.json');
const tokens = JSON.parse(readFileSync(tokenFile, 'utf-8'));

const redis = Redis.fromEnv();
await redis.set('whoop:tokens', tokens);

console.log(`Uploaded tokens from ${tokenFile} to Upstash.`);
console.log(`  keys: ${Object.keys(tokens).join(', ')}`);
console.log(`  expires_at: ${tokens.expires_at} (${new Date(tokens.expires_at * 1000).toISOString()})`);
