import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { isMatch } from 'micromatch';
import { parse } from 'yaml';

type RiskPolicy = {
  sensitive_paths: string[];
  low_risk_limits: {
    max_production_files: number;
    max_changed_production_lines: number;
    max_feature_areas: number;
  };
};

type ImpactMap = Record<string, { source?: string[]; tests?: string[] }>;

function argument(name: string) {
  const index = process.argv.indexOf(name);
  return index === -1 ? undefined : process.argv[index + 1];
}

function git(args: string[]) {
  try {
    return execFileSync('git', args, {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore']
    }).trim();
  } catch {
    return '';
  }
}

function changedFiles(base: string) {
  const rangeFiles = git(['diff', '--name-only', '--diff-filter=ACMRT', `${base}...HEAD`]);
  return (rangeFiles || process.env.CHANGED_FILES || '')
    .split('\n')
    .map((file) => file.trim())
    .filter(Boolean);
}

function changedLines(base: string) {
  return git(['diff', '--numstat', `${base}...HEAD`])
    .split('\n')
    .filter(Boolean)
    .reduce((total, line) => {
      const [added, removed] = line.split('\t');
      return total + (Number(added) || 0) + (Number(removed) || 0);
    }, 0);
}

function githubOutput(values: Record<string, string | boolean>) {
  const output = process.env.GITHUB_OUTPUT;
  if (!output) return;
  const body = Object.entries(values)
    .map(([key, value]) => `${key}=${String(value)}`)
    .join('\n');
  writeFileSync(output, `${readFileSync(output, { encoding: 'utf8' })}${body}\n`);
}

const base = argument('--base') ?? process.env.GITHUB_BASE_SHA ?? 'HEAD~1';
const policy = parse(readFileSync('config/risk-policy.yml', 'utf8')) as RiskPolicy;
const map = parse(readFileSync('config/test-impact-map.yml', 'utf8')) as ImpactMap;
const files = changedFiles(base);
const productionFiles = files.filter((file) => file.startsWith('src/'));
const productionLines = changedLines(base);
const sensitiveFiles = files.filter((file) =>
  policy.sensitive_paths.some((pattern) => isMatch(file, pattern))
);
const featureAreas = Object.entries(map)
  .filter(
    ([area, entry]) =>
      area !== 'critical_always' &&
      entry.source?.some((pattern) => productionFiles.some((file) => isMatch(file, pattern)))
  )
  .map(([area]) => area);
const behaviorAffecting = productionFiles.some((file) =>
  /src\/(features|components|routes|hooks|validation|api|state)\//.test(file)
);
const testEvidenceChanged = files.some(
  (file) => file.startsWith('tests/') && /\.(spec|test)\.tsx?$/.test(file)
);
const visualRequired = productionFiles.some((file) => /\.(tsx|jsx|css|scss|sass)$/.test(file));
const underLimits =
  productionFiles.length <= policy.low_risk_limits.max_production_files &&
  productionLines <= policy.low_risk_limits.max_changed_production_lines &&
  featureAreas.length <= policy.low_risk_limits.max_feature_areas;
const lane = sensitiveFiles.length
  ? 'high-risk'
  : behaviorAffecting
    ? underLimits
      ? 'low-risk-behavioral'
      : 'standard'
    : 'fast-path';
const autoMergeCandidate = lane === 'low-risk-behavioral' && testEvidenceChanged;
const report = {
  base,
  files,
  productionFiles,
  productionLines,
  featureAreas,
  sensitiveFiles,
  behaviorAffecting,
  testEvidenceChanged,
  visualRequired,
  lane,
  autoMergeCandidate,
  requiresHumanReview: !autoMergeCandidate
};

mkdirSync('.artifacts', { recursive: true });
writeFileSync('.artifacts/risk-report.json', `${JSON.stringify(report, null, 2)}\n`);
githubOutput({
  lane,
  behavior_affecting: behaviorAffecting,
  visual_required: visualRequired,
  auto_merge_candidate: autoMergeCandidate,
  requires_human_review: !autoMergeCandidate
});
process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
