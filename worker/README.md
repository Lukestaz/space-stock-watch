# Stock Watch price Worker

Production endpoint: https://stock-watch-prices.lukestaz.workers.dev

The dashboard calls this endpoint through site/market-data.js. The user verified health and AAPL history on 17 October 2026 and subsequently reported success with the integrated dashboard. These are not exhaustive automated/browser tests or notification-delivery verification.

## Deployment

Repository Actions secrets: CLOUDFLARE_API_TOKEN, CLOUDFLARE_ACCOUNT_ID, ALPACA_KEY and ALPACA_SECRET. Never commit their values. Use a dedicated Cloudflare token with only the permissions needed for the selected account/Worker and deployment operations; do not automatically grant account-wide Admin to work around an error.

Review wrangler.jsonc before deployment. The Worker name is stock-watch-prices. Rate-limit namespace IDs 71017001 and 71017002 should not conflict with other Workers. The production workers.dev route remains enabled. preview_urls:false explicitly disables preview URLs on the next manual deployment; the configuration commit alone does not change deployed previews.

Actions > Deploy price lookup Worker > Run workflow on main runs tests, validates secrets, reports pinned Wrangler 4.150.0, deploys, installs Alpaca secrets from a temporary permission-restricted JSON file, and verifies the confirmed production endpoint. Secret files are removed on step exit. The workflow is manual only; a commit does not deploy this Worker. Bash and explicit set -euo pipefail ensure CLI/pipeline failures stop subsequent deployment steps.

The previous Wrangler 4.36.0 deployment uploaded code but failed GET /accounts/{account_id}/workers/subdomain with code 10000 for the scoped account token. Commit 6307bec upgraded the CLI and removed endpoint log scraping. On 18 October 2026, the user supplied a successful manual run log: Wrangler 4.150.0 uploaded the Worker, deployed its route/triggers, installed both Alpaca secrets, and passed the live checks. The account-subdomain error did not recur. This validates that run, not every possible token/account configuration. Future permission failures must remain failures rather than being ignored because an older endpoint works.

The deploy step reported version ID 564aa743-bfa3-4af0-ac27-a61a061d35d8 before the subsequent secret installation; the log does not establish the final version ID after secret installation. Verification returned 501 AAPL daily bars, observation 2026-10-16T23:59:00Z, and fetchedAt 2026-10-17T18:49:54.106Z. Health, allowed-origin header, price/history and timestamp assertions passed. No alert monitor or notification-delivery test was invoked by this workflow.

That run warned that preview URLs defaulted to enabled. The new explicit preview_urls:false setting still needs a subsequent deployment and verification. Wrangler advertised update 4.151.1, but the successful run used pinned 4.150.0. A punycode deprecation warning appeared during cleanup and did not fail that run.

A failed deployment may already have changed production code. Failed post-deploy checks do not automatically roll back the Worker. Initial deployment can briefly return setup-incomplete until secrets are installed.

Deploying Pages does not deploy this Worker. Changing the endpoint requires coordinated changes to site/market-data.js, the deployment workflow and verification script.

## API

- GET /health: required bindings/credentials are present. It does not call Alpaca.
- GET /v1/stock?symbol=AAPL: split-adjusted daily history and an available raw minute-close price/time.
- fetchedAt: when this snapshot was fetched.
- dataCutoff: provider query end, at least 16 minutes before fetchedAt. This is not the latest observation time.
- historyMayIncludeInProgressDay:true: the latest daily bar may be partial. The dashboard omits the current New York date from completed daily history.
- alertsActive:false: this endpoint does not enroll alerts; the separate GitHub monitor may monitor that ticker independently.

The implementation queries Alpaca SIP; it does not silently switch feeds if entitlement is unavailable. Invalid symbols, no-data responses, provider errors and rate limits are surfaced as errors. No prices are fabricated.

## Cache, security and cost

Successful responses cache for five minutes and retain their original fetchedAt. The client also reuses snapshots and preserves older validated data during failures. No provider key is sent to the browser.

CORS permits https://lukestaz.github.io. This is an origin, not a single repository path; CORS is not authentication and non-browser callers can forge Origin. The endpoint is intentionally public. Cloudflare Access would require redesigned frontend authentication.

Rate limits: 30 requests/minute/client IP and 30 cache misses/minute/Cloudflare location. These are not strict global quotas. Cache misses make provider calls, including paginated history and recent minute data. Review provider redistribution terms, account plans and costs; no paid-plan upgrade is enabled by this patch.

## Tests and verification

With Node 22, from repository root:

```sh
node --test worker/test/index.test.mjs
node --check worker/scripts/verify-deployment.mjs
```

Unit tests cover symbol/bar validation and basic denial paths, not comprehensive caching, live provider responses or browser CORS behaviour. The supplied successful Actions run passed the preceding test steps; no separate local test run is claimed.

The live verification script makes read requests to the public production endpoint and can cause normal provider calls on cache misses:

```sh
node worker/scripts/verify-deployment.mjs
```

It checks health JSON, the allowed-origin response header, AAPL history/positive price, timestamp validity/order, and the minimum 16-minute request cutoff. It allows old observations during market closures and cached fetch timestamps. It does not establish which code revision produced the response, test browser preflight/denial paths, or verify notifications.

Live checks:

```text
https://stock-watch-prices.lukestaz.workers.dev/health
https://stock-watch-prices.lukestaz.workers.dev/v1/stock?symbol=AAPL
```
