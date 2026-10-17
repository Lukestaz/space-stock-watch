# Stock Watch

A mobile-friendly stock watchlist with delayed prices, interactive daily-history charts and personal entry targets. GitHub Pages hosts the dashboard; a Cloudflare Worker fetches on-demand Alpaca SIP data. A separate GitHub Actions monitor sends configured review alerts. No automatic trading.

Dashboard: https://lukestaz.github.io/stock-watch/

## Repository rename

This repository was renamed from space-stock-watch to stock-watch. Update dashboard bookmarks and home-screen shortcuts to the URL above. For an old shared watchlist URL, replace /space-stock-watch/ with /stock-watch/ and retain the complete #watch= fragment. GitHub repository redirects do not imply a redirect for the old Pages project URL.

The localStorage key space-stock-watch:v1:watchlist is intentionally retained for saved-watchlist compatibility. The HTTPS origin remains lukestaz.github.io; verify the saved list in the same browser/profile. The Cloudflare Worker URL and allowed origin do not change. The user confirmed the dashboard loads at the new URL on 17 October 2026.

## Use the dashboard

- Open the top-right menu for Add stock, Edit watchlist, Refresh data, share/copy link, reset, and monitor details.
- Manage watchlist sits below the stock cards. Set positive USD targets; Save becomes available after a valid change. Reorder with paired arrows or remove a ticker.
- Available prices and history are checked after adding a ticker. A catalogue match does not guarantee market-data availability.
- Use timeframe presets, tap or hover over the chart, or expand Chart options for dates, range sliders, panning and the target-line toggle.
- Personal targets/order are saved in this browser's localStorage. They are not account-backed settings. Unsaved target drafts are held in memory during data refresh, not persisted across a full page reload.
- Share links contain readable tickers and targets. Import previews offer Replace, Merge or Cancel. Merge uses incoming targets for duplicate symbols. These are snapshots, not continuous cross-device sync.

## Refresh and price meaning

Refresh data reloads the published monitor snapshot and checks watchlist prices. It does not reload app code, trigger the scheduled GitHub monitor, or enable notifications. Use the browser's reload to pick up deployed interface changes.

The open page checks data every 60 seconds. Successful price snapshots can be reused for five minutes in the client and Worker caches; pressing Refresh data requests the Worker again but does not bypass its cache. The status line distinguishes checks, changed observations, cached snapshots and errors. No newer observation is not the same as a failed request.

Worker requests end at least 16 minutes before fetch time. A response's fetchedAt is when it was obtained, dataCutoff is the request boundary, and time is the actual minute-close observation timestamp. Prices are delayed observations, not executable quotes. Market closures or an unchanged cached response can leave prices unchanged after a successful refresh. The overall Checked time is the app's data check; each card's Price as of time identifies its market observation, not its refresh time.

Daily history is split-adjusted; minute prices are raw. Chart dates identify US trading dates. The client conservatively excludes the current New York calendar day's daily bar from completed-close history, even after that day's close. This avoids presenting partial bars as completed sessions, but can delay the latest chart point until the next New York date.

Lookups use three concurrent requests. Rate limits, unavailable symbols or provider/network failures can produce per-ticker errors; older validated data is retained in the current session or from the published feed where available. Price snapshots are not persisted across browser restarts.

## Personal targets are not scheduled alerts

Adding a ticker or changing its personal target affects this dashboard only. It does not enroll it in email/WhatsApp monitoring.

Scheduled tickers/targets are defined separately in config/targets.json. If a personal target differs, the dashboard identifies the scheduled target separately. A price-service response with alertsActive:false means that endpoint does not enroll notifications; it is not a query of the monitor configuration.

Monitor rules:
- Near threshold: observed one-minute low at or below 105% of target. Target threshold: low at or below target.
- Gmail receives near and target review alerts; WhatsApp receives target alerts only.
- Re-arming requires closes above 107% for near and 102% for target.
- Observations older than one hour do not create alerts; pending events expire after two hours. First run may alert if already below a threshold.
- Each channel has at most three send attempts. Accepted-send status is not proof of receipt.

## Setup and deployment

Set repository Settings > Pages > Source to GitHub Actions.

Actions secrets:
- Price access: ALPACA_KEY, ALPACA_SECRET.
- Worker deployment: CLOUDFLARE_API_TOKEN, CLOUDFLARE_ACCOUNT_ID.
- Email: GMAIL_USER, GMAIL_APP_PASSWORD, ALERT_TO_EMAIL.
- WhatsApp: WHATSAPP_PHONE, WHATSAPP_API_KEY.

Use a dedicated, least-privilege Cloudflare API token for the intended account, not a Global API Key. Do not commit secrets or paste them into chat. See worker/README.md for endpoint verification and deployment caveats.

