import fs from 'fs';
import path from 'path';

const DIR = '/data/data/com.termux/files/home/codestrike';
const OWNER = 'harshsharma-x';
const REPO = 'codestrike';
const TOKEN = process.env.GH_TOKEN || '';
const API = `https://api.github.com/repos/${OWNER}/${REPO}`;

if (!TOKEN) { console.error('GH_TOKEN required'); process.exit(1); }

const headers = {
  Authorization: `Bearer ${TOKEN}`,
  Accept: 'application/vnd.github.v3+json',
  'Content-Type': 'application/json',
};

async function api(method, url, body) {
  const resp = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await resp.json();
  if (!resp.ok) throw new Error(`${method} ${url}: ${resp.status} ${data.message}`);
  return data;
}

async function main() {
  console.log('Getting default branch ref...');
  const ref = await api('GET', `${API}/git/refs/heads/main`).catch(() => null);

  let baseTree = null;
  if (ref) {
    const commit = await api('GET', `${API}/git/commits/${ref.object.sha}`);
    baseTree = commit.tree.sha;
    console.log('Base tree:', baseTree);
  }

  // Collect all files
  const files = [];
  function walk(dir, prefix = '') {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      if (e.name === '.git' || e.name === 'node_modules' || e.name === 'dist' || e.name === '.next' || e.name === 'scripts') continue;
      if (e.name.startsWith('.')) continue;
      const p = path.join(dir, e.name);
      const rel = prefix ? `${prefix}/${e.name}` : e.name;
      if (e.isDirectory()) walk(p, rel);
      else files.push({ path: rel, absPath: p });
    }
  }
  walk(DIR);
  console.log(`Uploading ${files.length} files...`);

  // Create blobs and build tree
  const tree = [];
  let count = 0;
  for (const file of files) {
    const content = fs.readFileSync(file.absPath, 'base64');
    const blob = await api('POST', `${API}/git/blobs`, {
      content,
      encoding: 'base64',
    });
    tree.push({
      path: file.path,
      mode: '100644',
      type: 'blob',
      sha: blob.sha,
    });
    count++;
    if (count % 20 === 0) process.stdout.write(`\r  ${count}/${files.length} blobs created`);
  }
  console.log(`\r  ${count}/${files.length} blobs created`);

  // Create tree
  console.log('Creating tree...');
  const treeObj = await api('POST', `${API}/git/trees`, {
    tree,
    base_tree: baseTree,
  });

  // Create commit
  console.log('Creating commit...');
  const author = { name: 'CodeStrike AI', email: 'codestrike@codestrike.ai' };
  const commit = await api('POST', `${API}/git/commits`, {
    message: 'Initial commit - CodeStrike AI',
    tree: treeObj.sha,
    parents: ref ? [ref.object.sha] : [],
    author,
    committer: author,
  });

  // Update ref
  console.log('Updating ref...');
  await api('PATCH', `${API}/git/refs/heads/main`, {
    sha: commit.sha,
    force: true,
  });

  console.log(`\n✓ Push complete! ${commit.sha}`);
  console.log(`  https://github.com/${OWNER}/${REPO}`);
}

main().catch(e => {
  console.error('\nPush failed:', e.message);
  process.exit(1);
});
