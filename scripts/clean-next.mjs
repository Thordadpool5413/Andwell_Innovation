import { rm } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const target = path.resolve(root, '.next');
const relative = path.relative(root, target);

if (!relative || relative.startsWith('..') || path.isAbsolute(relative)) {
  throw new Error(`Refusing to clean unexpected build path: ${target}`);
}

await rm(target, { recursive: true, force: true });
