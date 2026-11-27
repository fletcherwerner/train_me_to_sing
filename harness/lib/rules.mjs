// Path and command rules for agent sessions, used by the PreToolUse hook (harness/hooks/guard.mjs).
// The driver sets TMTS_ROLE / TMTS_EPIC / TMTS_TURN in each agent's environment.

import path from 'node:path';
import { ROOT, pad, approvalGate, git } from './comms.mjs';
import { scan, formatFindings, SCAN_HELP } from './scan.mjs';

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

const IMAGE_FILE = /\.(png|jpe?g|gif|webp|bmp|pdf)$/i;

/**
 * Returns an error message if this read would put an image in the conversation and the model cannot take one
 * (profile env TMTS_NO_IMAGES=1; the local server is text-only and fails every later request once an image is in).
 */
export function checkRead(filePath, env = process.env) {
  if (env.TMTS_NO_IMAGES !== '1' || !IMAGE_FILE.test(filePath)) return null;
  return `Blocked: this model cannot view images (${toRel(filePath)}). Do not open screenshots. Check the screen by text instead: in a Playwright script print page.locator(...).innerText(), the accessibility tree (page.accessibility.snapshot()), computed styles such as font-size and bounding boxes. List what you could not judge visually under "Not verified".`;
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

// Read-only commands Claude Code allows on its own; listed here so they may appear in a chain.
const READ_ONLY = ['cat', 'ls', 'head', 'tail', 'grep', 'wc', 'echo', 'pwd', 'sort', 'uniq', 'diff', 'true', 'test', 'find', 'sed', 'git rev-parse'];

const matchesPrefix = (segment, prefix) => segment === prefix || segment.startsWith(prefix + ' ') || (prefix.endsWith('/') && segment.startsWith(prefix));
const settingsPrefixes = (rules) => rules.map((r) => /^Bash\((.*?)(?::\*)?\)$/.exec(r)?.[1]).filter(Boolean);

/**
 * True if an agent's chained command (`cd <repo>; a && b | c`) may run without asking: every part must be a
 * command the agent could run on its own (the settings allow list or READ_ONLY), none may match the deny list,
 * and every file it redirects output to must pass checkWrite. The local model chains commands like this, and
 * headless permission matching refuses the whole line. Anything unclear (substitution, a cd elsewhere, a quoted
 * redirect target) returns false and is left to the normal permission check.
 */
export function allowBash(command, { allow = [], deny = [] } = {}, env = process.env) {
  if (!env.TMTS_ROLE || checkBash(command, env)) return false;
  const cmd = commandSkeleton(command);
  if (/\$\(|`|<\(|>\(/.test(cmd)) return false;
  const allowed = [...settingsPrefixes(allow), ...READ_ONLY];
  const denied = settingsPrefixes(deny);
  for (let segment of cmd.split(/&&|\|\||;|\||\n/)) {
    segment = segment.trim().replace(/^\(+\s*/, '').replace(/\s*\)+$/, '').trim();
    if (!segment) continue;
    if (/^cd(\s|$)/.test(segment)) {
      const dir = segment.slice(2).trim();
      if (dir && dir !== '.' && path.resolve(ROOT, dir) !== ROOT) return false;
      continue;
    }
    for (const m of segment.matchAll(/(\d*)(&?>>?)(?!&)\s*(\S*)/g)) {
      const target = m[3];
      if (!target || target === "''" || target === '""') return false;
      if (checkWrite(target, env)) return false;
    }
    const bare = segment.replace(/\d*&?>>?\s*\S*/g, '').replace(/\d*>&\d+/g, '').replace(/\s+/g, ' ').trim();
    if (/^sed\b.*\s-i/.test(bare) || /^find\b.*\s-(exec|execdir|delete|ok)\b/.test(bare)) return false;
    if (denied.some((p) => matchesPrefix(bare, p))) return false;
    if (!allowed.some((p) => matchesPrefix(bare, p))) return false;
  }
  return true;
}

/** Returns an error message if the shell command is not allowed, else null. */
export function checkBash(command, env = process.env, scanFn = scan) {
  const cmd = commandSkeleton(command);
  if (/\bgit\s+push\b/.test(cmd)) return 'Blocked: nothing in this project is pushed. Pushing is for the owner.';

  // Only a merge into main is gated. Each command in a chain (&&, ;, |, newline) is looked at on its own, using the
  // original text (the branch may be quoted) without the -m message. A switch earlier in the chain changes the target.
  let branch = currentBranch(env);
  for (const segment of command.split(/&&|\|\||;|\||\n/)) {
    if (/\bgit\s+(switch|checkout)\b/.test(commandSkeleton(segment))) {
      branch = /\bgit\s+(?:switch|checkout)\s+(?:-\S+\s+)*(\S+)/.exec(segment)?.[1]?.replace(/["']/g, '') || '';
      continue;
    }
    if (!/\bgit\s+merge\b/.test(commandSkeleton(segment)) || branch !== 'main') continue;
    const m = /epic\/([ES]\d{2})/.exec(segment.replace(/\s(?:-m|--message)(?:=|\s+)(?:"[^"]*"|'[^']*'|\S+)/g, ''));
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

  // PII and security scan before any commit, in every session. A line that also stages (`git add ... && git commit`,
  // `git commit -a`) is scanned over everything not yet committed, because the hook runs before the add.
  if (/\bgit\s+(?:-C\s+\S+\s+)?commit\b/.test(cmd) && !/\s--dry-run\b/.test(cmd)) {
    const stages = /\bgit\s+(?:-C\s+\S+\s+)?add\b/.test(cmd) || /\bcommit\s+(?:[^|;&]*\s)?(?:-[a-zA-Z]*a[a-zA-Z]*|--all)\b/.test(cmd);
    const findings = scanFn(stages ? { uncommitted: true } : { staged: true });
    if (findings.length) {
      return `Blocked: the PII and security scan found ${findings.length} problem${findings.length === 1 ? '' : 's'} in what this commit would add. Nothing was committed.\n${formatFindings(findings)}\n\n${SCAN_HELP}`;
    }
  }
  return null;
}
