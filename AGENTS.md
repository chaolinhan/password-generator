# Repository Guidelines

## Project Structure & Module Organization

This repository is a dependency-free static web application. `index.html` defines the Bootstrap-based interface. Editable application code lives in `src/`: `seek_password.js` contains the deterministic v1/v2 derivation algorithms, `app.js` coordinates UI behavior, `i18n.js` owns Chinese and English strings, `service-codes.js` manages local history, and `pbkdf2-worker.js` performs background derivation. Each source file has a committed `.min.js` counterpart used in production. Custom styles are in `css/style.css`; vendored libraries, fonts, icons, and PWA assets live under `js/`, `css/fonts/`, and `icons/`. `sw.js`, `manifest.json`, and `offline.html` implement offline support. Browser regression tests are in `test.html`.

## Build, Test, and Development Commands

There is no package manifest or build step. Serve the repository from its root:

```sh
python3 -m http.server 8000
```

Open `http://localhost:8000/` for manual testing and `/test.html` for the regression suite. Use `localhost` because Web Crypto requires a secure context.

After changing JavaScript, regenerate the matching minified file:

```sh
npx terser src/app.js -o src/app.min.js --compress --mangle
npx --package clean-css-cli cleancss -o css/style.min.css css/style.css
```

Apply the same Terser pattern to other edited files in `src/`. When cached assets change, bump `CACHE_NAME` in `sw.js`.

## Coding Style & Naming Conventions

Follow the existing ES5-compatible style: two-space indentation, semicolons, single quotes in JavaScript, `var` declarations, and `snake_case` function names such as `generate_password`. Use kebab-case for HTML IDs and CSS classes. Keep user-facing text in `src/i18n.js`; HTML text should use `data-i18n`, `data-i18n-placeholder`, or `data-i18n-aria`. Do not edit vendored files in `js/` or generated `.min.*` files directly.

## Testing Guidelines

Run `test.html` after every algorithm or option change. It must report zero failures across determinism, character-category, length, passphrase, and cross-version cases. Add focused `assert(...)` cases near the relevant section. Also verify generation, copy feedback, language/theme toggles, service-code history, and offline refresh behavior manually.

## Commit & Pull Request Guidelines

History favors short imperative summaries, often with a type prefix (for example, `feat: add passphrase mode`). Keep each commit focused and include regenerated minified assets. Pull requests should explain behavior and security impact, list tests performed, link related issues, and include screenshots for visible UI changes.

## Security & Privacy

Never log, persist, or transmit master passwords or generated output. Preserve local-only computation; only service-code history may be stored in `localStorage`.
