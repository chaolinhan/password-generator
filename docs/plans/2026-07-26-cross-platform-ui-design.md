# Cross-Platform UI Design

## Direction

The interface will feel like a precise personal tool: restrained, calm, and trustworthy rather than decorative. A warm paper background, deep ink text, and a single teal accent replace the generic blue utility-card look. Typography uses an offline-safe editorial serif for the product statement and a platform-native sans stack for controls. Subtle grid texture, hairline borders, and measured motion provide depth without visual noise.

## Responsive Structure

The app shell becomes a two-column composition above 960 px. A compact identity and privacy panel explains the product; the generator remains the dominant workspace. Tablet layouts collapse the identity panel into a horizontal introduction. Phones use a single edge-to-edge column with safe-area padding, 44 px minimum touch targets, 16 px inputs to prevent iOS zoom, and wrapping output text. No horizontal scrolling is permitted from 320 px upward.

## Interaction Model

The primary path remains: enter a master password, enter a service code, generate, and copy. Labels and short hints stay visible instead of relying on floating placeholders. Advanced settings remain collapsed by default. The result area receives clearer empty, loading, ready, strength, and copy-feedback states. Saved service codes become keyboard-operable. Language and theme controls use consistent icon buttons and visible focus rings.

## Cross-Platform Delivery

The existing static architecture and deterministic algorithms remain unchanged. PWA metadata will be expanded for installation on Android, iOS, Windows, macOS, and ChromeOS. An install action appears only when supported; iOS receives concise Add to Home Screen guidance. Safe-area CSS, dynamic viewport units, reduced-motion support, standalone-display styling, and an updated service-worker cache make the same codebase usable in browser and installed modes.

## Acceptance Criteria

- Core generation output remains deterministic and all regression tests pass.
- Layout works without horizontal overflow at 320, 390, 768, 1024, and 1440 px.
- Interactive controls meet a 44 px touch target and have keyboard focus states.
- Light/dark themes and Chinese/English copy remain complete.
- PWA manifest, icons, service worker, and offline fallback remain valid.
