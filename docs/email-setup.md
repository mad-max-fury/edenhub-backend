# Email configuration

Transactional emails are sent through a provider chosen at boot by
`EMAIL_PROVIDER`. The transport is decoupled from `NODE_ENV`, so any environment
can use whichever sender is appropriate.

## Providers

| `EMAIL_PROVIDER` | Transport | Use for | Reaches real inboxes? |
| --- | --- | --- | --- |
| `smtp` | Any SMTP server (Mailtrap, Gmail, Brevo…) | local / dev / staging | Depends on the server (see below) |
| `sendgrid` | SendGrid API | production | Yes |
| `console` | Logs only, no network send | offline dev / CI | No |

If `EMAIL_PROVIDER` is unset it defaults to **`sendgrid` in production, `smtp`
otherwise**. If the selected provider is missing credentials, the mailer logs a
warning and falls back to `console` instead of crashing.

## Dev recipient guard

When enabled, the mailer **only delivers to allow-listed recipients** — default
`yopmail.com`. Any other recipient (a real customer's gmail, say) is skipped and
logged, so a dev/staging box can never email real users.

```bash
EMAIL_RESTRICT_RECIPIENTS=true                       # default: on when NODE_ENV != production
EMAIL_ALLOWED_RECIPIENTS=yopmail.com,qa@edenhub.com  # domains OR exact addresses
```

- Entries match as a **whole domain** (`yopmail.com`) or an **exact address**
  (`qa@edenhub.com` allows just that inbox, not all of gmail).
- Set `EMAIL_RESTRICT_RECIPIENTS` explicitly on **staging** if it runs with
  `NODE_ENV=production`, so staging stays restricted.
- In production leave it `false` (or unset) and emails go to anyone.
- `DEV_EMAIL_ALLOWED_DOMAINS` is still honored as a legacy fallback.

See `environments.md` for the full per-environment matrix.

## Local / dev / staging — `smtp`

```bash
EMAIL_PROVIDER=smtp
EMAIL_FROM="EdenHub <noreply@edenhub.com>"
SMTP_HOST=...
SMTP_PORT=587            # 465 also supported (implicit TLS)
SMTP_USER=...
SMTP_PASS=...
STOREFRONT_URL=http://localhost:3000   # used in email button links
```

Pick the SMTP server based on whether you need mail to actually land in an inbox:

- **Mailtrap sandbox** (`sandbox.smtp.mailtrap.io`) — **captures** mail in the
  Mailtrap web UI; nothing is delivered to the recipient. Best for dev/staging
  when you just want to inspect output safely.
- **Yopmail** — a *recipient* service, not a transport. Send through a real SMTP
  server (Gmail, Mailtrap Sending, Brevo…) to any `anything@yopmail.com`
  address, then read it at <https://yopmail.com>. Great for throwaway test
  accounts.
- **Gmail SMTP** (`smtp.gmail.com`, port `587`) — delivers to real inboxes.
  `SMTP_USER` is your Gmail address and `SMTP_PASS` is a **Google App Password**
  (requires 2-Step Verification; your normal password is rejected). Set
  `EMAIL_FROM` to the same Gmail address.

## Production — `sendgrid`

```bash
NODE_ENV=production
EMAIL_PROVIDER=sendgrid          # or leave unset; production defaults to sendgrid
SENDGRID_API_KEY=SG.xxxxx        # required — without it, falls back to console
EMAIL_FROM="EdenHub <noreply@edenhub.com>"   # MUST be a SendGrid-verified sender/domain
STOREFRONT_URL=https://app.edenhub.com
```

Production may instead use Gmail/another SMTP server by setting
`EMAIL_PROVIDER=smtp` with the corresponding `SMTP_*` values.

## Verifying

```bash
# compile every template (no send)
npm run email:test

# compile + deliver every template through the configured provider
TEST_EMAIL=you@example.com npm run email:test
```
