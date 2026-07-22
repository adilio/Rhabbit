---
name: Rhabbit
description: A pastel storybook habit tracker — soft paper by day, warm charcoal by night.
colors:
  meadow-sage: "#5d7c54"
  meadow-sage-deep: "#4c6844"
  meadow-sage-soft: "#8eae84"
  overcast-sky: "#5e86a4"
  overcast-sky-deep: "#557994"
  overcast-sky-soft: "#e2ecf4"
  overcast-sky-wash: "#f3f7fb"
  carrot: "#e08b3c"
  carrot-leaf: "#6f9a54"
  blush: "#f8e6e6"
  lavender: "#eae5f4"
  butter: "#faf1c9"
  amber: "#8a7022"
  clay-red: "#976565"
  paper: "#fcfaf5"
  paper-raised: "#ffffff"
  paper-overlay: "#f7f2e8"
  border: "#efe7da"
  border-strong: "#e0d5c6"
  border-control: "#8d867d"
  chip-on-bg: "#e2ecf4"
  chip-on-ink: "#314757"
  chip-on-border: "#557994"
  ink: "#3d352f"
  ink-muted: "#635a4f"
  ink-faint: "#75685c"
  ink-on-accent: "#ffffff"
  night: "#1f1b18"
  night-raised: "#2a2420"
  night-overlay: "#332c27"
  night-border: "#3b342e"
  night-border-strong: "#4b433c"
  night-border-control: "#86786b"
  night-ink: "#f7f2eb"
  night-ink-muted: "#d2c5b6"
  night-ink-faint: "#aa9b8b"
typography:
  display:
    fontFamily: "Fraunces Variable, Inter Variable, ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(2.6rem, 8vw, 3.4rem)"
    fontWeight: 750
    lineHeight: 1.1
    letterSpacing: "-0.03em"
    fontVariation: "SOFT 100"
  headline:
    fontFamily: "{typography.display.fontFamily}"
    fontSize: "clamp(1.75rem, 7vw, 2.25rem)"
    fontWeight: 750
    lineHeight: 1.2
    letterSpacing: "-0.02em"
    fontVariation: "SOFT 100"
  title:
    fontFamily: "{typography.display.fontFamily}"
    fontSize: "1.08rem"
    fontWeight: 750
    lineHeight: 1.3
    letterSpacing: "-0.01em"
    fontVariation: "SOFT 100"
  body:
    fontFamily: "Inter Variable, ui-sans-serif, system-ui, -apple-system, Segoe UI, sans-serif"
    fontSize: "1rem"
    fontWeight: 450
    lineHeight: 1.55
    letterSpacing: "normal"
  label:
    fontFamily: "{typography.body.fontFamily}"
    fontSize: "0.7rem"
    fontWeight: 700
    lineHeight: 1.4
    letterSpacing: "0.01em"
  numeric:
    fontFamily: "{typography.body.fontFamily}"
    fontSize: "1.5rem"
    fontWeight: 700
    letterSpacing: "-0.02em"
    fontFeature: "tabular-nums lining-nums"
  scale:
    micro: "0.7rem"
    label: "0.8rem"
    secondary: "0.9rem"
    body: "1rem"
    title-sm: "1.08rem"
    title-md: "1.25rem"
    title-lg: "1.75rem"
    numeric: "1.5rem"
rounded:
  chip: "999px"
  sm: "10px"
  md: "14px"
  lg: "20px"
  xl: "28px"
spacing:
  2xs: "4px"
  xs: "8px"
  sm: "12px"
  md: "16px"
  lg: "20px"
  xl: "28px"
  2xl: "40px"
