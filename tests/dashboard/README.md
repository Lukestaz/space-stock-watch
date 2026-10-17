# Dashboard browser regression tests

Runs the actual static dashboard through a local HTTP server in Chromium desktop and WebKit with an iPhone viewport. This is not testing on a physical iPhone. No production dashboard code is changed by the test suite.

Browser-context routes replace the monitor feed, catalogue and price endpoint with synthetic fixtures. Other non-local browser requests are blocked and fail the test. No Actions secrets are supplied and no monitor, notification sender or deployment command is executed. Dependency and browser downloads still require network access during setup.

## Run

Requires Node 22 and Python 3. From this directory:

```sh
npm install --ignore-scripts --no-audit --no-fund --package-lock=false
npx playwright install --with-deps chromium webkit
npm test
```

Playwright is pinned directly; a dependency lockfile is not included in this initial suite, so transitive dependencies are not fully locked. The local server uses port 4173 and refuses to reuse an existing server.

Coverage: saved targets/order after reload, unsaved drafts across data refresh, Replace/Merge/Cancel import behaviour, duplicate-target merge precedence, invalid ticker/negative-target guards, retained quotes after lookup failure, and catalogue listing names. Invalid-input tests deliberately dispatch submit to exercise application validation as well as native input constraints.

Chart zoom/date preservation is explicitly marked fixme because it is a reported low-priority bug; a skipped test is not evidence the feature passes. Live provider availability, real notification delivery, production deployments and comprehensive visual layout are outside this suite.

The read-only Dashboard regression tests workflow runs on relevant pushes/PRs and manually. It uploads synthetic-data reports and failure traces for seven days. It does not gate Pages publishing in this first version. No local or CI pass is claimed until a run completes; failures should be investigated rather than masked with retries.
