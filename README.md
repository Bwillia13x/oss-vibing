# Mad Lab

Natural language-first finance on top of the Vibe layout (Chat • Preview • Files • Logs).

## Features

- Prompt-to-Chart: time-series charts with drawdowns, CSV artifacts, citations
- Prompt-to-DCF/EPV: valuation (scaffolded; implement Python worker next)
- Ask-the-Filings: RAG over SEC/SEDAR filings (scaffolded)

## Quickstart

1. Install deps

```sh
pnpm install
```

1. Configure env

```sh
cp .env.example .env.local
# Fill in keys
```

1. Dev server

```sh
pnpm dev
```

Key files:

- `app/actions/runTask.ts` — plan/execute finance tasks
- `lib/finance/*` — adapters and providers
- `lib/pipelines` — chart pipeline (sandboxed viz)

- Sandbox logs in UI; multi-series chart polish (axes, annotations)
- Python FastAPI worker for DCF/EPV (wire to `WORKER_URL`)
- Filings ingestion and embeddings

This project is for educational purposes — not investment advice.

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
