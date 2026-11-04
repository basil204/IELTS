---
name: THE IELTS DICTIONARY × WORD ATLAS
description: International Concourse Wayfinding & Split-Flap Bento Design System for IELTS Vocabulary & Exam Prep
colors:
  signal-yellow: "#FACC15"
  signal-yellow-hover: "#EAB308"
  passport-emerald: "#065F46"
  passport-emerald-bright: "#10B981"
  signal-vermilion: "#EA580C"
  birch-ground: "#F4F1EA"
  birch-deep: "#EAE5D9"
  concourse-charcoal: "#16181D"
  concourse-slate: "#1F2229"
  concourse-elevated: "#272B35"
  border-dark-hairline: "#2E3340"
  border-input-dark: "#363B47"
  ink-secondary: "#4A4740"
  ink-muted-on-dark: "#B8B2A6"
typography:
  display:
    fontFamily: "Archivo, sans-serif"
    fontSize: "2.625rem"
    fontWeight: 900
    lineHeight: 1
    letterSpacing: "-0.03em"
  headline:
    fontFamily: "Archivo, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 800
    lineHeight: 1.2
    letterSpacing: "-0.01em"
  title:
    fontFamily: "Archivo, sans-serif"
    fontSize: "0.9375rem"
    fontWeight: 800
    lineHeight: 1.3
    letterSpacing: "0.02em"
  body:
    fontFamily: "Be Vietnam Pro, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.6
  label:
    fontFamily: "JetBrains Mono, monospace"
    fontSize: "0.75rem"
    fontWeight: 700
    lineHeight: 1.2
rounded:
  sm: "6px"
  md: "8px"
  lg: "12px"
  xl: "16px"
spacing:
  xs: "6px"
  sm: "10px"
  md: "16px"
  lg: "20px"
  xl: "28px"
components:
  button-primary:
    backgroundColor: "{colors.passport-emerald}"
    textColor: "{colors.birch-ground}"
    typography: "{typography.title}"
    rounded: "{rounded.lg}"
    padding: "14px 20px"
  button-primary-hover:
    backgroundColor: "{colors.passport-emerald-bright}"
    textColor: "{colors.concourse-charcoal}"
  button-wayfinding:
    backgroundColor: "{colors.signal-yellow}"
    textColor: "{colors.concourse-charcoal}"
    typography: "{typography.title}"
    rounded: "{rounded.md}"
    padding: "10px 16px"
  card-concourse:
    backgroundColor: "{colors.concourse-charcoal}"
    textColor: "{colors.birch-ground}"
    rounded: "{rounded.xl}"
    padding: "20px"
  input-dark:
    backgroundColor: "{colors.concourse-slate}"
    textColor: "{colors.birch-ground}"
    rounded: "{rounded.md}"
    padding: "8px 14px"
---

# Design System: THE IELTS DICTIONARY × WORD ATLAS

## Overview

**Creative North Star: "The International Departure Concourse & Split-Flap Lexicon"**

THE IELTS DICTIONARY × WORD ATLAS treats daily IELTS preparation not as a passive textbook or generic SaaS dashboard, but as an international departure concourse where every study module is a numbered wayfinding gate (`01` through `06`). High-contrast matte charcoal boards sit atop a warm architectural Birch Alabaster ground, allowing learners to scan their entire study itinerary in five seconds and step directly into active FSRS spaced-repetition review, contextual UK/US audio playback, and computer-delivered exam simulation.

The system balances architectural authority with cognitive clarity. Rather than scattering decorative gradients or nested card boxes across the screen, it uses bold wayfinding yellow frames to isolate the primary daily learning station (`02 / Hôm Nay Học Gì`), crisp horizontal hairline dividers to organize dense bilingual English–Vietnamese lexical data, and mechanical split-flap counters to celebrate daily consistency.

**Key Characteristics:**
- Asymmetric 12-column Bento Concourse architecture with numbered gate headers (`01`–`06`) integrated directly into section titles.
- Warm Birch Alabaster daylight ground (`#F4F1EA`) paired with high-contrast Split-Flap Charcoal modules (`#16181D`) and International Wayfinding Yellow (`#FACC15`) focal frames.
- Tri-voice typography combining Swiss-international signage display (`Archivo`), native Vietnamese editorial legibility (`Be Vietnam Pro`), and tabular phonetic/telemetry precision (`JetBrains Mono`).
- Semantic color coding across all 6 CEFR levels (`A1`–`C2`) and 4 FSRS memory rating intervals (`Again`, `Hard`, `Good`, `Easy`).

## Colors

The palette pairs warm archival paper daylight with high-contrast terminal signage inks so learners can study comfortably for hours while immediately spotting priority actions and memory states.

