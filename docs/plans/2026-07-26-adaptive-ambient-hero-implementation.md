# Adaptive Ambient Hero Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a refined animated background to the identity panel that adapts cleanly to light and dark themes.

**Architecture:** Extend the existing CSS token system and pseudo-element layers; do not add runtime animation logic or external assets. Keep theme switching in the existing `data-bs-theme` flow and let CSS respond automatically.

**Tech Stack:** Static HTML, CSS custom properties, CSS gradients/keyframes, Clean-CSS, GitHub Pages.

---

### Task 1: Add theme-specific ambient tokens

**Files:**
- Modify: `css/style.css:2-54`

**Steps:**

1. Add page-glow, identity-border, card, speck, orbit, and glow variables to both themes.
2. Change the light identity palette to warm ivory/sage with dark forest text.
3. Keep the dark palette ink-green with brighter teal atmosphere.
4. Inspect both token sets for readable text and distinct surfaces.

### Task 2: Build the CSS atmosphere

**Files:**
- Modify: `css/style.css:70-240`

**Steps:**

1. Add a fixed page glow behind the shell.
2. Convert the identity pseudo-elements into drifting glows and animated orbital rings.
3. Add a masked, low-opacity dot field behind the hero copy.
4. Keep every decorative layer below content and non-interactive.
5. Add 24–32 second keyframes with gentle easing.

### Task 3: Tune responsive and reduced-motion behavior

**Files:**
- Modify: `css/style.css:1123-1360`

**Steps:**

1. Reduce decorative intensity on phone layouts.
2. Disable all new animations in the existing reduced-motion media query.
3. Confirm the theme transition does not alter layout dimensions.

### Task 4: Generate production assets and invalidate caches

**Files:**
- Modify: `css/style.min.css`
- Modify: `sw.js:1`

**Steps:**

1. Run `npx --package clean-css-cli cleancss -o css/style.min.css css/style.css`.
2. Change `CACHE_NAME` from `pw-gen-v9` to `pw-gen-v10`.
3. Confirm `style.min.css` contains the new keyframes and reduced-motion rules.

### Task 5: Verify and deploy

**Files:**
- Test: `test.html`

**Steps:**

1. Run the online/local regression suite and expect `85 passed, 0 failed`.
2. Test light and dark themes at 360px, 768px, and 1440px.
3. Confirm no horizontal overflow and inspect representative screenshots.
4. Commit with `feat: add adaptive ambient hero`.
5. Push `master` to `chaolinhan/password-generator`.
6. Confirm GitHub Pages serves the committed CSS and `pw-gen-v10`.