components:
  button-primary:
    backgroundColor: "{colors.meadow-sage}"
    textColor: "{colors.ink-on-accent}"
    rounded: "{rounded.md}"
    padding: "11px 20px"
    height: "48px"
    typography: "{typography.label}"
  button-primary-hover:
    backgroundColor: "{colors.meadow-sage-deep}"
  button-ghost:
    backgroundColor: "{colors.overcast-sky-wash}"
    textColor: "{colors.ink-muted}"
    rounded: "{rounded.md}"
    padding: "11px 20px"
    height: "48px"
  button-danger:
    textColor: "{colors.clay-red}"
    rounded: "{rounded.md}"
    padding: "11px 20px"
    height: "48px"
  check:
    backgroundColor: "transparent"
    rounded: "999px"
    size: "48px"
  check-checked:
    backgroundColor: "{colors.meadow-sage}"
    textColor: "{colors.ink-on-accent}"
    rounded: "999px"
    size: "48px"
  habit-row:
    backgroundColor: "{colors.paper-raised}"
    textColor: "{colors.ink}"
    rounded: "{rounded.lg}"
    padding: "15px 16px"
    height: "78px"
  habit-row-done:
    backgroundColor: "{colors.meadow-sage}"
  card:
    backgroundColor: "{colors.paper-raised}"
    textColor: "{colors.ink}"
    rounded: "{rounded.lg}"
    padding: "20px"
  input:
    backgroundColor: "{colors.paper-raised}"
    textColor: "{colors.ink}"
    rounded: "12px"
    padding: "10px 14px"
    height: "48px"
  chip:
    backgroundColor: "{colors.paper-overlay}"
    textColor: "{colors.ink-muted}"
    rounded: "{rounded.chip}"
    padding: "8px 15px"
    height: "40px"
  chip-on:
    backgroundColor: "{colors.overcast-sky-soft}"
    textColor: "{colors.chip-on-ink}"
    rounded: "{rounded.chip}"
    padding: "8px 15px"
    height: "40px"
  tab:
    textColor: "{colors.ink-faint}"
    rounded: "{rounded.md}"
    padding: "6px 10px"
    height: "52px"
    typography: "{typography.label}"
  tab-active:
    backgroundColor: "{colors.overcast-sky-soft}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
  sheet:
    backgroundColor: "{colors.paper-raised}"
    rounded: "{rounded.xl}"
    padding: "20px"
  toast:
    backgroundColor: "{colors.paper-overlay}"
    textColor: "{colors.ink}"
    rounded: "{rounded.chip}"
    padding: "9px 16px"
---

# Design System: Rhabbit

## 1. Overview

**Creative North Star: "The Pocket Burrow"**

A small, soft, private place you duck into and out of. Nothing in Rhabbit is
sharp: corners are rounded to 20px and above, surfaces are washed with pale
sky and paper rather than ruled into boxes, and the only bright thing on
screen is the carrot at the end of the path. The interior light is warm in
both themes — a cream-paper day and a warm-charcoal night, never a blue-white
screen and never a black one. You come in, you mark that you showed up, you
leave. The burrow does not ask you to stay.

Depth is softly layered rather than dramatic. Every raised surface — a habit
row, a card, a calendar grid — sits a hairline above the page on a 1px tinted
border and a whisper of shadow, and floating surfaces (sheet, toast, install
banner) lift further with a real shadow. There is a continuous ladder from
page to row to card to sheet, and the eye reads it without being told.

The system rejects the two things PRODUCT.md names. It is not a streak-guilt
tracker: there is no flame, no chain, no red, no counter that resets to zero
and means it. Sage green appears on completion and nowhere else, and there is
no color reserved for failure. And it is not generic SaaS product UI: no
cream-and-slate neutrals, no identical card grid, no tiny tracked uppercase
eyebrow over every section, no hero metric. The pastel identity, the display
serif, and the rabbit are the point of difference and must not be sanded off.

**Key Characteristics:**

- Warm neutrals in both themes; the dark theme is charcoal-brown, never black
- Two accents with strict jobs: sage confirms, sky navigates
- Generous, unmistakable targets in soft shapes — precise in behavior, pillowy in form
- Softly layered depth: hairline lift at rest, real shadow only when floating
- Character concentrated in signature moments (the hop path, the rabbit, empty states), never in labels or data
- Mobile-first: bottom tab bar to 767px, sticky sidebar from 768px, habit lists split into intrinsic columns from 768px (`auto-fill`, 340px minimum), History becomes two panes at 1180px

