#!/usr/bin/env node
// Checks agent files against the rules in README.md section 5.
//
//   node harness/validate.mjs E01 2 coder|plan|ui|all   check one file, or all three, for a turn
//   node harness/validate.mjs E01 summary               check comms/E01/SUMMARY.md
//   node harness/validate.mjs E01 gate                  check that E01 may be approved and merged
//   add --strict to also require the coder's commit to exist
//
// Exit code 0 if everything is valid, 1 otherwise. Errors are printed one per line.

import { EPIC_RE, validateCoder, validateReview, validateSummary, approvalGate } from './lib/comms.mjs';

const args = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const strict = process.argv.includes('--strict');
const [epic, second, which = 'all'] = args;

if (!epic || !EPIC_RE.test(epic) || !second) {
  console.error('usage: node harness/validate.mjs <Exx> <turn|summary|gate> [coder|plan|ui|all] [--strict]');
  process.exit(1);
}

let errors = [];
if (second === 'summary') errors = validateSummary(epic).errors;
else if (second === 'gate') errors = approvalGate(epic).errors;
else {
  const turn = Number(second);
  if (!Number.isInteger(turn) || turn < 1) {
    console.error(`turn must be a positive number, got "${second}"`);
    process.exit(1);
  }
  if (which === 'coder' || which === 'all') errors.push(...validateCoder(epic, turn, { strict }).errors);
  if (which === 'plan' || which === 'all') errors.push(...validateReview(epic, turn, 'plan').errors);
  if (which === 'ui' || which === 'all') errors.push(...validateReview(epic, turn, 'ui').errors);
}

if (errors.length) {
  for (const e of errors) console.error(`- ${e}`);
  process.exit(1);
}
console.log('OK');
