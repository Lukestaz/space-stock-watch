# Stock Watch

A mobile-friendly stock watchlist with delayed prices, interactive daily-history charts and personal entry targets. GitHub Pages hosts the dashboard; a Cloudflare Worker fetches on-demand Alpaca SIP data. A separate GitHub Actions monitor sends configured review alerts. No automatic trading.

Dashboard: https://lukestaz.github.io/stock-watch/

## Repository rename

This repository was renamed from space-stock-watch to stock-watch. Update dashboard bookmarks and home-screen shortcuts to the URL above. For an old shared watchlist URL, replace /space-stock-watch/ with /stock-watch/ and retain the complete #watch= fragment. GitHub repository redirects do not imply a redirect for the old Pages project URL.

The localStorage key space-stock-watch:v1:watchlist is intentionally retained for saved-watchlist compatibility. The HTTPS origin remains lukestaz.github.io; verify the saved list in the same browser/profile. The Cloudflare Worker URL and allowed origin do not change. Pages deployment at the new path still requires verification; this documentation-only commit does not trigger a publish.

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

Worker requests end at least 16 minutes before fetch time. A response's fetchedAt is when it was obtained, dataCutoff is the request boundary, and time is the actual minute-close observation timestamp. Prices are delayed observations, not executable quotes. Market closures or an unchanged cached response can leave prices unchanged after a successful refresh.

Daily history is split-adjusted; minute prices are raw. The client conservatively excludes the current New York calendar day's daily bar from completed-close history, even after that day's close. This avoids presenting partial bars as completed sessions, but can delay the latest chart point until the next New York date.

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

Workflows:
- Monitor and publish dashboard: manual, selected source/config/workflow pushes, and minutes 7/22/37/52 during UTC hours 13–21, Monday–Friday. Publishes only site/. Timing is best effort, not exchange-calendar-aware, and includes some extended hours/holidays. It can send real configured alerts.
- Refresh ticker catalogue: daily/manual and catalogue-code pushes; publishes public symbol/name/exchange metadata, not credentials.
- Deploy price lookup Worker: manual only; unit tests, secret-presence checks, deploy, install provider secrets and verify health/AAPL data.

A documentation-only commit does not match the monitor's publish paths. The dashboard fetch URL is configured in site/market-data.js. Worker changes require their own deployment; a Pages deployment does not deploy the Worker.

## Code map

- site/index.html: page shell.
- site/watchlist.js: local watchlist, imports/sharing and published-monitor separation.
- site/market-data.js: Worker lookup, validation, cache/fallback and refresh status.
- site/chart.js and site/card-headers.js: chart rendering and card metadata.
- site/navigation.js, site/compact-editor.js, site/dashboard-polish.js: interface enhancements.
- scripts/monitor.py: scheduled data collection, alert state and notifications.
- scripts/catalog.py: ticker metadata catalogue.
- worker/: price-service code, configuration, tests and deployment notes.

## Verification and remaining work

On 17 October 2026, the user verified Worker health and AAPL history in a browser, then reported success with the integrated dashboard. This is not a claim that a full automated browser regression suite passed or that notification delivery was verified.

Next checks: saved targets after reload; unsaved drafts during refresh; chart selections after refresh; share/import on another device; error/fallback behaviour; explicitly approved test-notification receipt.

Known deployment-workflow issue: the pinned Wrangler uploaded code/secrets but failed an account-subdomain lookup. The deploy pipeline can conceal failures without explicit Bash pipefail. Updating Wrangler, fixing pipeline failure handling and using the confirmed endpoint in verification remain follow-up work.

## Security and limitations

The Worker is public and rate-limited. CORS is not authentication, and rate limits are per Cloudflare location, not a hard global spend cap. Review provider redistribution rights, symbol identity (including SPCX), API entitlement and hosting costs.

This public repository retains published price snapshots and monitor state/history. State must contain no contacts, credentials or private investment notes. Share links are not encrypted. There is no authenticated cross-device sync or personal scheduled-alert enrollment yet.

Monitor scans resume from saved timestamps, capped at seven days. Exactly-once notification delivery is not guaranteed: sending can succeed before state is committed. There are no automated failure notifications. Verify a current broker quote independently before making any trading decision.
