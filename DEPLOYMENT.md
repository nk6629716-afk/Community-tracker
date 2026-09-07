# Deploying Citypulse

Citypulse is deployed as one Render web service: the Node/Express API, Socket.IO
server, and Vite frontend share one HTTPS address. This removes the need for a
public `VITE_API_URL` and avoids cross-origin WebSocket configuration.

## 1. Create the database

1. Create a free project at https://supabase.com/dashboard.
2. Open **SQL Editor** and run `supabase/migrations/001_citypulse.sql`.
3. In **Connect**, copy the direct Postgres connection string. Use the connection
   method marked for server applications and include SSL (`sslmode=require`).

## 2. Deploy on Render

1. Push this repository to GitHub.
2. In Render, select **New > Blueprint** and select the repository. Render reads
   `render.yaml` and creates the service.
3. In the new service's Environment settings, add:
   - `DATABASE_URL`: the Supabase direct Postgres connection string.
   - `CLIENT_URL`: the final Render URL, for example `https://citypulse.onrender.com`.
   - `GEMINI_API_KEY`: optional; leave blank to use the built-in analysis fallback.
4. Deploy. Render supplies `PORT` and generates `JWT_SECRET` from the blueprint.
5. Visit `https://YOUR-SERVICE.onrender.com/api/health`. It must report
   `"persistence":"postgres"` before you collect real reports.

## 3. Verify

- Create an account and submit a report.
- Open the site in a second browser window; new reports and status updates should
  appear through Socket.IO.
- Confirm the report remains after restarting the Render service.

## Notes

Render's free web service sleeps after inactivity. The first visit after sleeping
can take roughly a minute. Supabase's free projects can also pause when inactive.
Do not store real user data in `citypulse_store.json`; hosted services have an
ephemeral filesystem and that file is local-demo only.
