#!/usr/bin/env node
// Checks that the local model server reuses its saved conversations (see README.md, section 1).
// Sends one conversation that grows over several requests, the way an agent's does, with a short unrelated
// request (a different prompt, like Claude Code's own side requests) between steps, and prints how many
// prompt tokens each request had to read afresh. After the first request that number should be small.
// Usage: node harness/local/cache-check.mjs [--url=http://127.0.0.1:8080]

const base = (process.argv.find((a) => a.startsWith('--url='))?.slice(6) || 'http://127.0.0.1:8080').replace(/\/$/, '');
const MODEL = 'mlx-community/Qwen3.6-35B-A3B-4bit';
const filler = (tokens, tag) => Array.from({ length: Math.ceil(tokens / 12) }, (_, i) => `Note ${tag}-${i}: the tuner shows cents.`).join(' ');

async function ask(messages) {
  const res = await fetch(`${base}/v1/chat/completions`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ model: MODEL, messages, max_tokens: 24, temperature: 0 }),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${(await res.text()).slice(0, 200)}`);
  return res.json();
}

try {
  await fetch(`${base}/flush`, { method: 'POST' }); // start from an empty cache; ignored if the endpoint is missing
  const messages = [{ role: 'system', content: `You are a test agent. Answer in one short sentence.\n${filler(8000, 'sys')}` }];
  const rows = [];
  for (let step = 1; step <= 5; step++) {
    messages.push({ role: 'user', content: `Step ${step}. ${filler(3000, `s${step}`)}\nSay OK.` });
    const t = Date.now();
    const j = await ask(messages);
    const total = j.usage.prompt_tokens;
    const cached = j.usage.prompt_tokens_details?.cached_tokens ?? 0;
    rows.push({ step, total, cached, fresh: total - cached, seconds: Math.round((Date.now() - t) / 1000) });
    messages.push({ role: 'assistant', content: j.choices[0].message.content ?? '' });
    await ask([{ role: 'system', content: `Side task ${step}. Reply with one word.` }, { role: 'user', content: `Name a colour. ${filler(1500, `side${step}`)}` }]);
  }
  console.log('step  prompt  reused  read-afresh  seconds');
  for (const r of rows) console.log(`${String(r.step).padStart(4)}  ${String(r.total).padStart(6)}  ${String(r.cached).padStart(6)}  ${String(r.fresh).padStart(11)}  ${String(r.seconds).padStart(7)}`);
  const later = rows.slice(1);
  const ok = later.every((r) => r.fresh < r.total * 0.5);
  console.log(ok ? '\nOK: later steps reuse the saved conversation.' : '\nPROBLEM: later steps read most of the prompt again, so the saved conversation is being evicted. Check --prompt-cache-size (it must be at least 4).');
  process.exit(ok ? 0 : 1);
} catch (e) {
  console.error(`Could not run the check against ${base}: ${e.message}`);
  process.exit(2);
}