### Primary
- **International Wayfinding Yellow** (`#FACC15`): Owns the centerpiece FSRS learning station frame, active tab indicators, primary search/filter highlights, and split-flap streak digits. Hover shifts to deeper Amber Gold (`#EAB308`).

### Secondary
- **British Passport Emerald** (`#065F46`): Anchors primary header calls-to-action (`Bắt Đầu Học Ngay`), `Easy` FSRS mastery confirmation, and verified answer badges. Bright Emerald (`#10B981`) highlights active retention stability metrics and live user XP on dark surfaces.

### Tertiary
- **Signal Vermilion** (`#EA580C`): Marks departure baseline bands (`Band 5.0`), `Again` FSRS reset triggers, part-of-speech tags, and high-priority exam probability badges (`CRITICAL 90%`).

### Neutral
- **Birch Alabaster Ground** (`#F4F1EA`) & **Deep Birch** (`#EAE5D9`): The primary page canvas and reading passage surface, eliminating harsh pure-white glare during long reading sessions.
- **Concourse Charcoal** (`#16181D`), **Concourse Slate** (`#1F2229`), & **Elevated Slate** (`#272B35`): Primary Bento module surfaces, interactive lexical theatre backgrounds, and input wells.
- **Dark Hairline Rule** (`#2E3340`): Structural 1px dividers separating rows, tabs, and sub-panels inside dark modules.
- **Warm Charcoal Secondary Ink** (`#4A4740`) & **Sand Muted Ink on Dark** (`#B8B2A6`): Secondary copy and phonetic metadata, tinted from the warm birch ground rather than neutral gray.

### Named Rules
**The Wayfinding Focal Rule.** International Wayfinding Yellow (`#FACC15`) as a full container fill is reserved exclusively for Station `02 / Hôm Nay Học Gì` and active filter/tab states so the learner's daily FSRS task never competes with secondary modules.

**The Warm-Tinted Neutral Rule.** Secondary text on dark charcoal panels always uses warm sand (`#B8B2A6`) and secondary text on light birch always uses warm umber (`#4A4740`), never desaturated cool gray.

## Typography

**Display Font:** Archivo (with system sans-serif fallback)
**Body Font:** Be Vietnam Pro (with sans-serif fallback)
**Label/Mono Font:** JetBrains Mono (with monospace fallback)

**Character:** `Archivo` delivers the unmistakable authority of international airport signage and numbered gate headers; `Be Vietnam Pro` provides effortless Vietnamese diacritic clarity across dense bilingual definitions; `JetBrains Mono` locks IPA phonetics, FSRS intervals, and countdown timers to a strict tabular grid.

### Hierarchy
- **Display** (900 weight, 2.625rem / 42px, line-height 1.0): Active vocabulary headwords in the lexical theatre and top masthead identity.
- **Headline** (800 weight, 1.25rem / 20px, line-height 1.2): Section gate headers (`05 / KHO HỌC LIỆU THỰC CHIẾN MY-IELTS`) and passage titles.
- **Title** (800 weight, 0.9375rem / 15px, line-height 1.3): Bento module headers (`01 / LỘ TRÌNH ADAPTIVE`, `03 / WORD ATLAS`, `04 / ĐUA TOP SĂN VIP`) and primary buttons.
- **Body** (400–500 weight, 1rem / 16px, line-height 1.6, 65–75ch max measure): Vietnamese and English definitions, contextual example sentences, and reading passages.
- **Label** (700 weight, 0.75rem / 12px, line-height 1.2, `tabular-nums`): IPA transcriptions, CEFR chips, FSRS interval buttons (`[Again 10m]`), and question indices.

### Named Rules
**The Single-Line Gate Header Rule.** Module numbers (`01 /`, `02 /`, `03 /`) are integrated directly into the heading line itself; never place a small uppercase kicker or eyebrow label above a heading.

**The Tabular Telemetry Rule.** Every counter, streak digit, countdown clock, XP score, and FSRS day interval uses `JetBrains Mono` with `font-variant-numeric: tabular-nums`.

## Layout

The layout uses a centered `1440px` maximum container (`px-4 sm:px-6 lg:px-8`) built on a 12-column CSS Grid (`gap-5` / `20px`). In the first viewport, Column 1 (`lg:col-span-3`) holds the Adaptive Route telemetry, Column 2 (`lg:col-span-6`) gives 50% of the horizontal width to the interactive FSRS Vocabulary Station, and Column 3 (`lg:col-span-3`) stacks the 19-Topic Constellation canvas over the VIP Leaderboard.

Below the first viewport, full-width 12-column concourse modules house the 7,298-word Topic Explorer (4-column flush grid), the 4-tab My-IELTS Big Data Hub (4-column chapter rail + 8-column dictation/table view), and the 6/6 Split-Screen Computer-Delivered Exam Room.

