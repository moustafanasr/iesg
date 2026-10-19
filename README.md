# iESG Advisory — Static Client Preview v3.3 Refined

HTML / CSS / JavaScript client-preview build.

## v3.3 changes
- Reworked eye-catching dark hero with proof points and layered imagery.
- Rebuilt the homepage/Knowledge Hub SDG section to match the supplied SDG Explorer prototype: left goal rail, dark evidence panel, Egypt position, regional position, key figures and observation.
- Full SDG Explorer page now uses the supplied prototype layout and data directly.
- Rebuilt iESG Way + Platform cards with real visual content instead of empty skeleton blocks.
- Rebuilt Knowledge Hub + Carbon Footprint feature cards with imagery.
- Fixed Partners page sector cards so headings/content remain legible on dark backgrounds.
- Refined responsive layouts and GSAP transitions.

## Run locally
```bash
python -m http.server 8080
```
Open http://localhost:8080

## Preview status
`noindex,nofollow` remains enabled because this is a client-preview build.


## v3.3 SDG update
The full content and interaction from the supplied `sdg-explorer-prototype(1).html` is now embedded directly inside the “Explore the 17 Sustainable Development Goals” section on Home and Knowledge Hub (EN/AR). The section contains the complete 17-goal dataset, position cards, KPIs, regional peer chart, observations, targets, Egypt performance, MENA comparison, statistics and technical sources.
