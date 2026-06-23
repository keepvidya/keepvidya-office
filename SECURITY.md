# Security Policy

## Our model: local-first by default
Keepvidya Office stores your documents **on your device** (IndexedDB; OS keychain once packaged). There is no account, no
server, and no telemetry. AI calls to a cloud provider happen **only** when you explicitly opt in with your own key (BYOK);
otherwise nothing leaves the machine.

## Reporting a vulnerability
Please **do not** open a public issue for security problems. Email **security@keepvidya.com** with:
- a description and impact,
- steps to reproduce,
- affected version/commit.

We aim to acknowledge within 72 hours and to fix or mitigate confirmed issues promptly, crediting reporters who wish it.

## Scope
In scope: the app code in this repo (XSS via document content, insecure storage, BYOK key handling, dependency CVEs).
Out of scope (for now): the reference prototype under `prototype/`, and third-party AI providers you connect via BYOK.
