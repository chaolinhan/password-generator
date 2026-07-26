# Adaptive Ambient Hero Design

## Direction

The identity panel becomes a true dual-theme surface rather than remaining dark in both modes. Light mode uses warm ivory, sage, and muted teal with dark forest text. Dark mode keeps the existing ink-green character while adding deeper tonal separation. The generator panel remains the visual work surface; the identity panel stays expressive but secondary to the form.

## Background System

The atmosphere is CSS-only and uses three restrained layers:

1. Two oversized radial glows drift slowly behind the identity content.
2. The existing orbital rings gain a subtle floating rotation.
3. A masked dot/grain field breathes at very low opacity.

The page background also receives one slow ambient glow so the two cards feel placed in the same environment. Animation cycles run for 24–32 seconds with gentle easing and no pointer tracking. All decorative layers ignore pointer input and sit below the content.

## Theme and Accessibility

Theme-specific CSS variables control panel background, text, borders, glows, cards, and page atmosphere. Light mode must retain readable dark text; dark mode must retain the current warm-white typography. Existing theme persistence and the default light preference remain unchanged.

`prefers-reduced-motion: reduce` disables all new movement while preserving the static composition. Mobile breakpoints lower decoration opacity and reduce orbit scale so the hero remains calm and compact. No external assets, libraries, canvas, or JavaScript animation are introduced.

## Verification

Verify both themes at phone, tablet, and desktop widths; confirm no horizontal overflow, legible contrast, non-blocking controls, and visible but restrained motion. Confirm reduced-motion CSS coverage, regenerate `style.min.css`, bump the service-worker cache, run the 85 algorithm tests, and deploy the exact committed assets to GitHub Pages.