### The Spacing Contract

Space between things comes from the `--space-*` scale (4 / 8 / 12 / 16 / 20 / 28 / 40). Space *inside* a control does not: button `11px 20px`, chip `8px 15px`, habit row `15px 16px`, and the 44/48px target floors are optical values derived from touch targets, and snapping them to the scale breaks the targets. Density-critical gaps — the calendar grid, the heatmap, the day picker — are computed against available width rather than chosen for rhythm, and are also literal.

**The Grouping Rule.** Space between two surfaces must exceed the padding inside one of them. A stack of cards at 20px padding takes a 28px gap; at 16px the stack read as a single slab rather than as separate decisions.

**Query the container, not the viewport, when width is non-monotonic.** A habit row is ~296px on a phone, ~680px in the single-column desktop band, and ~418px again once the list is two-column — so no media query can size its contents correctly. `.habit-row` is a query container for exactly this reason. Note that `container-type: inline-size` applies `contain: layout`, which makes the element a containing block for fixed-position descendants: never put a container on an ancestor of `.sheet-backdrop`.

## 2. Colors

Pale, chalky, and warm — a picture-book plate rather than a screen palette,
with two muted accents doing all the semantic work.

### Primary

- **Meadow Sage** (`#5d7c54` light / `#8eae84` dark): the confirmation color, and the only color that means "done." It fills the check button when a habit is complete, tints the completed row's background, drives the primary button, colors the calendar's full-day pip and the heatmap ramp, and turns the hop path's stones and carrot green the moment the day is finished. Sage never appears decoratively. If something is sage, something was accomplished.
- **Meadow Sage Deep** (`#4c6844` light / `#a3bf9a` dark): primary button hover, and sage-colored text on a tinted surface — the toast's Undo takes it, because plain sage on the overlay is only 4.20:1.
- **Meadow Sage Soft** (`#8eae84` light / `#afc6a6` dark): partial-progress state on the check button, where a numeric habit has value but hasn't hit target.

### Secondary

- **Overcast Sky** (`#5e86a4` light / `#88abc3` dark): the structural color. It marks the active tab, tints card and habit-row backgrounds through `color-mix`, washes the mobile header and desktop sidebar, colors the time-of-day group labels and glyphs, and lights the hop path's stones before the day is complete. Sky says *where you are*; sage says *what you did*.
- **Overcast Sky Deep** (`#557994` light / `#88abc3` dark): the fill to use whenever sky carries `--ink-on-accent` text. Plain sky is a mid-tone — white on it is 3.87:1 — so any solid sky button takes this instead. In dark mode the two are the same value, because dark pairs sky with dark ink and already clears AA.
- **Overcast Sky Soft** (`#e2ecf4` light / `#252d34` dark): the active-state fill for tabs, chips, day pickers, and selected calendar days.
- **Overcast Sky Wash** (`#f3f7fb` light / `#22303a` dark): the faintest tint, mixed into surfaces at 20–35% so nothing is ever pure white.

### Tertiary

- **Carrot** (`#e08b3c` light / `#e8a05a` dark) and **Carrot Leaf** (`#6f9a54` / `#9cbb84`): reserved exclusively for the hop path's goal marker. The single warmest, most saturated pair in the system, and it appears once per screen at roughly 12px across. That scarcity is what makes reaching it feel like something.
- **Blush** (`#f8e6e6`), **Lavender** (`#eae5f4`), **Butter** (`#faf1c9`): the pastel wash trio. They rotate across habit emoji tiles (`nth-child` 2n / 3n) and insight cards (`nth-child` 3n+1 / 3n+2 / 3n) so repeated elements never read as an identical grid. They carry no meaning — they exist to break uniformity.
- **Amber** (`#8a7022` light / `#d0b54f` dark): the skip marker. A note dot, a half-day calendar pip, a skipped heatmap cell. Deliberately not red: a skip is not a miss.
- **Clay Red** (`#976565` light / `#d29595` dark): form errors and destructive actions only. Muted well below alarm saturation, and never used for a missed habit.

