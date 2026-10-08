# MayfairTech Expert Solutions — Website

## Project Overview

Marketing website for MayfairTech Expert Solutions, built as an **Angular 22 application with static prerendering (SSG)**. Every route is rendered to a real static HTML file at build time — there is no Node server at runtime — so the output deploys to GitHub Pages exactly like the old static site did, just via a build step instead of a raw file copy.

- **Live URL**: https://mayfairtechexpertsolutions.com/
- **Hosting**: GitHub Pages via GitHub Actions (auto-deploys on push to `main`). Until the custom domain is attached it serves from `https://mayfairtechexpertsolutions.github.io/Website/`; to switch, add `public/CNAME`, set the domain in Settings → Pages, and change `BASE_HREF` in the workflow to `/`
- **Local dev**: run `./run_angular.sh` — installs deps if needed, starts `ng serve`, opens the browser at `http://localhost:4200`.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Angular 22 — standalone components only, no NgModules |
| Build | `@angular/build:application` (esbuild) with `outputMode: "static"` — fully prerendered, no server bundle |
| Styling | Tailwind CSS v4 (`@tailwindcss/postcss`), theme tokens in `src/styles.css`'s `@theme` block |
| State | Angular signals (`signal`/`computed`) throughout; `OnPush` change detection on every component |
| i18n | Custom `TranslationService` (signals-based), **not** `@angular/localize` — see i18n section |
| Icons | Font Awesome 6.0 via CDN `<link>` in `src/index.html` (unchanged from the old site) |
| Fonts | Google Fonts — Playfair Display, Inter (preconnect + stylesheet in `src/index.html`) |
| Forms | No backend — both forms build a `wa.me` deep link and open it in a new tab, pre-filled with the visitor's answers, so the visitor sends it via WhatsApp Business |
| CI/CD | GitHub Actions (`.github/workflows/deploy.yml`) — Node 24, `npm ci`, `ng build --base-href`, flatten script, then `upload-pages-artifact` + `deploy-pages` on `dist/mayfairtech-website/browser/` |

---

## File Structure

```
/
├── src/
│   ├── index.html              # App shell head (fonts, Font Awesome CDN, base href)
│   ├── styles.css              # Tailwind import + @theme tokens + global custom CSS
│   ├── main.ts / main.server.ts / server.ts   # Angular bootstrap + prerender entry
│   └── app/
│       ├── app.ts / app.html   # Root shell: scroll-progress bar, navbar, <router-outlet>, footer, mobile menu
│       ├── app.routes.ts       # Route table — see "Routing" below
│       ├── app.config.ts       # Providers: router, HttpClient, client hydration
│       ├── core/
│       │   ├── i18n/           # translations.ts (4 language dicts), translation.service.ts, translate.pipe.ts
│       │   ├── products/       # products.data.ts (PRODUCTS registry), product.model.ts
│       │   ├── seo/            # seo.service.ts — sets Title/Meta/JSON-LD per page
│       │   └── services/       # mobile-menu.service.ts, reveal-observer.service.ts
│       ├── shared/
│       │   ├── components/     # navbar, mobile-menu, language-switcher, footer, products-grid,
│       │   │                   # product-card, globe, starfield, mobile-cta-bar
│       │   └── directives/     # reveal.directive.ts (appReveal — scroll-in animation)
│       └── pages/               # home, products, erp, privacy, terms — one folder per route
├── public/                      # Static assets copied verbatim into the build output
│   ├── media/                   # logo.png, only_logo.png, social-preview.png
│   ├── favicon.ico, robots.txt, sitemap.xml
├── scripts/flatten-html-routes.mjs   # Post-build fixup — see "Routing" below
├── .postcssrc.json             # Registers @tailwindcss/postcss — without it Tailwind is NOT compiled and the site is unstyled
├── angular.json, package.json, tsconfig*.json
├── run_angular.sh               # One-command local dev: correct Node via nvm + ng serve + open browser
└── .github/workflows/deploy.yml
```

