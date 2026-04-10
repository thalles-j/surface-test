const { spawnSync } = require('node:child_process');

function run(command, args) {
  const result = spawnSync(command, args, {
    stdio: 'pipe',
    shell: process.platform === 'win32',
  });
  if (result.stdout) process.stdout.write(result.stdout);
  if (result.stderr) process.stderr.write(result.stderr);
  return result;
}

function getOutputText(result) {
  const out = [];
  if (result.stdout) out.push(String(result.stdout));
  if (result.stderr) out.push(String(result.stderr));
  return out.join('\n');
}

const full = run('npx', ['prisma', 'generate']);
if (full.status === 0) {
  process.exit(0);
}

const errorText = getOutputText(full);
const hasWindowsEngineLock =
  process.platform === 'win32' &&
  /EPERM/i.test(errorText) &&
  /query_engine-windows\.dll\.node/i.test(errorText);

if (!hasWindowsEngineLock) {
  process.exit(full.status ?? 1);
}

console.warn('\n[prisma] Windows engine lock detected. Retrying with --no-engine...\n');
const fallback = run('npx', ['prisma', 'generate', '--no-engine']);
process.exit(fallback.status ?? 1);
