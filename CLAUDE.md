# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A client-side deterministic password generator. Users combine a master password with a service-specific distinction code to derive unique passwords. All computation is local (no server). The UI supports Chinese and English (i18n). Supports PWA for offline use.

**Live site:** https://mrjooz.github.io/password-generator/

## Development

No build step, package manager, bundler, test framework, or linter. The project is static HTML/CSS/JS.

To serve locally:
```
python -m http.server 8000
```
Then open `http://localhost:8000` in a browser.

**Important:** Web Crypto API (used by v2 algorithm) requires HTTPS or `localhost`. It will not work over plain HTTP on non-localhost origins.

Minified files (`.min.js`, `.min.css`) are committed alongside source files. If you edit source files, the corresponding `.min` files should also be updated. To regenerate:
```
npx terser src/seek_password.js -o src/seek_password.min.js --compress --mangle
npx terser src/app.js -o src/app.min.js --compress --mangle
npx terser src/i18n.js -o src/i18n.min.js --compress --mangle
npx terser src/service-codes.js -o src/service-codes.min.js --compress --mangle
```

## Architecture

**Entry point:** `index.html` — contains the Bootstrap 5.3 form UI. Loads `src/i18n.js` for i18n translations, `src/service-codes.js` for service code history management, and `src/app.js` for UX logic (copy feedback, validation, strength meter, visibility toggle, language toggle, service code dropdown, Service Worker registration). The core `generate_password()` is in `src/seek_password.js`.

**Core algorithm:** `src/seek_password.js` — provides two algorithm versions:

### v1 (Legacy)
- `hex_password(pwd, key)` — triple SHA-512 HMAC derivation producing a 128-char hex hash. Uses `sha512.hmac()` from `js/sha512.min.js`.
- `seek_password(hash, length, punctuationRule, caseRule)` — maps the hex hash into a password using cumulative charCode modulo mapping. Punctuation set: `,.:;!?`

### v2 (Recommended)
- `hex_password_v2(pwd, key)` — async. Uses Web Crypto PBKDF2-SHA512 with 200,000 iterations. Salt: `"pw-gen-v2:" + serviceCode`. Returns 128-byte `Uint8Array` (1024 bits, ample margin for rejection sampling).
- `seek_password_v2(bytes, length, punctuationRule, caseRule)` — uses rejection sampling (no modulo bias). Punctuation set: `~!@#$%^&*()-_=+`. Guarantees all enabled character categories are present via deterministic replacement.

### Shared utilities
- `get_select_option(id)` — reads a `<select>` element's current value/text.
- `generate_password()` — async entry point. Reads the algorithm version selector and dispatches to v1 or v2 accordingly.

**Bundled libraries** (all in `js/`, no npm — vendored minified files):
- `sha512.min.js` — js-sha512 v0.8.0, provides `sha512.hmac()`
- `clipboard.min.js` — Clipboard.js for copy-to-clipboard
- `PasswordQualityCalculator.min.js` — password strength meter
- `bootstrap.min.js` + `css/bootstrap.min.css` — Bootstrap 5.3
- `css/bootstrap-icons.min.css` + `css/fonts/` — Bootstrap Icons 1.11

**Data flow:** User input → version check → v1 path (`hex_password` → `seek_password`) or v2 path (`hex_password_v2` → `seek_password_v2`) → display result + strength assessment via `PasswordQualityCalculator`.

## PWA Support

- `manifest.json` — Web App Manifest for installability
- `sw.js` — Service Worker with cache-first strategy for offline support. On activation with old caches present, notifies the page via `postMessage` to prompt a refresh.
- `icons/icon-192.png`, `icons/icon-512.png` — PWA icons generated from `favicon.ico`

When updating cached assets, bump the `CACHE_NAME` version in `sw.js` to invalidate old caches.

## i18n

`src/i18n.js` provides a simple translation dictionary system. Key functions:
- `t(key)` — returns the translation string for the current language
- `setLang(lang)` — switches language ('zh' or 'en'), persists to localStorage, and re-renders all `data-i18n` elements
- `translatePage()` — applies translations to DOM elements via `data-i18n`, `data-i18n-placeholder`, and `data-i18n-aria` attributes

All translatable text in `index.html` uses `data-i18n` attributes. Dynamic strings in `src/app.js` use `t()` calls.

## Service Code History

`src/service-codes.js` manages previously used service codes in localStorage (key: `savedServiceCodes`). Only service codes are stored — never passwords. Functions:
- `getSavedServiceCodes()` — returns array of saved codes (LRU order)
- `saveServiceCode(code)` — adds/moves code to front (max 50 entries)
- `deleteServiceCode(code)` — removes a code

The dropdown UI is rendered in `src/app.js` and appears when the service code input is focused.

## UX Features

- **Enter key** triggers password generation from either input field
- **Auto-copy** to clipboard after generation (requires secure context)
- **Copy feedback** — checkmark shown for 2 seconds on both auto-copy and manual copy; exclamation icon on failure
- **Sensitive value cleanup** — password output and strength bar are cleared when the page becomes hidden (tab switch, minimize)
- **Algorithm version tooltip** — help text below the version selector explains v1 vs v2
- **Language toggle** — switches between Chinese and English, persisted in localStorage
- **Service code history** — dropdown of previously used service codes with filtering and deletion

## Testing

Open `http://localhost:8000/test.html` in a browser (requires HTTPS or `localhost` for Web Crypto API). Tests run automatically on page load and display pass/fail results. No test framework needed.

Test coverage:
- v1 and v2 determinism (same input produces same output)
- Character category coverage (all enabled categories present in output)
- Various password lengths (10-20)
- Cross-version difference (v1 and v2 produce different outputs)
- Lowercase-only mode validation
- Option combinations (punctuation off + case on, punctuation on + case off) for both v1 and v2
