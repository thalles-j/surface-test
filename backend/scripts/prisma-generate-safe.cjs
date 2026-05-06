const { spawnSync } = require('node:child_process');

function sleep(ms) {
  const start = Date.now();
  while (Date.now() - start < ms) { /* busy-wait */ }
}

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

function isWindowsEngineLock(result) {
  if (process.platform !== 'win32') return false;
  const text = getOutputText(result);
  return /EPERM/i.test(text) && /query_engine-windows\.dll\.node/i.test(text);
}

const MAX_RETRIES = 3;

for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
  const result = run('npx', ['prisma', 'generate']);
  if (result.status === 0) {
    process.exit(0);
  }

  if (isWindowsEngineLock(result)) {
    if (attempt < MAX_RETRIES) {
      console.warn(`\n[prisma] Windows engine lock detected (attempt ${attempt}/${MAX_RETRIES}). Retrying in 2s...`);
      console.warn('Tip: Stop any running Node/backend processes to release the file lock.\n');
      sleep(2000);
      continue;
    }
  }

  // Not a Windows engine lock, or retries exhausted
  console.error('\n[prisma] prisma generate failed.\n');
  if (isWindowsEngineLock(result)) {
    console.error(
      'ERROR: The Prisma query engine file is locked by another process.\n' +
      'This usually happens when the backend dev server is running.\n\n' +
      'To fix:\n' +
      '  1. Stop all running Node processes (backend dev server, test runners, etc.)\n' +
      '  2. Run: npx prisma generate\n' +
      '  3. Restart the backend server\n\n' +
      'NEVER use --no-engine for this project — it breaks direct PostgreSQL connections.\n'
    );
  }
  process.exit(result.status ?? 1);
}
