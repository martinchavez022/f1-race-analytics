# F1 Race Performance Analyzer

A Next.js app that answers:

> *How did each driver perform during a specific race session?*

Data source: the free [OpenF1 API](https://openf1.org/) (no auth required).

## Stack

- Next.js 16 (App Router, TypeScript, Turbopack)
- Tailwind CSS
- Apache ECharts (via `echarts-for-react`) for visualization

## Getting started

```bash
cp .env.local.example .env.local
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

- `npm run dev` — dev server
- `npm run build` — production build
- `npm start` — run the production build
- `npm run lint` — ESLint
