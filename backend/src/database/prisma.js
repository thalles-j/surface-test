import { PrismaClient } from '@prisma/client';

function normalizeNeonUrlForWindows(rawUrl) {
  if (process.platform !== 'win32' || !rawUrl) return rawUrl;

  try {
    const parsed = new URL(rawUrl);
    if (parsed.searchParams.get('channel_binding') === 'require') {
      parsed.searchParams.delete('channel_binding');
      return parsed.toString();
    }
    return rawUrl;
  } catch {
    return rawUrl;
  }
}

process.env.DATABASE_URL = normalizeNeonUrlForWindows(process.env.DATABASE_URL);
const prisma = new PrismaClient();

export default prisma;
