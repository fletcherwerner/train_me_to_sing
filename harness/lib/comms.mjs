// Shared logic for the build loop: paths, parsing of agent files, validation, status files.
// Everything the loop's rules depend on lives here as code, so a model cannot skip it.
// No dependencies; Node 18+.

import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

export const ROOT = process.env.TMTS_ROOT
  ? path.resolve(process.env.TMTS_ROOT)
  : path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

export const EPIC_RE = /^E\d{2}$/;
export const FILES = { coder: 'coder.md', plan: 'plan-review.md', ui: 'ui-review.md' };
export const VERDICTS = ['APPROVED', 'CHANGES REQUIRED', 'BLOCKED - NEEDS OWNER'];
export const CODER_STATUSES = ['READY FOR REVIEW', 'BLOCKED - NEEDS OWNER'];
export const CHECK_COMMANDS = ['npm run lint', 'npm test', 'npm run test:e2e', 'npm run build'];

const ID = '(?:PLAN|UI)-E\\d{2}-T\\d+-\\d+';

const REQUIRED_HEADINGS = {
  coder: ['Summary', 'Checks', 'Not done', 'How to see it'],
  plan: ['Summary', 'Checks run', 'Specification coverage', 'Findings', 'Previous findings', 'Questions for the owner'],
  ui: ['Summary', 'Screens reviewed', 'Requirements checked', 'Findings', 'Previous findings', 'Not verified', 'Proposed requirement changes'],
  summary: [
    'What was accomplished',
    'Changes made during review',
    'How to test it',
    'Not verified by the agents',
    'Known issues and deferred items',
    'For the owner to decide',
  ],
};

// ---------- paths and files ----------

export const pad = (n) => String(n).padStart(2, '0');
export const commsDir = (epic) => path.join(ROOT, 'comms', epic);
export const turnDir = (epic, n) => path.join(commsDir(epic), `turn-${pad(n)}`);
export const rel = (p) => path.relative(ROOT, p).split(path.sep).join('/');
export const read = (p) => (fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : null);
export const today = () => new Date().toISOString().slice(0, 10);

export function git(args, opts = {}) {
  const r = spawnSync('git', args, { cwd: ROOT, encoding: 'utf8', ...opts });
  // trimEnd only: a leading space is meaningful in `git status --porcelain` output.
  return { ok: r.status === 0, out: (r.stdout || '').replace(/\s+$/, ''), err: (r.stderr || '').trim() };
}

export function turnNumbers(epic) {
  const d = commsDir(epic);
  if (!fs.existsSync(d)) return [];
  return fs
    .readdirSync(d)
    .map((n) => /^turn-(\d+)$/.exec(n))
    .filter(Boolean)
    .map((m) => Number(m[1]))
    .sort((a, b) => a - b);
}

export function hasAllFiles(epic, turn) {
  return Object.values(FILES).every((f) => fs.existsSync(path.join(turnDir(epic, turn), f)));
}

/** Highest turn that has all three files and a row in INDEX.md. 0 if none. */
export function lastRecordedTurn(epic) {
  const indexed = new Set(readIndexRows(epic).map((r) => r.turn));
  let last = 0;
  for (const t of turnNumbers(epic)) if (indexed.has(t) && hasAllFiles(epic, t)) last = t;
  return last;
}

// ---------- parsing ----------

export function sections(text) {
  const out = {};
  let cur = null;
  for (const line of text.split('\n')) {
    const m = /^## (.+?)\s*$/.exec(line);
    if (m) {
      cur = m[1];
      out[cur] = '';
    } else if (cur !== null) out[cur] += line + '\n';
  }
  return out;
}

