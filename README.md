# Conneck

A private business development workspace for the founder of [SORTED](https://sorted.works), a UK warehouse management and inventory platform. It brings together finding potential customers, referral sources, strategic partners, co-founder candidates and funding programmes across the UK. It then helps research, score, organise and contact them.

## What's here today

All sidebar sections are built and interactive, running on a clearly labelled **sample workspace**:

- **Dashboard**: "What should I do today?" Top 10 Actions, KPIs, customer funnel and revenue (estimates kept separate from confirmed revenue)
- **Lead Finder**: discovery controls, results with sources, Research / Save / Find Similar / Generate Outreach
- **All Opportunities**: filter, sort, tags, bulk actions, CSV export
- **Lead Profile**: overview, AI analysis, contacts with provenance, activity, outreach, tasks, sources, notes
- **Sales Pipeline**: drag-and-drop stages for all five pipelines
- **Outreach Studio**: 8 message types × 4 tones, copy/regenerate/edit/save
- **Co-Founder Search**: fit assessment, question generator, validation checklist
- **Partnerships & Network**, **Funding & Growth**, **Tasks & Follow-ups**, **Growth Advisor**, **Settings**

Sample records use reserved `.example` domains and are marked "Sample" in the UI. Changes made in the preview last only for the current browser session.

## Tech

TanStack Start (React 19, TypeScript), Tailwind CSS 4, shadcn/ui (Radix), lucide icons, deployed on Netlify. Planned: Netlify Identity (invite-only), Netlify Database (Postgres + Drizzle), Netlify AI Gateway, Brave Search API, Companies House API.

## Run locally

```bash
pnpm install
netlify dev        # or: pnpm dev (Vite on :3000)
```

## Roadmap

See [PLAN.md](PLAN.md). Next up: invite-only login and persistent storage, then live Brave Search / Companies House discovery, then AI assessments and outreach through Netlify AI Gateway.
