// Run with: npm run test:harness   (node --test harness/test)
import { test, before, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'tmts-'));
process.env.TMTS_ROOT = tmp;
const lib = await import('../lib/comms.mjs');
const rules = await import('../lib/rules.mjs');

const E = 'E09';
const write = (rel, text) => {
  const f = path.join(tmp, rel);
  fs.mkdirSync(path.dirname(f), { recursive: true });
  fs.writeFileSync(f, text);
};

const checks = (r = 'pass') => CMDS.map((c) => `| \`${c}\` | ${r} |`).join('\n');
const CMDS = ['npm run lint', 'npm test', 'npm run test:e2e', 'npm run build'];

const coder = ({ turn = 1, status = 'READY FOR REVIEW', result = 'pass', responses = '' } = {}) => `# ${E} — Turn ${turn} — Coder Report

**Status:** ${status}

## Summary
x
## Checks

| Command | Result |
|---|---|
${checks(result)}

## Response to findings

| Finding | Response | Note |
|---|---|---|
${responses}

## Not done
Nothing
## How to see it
/
`;

const finding = (id, sev, status = 'Open') => `### ${id} — title

- **Severity:** ${sev}
- **Status:** ${status}
- **Problem:** p
- **Change needed:** c

`;

const review = (type, { turn = 1, verdict = 'APPROVED', counts = '0 · **Non-blocking open:** 0', findings = '', previous = '' } = {}) => {
  const [b, n] = counts.split(' · **Non-blocking open:** ');
  const heads =
    type === 'plan'
      ? '## Checks run\n\n' + CMDS.map((c) => `| \`${c}\` | pass |`).join('\n') + '\n\n## Specification coverage\nx\n'
      : '## Screens reviewed\nx\n## Requirements checked\nx\n';
  const tail = type === 'plan' ? '## Questions for the owner\nNone\n' : '## Not verified\nx\n## Proposed requirement changes\nNone\n';
  return `# review

**Verdict:** ${verdict}

**Blocking open:** ${b} · **Non-blocking open:** ${n}

## Summary
x
${heads}
## Findings

${findings || 'None.\n'}
## Previous findings

${previous || 'None.'}

${tail}`;
};

const put = (turn, name, text) => write(`comms/${E}/turn-${String(turn).padStart(2, '0')}/${name}`, text);

before(() => {
  write(`docs/epic-notes/${E}.md`, 'notes');
  write(`comms/${E}/turn-01/screenshots/a.png`, 'x');
  write(`comms/${E}/turn-02/screenshots/a.png`, 'x');
});

beforeEach(() => {
  for (const t of ['turn-01', 'turn-02']) for (const f of ['coder.md', 'plan-review.md', 'ui-review.md']) fs.rmSync(path.join(tmp, 'comms', E, t, f), { force: true });
});

const errs = (r) => r.errors.join('\n');

test('a well-formed approved turn passes', () => {
  put(1, 'coder.md', coder());
  put(1, 'plan-review.md', review('plan'));
  put(1, 'ui-review.md', review('ui'));
  assert.deepEqual(lib.validateCoder(E, 1).errors, []);
  assert.deepEqual(lib.validateReview(E, 1, 'plan').errors, []);
  assert.deepEqual(lib.validateReview(E, 1, 'ui').errors, []);
});

test('a review file that was never written is rejected', () => {
  assert.match(errs(lib.validateReview(E, 1, 'ui')), /does not exist/);
});