## Elevation & Depth

Depth is achieved through high-contrast tonal layering between the `#F4F1EA` Birch Alabaster canvas and `#16181D` Concourse Charcoal modules, reinforced by a single soft architectural elevation shadow. Inside dark modules, regions are separated by 1px `#2E3340` structural hairlines rather than nested drop-shadow cards.

### Shadow Vocabulary
- **Concourse Module Shadow** (`box-shadow: 0 16px 36px -12px rgba(22, 24, 29, 0.16)`): Applied to top-level Bento modules and full-width concourse sections.

### Named Rules
**The No-Nested-Card Rule.** A Bento module is a single architectural container; sub-sections inside it divide via `1px solid #2E3340` hairlines and flush table rows, never boxed cards inside boxed cards.

## Shapes

Top-level Bento modules use `16px` (`rounded-2xl`) outer corners with a `1px solid #2E3340` structural border. Inner lexical stages and media frames use `12px` (`rounded-xl`), interactive buttons and inputs use `8px` (`rounded-lg`), and compact CEFR/collocation tags use `6px` (`rounded`). Thick side-border stripes (`border-left` > 1px) and hard neobrutalist offset shadows are strictly excluded.

## Components

### Buttons
- **Shape:** Gently rounded architectural corners (`8px` to `12px` radius).
- **Primary:** British Passport Emerald (`#065F46`) background with Birch Alabaster (`#F4F1EA`) text, `14px 20px` padding, shifting to `#047857` or `#10B981` on hover.
- **Wayfinding Action:** International Wayfinding Yellow (`#FACC15`) background with Concourse Charcoal (`#16181D`) bold text, shifting to `#EAB308` on hover.
- **FSRS Rating Bar:** 4-column grid of monospace-labeled buttons (`[Again]`, `[Hard]`, `[Good]`, `[Easy]`) color-coded to memory outcome (`#EA580C`, `#16181D`, `#15803D`, `#065F46`).

### Chips
- **Style:** Compact `6px` radius badges in `JetBrains Mono` (`12px`, bold) encoding CEFR levels (`A1` Sky `#38BDF8` through `C2` Vermilion `#EA580C`) and collocation phrases (`#222630` background with `#B8B2A6` text).
- **State:** Interactive filter pills switch to `#FACC15` background with `#16181D` text when active.

### Cards / Containers
- **Corner Style:** `16px` outer radius on primary Bento cells.
- **Background:** `#16181D` Concourse Charcoal (standard modules) or `#FACC15` Wayfinding Yellow (Hero Station 02).
- **Shadow Strategy:** `0 16px 36px -12px rgba(22, 24, 29, 0.16)`.
- **Border:** `1px solid #2E3340`.
- **Internal Padding:** `20px` to `24px`.

### Inputs / Fields
- **Style:** `1px solid #363B47` stroke on `#1F2229` Dark Slate background with `8px` radius and `#F4F1EA` text.
- **Focus:** `2px solid #FACC15` focus-visible outline and `#FACC15` border transition.
- **Verified State:** Shifts border and text to Bright Emerald (`#10B981`) with a stroke checkmark icon when a Cloze or Dictation word matches.

### Navigation
- **Style:** Integrated top concourse bar with numbered anchor links (`01 Lộ Trình` through `06 Phòng Thi`), paired with the Split-Flap Streak module and primary CTA. Active link carries a `2px solid #16181D` bottom bar.

### Split-Flap Streak Counter
- **Description:** Mechanical digit tiles (`28px × 36px`) rendered in `JetBrains Mono` 800 weight on `#FACC15` plates with a 1px horizontal center hinge line (`rgba(15, 17, 21, 0.75)`), housed in a `#16181D` bezel.

## Do's and Don'ts

### Do:
- **Do** integrate section numbers (`01 /`, `02 /`, `03 /`) directly into the heading text on a single line.
- **Do** use custom SVG flags and consistent stroke icons (`lucide-react`) for audio, streak, and navigation controls.
- **Do** keep dark-surface secondary text warm (`#B8B2A6`) and format all numeric telemetry with `tabular-nums`.
- **Do** separate sub-regions inside Bento panels using `1px solid #2E3340` hairlines and flush grid cells.

### Don't:
- **Don't** place small uppercase kicker or eyebrow labels above headings.
- **Don't** use Unicode emojis (`🔥`, `🇬🇧`, `🇺🇸`, `🏆`) anywhere in the interface.
- **Don't** nest boxed cards inside boxed cards or add decorative `linear-gradient` grid backgrounds to the page body.
- **Don't** use gradient text, hard offset neobrutalist shadows, or thick colored `border-left` / `border-bottom` stripes on rounded elements.
