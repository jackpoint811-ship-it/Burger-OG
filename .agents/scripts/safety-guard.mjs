#!/usr/bin/env node

/**
 * Burgers.exe Antigravity Safety Guard Hook (PreToolUse)
 * Enforces hard constraints defined in AGENTS.md and GEMINI.md:
 * - No push or merge to main
 * - No git reset --hard
 * - No git add . / git add -A
 * - No destructive root deletions
 */

import { readFileSync } from 'node:fs';

function main() {
  let inputRaw = '';
  try {
    inputRaw = readFileSync(0, 'utf-8');
  } catch {
    console.log(JSON.stringify({ decision: 'allow' }));
    return;
  }

  if (!inputRaw || inputRaw.trim() === '') {
    console.log(JSON.stringify({ decision: 'allow' }));
    return;
  }

  let payload;
  try {
    payload = JSON.parse(inputRaw);
  } catch {
    console.log(JSON.stringify({ decision: 'allow' }));
    return;
  }

  const toolCall = payload.toolCall;
  if (!toolCall) {
    console.log(JSON.stringify({ decision: 'allow' }));
    return;
  }

  const name = toolCall.name || '';
  const args = toolCall.args || {};

  if (name === 'run_command' && typeof args.CommandLine === 'string') {
    const cmd = args.CommandLine.trim();

    // 1. Prohibit push or direct merge to main (only when git is the invoked executable)
    if (
      /(?:^|[;&|]\s*)git\s+push\b.*?\bmain(?:\s+|$|[;&|])/i.test(cmd) ||
      /(?:^|[;&|]\s*)git\s+merge\b.*?\bmain(?:\s+|$|[;&|])/i.test(cmd)
    ) {
      console.log(
        JSON.stringify({
          decision: 'deny',
          reason:
            '🛑 [AGENTS.md Violation] Direct push or merge to main is strictly prohibited. Use preview or v3 branches.',
        })
      );
      return;
    }

    // 2. Prohibit git reset --hard
    if (/(?:^|[;&|]\s*)git\s+reset\s+--hard(?:\s+|$|[;&|])/i.test(cmd)) {
      console.log(
        JSON.stringify({
          decision: 'deny',
          reason:
            '🛑 [AGENTS.md Violation] `git reset --hard` is strictly forbidden to prevent accidental work loss.',
        })
      );
      return;
    }

    // 3. Prohibit git add . / git add -A / git add --all
    if (
      /(?:^|[;&|]\s*)git\s+add\s+(?:\.|\-A|\-\-all)(?:\s+|$|[;&|])/i.test(cmd)
    ) {
      console.log(
        JSON.stringify({
          decision: 'deny',
          reason:
            '🛑 [AGENTS.md Violation] `git add .` / `git add -A` is prohibited. Add files explicitly and surgically.',
        })
      );
      return;
    }

    // 4. Prohibit catastrophic root, cwd, or home deletion
    if (
      /(?:^|[;&|]\s*)rm\s+(?:-[a-zA-Z]*r[a-zA-Z]*f[a-zA-Z]*|-[a-zA-Z]*f[a-zA-Z]*r[a-zA-Z]*)\s+(?:\/|\.\/?|\~|\/\*)(?:\s+|$|[;&|])/i.test(
        cmd
      )
    ) {
      console.log(
        JSON.stringify({
          decision: 'deny',
          reason:
            '🛑 [Security Violation] Dangerous recursive deletion of root (/), current directory (.), or home (~) detected and blocked.',
        })
      );
      return;
    }
  }

  // Allow all other safe commands
  console.log(JSON.stringify({ decision: 'allow' }));
}

main();
