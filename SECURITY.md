# Security Policy

## Reporting a vulnerability

Please report suspected vulnerabilities privately via
[GitHub private vulnerability reporting](https://github.com/hyperyai/hypery-examples/security/advisories/new).
Do not open a public issue for security reports.

## Policy

- These are **example apps** — run them locally with your own OAuth clients.
- This repository never contains credentials: no `.env` files (CI fails if one
  appears), no API keys, no client IDs or secrets. All configuration goes in
  your local, gitignored `.env.local`.
- Client secrets belong **only** in server-side variables (see the two
  backend-proxy examples) — never in `NEXT_PUBLIC_*`.
