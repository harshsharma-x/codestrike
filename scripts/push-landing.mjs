const GITHUB_TOKEN = process.env.GH_TOKEN;
const REPO_NAME = 'codestrike-website';
const REPO_DESC = 'CodeStrike AI — Launch Website';

const LANDING_DIR = '/data/data/com.termux/files/home/codestrike-landing';

async function api(url, options = {}) {
  const res = await fetch(url, {
    ...options,
    headers: {
      'Authorization': `Bearer ${GITHUB_TOKEN}`,
      'Accept': 'application/vnd.github+json',
      ...(options.headers || {}),
    },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API ${res.status}: ${text}`);
  }
  return res.status === 204 ? null : res.json();
}

async function main() {
  // 1. Create the repo
  console.log('Creating repository...');
  let repo;
  try {
    repo = await api('https://api.github.com/user/repos', {
      method: 'POST',
      body: JSON.stringify({
        name: REPO_NAME,
        description: REPO_DESC,
        private: false,
        auto_init: false,
      }),
    });
    console.log(`  Created: ${repo.html_url}`);
  } catch (e) {
    if (e.message.includes('422')) {
      console.log('  Repo already exists, fetching...');
      repo = await api(`https://api.github.com/repos/harshsharma-x/${REPO_NAME}`);
      console.log(`  Found: ${repo.html_url}`);
    } else {
      throw e;
    }
  }

  // 2. Get the default branch
  const defaultBranch = repo.default_branch;
  console.log(`  Default branch: ${defaultBranch}`);

  // 3. Get the ref
  let baseTree;
  let parentSha;
  try {
    const ref = await api(`https://api.github.com/repos/harshsharma-x/${REPO_NAME}/git/refs/heads/${defaultBranch}`);
    parentSha = ref.object.sha;
    const commit = await api(`https://api.github.com/repos/harshsharma-x/${REPO_NAME}/git/commits/${parentSha}`);
    baseTree = commit.tree.sha;
    console.log(`  Base tree: ${baseTree}`);
  } catch {
    // Empty repo
    baseTree = undefined;
    parentSha = undefined;
    console.log('  Empty repo — creating initial commit');
  }

  // 4. Collect files
  const fs = await import('fs');
  const path = await import('path');

  function collectFiles(dir, prefix = '') {
    const entries = [];
    const items = fs.readdirSync(dir, { withFileTypes: true });
    for (const item of items) {
      if (item.name === 'node_modules' || item.name === '.git') continue;
      const fullPath = path.join(dir, item.name);
      const relPath = prefix ? `${prefix}/${item.name}` : item.name;
      if (item.isDirectory()) {
        entries.push(...collectFiles(fullPath, relPath));
      } else if (item.isFile()) {
        entries.push({ path: relPath, fullPath });
      }
    }
    return entries;
  }

  const files = collectFiles(LANDING_DIR);
  console.log(`  Found ${files.length} files to upload`);

  // 5. Upload blobs in batches
  const BATCH = 20;
  const blobs = [];
  for (let i = 0; i < files.length; i += BATCH) {
    const batch = files.slice(i, i + BATCH);
    const results = await Promise.all(batch.map(async (f) => {
      const content = fs.readFileSync(f.fullPath);
      // Check if it's text or binary
      const isText = /\.(js|jsx|ts|tsx|css|html|json|md|yml|yaml|toml|env|gitignore|sh|svg)$/i.test(f.path);
      let blobData;
      if (isText) {
        blobData = { content: content.toString('utf-8'), encoding: 'utf-8' };
      } else {
        blobData = { content: content.toString('base64'), encoding: 'base64' };
      }
      const blob = await api(`https://api.github.com/repos/harshsharma-x/${REPO_NAME}/git/blobs`, {
        method: 'POST',
        body: JSON.stringify(blobData),
      });
      return { path: f.path, mode: '100644', type: 'blob', sha: blob.sha };
    }));
    blobs.push(...results);
    console.log(`  ${Math.min(i + BATCH, files.length)}/${files.length} blobs created`);
  }

  // 6. Create tree
  const treePayload = { tree: blobs };
  if (baseTree) treePayload.base_tree = baseTree;
  const tree = await api(`https://api.github.com/repos/harshsharma-x/${REPO_NAME}/git/trees`, {
    method: 'POST',
    body: JSON.stringify(treePayload),
  });
  console.log('  Tree created');

  // 7. Create commit
  const commitPayload = {
    message: 'Initial commit — CodeStrike launch website',
    tree: tree.sha,
  };
  if (parentSha) commitPayload.parents = [parentSha];
  const commit = await api(`https://api.github.com/repos/harshsharma-x/${REPO_NAME}/git/commits`, {
    method: 'POST',
    body: JSON.stringify(commitPayload),
  });
  console.log('  Commit created');

  // 8. Update ref
  await api(`https://api.github.com/repos/harshsharma-x/${REPO_NAME}/git/refs/heads/${defaultBranch}`, {
    method: 'PATCH',
    body: JSON.stringify({ sha: commit.sha }),
  });
  console.log('  Ref updated');

  console.log(`\n✓ Push complete! ${commit.sha}`);
  console.log(`  https://github.com/harshsharma-x/${REPO_NAME}`);
}

main().catch(console.error);
