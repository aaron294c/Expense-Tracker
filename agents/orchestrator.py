import json
from pathlib import Path
from typing import Dict, List, Any, Optional
from datetime import datetime, timedelta
import re

from adapters.claude import ClaudeWorker
from skills.repo_io import RepoInterface
from skills.executor import Executor
from skills.supabase import SupabaseHelper
from skills.gitops import GitOps


class AgentOrchestrator:
    """
    Orchestrator with a planning phase for abstract prompts.

    Key behaviors:
    - Injects a universal control-protocol preamble so the model replies with JSON decisions.
    - Supports PLAN → EDIT/EXECUTE/TEST → COMMIT/PR → STOP loops.
    - Retries transient 503/UNAVAILABLE provider errors.
    - Synthesizes trivial "Create <file> with content '...'" if the model forgets.
    - Normalizes paths and prevents git pathspec failures.
    """

    # --- Universal control protocol preamble (forces JSON) ---
    _PROTOCOL_PREAMBLE = """You are an autonomous coding agent. Use this control protocol and reply ONLY with JSON:

{
  "decision": "PLAN | EDIT | EXECUTE | TEST | MIGRATE | DOCS | PR | STOP | RETRY",
  "plan": ["optional, short step bullets for PLAN"],
  "commands": [
    { "write": { "path": "<repo-relative path>", "content": "<new file text OR full replacement>", "patch": "<optional instead of content>" } },
    { "run": "<npm|yarn|pnpm|supabase|eslint|tsc|pytest|vitest|jest command>" }
  ],
  "commit": {"message":"<concise>", "files":["<paths you modified>"]},
  "pr": {"title":"<title>", "body":"<markdown body>"}
}

Rules:
1) Start with "decision":"PLAN" when the task is abstract. Keep plan 1–5 bullets.
2) Then emit EDIT/EXECUTE/TEST decisions, and finally PR or STOP.
3) Always fill commit.files with exact repo-relative paths you changed (no leading './' or repo name).
4) If upstream service is overloaded, reply {"decision":"RETRY"}.
5) Keep JSON minimal; do not include logs/output text inside JSON.
"""

    def __init__(self, run_id: str, max_turns: int = 30, max_minutes: int = 45, debug: bool = False):
        self.run_id = run_id
        self.max_turns = max_turns
        self.max_minutes = max_minutes
        self.debug = debug
        self.start_time = datetime.now()

        self.claude_worker = ClaudeWorker(debug=debug)
        self.repo = RepoInterface()
        self.executor = Executor()
        self.supabase = SupabaseHelper()
        self.git = GitOps()

        self.turn_count = 0
        self.context_history: List[str] = []
        self.last_diffs: List[str] = []
        self.stuck_count = 0
        self.progress_made = False  # flips True when any edit/commit/exec succeeds

        # Ensure runs directory exists
        runs_dir = Path("runs")
        runs_dir.mkdir(parents=True, exist_ok=True)
        self.log_file = runs_dir / f"{run_id}.jsonl"
        self.log({"type": "start", "run_id": run_id, "timestamp": self.start_time.isoformat()})

        # Cache repo name for path normalization
        self._repo_name = Path(".").resolve().name

    def log(self, data: Dict[str, Any]):
        with open(self.log_file, "a") as f:
            f.write(json.dumps(data) + "\n")

    # -------------------- Main loop --------------------

    def execute_task(self, task_description: str) -> Dict[str, Any]:
        # Seed context with repository summary + protocol preamble + explicit task
        initial_context = self._build_initial_context(task_description)
        self.context_history.append(initial_context)

        try:
            for turn in range(self.max_turns):
                self.turn_count = turn + 1

                if self._check_time_budget():
                    return {"success": False, "reason": "Time budget exceeded"}

                self.log({"type": "turn_start", "turn": self.turn_count})
                if self.debug:
                    print(f"🔄 Turn {self.turn_count}/{self.max_turns}")

                worker_output = self.claude_worker.generate(
                    context="\n\n".join(self.context_history),
                    turn=self.turn_count
                )
                self.log({"type": "worker_output", "turn": self.turn_count, "output": worker_output})

                control_data = self._parse_control_protocol(worker_output)
                self.log({"type": "control_decision", "turn": self.turn_count, "control": control_data})

                # Transient upstream errors -> retry this loop turn
                if control_data.get("decision") == "RETRY":
                    if self.debug:
                        print("⏳ Upstream model unavailable; retrying this turn.")
                    continue

                # Handle PLAN explicitly: record plan into context and continue loop
                if control_data.get("decision") == "PLAN":
                    plan = control_data.get("plan") or []
                    plan_text = "\n".join(f"- {p}" for p in plan) if isinstance(plan, list) else str(plan)
                    self.context_history.append(f"## Agent PLAN (turn {self.turn_count})\n{plan_text}")
                    # Encourage next step:
                    self.context_history.append(
                        "## System Hint\nProceed to EDIT/EXECUTE/TEST decisions with concrete file paths and commands."
                    )
                    continue  # move to next iteration to request actionable steps

                # Execute other decisions
                result = self._execute_decision(control_data)
                self._update_task_state(control_data.get("decision", ""), control_data.get("commands", []))

                # If no progress this turn and the task matches a simple "Create <file> with content '...'",
                # synthesize the write+commit immediately (not just on STOP).
                if not self.progress_made:
                    synth = self._maybe_synthesize_simple_create(task_description, worker_output)
                    if synth:
                        if self.debug:
                            print(f"🧩 Synthesizing simple create now: {synth}")
                        edit_res = self._handle_edit_commands(synth["commands"])
                        if edit_res.get("files_created"):
                            self.progress_made = True
                        commit_res = {}
                        if synth.get("commit"):
                            commit_res = self._handle_commit(synth["commit"])
                            if commit_res.get("success"):
                                self.progress_made = True
                        if self.progress_made:
                            return {"success": True, "reason": "Task completed via synthesized create"}
                        self.context_history.append(self._format_result_context({**edit_res, **commit_res}))

                # Normal end conditions
                if control_data.get("decision") == "STOP":
                    return {
                        "success": bool(self.progress_made),
                        "reason": control_data.get("reason", "Stopped"),
                    }

                if control_data.get("decision") == "PR" and result.get("success"):
                    return {"success": True, "reason": "PR created", "pr_url": result.get("pr_url")}

                if result:
                    self.context_history.append(self._format_result_context(result))

                if self._is_stuck():
                    if self.stuck_count >= 2:
                        return {"success": False, "reason": "Agent stuck - no progress for 2 turns"}
                    self.stuck_count += 1
                else:
                    self.stuck_count = 0

                if len(self.context_history) > 10:
                    self.context_history = self.context_history[-8:]

            # Before giving up on max turns, try one last synthesis
            if not self.progress_made:
                last_try = self._maybe_synthesize_simple_create(
                    self.context_history[0] if self.context_history else "",
                    "\n".join(self.context_history[-2:]) if self.context_history else ""
                )
                if last_try:
                    if self.debug:
                        print("🧪 Final attempt: synthesizing create before exit.")
                    edit_res = self._handle_edit_commands(last_try["commands"])
                    if edit_res.get("files_created"):
                        self.progress_made = True
                    commit_res = {}
                    if last_try.get("commit"):
                        commit_res = self._handle_commit(last_try["commit"])
                        if commit_res.get("success"):
                            self.progress_made = True
                    if self.progress_made:
                        return {"success": True, "reason": "Task completed via final synthesized create"}

            return {"success": False, "reason": f"Max turns ({self.max_turns}) exceeded"}

        except Exception as e:
            self.log({"type": "error", "error": str(e)})
            if self.debug:
                import traceback
                traceback.print_exc()
            return {"success": False, "reason": f"Exception: {str(e)}"}

    # -------------------- Context & parsing --------------------

    def _build_initial_context(self, task_description: str) -> str:
        parts = [
            "# Control Protocol",
            self._PROTOCOL_PREAMBLE.strip(),
            "",
            "# Task",
            task_description.strip(),
            "",
            "## Repository Structure",
        ]
        try:
            structure = self.repo.get_repo_structure()
            parts.append(structure)
        except Exception as e:
            parts.append(f"Error reading repo structure: {e}")

        key_files = ["README.md", "package.json", "AGENTS.md", "supabase/config.toml"]
        for fp in key_files:
            try:
                content = self.repo.read_file(fp)
                if content:
                    parts.extend([f"## {fp}", "```", content[:2000] + ("..." if len(content) > 2000 else ""), "```", ""])
            except Exception:
                continue
        return "\n".join(parts)

    def _parse_control_protocol(self, worker_output: str) -> Optional[Dict[str, Any]]:
        """Parse and validate control protocol JSON with better error handling."""

        # Handle common transient provider error text as RETRY
        if ("model is overloaded" in worker_output) or (" 503" in worker_output) or ("UNAVAILABLE" in worker_output):
            return {"decision": "RETRY", "reason": "Upstream 503/overloaded"}

        json_patterns = [
            r'\{[^{}]*"decision"[^{}]*\}',
            r'\{.*?"decision".*?\}',
            r'```json\s*(\{.*?\})\s*```',
            r'```\s*(\{.*?\})\s*```'
        ]
        for pattern in json_patterns:
            matches = re.findall(pattern, worker_output, re.DOTALL)
            if matches:
                for m in matches:
                    try:
                        s = m.strip()
                        if s.startswith("```"):
                            s = re.sub(r"```.*?\n", "", s)
                            s = re.sub(r"```.*?$", "", s)
                        data = self._extract_json_from_response(s)
                        if "decision" in data and data["decision"] in {
                            "PLAN", "EDIT", "EXECUTE", "TEST", "MIGRATE", "DOCS", "PR", "STOP", "RETRY"
                        }:
                            return data
                    except json.JSONDecodeError:
                        continue

        if self.debug:
            print(f"⚠️  No valid JSON found. Response preview: {worker_output[:200]}...")

        # Last resort fallback - only if absolutely no JSON found
        if self.debug:
            print(f"⚠️  No valid JSON found. Using minimal fallback...")
            print(f"Response preview: {worker_output[:300]}...")
        
        # Default to PLAN to let Claude try again
        return {
            "decision": "PLAN",
            "plan": ["Continue with the requested task", "Try to provide clearer JSON format"],
            "commands": [],
            "commit": {"message": "Auto-generated", "files": []},
            "pr": {"title": "Auto-generated", "body": ""},
            "reason": "Fallback - no valid JSON found"
        }

    # -------------------- Decision executor --------------------

    def _execute_decision(self, control_data: Dict[str, Any]) -> Dict[str, Any]:
        decision = control_data.get("decision")
        commands = control_data.get("commands", [])
        if self.debug:
            print(f"🐛 DEBUG: _execute_decision called with decision='{decision}', {len(commands)} commands")
        result: Dict[str, Any] = {"decision": decision, "outputs": []}

        try:
            if decision in ["EDIT", "MIGRATE"]:
                edit_res = self._handle_edit_commands(commands)
                result.update(edit_res)
                if edit_res.get("files_created"):
                    self.progress_made = True

            if decision in ["EXECUTE", "TEST", "MIGRATE"]:
                exec_res = self._handle_execute_commands(commands)
                result.update(exec_res)
                if any(r.get("success") for r in exec_res.get("results", [])):
                    self.progress_made = True

            if decision == "PR":
                pr_res = self._handle_pr_creation(control_data)
                result.update(pr_res)
                if pr_res.get("success"):
                    self.progress_made = True

            commit_data = control_data.get("commit")
            if commit_data:
                commit_res = self._handle_commit(commit_data)
                result.update(commit_res)
                if commit_res.get("success"):
                    self.progress_made = True

        except Exception as e:
            result.update({"success": False, "error": str(e)})

        return result

    # -------------------- Path utilities & synthesis --------------------

    def _normalize_path(self, file_path: str) -> str:
        """Normalize 'RepoName/file' or './file' to repo-relative."""
        if not file_path:
            return file_path
        p = str(file_path).strip().lstrip("./")
        parts = Path(p).parts
        if parts and parts[0] == self._repo_name:
            p = str(Path(*parts[1:])) if len(parts) > 1 else ""
        return str(Path(p))

    def _maybe_synthesize_simple_create(self, task_description: str, worker_output: str) -> Optional[Dict[str, Any]]:
        """If task is 'Create FOO with content \"BAR\"', synthesize write+commit."""
        text = f"{task_description}\n\n{worker_output}"
        m = re.search(
            r"create\s+(\S+)\s+with\s+content\s+['\"](.+?)['\"]",
            text,
            flags=re.IGNORECASE | re.DOTALL,
        )
        if not m:
            return None
        raw_path, content = m.group(1), m.group(2)
        path = self._normalize_path(raw_path)
        return {
            "decision": "EDIT",
            "commands": [{"write": {"path": path, "content": content}}],
            "commit": {"message": f"Add {path} via synthesized create", "files": [path]},
        }

    # -------------------- Handlers --------------------

    def _handle_edit_commands(self, commands: List[Dict[str, Any]]) -> Dict[str, Any]:
        results = []
        for cmd in commands:
            if "write" in cmd:
                write = cmd["write"]
                raw_path = write["path"]
                path = self._normalize_path(raw_path)

                if self.debug:
                    print(f"📝 Writing to: {path} (raw: {raw_path})")

                if not self._is_safe_path(path):
                    results.append({"command": cmd, "success": False, "error": f"Unsafe path: {path}"})
                    continue

                try:
                    Path(path).parent.mkdir(parents=True, exist_ok=True)
                    content = write.get("patch") or write.get("content") or "// Auto-generated by agent"
                    write_result = self.repo.write_file(path, content)
                    if self.debug:
                        print(f"✅ File written: {write_result}")
                    results.append({"command": cmd, "success": True, "result": write_result, "file_created": True, "path": path})
                except Exception as e:
                    if self.debug:
                        print(f"❌ File write error: {e}")
                    results.append({"command": cmd, "success": False, "error": str(e), "path": path})
        return {"success": True, "results": results, "files_created": len([r for r in results if r.get("success")])}

    def _handle_execute_commands(self, commands: List[Dict[str, Any]]) -> Dict[str, Any]:
        if self.debug:
            print(f"🐛 DEBUG: _handle_execute_commands called with {len(commands)} commands")
            for i, cmd in enumerate(commands):
                print(f"🐛 DEBUG: Command {i}: {cmd}")
        results = []
        for cmd in commands:
            if self.debug:
                print(f"🐛 DEBUG: Processing command: {cmd}")
            if "run" in cmd:
                command = cmd["run"]
                if self.debug:
                    print(f"🐛 DEBUG: Extracted command string: '{command}'")
                is_allowed = self._is_allowed_command(command)
                if self.debug:
                    print(f"🐛 DEBUG: _is_allowed_command('{command}') returned: {is_allowed}")
                if is_allowed:
                    if self.debug:
                        print(f"🐛 DEBUG: About to call self.executor.run_command('{command}')")
                    try:
                        exec_result = self.executor.run_command(command)
                        if self.debug:
                            print(f"🐛 DEBUG: executor.run_command returned: {exec_result}")
                        results.append({
                            "command": command,
                            "success": exec_result["returncode"] == 0,
                            "stdout": exec_result["stdout"],
                            "stderr": exec_result["stderr"],
                            "returncode": exec_result["returncode"]
                        })
                    except Exception as e:
                        if self.debug:
                            print(f"🐛 DEBUG: Exception calling executor: {e}")
                        results.append({"command": command, "success": False, "error": str(e)})
                else:
                    if self.debug:
                        print(f"🐛 DEBUG: Command rejected by orchestrator validation")
                    results.append({"command": command, "success": False, "error": f"Command not allowed: {command}"})
            else:
                if self.debug:
                    print(f"🐛 DEBUG: Command missing 'run' key: {cmd}")
        if self.debug:
            print(f"🐛 DEBUG: _handle_execute_commands returning {len(results)} results")
        return {"success": True, "results": results}

    def _handle_pr_creation(self, control_data: Dict[str, Any]) -> Dict[str, Any]:
        try:
            pr = control_data.get("pr", {})
            title = pr.get("title", "Automated changes by agent")
            body = pr.get("body", "Changes made by autonomous coding agent")
            return self.git.create_pr(title, body)
        except Exception as e:
            return {"success": False, "error": f"PR creation failed: {str(e)}"}

    def _handle_commit(self, commit_data: Dict[str, Any]) -> Dict[str, Any]:
        try:
            message = commit_data.get("message", "Automated commit")
            files = commit_data.get("files", [])

            # Normalize and keep only files that actually exist to avoid 'pathspec' failures
            norm_existing = []
            for f in files:
                if not f:
                    continue
                p = self._normalize_path(f)
                if Path(p).exists():
                    norm_existing.append(p)

            # If nothing exists yet but GitOps supports commit_all, use it only when progress was made
            if not norm_existing:
                if hasattr(self.git, "commit_all") and self.progress_made:
                    return self.git.commit_all(message)
                return {"success": False, "error": "No valid files to commit"}

            return self.git.commit_changes(message, norm_existing)
        except Exception as e:
            return {"success": False, "error": f"Commit failed: {str(e)}"}

    # -------------------- Safety & helpers --------------------

    def _is_safe_path(self, file_path: str) -> bool:
        dangerous = [r"\.env", r"\.git/", r"\.github/workflows/", r"Dockerfile"]
        for pat in dangerous:
            if re.search(pat, file_path):
                return False
        try:
            resolved = Path(file_path).resolve()
            root = Path(".").resolve()
            return root in resolved.parents or resolved == root or resolved.parent == root
        except Exception:
            return False

    def _is_allowed_command(self, command: str) -> bool:
        allowed = [
            r"^npm\b.*", r"^yarn\b.*", r"^pnpm\b.*",
            r"^supabase\b.*", r"^eslint\b.*", r"^tsc\b.*",
            r"^pytest\b.*", r"^vitest\b.*", r"^jest\b.*",
            r"^ls\b.*", r"^cat\b.*", r"^head\b.*", r"^find\b.*",
            r"^pwd$", r"^tree\b.*", r"^wc\b.*", r"^grep\b.*"
        ]
        for pat in allowed:
            if re.match(pat, command):
                return True
        return False

    def _check_time_budget(self) -> bool:
        elapsed = datetime.now() - self.start_time
        return elapsed > timedelta(minutes=self.max_minutes)

    def _is_stuck(self, control_data: Dict[str, Any]) -> bool:
        current = str(control_data.get("commands", []))
        if len(self.last_diffs) >= 2 and self.last_diffs[-1] == self.last_diffs[-2] == current:
            return True
        self.last_diffs.append(current)
        if len(self.last_diffs) > 3:
            self.last_diffs.pop(0)
        return False

    def _format_result_context(self, result: Dict[str, Any]) -> str:
        parts = [f"## Execution Result - Turn {self.turn_count}"]
        parts.append("✅ Success" if result.get("success") else "❌ Failed")
        if result.get("error"):
            parts.append(f"Error: {result['error']}")
        if result.get("results"):
            for r in result["results"]:
                if r.get("stdout"):
                    parts.append(f"STDOUT: {r['stdout'][:500]}")
                if r.get("stderr"):
                    parts.append(f"STDERR: {r['stderr'][:500]}")
        return "\n".join(parts)

    def _extract_json_from_response(self, response_text: str) -> dict:
        """Extract JSON from Claude response, handling text before/after JSON."""
        import re
        import json
        
        # First try: Look for JSON in code blocks
        code_block_patterns = [
            r'```json\s*(.*?)\s*```',
            r'```\s*(.*?)\s*```'
        ]
        
        for pattern in code_block_patterns:
            matches = re.findall(pattern, response_text, re.DOTALL)
            for match in matches:
                try:
                    return json.loads(match.strip())
                except json.JSONDecodeError:
                    continue
        
        # Second try: Look for JSON object anywhere in text
        json_pattern = r'\{.*?\}'
        matches = re.findall(json_pattern, response_text, re.DOTALL)
        
        for match in matches:
            try:
                parsed = json.loads(match)
                if isinstance(parsed, dict) and 'decision' in parsed:
                    return parsed
            except json.JSONDecodeError:
                continue
        
        return None

    def _update_task_state(self, decision, commands):
        """Track task state and detect loops."""
        if not hasattr(self, 'task_state'):
            self.task_state = {
                'files_read': set(),
                'files_written': set(),
                'actions_taken': [],
                'last_decision': None,
                'consecutive_same_actions': 0
            }
        
        current_action = f"{decision}:{str(commands)}"
        if current_action == self.task_state['last_decision']:
            self.task_state['consecutive_same_actions'] += 1
        else:
            self.task_state['consecutive_same_actions'] = 0
        
        self.task_state['last_decision'] = current_action
        
        # Track file operations
        for cmd in commands:
            if 'run' in cmd and 'cat ' in cmd['run']:
                filename = cmd['run'].replace('cat ', '').strip()
                self.task_state['files_read'].add(filename)
            elif 'write' in cmd:
                self.task_state['files_written'].add(cmd['write']['path'])

    def _is_stuck(self) -> bool:
        """Check if agent is stuck in a loop."""
        if not hasattr(self, 'task_state'):
            return False
        return self.task_state['consecutive_same_actions'] >= 2
