"""Tiny standard-library server for the MINDORA AI prototype. No pip packages required."""
import json, os, urllib.request, urllib.error
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

ROOT = Path(__file__).resolve().parent
API_KEY = os.environ.get("OPENAI_API_KEY", "").strip()
MODEL = os.environ.get("OPENAI_MODEL", "gpt-4.1-mini").strip()

class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def send_json(self, status, payload):
        data = json.dumps(payload).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(data)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(data)

    def do_POST(self):
        if self.path != "/api/ai":
            return self.send_json(404, {"error": "Not found"})
        if not API_KEY:
            return self.send_json(503, {"error": "AI is not configured. Set OPENAI_API_KEY before starting the server."})
        try:
            length = int(self.headers.get("Content-Length", "0"))
            if length > 20000:
                return self.send_json(413, {"error": "Request too large"})
            body = json.loads(self.rfile.read(length).decode("utf-8"))
            task = str(body.get("task", "chat"))[:30]
            prompt = str(body.get("prompt", ""))[:6000]
            context = body.get("context", {})
            if not prompt.strip():
                return self.send_json(400, {"error": "Prompt is required"})
            context_text = json.dumps(context, ensure_ascii=False)[:2500]
            system = ("You are Mindora AI, a supportive and careful learning tutor. Adapt explanations to the learner's education level, department, course, and selected subject. "
                      "For syllabus requests, produce a useful proposed study roadmap, but never claim it is an official or verified institutional syllabus. State assumptions and tell the learner to verify against their college or board's official syllabus. "
                      "For summaries, use headings, key concepts, examples, and revision questions where useful. Be accurate, encouraging, and clear. Do not fabricate citations or official course details.\n"
                      f"Learner context (user-provided; may be incomplete): {context_text}\nTask: {task}")
            payload = {"model": MODEL, "instructions": system, "input": prompt, "max_output_tokens": 1600}
            req = urllib.request.Request("https://api.openai.com/v1/responses", data=json.dumps(payload).encode("utf-8"), headers={"Authorization": f"Bearer {API_KEY}", "Content-Type": "application/json"}, method="POST")
            with urllib.request.urlopen(req, timeout=45) as response:
                result = json.loads(response.read().decode("utf-8"))
            chunks = []
            for item in result.get("output", []):
                if item.get("type") == "message":
                    for part in item.get("content", []):
                        if part.get("type") == "output_text": chunks.append(part.get("text", ""))
            text = "\n\n".join(x for x in chunks if x).strip()
            if not text:
                return self.send_json(502, {"error": "The AI returned no text. Please try again."})
            self.send_json(200, {"text": text, "model": MODEL})
        except urllib.error.HTTPError as exc:
            detail = exc.read().decode("utf-8", "replace")[:1000]
            self.send_json(502, {"error": f"AI provider returned HTTP {exc.code}", "detail": detail})
        except Exception as exc:
            self.send_json(500, {"error": "Could not generate a response", "detail": str(exc)[:500]})

if __name__ == "__main__":
    print("MINDORA AI running at http://127.0.0.1:8000")
    print("Live AI: configured" if API_KEY else "Live AI: NOT configured (set OPENAI_API_KEY to enable)")
    ThreadingHTTPServer(("127.0.0.1", 8000), Handler).serve_forever()
