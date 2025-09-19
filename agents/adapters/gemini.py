import os
import json
import requests

class GeminiWorker:
    def __init__(self, debug: bool = False):
        self.debug = debug
        self.api_key = os.getenv("GOOGLE_API_KEY")
        if not self.api_key:
            raise ValueError("GOOGLE_API_KEY environment variable is required")
        
        self.model = "gemini-1.5-flash"
        self.base_url = f"https://generativelanguage.googleapis.com/v1beta/models/{self.model}:generateContent"
        self.system_prompt = """You are a Senior Full-Stack Engineer working in a Supabase + Next.js monorepo inside GitHub Codespaces. You are an autonomous coding agent.

You MUST end every response with valid JSON:
{
  "decision": "PLAN|EDIT|EXECUTE|TEST|MIGRATE|DOCS|PR|STOP|RETRY",
  "reason": "short rationale",
  "commands": [{"run": "command"}, {"write": {"path": "file.ts", "patch": "content"}}],
  "commit": {"message": "feat: description", "files": ["changed/files"]},
  "next_hint": "what to do next"
}

Safety Rules:
- Never edit .env, .git/, package-lock files
- Keep changes small (< 500 lines)
- Run tests after changes
- Use conventional commits"""

    def generate(self, context: str, turn: int) -> str:
        prompt = f"""# Turn {turn}

## Context
{context}

## Instructions  
{self.system_prompt}

Analyze and provide your next action with required JSON at the end:"""
        
        if self.debug:
            print(f"🔮 Calling Gemini API (turn {turn})...")
        
        try:
            response = self._call_api(prompt)
            if self.debug:
                print(f"✅ Gemini API response received")
            return response
        except Exception as e:
            return f"""Error calling Gemini API: {str(e)}

{{"decision": "STOP", "reason": "API error - {str(e)}", "commands": [], "next_hint": "Check API key and network"}}"""
    
    def _call_api(self, prompt: str) -> str:
        url = f"{self.base_url}?key={self.api_key}"
        
        payload = {
            "contents": [{"parts": [{"text": prompt}]}],
            "generationConfig": {
                "temperature": 0.7,
                "maxOutputTokens": 4096
            }
        }
        
        headers = {"Content-Type": "application/json"}
        response = requests.post(url, json=payload, headers=headers, timeout=120)
        
        if response.status_code != 200:
            raise Exception(f"API returned {response.status_code}: {response.text}")
        
        data = response.json()
        
        if "candidates" not in data or not data["candidates"]:
            raise Exception("No candidates in API response")
            
        candidate = data["candidates"][0]
        if "content" not in candidate or "parts" not in candidate["content"]:
            raise Exception("Invalid response format from Gemini")
        
        return candidate["content"]["parts"][0]["text"]
