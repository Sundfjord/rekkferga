# Deployment & secrets

Production runs on two services, both deploying from the `master` branch:

| Part | Host | Address | How it deploys |
|---|---|---|---|
| Web (`packages/web`) | Cloudflare Pages | `https://rekkferga.no` | Cloudflare's Git integration builds on every push |
| API (`packages/api`) | Railway (Docker) | `https://api.rekkferga.no` | `.github/workflows/api-deploy.yml` runs `railway up` |

DNS for `rekkferga.no` is on Cloudflare (the domain stays registered at GoDaddy; only its
nameservers point to Cloudflare). The only other workflow is `refresh-quays.yml`, the monthly
quay-snapshot refresh, which needs no secrets beyond the built-in `GITHUB_TOKEN`.

## GitHub repository secrets

Set under **Settings → Secrets and variables → Actions**, or with the `gh` CLI.

| Secret | Used by | Where to get it |
|---|---|---|
| `RAILWAY_TOKEN` | `api-deploy.yml` | Railway project → Settings → Tokens → create a **project token** for the production environment |
| `RAILWAY_PROJECT_ID` | `api-deploy.yml` | Railway project → Settings → General → Project ID |

```bash
gh secret set RAILWAY_TOKEN
gh secret set RAILWAY_PROJECT_ID
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

## Cloudflare Pages project

Connect the GitHub repository and use:

| Setting | Value |
|---|---|
| Production branch | `master` |
| Root directory | `packages/web` |
| Build command | `npm run build` |
| Build output directory | `out` |
| Environment variable | `NEXT_PUBLIC_API_URL` = `https://api.rekkferga.no` |

`NEXT_PUBLIC_API_URL` is inlined at build time, so changing it requires a new build. Pages
clones the whole repository, so the `../../shared` imports resolve; dependencies install from
`packages/web/package-lock.json`. Add `rekkferga.no` (and `www.rekkferga.no`) under the
project's **Custom domains**.
