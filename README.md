# MayfairTech Expert Solutions — Project Backbone

This repository contains the official web asset for **MayfairTech Expert Solutions**, a premium technology partner based in Rose-Hill, Mauritius.

The site is designed to reflect MayfairTech's philosophy: **Transforming software from a recurring expense into a permanent company asset.**

---

## 1. Project Identity
* **Mission:** Building proprietary "Technology Backbones" for businesses globally.
* **Headquarters:** Rose-Hill, Mauritius.
* **Tech Stack:** Angular 22 (standalone components, signals), statically prerendered at build time — no server runtime, deployed as plain static files. See `CLAUDE.md` for full architecture notes.
* **Governance:** Managed through GitHub Actions for automated GitHub Pages deployment.

---

## 2. Core Features
* **Ownership Calculator:** An interactive tool to visualize the 3-year financial impact of software licensing vs. proprietary ownership.
* **Product Suite:** A registry-driven products hub (`products.html`) and per-product marketing pages (e.g. `erp.html`), auto-populated into the nav, footer, and homepage teaser.
* **4-language i18n:** Instant, client-side language switching (English, Traditional & Simplified Chinese, French) persisted across visits.
* **Global-Local About Section:** Highlights the strategic model of global engineering talent governed by Mauritius standards.
* **Premium UX:** Smooth scroll offsets, scroll-triggered reveal animations, a real-time scroll progress indicator, and a hand-rolled animated SVG globe.

---

## 3. Local Development

Run:

```bash
./run_angular.sh
```

This ensures a compatible Node version is active (via `nvm`), installs dependencies if needed, starts the Angular dev server, and opens your browser to `http://localhost:4200`.

Manual equivalent: `npm ci && npx ng serve`.

To test the production (prerendered, static) build locally:

```bash
npm run build
node scripts/flatten-html-routes.mjs dist/mayfairtech-website/browser
```

Then serve `dist/mayfairtech-website/browser` with any static file server that preserves literal `.html` URLs (see `CLAUDE.md` for a caveat about "clean URL" static-server features).

---

## 4. Tech Architecture (Internal Standards)
While the website itself is an Angular SPA, the projects we deliver for clients follow our standardized stack:
* **Backend:** Java (Spring Boot)
* **Frontend:** Angular
* **Database:** PostgreSQL / MySQL / Redis
* **Mobile:** Native (Swift for iOS / Kotlin for Android)

---

## 5. Deployment & Maintenance
This site is hosted via **GitHub Pages** (Settings → Pages → Source: GitHub Actions).

### Continuous Integration
The `.github/workflows/deploy.yml` workflow installs dependencies, runs the Angular production build (which prerenders every route to static HTML), flattens the `.html`-named routes into literal files, and publishes the result to GitHub Pages on every push to `main`. See `CLAUDE.md` for the full pipeline breakdown.
