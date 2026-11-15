# Plan: keep the local model's memory bounded during long runs

Status: **planned, not built.** Owner approved the approach on 2026-11-14. This file is the work order.

## Goal

`node harness/run-epics.mjs all --local` must be able to run for many hours on the 32 GB Mac without the
model server's saved-conversation cache growing until memory runs out. Three pieces:

1. A launcher for the model server that sets hard memory limits and adds a way to empty the cache.
2. The driver empties the cache after every agent.
3. The server log is saved to a file, so the peak cache size of a run can be read afterwards.

## Measured facts this plan rests on (E02 run, 2026-11-14)

| Fact | Value | Source |
|---|---|---|
| Model | `mlx-community/Qwen3.6-35B-A3B-4bit`, weights 20.4 GB | files on disk |
| mlx-lm / mlx versions | 0.32.2 / 0.32.4 | installed package |
| Cache per token | about 26 KB | server log: 3 conversations of ~12k tokens = 0.93 GB |
| Fixed prompt of one agent | 12–15k tokens | server log |
| Largest agent (turn 1 coder) | 35k tokens average per request, about 55k at its end (estimate), so about 1.4 GB per saved copy | driver log: 3.57M tokens over 102 steps |
| Time to re-read the fixed prompt | well under a minute | server log: ~40k tokens in 37 s |
| Agent run times | 6–51 min | driver logs |
| Swap during E02 | grew from 1.1 GB to 6.3 GB | `sysctl vm.swapusage` |
| GPU memory limit (Metal) | 26.8 GB | measured earlier |

Not known: the peak cache size in E02 (the log was not saved), and whether `mx.clear_cache()` is safe to
call from an HTTP thread while the generation thread is idle (see "Risks").

Findings in the installed `mlx_lm/server.py` (0.32.2) that shape the design:

- `run()` builds the cache as `LRUPromptCache(cli_args.prompt_cache_size)`. It does **not** pass
  `max_bytes`, so `--prompt-cache-bytes` is only applied in the batched path (`trim_to` near line 886),
  not when a conversation is saved in the sequential path (near line 1145). The byte limit is therefore
  not a dependable cap as shipped.
- `LRUPromptCache.__init__(max_size, max_bytes)` already enforces `max_bytes` on every insert when it is
  given one. `trim_to(n_sequences=0)` empties the cache.
- `APIHandler.do_POST` rejects unknown paths; `do_GET` serves `/v1/models` and `/health`.
- There is no flush endpoint.

## Values to establish

| Setting | Value | Why |
|---|---|---|
| MLX memory limit | 26 GB | just under the 26.8 GB Metal limit; must be above the 20.4 GB weights |
| MLX buffer-pool limit | 1 GB | freed buffers are returned instead of being kept |
| `--prompt-cache-size` | 8 | **Corrected 2026-11-15.** First planned as 2, from the two entries seen in E02's log. Wrong: each conversation leaves up to three entries and side requests leave more, and the server evicts the full conversation first, so at 2 nothing was reused (E03 read 40–60k tokens per step). Memory is bounded by the byte limit, not this count |
| `--prompt-cache-bytes` | 4 GB (`4000000000`) | two copies of the largest agent are about 3 GB |
| `--prefill-step-size` | 512 | already in use; avoids the prefill memory spike |
| `--prompt-concurrency`, `--decode-concurrency` | 1 | already in use |
| Purge | after every agent | costs seconds against agents that run for minutes |

`--kv-bits` is left off: untested on this model and not needed if the purge works.

## Work

### 1. `harness/local/qwen_server.py` (new)

A thin wrapper around `mlx_lm.server`. Run with the mlx-lm tool's own interpreter
(`~/.local/share/uv/tools/mlx-lm/bin/python`). It must:

- Call `mx.set_memory_limit(...)` and `mx.set_cache_limit(...)` before the model loads. Take the values
  from env `TMTS_MLX_MEMORY_GB` (default 26) and `TMTS_MLX_BUFFER_GB` (default 1). Print the values used.
- Replace `mlx_lm.server.LRUPromptCache` with a factory that constructs the real class with
  `max_bytes` taken from `--prompt-cache-bytes` (read it from `sys.argv` with the server's own
  `_parse_size`; if the flag is absent, no byte limit) and keeps a module-level reference to the instance.
- Wrap `APIHandler.do_POST` so that `POST /flush` is handled before the original method: record
  sequences and bytes, call `trim_to(n_sequences=0)`, `gc.collect()`, `mx.clear_cache()`, log one line
  (`Flush: N sequences, X GB released`) and answer `200` with JSON
  `{"sequences_before", "bytes_before", "sequences_after", "bytes_after"}`. Every other path goes to the
  original method unchanged.
- Then call `mlx_lm.server.main()`.

