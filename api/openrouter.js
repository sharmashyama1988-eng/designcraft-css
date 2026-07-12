const { Redis } = require('ioredis');

// Connect to Redis using environment variable with fail-fast options
const redis = process.env.REDIS_URL ? new Redis(process.env.REDIS_URL, {
  maxRetriesPerRequest: 1,
  enableOfflineQueue: false,
  connectTimeout: 2000
}) : null;

// Daily limit per user
const DAILY_LIMIT = 50;

// Multi-key rotation pool for OpenRouter
function getApiKeyPool() {
  const keys = [];
  if (process.env.OPENROUTER_API_KEY) keys.push(process.env.OPENROUTER_API_KEY);
  for (let i = 1; i <= 3; i++) {
    const k = process.env[`OPENROUTER_API_KEY_${i}`];
    if (k) keys.push(k);
  }
  return keys;
}

// Attempt OpenRouter call with automatic key fallback on 429
async function callOpenRouterWithFallback(payload) {
  const keys = getApiKeyPool();
  if (!keys.length) throw new Error('No OpenRouter API keys configured.');

  let lastError = null;
  for (const key of keys) {
    try {
      const response = await fetch(
        'https://openrouter.ai/api/v1/chat/completions',
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${key}`,
            'HTTP-Referer': 'https://designcraft-css.vercel.app',
            'X-Title': 'DesignCraft CSS',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        }
      );

      if (response.status === 429 || response.status === 503) {
        lastError = await response.json();
        continue; // Try next key
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData?.error?.message || `OpenRouter HTTP ${response.status}`);
      }

      return await response.json();
    } catch (err) {
      lastError = err;
      continue;
    }
  }

  throw new Error(lastError?.error?.message || lastError?.message || 'All OpenRouter API keys exhausted.');
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const keys = getApiKeyPool();
  if (!keys.length) {
    return res.status(500).json({ error: 'No OPENROUTER_API_KEY environment variable is set.' });
  }

  // Extract uid and actual payload
  const { uid, payload } = req.body;

  if (uid && redis) {
    try {
      const dateStr = new Date().toISOString().split('T')[0];
      const redisKey = `usage:openrouter:${uid}:${dateStr}`;
      
      const currentUsage = await redis.incr(redisKey);
      
      if (currentUsage === 1) {
        await redis.expire(redisKey, 86400); // 24 hours
      }

      if (currentUsage > DAILY_LIMIT) {
        return res.status(429).json({ 
          error: {
            message: 'Daily free limit reached. Please add your own API key in Settings to continue.'
          }
        });
      }
    } catch (err) {
      console.error('Redis error:', err);
    }
  }

  const orPayload = payload || req.body;

  try {
    const data = await callOpenRouterWithFallback(orPayload);
    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({ error: { message: error.message } });
  }
}
