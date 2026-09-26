# i-ESG Advisory — Static Client Preview

This folder is a pure **HTML / CSS / JavaScript** version of the WordPress concept. It is intended for local review and GitHub Pages so the client can give design/content feedback before the final WordPress implementation.

## Run locally

### Fastest
Open `index.html` directly in a browser. The pages work with `file://` links.

### Recommended
Run a tiny local server from this folder:

```bash
python -m http.server 8080
```

Then open `http://localhost:8080`.

## GitHub Pages

1. Create a new GitHub repository.
2. Upload everything in this folder to the repository root.
3. Go to **Settings → Pages**.
4. Under **Build and deployment**, choose **Deploy from a branch**.
5. Choose `main` and `/ (root)`.
6. Save. GitHub will publish the preview URL.

## Animation stack

- GSAP 3.13
- ScrollTrigger
- Smooth Scrollbar
- smoothscroll polyfill
- Cinematic page wipe, word reveals, card tilt, magnetic buttons, parallax and smooth scrolling

The animation libraries and Google Fonts are loaded from CDNs, so an internet connection is required for the full animation/font experience. The content and layout still render if those CDN scripts are unavailable.

## Important preview notes

- This build deliberately uses `noindex,nofollow` so the GitHub preview does not compete with the live site in search results.
- The contact form is visual only and does not send data.
- CBAM calculator/readiness logic is not simulated in the static preview; it remains a separate app/plugin in production.
- Historic news content was not fully available in the migration review, so the Insights cards are presentation placeholders.
- The RJC service body copy is incomplete in the source material and is clearly marked.

## Production handoff

Once the client approves the static preview, the same structure/animations can be mapped back into the bilingual WordPress theme with editable EN/AR content and media.