export function parseReview(text) {
  const verdicts = [...text.matchAll(/^\*\*Verdict:\*\*\s*(.+?)\s*$/gm)].map((m) => m[1]);
  const c = /\*\*Blocking open:\*\*\s*(\d+)\s*[·|,;-]\s*\*\*Non-blocking open:\*\*\s*(\d+)/.exec(text);
  const counts = c ? { blocking: Number(c[1]), nonBlocking: Number(c[2]) } : null;

  const findings = [];
  let cur = null;
  for (const line of text.split('\n')) {
    const h = new RegExp(`^### (${ID})\\b(.*)$`).exec(line);
    if (h) {
      cur = { id: h[1], title: h[2].replace(/^\s*[—-]\s*/, ''), severity: null, status: null, body: '' };
      findings.push(cur);
      continue;
    }
    if (/^#{2,3} /.test(line)) {
      cur = null;
      continue;
    }
    if (!cur) continue;
    cur.body += line + '\n';
    const sev = /^- \*\*Severity:\*\*\s*(Blocking|Non-blocking)\b/i.exec(line);
    if (sev) cur.severity = /^non/i.test(sev[1]) ? 'Non-blocking' : 'Blocking';
    const st = /^- \*\*Status:\*\*\s*(Open|Fixed|Withdrawn)\b/i.exec(line);
    if (st) cur.status = st[1][0].toUpperCase() + st[1].slice(1).toLowerCase();
  }

  const secs = sections(text);
  const previous = [
    ...(secs['Previous findings'] || '').matchAll(new RegExp(`^\\|\\s*(${ID})\\s*\\|\\s*(Fixed|Open|Withdrawn)\\b`, 'gim')),
  ].map((m) => ({ id: m[1], status: m[2][0].toUpperCase() + m[2].slice(1).toLowerCase() }));

  return { verdicts, counts, findings, previous, sections: secs, text };
}

export function parseCoder(text) {
  const statuses = [...text.matchAll(/^\*\*Status:\*\*\s*(.+?)\s*$/gm)].map((m) => m[1]);
  const secs = sections(text);
  const responses = [
    ...(secs['Response to findings'] || '').matchAll(new RegExp(`^\\|\\s*(${ID})\\s*\\|\\s*(Fixed|Disputed|Deferred)\\b([^|]*)\\|([^\\n]*)`, 'gim')),
  ].map((m) => ({ id: m[1], response: m[2][0].toUpperCase() + m[2].slice(1).toLowerCase(), note: (m[4] || '').replace(/\|\s*$/, '').trim() }));
  return { statuses, sections: secs, responses, text };
}

/**
 * Finding ids the coder disputed in this turn and the one before. A dispute made before the owner's last answer
 * (turns up to `sinceTurn`) does not count: after an answer the coder often cites it as the reason for a dispute.
 */
export function repeatedDisputes(epic, turn, sinceTurn = 0) {
  if (turn - 1 <= Math.max(1, sinceTurn)) return [];
  const disputed = (n) => (parseCoder(read(path.join(turnDir(epic, n), FILES.coder)) || '').responses).filter((r) => r.response === 'Disputed').map((r) => r.id);
  const before = new Set(disputed(turn - 1));
  return disputed(turn).filter((id) => before.has(id));
}

function reviewFile(epic, turn, type) {
  return path.join(turnDir(epic, turn), FILES[type]);
}

function loadReview(epic, turn, type) {
  const t = read(reviewFile(epic, turn, type));
  return t === null ? null : parseReview(t);
}

/** Severity of every finding id raised up to and including `upto` (current parsed review may be passed in). */
function severityMap(epic, type, upto, current) {
  const map = new Map();
  for (let t = 1; t < upto; t++) {
    const p = loadReview(epic, t, type);
    if (p) for (const f of p.findings) if (f.severity) map.set(f.id, f.severity);
  }
  if (current) for (const f of current.findings) if (f.severity) map.set(f.id, f.severity);
  return map;
}

/** Findings still open at the end of a review: open sections plus previous rows still Open. */
function openItems(parsed, sev, errors) {
  const byId = new Map();
  for (const r of parsed.previous) byId.set(r.id, r.status);
  for (const f of parsed.findings) byId.set(f.id, f.status);
  const out = [];
  for (const [id, status] of byId) {
    if (status !== 'Open') continue;
    const severity = sev.get(id);
    if (!severity) {
      errors.push(`finding ${id} is open but its severity is unknown (it must appear as a "### ${id}" section in the turn that raised it)`);
      continue;
    }
    out.push({ id, severity });
  }
  return out;
}

