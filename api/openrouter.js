const { Redis } = require('ioredis');

// Connect to Redis using environment variable with fail-fast options
const redis = process.env.REDIS_URL ? new Redis(process.env.REDIS_URL, {
  maxRetriesPerRequest: 1,
  enableOfflineQueue: false,
  connectTimeout: 2000
}) : null;

// Daily limit per user
const DAILY_LIMIT = 20;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'OPENROUTER_API_KEY environment variable is not set.' });
  }

  // Extract uid (we'll send this from frontend) and actual payload
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
            message: 'Free limit exhausted for today. Please enter your own API key in the settings to continue generating.'
          }
        });
      }
    } catch (err) {
      console.error('Redis error:', err);
      // If Redis fails, continue
    }
  }

  const orPayload = payload || req.body;

  try {
    const response = await fetch(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'HTTP-Referer': 'https://designcraft.vercel.app',
          'X-Title': 'DesignCraft CSS',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(orPayload)
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      return res.status(response.status).json(errorData);
    }

    const data = await response.json();
    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
