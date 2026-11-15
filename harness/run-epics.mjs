#!/usr/bin/env node
// Runs the build-and-review loop. This script owns the loop: which epic and turn is next,
// when to stop, every state change, and every check on what the agents produced.
// The models only write code, reviews and the summary; each of those is validated here.
//
//   node harness/run-epics.mjs E03      run one epic, then stop
//   node harness/run-epics.mjs next     run the first epic that is not Approved, then stop
//   node harness/run-epics.mjs all      run epics in order until something needs the owner
//   --dry-run                           show what would run, change nothing
//   --local                             run every agent on the local model (profile harness/profiles/local.json)
//   --profile=<name>                    run every agent with harness/profiles/<name>.json
//
// Environment (all optional):
//   TMTS_MODEL             model for every agent (passed to `claude --model`)
//   TMTS_CLAUDE_BIN        the claude executable (default: claude)
//   TMTS_PERMISSION_MODE   default acceptEdits; unlisted commands are denied in headless runs
//   TMTS_MAX_TURNS         turn limit before asking the owner (default 10)
//   TMTS_AGENT_TIMEOUT_MIN minutes before an agent is killed (default 60)
//   TMTS_MAX_BUDGET_USD    spend limit per agent run
//   TMTS_SERIAL_REVIEWS=1  run the two reviewers one after the other
//
// Exit codes: 0 finished as asked, 2 stopped and needs the owner, 1 could not start.

import fs from 'node:fs';
import path from 'node:path';
import { spawn, spawnSync } from 'node:child_process';
import {
  ROOT, EPIC_RE, FILES, pad, rel, read, git, today, commsDir, turnDir, turnNumbers,
  lastRecordedTurn, validateCoder, validateReview, validateSummary, approvalGate, openAfterTurn,
  parseCoder, readStatus, readEpicTable, setStatusRow, setIndexRow, writeNeedsInput, writeForOwner,
} from './lib/comms.mjs';
import { loadProfile, checkReachable, checkModel, flushCache } from './lib/profile.mjs';

let TRAILER = 'Co-Authored-By: Claude <noreply@anthropic.com>';
let PROFILE = null; // set in main() from --local / --profile=<name>
const MAX_TURNS = Number(process.env.TMTS_MAX_TURNS || 10);
const TIMEOUT_MS = Number(process.env.TMTS_AGENT_TIMEOUT_MIN || 60) * 60_000;
const CLAUDE = process.env.TMTS_CLAUDE_BIN || 'claude';
const AGENT = { coder: 'epic-coder', plan: 'plan-reviewer', ui: 'ui-reviewer', summary: 'epic-summarizer' };

const flags = new Set(process.argv.slice(2).filter((a) => a.startsWith('--')));
const target = process.argv.slice(2).find((a) => !a.startsWith('--')) || 'next';
const DRY = flags.has('--dry-run');

const log = (m) => console.log(`[${new Date().toTimeString().slice(0, 8)}] ${m}`);
const fail = (m) => {
  console.error(m);
  process.exit(1);
};

class Stop extends Error {} // the loop must stop and ask the owner
class Fatal extends Error {} // cannot run at all; nothing for the owner to decide inside the loop

// ---------- child process handling ----------

const children = new Set();
for (const sig of ['SIGINT', 'SIGTERM']) {
  process.on(sig, () => {
    for (const c of children) c.kill('SIGTERM');
    console.error(`\nInterrupted. Files are left as they are; run the command again to resume.`);
    process.exit(130);
  });
}

let flushNoted = false;

/** Runs one agent, then empties the model server's saved conversations once no agent is running (reviews can overlap). */
async function runAgent(role, epic, turn, extra, attempt) {
  const run = await runAgentProcess(role, epic, turn, extra, attempt);
  if (PROFILE?.flushUrl && children.size === 0) {
    const res = await flushCache(PROFILE);
    if (res.ok) log(`${epic} T${turn} ${role}: model cache emptied (${res.sequences_before} saved, ${(res.bytes_before / 1e9).toFixed(2)} GB)`);
    else if (!flushNoted) {
      flushNoted = true; // say it once; the run continues either way
      log(`could not empty the model cache (${res.error}); continuing without. ${res.status === 404 ? 'Start the model server with harness/local/start-qwen.sh to get the /flush endpoint.' : ''}`.trim());
    }
  }
  return run;
}

