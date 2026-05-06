import { Pool } from 'pg';

function normalizeNeonUrl(rawUrl) {
  if (!rawUrl) return rawUrl;
  try {
    const parsed = new URL(rawUrl);
    if (parsed.searchParams.get('channel_binding') === 'require') {
      parsed.searchParams.set('channel_binding', 'disable');
    }
    return parsed.toString();
  } catch {
    return rawUrl;
  }
}

const connectionString = normalizeNeonUrl(process.env.DATABASE_URL);

const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false },
});

export async function pgQuery(text, values = []) {
  const result = await pool.query(text, values);
  return result.rows;
}