/** Findings open at the end of `turn`'s reviews (both reviewers), with severities. */
export function openAfterTurn(epic, turn) {
  const all = [];
  for (const type of ['plan', 'ui']) {
    const p = loadReview(epic, turn, type);
    if (!p) continue;
    all.push(...openItems(p, severityMap(epic, type, turn, p), []));
  }
  return all;
}

// ---------- validation ----------

const hasHeadings = (secs, names, label, errors) => {
  for (const n of names) if (!(n in secs)) errors.push(`${label}: missing section "## ${n}"`);
};

export function validateReview(epic, turn, type) {
  const label = `${epic} turn ${turn} ${FILES[type]}`;
  const file = reviewFile(epic, turn, type);
  const text = read(file);
  if (text === null) return { errors: [`${rel(file)} does not exist. The review must be written to this file; returning it in chat does not count.`] };

  const errors = [];
  const p = parseReview(text);
  const prefix = type === 'plan' ? 'PLAN' : 'UI';

  if (p.verdicts.length !== 1) errors.push(`${label}: need exactly one "**Verdict:** ..." line, found ${p.verdicts.length}`);
  else if (!VERDICTS.includes(p.verdicts[0])) errors.push(`${label}: verdict "${p.verdicts[0]}" must be one of: ${VERDICTS.join(' | ')}`);
  if (!p.counts) errors.push(`${label}: missing "**Blocking open:** N · **Non-blocking open:** M" line`);
  hasHeadings(p.sections, REQUIRED_HEADINGS[type], label, errors);

  const seen = new Set();
  for (const f of p.findings) {
    if (!f.id.startsWith(`${prefix}-${epic}-T${turn}-`)) errors.push(`${label}: new finding ${f.id} must be named ${prefix}-${epic}-T${turn}-NN`);
    if (seen.has(f.id)) errors.push(`${label}: duplicate finding ${f.id}`);
    seen.add(f.id);
    if (!f.severity) errors.push(`${label}: ${f.id} has no "- **Severity:** Blocking|Non-blocking" line`);
    if (!f.status) errors.push(`${label}: ${f.id} has no "- **Status:** Open|Fixed|Withdrawn" line`);
  }

  const open = openItems(p, severityMap(epic, type, turn, p), errors);
  const blocking = open.filter((o) => o.severity === 'Blocking').length;
  const nonBlocking = open.length - blocking;
  if (p.counts && (p.counts.blocking !== blocking || p.counts.nonBlocking !== nonBlocking)) {
    errors.push(
      `${label}: stated counts (${p.counts.blocking} blocking, ${p.counts.nonBlocking} non-blocking) do not match the findings (${blocking} blocking, ${nonBlocking} non-blocking open)`,
    );
  }
  const verdict = p.verdicts[0];
  if (verdict === 'APPROVED' && blocking > 0) errors.push(`${label}: verdict APPROVED but ${blocking} blocking finding(s) are open`);
  if (verdict === 'CHANGES REQUIRED' && blocking === 0) {
    errors.push(`${label}: verdict CHANGES REQUIRED but no blocking finding is open. Add a blocking finding or approve.`);
  }

  if (turn > 1) {
    const prev = loadReview(epic, turn - 1, type);
    if (prev) {
      const prevOpen = openItems(prev, severityMap(epic, type, turn - 1, prev), []);
      const mentioned = new Set([...p.previous.map((r) => r.id), ...p.findings.map((f) => f.id)]);
      for (const o of prevOpen) {
        if (!mentioned.has(o.id)) errors.push(`${label}: finding ${o.id} was open last turn and is not addressed in "Previous findings"`);
      }
    }
  }

  if (type === 'plan') {
    const checks = p.sections['Checks run'] || '';
    for (const c of CHECK_COMMANDS) if (!checks.includes(c)) errors.push(`${label}: "Checks run" has no row for \`${c}\``);
  }
  if (type === 'ui') {
    for (const m of text.matchAll(/`(screenshots\/[^`*\s]+\.png)`/g)) {
      if (!fs.existsSync(path.join(turnDir(epic, turn), m[1]))) errors.push(`${label}: referenced screenshot ${m[1]} does not exist in ${rel(turnDir(epic, turn))}`);
    }
    const shots = countFiles(path.join(turnDir(epic, turn), 'screenshots'), /\.png$/i);
    if (shots === 0 && !/no ui change|nothing the owner can see|no visible change/i.test(text)) {
      errors.push(`${label}: no screenshots in ${rel(turnDir(epic, turn))}/screenshots. Review the running app, or state that the epic changes nothing the owner can see.`);
    }
  }
  return { errors, parsed: p, open };
}

function countFiles(dir, re) {
  if (!fs.existsSync(dir)) return 0;
  let n = 0;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.isDirectory()) n += countFiles(path.join(dir, e.name), re);
    else if (re.test(e.name)) n++;
  }
  return n;
}

export function validateCoder(epic, turn, { strict = false } = {}) {
  const label = `${epic} turn ${turn} ${FILES.coder}`;
  const file = path.join(turnDir(epic, turn), FILES.coder);
  const text = read(file);
  if (text === null) return { errors: [`${rel(file)} does not exist`] };

  const errors = [];
  const c = parseCoder(text);
  if (c.statuses.length !== 1) errors.push(`${label}: need exactly one "**Status:** ..." line, found ${c.statuses.length}`);
  else if (!CODER_STATUSES.includes(c.statuses[0])) errors.push(`${label}: status "${c.statuses[0]}" must be one of: ${CODER_STATUSES.join(' | ')}`);
  const blocked = c.statuses[0] === 'BLOCKED - NEEDS OWNER';

  hasHeadings(c.sections, REQUIRED_HEADINGS.coder, label, errors);
  if (turn > 1) hasHeadings(c.sections, ['Response to findings'], label, errors);
  if (blocked) hasHeadings(c.sections, ['Blocker'], label, errors);

  const checks = c.sections['Checks'] || '';
  for (const cmd of CHECK_COMMANDS) {
    const row = checks.split('\n').find((l) => l.startsWith('|') && l.includes('`' + cmd + '`'));
    const cell = row ? (row.split('|')[2] || '').trim().toLowerCase() : '';
    if (!row) errors.push(`${label}: "Checks" has no row for \`${cmd}\``);
    else if (!/^(pass|fail)/.test(cell)) errors.push(`${label}: result for \`${cmd}\` must start with "pass" or "fail"`);
    else if (cell.startsWith('fail') && !blocked) errors.push(`${label}: \`${cmd}\` failed but status is READY FOR REVIEW. Fix it or report BLOCKED.`);
  }

  if (!blocked && !fs.existsSync(path.join(ROOT, 'docs', 'epic-notes', `${epic}.md`))) {
    errors.push(`${label}: docs/epic-notes/${epic}.md does not exist`);
  }

  if (turn > 1) {
    const answered = new Map(c.responses.map((r) => [r.id, r.response]));
    for (const o of openAfterTurn(epic, turn - 1)) {
      const r = answered.get(o.id);
      if (!r) errors.push(`${label}: no response to finding ${o.id} (${o.severity}) in "Response to findings"`);
      else if (r === 'Deferred' && o.severity === 'Blocking') errors.push(`${label}: blocking finding ${o.id} cannot be Deferred. Fix it or dispute it with a reason.`);
    }
  }

  if (strict && !blocked) {
    const log = git(['log', '--all', '--format=%s', `--grep=^${epic} turn ${turn}:`]);
    if (!log.out) errors.push(`${label}: no commit with a subject starting "${epic} turn ${turn}:"`);
  }
  return { errors, parsed: c };
}

