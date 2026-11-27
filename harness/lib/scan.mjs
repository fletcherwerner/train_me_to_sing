// PII and security scan. Run on every commit (the guard hook, before an agent's `git commit`, and the
// driver's own commits), on each coder turn, and on the whole epic before it is merged into main.
// See README.md, section 5 "PII and security scan".
//
// It looks only at what is being added: added lines of a diff, new file names, and commit author and
// committer emails. Findings are printed redacted, so a secret never reaches a log or a report.

import fs from 'node:fs';
import path from 'node:path';
import { ROOT, git } from './comms.mjs';

// ---------- rules ----------

/** Secrets. Never allowed inline; a false positive goes in harness/scan-allow.json. */
const SECRET_RULES = [
  { id: 'private-key', re: /-----BEGIN [A-Z ]*PRIVATE KEY-----/ },
  { id: 'aws-key', re: /\b(?:AKIA|ASIA)[0-9A-Z]{16}\b/ },
  { id: 'github-token', re: /\b(?:gh[pousr]_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{40,})\b/ },
  { id: 'anthropic-key', re: /\bsk-ant-[A-Za-z0-9_-]{20,}/ },
  { id: 'api-key', re: /\bsk-(?!ant-)(?:proj-|live-)?[A-Za-z0-9_-]{24,}/ },
  { id: 'stripe-key', re: /\b[rs]k_live_[A-Za-z0-9]{20,}/ },
  { id: 'slack-token', re: /\bxox[abposr]-[A-Za-z0-9-]{10,}/ },
  { id: 'google-api-key', re: /\bAIza[0-9A-Za-z_-]{35}\b/ },
  { id: 'jwt', re: /\beyJ[A-Za-z0-9_-]{10,}\.eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/ },
  { id: 'npm-token', re: /_authToken\s*=\s*[^\s$]{8,}|\bnpm_[A-Za-z0-9]{36}\b/ },
  { id: 'bearer-token', re: /\bBearer\s+[A-Za-z0-9._~+/-]{24,}=*/ },
  {
    id: 'credential-assignment',
    // key = "value" / key: 'value' with a long, non-placeholder value
    re: /\b(?:api[_-]?key|secret|client[_-]?secret|password|passwd|access[_-]?token|auth[_-]?token)\b["']?\s*[:=]\s*["']([^"'\s]{12,})["']/i,
    ignore: (m) => /^(?:x+|\*+|\.+|<[^>]*>|\$\{[^}]*\}|process\.env.*|your[-_].*|example.*|placeholder.*|changeme.*|test[-_]?.*|dummy.*|fake.*)$/i.test(m[1]),
  },
];

const ALLOWED_EMAIL = [
  /@users\.noreply\.github\.com$/i,
  /^noreply@anthropic\.com$/i,
  /@(?:[a-z0-9-]+\.)*example\.(?:com|org|net)$/i,
  /@[a-z0-9.-]+\.(?:test|invalid|example|localhost)$/i,
];
/** A name@2x.png-style image file, not an email. */
const FILE_LIKE = /\.(?:png|jpe?g|gif|webp|svg|ico|pdf|json|js|ts|tsx|css|md|html?)$/i;

/** PII. A line can opt out with an inline `scan-allow: <reason>` comment. */
const PII_RULES = [
  {
    id: 'email',
    re: /[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}/g,
    ignore: (m) => FILE_LIKE.test(m[0]) || ALLOWED_EMAIL.some((r) => r.test(m[0])),
  },
  {
    id: 'phone',
    re: /(?<![\w.:/-])(?:\+\d{1,3}[ .-]?)?\(?[2-9]\d{2}\)?[ .-]\d{3}[ .-]\d{4}(?![\w.-])/g,
    ignore: (m) => /^555[ .-]|[ .-]555[ .-]01\d\d$/.test(m[0].replace(/^\(|\)/g, '')), // 555-01xx is reserved for fiction
  },
  { id: 'ssn', re: /(?<![\d-])\d{3}-\d{2}-\d{4}(?![\d-])/g, ignore: (m) => /^(?:000|666|9\d\d)/.test(m[0]) },
  { id: 'card-number', re: /(?<![\d-])(?:\d[ -]?){13,19}(?![\d-])/g, ignore: (m) => !luhn(m[0].replace(/\D/g, '')) || /^(\d)\1+$/.test(m[0].replace(/\D/g, '')) },
  {
    id: 'home-path',
    re: /(?:\/Users\/|\/home\/|[A-Za-z]:\\Users\\)([A-Za-z0-9._-]+)/g,
    ignore: (m) => /^(?:you|me|user|username|name|runner|shared|<[^>]*>|\$\w+|\.\.\.)$/i.test(m[1]),
  },
];

function luhn(digits) {
  if (digits.length < 13 || digits.length > 19) return false;
  let sum = 0;
  for (let i = 0; i < digits.length; i++) {
    let d = Number(digits[digits.length - 1 - i]);
    if (i % 2 === 1) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
  }
  return sum % 10 === 0;
}