function runAgentProcess(role, epic, turn, extra, attempt) {
  const agent = AGENT[role];
  const prompt = (role === 'summary' ? `Epic: ${epic}.` : `Epic: ${epic}. Turn: ${turn}.`) + (extra ? `\n\n${extra}` : '');
  const args = [
    '-p', '--agent', agent,
    '--permission-mode', process.env.TMTS_PERMISSION_MODE || 'acceptEdits',
    '--output-format', 'json',
    '--no-session-persistence',
  ];
  if (process.env.TMTS_MODEL) args.push('--model', process.env.TMTS_MODEL);
  if (process.env.TMTS_MAX_BUDGET_USD) args.push('--max-budget-usd', process.env.TMTS_MAX_BUDGET_USD);
  args.push(prompt);

  const logDir = path.join(ROOT, '.driver-logs', epic);
  fs.mkdirSync(logDir, { recursive: true });
  const logFile = path.join(logDir, `turn-${pad(turn)}-${role}-${attempt}.json`);
  const started = Date.now();
  log(`${epic} T${turn} ${role}: running (${agent}, attempt ${attempt})`);

  return new Promise((resolve) => {
    const child = spawn(CLAUDE, args, {
      cwd: ROOT,
      env: { ...process.env, ...(PROFILE ? PROFILE.env : {}), TMTS_DRIVER: '1', TMTS_ROLE: agent, TMTS_EPIC: epic, TMTS_TURN: String(turn) },
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    children.add(child);
    let out = '';
    let err = '';
    child.stdout.on('data', (d) => (out += d));
    child.stderr.on('data', (d) => (err += d));
    const timer = setTimeout(() => child.kill('SIGTERM'), TIMEOUT_MS);
    child.on('error', (e) => {
      clearTimeout(timer);
      children.delete(child);
      resolve({ code: -1, error: `could not start "${CLAUDE}": ${e.message}` });
    });
    child.on('close', (code) => {
      clearTimeout(timer);
      children.delete(child);
      fs.writeFileSync(logFile, out + (err ? `\n--- stderr ---\n${err}` : ''));
      if (/workspace has not been trusted/i.test(err + out)) {
        resolve({ code: -2, error: 'untrusted' });
        return;
      }
      try {
        const j = JSON.parse(out);
        if (j.is_error && j.api_error_status) {
          resolve({ code: -3, error: `HTTP ${j.api_error_status} ${j.api_error_type || ''}: ${String(j.result || '').slice(0, 300)}`.trim() });
          return;
        }
      } catch { /* not JSON: handled as an ordinary failed run */ }
      const mins = ((Date.now() - started) / 60000).toFixed(1);
      log(`${epic} T${turn} ${role}: finished with exit code ${code} after ${mins} min (log: ${rel(logFile)})`);
      resolve({ code, error: code === 0 ? null : `exit code ${code}. ${err.trim().slice(-500)}` });
    });
  });
}

/** Run an agent and check its output; on invalid output give it the errors and try once more. */
async function runValidated(role, epic, turn, validate, extra = '') {
  let errors = [];
  for (let attempt = 1; attempt <= 2; attempt++) {
    const note = attempt === 1 ? extra : `${extra}\n\nYour previous attempt failed these checks. Correct them and nothing else:\n${errors.map((e) => `- ${e}`).join('\n')}`;
    const run = await runAgent(role, epic, turn, note.trim(), attempt);
    if (run.code === -2) {
      throw new Fatal(
        'Claude Code is ignoring this project\'s settings (permissions and hooks) because the folder is not trusted, so agent runs would be denied their commands.\n' +
          `Run \`claude\` interactively in ${ROOT} once and accept the trust dialog, or set projects["${ROOT}"].hasTrustDialogAccepted to true in ~/.claude.json. Then run this command again.`,
      );
    }
    if (run.code === -3) {
      throw new Fatal(`The model endpoint returned an error, so the ${AGENT[role]} agent could not run (${run.error}).\nThis is not something retrying or a decision from you can fix. Repair the model endpoint, then run this command again; no progress is lost.`);
    }
    if (run.error && run.code === -1) throw new Stop(run.error);
    errors = validate();
    if (run.error) errors.unshift(`the agent run failed: ${run.error}`);
    if (!errors.length) return;
    log(`${epic} T${turn} ${role}: output rejected:\n${errors.map((e) => `    - ${e}`).join('\n')}`);
  }
  throw new Stop(`The ${AGENT[role]} agent failed validation twice for ${epic} turn ${turn}:\n${errors.map((e) => `- ${e}`).join('\n')}`);
}

// ---------- git ----------

function commit(message, paths = ['-A']) {
  git(['add', ...paths]);
  if (git(['diff', '--cached', '--quiet']).ok) return; // nothing staged
  const r = git(['commit', '-q', '-m', TRAILER ? `${message}\n\n${TRAILER}` : message]);
  if (!r.ok) throw new Stop(`git commit failed: ${r.err}`);
}

const branch = () => git(['rev-parse', '--abbrev-ref', 'HEAD']).out;
const dirtyPaths = () =>
  git(['status', '--porcelain', '--untracked-files=all']).out
    .split('\n')
    .filter(Boolean)
    .map((l) => l.slice(3).replace(/^"|"$/g, '').replace(/.* -> /, ''));

function ensureGitignore() {
  const p = path.join(ROOT, '.gitignore');
  const have = (read(p) || '').split('\n');
  const want = ['node_modules', 'dist', '.DS_Store', '.driver-logs', 'test-results', 'playwright-report'];
  const missing = want.filter((w) => !have.includes(w));
  if (missing.length) fs.appendFileSync(p, (have.at(-1) === '' || !have.length ? '' : '\n') + missing.join('\n') + '\n');
}

function switchToEpicBranch(epic) {
  const name = `epic/${epic}`;
  if (branch() === name) return;
  // The owner's notes are untracked and carry over a branch switch, so they do not count as dirty.
  if (dirtyPaths().filter((f) => !/OWNER-NOTES\.md$/.test(f)).length) throw new Stop(`Uncommitted changes on ${branch()}. Commit or stash them before running ${epic}.`);
  const exists = git(['rev-parse', '--verify', '-q', name]).ok;
  if (!exists && branch() !== 'main') git(['switch', '-q', 'main']);
  const r = exists ? git(['switch', '-q', name]) : git(['switch', '-q', '-c', name]);
  if (!r.ok) throw new Stop(`Could not switch to ${name}: ${r.err}`);
}

// ---------- checks on what the agents changed ----------

const COMMS_OWNED = (epic, turn) => new RegExp(`^comms/${epic}/turn-${pad(turn)}/`);

function strayReadmes() {
  const r = spawnSync('git', ['ls-files', '--cached', '--others', '--exclude-standard'], { cwd: ROOT, encoding: 'utf8' });
  return r.stdout.split('\n').filter((f) => f && f !== 'README.md' && /^readme/i.test(path.basename(f)));
}

function checkCoderScope(epic, turn, base) {
  const changed = new Set([...git(['diff', '--name-only', `${base}..HEAD`]).out.split('\n'), ...dirtyPaths()].filter(Boolean));
  const bad = [];
  for (const f of changed) {
    if (f === `comms/${epic}/turn-${pad(turn)}/coder.md`) continue;
    if (/^(planning|comms|harness|\.claude)\//.test(f) || f === 'README.md' || f === 'CLAUDE.md') bad.push(f);
  }
  bad.push(...strayReadmes().map((f) => `${f} (only the root README.md is allowed)`));
  const dirty = dirtyPaths().filter((f) => !f.startsWith('comms/'));
  return { bad, uncommitted: dirty };
}

function checkReviewerScope(epic, turn) {
  const ok = COMMS_OWNED(epic, turn);
  return [...dirtyPaths().filter((f) => !ok.test(f)), ...strayReadmes()];
}

const devServerPids = () =>
  new Set((spawnSync('lsof', ['-ti', 'tcp:5173'], { encoding: 'utf8' }).stdout || '').split('\n').filter(Boolean));

/** Stop dev servers the UI reviewer left running. Anything already listening before it started (the owner's own) is left alone. */
function stopDevServer(before) {
  for (const pid of devServerPids()) {
    if (before.has(pid)) continue;
    try { process.kill(Number(pid), 'SIGTERM'); } catch { /* already gone */ }
  }
}

// ---------- the loop ----------

function stopForOwner(epic, afterTurn, reason, decision) {
  writeNeedsInput(epic, { afterTurn, reason, decision });
  setStatusRow(epic, { status: 'Needs owner' });
  commit(`${epic}: stopped for owner input`);
  throw new Stop(`${epic} needs your input: ${reason}\nSee comms/${epic}/NEEDS-INPUT.md`);
}

function needsInputResume(epic) {
  const ni = path.join(commsDir(epic), 'NEEDS-INPUT.md');
  if (!fs.existsSync(ni)) return;
  const notes = path.join(commsDir(epic), 'OWNER-NOTES.md');
  if (!fs.existsSync(notes) || fs.statSync(notes).mtimeMs < fs.statSync(ni).mtimeMs) {
    throw new Stop(`${epic} is waiting for you. Read comms/${epic}/NEEDS-INPUT.md, write your answer in comms/${epic}/OWNER-NOTES.md, then run this command again.`);
  }
  fs.unlinkSync(ni);
  fs.writeFileSync(path.join(commsDir(epic), '.loop-state.json'), JSON.stringify({ baseTurn: lastRecordedTurn(epic) }));
  log(`${epic}: owner answered; turn limit restarts from turn ${lastRecordedTurn(epic)}`);
}

const baseTurn = (epic) => {
  try { return JSON.parse(read(path.join(commsDir(epic), '.loop-state.json'))).baseTurn || 0; } catch { return 0; }
};

async function runEpic(epic) {
  const table = readEpicTable();
  const status = readStatus();
  const row = table.find((r) => r.id === epic);
  if (!row) throw new Stop(`${epic} is not in the epic table in README.md`);
  for (const d of row.deps) {
    if (status.find((s) => s.id === d)?.status !== 'Approved') throw new Stop(`${epic} depends on ${d}, which is not Approved.`);
  }
  switchToEpicBranch(epic);
  needsInputResume(epic); // NEEDS-INPUT.md lives on the epic branch, so switch first
  ensureGitignore();
  commit(`${epic}: ignore driver output`, ['.gitignore']);
  fs.mkdirSync(commsDir(epic), { recursive: true });
  if (status.find((s) => s.id === epic)?.status !== 'In progress') {
    setStatusRow(epic, { status: 'In progress' });
    commit(`${epic}: start`);
  }

  try {
    return await loopEpic(epic);
  } catch (e) {
    // Any stop inside the loop leaves a note for the owner, even if no specific reason file was written.
    // An epic that is already Approved only lacks its summary, which the next run retries on its own.
    const approved = readStatus().find((r) => r.id === epic)?.status === 'Approved';
    if (e instanceof Stop && !approved && !fs.existsSync(path.join(commsDir(epic), 'NEEDS-INPUT.md'))) {
      const [reason, ...rest] = e.message.split('\n');
      writeNeedsInput(epic, {
        afterTurn: lastRecordedTurn(epic),
        reason: reason.replace(/:$/, ''),
        decision: `${rest.join('\n')}\n\nThe raw output of each agent run is in .driver-logs/${epic}/ (not committed). Fix the cause or say what to change in comms/${epic}/OWNER-NOTES.md, then run the epic again.`.trim(),
      });
      setStatusRow(epic, { status: 'Needs owner' });
      commit(`${epic}: stopped for owner input`);
    }
    throw e;
  }
}

async function loopEpic(epic) {
  for (;;) {
    const done = lastRecordedTurn(epic);
    const turn = done + 1;
    if (done - baseTurn(epic) >= MAX_TURNS) {
      stopForOwner(epic, done, `${MAX_TURNS} turns without approval`, `The coder and reviewers have not converged after ${MAX_TURNS} turns. Decide whether to change the requirement, give direction in OWNER-NOTES.md, or accept the current state.`);
    }
    fs.mkdirSync(turnDir(epic, turn), { recursive: true });

    // Coding agent
    if (validateCoder(epic, turn).errors.length) {
      const base = git(['rev-parse', 'HEAD']).out;
      await runValidated('coder', epic, turn, () => {
        const v = validateCoder(epic, turn, { strict: true }).errors;
        const scope = checkCoderScope(epic, turn, base);
        if (scope.bad.length) throw new Stop(`The coder changed files it may not touch:\n- ${scope.bad.join('\n- ')}\nReview and revert them, then run the command again.`);
        if (scope.uncommitted.length) v.push(`uncommitted changes outside comms/: ${scope.uncommitted.join(', ')}. Commit them as "${epic} turn ${turn}: ...".`);
        return v;
      });
    }
    const coder = validateCoder(epic, turn).parsed;
    commit(`${epic} turn ${turn}: coder report`);
    if (coder.statuses[0] === 'BLOCKED - NEEDS OWNER') {
      stopForOwner(epic, done, 'The coding agent reported a blocker', `See "Blocker" in comms/${epic}/turn-${pad(turn)}/coder.md.`);
    }
    if (turn > 1) {
      const prev = turn > 2 ? parseCoder(read(path.join(turnDir(epic, turn - 1), FILES.coder)) || '') : { responses: [] };
      const twice = coder.responses.filter((r) => r.response === 'Disputed' && prev.responses.some((p) => p.id === r.id && p.response === 'Disputed'));
      if (twice.length) {
        stopForOwner(epic, done, `The coder disputed ${twice.map((r) => r.id).join(', ')} two turns in a row`, 'Decide whether the reviewer or the coder is right, and say so in OWNER-NOTES.md.');
      }
    }

    // Reviewers
    const pending = ['plan', 'ui'].filter((t) => validateReview(epic, turn, t).errors.length);
    const serversBefore = devServerPids();
    const review = (t) => runValidated(t, epic, turn, () => validateReview(epic, turn, t).errors);
    try {
      if (process.env.TMTS_SERIAL_REVIEWS) for (const t of pending) await review(t);
      else {
        // Let both finish so neither review is lost, then report the first failure.
        const results = await Promise.allSettled(pending.map(review));
        const failed = results.find((r) => r.status === 'rejected');
        if (failed) throw failed.reason;
      }
    } finally {
      if (pending.includes('ui')) stopDevServer(serversBefore);
    }
    const stray = checkReviewerScope(epic, turn);
    if (stray.length) throw new Stop(`A reviewer changed files outside comms/${epic}/turn-${pad(turn)}/:\n- ${stray.join('\n- ')}\nReview and revert them, then run the command again.`);

    // Record the turn
    const plan = validateReview(epic, turn, 'plan');
    const ui = validateReview(epic, turn, 'ui');
    const count = (r) => r.open.filter((o) => o.severity === 'Blocking').length;
    const pv = plan.parsed.verdicts[0];
    const uv = ui.parsed.verdicts[0];
    setIndexRow(epic, turn, { coder: coder.statuses[0], plan: pv, planBlocking: count(plan), ui: uv, uiBlocking: count(ui) });
    setStatusRow(epic, { status: 'In progress', turns: turn, verdicts: `${pv} / ${uv}` });
    commit(`${epic} turn ${turn}: reviews and index`);
    log(`${epic} turn ${turn}: plan ${pv} (${count(plan)} blocking), UI ${uv} (${count(ui)} blocking)`);

    if (pv === 'BLOCKED - NEEDS OWNER' || uv === 'BLOCKED - NEEDS OWNER') {
      stopForOwner(epic, turn, 'A reviewer reported a blocker', 'Read the review marked BLOCKED - NEEDS OWNER in the latest turn folder.');
    }
    if (pv === 'APPROVED' && uv === 'APPROVED') {
      const gate = approvalGate(epic);
      if (!gate.ok) throw new Stop(`Both reviews approve but the approval gate failed:\n- ${gate.errors.join('\n- ')}`);
      return await approve(epic, turn);
    }
  }
}

async function approve(epic, turn) {
  writeForOwner(epic, turn);
  setStatusRow(epic, { status: 'Approved', turns: turn });
  commit(`${epic}: approved after ${turn} turn${turn === 1 ? '' : 's'}`);
  const title = readEpicTable().find((r) => r.id === epic)?.title || epic;
  const m = git(['switch', '-q', 'main']);
  if (!m.ok) throw new Stop(`Could not switch to main: ${m.err}`);
  const merge = git(['merge', '--no-ff', '-q', `epic/${epic}`, '-m', TRAILER ? `Merge epic/${epic}: ${title}\n\n${TRAILER}` : `Merge epic/${epic}: ${title}`]);
  if (!merge.ok) {
    git(['merge', '--abort']);
    git(['switch', '-q', `epic/${epic}`]);
    throw new Stop(`Merging epic/${epic} into main failed:\n${merge.err}`);
  }
  log(`${epic}: approved and merged into main`);
  await ensureSummary(epic);
}

async function ensureSummary(epic) {
  if (!validateSummary(epic).errors.length) return;
  if (branch() !== 'main') {
    if (dirtyPaths().length) throw new Stop(`Uncommitted changes on ${branch()}; cannot write the ${epic} summary on main.`);
    git(['switch', '-q', 'main']);
  }
  await runValidated('summary', epic, 0, () => validateSummary(epic).errors);
  commit(`${epic}: summary`);
  log(`${epic}: summary written to comms/${epic}/SUMMARY.md`);
}

// ---------- main ----------

async function main() {
  const profileName = flags.has('--local') ? 'local' : [...flags].find((f) => f.startsWith('--profile='))?.slice(10);
  if (profileName) {
    try {
      PROFILE = loadProfile(profileName);
      if (PROFILE.trailer !== undefined) TRAILER = PROFILE.trailer;
      if (PROFILE.serialReviews) process.env.TMTS_SERIAL_REVIEWS = '1'; // a single local model server handles one request at a time
      await checkReachable(PROFILE);
      if (!DRY) await checkModel(PROFILE);
    } catch (e) {
      fail(e.message);
    }
    log(`Using profile "${PROFILE.name}" for every agent (${PROFILE.baseUrl || 'default endpoint'})`);
  }
  if (!git(['rev-parse', '--is-inside-work-tree']).ok) fail('This folder is not a git repository. Run `git init` and commit first.');
  const table = readEpicTable();
  const status = readStatus();
  if (!table.length) fail('No epic table found in README.md section 4.');

  let ids;
  if (EPIC_RE.test(target)) {
    if (!table.some((r) => r.id === target)) fail(`${target} is not in the epic table.`);
    ids = [target];
  } else if (target === 'next' || target === 'all') {
    const first = table.findIndex((r) => status.find((s) => s.id === r.id)?.status !== 'Approved');
    if (first < 0) {
      console.log('Every epic is Approved.');
      return;
    }
    ids = target === 'next' ? [table[first].id] : table.slice(first).map((r) => r.id);
  } else fail(`Unknown argument "${target}". Use an epic id (E03), next, or all.`);

  if (target !== 'all' && ids.length === 1 && status.find((s) => s.id === ids[0])?.status === 'Approved') {
    console.log(`${ids[0]} is already Approved. To redo it, set its row in comms/STATUS.md to "In progress" and add comms/${ids[0]}/OWNER-NOTES.md.`);
    return;
  }

  if (DRY) {
    for (const id of ids) log(`would run ${id}: next turn ${lastRecordedTurn(id) + 1}, status ${status.find((s) => s.id === id)?.status}`);
    return;
  }

  // An approved epic must never be left without its summary.
  for (const s of status.filter((x) => x.status === 'Approved')) {
    if (validateSummary(s.id).errors.length) await ensureSummary(s.id);
  }

  for (const id of ids) {
    if (status.find((s) => s.id === id)?.status === 'Approved') continue;
    await runEpic(id);
  }
  console.log('\nDone. Read comms/STATUS.md for where things stand, and comms/<epic>/SUMMARY.md for what each approved epic delivers.');
}

main().catch((e) => {
  for (const c of children) c.kill('SIGTERM');
  if (e instanceof Fatal) {
    console.error(`\nCANNOT RUN: ${e.message}`);
    process.exit(1);
  }
  if (e instanceof Stop) {
    console.error(`\nSTOPPED: ${e.message}`);
    process.exit(2);
  }
  console.error(e);
  process.exit(1);
});
