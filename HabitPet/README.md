# HabitPet 🐾

> Build daily habits · Grow your AI pet · Mint it as an NFT

HabitPet is a Web3 DApp that turns your real-life habits into a living, growing creature. Check in daily with photo proof across themed "planets" (language, fitness, reading, art…), watch your pet evolve through 5 stages, then mint it as a permanent NFT on Avalanche — an on-chain record of your growth.

## Core Loop

1. **Check in** — take a photo, pick a planet, let AI verify it
2. **Earn points** — each check-in = 1 pt toward pet growth (100 pts = graduation)
3. **Collect 花糖 (Petals)** — virtual currency for the study-room shop
4. **Play mini-games** — win vouchers to draw accessory cards
5. **Mint NFT** — at 100 pts, mint your pet on Avalanche Fuji as proof
6. **Graduate** — after minting, hatch a brand-new pet and keep your history

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite + Tailwind CSS + shadcn/ui
- **Auth**: Supabase (email + password) + MetaMask wallet
- **AI images**: SiliconFlow (`Kwai-Kolors/Kolors`) via Supabase Edge Function, cached in Supabase Storage
- **Blockchain**: Avalanche Fuji Testnet (ethers.js v6)
- **i18n**: Custom React Context — English / 中文

## Quick Start

```bash
cd UI
cp .env.example .env.local   # fill in VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY
npm install
npm run dev                  # http://localhost:8080
```

## Environment Variables

```
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
VITE_WALLETCONNECT_PROJECT_ID=demo-project-id
```

## Deploy Edge Function

```bash
cd UI
supabase secrets set SILICONFLOW_API_KEY=sk-...
supabase functions deploy generate-pet-image
```

Create a **public** Supabase Storage bucket named `pet-images` for permanent AI image caching.

## Contract

Deployed on Avalanche Fuji Testnet: `0x17af32d1E54fF01D55bc57B3af8BDBddc030D2E1`

---

Built for WWW6.5 Hackathon 🌸
