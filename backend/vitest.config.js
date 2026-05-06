import { defineConfig } from 'vitest/config';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/**/*.test.js'],
    coverage: {
      provider: 'v8',
      include: ['src/**'],
      exclude: [
        'src/generated/prisma/**',
        'tests/**',
        '**/*.test.js',
        'src/server.js',
        'src/routes/**',
        'src/controllers/**',
      ],
    },
  },
});