export function validateSummary(epic) {
  const file = path.join(commsDir(epic), 'SUMMARY.md');
  const text = read(file);
  if (text === null) return { errors: [`${rel(file)} does not exist`] };
  const errors = [];
  const secs = sections(text);
  hasHeadings(secs, REQUIRED_HEADINGS.summary, `${epic} SUMMARY.md`, errors);
  const steps = ((secs['How to test it'] || '').match(/^\s*\d+\.\s/gm) || []).length;
  if (steps < 3) errors.push(`${epic} SUMMARY.md: "How to test it" needs numbered steps (found ${steps}, need at least 3)`);
  if (!/^\*\*Approved:\*\*/m.test(text)) errors.push(`${epic} SUMMARY.md: missing the "**Approved:** ..." line`);
  return { errors };
}

/** Everything that must hold before an epic may be approved and merged. */
export function approvalGate(epic) {
  const errors = [];
  const turn = lastRecordedTurn(epic);
  if (turn === 0) return { ok: false, turn, errors: [`${epic} has no recorded turn`] };
  const coder = validateCoder(epic, turn, { strict: true });
  const plan = validateReview(epic, turn, 'plan');
  const ui = validateReview(epic, turn, 'ui');
  errors.push(...coder.errors, ...plan.errors, ...ui.errors);
  if (coder.parsed && coder.parsed.statuses[0] !== 'READY FOR REVIEW') errors.push(`${epic} turn ${turn}: coder status is not READY FOR REVIEW`);
  for (const [name, r] of [['plan review', plan], ['UI review', ui]]) {
    const v = r.parsed && r.parsed.verdicts[0];
    if (v !== 'APPROVED') errors.push(`${epic} turn ${turn}: ${name} verdict is "${v || 'missing'}", not APPROVED`);
  }
  return { ok: errors.length === 0, turn, errors };
}

