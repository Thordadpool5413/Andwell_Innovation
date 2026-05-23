import { rm } from 'node:fs/promises';
import path from 'node:path';
import { setTimeout as wait } from 'node:timers/promises';

const root = process.cwd();
const target = path.resolve(root, '.next');
const relative = path.relative(root, target);

if (!relative || relative.startsWith('..') || path.isAbsolute(relative)) {
  throw new Error(`Refusing to clean unexpected build path: ${target}`);
}

const maxAttempts = 6;
let lastError = null;

for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
  try {
    await rm(target, { recursive: true, force: true });
    lastError = null;
    break;
  } catch (error) {
    lastError = error;
    if (attempt === maxAttempts) break;
    await wait(180 * attempt);
  }
}

if (lastError) throw lastError;
