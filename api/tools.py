import json
from http.server import BaseHTTPRequestHandler

class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        content_length = int(self.headers.get('Content-Length', 0))
        body = self.rfile.read(content_length)
        
        response_data = {"status": "success", "message": "Action completed"}
        
        try:
            data = json.loads(body)
            action = data.get("action")
            
            if action == "bgRemove":
                response_data["message"] = "Background removed successfully"
            elif action == "genFill":
                response_data["message"] = f"Generative fill applied with prompt: {data.get('prompt', '')}"
            elif action == "colorize":
                response_data["message"] = "Image colorized successfully"
            elif action == "genExpand":
                response_data["message"] = "Image expanded successfully"
            elif action == "imgCss":
                response_data["message"] = "CSS generated successfully"
            elif action == "styleTransfer":
                response_data["message"] = "Style transferred successfully"
            elif action == "upscale":
                response_data["message"] = "Image upscaled successfully"
            elif action == "wireUi":
                response_data["message"] = "UI wireframe generated successfully"
            else:
                response_data["status"] = "error"
                response_data["message"] = "Unknown action"
                
        except json.JSONDecodeError:
            response_data = {"status": "error", "message": "Invalid JSON"}

        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.end_headers()
        self.wfile.write(json.dumps(response_data).encode('utf-8'))

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
