# Space Stock Watch
Public static dashboard, delayed Alpaca SIP monitoring, Gmail SMTP and CallMeBot review alerts. No automatic trading.

## Activate
Set repository Settings > Pages > Source to GitHub Actions. Add Actions secrets ALPACA_KEY, ALPACA_SECRET, GMAIL_USER, GMAIL_APP_PASSWORD, ALERT_TO_EMAIL, WHATSAPP_PHONE, WHATSAPP_API_KEY. Never commit values. Verify provider data display rights and all symbols, especially SPCX. Run Monitor and publish dashboard manually and inspect logs. Missing credentials produce no fabricated quotes.

## Targets
Edit config/targets.json. Near alerts at 5% above target; target alerts use one-minute bar lows. Gmail receives near and target alerts; WhatsApp receives target alerts only.

## Limitations
Initial implementation, not live-tested. Weekday schedule every 15 minutes during UTC 13–21 hours; includes some extended hours and holidays, not regular-session-only. Consolidated data delayed at least 15 minutes. Actions timing is best effort. Scan resumes from saved timestamp, capped to seven days. Alerts for observations more than one hour old are suppressed. Existing pending events expire after two hours. First run can alert if already below target. No guarantee of exactly-once delivery: sending may succeed before state commit, and gateway response checks require validation. Serial workflow execution reduces overlap. Three attempts per channel. No automated failure notifications. History split-adjusted; quotes raw. Dashboard read-only; targets edited via config.

Only site/ is published to Pages. State files are public in this public repository: they contain price observations and alert statuses but no contact details or credentials. Do not add private investment notes. GitHub job credentials stay in secrets. Public repo history retains previous price/state snapshots. Email and WhatsApp are accepted-send status only, not proof of delivery.
