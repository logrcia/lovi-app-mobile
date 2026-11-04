# nearby-ads

Edge function that returns sponsored businesses near the caller for the feed's
"Patrocinado" cards. It searches Google Maps through [SerpAPI](https://serpapi.com),
caches one result list per ~5 km zone in `ad_zones`, and falls back to sample
businesses when the search cannot run (see `ad_settings.use_demo_fallback`).

## Setup (once)

1. Apply the migration `supabase/migrations/20261104150000_sponsored_ads.sql`.
2. Store the SerpAPI key as a secret. It must never be in the app or in git:

   ```bash
   npx supabase secrets set SERPAPI_KEY=<your-serpapi-key>
   ```

3. Deploy the function, either way:
   - **From the browser:** Edge Functions → create a function named `nearby-ads`,
     paste the whole of `index.ts` (the function is a single file on purpose) and deploy.
   - **From a terminal** in the project folder (after `npx supabase login` and
     `npx supabase link --project-ref <project-ref>`):

     ```bash
     npx supabase functions deploy nearby-ads
     ```

   The secret in step 2 can also be added from the browser, under Edge Functions → Secrets.

4. Give the monetization panel to your accounts, in the SQL editor:

   ```sql
   insert into public.ad_admins (profile_id)
   select id from auth.users where email in ('you@example.com');
   ```

## Tuning

Everything is in the single row of `public.ad_settings`, editable from the Table
Editor; the app picks it up on reload:

| Column | Meaning |
| --- | --- |
| `enabled` | Show sponsored cards at all |
| `every_n_posts` | A card after every N posts in the feed |
| `search_query` | What to search near the user, e.g. `veterinaria`, `pet shop` |
| `max_results` | How many businesses to rotate through per zone |
| `cache_ttl_hours` | How long a zone's search is reused before searching again |
| `label` | The tag on the card, e.g. `Patrocinado · demo` |
| `cpm_usd`, `cpc_usd` | Simulated prices for the revenue estimate |
| `use_demo_fallback` | Serve sample businesses when the search fails |

Changing `search_query` starts a fresh search per zone, since the cache is keyed
by zone and query.
