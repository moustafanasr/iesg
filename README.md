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


## v3.4 changes
- Header hierarchy now follows the requested Home / Services / CBAM Toolkit / iESG Nexus dropdown / Platform / About Us dropdown / Contact structure, with a separate mobile navigation.
- The full 17-SDG explorer is removed from Home and remains in Knowledge Hub only.
- Home now uses the 10 supplied goal images from goals.rar as a continuously moving slider.
- Selecting a goal image deep-links to the matching goal inside the Knowledge Hub explorer.


## v3.6 LinkedIn content
- Added the supplied full copy for the World Accreditation Day and WEICAN posts.
- Added all seven captions and dates from `iESG Linkidin posts.xlsx`.
- Added expandable post copy in EN/AR so the page remains useful even when LinkedIn embeds are blocked.


## v3.7 LinkedIn media
- Added verified original LinkedIn media to posts where public media URLs could be confirmed.
- WEICAN post includes a 4-image gallery.
- UNGC–Accenture and COP30 × 3 × 7 include their confirmed original visuals.
- Other posts retain the live LinkedIn embed because LinkedIn does not expose a reliable downloadable media URL for those posts in public access.
- The embed remains a fallback if LinkedIn rotates or blocks a media CDN URL.


## v3.8 changes
- Removed numeric indexes from service cards.
- Rebuilt the Home SDG carousel to include all 17 goals and start at Goal 1 only when the section enters view.
- Goals 1–10 use supplied goal artwork; goals 11–17 use matching branded color cards driven by the supplied SDG dataset.
- Rebuilt the site footer with improved navigation, Nexus links, contact CTA and responsive layout.


## v3.9 changes
- Added the supplied iESG homepage visual library.
- Replaced all nine Home service-card images with their matching supplied service visuals.
- Updated Hero main/secondary imagery.
- Updated Collaborations, Platform, Knowledge Hub and Carbon Reports homepage imagery.
- Converted supplied PNG assets to optimized WebP and added responsive 16:9 image handling.
- Updated both English and Arabic home pages.


## v4.0 changes
- Redesigned Home Knowledge Hub and Carbon Footprint Reports cards so imagery and copy never overlap.
- Converted the Home Partners section into a seamless autoplay marquee using all 15 partner logos; pauses on hover/focus and starts on viewport entry.
- Rebuilt the footer with all nine service links, Nexus links, CBAM Toolkit, company navigation, full contact details, LinkedIn and stronger CTA.
- Applied footer and responsive updates to English and Arabic pages.


## v4.1 changes
- Added final custom image assets for SDG Goals 11–17 to `assets/images/goals/`.
- Replaced the old CSS marquee with a real 17-goal carousel on the Home page.
- Carousel always starts on Goal 01 when first rendered.
- Added 01–17 timeline navigation, Previous/Next, pause/play, counter, progress bar, hover/focus pause and mobile swipe.
- Every goal links directly to its full entry in Knowledge Hub.
- Updated English and Arabic home pages.
