# Typography Tool

## Purpose
Interactive browser tool for testing editorial type hierarchies.
Target users: designers at a publishing house.

## Stack
- p5.js bundled locally (`libraries/p5.js`, no build tools)
- Vanilla JS, no frameworks
- Fonts via Google Fonts API (not yet integrated)

## Design System
- Palette: #1A1A2E (bg), #E94560 (accent), #F4F4F8 (light)
- Type scale: 12, 16, 21, 28, 37, 49, 65px (ratio 1.333)
- Grid: 8pt baseline, 12-column, 24px gutters

## Conventions
- camelCase variables, PascalCase classes
- English comments, concise

## Do NOT
- Use DOM manipulation for anything canvas-rendered
- Add dependencies without asking
- Remove the windowResized() handler

## Status
- [x] Starter template (full-window canvas, windowResized wired up)
- [ ] Typography hierarchy rendering
- [ ] Font weight slider
- [ ] Export to PNG