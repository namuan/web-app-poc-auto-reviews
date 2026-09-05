import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { relative, resolve } from 'node:path';
import { globSync } from 'glob';
import { isMatch } from 'micromatch';
import { parse } from 'yaml';

type Allowlist = { allowlist?: Array<{ path: string; reason: string; review_when?: string }> };
type Coverage = Record<string, unknown>;

const root = resolve('.');
const coveragePath = '.artifacts/coverage-final.json';
const coverage = existsSync(coveragePath)
  ? (JSON.parse(readFileSync(coveragePath, 'utf8')) as Coverage)
  : {};
const allowlist = parse(readFileSync('config/stale-code-allowlist.yml', 'utf8')) as Allowlist;
const sources = globSync('src/**/*.{ts,tsx,js,jsx}', {
  ignore: ['**/*.d.ts', '**/*.test.*', '**/*.spec.*', '**/*.stories.*']
}).sort();
const reached = new Set(
  Object.keys(coverage).map((file) => relative(root, file).replaceAll('\\', '/'))
);
const expectedRare = sources.filter((file) =>
  allowlist.allowlist?.some((item) => isMatch(file, item.path))
);
const unreached = sources.filter((file) => !reached.has(file));
const suspicious = unreached.filter((file) => !expectedRare.includes(file));
const lines = [
  '# Product Reachability',
  '',
  `Production modules: ${sources.length}`,
  `Reached by journeys: ${sources.length - unreached.length}`,
  `Expected rare: ${expectedRare.length}`,
  `Suspicious: ${suspicious.length}`,
  '',
  '## Investigate',
  '',
  ...(suspicious.length
    ? suspicious.map((file) => `- ${file} — no runtime journey reachability`)
    : ['No suspicious modules found.']),
  '',
  '## Expected rare',
  '',
  ...(expectedRare.length
    ? expectedRare.map((file) => {
        const item = allowlist.allowlist?.find((entry) => isMatch(file, entry.path));
        return `- ${file} — ${item?.reason}`;
      })
    : ['No allowlisted modules.'])
];
mkdirSync('.artifacts', { recursive: true });
writeFileSync('.artifacts/product-reachability.md', `${lines.join('\n')}\n`);
process.stdout.write(`${lines.join('\n')}\n`);
