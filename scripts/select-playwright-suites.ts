import { readFileSync, writeFileSync } from 'node:fs';
import { isMatch } from 'micromatch';
import { parse } from 'yaml';

type ImpactMap = Record<string, { source?: string[]; tests?: string[] }>;
type RiskReport = { productionFiles: string[]; behaviorAffecting: boolean };

const impactMap = parse(readFileSync('config/test-impact-map.yml', 'utf8')) as ImpactMap;
const report = JSON.parse(readFileSync('.artifacts/risk-report.json', 'utf8')) as RiskReport;
const tags = new Set<string>(impactMap.critical_always?.tests ?? []);
let runAll = false;

for (const file of report.productionFiles) {
  const matches = Object.entries(impactMap).filter(
    ([area, entry]) =>
      area !== 'critical_always' && entry.source?.some((pattern) => isMatch(file, pattern))
  );
  if (!matches.length && report.behaviorAffecting) runAll = true;
  for (const [, entry] of matches) entry.tests?.forEach((tag) => tags.add(tag));
}

const grep = runAll ? '' : [...tags].join('|');
const result = { runAll, grep, tags: [...tags] };
if (process.env.GITHUB_OUTPUT) {
  writeFileSync(process.env.GITHUB_OUTPUT, `grep=${grep}\nrun_all=${runAll}\n`, { flag: 'a' });
}
process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
