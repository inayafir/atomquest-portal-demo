# AtomQuest Portal

A polished goal-setting and performance tracking portal built with Next.js, Supabase, and Tailwind CSS.

## Features

- **Employee**: Create goals (100% weightage), submit for approval, quarterly check-ins with auto-scoring
- **Manager**: Review team goal sheets, approve/return, coach via check-in comments
- **Admin**: Manage cycles, users, export reports, audit log

## Quick start

1. Copy environment variables:

```bash
cp .env.example .env.local
```

2. Add your Supabase URL and anon key from [supabase.com](https://supabase.com).

3. Install and run:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Demo accounts

| Email | Role | Password |
|-------|------|----------|
| priya@demo.com | Employee | Demo@1234 |
| raj@demo.com | Manager | Demo@1234 |
| admin@demo.com | Admin | Demo@1234 |

## Stack

- Next.js 16 (App Router)
- Supabase Auth + Postgres
- Tailwind CSS 4
- Framer Motion
- Lucide icons
- Recharts / XLSX (reports)

## Hackathon demo flow

1. **Login** — cinematic split-screen with demo account quick-fill
2. **Employee (Priya)** — add goals, watch weightage bar animate to 100%, submit
3. **Manager (Raj)** — slide-over review panel, approve goals
4. **Employee** — log Q1 check-ins, see score rings
5. **Admin** — export Excel report, browse audit log