/** File names that should never be committed. */
const FILE_RULES = [
  { id: 'env-file', kind: 'secret', re: /(?:^|\/)\.env(?:\.[\w-]+)?$/, ignore: (f) => /\.env\.(?:example|sample|template)$/.test(f) },
  { id: 'key-file', kind: 'secret', re: /\.(?:pem|key|p8|p12|pfx|keystore|jks|ppk|mobileprovision)$|(?:^|\/)id_(?:rsa|dsa|ecdsa|ed25519)(?:\.pub)?$|(?:^|\/)\.litellm-key$/i },
  { id: 'credentials-file', kind: 'secret', re: /(?:^|\/)(?:credentials|secrets?|service-account)[\w.-]*\.json$|(?:^|\/)\.netrc$|(?:^|\/)\.npmrc$/i },
  // A voice recording is personal data. The app never needs one in the repository.
  { id: 'audio-recording', kind: 'pii', re: /\.(?:wav|webm|m4a|mp3|ogg|oga|opus|caf|aac|flac|aiff?|mp4|mov)$/i },
  // A student's exported or saved progress (E10 export, E16 progress.json, S01 profile files).
  { id: 'student-data', kind: 'pii', re: /(?:^|\/)(?:train-me-to-sing-\d{4}-\d{2}-\d{2}\.json|progress(?:-[\w-]+)?\.json|progress\.json\.tmp)$|^profiles\// },
];

const INLINE_ALLOW = /scan-allow:\s*\S/;

// ---------- allow list and owner terms ----------

/**
 * harness/scan-allow.json: [{ "rule": "email", "path": "src/foo.test.ts", "match": "a@b.example.com", "reason": "..." }].
 * `rule` is a rule id, or "*" for every rule; `path` is an exact path or a prefix ending in "/";
 * `match` (optional) must appear in the matched text.
 * Only the owner edits it (harness/ is owner-only for agents).
 */
export function loadAllow(root = ROOT) {
  try {
    const list = JSON.parse(fs.readFileSync(path.join(root, 'harness', 'scan-allow.json'), 'utf8'));
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

/**
 * The owner's own words to keep out of the repository (personal email, phone, address, other people's names),
 * one per line, in .git/info/pii-terms. That file is inside .git, so it is never committed or pushed.
 */
export function loadOwnerTerms(root = ROOT) {
  const file = process.env.TMTS_PII_TERMS || path.join(root, '.git', 'info', 'pii-terms');
  try {
    return fs
      .readFileSync(file, 'utf8')
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l && !l.startsWith('#'));
  } catch {
    return [];
  }
}

const allowed = (allow, rule, file, text) =>
  allow.some((a) => (a.rule === rule || a.rule === '*') && (!a.path || (a.path.endsWith('/') ? file.startsWith(a.path) : file === a.path)) && (!a.match || text.includes(a.match)));

// ---------- redaction ----------

/** Enough to find it, never enough to use it: "sk-a…(51 chars)", "j…@g…l.com". */
export function redact(text, rule) {
  if (rule === 'email') {
    const [user, domain] = text.split('@');
    const tld = domain.slice(domain.lastIndexOf('.'));
    return `${user[0]}…@${domain[0]}…${tld}`;
  }
  if (rule === 'home-path') return text.replace(/(Users[\\/]|home\/).*/, '$1…');
  if (rule === 'owner-term') return `${text[0]}…(${text.length} chars)`;
  return `${text.slice(0, 4)}…(${text.length} chars)`;
}

// ---------- scanning ----------

/**
 * Scans one line. Returns findings { file, line, rule, kind, excerpt }.
 * `opts.allow` is the allow list, `opts.terms` the owner's terms.
 */
export function scanLine(text, file, line, opts = {}) {
  const allow = opts.allow || [];
  const terms = opts.terms || [];
  const out = [];
  const add = (rule, kind, hit) => {
    if (allowed(allow, rule, file, hit)) return;
    out.push({ file, line, rule, kind, excerpt: redact(hit, rule) });
  };
  for (const r of SECRET_RULES) {
    const m = text.match(r.re);
    if (m && !(r.ignore && r.ignore(m))) add(r.id, 'secret', m[0]);
  }
  const inlineOk = INLINE_ALLOW.test(text);
  for (const r of PII_RULES) {
    if (inlineOk) break;
    for (const m of text.matchAll(r.re)) {
      if (r.ignore && r.ignore(m)) continue;
      add(r.id, 'pii', m[0]);
    }
  }
  const lower = text.toLowerCase();
  for (const t of terms) if (lower.includes(t.toLowerCase())) add('owner-term', 'pii', t); // never inline-allowed
  return out;
}

export function scanFileName(file, opts = {}) {
  const out = [];
  for (const r of FILE_RULES) {
    if (r.re.test(file) && !(r.ignore && r.ignore(file)) && !allowed(opts.allow || [], r.id, file, file)) {
      out.push({ file, line: 0, rule: r.id, kind: r.kind, excerpt: path.basename(file) });
    }
  }
  return out;
}

/** Scans the added lines and new files of a unified diff (`git diff -U0 --no-color`). */
export function scanDiff(diff, opts = {}) {
  const out = [];
  let file = null;
  let line = 0;
  for (const raw of diff.split('\n')) {
    if (raw.startsWith('diff --git ')) {
      file = null;
      continue;
    }
    if (raw.startsWith('+++ ')) {
      file = raw === '+++ /dev/null' ? null : raw.slice(4).replace(/^b\//, '').replace(/^"|"$/g, '');
      if (file) out.push(...scanFileName(file, opts));
      continue;
    }
    if (raw.startsWith('Binary files ') && raw.includes(' and b/')) {
      const f = raw.slice(raw.indexOf(' and b/') + 7).replace(/ differ$/, '');
      out.push(...scanFileName(f, opts));
      continue;
    }
    const hunk = raw.match(/^@@ -\d+(?:,\d+)? \+(\d+)(?:,\d+)? @@/);
    if (hunk) {
      line = Number(hunk[1]);
      continue;
    }
    if (!file) continue;
    if (raw.startsWith('+')) {
      out.push(...scanLine(raw.slice(1), file, line, opts));
      line++;
    } else if (!raw.startsWith('-') && !raw.startsWith('\\')) line++;
  }
  return out;
}

/** Author and committer emails must be GitHub noreply (or Anthropic's noreply on a trailer). */
export function scanIdentities(lines, opts = {}) {
  const out = [];
  for (const l of lines) {
    const [sha, ...emails] = l.split(' ');
    for (const e of new Set(emails.filter(Boolean))) {
      if (ALLOWED_EMAIL.slice(0, 2).some((r) => r.test(e))) continue;
      if (allowed(opts.allow || [], 'commit-email', '', e)) continue;
      out.push({ file: `commit ${sha.slice(0, 7)}`, line: 0, rule: 'commit-email', kind: 'pii', excerpt: e.includes('@') ? redact(e, 'email') : e });
    }
  }
  return out;
}

const DIFF = ['-U0', '--no-color', '--no-ext-diff', '--diff-filter=ACMR', '-M'];

/**
 * Runs a scan.
 *   { staged: true }       what `git commit` would commit now
 *   { uncommitted: true }  staged, unstaged and untracked changes (for a `git add ... && git commit` line)
 *   { range: 'a..b' }      the diff and the commit identities of a range
 *   { all: true }          every line of every tracked file
 */
export function scan(mode, root = ROOT) {
  const opts = { allow: loadAllow(root), terms: loadOwnerTerms(root) };
  const run = (args) => git(args, { cwd: root, maxBuffer: 256 * 1024 * 1024 });
  const findings = [];
  if (mode.staged || mode.uncommitted) {
    const head = run(['rev-parse', '--verify', '-q', 'HEAD']).ok;
    const diff = mode.uncommitted && head ? run(['diff', 'HEAD', ...DIFF]) : run(['diff', '--cached', ...DIFF]);
    findings.push(...scanDiff(diff.out, opts));
    if (mode.uncommitted) {
      for (const f of run(['ls-files', '--others', '--exclude-standard']).out.split('\n').filter(Boolean)) {
        findings.push(...scanFileName(f, opts));
        findings.push(...scanFileContent(path.join(root, f), f, opts));
      }
    }
  } else if (mode.range) {
    // Three dots: only what the branch adds since it left the base, not the base's own later changes.
    const diffRange = mode.range.includes('...') ? mode.range : mode.range.replace('..', '...');
    findings.push(...scanDiff(run(['diff', diffRange, ...DIFF]).out, opts));
    const ids = run(['log', '--format=%H %ae %ce', mode.range]).out.split('\n').filter(Boolean);
    findings.push(...scanIdentities(ids, opts));
  } else if (mode.all) {
    for (const f of run(['ls-files']).out.split('\n').filter(Boolean)) {
      findings.push(...scanFileName(f, opts));
      findings.push(...scanFileContent(path.join(root, f), f, opts));
    }
  }
  return findings;
}

function scanFileContent(abs, file, opts) {
  let buf;
  try {
    const st = fs.statSync(abs);
    if (!st.isFile() || st.size > 5 * 1024 * 1024) return [];
    buf = fs.readFileSync(abs);
  } catch {
    return [];
  }
  if (buf.includes(0)) return []; // binary
  if (file === 'package-lock.json') return []; // registry URLs and hashes only
  const out = [];
  buf.toString('utf8').split('\n').forEach((l, i) => out.push(...scanLine(l, file, i + 1, opts)));
  return out;
}

export function formatFindings(findings) {
  return findings.map((f) => `${f.kind === 'secret' ? 'SECRET' : 'PII'} ${f.rule}: ${f.file}${f.line ? `:${f.line}` : ''} (${f.excerpt})`).join('\n');
}

export const SCAN_HELP = [
  'How to fix:',
  '- Remove the value. Use an environment variable for a secret, and example.com addresses or 555-01xx numbers in tests.',
  '- A real PII false positive: add `scan-allow: <reason>` to that line (not for secrets).',
  '- A secret false positive, or a file that must be committed: the owner adds an entry to harness/scan-allow.json.',
  '- Already committed on an epic branch: the value is in history. Ask the owner; it must be removed from the branch before the merge.',
].join('\n');
