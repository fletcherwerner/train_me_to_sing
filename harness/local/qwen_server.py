"""Runs mlx_lm.server with memory limits and a POST /flush endpoint (see README.md, section 1).

Patches three things in mlx-lm 0.32.x and refuses to start if they are not there:
  1. MLX memory limit and buffer-pool limit, set before the model loads.
  2. The saved-conversation cache is created with the byte limit from --prompt-cache-bytes. The shipped
     server only applies that limit in one code path.
  3. POST /flush empties the cache and returns the memory to the system.
Run it with the mlx-lm tool's own Python; harness/local/start-qwen.sh does.
"""
import gc
import json
import os
import sys

import mlx.core as mx
import mlx_lm
import mlx_lm.server as server
from mlx_lm.utils import _parse_size

SUPPORTED = "0.32."
if not mlx_lm.__version__.startswith(SUPPORTED):
    sys.exit(f"qwen_server.py was written for mlx-lm {SUPPORTED}x; found {mlx_lm.__version__}. Check the patches before running it.")
for name in ("LRUPromptCache", "APIHandler"):
    if not hasattr(server, name):
        sys.exit(f"mlx_lm.server has no {name}; qwen_server.py needs updating for mlx-lm {mlx_lm.__version__}.")

GB = 10**9
memory_gb = float(os.environ.get("TMTS_MLX_MEMORY_GB", "26"))
buffer_gb = float(os.environ.get("TMTS_MLX_BUFFER_GB", "1"))
mx.set_memory_limit(int(memory_gb * GB))
mx.set_cache_limit(int(buffer_gb * GB))


def cache_bytes_from_argv(argv):
    for i, a in enumerate(argv):
        if a == "--prompt-cache-bytes" and i + 1 < len(argv):
            return _parse_size(argv[i + 1])
        if a.startswith("--prompt-cache-bytes="):
            return _parse_size(a.split("=", 1)[1])
    return None


max_bytes = cache_bytes_from_argv(sys.argv[1:])
Original = server.LRUPromptCache
live = []  # the one cache the server creates


def make_cache(max_size=10, *rest, **kw):
    if max_bytes is not None:
        kw["max_bytes"] = max_bytes
    cache = Original(max_size, *rest, **kw)
    live.append(cache)
    return cache


server.LRUPromptCache = make_cache

original_post = server.APIHandler.do_POST


def do_post(self):
    if self.path != "/flush":
        return original_post(self)
    if not live:
        body = {"error": "no cache yet"}
        status = 503
    else:
        cache = live[0]
        before = {"sequences_before": len(cache), "bytes_before": cache.nbytes}
        cache.trim_to(n_sequences=0)
        gc.collect()
        mx.clear_cache()
        body = {**before, "sequences_after": len(cache), "bytes_after": cache.nbytes}
        status = 200
        print(f"Flush: {before['sequences_before']} sequences, {before['bytes_before'] / GB:.2f} GB released", flush=True)
    self._set_completion_headers(status)
    self.end_headers()
    self.wfile.write(json.dumps(body).encode())
    self.wfile.flush()


server.APIHandler.do_POST = do_post

limit = f"{max_bytes / GB:.1f} GB" if max_bytes is not None else "none"
print(f"qwen_server: memory limit {memory_gb} GB, buffer pool {buffer_gb} GB, cache byte limit {limit}", flush=True)
server.main()
