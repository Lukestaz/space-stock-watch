# Stock Watch price Worker

Production endpoint: https://stock-watch-prices.lukestaz.workers.dev

The dashboard now calls this endpoint through site/market-data.js. The user verified health and AAPL history on 17 October 2026 and subsequently reported success with the integrated dashboard. Do not treat this as exhaustive automated/browser testing or notification-delivery verification.

## Deployment

Repository Actions secrets: CLOUDFLARE_API_TOKEN, CLOUDFLARE_ACCOUNT_ID, ALPACA_KEY and ALPACA_SECRET. Never commit their values. Use a dedicated Cloudflare token with only the permissions needed for the selected account/Worker and deployment operations; do not automatically grant account-wide Admin to work around an error.

Review wrangler.jsonc before deployment. The Worker name is stock-watch-prices. Rate-limit namespace IDs 71017001 and 71017002 should not conflict with other Workers.

Actions > Deploy price lookup Worker > Run workflow runs tests, checks secrets, deploys, installs server-side Alpaca secrets and performs health/AAPL checks. It is manual only. A failed post-deploy check does not automatically roll back the deployed Worker. Initial deployment can briefly return setup-incomplete until secrets are installed.

Known issue in the current workflow: Wrangler 4.36.0 uploaded code but failed GET /accounts/{account_id}/workers/subdomain with code 10000 for the scoped account token. Secret installation succeeded and the production endpoint was verified independently. The log-scraped URL check consequently failed. Update/test the CLI and token compatibility before broadening permissions; explicitly enable Bash pipefail and use the confirmed production URL for verification in a follow-up patch. These fixes are not included in this documentation change.

Deploying Pages does not deploy this Worker. Changing the endpoint also requires updating site/market-data.js.

## API

- GET /health: required bindings/credentials are present. It does not call Alpaca.
- GET /v1/stock?symbol=AAPL: split-adjusted daily history and an available raw minute-close price/time.
- fetchedAt: when this snapshot was fetched.
- dataCutoff: provider query end, at least 16 minutes before fetchedAt. This is not the latest observation time.
- historyMayIncludeInProgressDay:true: the latest daily bar may be partial. The dashboard currently omits the current New York date from completed daily history.
- alertsActive:false: this price endpoint does not enroll alerts; the separate GitHub monitor may monitor that ticker independently.

The current implementation queries Alpaca SIP; it does not silently switch to another feed if entitlement is unavailable. Invalid symbols, no-data responses, provider errors and rate limits are surfaced as errors. No prices are fabricated.

## Cache, security and cost

Successful responses cache for five minutes and retain their original fetchedAt. The client also reuses snapshots and preserves older validated data during failures. No provider key is sent to the browser.

CORS permits https://lukestaz.github.io. This is an origin, not a single repository path; CORS is not authentication and non-browser callers can forge Origin. The endpoint is intentionally public. Enabling Cloudflare Access would require redesigning frontend authentication.

Rate limits: 30 requests/minute/client IP and 30 cache misses/minute/Cloudflare location. These are not strict global quotas. Cache misses make provider calls, including paginated history and recent minute data. Review provider redistribution terms, account plans and costs; no paid-plan upgrade is enabled by the repository setup.

## Tests

With Node 22, from repository root:

```sh
node --test worker/test/index.test.mjs
```

Current unit tests cover symbol/bar validation and basic denial paths. They do not comprehensively exercise caching, live Alpaca responses or browser CORS behaviour.

Live checks:

```text
https://stock-watch-prices.lukestaz.workers.dev/health
https://stock-watch-prices.lukestaz.workers.dev/v1/stock?symbol=AAPL
```

Check response timestamps and actual available data, not just HTTP success. A closed market can legitimately produce an old observation in a newly fetched response.
