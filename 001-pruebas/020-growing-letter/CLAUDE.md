# GROWING LETTER - Project Context & Specification

**Status**: Planning → Ready for Implementation  
**Version**: v1.0  
**Author**: eloy segura @ altura x  

---

## 01. Concept
An interactive web tool where a single letter evolves and grows organically based on user input (sound or mouse movement). The letter's contours sprout small hair-like branches that grow and ramify across the entire screen, simulating biological growth patterns (inspired by mycelium, physarum slime mold, fungal networks).

---

## 02. Output
- **Visual**: A growing, branching network of lines sprouting from a letter's contours, filling the screen
- **Exportable**: 
  - Primary: High-resolution bitmap image (PNG with transparency)
  - Secondary: SVG vector file (if feasible)
- **Stoppable**: User can freeze the growth at any moment and save the current state

---

## 03. Input Requirements
1. **Letter selection**: User chooses/types a single letter to be the growth origin
2. **Audio input**: Microphone access (p5.AudioIn) to capture sound
3. **Mouse input**: Mouse position tracked in real-time
4. **Control buttons**: Start, Stop, Clear, Export
5. **Mode selection**: Toggle between Sound mode or Mouse mode (not both simultaneously)
6. **Speed control**: Slider to adjust growth speed/rate
7. **iPad/Phone/Computer**: Touch-friendly interface (buttons large enough for touch)

---

## 04. Interface Style
- **Aesthetic**: Minimalist, techno-minimalistic (like www.analog-algorithm.com)
- **Theme**: Dark background (black/dark gray) with bright text/UI elements
- **Typography**: Monospace font (Courier, Monaco, Courier New)
- **Layout**: 
  - Left sidebar: Control panel with buttons, inputs, sliders
  - Main area: Canvas showing growing letter
  - Footer: Version info + timestamp
- **Controls visible on screen**: No hidden menus, all controls accessible on one view

---

## 05. Similar Existing Tools (References & Inspiration)
- **HYPHA** (Pentagram/Counterpoint) — Fungal mycelium growth simulation
- **Physarium Type** (Maxence Duterne) — Slime mold-based letter growth
- **Life of Font** (Mankun Guo) — Biological organism growth patterns
- **Type Reactor** (typereactor.xyz) — Interactive typography evolution
- **LivingPath** (Ivan Murit) — Growing path animations

---

## Technical Specification

### Growth Algorithm
**Starting point**: Letter's contour  
**Initial growth**: Small "hairs" (thin lines, ~1-2px) sprouting from letter edges  
**Growth pattern**: Tree-like branching (similar to roots or mycelium threads)  
**Direction influences**:
- **Sound mode**: Audio amplitude/frequency controls growth rate and intensity
- **Mouse mode**: Letter's growth attracted toward mouse position (follows cursor)
- **Both modes** are mutually exclusive (user selects one mode at a time)

**Visual properties**:
- Line width: Very thin (~1-2px), consistent throughout
- Color: White lines on black background (minimalist)
- Rendering: Canvas 2D (p5.js)
- Animation: Smooth, continuous growth

### Input Behavior

#### Mode: Sound
- Microphone activates growth
- **Control**: Audio amplitude/intensity → growth rate (louder = faster)
- User can talk, sing, or play music to drive growth
- Growth spreads in semi-random directions (organic feel)

#### Mode: Mouse
- Mouse position actively controls growth
- **Control**: Growth attracted toward mouse cursor (branches grow toward mouse)
- Moving mouse around "pulls" the growth in that direction
- Stationary mouse = slower/halted growth

### Lifecycle & Controls

1. **START**: User clicks START button → growth begins from letter contours
2. **RUNNING**: 
   - Growth spreads according to input (sound or mouse)
   - Speed adjustable via slider (real-time)
   - User can switch input mode if desired (pause and toggle)
3. **STOP**: 
   - User clicks STOP button
   - **Action**: Freezes current growth pattern on screen (does NOT clear)
   - Pattern remains visible for viewing and export
4. **CLEAR**: 
   - User clicks CLEAR button
   - **Action**: Removes all growth, resets to letter only
   - Ready for new growth session