Workflows were separated in commit 183f7ab on 18 October 2026:
- Publish dashboard (.github/workflows/publish-pages.yml): manual, pushes to site/** or its own workflow on main, and successful main-branch completions of Monitor stock alerts or Refresh ticker catalogue. Checks out current main and publishes only site/. It does not run the monitor or receive alert credentials.
- Monitor stock alerts (.github/workflows/monitor.yml): manual on main and minutes 7/22/37/52 during UTC hours 13–21, Monday–Friday. Checks prices, can send real configured alerts, and commits site/data.json plus alert state. Code pushes no longer trigger it. Timing is best effort, not exchange-calendar-aware, and includes some extended hours/holidays.
- Refresh ticker catalogue (.github/workflows/catalog.yml): daily/manual and catalogue-code/workflow pushes on main. Saves public symbol/name/exchange metadata, not credentials. Successful completion hands publishing to Publish dashboard.
- Deploy price lookup Worker (.github/workflows/deploy-prices.yml): manual on main; validates secrets, runs unit tests, deploys with pinned Wrangler 4.150.0, installs provider secrets and verifies health/AAPL data, timestamp boundaries and the allowed-origin response header. Explicit Bash pipefail stops on CLI errors. Verification uses the confirmed production endpoint, not a log-scraped URL.

Monitor and catalogue runs share the stock-monitor concurrency group to serialize their repository writes. Pages publishing uses a separate stock-pages group. The publisher accepts successful workflow-run hand-offs only from this repository's main branch and checks out trusted main rather than upstream artifacts. Automatic-token commits do not themselves start push workflows; the workflow_run hand-off publishes saved data even when those commits do not trigger a push run.

README/config-only changes do not trigger Pages publishing or alert monitoring. Dashboard source changes trigger publishing, not alert monitoring. The dashboard fetch URL is configured in site/market-data.js. Worker changes require their own deployment; a Pages deployment does not deploy the Worker.

Worker preview URLs are explicitly disabled in worker/wrangler.jsonc. This setting requires a subsequent manual Worker deployment to take effect; committing the configuration does not disable currently deployed previews. The production workers.dev route remains enabled.

## Code map

- site/index.html: page shell.
- site/watchlist.js: local watchlist, imports/sharing and published-monitor separation.
- site/market-data.js: Worker lookup, validation, cache/fallback and refresh status.
- site/chart.js and site/card-headers.js: chart rendering and card metadata.
- site/navigation.js, site/compact-editor.js, site/dashboard-polish.js and site/visual-polish.js: interface enhancements.
- scripts/monitor.py: scheduled data collection, alert state and notifications.
- scripts/catalog.py: ticker metadata catalogue.
- worker/: price-service code, configuration, tests and deployment notes.
- worker/scripts/verify-deployment.mjs: live production health, data and allowed-origin header checks.

## Verification and remaining work

On 17 October 2026, the user verified Worker health and AAPL history in a browser, reported success with the integrated dashboard, and confirmed the renamed Pages URL loads. On 18 October, the user reported that the revised chart layout looks good. These are user-reported browser checks, not a full automated regression pass or proof of notification delivery.

On 18 October, the user supplied Actions results showing successful Publish dashboard #1 on push 183f7ab, Refresh ticker catalogue #5 on the same commit, and a subsequent successful Publish dashboard #2. This supports the catalogue-to-publisher hand-off, but the pasted run list did not explicitly show #2's event type.

The user also supplied the successful manual Worker run log after commit 6307bec: Wrangler 4.150.0 uploaded the Worker and deployed triggers, both Alpaca secrets installed, and live health/CORS/AAPL checks passed with 501 daily bars. The prior account-subdomain error did not recur in that run. The verification snapshot was fetched at 2026-10-17T18:49:54.106Z; its AAPL observation was 2026-10-16T23:59:00Z. No manual alert test was part of these checks.

Known low-priority issue: the user reports graph zoom/date selections reset on refresh. Preservation is not verified and this behaviour has not been fixed.

Next, in order:
1. Apply and verify preview_urls:false with a separately approved manual Worker deployment.
2. Check saved targets/order after reload; unsaved drafts during data refresh; share/import on another device; and error/fallback behaviour. Keep chart-selection reset as a low-priority follow-up.
3. Verify monitor-to-publisher hand-off after an appropriate scheduled or explicitly approved monitor run; inspect Publish dashboard #2's event details if exact catalogue hand-off attribution is needed.
4. With explicit approval, test notification receipt separately for each configured channel.

A future feature is explicit opt-in enrollment of personal dashboard targets into scheduled alerts; that connection does not exist yet.

## Security and limitations

The Worker is public and rate-limited. CORS is not authentication, and rate limits are per Cloudflare location, not a hard global spend cap. Review provider redistribution rights, symbol identity (including SPCX), API entitlement and hosting costs.

This public repository retains published price snapshots and monitor state/history. State must contain no contacts, credentials or private investment notes. Share links are not encrypted. There is no authenticated cross-device sync or personal scheduled-alert enrollment yet.

Monitor scans resume from saved timestamps, capped at seven days. Exactly-once notification delivery is not guaranteed: sending can succeed before state is committed. There are no automated failure notifications. A failed Worker deployment or post-deploy check does not automatically roll back production. Verify a current broker quote independently before making any trading decision.
