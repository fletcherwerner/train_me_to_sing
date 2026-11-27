#!/usr/bin/env node
// PII and security scan. README.md, section 5 "PII and security scan".
//
//   node harness/scan.mjs                 staged changes (what `git commit` would commit)
//   node harness/scan.mjs --uncommitted   staged, unstaged and untracked changes
//   node harness/scan.mjs --range main..epic/E17   a branch's diff and commit emails
//   node harness/scan.mjs --push          main's commits not yet on origin/main (run before `git push`)
//   node harness/scan.mjs --all           every tracked file
//
// Exit codes: 0 clean, 3 findings, 1 could not run.

import { scan, formatFindings, SCAN_HELP } from './lib/scan.mjs';
import { git } from './lib/comms.mjs';

const args = process.argv.slice(2);
let mode;
if (args.includes('--all')) mode = { all: true };
else if (args.includes('--uncommitted')) mode = { uncommitted: true };
else if (args.includes('--push')) {
  const base = git(['rev-parse', '--verify', '-q', 'origin/main']).ok ? 'origin/main' : null;
  if (!base) {
    console.error('No origin/main to compare with; use --all.');
    process.exit(1);
  }
  mode = { range: `${base}..HEAD` };
} else if (args.includes('--range')) {
  const r = args[args.indexOf('--range') + 1];
  if (!r) {
    console.error('--range needs a value, for example main..epic/E17');
    process.exit(1);
  }
  mode = { range: r };
} else mode = { staged: true };

const findings = scan(mode);
if (!findings.length) {
  console.log('PII and security scan: clean.');
  process.exit(0);
}
console.log(`PII and security scan: ${findings.length} finding${findings.length === 1 ? '' : 's'}.\n${formatFindings(findings)}\n\n${SCAN_HELP}`);
process.exit(3);