The company sells two things through this site: **consulting/partnership services** (`HomeComponent`'s main pitch) and a growing **suite of standalone SaaS products** (home teaser, `products.html` hub, and one page per product). See "Products Architecture" below before adding a new product.

---

## Routing — literal `.html` URLs are intentional

Routes in `app.routes.ts` use literal path strings that include `.html`, e.g. `{ path: 'products.html', component: ProductsComponent }`. This is **not** a mistake — Angular Router path segments are plain strings, a dot has no special meaning, and this preserves the site's existing indexed URLs (`/`, `/products.html`, `/erp.html`, `/privacy.html`, `/terms.html`) exactly, so nothing in `sitemap.xml`, external backlinks, or bookmarks breaks.

Angular's static prerenderer, however, treats every route path as a directory, so a route named `products.html` builds to `dist/.../browser/products.html/index.html` (a **directory**), not a literal file. `scripts/flatten-html-routes.mjs` runs after every build and rewrites each `<name>.html/index.html` into a flat `<name>.html` file. This is required for GitHub Pages (a plain static file server) to resolve `/products.html` correctly — run it any time you build for deployment (the CI pipeline already does this; see `.github/workflows/deploy.yml`).

All internal links use `routerLink="/products.html"` etc. (matching the literal hrefs) — never Angular's more idiomatic extensionless clean paths.

---

## Brand Colors

Defined as Tailwind v4 theme tokens in `src/styles.css`'s `@theme` block — use the utility classes below, not raw hex/arbitrary values (never `text-[#20B2AA]` — it bypasses the contrast-aware remap). The remap is ancestor-based, so a light card nested inside a navy section needs an explicit `text-mayfair-teal-ink`:

| Utility class | Hex | Usage |
|-------|-----|-------|
| `bg-mayfair-navy` / `text-mayfair-navy` | `#003B5C` | Primary dark blue; backgrounds, headings |
| `bg-mayfair-teal` / `text-mayfair-teal` | `#20B2AA` | Accent; CTAs, highlights |
| `bg-mayfair-dark` | `#002236` | Darker navy; gradient ends, cards |
| `text-mayfair-teal-ink` | `#0F766E` | Teal for text on light backgrounds (WCAG AA); `text-mayfair-teal` is remapped to this automatically on light backgrounds |
| `text-mayfair-teal-light` | `#34D3C9` | Teal for text on dark backgrounds; `text-mayfair-teal` resolves to this inside `.bg-mayfair-navy`/`.bg-mayfair-dark`/`.gradient-bg` and in OS dark mode |

**Text on bright teal backgrounds is always `text-mayfair-navy`, never white** (white on `#20B2AA` is 2.6:1; navy is 4.5:1) — this includes hover states that turn a button teal.

Fonts: `font-serif` = Playfair Display, `font-sans` = Inter (both registered as `--font-serif`/`--font-sans` in the same `@theme` block).

---

## Products Architecture

The site scales to **multiple products** without hand-editing markup in more than one place per product, driven by a single registry.

### The `PRODUCTS` registry (`src/app/core/products/products.data.ts`)

```ts
export const PRODUCTS: Product[] = [
  {
    slug: 'erp',
    href: '/erp.html',
    icon: 'fa-boxes-stacked',   // Font Awesome class
    isNew: true,                 // shows a "New" badge; drop this field once it's not new
    nameKey: 'product_erp_name',
    taglineKey: 'product_erp_tagline',
    highlightKeys: ['product_erp_highlight1', 'product_erp_highlight2', 'product_erp_highlight3'],
  },
  // Add future products here.
];
```

`NavbarComponent`, `MobileMenuComponent`, `FooterComponent`, and `ProductsGridComponent` all read this array directly (via `*for`/`@for` in their templates) — there is no manual DOM re-rendering step like the old `renderProducts()`; Angular's change detection handles it.

`ProductsGridComponent` (`shared/components/products-grid/`) takes `[products]`, `[minSlots]` (default 3), and `[fillPlaceholders]` inputs. When there are fewer real products than `minSlots`, it appends muted "More Products Coming Soon" placeholder cards so the grid never looks half-empty. `fillPlaceholders` is `true` on the `products.html` hub (where an incomplete-looking grid reads as unfinished) and `false` on the homepage `#products` teaser (which already ends in a "View All Products" link, so a partial row is fine there).

### Adding a new product — checklist

1. **Build the product's own page**: add `src/app/pages/<slug>/<slug>.ts` + `.html`, copying `erp/erp.ts`/`erp.html` as a starting template. Give it its own `NavLink[]` array in `shared/components/navbar/nav-link.model.ts` (see `ERP_NAV_LINKS`) if it needs its own in-page anchor nav.
2. **Add a route** in `app.routes.ts`: `{ path: '<slug>.html', component: <Slug>Component }`.
3. **Add an entry to `PRODUCTS`** in `products.data.ts` with a unique `slug`, `href: '/<slug>.html'`, Font Awesome `icon`, and the three i18n key names.
4. **Add the i18n keys** (`product_<slug>_name`, `product_<slug>_tagline`, `product_<slug>_highlight1..3`) to **all 4 language objects** in `translations.ts`. Page-specific copy on the new product page itself should be prefixed `<slug>_*` (mirrors `erp_*`/`erpnav_*`).
5. **Do not** hand-edit the homepage teaser, nav dropdown, or footer links — they render automatically from step 3.
6. Update `NavbarComponent`'s `isErpPage`-style route-detection (currently hardcoded to `/erp.html`) if the new product page needs its own nav-link set and CTA, the same way ERP does.
7. When a product is no longer "new," delete its `isNew: true` field.

---

## Internationalization (i18n)

**Custom signals-based service — deliberately not `@angular/localize`.** `@angular/localize` is a build-time, one-bundle-per-locale system; it can't reproduce this site's UX of an instant, client-side language switch with no page reload, persisted to `localStorage`. Re-implementing that on top of `@angular/localize` would mean building a custom runtime layer anyway while also paying its build complexity (4x prerender output, XLIFF/JSON extraction). See `src/app/core/i18n/`.

**Supported languages:**

| Code | Language |
|------|----------|
| `en` | English (default) |
| `zh` | Traditional Chinese — 繁體中文 |
| `zh_cn` | Simplified Chinese — 简体中文 |
| `fr` | French — Français |

**How it works:**
- `translations.ts` exports a flat `Record<Lang, Record<string, string>>` — one object per language, ~330+ keys each.
- `TranslationService` holds `currentLang` as a signal, `dict` as a `computed()` over it, and `setLang()` persists to `localStorage['mayfair_lang']` and sets `document.documentElement.lang` (both guarded with `isPlatformBrowser` since they don't exist during prerendering).
- Templates use the `translate` pipe: `{{ 'hero_title' | translate }}`, or `[innerHTML]="'hero_title' | translate"` for keys containing markup (e.g. `<span class='...'>` highlights). The pipe is `pure: false` so it re-evaluates whenever the underlying signal changes.
- Because language is global runtime state (not per-route), there is no i18n involvement in routing and no multiplication of the prerendered output — each route is prerendered once, in English, and `TranslationService` flips the visible strings client-side on hydration if `localStorage` has a saved non-English preference (identical behavior to the old site).

**Key naming convention** (unchanged from before): `nav_*`, `hero_*`, `calc_*`, `billing_*`, `models_*`, `about_*`, `roadmap_*`, `job1_*`…`job5_*`, `form_*`, `footer_*`, `products_*`/`product_<slug>_*`, `<slug>_*`/`<slug>nav_*` for a product's own page copy (e.g. `erp_*`, `erpnav_*`).

**When adding new translatable content:** add the key to all 4 language objects in `translations.ts`, then reference it via the `translate` pipe in the template.

---

## Component Architecture

- **Shell** (`app.ts`/`app.html`): scroll-progress bar + `<app-navbar>` + `<router-outlet>` + `<app-footer>` + `<app-mobile-menu>`, always mounted. `<app-mobile-cta-bar>` is **not** global — it's only used inside `HomeComponent`, matching the old site (the sticky mobile CTA only ever existed on the homepage).
- **`NavbarComponent`/`MobileMenuComponent`** watch `Router` navigation events to pick between `MAIN_NAV_LINKS` and `ERP_NAV_LINKS` (see `nav-link.model.ts`) and to swap the CTA button between "Start Partnership" and "Start Free Trial" depending on whether the current route is `/erp.html`. This uses a plain `signal()` updated via a `Router.events` subscription in the constructor — **not** `toSignal()`, which throws `NG0203` when called this way inside a component field initializer that also touches `this.router` set up earlier in the same constructor chain; a manual subscription + `DestroyRef.onDestroy()` sidesteps it.
- **`GlobeComponent`** (`shared/components/globe/`): hand-rolled SVG 3D globe (no library), interactive. Split by responsibility: `globe.data.ts` (geometry, nodes/edges, tuning constants, palette), `globe.math.ts` (pure projection / drag / inertia maths), `globe.renderer.ts` (`GlobeRenderer` owns every SVG element and repaints for a rotation + focused node), `globe.ts` (lifecycle, rAF loop, pointer input). Drag to spin (Pointer Events, `touch-action: pan-y`, release flings then eases back to `AUTO_SPIN_SPEED`); hover a node to light its constellation edges and slow the spin; click toggles a label card (`globe_node_*` keys, all 4 languages). Guarded behind `isPlatformBrowser`, pauses via `IntersectionObserver`, cancels rAF and removes listeners in `ngOnDestroy`. Under `prefers-reduced-motion` there is no auto-spin or momentum, but drag and hover still repaint on demand. The globe is decorative (`aria-hidden`), only shown at `lg`+. To add a node, add it to `GLOBE_NODES`/`GLOBE_EDGES` and a `globe_node_<name>` key in all 4 languages.
- **`StarfieldComponent`** (`shared/components/starfield/`): canvas sky behind the home hero (first child of the `<header>`). `starfield.math.ts` holds the seeded star generator (3 parallax layers), twinkle, `textSafeAlpha` (dims stars on the headline side so text contrast holds) and shooting-star timing. Parallax follows the pointer over the parent element; DPR capped at 2; paused offscreen; one static frame under `prefers-reduced-motion`.
- **`SavingsCalculatorComponent`**: `computed()` over a `staffCount` signal and `TranslationService.currentLang()` — recomputes automatically on both input and language change, no manual re-invocation wiring needed.
- **`ContactFormComponent`** (home) / inline trial form in `ErpComponent`: Angular reactive forms (`FormBuilder`). On submit, builds a plain-text summary of the answers and opens `https://wa.me/<MayfairTech WhatsApp Business number>?text=<encoded summary>` in a new tab — the visitor still has to hit Send inside WhatsApp, since there is no backend to deliver it silently. Tracks `idle | success | error` in a signal (`success` means the link opened, not that the visitor sent it), swaps in a success card via `@if`.
- **Motion/effects (Phase 1)**: `ScrollStateService` (`core/services/`) exposes a `scrolled` signal — the navbar shrinks and gains a stronger shadow when it's true. `PointerParallaxDirective` (`appPointerParallax`, on the home hero) writes `--px`/`--py` (-1..1) CSS vars; `.globe-tilt` in `styles.css` turns them into a subtle (±4°) 3D tilt on the globe, with a `.globe-glow` halo behind it. `SectionDividerComponent` (`<app-section-divider />`) is the glowing line + diamond between sections. `.text-gradient-hero` (hero headline gradient) and `.btn-glow` (pulsing CTA) are plain CSS classes. `appReveal` accepts `[revealDelay]` (ms) to stagger sibling cards. Everything honours `prefers-reduced-motion` (CSS media query, and the directive skips its listener).
- **Motion/effects (Phase 2)**: the home `#impact` section renders `StatsTicketsComponent` from the `STATS` registry (`core/stats/stats.data.ts`) — to change the figures, edit that array and the `stats_*_label` keys (all 4 languages). `CountUpDirective` (`[appCountUp]`) counts a number up when it scrolls into view; prerendered HTML and reduced-motion visitors keep the final value. `.card-hover` (lift + teal border/glow) is the shared hover style for the "Our Models" cards.
- **`ModelsAccordionComponent`** (`<app-models-accordion>`): the home `#models` section. Driven by `ENGAGEMENT_MODELS` (`core/models/engagement-models.data.ts`, keys `model<N>_*`); one panel open at a time (click, keyboard focus or hover), horizontal at `lg`, stacked below. Buttons carry `aria-expanded`/`aria-controls`.
- **`RevealDirective`** (`appReveal`): replaces the old `.reveal` class + manual `IntersectionObserver` — a single shared observer lives in `RevealObserverService` (`providedIn: 'root'`), and the directive registers/unregisters its host element in `ngOnInit`/`ngOnDestroy`.

---

## SEO

Each page component calls `SeoService.set({...})` (from `core/seo/seo.service.ts`) in its constructor, setting `Title`/`Meta` tags and, for `ErpComponent`, a JSON-LD `SoftwareApplication` script injected via `DOCUMENT`. Because prerendering runs each route through a real (simulated) DOM before serializing to static HTML, these calls land in the final `<head>` correctly — confirmed by inspecting the generated static files after `ng build`.

---

## Deployment

```yaml
# .github/workflows/deploy.yml (simplified)
on: { push: { branches: [main] } }
jobs:
  build:   # npm ci → ng build --base-href "$BASE_HREF" → flatten-html-routes → upload-pages-artifact
  deploy:  # actions/deploy-pages (environment: github-pages)
```

**To deploy:** commit and push to `main`. GitHub Actions installs deps, builds + prerenders all 5 routes, flattens the `.html` route directories into literal files, and deploys the output to GitHub Pages.

---

## Contact & Forms

- **Contact form** (home) & **trial request form** (ERP): both open a pre-filled `wa.me` WhatsApp link to the MayfairTech WhatsApp Business number (`+230 5904 6191`) instead of emailing anywhere — see "Component Architecture" above. No Formspree, no backend.
- **Careers email**: jobs@mayfairtechexpertsolutions.com
- **Fallback contact**: mayfairtechexpertsolutions@gmail.com

---

## Common Tasks

### Add a new section (home page)
1. Add a `<section>` block to `src/app/pages/home/home.html` with an anchor `id`.
2. Add `appReveal` to the section wrapper for the scroll-in animation.
3. Add translation keys to all 4 language objects in `translations.ts`, reference via `| translate`.
4. If it needs its own nav link, add to `MAIN_NAV_LINKS` in `nav-link.model.ts`.

### Add a new product
See "Products Architecture" above.

### Add a new job listing
Add a job card block in `home.html`'s `#careers` section, plus `job6_title`, `job6_tag`, `job6_desc` (etc.) keys to all 4 languages.

### Add a new language
1. Add a new `Lang` union member and language object to `translations.ts`.
2. Add a button/option in `LanguageSwitcherComponent`.
3. No other changes needed — `TranslationService` and the `translate` pipe are language-count-agnostic.

### Update the WhatsApp Business number
Change the `WHATSAPP_NUMBER` constant in both `pages/home/contact-form/contact-form.ts` and `pages/erp/erp.ts` (digits only, international format, no `+` or spaces).

### Local development
Run `./run_angular.sh` — it ensures Node ≥22.22.3 (via nvm, falling back to an error message if nvm isn't available), installs `node_modules` if missing, starts `ng serve` on port 4200, and opens your browser. For a one-off manual run: `npm ci && npx ng serve`.

### Testing the production (prerendered) build locally
`npm run build && node scripts/flatten-html-routes.mjs dist/mayfairtech-website/browser`, then serve `dist/mayfairtech-website/browser` with any static file server that does **not** rewrite/strip `.html` extensions (some tools' "clean URL" features will 301-redirect `/products.html` → `/products`, which breaks the intentionally literal routing — disable that feature if you hit it).

---

## Company Info

- **Company**: MayfairTech Expert Solutions
- **Founder**: Jeff Yeung (楊集東)
- **Location**: Rose-Hill, Mauritius
- **Tagline**: "Stop Renting. Build Your Technology Backbone."
- **Core value prop**: Elite global engineering team → clients own 100% of the IP they fund

---

## Known follow-ups (not yet done)

- **SRI hashes** on the Font Awesome CDN `<link>` and Google Fonts `<link>` in `src/index.html` — carried over unchanged from the old site, still worth adding.
- **CSP**: no Content-Security-Policy is currently configured; GitHub Pages has no native `_headers`-style mechanism (Netlify/Cloudflare-only convention), so this would need a CDN/reverse-proxy in front of GitHub Pages to enforce.
- **`<noscript>` fallback**: the whole site is a JS-rendered Angular SPA now, more so than the old static site — a `<noscript>` message with the fallback email in `src/index.html` would be a reasonable addition.
- **Icon system**: Font Awesome is still CDN-loaded; migrating to `@fortawesome/angular-fontawesome` with tree-shaken SVG imports would drop the CDN dependency and shrink payload, but touches every icon usage across the app — treat as a separate follow-up.
