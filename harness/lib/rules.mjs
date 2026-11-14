// Path and command rules for agent sessions, used by the PreToolUse hook (harness/hooks/guard.mjs).
// The driver sets TMTS_ROLE / TMTS_EPIC / TMTS_TURN in each agent's environment.

import path from 'node:path';
import { ROOT, pad, approvalGate, git } from './comms.mjs';

const OWNER_ONLY = ['planning/ui-requirements.md', 'CLAUDE.md', 'README.md', 'harness/', '.claude/'];

function toRel(p) {
  return path.relative(ROOT, path.resolve(ROOT, p)).split(path.sep).join('/');
}

const startsWithAny = (rel, prefixes) => prefixes.some((p) => (p.endsWith('/') ? rel.startsWith(p) : rel === p));

/** Returns an error message if a role may not write this path, else null. */
export function checkWrite(filePath, env = process.env) {
  const rel = toRel(filePath);
  if (rel.startsWith('..')) return null; // outside the repo (scratch space): not restricted here

  const base = path.basename(rel);
  if (/^readme/i.test(base) && rel !== 'README.md') {
    return `Blocked: ${rel}. The repository has one README, at the root (CLAUDE.md, Documentation). Put the content in the matching section of README.md instead.`;
  }

  const role = env.TMTS_ROLE;
  if (!role) return null;
  const epic = env.TMTS_EPIC;
  const turn = Number(env.TMTS_TURN || 0);
  const turnPath = `comms/${epic}/turn-${pad(turn)}/`;

  if (startsWithAny(rel, OWNER_ONLY)) return `Blocked: ${rel} is owned by the owner. Do not edit it; propose the change in your report.`;

  if (role === 'epic-coder') {
    if (rel === `${turnPath}coder.md`) return null;
    if (rel.startsWith('planning/') || rel.startsWith('comms/') || rel.startsWith('.driver-logs/')) {
      return `Blocked: the coding agent may not edit ${rel}. Write only ${turnPath}coder.md under comms/, and never edit planning/.`;
    }
    return null;
  }
  if (role === 'plan-reviewer' || role === 'ui-reviewer') {
    if (rel.startsWith(turnPath)) return null;
    return `Blocked: reviewers may write only inside ${turnPath} (tried ${rel}). Report source problems as findings; do not fix them.`;
  }
  if (role === 'epic-summarizer') {
    if (rel === `comms/${epic}/SUMMARY.md`) return null;
    return `Blocked: the summarizer may write only comms/${epic}/SUMMARY.md (tried ${rel}).`;
  }
  return null;
}

const AGENT_GIT_BLOCKED = /\bgit\s+(push|merge|rebase|reset|switch|checkout|stash|clean|branch\s+-)/;
const REVIEWER_GIT_BLOCKED = /\bgit\s+(add|commit)\b/;

/**
 * The command with heredoc bodies and quoted text removed, so that words inside a commit message or an
 * echo (such as the name of a git subcommand) are not mistaken for commands. Approximate by design: it
 * errs towards allowing, and the driver's check of the working tree catches what slips through.
 */
export function commandSkeleton(command) {
  return command
    .replace(/<<-?\s*(['"]?)(\w+)\1[^\n]*\n[\s\S]*?\n\s*\2\b/g, '')
    .replace(/'[^']*'/g, "''")
    .replace(/"(?:[^"\\]|\\.)*"/g, '""');
}

function currentBranch(env) {
  if (env.TMTS_TEST_BRANCH) return env.TMTS_TEST_BRANCH; // lets tests avoid a real repository
  return git(['rev-parse', '--abbrev-ref', 'HEAD']).out;
}

/** Returns an error message if the shell command is not allowed, else null. */
export function checkBash(command, env = process.env) {
  const cmd = commandSkeleton(command);
  if (/\bgit\s+push\b/.test(cmd)) return 'Blocked: nothing in this project is pushed. Pushing is for the owner.';

  if (/\bgit\s+merge\b/.test(cmd) && currentBranch(env) === 'main') {
    // Only a merge into main is gated. Look in the original command (the branch may be quoted) but not in the message.
    const withoutMessage = command.replace(/\s(?:-m|--message)(?:=|\s+)(?:"[^"]*"|'[^']*'|\S+)/g, '');
    const m = /epic\/(E\d{2})/.exec(withoutMessage);
    if (m) {
      const gate = approvalGate(m[1]);
      if (!gate.ok) return `Blocked: ${m[1]} may not be merged until both reviews approve.\n- ${gate.errors.join('\n- ')}`;
    }
  }

  const role = env.TMTS_ROLE;
  if (role) {
    if (AGENT_GIT_BLOCKED.test(cmd)) return 'Blocked: agents do not switch, merge, reset or otherwise manage branches. The driver does that.';
    if ((role === 'plan-reviewer' || role === 'ui-reviewer' || role === 'epic-summarizer') && REVIEWER_GIT_BLOCKED.test(cmd)) {
      return 'Blocked: this role writes its file and does not commit. The driver commits.';
    }
  }
  return null;
}
