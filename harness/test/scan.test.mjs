// PII and security scan. Run with: npm run test:harness
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'tmts-scan-'));
process.env.TMTS_ROOT = tmp;
process.env.TMTS_PII_TERMS = path.join(tmp, 'no-terms'); // tests pass their own terms
const s = await import('../lib/scan.mjs');
const rules = await import('../lib/rules.mjs');

const rulesOf = (line, opts) => s.scanLine(line, 'src/a.ts', 1, opts).map((f) => f.rule);

test('secrets are found and never printed in full', () => {
  const key = 'sk-ant-api03-' + 'A'.repeat(30);
  const f = s.scanLine(`const k = "${key}";`, 'src/a.ts', 3);
  assert.deepEqual(f.map((x) => x.rule), ['anthropic-key']);
  assert.ok(!f[0].excerpt.includes(key.slice(8)));
  assert.deepEqual(rulesOf('-----BEGIN RSA PRIVATE KEY-----'), ['private-key']);
  assert.deepEqual(rulesOf('AKIAABCDEFGHIJKLMNOP'), ['aws-key']);
  assert.deepEqual(rulesOf('token ghp_' + 'a'.repeat(36)), ['github-token']);
  assert.deepEqual(rulesOf('password: "hunter2hunter2!"'), ['credential-assignment']);
});

test('placeholders and environment lookups are not secrets', () => {
  assert.deepEqual(rulesOf('password = "${PASSWORD}"'), []);
  assert.deepEqual(rulesOf('apiKey: "your-api-key-here"'), []);
  assert.deepEqual(rulesOf('const key = process.env.LITELLM_KEY;'), []);
});

test('a secret cannot be allowed inline', () => {
  assert.deepEqual(rulesOf('AKIAABCDEFGHIJKLMNOP // scan-allow: test'), ['aws-key']);
});

test('emails: real ones are found; noreply, example domains and @2x images are not', () => {
  assert.deepEqual(rulesOf('mail jane.doe@gmail.com'), ['email']);
  assert.deepEqual(rulesOf('Co-Authored-By: Claude <noreply@anthropic.com>'), []);
  assert.deepEqual(rulesOf('123+someone@users.noreply.github.com'), []);
  assert.deepEqual(rulesOf('student@example.com a@b.test'), []);
  assert.deepEqual(rulesOf('"filename" : "AppIcon-512@2x.png"'), []);
});

test('phone, SSN, card, home path', () => {
  assert.deepEqual(rulesOf('call (312) 867-5309'), ['phone']);
  assert.deepEqual(rulesOf('ssn 123-45-6789'), ['ssn']);
  assert.deepEqual(rulesOf('card 4111 1111 1111 1111'), ['card-number']);
  assert.deepEqual(rulesOf('card 4111 1111 1111 1112'), []); // fails the Luhn check
  assert.deepEqual(rulesOf('see /Users/jdoe/dev'), ['home-path']);
  assert.deepEqual(rulesOf('see /Users/you/dev or /home/runner/work'), []);
  assert.deepEqual(rulesOf('version 1.2.3-45-6789 at 2026-11-26T10:00:00'), []);
});

test('inline scan-allow skips PII rules on that line', () => {
  assert.deepEqual(rulesOf('jane@gmail.com // scan-allow: fixture for the import test'), []);
});

test('the owner terms are found case-insensitively and cannot be allowed inline', () => {
  const opts = { terms: ['Elm Street 12'] };
  assert.deepEqual(rulesOf('lives at elm street 12', opts), ['owner-term']);
  assert.deepEqual(rulesOf('elm street 12 // scan-allow: x', opts), ['owner-term']);
  assert.ok(!s.scanLine('Elm Street 12', 'a', 1, opts)[0].excerpt.includes('Street'));
});

test('harness/scan-allow.json entries allow a rule for a path', () => {
  const allow = [{ rule: 'email', path: 'src/fixtures/', match: 'jane@gmail.com', reason: 'fixture' }];
  assert.deepEqual(s.scanLine('jane@gmail.com', 'src/fixtures/a.json', 1, { allow }), []);
  assert.equal(s.scanLine('jane@gmail.com', 'src/other.ts', 1, { allow }).length, 1);
});

test('redacted excerpts do not trigger the scan again', () => {
  for (const [text, rule] of [['/Users/jdoe', 'home-path'], ['jane@gmail.com', 'email'], ['sk-' + 'b'.repeat(40), 'api-key']]) {
    assert.deepEqual(s.scanLine(s.redact(text, rule), 'comms/E01/NEEDS-INPUT.md', 1), [], rule);
  }
});

