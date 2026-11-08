# Diego Gomez — Test Portfolio

[View the website](https://rockythedawg.github.io/Test/)

A white portfolio using the layout and typography of diegogomez.dev, with content and media transferred from Diego's personalsite. The source repository is unchanged.

## Content

- Original biography, five experience entries, two education entries, and six skills/achievements categories.
- Hallway U and Cap'n Blox's Ottoman Empire, with the full original project descriptions in accessible dialogs.
- The original 53-photo gallery with keyboard, touch, and previous/next controls.
- All 107 source assets, including the resume PDF, project artwork, favicon, and additional archived photographs.
- The original 200-track music library, alternating between country and modern collections every minute. Playback is user-controlled; unavailable artwork has a local visual fallback.
- The original portfolio-data.json retained unchanged for reference; the current visible portfolio content lives in index.html.

## Local preview

No build step or package installation is required. Run from this directory:

```sh
python3 -m http.server 8000
```

Open http://localhost:8000. Keep all asset URLs relative so the same files work under GitHub Pages' /Test/ path. GitHub Pages publishes the root of main.

Fonts load from Google Fonts. Music artwork and previews depend on the original external providers; track names and destination links remain available if artwork fails.
