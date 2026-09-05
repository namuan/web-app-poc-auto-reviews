import { expect, test as base } from '@playwright/test';
import { createCoverageMap, CoverageMapData } from 'istanbul-lib-coverage';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

export const test = base.extend({
  page: async ({ page }, use, testInfo) => {
    const coverage = createCoverageMap({});
    const capture = async () => {
      try {
        const snapshot = await page.evaluate<CoverageMapData>(
          () => (window as typeof window & { __coverage__?: CoverageMapData }).__coverage__ ?? {}
        );
        coverage.merge(snapshot);
      } catch {
        return;
      }
    };

    page.on('load', () => {
      void capture();
    });
    await use(page);
    if (process.env.REACHABILITY !== 'true') return;
    await capture();
    await mkdir(testInfo.outputDir, { recursive: true });
    await writeFile(join(testInfo.outputDir, 'coverage.json'), JSON.stringify(coverage.toJSON()));
  }
});

export { expect };
