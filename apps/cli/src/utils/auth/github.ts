import chalk from 'chalk';
import { AuthToken, saveToken } from './store';

const GITHUB_CLIENT_ID = 'Ov23li3xHkF7V7JwH5dT';

interface DeviceCodeResponse {
  device_code: string;
  user_code: string;
  verification_uri: string;
  expires_in: number;
  interval: number;
}

interface TokenResponse {
  access_token?: string;
  token_type?: string;
  scope?: string;
  error?: string;
  error_description?: string;
}

interface GitHubUser {
  id: number;
  login: string;
  name: string;
  email: string;
  avatar_url: string;
}

async function requestDeviceCode(): Promise<DeviceCodeResponse> {
  const res = await fetch('https://github.com/login/device/code', {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      client_id: GITHUB_CLIENT_ID,
      scope: 'read:user user:email read:org',
    }),
  });
  if (!res.ok) throw new Error(`GitHub device code request failed: ${res.status}`);
  return res.json();
}

async function pollForToken(
  deviceCode: string,
  interval: number,
  expiresIn: number,
  onProgress?: () => void,
): Promise<string> {
  const deadline = Date.now() + expiresIn * 1000;
  while (Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, interval * 1000));
    onProgress?.();
    const res = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: GITHUB_CLIENT_ID,
        device_code: deviceCode,
        grant_type: 'urn:ietf:params:oauth:grant-type:device_code',
      }),
    });
    const data: TokenResponse = await res.json();
    if (data.access_token) return data.access_token;
    if (data.error === 'authorization_pending') continue;
    if (data.error === 'slow_down') {
      await new Promise((r) => setTimeout(r, 5000));
      continue;
    }
    if (data.error === 'expired_token') throw new Error('Device code expired. Please try again.');
    if (data.error === 'access_denied') throw new Error('Authorization denied.');
    throw new Error(`GitHub OAuth error: ${data.error || 'unknown'}`);
  }
  throw new Error('Timed out waiting for authorization.');
}

async function fetchUserInfo(token: string): Promise<GitHubUser> {
  const res = await fetch('https://api.github.com/user', {
    headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github.v3+json' },
  });
  if (!res.ok) throw new Error(`Failed to fetch GitHub user: ${res.status}`);
  return res.json();
}

function printInstructions(code: string, uri: string): void {
  console.log();
  console.log(chalk.cyan('  ┌─────────────────────────────────────────────────────┐'));
  console.log(
    chalk.cyan('  │') +
      chalk.bold('  GitHub Authentication') +
      '                         ' +
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
      '           ' +
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

export async function loginWithGitHub(): Promise<AuthToken> {
  const deviceCode = await requestDeviceCode();
  printInstructions(deviceCode.user_code, deviceCode.verification_uri);

  let dots = 0;
  const onProgress = () => {
    process.stdout.write(chalk.dim('.'));
    dots++;
    if (dots % 40 === 0) process.stdout.write('\n' + chalk.dim('  still waiting...'));
  };

  const accessToken = await pollForToken(
    deviceCode.device_code,
    deviceCode.interval,
    deviceCode.expires_in,
    onProgress,
  );
  process.stdout.write(chalk.green(' ✓\n'));

  const user = await fetchUserInfo(accessToken);

  const token: AuthToken = {
    provider: 'github',
    accessToken,
    userInfo: {
      id: String(user.id),
      name: user.name || user.login,
      email: user.email || undefined,
      avatar: user.avatar_url || undefined,
    },
    scope: ['read:user', 'user:email', 'read:org'],
  };

  saveToken(token);
  return token;
}
