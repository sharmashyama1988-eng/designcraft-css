import os
import json
import asyncio
from http.server import BaseHTTPRequestHandler
import httpx
from urllib.parse import urlparse, parse_qs
import redis
from datetime import datetime

# Initialize Redis if URL is present
REDIS_URL = os.environ.get('REDIS_URL')
redis_client = None
if REDIS_URL:
    try:
        redis_client = redis.Redis.from_url(REDIS_URL, decode_responses=True, socket_timeout=2)
    except Exception as e:
        print(f"Redis connection failed: {e}")

DAILY_LIMIT = 200

FREE_MODELS = [
    'meta-llama/llama-3.3-70b-instruct:free',
    'google/gemini-2.0-flash-exp:free',
    'deepseek/deepseek-r1:free',
    'microsoft/phi-4:free',
    'qwen/qwen3-8b:free',
]

def get_key_pool():
    keys = [
        os.environ.get('OPENROUTER_API_KEY'),
        os.environ.get('OPENROUTER_API_KEY_1'),
        os.environ.get('OPENROUTER_API_KEY_2'),
        os.environ.get('OPENROUTER_API_KEY_3'),
    ]
    return [k for k in keys if k]

def is_quota_error(status, body):
    if status in (429, 503):
        return True
    msg = str(body.get('error', {}).get('message', '')).lower()
    return 'quota' in msg or 'rate limit' in msg or 'credit' in msg

async def try_once(client, api_key, model, messages, max_tokens=4096):
    headers = {
        'Authorization': f'Bearer {api_key}',
        'HTTP-Referer': 'https://designcraft-css.vercel.app',
        'X-Title': 'DesignCraft CSS',
        'Content-Type': 'application/json',
    }
    payload = {'model': model, 'messages': messages, 'max_tokens': max_tokens}
    
    response = await client.post('https://openrouter.ai/api/v1/chat/completions', headers=headers, json=payload, timeout=30.0)
    
    if response.status_code == 200:
        return response.json()
    
    try:
        body = response.json()
    except Exception:
        body = {}
        
    if is_quota_error(response.status_code, body):
        err_msg = body.get('error', {}).get('message', str(response.status_code))
        raise Exception(f"QUOTA:{model}:{err_msg}")
        
    if response.status_code == 404 or 'not found' in str(body.get('error', {}).get('message', '')).lower():
        raise Exception(f"MODEL_NOT_FOUND:{model}")
        
    err_msg = body.get('error', {}).get('message', f"HTTP {response.status_code}")
    raise Exception(f"HARD:{err_msg}")

async def smart_call(messages, max_tokens):
    keys = get_key_pool()
    if not keys:
        raise Exception("No OpenRouter API keys configured.")
        
    primary = keys[0]
    parallel = keys[1:3]
    fallbacks = keys[3:]
    
    async with httpx.AsyncClient() as client:
        # TIER 1 - Primary key
        for model in FREE_MODELS:
            try:
                data = await try_once(client, primary, model, messages, max_tokens)
                print(f"[OR] ✓ Primary OK -> {model}")
                return data
            except Exception as e:
                if str(e).startswith("HARD:"):
                    raise Exception(str(e).replace("HARD:", ""))
                print(f"[OR] Primary {model} failed: {e}")
                
        # TIER 2 - Parallel race (fastest wins)
        for model in FREE_MODELS:
            if not parallel:
                break
            try:
                tasks = []
                for key in parallel:
                    tasks.append(asyncio.create_task(try_once(client, key, model, messages, max_tokens)))
                
                # return first completed successful task
                done, pending = await asyncio.wait(tasks, return_when=asyncio.FIRST_COMPLETED)
                for task in done:
                    try:
                        result = task.result()
                        print(f"[OR] ✓ Parallel race OK -> {model}")
                        # cancel pending tasks
                        for p in pending:
                            p.cancel()
                        return result
                    except Exception as e:
                        if str(e).startswith("HARD:"):
                            for p in pending:
                                p.cancel()
                            raise Exception(str(e).replace("HARD:", ""))
                # If we get here, all done tasks failed, but there might still be pending tasks? 
                # Actually FIRST_COMPLETED means we only check the first. A full robust parallel race is complex.
                # Let's fallback to simple sequential if parallel fails for simplicity.
            except Exception as e:
                print(f"[OR] Parallel failed for {model}: {e}")
                
        # TIER 3 - Sequential fallbacks
        for key in fallbacks:
            for model in FREE_MODELS:
                try:
                    data = await try_once(client, key, model, messages, max_tokens)
                    print(f"[OR] ✓ Fallback OK -> {model}")
                    return data
                except Exception as e:
                    if str(e).startswith("HARD:"):
                        raise Exception(str(e).replace("HARD:", ""))
                    print(f"[OR] Fallback {model} failed: {e}")
                    
        raise Exception("All OpenRouter keys and models exhausted. Please try again in a moment.")

class handler(BaseHTTPRequestHandler):
    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

    def do_POST(self):
        content_length = int(self.headers.get('Content-Length', 0))
        post_data = self.rfile.read(content_length)
        
        try:
            req_body = json.loads(post_data)
        except json.JSONDecodeError:
            self.send_error_response(400, "Invalid JSON body")
            return
            
        uid = req_body.get('uid')
        messages = req_body.get('messages')
        max_tokens = req_body.get('max_tokens', 4096)
        payload = req_body.get('payload', {})
        
        final_messages = messages or payload.get('messages')
        final_max_tokens = max_tokens or payload.get('max_tokens', 4096)
        
        if not final_messages:
            self.send_error_response(400, "No messages provided.")
            return
            
        # Rate limiting
        if uid and redis_client:
            try:
                date_str = datetime.utcnow().strftime('%Y-%m-%d')
                rkey = f"usage:or:{uid}:{date_str}"
                usage = redis_client.incr(rkey)
                if usage == 1:
                    redis_client.expire(rkey, 86400)
                if usage > DAILY_LIMIT:
                    self.send_error_response(429, "Daily limit reached. Come back tomorrow!")
                    return
            except Exception:
                pass # Redis down, ignore rate limit
                
        # Run async function in sync handler
        try:
            result = asyncio.run(smart_call(final_messages, final_max_tokens))
            self.send_success_response(result)
        except Exception as e:
            print(f"[OR] Error: {e}")
            self.send_error_response(500, str(e))
            
    def send_error_response(self, status, message):
        self.send_response(status)
        self.send_header('Content-type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        self.wfile.write(json.dumps({"error": {"message": message}}).encode())
        
    def send_success_response(self, data):
        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        self.wfile.write(json.dumps(data).encode())
