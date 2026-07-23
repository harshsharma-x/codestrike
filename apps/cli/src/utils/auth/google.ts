import chalk from 'chalk';
import { AuthToken, saveToken } from './store';

const GOOGLE_CLIENT_ID =
  '1023197854676-7o3n5s8v8q8e4k9p1j2r6t3u5w9x0y7z.apps.googleusercontent.com';

interface DeviceCodeResponse {
  device_code: string;
  user_code: string;
  verification_url: string;
  expires_in: number;
  interval: number;
}

interface TokenResponse {
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
  error?: string;
  error_description?: string;
}

interface GoogleUser {
  sub: string;
  name: string;
  email: string;
  picture: string;
}

async function requestDeviceCode(): Promise<DeviceCodeResponse> {
  const res = await fetch('https://oauth2.googleapis.com/device/code', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID,
      scope: 'openid email profile',
    }),
  });
  if (!res.ok) throw new Error(`Google device code request failed: ${res.status}`);
  return res.json();
}

async function pollForToken(
  deviceCode: string,
  interval: number,
  expiresIn: number,
  onProgress?: () => void,
): Promise<TokenResponse> {
  const deadline = Date.now() + expiresIn * 1000;
  while (Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, interval * 1000));
    onProgress?.();
    const res = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: GOOGLE_CLIENT_ID,
        device_code: deviceCode,
        grant_type: 'urn:ietf:params:oauth:grant-type:device_code',
      }),
    });
    const data: TokenResponse = await res.json();
    if (data.access_token) return data;
    if (data.error === 'authorization_pending') continue;
    if (data.error === 'slow_down') {
      await new Promise((r) => setTimeout(r, 5000));
      continue;
    }
    if (data.error === 'expired_token') throw new Error('Device code expired. Please try again.');
    if (data.error === 'access_denied') throw new Error('Authorization denied.');
    throw new Error(`Google OAuth error: ${data.error || 'unknown'}`);
  }
  throw new Error('Timed out waiting for authorization.');
}

async function fetchUserInfo(token: string): Promise<GoogleUser> {
  const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`Failed to fetch Google user: ${res.status}`);
  return res.json();
}

function printInstructions(code: string, uri: string): void {
  console.log();
  console.log(chalk.cyan('  ┌─────────────────────────────────────────────────────┐'));
  console.log(
    chalk.cyan('  │') +
      chalk.bold('  Google Authentication') +
      '                        ' +
      chalk.cyan('│'),
  );
  console.log(chalk.cyan('  ├─────────────────────────────────────────────────────┤'));
  console.log(
    chalk.cyan('  │') +
      chalk.dim('  To authenticate, follow these steps:') +
      '                ' +
      chalk.cyan('│'),
  );
  console.log(
    chalk.cyan('  │') + '                                                     ' + chalk.cyan('│'),
  );
  console.log(
    chalk.cyan('  │') +
      `  ${chalk.bold('1.')} Visit: ${chalk.blue.underline(uri)}` +
      '   ' +
      chalk.cyan('│'),
  );
  console.log(
    chalk.cyan('  │') +
      `  ${chalk.bold('2.')} Enter code: ${chalk.bold.yellow(code)}` +
      '                    ' +
      chalk.cyan('│'),
  );
  console.log(
    chalk.cyan('  │') + '                                                     ' + chalk.cyan('│'),
  );
  console.log(
    chalk.cyan('  │') +
      chalk.dim('  Waiting for authorization...') +
      '                   ' +
      chalk.cyan('│'),
  );
  console.log(chalk.cyan('  └─────────────────────────────────────────────────────┘'));
  console.log();
}

export async function loginWithGoogle(): Promise<AuthToken> {
  const deviceCode = await requestDeviceCode();
  printInstructions(deviceCode.user_code, deviceCode.verification_url);

  let dots = 0;
  const onProgress = () => {
    process.stdout.write(chalk.dim('.'));
    dots++;
    if (dots % 40 === 0) process.stdout.write('\n' + chalk.dim('  still waiting...'));
  };

  const tokenData = await pollForToken(
    deviceCode.device_code,
    deviceCode.interval,
    deviceCode.expires_in,
    onProgress,
  );
  process.stdout.write(chalk.green(' ✓\n'));

  const user = await fetchUserInfo(tokenData.access_token!);

  const token: AuthToken = {
    provider: 'google',
    accessToken: tokenData.access_token!,
    refreshToken: tokenData.refresh_token,
    userInfo: {
      id: user.sub,
      name: user.name,
      email: user.email,
      avatar: user.picture,
    },
    expiresAt: tokenData.expires_in ? Date.now() + tokenData.expires_in * 1000 : undefined,
    scope: ['openid', 'email', 'profile'],
  };

  saveToken(token);
  return token;
}