### Neutral

- **Paper** (`#fcfaf5`) / **Night** (`#1f1b18`): the page. Warm in both directions.
- **Paper Raised** (`#ffffff`) / **Night Raised** (`#2a2420`): rows, cards, inputs, sheets — always tinted with sky wash before use, never left pure.
- **Paper Overlay** (`#f7f2e8`) / **Night Overlay** (`#332c27`): the recessed layer — chips, steppers, calendar nav, toasts.
- **Border** (`#efe7da` / `#3b342e`) and **Border Strong** (`#e0d5c6` / `#4b433c`): hairline separation at 1px between *surfaces* — sheets, toasts, dividers, the calendar grid. Deliberately soft; 1px separation is the whole point.
- **Border Control** (`#8d867d` / `#86786b`): the boundary of anything interactive — check button, steppers, inputs, chips, day pickers, calendar nav, and the hop path's unlit stones. WCAG 1.4.11 wants 3:1 for a control's visible boundary and Border Strong reaches only 1.42:1 on a habit row, so the two roles need two values. Never use Border Strong to bound a control.
- **Ink** (`#3d352f` / `#f7f2eb`), **Ink Muted** (`#635a4f` / `#d2c5b6`), **Ink Faint** (`#75685c` / `#aa9b8b`): a three-step text ramp, spaced so every step clears 4.5:1 against the *tinted* surfaces it actually lands on — the sidebar gradient and header wash, not just Paper. Ink Faint's worst case is 4.65:1 on the sidebar's sky-soft top stop. The two lower steps sit only 1.25:1 apart, which is the minimum that still reads as a step: darkening either one collapses the distinction, lightening either one drops below AA.

### Named Rules

**The Two Jobs Rule.** Sage means done. Sky means here. Neither may be borrowed for decoration, and no third color may take on a semantic job. If a new state needs a color, it takes a wash from the pastel trio, not a new accent.

**The Scarce Carrot Rule.** The carrot is the only saturated warm element in the product and it appears exactly once, at the end of the hop path. Adding a second orange anywhere destroys it.

**The No-Failure-Color Rule.** There is no color that means "you missed this." Clay Red belongs to form errors and delete buttons. Amber belongs to skips, which are a legitimate state. An unlogged habit is simply an unlit stone — absence of color, not presence of warning.

**The Never-Pure-White Rule.** No surface is `#ffffff` on its own. Raised surfaces are mixed with 11–35% sky wash so the page reads as paper rather than screen. The one exception is `ink-on-accent`, the white sitting on sage.

## 3. Typography

**Display Font:** Fraunces Variable (falling back to the body stack)
**Body Font:** Inter Variable (falling back to `ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif`)

**Character:** A soft-optical serif against a neutral workhorse sans — paired on a genuine contrast axis, not two sans-serifs pretending to differ. Fraunces runs with `font-optical-sizing: auto` and `SOFT 100` on the variation axis, which rounds its terminals and gives headings a storybook warmth without tipping into whimsy. Inter carries every label, button, field, and number at weight 450 body / 600–700 UI, so the interface stays legible and ordinary exactly where ordinary is a virtue.

### Hierarchy

- **Display** (Fraunces 750, `clamp(2.6rem, 8vw, 3.4rem)`, `1.1`, `-0.03em`): the login wordmark only. The single largest type in the product, and it appears on a screen nobody spends time on.
- **Headline** (Fraunces 750, `clamp(1.75rem, 7vw, 2.25rem)`, `1.2`, `-0.02em`): the Today greeting. The one place a fluid scale is justified, because it wraps a variable-length name.
- **Title** (Fraunces 750, `1.75rem` page/calendar titles / `1.25rem` sheet headings and empty-state titles / `1.08rem` card titles, login tagline, and the brand wordmark, `1.3`, `-0.02em` to `-0.01em`): section and surface headings. Fixed rem, not fluid.
- **Body** (Inter 450, `1rem`, `1.55`): prose, insights, habit names at weight 700, the card-lede datum sentence.
- **Secondary** (Inter 500–600, `0.9rem`): near-body text that isn't primary content — toasts, form errors, the today date, insight and recap sentences, button labels, settings row labels.
- **Label** (Inter 600–700, `0.8rem`): field labels, hints, chip and segmented-control text, table cells, calendar days, small buttons.
- **Micro** (Inter 600–700, `0.7rem`): tab labels, group labels, stat labels, table column headers, the sidebar signature. The floor of the type scale — nothing in the product goes smaller.
- **Numeric** (Inter 700, `1.5rem`, `tabular-nums lining-nums`): stat values. Numbers stay on Inter deliberately — Fraunces figures wobble in a column.

