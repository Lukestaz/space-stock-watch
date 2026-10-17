# Price lookup backend: preparation stage

This commit does not connect the dashboard, enable alerts, or deploy automatically.

## Setup and deploy

Add CLOUDFLARE_API_TOKEN and CLOUDFLARE_ACCOUNT_ID in repository Settings > Secrets and variables > Actions. Scope the token to the intended account with Workers Scripts Edit and permissions required for workers.dev deployment. Existing ALPACA_KEY and ALPACA_SECRET repository secrets are required too. Never commit credentials or paste them into chat.

Review wrangler.jsonc: deployment creates or updates stock-watch-prices. Rate-limit namespace IDs 71017001 and 71017002 must not conflict with other account Workers.

Run Actions > Deploy price lookup Worker > Run workflow. It runs unit tests, checks secrets, deploys, installs Alpaca credentials server-side and tests health plus AAPL price/history. A failed smoke test does not automatically roll back deployment. Initial deployment briefly returns setup-incomplete until secrets are installed.

Use the real endpoint from the successful workflow summary for a subsequent dashboard-integration commit. Do not guess its hostname. Do not switch the dashboard before live verification.

## API and limitations

GET /health checks configuration readiness, not provider availability. GET /v1/stock?symbol=AAPL returns history, raw minute-close price/time when available, fetchedAt, dataCutoff and alertsActive:false. That flag means this endpoint does not enroll notifications; it does not inspect the separate monitor configuration.

Requests end at least 16 minutes in the past. History is split-adjusted; minute prices are raw, not executable quotes. historyMayIncludeInProgressDay:true warns that the latest daily bar is not necessarily a completed close. The frontend must handle this before integration.

Responses cache for up to five minutes and retain original fetchedAt. Provider failures return an error, not invented prices. CORS permits https://lukestaz.github.io but is not authentication; non-browser callers can forge Origin. This is a public, cacheable market-data endpoint. Review provider redistribution terms and Cloudflare plan/budget before deployment. No paid plan or upgrade is enabled by this commit.

Limits are per Cloudflare location, not a strict global budget: 30 requests/minute/client IP and 30 cache misses/minute/location. Each miss makes provider requests.

Run unit tests with Node 22: node --test worker/test/index.test.mjs. These tests cover validation and basic denial paths, not live provider/cache behavior. The manual workflow provides a deployed AAPL smoke test.
