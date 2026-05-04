# Neofilisoft Dice Roller

A 3D dice roller for Tabletop RPGs (D&D, Pathfinder) — runs entirely in the browser.

## Features

- **Three dice types**: D8, D12, D20
- **Multi-dice rolls**: 1, 2, or 3 dice at once
- **Staggered SFX**: each die plays its own roll sound offset in time
- **Improved rolling animation**: velocity-based tumble with natural deceleration
- **Bilingual UI**: Thai / English toggle
- **PWA-ready**: installable via `manifest.json`

## Usage

Open `index.html` in a browser. Click the **☰ hamburger menu** (top-left) to select dice type and count, then press **Roll Dice**.

## File Structure

```
index.html        — Main app
style.css         — Styles
script.js         — Three.js dice logic + UI
manifest.json     — PWA manifest
sitemap.xml       — SEO sitemap
sfx/
  d20roll.mp3     — Roll sound effect
icon.png          — App icon (192×192)
icon.ico          — App icon (512×512)
```

## Libraries & Licenses

### Three.js r128
- **Purpose**: 3D rendering — geometries (Icosahedron/Octahedron/Dodecahedron), WebGLRenderer, camera, lighting, CanvasTexture
- **License**: MIT License
- **Copyright**: © 2010–2024 three.js authors
- **Source**: https://threejs.org / https://github.com/mrdoob/three.js
- CDN: `https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js`

### Web Audio API
- **Purpose**: Playing `.mp3` roll sound effects
- **License**: Built-in browser API (W3C spec) — no license required
- **Note**: No external library; uses native `new Audio()` constructor

---

## Third-Party Notice

```
Three.js — MIT License
Copyright (c) 2010-2024 three.js authors

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.
```

Full license: https://github.com/mrdoob/three.js/blob/dev/LICENSE

---

Copyright © 2026 Neofilisoft.
