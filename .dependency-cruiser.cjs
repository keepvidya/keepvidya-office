/**
 * Enforces the hexagonal boundaries from ENGINEERING-PROTOCOL §1.
 * The domain must stay pure; only adapters may touch vendors; the UI must not
 * reach into adapters. Run via `npm run boundary` (CI gate).
 */
module.exports = {
  forbidden: [
    {
      name: 'domain-stays-pure',
      comment: 'domain must not import ui, app, adapters, or any npm vendor',
      severity: 'error',
      from: { path: '^src/domain' },
      to: { pathNot: '^src/domain' },
    },
    {
      name: 'ui-not-into-adapters',
      comment: 'UI drives ports via the composition root, never adapters directly',
      severity: 'error',
      from: { path: '^src/ui' },
      to: { path: '^src/adapters' },
    },
    {
      name: 'no-vendor-outside-adapters',
      comment: 'Wrapper Rule — vendors only inside src/adapters',
      severity: 'error',
      from: { path: '^src/(domain|ui|app|ai)' },
      to: { dependencyTypes: ['npm'] },
    },
    {
      name: 'ai-stays-pure',
      comment: 'AI core must not import UI or adapters (DIP — ports injected)',
      severity: 'error',
      from: { path: '^src/ai' },
      to: { path: '^src/(ui|adapters)' },
    },
    {
      name: 'domain-not-into-ai',
      comment: 'domain must not depend on the ai layer',
      severity: 'error',
      from: { path: '^src/domain' },
      to: { path: '^src/ai' },
    },
    {
      name: 'no-circular',
      severity: 'error',
      from: {},
      to: { circular: true },
    },
  ],
  options: {
    doNotFollow: { path: 'node_modules' },
    tsConfig: { fileName: 'tsconfig.json' },
    exclude: { path: '(^prototype|node_modules|tests)' },
  },
};
