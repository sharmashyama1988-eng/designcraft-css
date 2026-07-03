/* DesignCraft Security Engine
   Rate limiting, prompt injection detection, CSP, usage tracking */

class SecurityEngine {
    constructor() {
        this.DAILY_LIMIT_FREE = 30;
        this.DAILY_LIMIT_AUTH = 200;
        this.PROMPT_MAX_LENGTH = 1200;
        this.RATE_WINDOW_MS = 60000;
        this.BURST_LIMIT = 5;
        this._requestTimestamps = [];
        this._initCSP();
    }

    _initCSP() {
        const meta = document.createElement('meta');
        meta.httpEquiv = 'Content-Security-Policy';
        meta.content = [
            "default-src 'self'",
            "script-src 'self' 'unsafe-inline' https://unpkg.com https://www.gstatic.com https://apis.google.com",
            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
            "font-src https://fonts.gstatic.com",
            "connect-src 'self' https://generativelanguage.googleapis.com https://openrouter.ai https://*.googleapis.com https://*.firebaseio.com wss://*.firebaseio.com",
            "img-src 'self' data: blob: https:",
            "frame-src 'self' blob:"
        ].join('; ');
        document.head.prepend(meta);
    }

    scanPrompt(prompt) {
        const injectionPatterns = [
            /ignore previous instructions/i,
            /disregard (all|your|the) (previous|prior|above|earlier) (instructions?|rules?|directives?|prompts?)/i,
            /you are now/i,
            /act as (a |an )?(different|new|another|evil|unrestricted)/i,
            /jailbreak/i,
            /dan mode/i,
            /bypass (your|the|all) (filters?|restrictions?|rules?|safety)/i,
            /pretend (you are|to be)/i,
            /from now on (you|ignore)/i,
            /forget (all|your|everything)/i,
            /<script[\s\S]*?>/i,
            /javascript:/i,
            /on\w+\s*=/i,
            /eval\s*\(/i,
            /document\.(cookie|write|location)/i,
            /window\.(location|open)/i
        ];

        for (const pattern of injectionPatterns) {
            if (pattern.test(prompt)) {
                return { safe: false, reason: 'Prompt contains restricted content. Describe a UI design only.' };
            }
        }

        if (prompt.length > this.PROMPT_MAX_LENGTH) {
            return { safe: false, reason: `Prompt too long (${prompt.length}/${this.PROMPT_MAX_LENGTH} chars). Please shorten it.` };
        }

        return { safe: true };
    }

    checkRateLimit() {
        const now = Date.now();
        this._requestTimestamps = this._requestTimestamps.filter(t => now - t < this.RATE_WINDOW_MS);
        if (this._requestTimestamps.length >= this.BURST_LIMIT) {
            const wait = Math.ceil((this.RATE_WINDOW_MS - (now - this._requestTimestamps[0])) / 1000);
            return { allowed: false, reason: `Too many requests. Please wait ${wait}s.` };
        }
        this._requestTimestamps.push(now);
        return { allowed: true };
    }

    getDailyKey() {
        return `dc_usage_${new Date().toISOString().slice(0, 10)}`;
    }

    checkDailyQuota(isAuthenticated) {
        const key = this.getDailyKey();
        const used = parseInt(localStorage.getItem(key) || '0', 10);
        const limit = isAuthenticated ? this.DAILY_LIMIT_AUTH : this.DAILY_LIMIT_FREE;
        if (used >= limit) {
            return { allowed: false, used, limit, reason: `Daily limit reached (${used}/${limit} generations). Resets at midnight.` };
        }
        return { allowed: true, used, limit };
    }

    incrementDailyUsage() {
        const key = this.getDailyKey();
        const used = parseInt(localStorage.getItem(key) || '0', 10);
        localStorage.setItem(key, used + 1);
        return used + 1;
    }

    getDailyUsage() {
        return parseInt(localStorage.getItem(this.getDailyKey()) || '0', 10);
    }

    sanitizeOutput(html) {
        return html
            .replace(/<script[\s\S]*?<\/script>/gi, '')
            .replace(/\s*(on\w+\s*=)[^>]*/gi, '');
    }

    runFullCheck(prompt, isAuthenticated) {
        const rateCheck = this.checkRateLimit();
        if (!rateCheck.allowed) return { ok: false, reason: rateCheck.reason };

        const promptCheck = this.scanPrompt(prompt);
        if (!promptCheck.safe) return { ok: false, reason: promptCheck.reason };

        const quotaCheck = this.checkDailyQuota(isAuthenticated);
        if (!quotaCheck.allowed) return { ok: false, reason: quotaCheck.reason };

        return { ok: true, quotaCheck };
    }
}

window.securityEngine = new SecurityEngine();
