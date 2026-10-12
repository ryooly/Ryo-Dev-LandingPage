# Ryo's Personal Page

> An interactive, retro **console-style** personal portfolio — boot it up, work the jog-dial, and flip
> through screens like a handheld game. Built and deployed with [TanStack Start](https://tanstack.com/start).

<!-- Replace YOUR-PRODUCTION-URL with the live Vercel URL after the first successful deploy -->

[![Live](https://img.shields.io/badge/Live-DEPLOYED-1d3a2a?style=for-the-badge)](https://YOUR-PRODUCTION-URL)
[![License: All Rights Reserved](https://img.shields.io/badge/License-All%20Rights%20Reserved-cf4b3b?style=for-the-badge)](./LICENSE)
[![Built with TanStack Start](https://img.shields.io/badge/Built%20with-TanStack%20Start-cf4b3b?style=for-the-badge)](https://tanstack.com/start)
[![Bun](https://img.shields.io/badge/Package%20Manager-Bun-f9f1e1?style=for-the-badge)](https://bun.sh)

![Ryo's Personal Page — home screen](./docs/screenshots/home.png)

---

## What is this?

This is the source for **Ryo's personal page** — a single-page portfolio that behaves like a retro
gaming console. Instead of a typical scroll site, you "power on," navigate screens with a **jog-dial**,
and each section is its own in-theme panel with synthesized sound feedback and tactile press effects.

### Screens / features

- 🕹️ **Boot / Start gate** — power-on intro with a start screen and an animated typed tagline.
- 👤 **Player Profile** — a "data card" with name, region, languages, stats and a pixel sprite.
- 🧭 **About / Backstory** — narrative bio with focus "loadout" chips.
- 🌳 **Skills — Tech Tree** — an interactive skill hierarchy grouped by language.
- 🎒 **Project Vault** — an inventory grid of repositories (links straight to GitHub).
- 🎡 **Find Me Here** — a rotating wheel carousel of profile channels.
- ✉️ **Contact** — a mailto button with a clipboard fallback so it works on any device.
- 🔊 **Console sound** — synthesized retro SFX via Tone.js, with a persistent mute toggle.
- 🌗 **Night mode**, custom **pixel scrollbars**, and **reduced-motion** support.

---

## Tech stack

| Area | Choice |
| --- | --- |
| Framework | [TanStack Start](https://tanstack.com/start) + React |
| Language | [TypeScript](https://www.typescriptlang.org/) |
| Bundler / build | [Vite](https://vitejs.dev/) (Rolldown) |
| Styling | [Tailwind CSS v4](https://tailwindcss.com/) + [shadcn/ui](https://ui.shadcn.com/) (Radix primitives) |
| Animation | [GSAP](https://gsap.com/) |
| Audio | [Tone.js](https://tonejs.github.io/) |
| Smooth scroll | [Lenis](https://github.com/darkroomengineering/lenis) |
| Runtime / PM | [Bun](https://bun.sh) |
| Hosting | [Vercel](https://vercel.com/) |

---

## Getting started

### Prerequisites

- [Bun](https://bun.sh) (recommended — the project ships a `bun.lock`)
- Node.js 20+ if you prefer `npm`/`pnpm`

### Install & run

```bash
# 1. Install dependencies
bun install

# 2. Start the dev server (hot reload)
bun run dev

# 3. Create a production build
bun run build

# 4. Preview the production build locally
bun run preview
```

### Scripts

| Command | Description |
| --- | --- |
| `bun run dev` | Start Vite dev server with HMR |
| `bun run build` | Production build |
| `bun run build:dev` | Build in development mode |
| `bun run preview` | Preview the built output |
| `bun run lint` | ESLint over the whole project |
| `bun run format` | Prettier `--write` across the repo |

---

## Project structure

```
src/
├── components/
│   └── ui/            # shadcn/ui primitives
├── hooks/             # use-lenis, use-mobile
├── lib/               # console sound, error handling, utils
├── routes/
│   ├── __root.tsx     # root shell, metadata, fonts
│   └── index.tsx      # the console UI (all screens live here)
├── styles.css         # the pixel-console theme
├── router.tsx         # router instance
├── server.ts          # server entry (SSR/error normalization)
└── start.ts           # TanStack Start config
public/                # favicon, icons
docs/screenshots/      # images used in this README
```

---

## Deployment (Vercel)

1. Push this repo to GitHub.
2. In Vercel, **Import** the repo. It is auto-detected as a Vite project.
3. Framework preset: **Vite** · Build command: `bun run build` · Output: default (Nitro/`.output`).
4. Deploy. After the first successful deploy, copy the production URL into the
   `Live` badge and hero link at the top of this README.

> **Note:** keep `@tanstack/react-start` at **1.168.60 or later** — earlier versions have a known
> cross-site-scripting advisory that Vercel blocks at deploy time.

---

## Screenshots

Images referenced above live in [`docs/screenshots/`](./docs/screenshots/). Drop your own captures in
there with these filenames to light them up:

| File | Capture |
| --- | --- |
| `home.png` | The boot / start screen |
| `profile.png` | Player Profile data card |
| `tree.png` | Skills — Tech Tree |
| `vault.png` | Project Vault inventory |
| `find.png` | Find Me Here carousel |

Tip: capture at **1280×800** (desktop) or **390×844** (iPhone) for crisp, consistent framing.

---

## Contact

Made by **Satrio "Ryo" Ardiansyah** — links below are also wired into the site itself.

[![Email](https://img.shields.io/badge/Email-d5e3cf?style=for-the-badge&logo=gmail&logoColor=cf4b3b&color=1d3a2a)](mailto:ardiansyahhsatrio@gmail.com)
[![GitHub](https://img.shields.io/badge/GitHub-ryooly-1d3a2a?style=for-the-badge&logo=github&logoColor=d5e3cf)](https://github.com/ryooly)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-satrio--a-1d3a2a?style=for-the-badge&logo=linkedin&logoColor=d5e3cf)](https://www.linkedin.com/in/satrio-a-84445a335)
[![X](https://img.shields.io/badge/X-ryollie-1d3a2a?style=for-the-badge&logo=x&logoColor=d5e3cf)](https://x.com/ryollie)

---

## License

© 2026 Satrio Ardiansyah. This project is **All Rights Reserved** — the source is public for viewing
and study, but reuse, redistribution, and commercial use are not permitted without written permission.
See [LICENSE](./LICENSE) for details.