// ---------- STATUS.md, INDEX.md, owner files ----------

const statusPath = () => path.join(ROOT, 'comms', 'STATUS.md');

export function readStatus() {
  const text = read(statusPath()) || '';
  return text
    .split('\n')
    .map((l) => /^\|\s*(E\d{2})\s*\|\s*(.*?)\s*\|\s*(.*?)\s*\|\s*(.*?)\s*\|\s*(.*?)\s*\|\s*(.*?)\s*\|\s*$/.exec(l))
    .filter(Boolean)
    .map((m) => ({ id: m[1], title: m[2], status: m[3], turns: m[4], verdicts: m[5], updated: m[6] }));
}

export function setStatusRow(epic, { status, turns, verdicts }) {
  const lines = (read(statusPath()) || '').split('\n');
  const i = lines.findIndex((l) => l.startsWith(`| ${epic} |`));
  if (i < 0) throw new Error(`${epic} is not in comms/STATUS.md`);
  const cells = lines[i].split('|').slice(1, -1).map((s) => s.trim());
  if (status !== undefined) cells[2] = status;
  if (turns !== undefined) cells[3] = String(turns);
  if (verdicts !== undefined) cells[4] = verdicts;
  cells[5] = today();
  lines[i] = `| ${cells.join(' | ')} |`;
  fs.writeFileSync(statusPath(), lines.join('\n'));
}

/** Epic order, titles and dependencies from the epic table in README.md section 4. */
export function readEpicTable() {
  const text = read(path.join(ROOT, 'README.md')) || '';
  const rows = [];
  for (const l of text.split('\n')) {
    const m = /^\|\s*(E\d{2})\s*\|\s*\[(.+?)\]\(([^)]+)\)\s*\|(.*)\|(.*)\|\s*$/.exec(l);
    if (!m) continue;
    const deps = (m[5].replace(/\([^)]*\)/g, '').match(/E\d{2}/g) || []);
    rows.push({ id: m[1], title: m[2], file: m[3], deps });
  }
  return rows;
}

const INDEX_HEAD =
  '| Turn | Coder status | Plan verdict | Plan blocking | UI verdict | UI blocking | Files |\n|------|--------------|--------------|---------------|------------|-------------|-------|\n';

