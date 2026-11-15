#!/usr/bin/env node
// Starts and stops the dev server for UI reviews on a port that is free, and records its address.
//
//   node harness/dev-server.mjs start   start (or reuse) the server, print its address
//   node harness/dev-server.mjs url     print the address of the running server
//   node harness/dev-server.mjs stop    stop the server this tool started (never anyone else's)
//
// Port 5173 is used when free; otherwise a free port is chosen, so a server the owner already has on 5173 is not
// disturbed and not mistaken for the reviewed one. Scripts get the address from harness/lib/app-url.mjs.

import fs from 'node:fs';
import https from 'node:https';
import net from 'node:net';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { URL_FILE, PID_FILE } from './lib/app-url.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const LOG_FILE = path.join(ROOT, '.driver-logs', 'dev-server.log');

const alive = (pid) => {
  try { process.kill(pid, 0); return true; } catch { return false; }
};
const readPid = () => Number(fs.existsSync(PID_FILE) ? fs.readFileSync(PID_FILE, 'utf8').trim() : 0) || 0;

/** True if something already listens on the port on either loopback address (Vite binds [::1] or 127.0.0.1). */
function portBusy(port) {
  return Promise.all(
    ['127.0.0.1', '::1'].map(
      (host) =>
        new Promise((resolve) => {
          const s = net.createServer();
          s.once('error', (e) => resolve(e.code === 'EADDRINUSE'));
          s.once('listening', () => s.close(() => resolve(false)));
          s.listen(port, host);
        }),
    ),
  ).then((r) => r.some(Boolean));
}

async function freePort() {
  if (!(await portBusy(5173))) return 5173;
  return new Promise((resolve, reject) => {
    const s = net.createServer();
    s.once('error', reject);
    s.listen(0, '127.0.0.1', () => {
      const { port } = s.address();
      s.close(() => resolve(port));
    });
  });
}

/** Answers once the server serves the page (self-signed certificate accepted). */
function responds(url) {
  return new Promise((resolve) => {
    const req = https.get(url, { rejectUnauthorized: false, timeout: 2000 }, (res) => {
      res.resume();
      resolve(res.statusCode < 500);
    });
    req.on('error', () => resolve(false));
    req.on('timeout', () => { req.destroy(); resolve(false); });
  });
}

function forget() {
  for (const f of [URL_FILE, PID_FILE]) fs.rmSync(f, { force: true });
}

async function start() {
  const pid = readPid();
  if (pid && alive(pid) && fs.existsSync(URL_FILE)) {
    const url = fs.readFileSync(URL_FILE, 'utf8').trim();
    if (await responds(url)) return console.log(url);
  }
  if (pid && alive(pid)) process.kill(-pid, 'SIGTERM'); // a server of ours that no longer answers
  forget();

  fs.mkdirSync(path.dirname(LOG_FILE), { recursive: true });
  const port = await freePort();
  const out = fs.openSync(LOG_FILE, 'w');
  const child = spawn(path.join(ROOT, 'node_modules', '.bin', 'vite'), ['--port', String(port), '--strictPort'], {
    cwd: ROOT,
    detached: true, // its own process group, so `stop` can end it and anything it started
    stdio: ['ignore', out, out],
  });
  child.unref();
  const url = `https://localhost:${port}`;

  const deadline = Date.now() + 90_000;
  while (Date.now() < deadline) {
    if (!alive(child.pid)) {
      forget();
      console.error(`The dev server exited before it was ready. See ${path.relative(ROOT, LOG_FILE)}.`);
      process.exit(1);
    }
    if (await responds(url)) {
      fs.writeFileSync(PID_FILE, String(child.pid));
      fs.writeFileSync(URL_FILE, url);
      return console.log(url);
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  try { process.kill(-child.pid, 'SIGTERM'); } catch { /* gone */ }
  forget();
  console.error(`The dev server did not answer within 90 seconds. See ${path.relative(ROOT, LOG_FILE)}.`);
  process.exit(1);
}

function stop() {
  const pid = readPid();
  if (pid && alive(pid)) {
    try { process.kill(-pid, 'SIGTERM'); } catch { try { process.kill(pid, 'SIGTERM'); } catch { /* gone */ } }
    console.log(`Stopped the dev server (pid ${pid}).`);
  } else {
    console.log('No dev server of ours is running.');
  }
  forget();
}

const cmd = process.argv[2];
if (cmd === 'start') await start();
else if (cmd === 'stop') stop();
else if (cmd === 'url') console.log(fs.existsSync(URL_FILE) ? fs.readFileSync(URL_FILE, 'utf8').trim() : 'not running');
else {
  console.error('Usage: node harness/dev-server.mjs start|stop|url');
  process.exit(1);
}
