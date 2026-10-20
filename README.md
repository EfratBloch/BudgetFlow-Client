# BudgetFlow Client

The React client of BudgetFlow (React 19 + TypeScript + Vite + React Router). Hebrew, right-to-left.
All drawings (logo, chairs, projector, wallet) are inline SVG animated with CSS, with no image files.

## Run locally

The API must be running first (`dotnet run --project BudgetFlow.API --launch-profile http` in the server
folder, on <http://localhost:5178>).

```powershell
npm install
npm run dev
```

Open <http://localhost:5173>. Vite forwards every `/api/...` call to the local API, so no CORS setup is needed.

With an empty database, register the coordinator at `/register`. Demo users exist only when the server runs with `SeedDemoData` on:

| Role | Email | Password |
|------|-------|----------|
| Coordinator | `sarah@budgetflow.local` | `Coord!2026` |
| Guide | `rachel@budgetflow.local` | `Guide!2026` |

## Build

```powershell
npm run build
```

The site is written to `dist/`.

## Deploy to Render (Static Site)

| Setting | Value |
|---------|-------|
| Build command | `npm install && npm run build` |
| Publish directory | `dist` |
| Environment variable `VITE_API_URL` | The API address, e.g. `https://budgetflow-6tto.onrender.com` (no trailing slash) |
| Redirects/Rewrites | Source `/*`, Destination `/index.html`, Action **Rewrite** (so page refreshes work) |

On the API service, set `Cors__AllowedOrigins` to the client's Render address.

## Structure

| Folder | Contents |
|--------|----------|
| `src/api` | `client.ts` (fetch + token + error messages), `endpoints.ts` (one function per endpoint), `types.ts` |
| `src/auth` | Login state (token in `localStorage`, logout on expiry or 401) |
| `src/components` | Header and layout, toasts and confirm dialog, SVG art, cards, forms in modals |
| `src/pages` | Home, login/registration, dashboards, participants, meetings, equipment, guides, budget additions |
