# Environments: dev / staging / production

Config that differs per environment, across the backend and the admin frontend.
There are **two allow-lists** on the backend (email recipients and CORS
origins) plus the admin app's per-environment API URL.

## Backend — email recipient allow-list

Controls who can actually receive mail (see also `email-setup.md`).

| Var | Dev | Staging | Production |
| --- | --- | --- | --- |
| `EMAIL_RESTRICT_RECIPIENTS` | `true` | `true` | `false` |
| `EMAIL_ALLOWED_RECIPIENTS` | `yopmail.com,you@gmail.com` | `yopmail.com,qa@edenhub.com` | *(ignored when unrestricted)* |

- When `EMAIL_RESTRICT_RECIPIENTS=true`, mail is only delivered to entries in
  `EMAIL_ALLOWED_RECIPIENTS`; everything else is skipped + logged.
- Entries are **whole domains** (`yopmail.com`) or **exact addresses**
  (`qa@edenhub.com`). Exact addresses let you allow one real inbox without
  opening the whole domain.
- If `EMAIL_RESTRICT_RECIPIENTS` is unset, it defaults to ON when
  `NODE_ENV !== production`. Set it explicitly on **staging** (which often runs
  `NODE_ENV=production`) to keep staging from emailing real customers.
- `DEV_EMAIL_ALLOWED_DOMAINS` is still read as a fallback for back-compat.

## Backend — CORS frontend-origin allow-list

`frontendUrls` is a comma-separated list of the frontend origins allowed to call
the API. Falls back to common localhost ports when unset.

| Env | `frontendUrls` |
| --- | --- |
| Dev | `http://localhost:5173,http://localhost:3000` |
| Staging | `https://admin.staging.edenhub.com,https://staging.edenhub.com` |
| Production | `https://admin.edenhub.com,https://edenhub.com` |

## Admin frontend — per-environment API URL

Vite mode files (committed; only the untracked `.env` overrides locally):

| Mode file | Command | `VITE_BASEAPI` |
| --- | --- | --- |
| `.env.development` | `npm run dev` | `http://localhost:3000/api` |
| `.env.staging` | `npm run build:staging` | `https://api.staging.edenhub.com/api` |
| `.env.production` | `npm run build` / `build:prod` | `https://api.edenhub.com/api` |

`src/config.ts` exposes `apiUrl`, `appEnv`, and `isProd`. Replace the
placeholder staging/production URLs with the real deployed API hosts.