export function readIndexRows(epic) {
  const text = read(path.join(commsDir(epic), 'INDEX.md')) || '';
  return text
    .split('\n')
    .map((l) => /^\|\s*(\d+)\s*\|\s*(.*?)\s*\|\s*(.*?)\s*\|\s*(\d+)\s*\|\s*(.*?)\s*\|\s*(\d+)\s*\|/.exec(l))
    .filter(Boolean)
    .map((m) => ({ turn: Number(m[1]), coder: m[2], plan: m[3], planBlocking: Number(m[4]), ui: m[5], uiBlocking: Number(m[6]) }));
}

export function setIndexRow(epic, turn, { coder, plan, planBlocking, ui, uiBlocking }) {
  const p = path.join(commsDir(epic), 'INDEX.md');
  const old = (read(p) || '').split('\n').filter((l) => /^\|\s*\d+\s*\|/.test(l) && !new RegExp(`^\\|\\s*${turn}\\s*\\|`).test(l));
  const t = `turn-${pad(turn)}`;
  old.push(
    `| ${turn} | ${coder} | ${plan} | ${planBlocking} | ${ui} | ${uiBlocking} | [coder](${t}/coder.md) · [plan](${t}/plan-review.md) · [ui](${t}/ui-review.md) |`,
  );
  old.sort((a, b) => Number(/\d+/.exec(a)[0]) - Number(/\d+/.exec(b)[0]));
  fs.writeFileSync(p, `# ${epic} — Turn Index\n\n${INDEX_HEAD}${old.join('\n')}\n`);
}

function findingProblem(epic, id) {
  for (const t of turnNumbers(epic)) {
    for (const type of ['plan', 'ui']) {
      const p = loadReview(epic, t, type);
      const f = p && p.findings.find((x) => x.id === id);
      if (f) {
        const prob = /^- \*\*Problem:\*\*\s*(.+)$/m.exec(f.body);
        const need = /^- \*\*Change needed:\*\*\s*(.+)$/m.exec(f.body);
        return `${f.title}. ${prob ? prob[1] : ''}${need ? ' Needed: ' + need[1] : ''}`.trim();
      }
    }
  }
  return '(not found)';
}

export function writeNeedsInput(epic, { afterTurn, reason, decision }) {
  const open = afterTurn > 0 ? openAfterTurn(epic, afterTurn).filter((o) => o.severity === 'Blocking') : [];
  const coder = afterTurn > 0 ? parseCoder(read(path.join(turnDir(epic, afterTurn), FILES.coder)) || '') : { responses: [] };
  const rows = open.map((o) => {
    const since = /-T(\d+)-/.exec(o.id)[1];
    const resp = coder.responses.find((r) => r.id === o.id);
    return `| ${o.id} | turn ${since} | ${findingProblem(epic, o.id).replace(/\|/g, '/')} | ${resp ? `${resp.response}: ${resp.note}`.replace(/\|/g, '/') : 'no response yet'} |`;
  });
  const tried = readIndexRows(epic).map(
    (r) => `- Turn ${r.turn}: coder ${r.coder}; plan review ${r.plan} (${r.planBlocking} blocking); UI review ${r.ui} (${r.uiBlocking} blocking).`,
  );
  const body = `# ${epic} — Needs Owner Input

**Stopped after turn:** ${afterTurn}
**Reason:** ${reason}

## Decision needed

${decision}

## Open blocking findings

${rows.length ? `| Finding | Open since | Reviewer's position | Coder's position |\n|---------|------------|---------------------|------------------|\n${rows.join('\n')}` : 'None recorded.'}

## What has been tried

${tried.length ? tried.join('\n') : 'No completed turns.'}

## How to continue

Answer in the conversation, or write the answer in \`comms/${epic}/OWNER-NOTES.md\`, then run \`node harness/run-epics.mjs ${epic}\` (or \`/run-epics ${epic}\`). The turn limit restarts from the current turn.
`;
  fs.mkdirSync(commsDir(epic), { recursive: true });
  fs.writeFileSync(path.join(commsDir(epic), 'NEEDS-INPUT.md'), body);
}