test('missing or invalid verdict line is rejected', () => {
  put(1, 'plan-review.md', review('plan').replace(/\*\*Verdict:\*\* APPROVED\n/, ''));
  assert.match(errs(lib.validateReview(E, 1, 'plan')), /exactly one "\*\*Verdict/);
  put(1, 'plan-review.md', review('plan', { verdict: 'LOOKS GOOD' }));
  assert.match(errs(lib.validateReview(E, 1, 'plan')), /must be one of/);
});

test('APPROVED with an open blocking finding is rejected', () => {
  put(1, 'ui-review.md', review('ui', { verdict: 'APPROVED', counts: '1 · **Non-blocking open:** 0', findings: finding(`UI-${E}-T1-01`, 'Blocking') }));
  assert.match(errs(lib.validateReview(E, 1, 'ui')), /APPROVED but 1 blocking/);
});

test('stated counts must match the findings', () => {
  put(1, 'ui-review.md', review('ui', { verdict: 'CHANGES REQUIRED', counts: '3 · **Non-blocking open:** 0', findings: finding(`UI-${E}-T1-01`, 'Blocking') }));
  assert.match(errs(lib.validateReview(E, 1, 'ui')), /do not match/);
});

test('CHANGES REQUIRED without a blocking finding is rejected', () => {
  put(1, 'ui-review.md', review('ui', { verdict: 'CHANGES REQUIRED', counts: '0 · **Non-blocking open:** 1', findings: finding(`UI-${E}-T1-01`, 'Non-blocking') }));
  assert.match(errs(lib.validateReview(E, 1, 'ui')), /no blocking finding is open/);
});

test('findings must use the current reviewer, epic and turn in their id', () => {
  put(1, 'ui-review.md', review('ui', { verdict: 'CHANGES REQUIRED', counts: '1 · **Non-blocking open:** 0', findings: finding(`PLAN-${E}-T1-01`, 'Blocking') }));
  assert.match(errs(lib.validateReview(E, 1, 'ui')), /must be named UI-/);
});

test('a screenshot that is referenced but missing is rejected', () => {
  put(1, 'ui-review.md', review('ui').replace('## Screens reviewed\nx', '## Screens reviewed\n`screenshots/nope.png`'));
  assert.match(errs(lib.validateReview(E, 1, 'ui')), /nope\.png/);
});

test('turn 2 review must address every finding left open in turn 1', () => {
  put(1, 'ui-review.md', review('ui', { verdict: 'CHANGES REQUIRED', counts: '1 · **Non-blocking open:** 1', findings: finding(`UI-${E}-T1-01`, 'Blocking') + finding(`UI-${E}-T1-02`, 'Non-blocking') }));
  put(2, 'ui-review.md', review('ui', { turn: 2, previous: `| Finding | Status now | Note |\n|---|---|---|\n| UI-${E}-T1-01 | Fixed | ok |` }));
  assert.match(errs(lib.validateReview(E, 2, 'ui')), new RegExp(`UI-${E}-T1-02 was open last turn`));
});

test('a previous blocking finding still marked Open keeps the count honest', () => {
  put(1, 'ui-review.md', review('ui', { verdict: 'CHANGES REQUIRED', counts: '1 · **Non-blocking open:** 0', findings: finding(`UI-${E}-T1-01`, 'Blocking') }));
  const prev = `| Finding | Status now | Note |\n|---|---|---|\n| UI-${E}-T1-01 | Open | still broken |`;
  put(2, 'ui-review.md', review('ui', { turn: 2, verdict: 'APPROVED', previous: prev }));
  assert.match(errs(lib.validateReview(E, 2, 'ui')), /APPROVED but 1 blocking/);
  put(2, 'ui-review.md', review('ui', { turn: 2, verdict: 'CHANGES REQUIRED', counts: '1 · **Non-blocking open:** 0', previous: prev }));
  assert.deepEqual(lib.validateReview(E, 2, 'ui').errors, []);
});

test('coder: failing check with READY status, missing check row, missing response', () => {
  put(1, 'coder.md', coder({ result: 'fail (2 errors)' }));
  assert.match(errs(lib.validateCoder(E, 1)), /failed but status is READY/);
  put(1, 'coder.md', coder().replace(/\| `npm test` \| pass \|\n/, ''));
  assert.match(errs(lib.validateCoder(E, 1)), /no row for `npm test`/);

  put(1, 'ui-review.md', review('ui', { verdict: 'CHANGES REQUIRED', counts: '1 · **Non-blocking open:** 0', findings: finding(`UI-${E}-T1-01`, 'Blocking') }));
  put(1, 'plan-review.md', review('plan'));
  put(2, 'coder.md', coder({ turn: 2 }));
  assert.match(errs(lib.validateCoder(E, 2)), new RegExp(`no response to finding UI-${E}-T1-01`));
  put(2, 'coder.md', coder({ turn: 2, responses: `| UI-${E}-T1-01 | Deferred | later |` }));
  assert.match(errs(lib.validateCoder(E, 2)), /cannot be Deferred/);
  put(2, 'coder.md', coder({ turn: 2, responses: `| UI-${E}-T1-01 | Fixed | done |` }));
  assert.deepEqual(lib.validateCoder(E, 2).errors, []);
});

test('summary needs every section and numbered test steps', () => {
  write(`comms/${E}/SUMMARY.md`, '# s\n**Approved:** x\n## What was accomplished\nx\n');
  assert.match(errs(lib.validateSummary(E)), /missing section/);
  write(
    `comms/${E}/SUMMARY.md`,
    '# s\n\n**Approved:** x\n\n## What was accomplished\nx\n## Changes made during review\nx\n## How to test it\n1. a\n2. b\n3. c\n## Not verified by the agents\nx\n## Known issues and deferred items\nx\n## For the owner to decide\nx\n',
  );
  assert.deepEqual(lib.validateSummary(E).errors, []);
});

test('approval gate requires two APPROVED verdicts and an indexed turn', () => {
  spawnSync('git', ['init', '-q', '-b', 'main'], { cwd: tmp });
  spawnSync('git', ['-c', 'user.name=t', '-c', 'user.email=t@t', 'commit', '-q', '--allow-empty', '-m', `${E} turn 1: build`], { cwd: tmp });
  put(1, 'coder.md', coder());
  put(1, 'plan-review.md', review('plan'));
  put(1, 'ui-review.md', review('ui'));
  assert.match(lib.approvalGate(E).errors.join(), /no recorded turn/);
  lib.setIndexRow(E, 1, { coder: 'READY FOR REVIEW', plan: 'APPROVED', planBlocking: 0, ui: 'APPROVED', uiBlocking: 0 });
  assert.equal(lib.approvalGate(E).ok, true);
  put(1, 'ui-review.md', review('ui', { verdict: 'CHANGES REQUIRED', counts: '1 · **Non-blocking open:** 0', findings: finding(`UI-${E}-T1-01`, 'Blocking') }));
  assert.equal(lib.approvalGate(E).ok, false);
});

test('git helper keeps the leading space of porcelain status lines', () => {
  const g = (...a) => spawnSync('git', ['-c', 'user.name=t', '-c', 'user.email=t@t', ...a], { cwd: tmp });
  write('tracked.txt', 'one\n');
  g('add', 'tracked.txt');
  g('commit', '-q', '-m', 'add tracked');
  write('tracked.txt', 'two\n');
  assert.equal(lib.git(['status', '--porcelain', '--', 'tracked.txt']).out, ' M tracked.txt');
});

test('index rows are replaced, not duplicated', () => {
  lib.setIndexRow(E, 1, { coder: 'READY FOR REVIEW', plan: 'APPROVED', planBlocking: 0, ui: 'CHANGES REQUIRED', uiBlocking: 1 });
  lib.setIndexRow(E, 1, { coder: 'READY FOR REVIEW', plan: 'APPROVED', planBlocking: 0, ui: 'APPROVED', uiBlocking: 0 });
  lib.setIndexRow(E, 2, { coder: 'READY FOR REVIEW', plan: 'APPROVED', planBlocking: 0, ui: 'APPROVED', uiBlocking: 0 });
  assert.deepEqual(lib.readIndexRows(E).map((r) => [r.turn, r.ui]), [[1, 'APPROVED'], [2, 'APPROVED']]);
});

// ---- guard rules ----

const env = (role, turn = 1) => ({ TMTS_ROLE: role, TMTS_EPIC: E, TMTS_TURN: String(turn) });

test('guard: only the root README is allowed, for every session', () => {
  assert.equal(rules.checkWrite(path.join(tmp, 'README.md'), {}), null);
  assert.match(rules.checkWrite(path.join(tmp, 'planning', 'README.md'), {}), /one README/);
  assert.match(rules.checkWrite(path.join(tmp, 'src', 'readme.txt'), env('epic-coder')), /one README/);
});

test('guard: owner-only files are protected in agent sessions, not in the owner session', () => {
  const ui = path.join(tmp, 'planning', 'ui-requirements.md');
  assert.equal(rules.checkWrite(ui, {}), null);
  assert.match(rules.checkWrite(ui, env('epic-coder')), /owned by the owner/);
  assert.match(rules.checkWrite(path.join(tmp, 'harness', 'validate.mjs'), env('ui-reviewer')), /owned by the owner/);
});

test('guard: coder may write source and its own report only', () => {
  assert.equal(rules.checkWrite(path.join(tmp, 'src', 'a.ts'), env('epic-coder')), null);
  assert.equal(rules.checkWrite(path.join(tmp, 'comms', E, 'turn-01', 'coder.md'), env('epic-coder')), null);
  assert.match(rules.checkWrite(path.join(tmp, 'comms', E, 'turn-01', 'plan-review.md'), env('epic-coder')), /may not edit/);
  assert.match(rules.checkWrite(path.join(tmp, 'planning', 'epics', 'E09.md'), env('epic-coder')), /may not edit/);
  assert.match(rules.checkWrite(path.join(tmp, 'comms', E, 'turn-02', 'coder.md'), env('epic-coder')), /may not edit/);
});

test('guard: reviewers write only inside their turn folder', () => {
  assert.equal(rules.checkWrite(path.join(tmp, 'comms', E, 'turn-01', 'ui-review.md'), env('ui-reviewer')), null);
  assert.equal(rules.checkWrite(path.join(tmp, 'comms', E, 'turn-01', 'screenshots', 'a.png'), env('ui-reviewer')), null);
  assert.match(rules.checkWrite(path.join(tmp, 'src', 'a.ts'), env('plan-reviewer')), /only inside/);
  assert.match(rules.checkWrite(path.join(tmp, 'comms', E, 'turn-02', 'ui-review.md'), env('ui-reviewer')), /only inside/);
  assert.equal(rules.checkWrite('/tmp/scratch/x.mjs', env('ui-reviewer')), null);
});

test('guard: summarizer writes only SUMMARY.md', () => {
  assert.equal(rules.checkWrite(path.join(tmp, 'comms', E, 'SUMMARY.md'), env('epic-summarizer')), null);
  assert.match(rules.checkWrite(path.join(tmp, 'src', 'a.ts'), env('epic-summarizer')), /only comms/);
});

test('guard: push is always blocked; branch management is blocked for agents; merge needs the gate', () => {
  assert.match(rules.checkBash('git push origin main', {}), /pushed/);
  assert.equal(rules.checkBash('git status', env('epic-coder')), null);
  assert.equal(rules.checkBash('git commit -m "E09 turn 1: x"', env('epic-coder')), null);
  assert.match(rules.checkBash('git checkout main', env('epic-coder')), /branches/);
  assert.match(rules.checkBash('git commit -m x', env('ui-reviewer')), /does not commit/);
  assert.match(rules.checkBash('git merge epic/E08', { TMTS_TEST_BRANCH: 'main' }), /may not be merged/);
  assert.equal(rules.checkBash('git merge feature-x', {}), null);
});

test('guard: words inside quotes, messages and heredocs are not commands', () => {
  assert.equal(rules.checkBash('echo "do not git push yet"', {}), null);
  assert.equal(rules.checkBash("git commit -m 'mention git push and git merge epic/E01 here'", env('epic-coder')), null);
  assert.equal(rules.checkBash("git commit -m \"$(cat <<'EOF'\nfix\n\ngit push later\nEOF\n)\"", env('epic-coder')), null);
  assert.match(rules.checkBash('cd x && git push', {}), /pushed/);
  assert.match(rules.checkBash('git merge "epic/E08"', { TMTS_TEST_BRANCH: 'main' }), /may not be merged/);
});

test('guard: only merges into main are gated, and the merge message is ignored', () => {
  const onMain = { TMTS_TEST_BRANCH: 'main' };
  const onEpic = { TMTS_TEST_BRANCH: 'epic/E08' };
  assert.match(rules.checkBash('git merge --no-ff epic/E08', onMain), /may not be merged/);
  assert.equal(rules.checkBash('git merge main', onEpic), null);
  assert.equal(rules.checkBash('git merge -q main -m "Merge main into epic/E08"', onEpic), null);
  assert.equal(rules.checkBash('git merge -q feature -m "mentions epic/E08"', onMain), null);
  // a chain that first switches to the epic branch is merging into that branch, not into main
  assert.equal(rules.checkBash('git switch -q epic/E08 && git merge -q main -m "Merge main into epic/E08"', onMain), null);
  assert.match(rules.checkBash('git switch -q main && git merge --no-ff epic/E08', onEpic), /may not be merged/);
  assert.match(rules.checkBash('npm test && git merge epic/E08', onMain), /may not be merged/);
});

// ---- run profiles ----

test('profile: loads env and reads the token from its file without storing it in the profile', async () => {
  const { loadProfile, checkReachable } = await import('../lib/profile.mjs');
  write('secret.key', 'abc123\n');
  write(
    'harness/profiles/t.json',
    JSON.stringify({ env: { ANTHROPIC_BASE_URL: 'http://127.0.0.1:1', ANTHROPIC_MODEL: 'm' }, authTokenFile: path.join(tmp, 'secret.key'), trailer: '', startHint: 'start it' }),
  );
  const p = loadProfile('t');
  assert.equal(p.env.ANTHROPIC_MODEL, 'm');
  assert.equal(p.env.ANTHROPIC_AUTH_TOKEN, 'abc123');
  assert.equal(p.trailer, '');
  await assert.rejects(() => checkReachable(p, 500), /Cannot reach http:\/\/127\.0\.0\.1:1.*start it/);
});

test('profile: a proxy that answers while the model behind it is dead is reported', async () => {
  const { checkModel } = await import('../lib/profile.mjs');
  const http = await import('node:http');
  let ok = false;
  const server = http.createServer((req, res) => {
    req.resume();
    res.writeHead(ok ? 200 : 404, { 'content-type': 'application/json' });
    res.end(ok ? '{"type":"message"}' : '{"error":"generation thread died"}');
  });
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  const profile = { name: 't', baseUrl: `http://127.0.0.1:${server.address().port}`, env: { ANTHROPIC_MODEL: 'm' }, startHint: 'start', restartHint: 'restart the model' };
  try {
    await assert.rejects(() => checkModel(profile, 5000), /does not work \(HTTP 404\).*generation thread died[\s\S]*restart the model/);
    ok = true;
    await checkModel(profile, 5000);
  } finally {
    server.close();
  }
});

test('profile: the preflight prompt is about the requested size', async () => {
  const { preflightPrompt } = await import('../lib/profile.mjs');
  assert.equal(preflightPrompt(0), 'Say OK');
  const bytes = preflightPrompt(16000).length;
  assert.ok(bytes > 60_000 && bytes < 80_000, `expected about 64 KB for 16,000 tokens, got ${bytes}`);
});

test('profile: missing profile or missing token file gives a clear error', async () => {
  const { loadProfile } = await import('../lib/profile.mjs');
  assert.throws(() => loadProfile('nope'), /No profile "nope"/);
  write('harness/profiles/u.json', JSON.stringify({ authTokenFile: path.join(tmp, 'missing.key'), startHint: 'hint' }));
  assert.throws(() => loadProfile('u'), /does not exist\. hint/);
});

test('the shipped local profile is valid JSON and names a token file, not a token', () => {
  const root = path.resolve(import.meta.dirname, '..', '..');
  const j = JSON.parse(fs.readFileSync(path.join(root, 'harness', 'profiles', 'local.json'), 'utf8'));
  assert.ok(j.authTokenFile);
  assert.equal(JSON.stringify(j).includes('sk-'), false);
  assert.equal(j.env.ANTHROPIC_AUTH_TOKEN, undefined);
});

// ---- the real repository ----

test('the real E01 files and summary pass the validator', () => {
  const root = path.resolve(import.meta.dirname, '..', '..');
  if (!fs.existsSync(path.join(root, 'comms', 'E01', 'turn-02'))) return;
  const run = (...a) => spawnSync('node', [path.join(root, 'harness', 'validate.mjs'), ...a], { cwd: root, encoding: 'utf8', env: { ...process.env, TMTS_ROOT: root } });
  assert.equal(run('E01', '2', 'all', '--strict').status, 0);
  assert.equal(run('E01', 'summary').status, 0);
});

test('image reads are blocked only when the model cannot view images', () => {
  const on = { TMTS_NO_IMAGES: '1' };
  assert.match(rules.checkRead('comms/E02/turn-01/screenshots/a.png', on), /cannot view images/);
  assert.equal(rules.checkRead('comms/E02/turn-01/ui-review.md', on), null);
  assert.equal(rules.checkRead('comms/E02/turn-01/screenshots/a.png', {}), null);
});
