import { readFileSync, writeFileSync } from 'fs';

const file = new URL('../dist/index.cjs', import.meta.url).pathname;
let content = readFileSync(file, 'utf-8');

const oldFn = content.match(/__toESM = \(mod, isNodeMode, target\) => \(target = mod != null \? __create\(__getProtoOf\(mod\)\) : \{\}, __copyProps\([\s\S]*?isNodeMode \|\| !mod \|\| !mod\.__esModule \? __defProp\(target, "default", \{ value: mod, enumerable: true \}\) : target,[\s\S]*?mod\s*\)\s*\);/);

if (oldFn) {
  const newFn = `__toESM = (mod, isNodeMode, target) => {
  target = target || {};
  if (mod != null) {
    if (mod.__esModule && mod.default !== undefined) {
      target.default = mod.default;
    } else {
      target.default = mod;
    }
    for (var k in mod) {
      if (k !== 'default' && !(k in target)) {
        Object.defineProperty(target, k, { get: () => mod[k], enumerable: true });
      }
    }
  }
  return target;
};`;
  content = content.replace(oldFn[0], newFn);
  writeFileSync(file, content, 'utf-8');
  console.log('Patched __toESM for chalk ESM compatibility');
} else {
  console.error('Could not find __toESM function to patch');
  process.exit(1);
}
