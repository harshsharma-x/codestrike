import fs from 'fs';
import path from 'path';
import git from 'isomorphic-git';
import http from 'isomorphic-git/http/node';

const DIR = '/data/data/com.termux/files/home/codestrike';
const REMOTE = 'https://github.com/harshsharma-x/forgecode';
const TOKEN = process.env.GH_TOKEN || '';

if (!TOKEN) {
  console.error('Please set GH_TOKEN env var for push auth');
  process.exit(1);
}

const files = [];
function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    const p = path.join(dir, e.name);
    const rel = path.relative(DIR, p);
    if (e.name.startsWith('.') && e.name !== '.gitignore' && e.name !== '.env.example') continue;
    if (e.name === 'node_modules' || e.name === 'dist' || e.name === '.next' || e.name === '.git') continue;
    if (e.isDirectory()) walk(p);
    else files.push(rel);
  }
}
walk(DIR);
console.log(`Found ${files.length} files`);

if (!fs.existsSync(path.join(DIR, '.git'))) {
  await git.init({ fs, dir: DIR });
  console.log('Git repo initialized');
}

const remotes = await git.listRemotes({ fs, dir: DIR });
if (!remotes.find(r => r.remote === 'origin')) {
  await git.addRemote({ fs, dir: DIR, remote: 'origin', url: REMOTE });
  console.log('Remote added');
}

// Check current branch
let currentBranch;
try { currentBranch = await git.currentBranch({ fs, dir: DIR }); } catch {}
console.log('Current branch:', currentBranch);

// Rename master to main if needed
const branches = await git.listBranches({ fs, dir: DIR });
console.log('Branches:', branches);

if (branches.includes('master')) {
  await git.renameBranch({ fs, dir: DIR, ref: 'main', oldref: 'master' });
  console.log('Renamed master -> main');
}

// Ensure we're on main
try {
  await git.checkout({ fs, dir: DIR, ref: 'main' });
} catch (e) {
  // main might not exist as branch yet, create it from HEAD
  await git.branch({ fs, dir: DIR, ref: 'main' });
  await git.checkout({ fs, dir: DIR, ref: 'main' });
}

// Stage and commit
for (const file of files) {
  try {
    await git.add({ fs, dir: DIR, filepath: file });
  } catch (e) {
    // ignore errors
  }
}
console.log('Files staged');

try {
  const sha = await git.commit({
    fs,
    dir: DIR,
    author: { name: 'CodeStrike AI', email: 'codestrike@codestrike.ai' },
    message: 'Initial commit - CodeStrike AI',
  });
  console.log(`Committed: ${sha}`);
} catch (e) {
  console.log('Commit skipped:', e.message);
}

// Push
console.log('Pushing to GitHub...');
try {
  const result = await git.push({
    fs,
    dir: DIR,
    http,
    onAuth: () => ({ username: 'token', password: TOKEN }),
    remote: 'origin',
    ref: 'main',
    force: false,
  });
  console.log('Push result:', JSON.stringify(result));
  console.log('✓ Push complete!');
} catch (e) {
  console.error('Push failed:', e.message);
  console.log('Trying force push...');
  try {
    const result = await git.push({
      fs,
      dir: DIR,
      http,
      onAuth: () => ({ username: 'token', password: TOKEN }),
      remote: 'origin',
      ref: 'main',
      force: true,
    });
    console.log('Force push result:', JSON.stringify(result));
    console.log('✓ Force push complete!');
  } catch (e2) {
    console.error('Force push also failed:', e2.message);
    process.exit(1);
  }
}
