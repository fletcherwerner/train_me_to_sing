#!/usr/bin/env node
// PreToolUse hook. Reads the tool call as JSON on stdin; exit code 2 blocks it and
// sends stderr back to the agent. Rules are in harness/lib/rules.mjs.

import { checkWrite, checkBash, checkRead } from '../lib/rules.mjs';

let input = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', (d) => (input += d));
process.stdin.on('end', () => {
  let call;
  try {
    call = JSON.parse(input);
  } catch {
    process.exit(0); // not a call we understand; do not block
  }
  const name = call.tool_name || '';
  const args = call.tool_input || {};
  let message = null;
  if (['Write', 'Edit', 'MultiEdit', 'NotebookEdit'].includes(name)) {
    const target = args.file_path || args.notebook_path;
    if (target) message = checkWrite(target);
  } else if (name === 'Read' && typeof args.file_path === 'string') {
    message = checkRead(args.file_path);
  } else if (name === 'Bash' && typeof args.command === 'string') {
    message = checkBash(args.command);
  }
  if (message) {
    process.stderr.write(message + '\n');
    process.exit(2);
  }
  process.exit(0);
});
