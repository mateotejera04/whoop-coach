import { Redis } from '@upstash/redis';
import type { TokenData, OAuthTokenResponse } from '../types/whoop.js';
import { WhoopError, ExitCode } from '../utils/errors.js';

const TOKEN_KEY = 'whoop:tokens';
const REFRESH_BUFFER_SECONDS = 900;

let _redis: Redis | null = null;
function redis(): Redis {
  if (!_redis) _redis = Redis.fromEnv();
  return _redis;
}

export async function saveTokens(response: OAuthTokenResponse): Promise<void> {
  const data: TokenData = {
    access_token: response.access_token,
    refresh_token: response.refresh_token,
    expires_at: Math.floor(Date.now() / 1000) + response.expires_in,
    token_type: response.token_type,
    scope: response.scope,
  };
  await redis().set(TOKEN_KEY, data);
}

export async function loadTokens(): Promise<TokenData | null> {
  return await redis().get<TokenData>(TOKEN_KEY);
}

export async function clearTokens(): Promise<void> {
  await redis().del(TOKEN_KEY);
}

export function isTokenExpired(tokens: TokenData): boolean {
  const now = Math.floor(Date.now() / 1000);
  return now >= tokens.expires_at - REFRESH_BUFFER_SECONDS;
}

export async function refreshAccessToken(tokens: TokenData): Promise<TokenData> {
  const clientId = process.env.WHOOP_CLIENT_ID;
  const clientSecret = process.env.WHOOP_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new WhoopError('Missing WHOOP_CLIENT_ID or WHOOP_CLIENT_SECRET', ExitCode.AUTH_ERROR);
  }

  const response = await fetch('https://api.prod.whoop.com/oauth/oauth2/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: tokens.refresh_token,
      client_id: clientId,
      client_secret: clientSecret,
      scope: 'offline',
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    let errorMsg = `Token refresh failed (${response.status})`;
    try {
      const errorJson = JSON.parse(errorBody);
      errorMsg = errorJson.error_description || errorJson.error || errorMsg;
    } catch {
      // Use default error message
    }
    throw new WhoopError(errorMsg, ExitCode.AUTH_ERROR, response.status);
  }

  const data = (await response.json()) as OAuthTokenResponse;
  await saveTokens(data);
  return (await loadTokens())!;
}

export async function getValidTokens(): Promise<TokenData> {
  let tokens = await loadTokens();

  if (!tokens) {
    throw new WhoopError('Not authenticated. Run: whoopskill auth login', ExitCode.AUTH_ERROR);
  }

  if (isTokenExpired(tokens)) {
    tokens = await refreshAccessToken(tokens);
  }

  return tokens;
}

export async function getTokenStatus(): Promise<{ authenticated: boolean; expires_at?: number }> {
  const tokens = await loadTokens();
  if (!tokens) {
    return { authenticated: false };
  }
  return {
    authenticated: true,
    expires_at: tokens.expires_at,
  };
}