The full ramp is nine steps at roughly a 1.1–1.2 ratio between neighbors: `0.7 / 0.8 / 0.9 / 1 / 1.08 / 1.25 / 1.5 / 1.75rem` plus the two fluid clamps. Nothing outside this ramp; a size that doesn't fit belongs to the nearest step, not a new one-off value. Control glyphs (the sheet's `×` close, the stepper's `−`/`+`, emoji inside the toast and insight rows) are exempt — they're iconography sized to their container, not reading text, and don't count against the ramp.

### Named Rules

**The Sans-For-Work Rule.** Fraunces is forbidden in labels, buttons, form fields, table cells, and any number. It appears in headings, the wordmark, the login tagline, and empty-state titles. Anywhere the user is *doing* rather than *arriving*, the type is Inter.

**The No-Uppercase-Eyebrow Rule.** Tracked uppercase micro-type is permitted in exactly two places: data-table column headers and the `4dl` sidebar signature. It is forbidden above section headings. Time-of-day groups use sentence case with a glyph, and that is the pattern any new grouping follows. Calendar weekday initials are uppercase too and take the same 0.05em tracking as the other two — uppercase without tracking is the one thing this rule can't allow.

**The Fixed-Scale Rule.** Only two elements are fluid — the login wordmark and the Today greeting. Everything else is a fixed rem step. Clamp-sizing a card title makes it worse in a sidebar, not better.

**The Nine-Step Rule.** Every heading, label, and body of text in the product resolves to one of the nine ramp steps above. A new component doesn't invent `0.86rem` because it "looks a little tight" — it takes the nearest step and lets weight or color carry the rest of the distinction.

## 4. Elevation

Softly layered. Depth in Rhabbit is a continuous ladder rather than a binary flat/raised split, and it is built from three materials working together: a tonal wash (the surface is tinted with sky wash so it separates from the page by hue as well as value), a 1px tinted border, and a shadow whose size states how far the element floats. At rest the shadow is a whisper — two pixels, four percent black — enough that a row of habits reads as a stack of soft tiles rather than a ruled list. Only genuinely floating surfaces get a real shadow.

Audit test: if a surface sitting *on* the page casts a shadow you can see from arm's length, it is too heavy. If a sheet sliding *over* the page doesn't, it is too light.

### Shadow Vocabulary

- **Hairline** (`box-shadow: 0 1px 2px rgb(41 37 34 / 0.035)`): habit rows. The lowest rung — perceptible as softness, not as shadow.
- **Resting** (`box-shadow: 0 1px 2px rgb(41 37 34 / 0.04)`): cards, stat tiles, calendar grid. One step up from hairline.
- **Card** (`--shadow-card`: `0 2px 8px rgb(41 37 34 / 0.08)` light, `0 8px 24px rgb(0 0 0 / 0.22)` dark): toasts and the Google sign-in button. The dark theme deliberately spreads further, because a warm-charcoal page swallows a tight shadow.
- **Floating** (`box-shadow: 0 10px 26px rgb(36 31 27 / 0.12)`): the PWA install banner — the highest thing on screen short of a sheet.
- **Ambient glow** (`--glow-a` / `--glow-b` / `--glow-c`): three 400–620px radial washes fixed to the top of the viewport behind everything, in sky, sage, and a faint blush at 6–13% alpha. Atmosphere, not elevation. They are why the page never reads as flat cream.
- **Mark drop-shadows**: `drop-shadow(0 2px 2px …)` on the hopping rabbit, `drop-shadow(0 10px 20px …)` on the login mark. Only the rabbit gets these; icons do not.

