const { Redis } = require('ioredis');

const redis = process.env.REDIS_URL ? new Redis(process.env.REDIS_URL, {
  maxRetriesPerRequest: 1,
  enableOfflineQueue: false,
  connectTimeout: 2000
}) : null;

const DAILY_LIMIT = 200;

// Free models on OpenRouter — no billing needed
const FREE_MODELS = [
  'meta-llama/llama-3.3-70b-instruct:free',
  'google/gemini-2.0-flash-exp:free',
  'deepseek/deepseek-r1:free',
  'microsoft/phi-4:free',
  'qwen/qwen3-8b:free',
];

function getKeyPool() {
  return [
    process.env.OPENROUTER_API_KEY,
    process.env.OPENROUTER_API_KEY_1,
    process.env.OPENROUTER_API_KEY_2,
    process.env.OPENROUTER_API_KEY_3,
  ].filter(Boolean);
}

function isQuotaError(status, body) {
  if (status === 429 || status === 503) return true;
  const msg = (body?.error?.message || '').toLowerCase();
  return msg.includes('quota') || msg.includes('rate limit') || msg.includes('credit');
}

async function tryOnce(apiKey, model, messages, maxTokens = 4096) {
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'HTTP-Referer': 'https://designcraft-css.vercel.app',
      'X-Title': 'DesignCraft CSS',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ model, messages, max_tokens: maxTokens })
  });

  if (response.ok) return response.json();

  const body = await response.json().catch(() => ({}));
  if (isQuotaError(response.status, body)) {
    throw new Error(`QUOTA:${model}:${body?.error?.message || response.status}`);
  }
  if (response.status === 404 || (body?.error?.message || '').includes('not found')) {
    throw new Error(`MODEL_NOT_FOUND:${model}`);
  }
  throw new Error(`HARD:${body?.error?.message || `HTTP ${response.status}`}`);
}

// Smart pool: PRIMARY → PARALLEL RACE → SEQUENTIAL FALLBACKS, across all free models
async function smartCall(messages, maxTokens) {
  const keys = getKeyPool();
  if (!keys.length) throw new Error('No OpenRouter API keys configured.');

  const [primary, ...rest] = keys;
  const parallel  = rest.slice(0, 2);
  const fallbacks = rest.slice(2);

  // TIER 1 — primary key, try models in order
  for (const model of FREE_MODELS) {
    try {
      const data = await tryOnce(primary, model, messages, maxTokens);
      console.log(`[OR] ✓ Primary OK → ${model}`);
      return data;
    } catch (err) {
      if (err.message.startsWith('HARD:')) throw new Error(err.message.replace('HARD:', ''));
      console.warn(`[OR] Primary ${model}: ${err.message}`);
    }
  }

  // TIER 2 — parallel race (fastest wins)
  for (const model of FREE_MODELS) {
    if (!parallel.length) break;
    try {
      const result = await Promise.any(
        parallel.map(key =>
          tryOnce(key, model, messages, maxTokens).catch(e => {
            if (e.message.startsWith('HARD:')) throw e;
            return Promise.reject(e);
          })
        )
      );
      console.log(`[OR] ✓ Parallel race OK → ${model}`);
      return result;
    } catch (_) {
      console.warn(`[OR] Parallel failed for ${model}`);
    }
  }

  // TIER 3 — sequential fallbacks
  for (const key of fallbacks) {
    for (const model of FREE_MODELS) {
      try {
        const data = await tryOnce(key, model, messages, maxTokens);
        console.log(`[OR] ✓ Fallback OK → ${model}`);
        return data;
      } catch (err) {
        if (err.message.startsWith('HARD:')) throw new Error(err.message.replace('HARD:', ''));
        console.warn(`[OR] Fallback ${model}: ${err.message}`);
      }
    }
  }

  throw new Error('All OpenRouter keys and models exhausted. Please try again in a moment.');
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const keys = getKeyPool();
  if (!keys.length) return res.status(500).json({ error: 'No OpenRouter API keys configured.' });

  const { uid, messages, max_tokens, payload } = req.body;

  // Rate limiting
  if (uid && redis) {
    try {
      const rkey = `usage:or:${uid}:${new Date().toISOString().split('T')[0]}`;
      const usage = await redis.incr(rkey);
      if (usage === 1) await redis.expire(rkey, 86400);
      if (usage > DAILY_LIMIT) {
        return res.status(429).json({ error: { message: 'Daily limit reached. Come back tomorrow!' } });
      }
    } catch (_) { /* Redis down - continue */ }
  }

  // Support both direct messages array AND wrapped payload from frontend
  const finalMessages = messages || payload?.messages;
  const finalMaxTokens = max_tokens || payload?.max_tokens || 4096;

  if (!finalMessages?.length) {
    return res.status(400).json({ error: 'No messages provided.' });
  }

  try {
    const data = await smartCall(finalMessages, finalMaxTokens);
    return res.status(200).json(data);
  } catch (err) {
    console.error('[OR] All tiers exhausted:', err.message);
    return res.status(500).json({ error: { message: err.message } });
  }
}
