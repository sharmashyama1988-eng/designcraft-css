const { Redis } = require('ioredis');

// Redis with fail-fast options
const redis = process.env.REDIS_URL ? new Redis(process.env.REDIS_URL, {
  maxRetriesPerRequest: 1,
  enableOfflineQueue: false,
  connectTimeout: 2000
}) : null;

const DAILY_LIMIT = 50;

// ── Key Pool Strategy ──
// PRIMARY: GEMINI_API_KEY (main key, always tried first)
// PARALLEL: GEMINI_API_KEY_1 + GEMINI_API_KEY_2 (race each other for fastest response)
// FALLBACK: GEMINI_API_KEY_3, GEMINI_API_KEY_4, GEMINI_API_KEY_5 (sequential if parallel fails)

function getKeyGroups() {
  const primary = process.env.GEMINI_API_KEY || null;
  const parallel = [
    process.env.GEMINI_API_KEY_1,
    process.env.GEMINI_API_KEY_2,
  ].filter(Boolean);
  const fallbacks = [
    process.env.GEMINI_API_KEY_3,
    process.env.GEMINI_API_KEY_4,
    process.env.GEMINI_API_KEY_5,
  ].filter(Boolean);
  return { primary, parallel, fallbacks };
}

// Single Gemini fetch - throws on quota/error, resolves on success
async function fetchGemini(apiKey, payload) {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }
  );

  if (response.status === 429 || response.status === 503) {
    const err = await response.json().catch(() => ({}));
    throw new Error(`QUOTA:${err?.error?.message || 'Quota exceeded'}`);
  }

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err?.error?.message || `HTTP ${response.status}`);
  }

  return response.json();
}

// Race two keys in parallel - first success wins, quota errors are ignored
async function raceParallel(keys, payload) {
  if (!keys.length) throw new Error('NO_PARALLEL_KEYS');

  return new Promise((resolve, reject) => {
    let settled = false;
    let errors = 0;

    keys.forEach(key => {
      fetchGemini(key, payload)
        .then(data => {
          if (!settled) {
            settled = true;
            resolve(data);
          }
        })
        .catch(err => {
          errors++;
          if (errors === keys.length && !settled) {
            reject(new Error('All parallel keys exhausted'));
          }
        });
    });
  });
}

// Full 3-tier execution: Primary → Parallel Race → Sequential Fallbacks
async function callGeminiSmartPool(payload) {
  const { primary, parallel, fallbacks } = getKeyGroups();

  // TIER 1: Try primary key first
  if (primary) {
    try {
      return await fetchGemini(primary, payload);
    } catch (err) {
      if (!err.message.startsWith('QUOTA:')) throw err; // Hard error, don't retry
      console.warn('[Gemini] Primary key quota hit, racing parallel keys...');
    }
  }

  // TIER 2: Race parallel keys (fastest wins)
  if (parallel.length > 0) {
    try {
      const result = await raceParallel(parallel, payload);
      return result;
    } catch (err) {
      console.warn('[Gemini] All parallel keys exhausted, trying fallbacks...');
    }
  }

  // TIER 3: Sequential fallbacks
  let lastError = null;
  for (const key of fallbacks) {
    try {
      return await fetchGemini(key, payload);
    } catch (err) {
      lastError = err;
      if (!err.message.startsWith('QUOTA:')) throw err; // Hard error
      console.warn(`[Gemini] Fallback key quota hit, trying next...`);
    }
  }

  throw new Error(lastError?.message?.replace('QUOTA:', '') || 'All Gemini API keys exhausted for today.');
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { primary, parallel, fallbacks } = getKeyGroups();
  if (!primary && !parallel.length && !fallbacks.length) {
    return res.status(500).json({ error: 'No Gemini API keys configured in environment.' });
  }

  // Rate limiting via Redis
  const { uid, payload } = req.body;
  if (uid && redis) {
    try {
      const dateStr = new Date().toISOString().split('T')[0];
      const redisKey = `usage:gemini:${uid}:${dateStr}`;
      const currentUsage = await redis.incr(redisKey);
      if (currentUsage === 1) await redis.expire(redisKey, 86400);
      if (currentUsage > DAILY_LIMIT) {
        return res.status(429).json({
          error: { message: 'Daily free limit reached. Come back tomorrow or add your own API key.' }
        });
      }
    } catch (err) {
      console.error('[Redis] Rate limit check failed, continuing:', err.message);
    }
  }

  const geminiPayload = payload || req.body;

  try {
    const data = await callGeminiSmartPool(geminiPayload);
    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({ error: { message: error.message } });
  }
}
