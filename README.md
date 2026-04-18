# MMM-BinDays

A [MagicMirror²](https://magicmirror.builders/) module that displays your upcoming household bin collection dates.

Collection dates are stored in a Supabase database that is refreshed weekly by a scheduled Edge Function which scrapes your council's bin-lookup page. The module simply reads the `bin_collections` table and renders the next few pickups on your mirror.

```
Bin Collections
---------------
Today         General   Recycling
Tomorrow      Garden
Fri 25 Apr    General
Mon 28 Apr    Recycling
```

## Installation

On your MagicMirror host (Raspberry Pi or similar):

```bash
cd ~/MagicMirror/modules
git clone https://github.com/YOUR-USERNAME/MMM-BinDays.git
```

To update later:

```bash
cd ~/MagicMirror/modules/MMM-BinDays
git pull
```

There are **no npm dependencies to install** — the node helper uses the built-in `fetch` available in Node 18+.

## Configuration

Add the module to `~/MagicMirror/config/config.js`:

```js
{
  module: "MMM-BinDays",
  position: "top_right",
  header: "Bin Collections",
  config: {
    supabaseUrl: "https://YOUR-PROJECT.supabase.co",
    supabaseAnonKey: "YOUR-SUPABASE-ANON-KEY",
    maxCollections: 6,
    updateInterval: 60 * 60 * 1000
  }
}
```

Then restart MagicMirror (`pm2 restart MagicMirror` or equivalent).

### Options

| Option            | Type    | Default                  | Description                                                             |
| ----------------- | ------- | ------------------------ | ----------------------------------------------------------------------- |
| `supabaseUrl`     | string  | `""` (required)          | Your Supabase project URL.                                              |
| `supabaseAnonKey` | string  | `""` (required)          | Your Supabase anon public API key.                                      |
| `maxCollections`  | number  | `6`                      | Maximum number of future collection dates to show.                      |
| `updateInterval`  | number  | `3600000` (1 hour)       | How often the mirror refreshes from Supabase, in milliseconds.          |
| `animationSpeed`  | number  | `800`                    | DOM update animation duration, in milliseconds.                         |
| `showHeader`      | boolean | `true`                   | Whether MagicMirror should render the module header.                    |
| `headerText`      | string  | `"Bin Collections"`      | Header text shown above the module.                                     |

## Publishing this repo

This directory is the full, standalone module. To put it on GitHub so your mirror can `git pull` it:

```bash
cd /path/to/this/folder
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/MMM-BinDays.git
git push -u origin main
```

## Backend (Supabase)

The `supabase/` folder contains the database migration and the `scrape-bins` Edge Function that populates `bin_collections` weekly. These live server-side in your Supabase project — you do not need to ship them to the Pi.

### Database schema

```sql
create table bin_collections (
  id uuid primary key default gen_random_uuid(),
  bin_type text not null,
  bin_color text not null,
  collection_date date not null,
  created_at timestamptz default now()
);
```

Row Level Security must allow the `anon` role to `SELECT` from `bin_collections` so the module can read with the anon key.

## How it works

1. A weekly Supabase scheduled job invokes `scrape-bins`, which fetches your council's page and extracts upcoming collection dates into `bin_collections`.
2. The MagicMirror node helper (`node_helper.js`) calls Supabase PostgREST:
   ```
   GET {supabaseUrl}/rest/v1/bin_collections?collection_date=gte.TODAY&order=collection_date.asc
   ```
3. The front-end module (`MMM-BinDays.js`) groups rows by date and renders coloured chips per bin type.

## Troubleshooting

- **"Missing supabaseUrl or supabaseAnonKey in config."** — Both values are required; copy them from your Supabase project settings.
- **HTTP 401/403 from Supabase** — Check your anon key, and confirm an RLS policy allows `select` for the `anon` role on `bin_collections`.
- **No rows appear** — Invoke the `scrape-bins` Edge Function manually to populate the table, or verify the council URL / postcode it was configured with.

## License

MIT
