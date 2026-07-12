const { Redis } = require('ioredis');

// Connect to Redis using environment variable with fail-fast options for Serverless
const redis = process.env.REDIS_URL ? new Redis(process.env.REDIS_URL, {
  maxRetriesPerRequest: 1,
  enableOfflineQueue: false,
  connectTimeout: 2000
}) : null;

// Daily limit per user
const DAILY_LIMIT = 50;

// Multi-key rotation pool - reads from environment variables
// Add GEMINI_API_KEY_1 through GEMINI_API_KEY_5 in Vercel dashboard
function getApiKeyPool() {
  const keys = [];
  // Primary key
  if (process.env.GEMINI_API_KEY) keys.push(process.env.GEMINI_API_KEY);
  // Additional rotation keys (add these in Vercel env vars)
  for (let i = 1; i <= 5; i++) {
    const k = process.env[`GEMINI_API_KEY_${i}`];
    if (k) keys.push(k);
  }
  return keys;
}

// Round-robin key selection based on minute to spread load
function selectApiKey(keys) {
  if (!keys.length) return null;
  const idx = Math.floor(Date.now() / 60000) % keys.length;
  return keys[idx];
}

// Attempt Gemini call with automatic key fallback on 429/quota error
async function callGeminiWithFallback(payload) {
  const keys = getApiKeyPool();
  if (!keys.length) throw new Error('No Gemini API keys configured.');

  // Try each key in order until one succeeds
  let lastError = null;
  for (const key of keys) {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${key}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        }
      );

      if (response.status === 429 || response.status === 503) {
        // Quota exceeded or overloaded - try next key
        lastError = await response.json();
        continue;
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData?.error?.message || `Gemini HTTP ${response.status}`);
      }

      return await response.json();
    } catch (err) {
      lastError = err;
      // Network error - try next key
      continue;
    }
  }

  throw new Error(lastError?.error?.message || lastError?.message || 'All Gemini API keys exhausted.');
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const keys = getApiKeyPool();
  if (!keys.length) {
    return res.status(500).json({ error: 'No GEMINI_API_KEY environment variable is set.' });
  }

  // Extract uid and actual payload
  const { uid, payload } = req.body;

  if (uid && redis) {
    try {
      const dateStr = new Date().toISOString().split('T')[0];
      const redisKey = `usage:gemini:${uid}:${dateStr}`;
      
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
      // Continue gracefully if Redis is down
    }
  }

  const geminiPayload = payload || req.body;

  try {
    const data = await callGeminiWithFallback(geminiPayload);
    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({ error: { message: error.message } });
  }
}