5. **EXPORT**: 
   - User clicks EXPORT/SAVE button
   - **Action**: Downloads image (PNG bitmap or SVG vector)
   - Primary format: PNG (high resolution, ~2000×2000px or screen size)
   - Alternative: SVG if vector export is feasible

### Parameters & Controls

**Letter Input**
- Type: Text input field (single character)
- Default: "A"
- Updates: Growth resets when letter changes

**Growth Speed Slider**
- Range: Slow → Fast (0.1x → 5x or similar scale)
- Real-time adjustment (affects active growth)
- Adjustable while growing

**Mode Selection**
- Button toggle: Sound mode ↔ Mouse mode
- Visual indicator: Show which mode is active
- Switching pauses growth, requires restart

**Audio Controls** (Sound mode only)
- Microphone ON/OFF button
- Visual indicator: Show when mic is listening
- Fallback: Allow audio file upload

**Speed indicator**
- Display current growth rate (visual feedback)
- Optional: Show current audio level (if Sound mode)

### Export Functionality

**Primary**: High-resolution bitmap (PNG)
- Resolution: At least 2000×2000px or 4× screen resolution (whichever is larger)
- Format: PNG with transparency (transparent background)
- Trigger: Export button downloads file with timestamp (e.g., `growing-letter_2026-08-20_14-30.png`)

**Secondary**: Vector export (SVG)
- If feasible during development
- Store path data as the growth happens
- Format: SVG polylines or paths
- Optional: Include color/stroke styling

---

## Visual Reference

```
┌─────────────────────────────────────────────────────┐
│  GROWING LETTER                    [← Back]         │
│                                                     │
│  ┌─────────────────────┐                           │
│  │ Letter: [A      ]   │                           │
│  ├─────────────────────┤                           │
│  │ Mode:               │                           │
│  │ ◉ Sound  ○ Mouse    │                           │
│  │                     │                           │
│  │ Speed:              │                           │
│  │ ●─────────────      │                           │
│  │                     │                           │
│  │ [Start] [Stop]      │                           │
│  │ [Clear] [Export]    │                           │
│  │                     │                           │
│  │ v1.0 eloy segura... │
│  └─────────────────────┘       [Canvas: Growing    ]
│                                  letter with thin  │
│                                  branching growth] │
└─────────────────────────────────────────────────────┘
```

---

## Technical Stack
- **Framework**: p5.js (canvas rendering)
- **Audio**: p5.sound.js (microphone input)
- **Export**: Canvas API (for PNG export), SVG.js or manual SVG creation (optional)
- **Storage**: localStorage (optional, for saving recent settings)
- **Styling**: CSS (minimalist dark theme)

---

## Browser Requirements
- Modern browser with Web Audio API support
- p5.js compatibility (Chrome, Firefox, Safari, Edge)
- Canvas 2D context support
- File download capability

---

## Performance Considerations
- Limit maximum nodes/branches (~10,000) to maintain 60fps
- Use frame-skipping if audio processing causes lag
- Optimize canvas rendering (batch draws if possible)
- Test on mobile devices (iPad, phones) for touch responsiveness

---

## Aesthetic Goals
- **Dark, minimal aesthetic**: Black background, white/bright lines
- **Technical feel**: Monospace typography, grid-based UI
- **Organic growth**: Non-linear, branching patterns that look alive
- **High contrast**: Easy to read controls on dark background
- **Fast feedback**: Real-time visual response to input

---

## Next Steps
1. ✓ Define project context (this file)
2. → Create HTML structure with p5.js setup
3. → Implement letter rendering and contour detection
4. → Build basic branching algorithm
5. → Integrate audio input (microphone)
6. → Integrate mouse input and attraction
7. → Add UI controls (Start/Stop/Clear/Export)
8. → Implement PNG export functionality
9. → Polish and optimize performance
10. → Test across browsers/devices

---

## Notes
- Inspired by generative art and biological simulation (mycelium, physarum)
- Techno-minimalistic aesthetic matches thesis-lab project style
- Interactive control allows users to create unique, organic designs
- Freezing mechanism enables experimentation and iteration
- Export feature allows for high-quality prints or further manipulation in design tools

