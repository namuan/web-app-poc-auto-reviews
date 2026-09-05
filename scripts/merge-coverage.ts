import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { globSync } from 'glob';
import { createCoverageMap } from 'istanbul-lib-coverage';

const files = globSync('test-results/**/coverage*.json', { nodir: true });
const coverage = createCoverageMap({});
for (const file of files) coverage.merge(JSON.parse(readFileSync(file, 'utf8')));
mkdirSync('.artifacts', { recursive: true });
writeFileSync('.artifacts/coverage-final.json', `${JSON.stringify(coverage.toJSON(), null, 2)}\n`);
process.stdout.write(`Merged ${files.length} coverage snapshots.\n`);
