# Deployment & secrets

Production runs on two services, both deploying from the `master` branch:

| Part | Host | Address | How it deploys |
|---|---|---|---|
| Web (`packages/web`) | Cloudflare Worker (static assets) | `https://rekkferga.no` | Workers Builds (Cloudflare's Git integration) builds and deploys on every push |
| API (`packages/api`) | Railway (Docker) | `https://api.rekkferga.no` | `.github/workflows/api-deploy.yml` runs `railway up` |

DNS for `rekkferga.no` is on Cloudflare (the domain stays registered at GoDaddy; only its
nameservers point to Cloudflare). The only other workflow is `refresh-quays.yml`, the monthly
quay-snapshot refresh, which needs no secrets beyond the built-in `GITHUB_TOKEN`.

## GitHub repository secrets

Set under **Settings → Secrets and variables → Actions**, or with the `gh` CLI.

| Secret | Used by | Where to get it |
|---|---|---|
| `RAILWAY_TOKEN` | `api-deploy.yml` | Railway project → Settings → Tokens → create a **project token** for the environment the API service runs in (production). The token alone determines project and environment. |

```bash
gh secret set RAILWAY_TOKEN
```

And one repository **variable** (same page, **Variables** tab), because the Railway project
can contain more than one service:

| Variable | Used by | Value |
|---|---|---|
| `RAILWAY_SERVICE` | `api-deploy.yml` | The API service's name or ID (Railway → service → Settings) |

```bash
gh variable set RAILWAY_SERVICE --body "<service name or id>"
```

## Railway service variables

Set on the API service in Railway (not in GitHub):

| Variable | Value |
|---|---|
| `HERE_API_KEY` | HERE Routing API key (server-side only — never expose it to the web build) |
| `CORS_ORIGINS` | Optional. Comma-separated origins allowed to call the API from a browser. Unset = `https://rekkferga.no` and `https://www.rekkferga.no` only (see `app.py`). |

Do **not** set `FLASK_ENV=development` or `FLASK_DEBUG=1` on Railway: in development the API
allows requests from any origin.

Custom domain: add `api.rekkferga.no` on the service, then create the CNAME Railway shows in
Cloudflare DNS. With the record proxied, set Cloudflare SSL/TLS mode to **Full (strict)**.

## Cloudflare Worker (web app)

The web app is a Worker that only serves the static export — no server code. Its config is
`packages/web/wrangler.jsonc` (assets from `out/`, custom domains `rekkferga.no` and
`www.rekkferga.no`, plus the `*.workers.dev` address).

Create it under **Workers & Pages → Create → Import a repository** → `Sundfjord/rekkferga`:

| Setting | Value |
|---|---|
| Project name | `rekkferga` (must match `name` in `wrangler.jsonc`) |
| Build command | `npm run build` |
| Deploy command | `npx wrangler deploy` (uses the Wrangler version pinned in `packages/web/package.json`) |
| Path (advanced) | `packages/web` |
| API token | Let Cloudflare create a new one |
| Production branch | `master` (Settings → Build → Branch control) |

Build variable — **Settings → Build → Variables and secrets** (*not* the runtime
"Variables & Secrets", which the build can't see):

| Variable | Value |
|---|---|
| `NEXT_PUBLIC_API_URL` | `https://api.rekkferga.no` |

`NEXT_PUBLIC_API_URL` is inlined at build time, so changing it requires a new build. The
custom domains are created by `wrangler deploy` and need the `rekkferga.no` zone to be active on
Cloudflare with no other DNS record for those hostnames.
