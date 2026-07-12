const { Redis } = require('ioredis');

const redis = process.env.REDIS_URL ? new Redis(process.env.REDIS_URL, {
  maxRetriesPerRequest: 1,
  enableOfflineQueue: false,
  connectTimeout: 2000
}) : null;

const DAILY_LIMIT = 100;

// ── Model fallback chain (different models = different quota buckets) ──
const MODELS = [
  'gemini-2.0-flash',
  'gemini-2.0-flash-lite',
  'gemini-2.5-flash',
  'gemini-1.5-flash-latest',
  'gemini-pro',
];

function getKeyPool() {
  const keys = [];
  if (process.env.GEMINI_API_KEY)   keys.push({ key: process.env.GEMINI_API_KEY,   role: 'primary' });
  if (process.env.GEMINI_API_KEY_1) keys.push({ key: process.env.GEMINI_API_KEY_1, role: 'parallel-1' });
  if (process.env.GEMINI_API_KEY_2) keys.push({ key: process.env.GEMINI_API_KEY_2, role: 'parallel-2' });
  if (process.env.GEMINI_API_KEY_3) keys.push({ key: process.env.GEMINI_API_KEY_3, role: 'fallback-1' });
  if (process.env.GEMINI_API_KEY_4) keys.push({ key: process.env.GEMINI_API_KEY_4, role: 'fallback-2' });
  if (process.env.GEMINI_API_KEY_5) keys.push({ key: process.env.GEMINI_API_KEY_5, role: 'fallback-3' });
  return keys;
}

function isQuotaError(status, body) {
  if (status === 429 || status === 503) return true;
  if (status === 400) {
    const msg = (body?.error?.message || '').toLowerCase();
    return msg.includes('quota') || msg.includes('limit') || msg.includes('free_tier') || msg.includes('exhausted');
  }
  return false;
}

// Try one key + one model — returns data or throws QUOTA: / HARD: error
async function tryOnce(apiKey, model, payload) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (response.ok) return response.json();

  const body = await response.json().catch(() => ({}));
  if (isQuotaError(response.status, body)) {
    throw new Error(`QUOTA:${model}:${body?.error?.message || response.status}`);
  }
  // Model not found → try next model
  if (response.status === 404 || (body?.error?.message || '').includes('not found')) {
    throw new Error(`MODEL_NOT_FOUND:${model}`);
  }
  throw new Error(`HARD:${body?.error?.message || `HTTP ${response.status}`}`);
}

// PRIMARY + PARALLEL RACE with automatic model+key fallback
async function smartCall(payload) {
  const pool = getKeyPool();
  if (!pool.length) throw new Error('No Gemini API keys configured.');

  const primary   = pool[0];
  const parallel  = pool.slice(1, 3);   // KEY_1 + KEY_2 race each other
  const fallbacks = pool.slice(3);       // KEY_3, KEY_4, KEY_5 sequential

  // TIER 1 — primary key, try each model in order
  for (const model of MODELS) {
    try {
      const data = await tryOnce(primary.key, model, payload);
      console.log(`[Gemini] ✓ Primary key OK with model ${model}`);
      return data;
    } catch (err) {
      if (err.message.startsWith('HARD:')) throw new Error(err.message.replace('HARD:', ''));
      // QUOTA or MODEL_NOT_FOUND → try next model
      console.warn(`[Gemini] Primary ${model}: ${err.message}`);
    }
  }

  // TIER 2 — race parallel keys, try each model
  for (const model of MODELS) {
    if (!parallel.length) break;
    try {
      const result = await Promise.any(
        parallel.map(({ key }) =>
          tryOnce(key, model, payload).catch(e => {
            if (e.message.startsWith('HARD:')) throw e;
            return Promise.reject(e); // re-reject quota/model errors
          })
        )
      );
      console.log(`[Gemini] ✓ Parallel race OK with model ${model}`);
      return result;
    } catch (err) {
      // AggregateError means all parallel keys failed
      console.warn(`[Gemini] Parallel race failed for ${model}`);
    }
  }

  // TIER 3 — sequential fallback keys, try each model
  for (const { key, role } of fallbacks) {
    for (const model of MODELS) {
      try {
        const data = await tryOnce(key, model, payload);
        console.log(`[Gemini] ✓ Fallback ${role} OK with model ${model}`);
        return data;
      } catch (err) {
        if (err.message.startsWith('HARD:')) throw new Error(err.message.replace('HARD:', ''));
        console.warn(`[Gemini] Fallback ${role} ${model}: ${err.message}`);
      }
    }
  }

  throw new Error('All Gemini API keys and models exhausted. Please try again in a minute.');
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const pool = getKeyPool();
  if (!pool.length) return res.status(500).json({ error: 'No Gemini API keys configured.' });

  const { uid, payload } = req.body;

  // Rate limiting
  if (uid && redis) {
    try {
      const key = `usage:gemini:${uid}:${new Date().toISOString().split('T')[0]}`;
      const usage = await redis.incr(key);
      if (usage === 1) await redis.expire(key, 86400);
      if (usage > DAILY_LIMIT) {
        return res.status(429).json({ error: { message: 'Daily limit reached. Come back tomorrow!' } });
      }
    } catch (e) { /* Redis down - continue */ }
  }

  try {
    const data = await smartCall(payload || req.body);
    return res.status(200).json(data);
  } catch (err) {
    console.error('[Gemini] All tiers exhausted:', err.message);
    return res.status(500).json({ error: { message: err.message } });
  }
}
