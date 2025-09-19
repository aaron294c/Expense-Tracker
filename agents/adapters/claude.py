import os
import json
import requests

class ClaudeWorker:
    def __init__(self, debug: bool = False):
        self.debug = debug
        self.api_key = os.getenv("ANTHROPIC_API_KEY")
        if not self.api_key:
            raise ValueError("ANTHROPIC_API_KEY environment variable is required")
        
        self.model = "claude-sonnet-4-20250514"
        self.base_url = "https://api.anthropic.com/v1/messages"
        self.system_prompt = self._get_system_prompt()
    
    def _get_system_prompt(self) -> str:
        return """You are a Senior Full-Stack Engineer working in a Supabase + Next.js monorepo inside GitHub Codespaces. You are an autonomous coding agent that must:

**Core Responsibilities:**
1. Propose a step-by-step plan for the given task
2. Make small, safe code diffs that are reviewable
3. Prefer SQL-first changes via /supabase/migrations/ with clear, idempotent SQL
4. Keep commits atomic and run lint, typecheck, tests after edits
5. Update documentation when API or schema changes
6. Stop when the PR is ready or when blocked by failing constraints

**Required Output Format:**
You MUST end every response with a valid Control Protocol JSON object.

**Control Protocol Schema:**
```json
{
  "decision": "PLAN|EDIT|EXECUTE|TEST|MIGRATE|DOCS|PR|STOP|RETRY",
  "reason": "short rationale for this decision",
  "commands": [
    {"run": "command to execute"},
    {"write": {"path": "file/path.ext", "patch": "diff content or full file"}}
  ],
  "commit": {"message": "feat(x): description", "files": ["changed/files"]},
  "pr": {"title": "PR title", "body": "PR description"},
  "next_hint": "what to focus on next turn"
}
```

**Safety Rules:**
1. Never edit .env files, .git/, .github/workflows/, package-lock.json
2. Keep individual changes small (< 500 lines changed per turn)
3. Run tests after code changes
4. Create migrations for all schema changes
5. Use conventional commit format (feat/fix/refactor/chore/test/docs)

Remember: You must provide valid JSON at the end of EVERY response for the orchestrator to function properly."""

    def generate(self, context: str, turn: int) -> str:
        prompt = self._build_prompt(context, turn)
        
        if self.debug:
            print(f"🔮 Calling Claude API (turn {turn})...")
        
        try:
            response = self._call_api(prompt)
            if self.debug:
                print(f"✅ Claude API response received")
            return response
        except Exception as e:
            error_msg = f"API call failed: {str(e)}"
            if self.debug:
                print(f"❌ {error_msg}")
            
            return f"""I encountered an error calling the API: {error_msg}

I'll stop here to avoid further issues.

{{"decision": "STOP", "reason": "API error - {error_msg}", "commands": [], "next_hint": "Check API credentials and network"}}"""
    
    def _build_prompt(self, context: str, turn: int) -> str:
        return f"""# Turn {turn}

## Current Context
{context}

## Instructions
Based on the context above, determine your next action and provide a detailed response followed by the required Control Protocol JSON.

Remember:
- Make one focused change per turn
- Run tests after code changes
- Create migrations for schema changes
- Keep commits small and atomic
- End with valid Control Protocol JSON

Analyze the situation and proceed with your next action:"""
    
    def _call_api(self, prompt: str) -> str:
        headers = {
            "Content-Type": "application/json",
            "x-api-key": self.api_key,
            "anthropic-version": "2023-06-01"
        }
        
        payload = {
            "model": self.model,
            "max_tokens": 4000,
            "system": self.system_prompt,
            "messages": [{"role": "user", "content": prompt}]
        }
        
        response = requests.post(self.base_url, headers=headers, json=payload, timeout=120)
        
        if response.status_code != 200:
            raise Exception(f"API returned {response.status_code}: {response.text}")
        
        response_data = response.json()
        
        if "content" not in response_data or not response_data["content"]:
            raise Exception("No content in API response")
        
        return response_data["content"][0]["text"]
