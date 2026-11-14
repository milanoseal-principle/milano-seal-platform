import { spawnSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

// Next's TypeScript worker is a separate process. Its heap must be configured in
// the inherited environment, not only on the standalone `tsc` command.
export function buildEnvironment(env = process.env) {
  let heapMb = 6144;
  const remaining = (env.NODE_OPTIONS ?? '').replace(/--max[-_]old[-_]space[-_]size(?:=|\s+)(\d+)/g, (_, value) => {
    heapMb = Math.max(heapMb, Number(value));
    return '';
  }).trim();
  return { ...env, NODE_OPTIONS: `${remaining} --max-old-space-size=${heapMb}`.trim() };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const result = spawnSync(process.execPath, ['node_modules/next/dist/bin/next', 'build', ...process.argv.slice(2)], {
    stdio: 'inherit', env: buildEnvironment(),
  });
  process.exitCode = result.status ?? 1;
}
