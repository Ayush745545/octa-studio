---
kind: external_dependency
name: Ollama Local AI Server
slug: ollama
category: external_dependency
category_hints:
    - vendor_identity
    - client_constraint
scope:
    - '**'
---

Local LLM server used by the AI Studio text/image/video generation endpoints. The README documents running `ollama serve` locally and pulling the `qwen2.5-coder:7b` model. Configuration is supplied through `AI_PROVIDER`, `AI_BASE_URL` (default `http://localhost:11434/v1`), and `AI_MODEL` environment variables. It is optional — the app can run without it, but AI features require an Ollama instance listening on the configured base URL.