Keep it small and defensive: if an attribute it patches is missing (a different mlx-lm version), exit
with a clear message naming the version rather than starting an unprotected server.

### 2. `harness/local/start-qwen.sh` (new, executable)

Same environment as the owner's `/Volumes/ExternalSSD/models/start-qwen.sh` (drive check, `HF_HOME`,
`HF_HUB_OFFLINE=1`, `HF_HUB_DISABLE_TELEMETRY=1`, model, host, port). Do not edit the owner's script.
It runs the launcher with the values in the table above as defaults, passes extra arguments on (a later
flag overrides an earlier one), and saves output with
`2>&1 | tee -a "$REPO/.driver-logs/qwen-server.log"` (`.driver-logs/` is already ignored by git; create
the folder if missing). Print the log path at start.

### 3. Driver purge

- `harness/profiles/local.json`: add `"flushUrl": "http://127.0.0.1:8080/flush"`. The purge goes straight
  to the model server, not through the proxy.
- `harness/lib/profile.mjs`: `loadProfile` returns `flushUrl`; add `flushCache(profile, timeoutMs)` that
  POSTs to it and returns the parsed JSON, or `null` with a reason if the URL is unset or the call fails.
- `harness/run-epics.mjs`: after every agent session ends (success, failure or rejection, so in a
  `finally`), call `flushCache` and log one line, for example
  `E03 T1 coder: cache emptied (2 conversations, 2.91 GB)`. A failed purge is a warning, never a stop;
  on a 404 say once that the server was not started with `harness/local/start-qwen.sh`. Do not purge
  while another agent is running: when reviews run in parallel (`serialReviews` false), purge once after
  both finish.
- `harness/test/harness.test.mjs`: test `flushCache` against a throwaway local HTTP server (success,
  404, unreachable, no `flushUrl`). Run `npm run test:harness`; all tests must pass.

### 4. README (root `README.md` only)

- Section 1, "Running on the local model": replace the start instructions with the three-terminal
  sequence below; replace the "Memory on a 32 GB Mac" guidance with the values table, what each does in
  one line, how to read `Prompt Cache:` and `Flush:` lines, where the log is, and what to do if the
  server still dies (restart with the script, rerun the same driver command).
- Section 6, "Harness files": list `harness/local/qwen_server.py`, `harness/local/start-qwen.sh`, and the
  `flushUrl` profile field.
- Section 5 if the "how the rules are enforced" text lists hook behaviour: mention that the local profile
  blocks image reads (`TMTS_NO_IMAGES`), added earlier and not yet documented. Check first; add only if
  missing.

### 5. Verify (needs the owner for the restart)

1. `python -m py_compile` on the launcher; `bash -n` on the script; `npm run test:harness`.
2. Ask the owner to stop the running model server (Ctrl-C in its terminal) and start
   `harness/local/start-qwen.sh`. Do not kill the owner's processes.
3. `curl -s -X POST http://127.0.0.1:8080/flush` returns JSON; the server terminal shows the `Flush:` line.
4. Send two preflight-sized requests (reuse `checkModel`), confirm `Prompt Cache:` shows them, flush,
   confirm the count is 0 and that `top -pid <server>` memory drops back towards the weights' size.
   If memory does not drop, record that in the README and switch the driver's purge to the fallback in
   "Risks".
5. Send a request after the flush to confirm the server still generates.

## Commands the owner will run once this is built

```
# Terminal A: stop the old model server with Ctrl-C first
/Users/fletcherwerner/dev/train_me_to_sing/harness/local/start-qwen.sh

# Terminal B
/Volumes/ExternalSSD/models/start-proxy.sh

# Terminal C
cd /Users/fletcherwerner/dev/train_me_to_sing
caffeinate -i node harness/run-epics.mjs all --local
```

To change a value for one run: `TMTS_MLX_MEMORY_GB=25 harness/local/start-qwen.sh --prompt-cache-bytes 3000000000`.

## Risks and fallbacks

- **Flush from the HTTP thread.** The cache is used by the generation thread. The driver only purges
  when no agent is running, so there is no request in flight, but `mx.clear_cache()` from another thread
  is unverified. If step 5.4 or 5.5 fails or the server crashes on flush, fall back to: flush only trims
  the cache (`trim_to`), without `mx.clear_cache()`, and rely on the 1 GB buffer limit; if that is still
  not enough, have the driver stop for the owner with a "restart the model server" message between epics.
- **Memory limit too tight.** If the model fails to load or prefill fails at 26 GB, raise
  `TMTS_MLX_MEMORY_GB` towards 26.8 and note the working value in the README.
- **mlx-lm upgrade.** The launcher patches internals of 0.32.2. It must fail loudly on a version where
  the names differ.

## Out of scope

Editing the owner's scripts under `/Volumes/ExternalSSD/models/`, `--kv-bits`, automatic restart of the
server by the driver, and any change to the agents or the review rules.