test('file names: secrets, recordings and student data', () => {
  const ids = (f) => s.scanFileName(f).map((x) => x.rule);
  assert.deepEqual(ids('.env'), ['env-file']);
  assert.deepEqual(ids('.env.example'), []);
  assert.deepEqual(ids('ios/App/AuthKey.p8'), ['key-file']);
  assert.deepEqual(ids('tests/fixtures/take.webm'), ['audio-recording']);
  assert.deepEqual(ids('train-me-to-sing-2026-11-26.json'), ['student-data']);
  assert.deepEqual(ids('progress.json'), ['student-data']);
  assert.deepEqual(ids('src/storage/progress.ts'), []);
});

test('scanDiff looks only at added lines, with their new line numbers', () => {
  const diff = [
    'diff --git a/src/a.ts b/src/a.ts',
    '--- a/src/a.ts',
    '+++ b/src/a.ts',
    '@@ -10,0 +11,2 @@',
    '+ok line',
    '+mail jane@gmail.com',
    '@@ -20 +21,0 @@',
    '-old bob@gmail.com',
    'diff --git a/x.wav b/x.wav',
    'Binary files /dev/null and b/x.wav differ',
  ].join('\n');
  const f = s.scanDiff(diff);
  assert.deepEqual(f.map((x) => `${x.rule} ${x.file}:${x.line}`), ['email src/a.ts:12', 'audio-recording x.wav:0']);
});

test('commit emails must be GitHub noreply', () => {
  const f = s.scanIdentities(['abc1234 me@Mac.local 1+me@users.noreply.github.com', 'def5678 1+me@users.noreply.github.com 1+me@users.noreply.github.com']);
  assert.deepEqual(f.map((x) => x.file), ['commit abc1234']);
});

test('the hook scans before a commit, and over unstaged changes when the line also stages', () => {
  const calls = [];
  const finding = [{ file: 'src/a.ts', line: 2, rule: 'email', kind: 'pii', excerpt: 'j…@g….com' }];
  const scanFn = (mode) => (calls.push(mode), finding);
  const env = { TMTS_TEST_BRANCH: 'epic/E09' };
  const msg = rules.checkBash('git commit -q -m "E09 turn 1: x"', env, scanFn);
  assert.match(msg, /PII and security scan/);
  assert.match(msg, /src\/a\.ts:2/);
  rules.checkBash('git add -A && git commit -m "x"', env, scanFn);
  rules.checkBash('git commit -am "x"', env, scanFn);
  assert.deepEqual(calls, [{ staged: true }, { uncommitted: true }, { uncommitted: true }]);
  assert.equal(rules.checkBash('git status && git log -1', env, scanFn), null);
  assert.equal(calls.length, 3);
  assert.equal(rules.checkBash('git commit -m "x"', env, () => []), null);
});

test('staged and range scans in a real repository', () => {
  const repo = fs.mkdtempSync(path.join(os.tmpdir(), 'tmts-scan-repo-'));
  const g = (...a) => spawnSync('git', a, { cwd: repo, encoding: 'utf8' });
  g('init', '-q', '-b', 'main');
  g('config', 'user.email', '1+t@users.noreply.github.com');
  g('config', 'user.name', 't');
  fs.writeFileSync(path.join(repo, 'a.txt'), 'hello\n');
  g('add', '-A');
  g('commit', '-q', '-m', 'one');
  g('switch', '-q', '-c', 'epic/E01');
  fs.writeFileSync(path.join(repo, 'a.txt'), 'hello\nmail jane@gmail.com\n');
  g('add', '-A');
  assert.deepEqual(s.scan({ staged: true }, repo).map((f) => `${f.rule} ${f.file}:${f.line}`), ['email a.txt:2']);
  g('-c', 'user.email=me@Mac.local', 'commit', '-q', '-m', 'two');
  const r = s.scan({ range: 'main..epic/E01' }, repo).map((f) => f.rule);
  assert.deepEqual(r.sort(), ['commit-email', 'email']);
  fs.writeFileSync(path.join(repo, 'take.webm'), 'x');
  assert.deepEqual(s.scan({ uncommitted: true }, repo).map((f) => f.rule), ['audio-recording']);
});

test('an allow entry with rule "*" covers every rule for that path', () => {
  const allow = [{ rule: '*', path: 'harness/test/x.mjs' }];
  assert.deepEqual(s.scanLine('AKIAABCDEFGHIJKLMNOP jane@gmail.com', 'harness/test/x.mjs', 1, { allow }), []);
});
