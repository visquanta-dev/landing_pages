# Visquanta Landing Pages

Config-driven dealership appointment booking pages. Add a dealer in the dashboard → instant landing page at `{subdomain}.visquanta.com`.

## Architecture

- **Dashboard** → `/dashboard` — Create/edit/manage dealership landing pages
- **Landing Pages** → `/preview/{subdomain}` or `{subdomain}.visquanta.com` 
- **Database** → Supabase `dealerships` table stores all config
- **Middleware** → Rewrites subdomain requests to dynamic routes

## Setup

```bash
# 1. Install dependencies
npm install

# 2. Create .env.local from the example
cp .env.local.example .env.local
# Fill in your Supabase credentials

# 3. Run locally
npm run dev
# Dashboard: http://localhost:3000/dashboard
# Preview:   http://localhost:3000/preview/cloningertoyota
```

## Deploy to Vercel

```bash
# Push to GitHub
git init && git add . && git commit -m "Initial"
gh repo create visquanta-landing-pages --private --push

# Deploy via Vercel
# 1. Import repo at vercel.com/new
# 2. Add environment variables:
#    - NEXT_PUBLIC_SUPABASE_URL
#    - NEXT_PUBLIC_SUPABASE_ANON_KEY
#    - SUPABASE_SERVICE_ROLE_KEY
# 3. Deploy
```

### Wildcard Domain Setup

1. In Vercel → Settings → Domains, add: `*.visquanta.com`
2. In your DNS (Cloudflare), add:

| Type  | Name | Value                |
|-------|------|----------------------|
| CNAME | *    | cname.vercel-dns.com |

Now `cloningertoyota.visquanta.com` automatically resolves to the correct landing page.

## Usage

1. Go to `/dashboard`
2. Click **+ New Dealership**
3. Fill in the tabs: Details → Branding → Vehicles → SMS/Legal
4. Hit **Auto-Generate SMS** to populate Telnyx-compliant consent copy
5. Save → page is instantly live at `{subdomain}.visquanta.com`

## Project Structure

```
visquanta-landing-pages/
├── app/
│   ├── dashboard/        — Admin dashboard
│   ├── preview/[subdomain]/ — Dynamic landing page route
│   ├── api/dealerships/  — CRUD API
│   └── layout.tsx
├── components/
│   ├── DealerForm.tsx    — Create/edit form
│   └── LandingPage.tsx   — Premium template (dynamic)
├── lib/
│   └── supabase.ts       — Client + types
├── middleware.ts          — Subdomain routing
└── vercel.json
```