### Named Rules

**The Ladder Rule.** Page → hairline row → resting card → card shadow → floating banner → sheet. Every new surface must claim a rung on that ladder. Two surfaces at the same rung must not be nested inside one another. When a same-rung surface genuinely belongs inside a card, it surrenders its own surface rather than stacking one: `.card .stat` drops its background, border and padding and lets the grid gap separate the tiles, and `.card .table-wrap` bleeds to the card's edges keeping only its horizontal hairlines. A bordered box inside a bordered box gives two 1px lines 20px apart and two nested 20px radii, which reads as a rendering artifact, not as depth.

**The Backdrop-Blur Budget Rule.** `backdrop-filter` is spent in two places, both functional rather than decorative. The bottom tab bar (`blur(14px)` over 90% raised) is what makes content scroll believably under the bar. The login card (`blur(28px) saturate(1.28)`) is what makes the sign-in form legible over a full-bleed photo without boxing it in an opaque panel — the one screen in the product that sits on top of a photograph rather than a flat surface. Glass anywhere else is decoration and is prohibited.

## 5. Components

Precise in behavior, pillowy in form. Targets are generous and shapes are soft, but feedback stays restrained — one 350ms pop on the check, one 260ms bob on the rabbit, and nothing else springs. The softness lives in the geometry, not in the motion.

### Buttons

- **Shape:** softly rounded (14px), dropping to 10px at small size. Never a pill, never square.
- **Primary:** Meadow Sage fill, white text, 48px minimum height, 11px/20px padding, weight 700 at 0.95rem. Hover deepens to Sage Deep.
- **Ghost:** sky-wash fill at 34% over the raised surface, Ink Muted text, Border Strong stroke. Hover raises the text to full Ink and the border toward sky. This is the everyday secondary — "Add a habit" uses it, full-width, below the list.
- **Danger:** transparent, Clay Red text, Clay Red border at 35% alpha. Hover fills 12%. Never a solid red fill.
- **Disabled:** 55% opacity, `cursor: not-allowed`. No color change.
- **Focus:** the global ring — 3px solid sage, 3px offset, 6px radius. It is never removed, on any control.

### The check button — signature component

The single most important target in the product. A 48px circle with a 2px Border Strong ring and an invisible checkmark at rest; on completion it fills sage, the mark turns white, and it plays a 350ms overshoot pop (`cubic-bezier(0.22, 1.61, 0.36, 1)`). Pressing scales to 0.9. Numeric habits get a third state: the ring turns sage, the count replaces the mark in 0.72rem/700, and the circle stays unfilled until target is met. Every state carries `aria-pressed` and a label naming the habit.

### Habit rows

- **Corner style:** 20px pillow.
- **Background:** raised paper mixed with 22% sky wash; a 1px border of 12% sky over the base border.
- **Height:** 78px minimum — a comfortable one-handed thumb target with room for a sub-line.
- **Done:** background shifts to 8% sage, the border to 30% sage, and an inset 4px sage bar appears on the leading edge.
- **Skipped:** 62% opacity, no color change. It recedes; it is not marked.
- **Hover:** border darkens to Border Strong. Nothing moves.
- **Emoji tile:** a 30px square with intentionally uneven corners (`10px 12px 9px 13px`), filled from the pastel trio by row index. The wobble is the point — it reads hand-cut rather than generated.

### Cards / containers

- **Corner style:** 20px, matching rows; 28px for sheets and empty states.
- **Background:** raised paper with 20% sky wash; calendar grid at 25%.
- **Border:** 1px at 11–14% sky over base.
- **Shadow:** Resting rung (see Elevation).
- **Padding:** 20px; 14px for the calendar grid; 16px for insights.

### Inputs / fields