/** Proposed requirement changes and questions for the owner from the final turn's reviews. */
/** Extra instructions for the UI reviewer when the model cannot see images (profile env TMTS_NO_IMAGES=1). */
export const NO_IMAGES_UI_NOTE =
  'This model cannot see images, so you cannot judge anything by eye. The owner does a final visual pass from comms/UI-PASS.md instead. ' +
  'Still capture the screenshots. Check by text everything you can: labels and wording, which states appear, element sizes and positions ' +
  '(boundingBox), computed colours and font sizes, horizontal overflow, tap target sizes, and console errors. Raise findings only for what you ' +
  'verified this way. Anything that can only be judged by looking (whether colours read clearly, spacing, alignment, overall look) goes under ' +
  '"Not verified" with the screen, state and screenshot file, and is never a finding and never a reason for BLOCKED - NEEDS OWNER.';

export function uiReviewNote(profileEnv = {}) {
  return profileEnv?.TMTS_NO_IMAGES === '1' ? NO_IMAGES_UI_NOTE : '';
}

export const UI_PASS_FILE = () => path.join(ROOT, 'comms', 'UI-PASS.md');

/**
 * Adds (or replaces) the epic's section in comms/UI-PASS.md: the owner's checklist for a final visual pass.
 * It holds the approving UI review's "Not verified" and "Screens reviewed" sections and the screenshots of that turn.
 */
export function writeUiPass(epic, turn, title = epic) {
  const p = loadReview(epic, turn, 'ui');
  if (!p) return false;
  const dir = path.join(turnDir(epic, turn), 'screenshots');
  const shots = fs.existsSync(dir) ? fs.readdirSync(dir).filter((f) => /\.(png|jpe?g)$/i.test(f)).sort() : [];
  const body = (name) => (p.sections[name] || '').trim() || 'None.';
  const section = [
    `## ${epic} — ${title}`,
    '',
    `Approved after turn ${turn}, ${today()}. Review: \`${rel(reviewFile(epic, turn, 'ui'))}\`.`,
    '',
    '### Not verified by the UI reviewer',
    '',
    body('Not verified'),
    '',
    '### Screens reviewed',
    '',
    body('Screens reviewed'),
    '',
    '### Screenshots',
    '',
    shots.length ? shots.map((f) => `- \`${rel(path.join(dir, f))}\``).join('\n') : 'None.',
    '',
  ].join('\n');

  const file = UI_PASS_FILE();
  const old = read(file) || '';
  const bySection = new Map();
  for (const chunk of old.split(/^(?=## E\d{2} )/m).slice(1)) bySection.set(chunk.slice(3, 6), chunk.trimEnd() + '\n');
  bySection.set(epic, section);
  const head = [
    '# UI pass for the owner',
    '',
    'Written by the driver when an epic is approved. One section per epic: what the UI reviewer could not check (on the local model it cannot see images, so anything judged by eye is here), the screens it reviewed, and their screenshots. Work through it as a final visual pass. Edit `planning/ui-requirements.md` for anything that should become a requirement.',
    '',
  ].join('\n');
  fs.writeFileSync(file, head + '\n' + [...bySection.keys()].sort().map((k) => bySection.get(k)).join('\n'));
  return true;
}

export function writeForOwner(epic, turn) {
  const parts = [];
  for (const [type, heading] of [['ui', 'Proposed requirement changes'], ['plan', 'Questions for the owner']]) {
    const p = loadReview(epic, turn, type);
    const body = p && (p.sections[heading] || '').trim();
    if (body && !/^none\.?$/i.test(body)) parts.push(`## ${heading} (${type === 'ui' ? 'UI reviewer' : 'plan reviewer'})\n\n${body}\n`);
  }
  const f = path.join(commsDir(epic), 'FOR-OWNER.md');
  if (!parts.length) return false;
  fs.writeFileSync(f, `# ${epic} — For the Owner\n\n${parts.join('\n')}`);
  return true;
}