- **Style:** raised background, 1px Border Strong, 12px radius, 48px minimum height, 10px/14px padding.
- **Focus:** border shifts to sage and the global focus ring lands outside it. No glow, no shadow.
- **Label:** 0.82rem Inter 600 in Ink Muted, 6px above the field.
- **Placeholder:** Ink Faint — the same value as the body-text floor, deliberately not a lighter gray.
- **Error:** Clay Red message at 0.92rem below the field; hint text is Ink Faint at 0.82rem.

### Chips & segmented controls

- **Style:** fully rounded (999px), overlay background, Border Strong stroke, Ink Muted text, 40px height.
- **Selected:** sky-soft fill with a `#314757` foreground and `#a9c4d7` border; the dark theme inverts to a `#314757` fill with white text. Day pickers are the same treatment in a 40px circle.

### Navigation

- **Mobile (<768px):** fixed bottom tab bar, 72px tall plus safe-area inset, 90% raised background under a 14px backdrop blur, 1px top border. Four tabs at 72px minimum width, icon over 0.72rem label. Active takes a sky-soft pill and full Ink, with the icon in sky. A 64px header carries the wordmark and theme toggle.
- **Desktop (≥768px):** the tab bar and header disappear; a 240px sticky sidebar takes over, running a three-stop gradient from sky-soft through sky-wash to a hint of blush. The same `.tab` component reflows to a horizontal row at 48px. The sidebar closes with the theme toggle and the `4dl` signature.
- **Wide (≥1180px):** the shell opens to 980px, and History splits into two panes — the calendar picker at ~1.55fr beside its day detail at 1fr, top-aligned. Habit lists do *not* wait for this breakpoint; they split intrinsically from 768px via `repeat(auto-fill, minmax(340px, 1fr))`, so columns appear when a row can actually hold one rather than at a fixed width.

### The hop path — signature component

Rhabbit's progress element, and the reason there is no ring or percentage anywhere in the product. A dotted trail runs from a burrow through one stepping stone per habit due today to a carrot at the end. Completed stones light sky-blue with a check; the rabbit stands on the last one it reached and glides left-to-right on a 280ms `cubic-bezier(0.33, 0, 0.2, 1)` transition while a 260ms WAAPI keyframe bobs it 15px up — together the two read as a hop. When the day completes, every stone turns sage and the carrot pops to full saturation over 500ms.

It is a legend as much as a meter: each stone *is* a specific habit and lights from that habit's own state, so the path shows *what* is left, not just how much. Past a 30px-per-landing floor it scrolls horizontally rather than shrinking — at 30 habits the old fixed-width path rendered 3px stones. It carries a full sentence as `aria-label` and is `role="img"`. The bob is gated on `matchMedia('(prefers-reduced-motion: reduce)')` in addition to the global CSS reset.

### Toasts

Fully rounded, overlay background, Border Strong stroke, Card shadow, 9px/16px padding, floating 96px above the bottom edge on mobile and 24px on desktop, where there is no tab bar to clear. They enter on a 280ms overshoot and leave on a 250ms fade-down. Every state-changing action produces one, and almost every one carries an Undo in sage. The hop emoji bounces once alongside the message.

The toast outranks the PWA banner: `z-index: 70` against the banner's 65, and `body:has(.pwa-banner)` lifts it clear of the banner's band entirely. The two used to occupy overlapping bands with the banner on top, so completing a habit while the offline banner was showing hid the toast and its Undo — and the offline banner is up precisely when someone is most likely to be logging. A persistent, re-offerable banner never obscures a timed, undoable one.

### Sheets

Bottom sheets on mobile (28px top corners, full width, 88dvh max, sliding up 40px over 300ms behind a 55% black backdrop); centered dialogs from 700px (28px all round, 640–680px max width, 82dvh). This is the only modal pattern in the product — habit detail, habit editor, and confirmations all use it.

## 6. Do's and Don'ts

### Do:

- **Do** keep sage for completion and sky for orientation. A new state gets a pastel wash from the Blush / Lavender / Butter trio, never a fourth accent.
- **Do** mix every raised surface with 11–35% sky wash before using it. Pure `#ffffff` and pure `#000000` do not appear in this system.
- **Do** hold 48px for anything on the logging path — the check button, primary and ghost buttons, inputs — and 78px for habit rows. One-handed reach on a phone is the governing constraint.
- **Do** hold 44px as the floor for secondary controls: steppers, sheet close, calendar nav, and calendar day cells (which take `min-height: 44px` alongside `aspect-ratio: 1`, so they go slightly tall on the narrowest phones rather than dropping to the ~37px a square cell would compute to). Chips and day pickers are the one documented exception at 40px, because they are dense multi-select inside a form; that is still well above WCAG 2.2's 24px AA minimum. The day picker's seven circles flex between 36 and 40px rather than sitting fixed — seven fixed 40s plus gaps overflow a 320px sheet and silently scroll Sat/Sun out of view.
- **Do** give every state-changing action a toast with an Undo. Undo is the mechanism that makes the product forgiving; it is not optional polish.
- **Do** set `font-variation-settings: "SOFT" 100` and `font-optical-sizing: auto` on every Fraunces element. Fraunces without the SOFT axis is a different, colder typeface.
- **Do** use `tabular-nums lining-nums` on any figure that updates in place, so counts don't jitter.
- **Do** gate JS-driven motion on `matchMedia('(prefers-reduced-motion: reduce)')` as well as the global CSS duration reset. The reset zeroes CSS transitions but not Web Animations.
- **Do** rotate pastel washes by `nth-child` when a list repeats, so a run of similar elements never reads as a uniform grid.
- **Do** keep the ambient `--glow-a` / `--glow-b` radials behind the page. They are what stop the light theme reading as flat cream.

### Don't:

- **Don't** introduce streak-guilt visuals: no flames, no chain graphics, no counter that resets to zero, no red or warning color on an unlogged habit. This is Rhabbit's primary anti-reference and it is a hard prohibition.
- **Don't** drift toward generic SaaS product UI — cream-and-slate neutrals, identical card grids, hero metrics with a big number and a small label. Rhabbit's pastel identity, Fraunces headings, and rabbit are the differentiator; sanding them off is a regression, not a simplification.
- **Don't** put a tiny tracked uppercase eyebrow above a section heading. Time-of-day groups set the pattern: sentence case with a glyph.
- **Don't** use a colored side stripe as a decorative accent. The 4px inset bar on a completed row is the one sanctioned instance — it is semantic (this is done) and it is the exception, not a pattern to copy.
- **Don't** put Fraunces on a button, a form label, a table cell, or a number.
- **Don't** add `backdrop-filter` anywhere but the mobile tab bar and the login card. The blur budget is spent.
- **Don't** use `background-clip: text` with a gradient, anywhere, for anything.
- **Don't** add a second saturated warm element. The carrot's rarity is the entire reason reaching it registers.
- **Don't** bound a control with Border Strong. It is a surface hairline (1.42:1 on a habit row) and fails WCAG 1.4.11's 3:1 for a control boundary. Controls take Border Control. A selected state must not *reduce* the boundary contrast below the unselected one.
- **Don't** lead a habit surface with a streak counter. Current/best streak is a counter that resets to zero and means it — the primary anti-reference. Describe what happened in plain language instead: totals, rates, comebacks.
- **Don't** lighten Ink Muted or Ink Faint. They are the floor for labels, placeholders, and hints, and they are already at the minimum spacing that reads as two distinct steps. Check any new value against the *tinted* surfaces (sidebar gradient, mobile header, calendar grid), not against Paper — Paper is the easy case.
- **Don't** hardcode `#fff` as a foreground on an accent fill. Use `--ink-on-accent`, which flips per theme, and pair it with `--sky-deep` rather than `--sky` when the fill is blue — plain sky is a mid-tone and white on it is 3.87:1.
- **Don't** put plain `--sage` on a tinted surface as *text*. It clears AA as a fill behind white, but only 4.20:1 as ink on the toast overlay. Sage-as-text takes `--sage-deep`.
- **Don't** reach for a modal by default. Sheets exist for habit detail and editing; everything else should be inline with undo.
- **Don't** nest a card inside a card, or place two surfaces from the same elevation rung inside one another.
