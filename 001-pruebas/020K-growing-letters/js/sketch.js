// Growing Letter - Interactive Sound/Mouse-Driven Organic Typography Growth
// eloy segura @ altura x
// Last updated: 2026-08-20 18:57:23

// ===== Global state =====
let canvas;
// Core interaction state.
let letters = "A";
let mode = "sound";
let isGrowing = false;
let growthSpeed = 0.25;
let invertColors = false;
let textColor = '#ffffff';
let textColorAuto = true;
let textAlignMode = 'center';
let fontFamilyMode = 'Helvetica Bold';
let audioInput;
let soundFile;
let audioFileInput;

// Growth simulation data.
let branches = [];
let letterBoundaryPoints = [];
let letterCenters = [];
let letterCenter = { x: 0, y: 0 };
let fontSize = 160;
let tracking = 10;
let lineHeightMultiplier = 0.9;
// Persistent raster buffer holding every growth stroke ever drawn this session, at TRAIL_SCALE
// resolution (see createTrailBuffer()/BranchNote in Branch.update()). Replaces the old approach of
// keeping every segment's coordinates in a JS array and redrawing the entire array every frame —
// that array grew without bound over a long session (millions of entries), and redrawing all of it
// 30-60 times/sec eventually exhausted memory/CPU and crashed the tab. Baking each stroke into pixels
// exactly once keeps per-frame cost bounded by how many NEW strokes this frame adds, regardless of
// how long the session has been running, while producing the exact same accumulated visual result.
let trailBuffer;
const TRAIL_SCALE = 2;
let currentAudioLevel = 0;

// Split-band audio reactivity: instead of driving every visual parameter off a single loudness
// scalar (which made any sound — voice, music, claps — produce the same growth pattern), the
// spectrum is read as three bands plus a transient (sudden peak) detector. Each one is wired to a
// different visual effect in Branch (see update()/constructor): bassLevel -> growth speed,
// midLevel -> how often branches split, trebleLevel -> wobble/curl tightness, transientLevel ->
// short bursts of extra branching on sudden hits (claps, drum beats, hard consonants).
let bassLevel = 0;
let midLevel = 0;
let trebleLevel = 0;
let transientLevel = 0;
// Slow-moving average of the overall level, used as the transient detector's baseline: a reading
// that jumps well above its own recent average reads as a "hit" rather than sustained loudness.
let smoothedLevel = 0;
// Minimum combined mid+transient reading needed before any branch is allowed to split at all (see
// hasSoundPresence in Branch.update()). Below this, ambient mic noise / near-silence / a stationary
// mouse produces pure, unbranched growth — just a slow line, no forks — regardless of how long a
// branch has been traveling. Only real sound (or real mouse movement) unlocks branching.
const SOUND_PRESENCE_THRESHOLD = 0.02;

// On-canvas session timers: playElapsedStart is set the moment Play is pressed and ticks live (real
// time, via millis()) while growing. The moment Pause is pressed, playFrozenMs captures the elapsed
// time at that instant so the PLAY readout stops advancing and holds that value — pauseElapsedStart
// starts a second, separate live counter for how long it's been paused. The next Play clears both
// playFrozenMs and pauseElapsedStart and restarts playElapsedStart from zero. Drawn every frame in
// draw() — see drawSessionTimers().
let playElapsedStart = null;
let playFrozenMs = null;
let pauseElapsedStart = null;

// UI element references.
let letterInput, startBtn, stopBtn, clearBtn, exportBtn, invertBtn;
let textAlignSelect, fontFamilySelect;
let textColorPicker, textColorValue, textColorSwatch;
let fontSizeSlider, fontSizeValue;
let trackingSlider, trackingValue;
let lineHeightSlider, lineHeightValue;
let modeButtons = {};
let speedSlider, speedValue;
let micIndicator, micStatusText;
let timestamp;

// Audio and interaction helpers.
let audioLevel = 0;
let audioContext;
let fft;
let micActive = false;
let fontSizeTimeout;
let lastMouseX = null;
let lastMouseY = null;
let micReadErrorLogged = false;

const BUILD_TIME = "2026-11-17 16:30:00";
const APP_VERSION = "v4.0";

// ===== Branch simulation =====
// Branch models one growing filament and optionally generates child branches.
// ===== v4.0 — organic growth (020K) =====
// Five changes against v3.0 (020J), all inside Branch and the occupancy grid below:
//   1. Steering by a Perlin noise field instead of a sine wobble + constant curl: every tendril
//      wanders smoothly and never repeats the same spiral.
//   2. Variable branching angle (20°–55°, was a fixed 60°) and the parent bends slightly away from
//      its child, so forks read as growth rather than geometry.
//   3. Tapering: each branch starts thick and thins toward its tip; a child starts at the width its
//      parent has at the fork point.
//   4. Self-avoidance and fusion: tips sense the trail already laid down by OTHER branches, turn
//      toward free space, and when boxed in they fuse into the existing network and stop — the way
//      mycelium and Physarum networks behave.
//   5. Finite tip life: a tip rests once it reaches its length budget; sound extends that budget, so
//      silence lets the network settle and sound keeps it growing.

// Occupancy grid: one Int32 per OCC_CELL × OCC_CELL pixel cell, storing the id of the branch whose
// trail passes through it (0 = empty). Rebuilt in resetOccupancy() on Start, Clear and resize.
const OCC_CELL = 5;
let occGrid = null;
let occCols = 0;
let occRows = 0;
let nextBranchId = 1;

function resetOccupancy() {
  occCols = max(1, ceil(width / OCC_CELL));
  occRows = max(1, ceil(height / OCC_CELL));
  occGrid = new Int32Array(occCols * occRows);
  nextBranchId = 1;
}

// Returns the owner id stored at canvas position (x, y), 0 if empty, -1 if outside the canvas.
function occupancyAt(x, y) {
  if (!occGrid) return 0;
  let cx = floor(x / OCC_CELL);
  let cy = floor(y / OCC_CELL);
  if (cx < 0 || cy < 0 || cx >= occCols || cy >= occRows) return -1;
  return occGrid[cy * occCols + cx];
}

function markOccupancy(x, y, ownerId) {
  if (!occGrid) return;
  let cx = floor(x / OCC_CELL);
  let cy = floor(y / OCC_CELL);
  if (cx < 0 || cy < 0 || cx >= occCols || cy >= occRows) return;
  occGrid[cy * occCols + cx] = ownerId;
}

// Noise field scale (smaller = broader, calmer meanders) and how fast the field drifts over time.
const NOISE_SCALE = 0.006;
const NOISE_DRIFT = 0.004;
// Distance (px) a new branch travels before it starts reacting to other trails, so seeds that start
// close together on the letter contour, and children leaving their parent, don't stop at once.
const AVOID_GRACE = 18;

class Branch {
  constructor(x, y, angle, parentAngle = null, generation = 0, midAtBirth = 0, centerX = letterCenter.x, centerY = letterCenter.y, trebleAtBirth = 0, startWidth = null, parentId = 0) {
    this.id = nextBranchId++;
    this.parentId = parentId;
    this.x = x;
    this.y = y;
    this.prevX = x;
    this.prevY = y;
    this.centerX = centerX;
    this.centerY = centerY;

    if (parentAngle !== null) {
      this.angle = parentAngle + random(-0.12, 0.12);
    } else {
      this.angle = angle;
    }
    this.baseAngle = this.angle;
    this.distanceTraveled = 0;
    this.lastBranchDistance = 0;

    // Branching thresholds kept from v3.0 (sound-gated: silence = no forks).
    let baseInterval = random(700, 1000);
    this.branchInterval = baseInterval / (1 + midAtBirth * 25);
    this.speed = 0.9 + random(0.15, 0.5);

    // Each branch reads the noise field at its own offset, so neighbours don't steer in lockstep.
    this.noiseOffset = random(1000);
    // How strongly the noise field turns this tendril per frame. Treble at birth makes it twitchier.
    this.steer = random(0.035, 0.06) * (1 + trebleAtBirth * 1.5);
    this.generation = generation;
    this.isActive = true;
    this.children = [];

    // 3. Tapering: start width and the width the tip ends with (as a fraction of the start).
    this.startWidth = startWidth !== null ? startWidth : 6 + random(-1.5, 1.5);
    this.endRatio = random(0.15, 0.3);
    this.strokeWeight = this.startWidth;

    // 5. Length budget in px. Later generations are shorter. Sound extends it in update().
    this.lifeLength = (generation === 0 ? random(450, 850) : random(220, 520)) * pow(0.85, generation);
  }

  currentWidth() {
    let t = constrain(this.distanceTraveled / this.lifeLength, 0, 1);
    return max(0.8, this.startWidth * lerp(1, this.endRatio, t));
  }

  // True when (x, y) holds a trail laid by a branch other than this one (or its parent near the fork).
  isForeign(x, y) {
    let owner = occupancyAt(x, y);
    if (owner <= 0) return false;
    if (owner === this.id) return false;
    if (owner === this.parentId && this.distanceTraveled < AVOID_GRACE * 2) return false;
    return true;
  }

  update(attractX = null, attractY = null, bass = 0, mid = 0, treble = 0, transient = 0) {
    if (!this.isActive) return;

    this.prevX = this.x;
    this.prevY = this.y;

    // 1. Noise-field steering: noise() returns 0..1, centred to -1..1. Treble widens the turn.
    let n = noise(this.x * NOISE_SCALE + this.noiseOffset, this.y * NOISE_SCALE, frameCount * NOISE_DRIFT);
    this.baseAngle += (n - 0.5) * 2 * this.steer * (1 + treble * 2);
    let currentAngle = this.baseAngle;

    // Mouse mode keeps the v3.0 attraction, now on top of the noise drift.
    if (attractX !== null && attractY !== null) {
      let dx = attractX - this.x;
      let dy = attractY - this.y;
      let distance = sqrt(dx * dx + dy * dy);
      if (distance > 10) {
        let targetAngle = atan2(dy, dx);
        let mousePull = 0.08 + this.generation * 0.015;
        currentAngle = lerp(currentAngle, targetAngle, mousePull);
        this.baseAngle = lerp(this.baseAngle, targetAngle, mousePull * 0.6);
      }
    }

    // 4. Self-avoidance: probe ahead, and to both sides, for trails of other branches.
    if (this.distanceTraveled > AVOID_GRACE) {
      let probe = 8 + this.currentWidth();
      let aheadBlocked = this.isForeign(this.x + cos(currentAngle) * probe, this.y + sin(currentAngle) * probe);
      if (aheadBlocked) {
        let leftBlocked = this.isForeign(this.x + cos(currentAngle - 0.6) * probe, this.y + sin(currentAngle - 0.6) * probe);
        let rightBlocked = this.isForeign(this.x + cos(currentAngle + 0.6) * probe, this.y + sin(currentAngle + 0.6) * probe);
        if (leftBlocked && rightBlocked) {
          // Boxed in: fuse into the network. Draw the last short segment into the neighbour and stop.
          this.x += cos(currentAngle) * probe * 0.7;
          this.y += sin(currentAngle) * probe * 0.7;
          this.drawSegment();
          this.isActive = false;
          return;
        }
        let turn = leftBlocked ? 0.3 : (rightBlocked ? -0.3 : random([-0.3, 0.3]));
        this.baseAngle += turn;
        currentAngle += turn;
      }
    }

    let maxSpeed = this.speed * growthSpeed * (1 + bass * 0.9 + transient * 0.6);
    this.x += cos(currentAngle) * maxSpeed;
    this.y += sin(currentAngle) * maxSpeed;
    this.distanceTraveled += maxSpeed;

    // 5. Sound feeds the tip: while there is sound, the length budget grows with it.
    this.lifeLength += maxSpeed * (bass + mid) * 0.6;

    this.drawSegment();
    markOccupancy(this.x, this.y, this.id);

    // Branching: same sound-gated rules as v3.0.
    let effectiveInterval = this.branchInterval / (1 + mid * 6 + transient * 3);
    let branchProgress = this.distanceTraveled - this.lastBranchDistance;
    let canBranchByDistance = branchProgress > effectiveInterval;
    let canBranchByImpulse = random() < (mid * 0.003 + transient * 0.05);
    let hasSoundPresence = (mid + transient) > SOUND_PRESENCE_THRESHOLD;
    let shouldBranch = hasSoundPresence && (canBranchByDistance || canBranchByImpulse);

    if (shouldBranch && this.children.length < 3 && this.generation < 4) {
      // 2. Variable fork angle; the parent bends a little the other way.
      let side = random() < 0.5 ? 1 : -1;
      let childAngle = currentAngle + side * random(radians(20), radians(55));
      this.baseAngle -= side * random(0.05, 0.15);
      let childWidth = max(1.2, this.currentWidth() * random(0.65, 0.85));
      let newBranch = new Branch(this.x, this.y, childAngle, null, this.generation + 1, mid, this.centerX, this.centerY, treble, childWidth, this.id);
      this.children.push(newBranch);
      branches.push(newBranch);
      this.lastBranchDistance = this.distanceTraveled;
    }

    // Tip rests when its length budget is spent, or when it leaves the canvas.
    if (this.distanceTraveled > this.lifeLength) {
      this.isActive = false;
    }
    if (this.x < -80 || this.x > width + 80 || this.y < -80 || this.y > height + 80) {
      this.isActive = false;
    }
  }

  // Bakes the latest segment into the persistent trail buffer (white; tinted at draw time, as in v3.0).
  drawSegment() {
    this.strokeWeight = this.currentWidth();
    const tctx = trailBuffer.drawingContext;
    tctx.strokeStyle = '#ffffff';
    tctx.lineCap = 'round';
    tctx.lineWidth = this.strokeWeight * TRAIL_SCALE;
    tctx.beginPath();
    tctx.moveTo(this.prevX * TRAIL_SCALE, this.prevY * TRAIL_SCALE);
    tctx.lineTo(this.x * TRAIL_SCALE, this.y * TRAIL_SCALE);
    tctx.stroke();
  }
}

// (Re)creates the persistent trail buffer at TRAIL_SCALE × the current canvas size, discarding
// whatever was previously baked into it. Called once in setup() and again on window resize (the old
// buffer's pixels wouldn't line up with a differently-sized canvas anyway).
function createTrailBuffer() {
  if (trailBuffer) trailBuffer.remove();
  trailBuffer = createGraphics(width * TRAIL_SCALE, height * TRAIL_SCALE);
  trailBuffer.pixelDensity(1);
  trailBuffer.clear();
  resetOccupancy(); // v4.0: occupancy grid must match the new canvas size
}

// ===== Setup and UI wiring =====
// Initializes canvas, captures DOM controls, and wires event handlers.
function setup() {
  const holder = document.getElementById('sketch-holder');
  const rect = holder.getBoundingClientRect();
  
  canvas = createCanvas(rect.width, rect.height);
  canvas.parent('sketch-holder');

  // Cap the canvas at 1 physical pixel per CSS pixel. On retina/HiDPI screens p5 otherwise renders
  // at 2x-3x the pixel count by default, which is wasted cost for this kind of thin organic line art —
  // the softness difference is essentially invisible, but it meaningfully cuts per-frame draw cost.
  pixelDensity(1);

  // Cap the simulation/redraw rate below the 60fps p5 default. Every branch's movement-per-frame is a
  // fixed step (see Branch.update()), not scaled by elapsed time, so a lower frame rate simply paces the
  // same growth pattern out over more real time rather than changing its shape — while directly cutting
  // how many new strokes get baked into the trail buffer per second.
  frameRate(30);

  // Vertical-center every glyph on its baseY (matches the offscreen contour buffer's
  // pg.textAlign(LEFT, CENTER) in updateLetterBoundary — see note there). Without this the main
  // canvas defaults to (LEFT, BASELINE), so the visible letters and the invisible contour used to
  // seed growth would sit at different vertical positions, making branches appear to sprout from a
  // point offset from the letters instead of hugging their actual edges.
  textAlign(LEFT, CENTER);

  createTrailBuffer();

  letterInput = document.getElementById('letterInput');
  textAlignSelect = document.getElementById('textAlignSelect');
  fontFamilySelect = document.getElementById('fontFamilySelect');
  textColorPicker = document.getElementById('textColorPicker');
  textColorValue = document.getElementById('textColorValue');
  textColorSwatch = document.getElementById('textColorSwatch');
  startBtn = document.getElementById('startBtn');
  stopBtn = document.getElementById('stopBtn');
  clearBtn = document.getElementById('clearBtn');
  exportBtn = document.getElementById('exportBtn');
  invertBtn = document.getElementById('invertBtn');
  fontSizeSlider = document.getElementById('fontSizeSlider');
  fontSizeValue = document.getElementById('fontSizeValue');
  trackingSlider = document.getElementById('trackingSlider');
  trackingValue = document.getElementById('trackingValue');
  lineHeightSlider = document.getElementById('lineHeightSlider');
  lineHeightValue = document.getElementById('lineHeightValue');
  speedSlider = document.getElementById('speedSlider');
  speedValue = document.getElementById('speedValue');
  modeButtons.sound = document.getElementById('modeSound');
  modeButtons.mouse = document.getElementById('modeMouse');
  audioFileInput = document.getElementById('audioFile');
  micIndicator = document.getElementById('micIndicator');
  micStatusText = document.getElementById('micStatusText');
  timestamp = document.getElementById('timestamp');
  exportBtn.disabled = false;

  if (audioFileInput) {
    audioFileInput.addEventListener('change', (event) => {
      const file = event.target.files && event.target.files[0];
      if (!file) return;

      if (soundFile && typeof soundFile.stop === 'function') {
        soundFile.stop();
      }

      const objectUrl = URL.createObjectURL(file);
      soundFile = loadSound(objectUrl, () => {
        micStatusText.textContent = 'File ready';
        micIndicator.classList.remove('active');
        micIndicator.classList.add('ready');
        micIndicator.classList.remove('off');
      }, () => {
        micStatusText.textContent = 'Audio error';
      });
    });
  }

  // Recompute contour and redraw when the text area changes.
  letterInput.addEventListener('input', () => {
    if (isGrowing) return;
    letters = letterInput.value || 'A';
    updateLetterBoundary();
    if (!isGrowing) redrawCanvas();
  });

  textAlignSelect.addEventListener('change', (event) => {
    if (isGrowing) return;
    textAlignMode = event.target.value || 'center';
    updateLetterBoundary();
    if (!isGrowing) redrawCanvas();
  });

  fontFamilySelect.addEventListener('change', (event) => {
    if (isGrowing) return;
    fontFamilyMode = event.target.value || 'Helvetica Bold';
    updateLetterBoundary();
    if (!isGrowing) redrawCanvas();
  });

  // Free color picker: 'input' fires continuously while dragging inside the native picker, so the
  // canvas previews the color live. Ignored while growing (same rule the old swatches had) — the
  // picker is snapped back to the current color so it never shows a value that wasn't applied.
  textColorPicker.addEventListener('input', (event) => {
    if (isGrowing) {
      syncTextColorPicker();
      return;
    }
    textColor = event.target.value || '#ffffff';
    textColorAuto = false;
    syncTextColorPicker();
    updateLetterBoundary();
    redrawCanvas();
  });

  // Debounced contour rebuild while dragging font size.
  fontSizeSlider.addEventListener('input', (e) => {
    fontSize = parseInt(e.target.value);
    fontSizeValue.textContent = fontSize;
    if (!isGrowing) redrawCanvas();
    
    clearTimeout(fontSizeTimeout);
    fontSizeTimeout = setTimeout(() => {
      updateLetterBoundary();
    }, 300);
  });

  trackingSlider.addEventListener('input', (e) => {
    tracking = parseInt(e.target.value, 10);
    trackingValue.textContent = tracking;
    if (!isGrowing) redrawCanvas();
    updateLetterBoundary();
  });

  lineHeightSlider.addEventListener('input', (e) => {
    lineHeightMultiplier = parseFloat(e.target.value);
    lineHeightValue.textContent = lineHeightMultiplier.toFixed(2);
    if (!isGrowing) redrawCanvas();
    updateLetterBoundary();
  });

  startBtn.addEventListener('click', startGrowth);
  stopBtn.addEventListener('click', stopGrowth);
  clearBtn.addEventListener('click', clearGrowth);
  exportBtn.addEventListener('click', exportPNG);
  invertBtn.addEventListener('click', toggleInvertColors);

  // Quadratic speed curve provides finer low-end control.
  speedSlider.addEventListener('input', (e) => {
    let sliderValue = parseFloat(e.target.value);
    growthSpeed = sliderValue * sliderValue;
    speedValue.textContent = sliderValue.toFixed(2);
  });

  // Toggle interaction mode to sound.
  modeButtons.sound.addEventListener('click', () => {
    mode = 'sound';
    stopMicIfNeeded();
    updateModeButtons();
  });

  // Toggle interaction mode to mouse.
  modeButtons.mouse.addEventListener('click', () => {
    mode = 'mouse';
    stopMicIfNeeded();
    updateModeButtons();
  });

  // Keeps mic state visually readable when the sound flow is selected but not yet active.
  if (micIndicator) {
    micIndicator.classList.toggle('ready', mode === 'sound' && !micActive);
    micIndicator.classList.toggle('off', mode !== 'sound' && !micActive);
  }

  updateModeButtons();
  updateInvertButton();
  updateTimestamp();

  // This first call runs before draw() has ever executed, so the main canvas font hasn't been
  // synced yet (see the note on updateLetterBoundary()). Harmless here because draw() starts
  // immediately after setup() and keeps recomputing the layout every frame, so it's already
  // correct by the time the user can interact.
  if (width > 100 && height > 100) {
    updateLetterBoundary();
  }

  // Keep canvas matched to container dimensions.
  window.addEventListener('resize', () => {
    const rect = holder.getBoundingClientRect();
    resizeCanvas(rect.width, rect.height);
    // The trail buffer is sized to the canvas, so it has to be rebuilt at the new dimensions —
    // this does mean an in-progress trail is lost on resize (it was never resize-safe before this
    // change either: old segments kept their pre-resize absolute coordinates and would end up
    // misaligned with the re-flowed text anyway).
    createTrailBuffer();
  });
}

// ===== UI helpers =====
// Reflects active mode in the sidebar button styles.
function stopMicIfNeeded() {
  if (audioInput && micActive) {
    try {
      audioInput.stop();
    } catch (e) {
      console.warn('Mic stop on mode switch failed:', e);
    }
  }

  if (soundFile && typeof soundFile.stop === 'function') {
    try {
      soundFile.stop();
    } catch (e) {
      console.warn('Sound file stop on mode switch failed:', e);
    }
  }

  micActive = false;
  currentAudioLevel = 0;
  audioLevel = 0;
}

function updateModeButtons() {
  const soundActive = mode === 'sound';

  if (soundActive) {
    modeButtons.sound.classList.add('active');
    modeButtons.mouse.classList.remove('active');
    micIndicator.classList.toggle('ready', !micActive);
    micIndicator.classList.remove('off');
  } else {
    modeButtons.mouse.classList.add('active');
    modeButtons.sound.classList.remove('active');
    micIndicator.classList.remove('ready');
    micIndicator.classList.add('off');
  }

  if (micActive) {
    micIndicator.classList.add('active');
    micIndicator.classList.remove('ready');
    micIndicator.classList.remove('off');
  }
}

function getThemeColors() {
  if (invertColors) {
    return { background: 255, foreground: 0 };
  }
  return { background: 0, foreground: 255 };
}

function getCurrentTextColor() {
  return textColor || (invertColors ? '#000000' : '#ffffff');
}

function getSelectedFontSpec() {
  const fontMap = {
    'Helvetica Bold': { family: "'Helvetica Neue', Helvetica, Arial, sans-serif", weight: 700 },
    'Helvetica Light': { family: "'Helvetica Neue', Helvetica, Arial, sans-serif", weight: 300 },
    'Google Elms Sans': { family: "'Elms Sans', 'Segoe UI', Arial, sans-serif", weight: 400 },
    'Bodoni Moda': { family: "'Bodoni Moda', Georgia, serif", weight: 600 }
  };

  return fontMap[fontFamilyMode] || fontMap['Helvetica Bold'];
}

function applyTextFont(targetContext = drawingContext) {
  const fontSpec = getSelectedFontSpec();
  const cssFont = `${fontSpec.weight} ${fontSize}px ${fontSpec.family}`;
  if (targetContext && targetContext.font !== undefined) {
    targetContext.font = cssFont;
  }
  return cssFont;
}

function updateInvertButton() {
  if (!invertBtn) return;
  invertBtn.classList.toggle('active', invertColors);
  invertBtn.textContent = invertColors ? 'change to dark mode' : 'change to light mode';
}

// Mirrors textColor into the color picker, its visible color box and hex label (e.g. after the theme toggle changes it).
function syncTextColorPicker() {
  if (!textColorPicker) return;
  textColorPicker.value = textColor;
  if (textColorSwatch) textColorSwatch.style.background = textColor;
  if (textColorValue) textColorValue.textContent = textColor;
}

function toggleInvertColors() {
  invertColors = !invertColors;
  document.body.classList.toggle('invert-theme', invertColors);
  if (textColorAuto) {
    textColor = invertColors ? '#000000' : '#ffffff';
    syncTextColorPicker();
  }
  updateInvertButton();
  if (!isGrowing) redrawCanvas();
}

// ===== Contour extraction =====
// Displays footer metadata with a date line and a separate time line.
function renderFooterMetadata(versionText, authorText, dateText, timeText) {
  const lines = [
    `Growing Letters ${versionText}`,
    authorText,
    `built ${dateText}`,
    timeText
  ];

  timestamp.innerHTML = lines
    .map((line) => `
      <div class="meta-line">
        <span class="meta-text">${line}</span>
      </div>
    `)
    .join('');
}

async function updateTimestamp() {
  try {
    const response = await fetch('js/sketch.js', { method: 'HEAD' });
    const lastModified = response.headers.get('last-modified');
    if (lastModified) {
      const date = new Date(lastModified);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      const seconds = String(date.getSeconds()).padStart(2, '0');
      const dateText = `${year}/${month}/${day}`;
      const timeText = `${hours}:${minutes}:${seconds}`;
      renderFooterMetadata(APP_VERSION, 'eloy segura @ altura x', dateText, timeText);
    } else {
      renderFooterMetadata(APP_VERSION, 'eloy segura @ altura x', BUILD_TIME.split(' ')[0], BUILD_TIME.split(' ')[1]);
    }
  } catch (e) {
    renderFooterMetadata(APP_VERSION, 'eloy segura @ altura x', BUILD_TIME.split(' ')[0], BUILD_TIME.split(' ')[1]);
  }
}

// ===== Growth lifecycle =====
// Computes the center of each glyph in the current text block so growth can stay radial to the composition.
// Splits the raw textarea content into an array of display lines that each fit within maxLineWidth,
// combining user newlines (paragraphs) with automatic word-wrapping, and falling back to
// character-by-character chunking for single words that are wider than the whole line (e.g. a very
// long word with no spaces).
function wrapTextToLines(rawText) {
  const source = String(rawText || 'A').replace(/\r/g, '');
  const paragraphs = source.split(/\n+/).filter(part => part.trim().length > 0);
  const wrapped = [];
  const maxLineWidth = min(width * 0.8, width - 80);

  if (paragraphs.length === 0) {
    wrapped.push('A');
    return wrapped;
  }

  for (let paragraph of paragraphs) {
    let currentLine = '';
    const words = paragraph.split(/\s+/);

    for (let i = 0; i < words.length; i++) {
      let word = words[i];
      let candidate = currentLine ? (currentLine + ' ' + word) : word;

      if (getLineWidth(candidate) <= maxLineWidth || currentLine.length === 0) {
        // Word still fits (or the line is empty so we must take at least one word).
        currentLine = candidate;
      } else {
        if (currentLine.length > 0) {
          // Line is full: push what we have and start a new line with this word.
          wrapped.push(currentLine);
          currentLine = word;
        } else {
          // Edge case: a single word alone is already wider than maxLineWidth.
          // Break it into character chunks so it never overflows the canvas.
          let chunk = '';
          for (let j = 0; j < word.length; j++) {
            let next = chunk + word[j];
            if (getLineWidth(next) > maxLineWidth && chunk.length > 0) {
              wrapped.push(chunk);
              chunk = word[j];
            } else {
              chunk = next;
            }
          }
          currentLine = chunk;
        }
      }

      if (i === words.length - 1 && currentLine.length > 0) {
        wrapped.push(currentLine);
      }
    }
  }

  return wrapped.length > 0 ? wrapped : ['A'];
}

function getTextLines() {
  return wrapTextToLines(letters);
}

// Maps the textAlignMode setting to a p5 constant, for use with p5's own textAlign() if ever needed.
function getTextHorizontalAlign() {
  if (textAlignMode === 'left') return LEFT;
  if (textAlignMode === 'right') return RIGHT;
  return CENTER;
}

// NOTE: not called anywhere in this file — getTextStartX() below is what actually positions text.
// Kept as a helper for the alignment "anchor" x-coordinate (margin/center/margin), independent of line width.
function getTextAnchorX(lineWidth = 0) {
  const marginX = min(width * 0.12, 90);

  if (textAlignMode === 'left') {
    return marginX;
  }

  if (textAlignMode === 'right') {
    return width - marginX;
  }

  return width / 2;
}

// Returns the x pixel where a given line of text (of lineWidth px) should start being drawn,
// so that it ends up left/right/center aligned per textAlignMode. All per-character drawing
// loops in this file (updateLetterBoundary, redrawCanvas, draw, exportPNG) walk forward from here.
function getTextStartX(lineWidth = 0) {
  const marginX = min(width * 0.12, 90);

  if (textAlignMode === 'left') {
    return marginX;
  }

  if (textAlignMode === 'right') {
    return width - marginX - lineWidth;
  }

  return (width - lineWidth) / 2;
}

// Measures the pixel width of a line of text as it will actually be drawn: per-character glyph widths
// plus the tracking (letter-spacing) gap after every character except the last. Spaces get a smaller
// gap (0.6x tracking) so word gaps don't look exaggerated at high tracking values.
// Relies on textWidth() reading the font currently set on the MAIN canvas context (kept in sync every
// frame by applyTextFont() inside draw()/redrawCanvas()), which is why this must not be called before
// the font has been applied at least once.
function getLineWidth(line) {
  let widthTotal = 0;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    widthTotal += textWidth(char);
    if (i < line.length - 1) {
      widthTotal += char === ' ' ? tracking * 0.6 : tracking;
    }
  }

  return widthTotal;
}

// Builds the full geometric layout for the current text: which lines, at which y positions,
// and for every character its (x, y) draw position. This single layout object is reused by
// updateLetterBoundary(), redrawCanvas(), draw() and exportPNG() so all four stay pixel-consistent.
function getTextLayout() {
  const lines = getTextLines();
  const lineHeight = fontSize * lineHeightMultiplier;
  const lineYStart = height / 2 - ((lines.length - 1) * lineHeight) / 2;
  const layout = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const baseY = lineYStart + i * lineHeight;
    const lineWidth = getLineWidth(line);
    const startX = getTextStartX(lineWidth);
    let currentX = startX;
    const chars = [];

    for (let j = 0; j < line.length; j++) {
      const char = line[j];
      const charWidth = textWidth(char);
      chars.push({
        x: currentX,
        y: baseY,
        char
      });
      currentX += charWidth + (char === ' ' ? tracking * 0.6 : tracking);
    }

    layout.push({
      text: line,
      y: baseY,
      chars,
      xStart: startX,
      xEnd: currentX
    });
  }

  return { lines, lineHeight, lineYStart, layout };
}

// Returns the horizontal-center point of every individual character in the current text (one entry
// per glyph, not per line). Each growth seed on the letter contour is later matched to its nearest
// entry here (see startGrowth) so branches curve toward the center of "their" letter rather than the
// center of the whole text block.
function getLetterCenters() {
  const layout = getTextLayout();
  let centers = [];

  for (let block of layout.layout) {
    for (let char of block.chars) {
      const charWidth = textWidth(char.char);
      centers.push({
        x: char.x + charWidth / 2,
        y: char.y
      });
    }
  }

  return centers.length > 0 ? centers : [{ x: width / 2, y: height / 2 }];
}

// Rasterizes the current text block and extracts edge pixels as growth seeds.
// IMPORTANT: getTextLayout()/getLineWidth() below measure text using the MAIN canvas's font
// (global textWidth()), while the actual glyphs are drawn onto the offscreen buffer `pg` using its
// own font set a few lines down (applyTextFont(pg.drawingContext)). This only stays correct because
// both fonts are always set to the same fontSize/fontFamilyMode, and because draw() re-applies the
// main canvas font every frame — so by the time a user can trigger this function the main canvas
// font is already in sync. Don't call this before the sketch has rendered at least one frame.
function updateLetterBoundary() {
  if (width <= 100 || height <= 100) return;

  const layout = getTextLayout();
  const blockCenters = layout.layout.map(block => (block.xStart + block.xEnd) / 2);
  letterCenter.x = blockCenters.length > 0 ? blockCenters.reduce((sum, value) => sum + value, 0) / blockCenters.length : width / 2;
  letterCenter.y = layout.lineYStart + ((layout.lines.length - 1) * layout.lineHeight) / 2;
  letterCenters = getLetterCenters();

  // Draw the paragraph on an offscreen buffer to inspect alpha values.
  let pg = createGraphics(width, height);
  pg.fill(textColor || '#ffffff');
  pg.textAlign(LEFT, CENTER);
  applyTextFont(pg.drawingContext);

  for (let i = 0; i < layout.lines.length; i++) {
    const line = layout.lines[i];
    const y = layout.lineYStart + i * layout.lineHeight;
    const lineWidth = getLineWidth(line);
    let currentX = getTextStartX(lineWidth);

    for (let j = 0; j < line.length; j++) {
      const char = line[j];
      const charWidth = textWidth(char);
      pg.text(char, currentX, y);
      currentX += charWidth + (char === ' ' ? tracking * 0.6 : tracking);
    }
  }

  try {
    // Read pixels with density-aware dimensions to avoid retina offsets.
    // pixelDensity() is >1 on HiDPI/retina screens (the canvas backing store has more physical pixels
    // than its CSS width/height), so raw canvas (x, y) loop coordinates must be scaled up by `density`
    // before indexing into the ImageData buffer, while letterBoundaryPoints itself is stored in
    // un-scaled canvas coordinates (matching everything else in the sketch, e.g. mouseX/mouseY).
    let density = pg.pixelDensity();
    let step = max(1, floor(density)); // neighbor-check distance in physical pixels, at least 1.
    let sourceWidth = floor(width * density);
    let sourceHeight = floor(height * density);
    // getImageData returns a flat RGBA byte array; each pixel occupies 4 consecutive bytes
    // (R, G, B, A) so pixel (px, py)'s alpha channel lives at index (py * sourceWidth + px) * 4 + 3.
    let pixels = pg.drawingContext.getImageData(0, 0, sourceWidth, sourceHeight).data;
    letterBoundaryPoints = [];

    // Edge detection: a pixel counts as a boundary point when it is "inside" the glyph
    // (alpha > 128, i.e. more than half-opaque text fill) AND at least one of its
    // up/down/left/right neighbors is "outside" (alpha <= 128, i.e. background).
    // This traces roughly a 1px-wide outline around every glyph, which becomes the pool of
    // candidate seed points that branches grow from (see getUniformBoundarySeeds/startGrowth).
    for (let y = 2; y < height - 2; y += 1) {
      for (let x = 2; x < width - 2; x += 1) {
        let px = floor(x * density);
        let py = floor(y * density);
        let idx = (py * sourceWidth + px) * 4 + 3;
        if (pixels[idx] > 128) {
          let up = ((max(0, py - step) * sourceWidth) + px) * 4 + 3;
          let down = ((min(sourceHeight - 1, py + step) * sourceWidth) + px) * 4 + 3;
          let left = (py * sourceWidth + max(0, px - step)) * 4 + 3;
          let right = (py * sourceWidth + min(sourceWidth - 1, px + step)) * 4 + 3;

          if (pixels[up] <= 128 || pixels[down] <= 128 || pixels[left] <= 128 || pixels[right] <= 128) {
            letterBoundaryPoints.push({ x, y });
          }
        }
      }
    }
  } catch (e) {
    // Fallback keeps the app usable if pixel read fails.
    console.warn('Could not extract pixels, using fallback');
    // Fallback: generate points in circle
    for (let a = 0; a < TWO_PI; a += TWO_PI/360) {
      let r = 50;
      letterBoundaryPoints.push({
        x: letterCenter.x + cos(a) * r,
        y: letterCenter.y + sin(a) * r
      });
    }
  }

  pg.remove();
  console.log('✓ Found', letterBoundaryPoints.length, 'boundary points');
}

// Returns an evenly distributed subset of contour points for stable seeding.
// Naively picking the first maxSeeds boundary points (as scanned row-by-row) would cluster them
// unevenly and bias growth toward whichever part of the glyph the scan reaches first, so this
// downsamples using a spatial grid instead (a simple approximation of Poisson-disk sampling).
function getUniformBoundarySeeds(points, maxSeeds = 260) {
  if (points.length <= maxSeeds) return points.slice();

  // Shuffle first (Fisher-Yates) to avoid directional bias from scanline ordering.
  let shuffled = points.slice();
  for (let i = shuffled.length - 1; i > 0; i--) {
    let j = floor(random(i + 1));
    let temp = shuffled[i];
    shuffled[i] = shuffled[j];
    shuffled[j] = temp;
  }

  let bounds = {
    minX: Infinity,
    maxX: -Infinity,
    minY: Infinity,
    maxY: -Infinity
  };

  for (let p of shuffled) {
    if (p.x < bounds.minX) bounds.minX = p.x;
    if (p.x > bounds.maxX) bounds.maxX = p.x;
    if (p.y < bounds.minY) bounds.minY = p.y;
    if (p.y > bounds.maxY) bounds.maxY = p.y;
  }

  // Grid-based Poisson-like filtering for spatially uniform seeds.
  // Divide the bounding box into square cells sized so ~maxSeeds cells would tile the whole area,
  // then keep at most one (shuffled, so effectively random) point per cell — this spreads seeds
  // evenly across the glyph instead of leaving dense clumps.
  let area = max(1, (bounds.maxX - bounds.minX) * (bounds.maxY - bounds.minY));
  let cellSize = max(2, floor(sqrt(area / maxSeeds) * 0.55));
  let grid = new Set();
  let seeds = [];

  for (let p of shuffled) {
    let gx = floor((p.x - bounds.minX) / cellSize);
    let gy = floor((p.y - bounds.minY) / cellSize);
    let key = gx + ":" + gy;

    if (!grid.has(key)) {
      grid.add(key);
      seeds.push(p);
      if (seeds.length >= maxSeeds) break;
    }
  }

  // If the grid filter didn't produce enough seeds (e.g. a thin glyph with few occupied cells),
  // top up with any remaining shuffled points regardless of spacing, so growth never starts with
  // fewer than requested seeds.
  if (seeds.length < maxSeeds) {
    for (let i = 0; i < shuffled.length && seeds.length < maxSeeds; i++) {
      seeds.push(shuffled[i]);
    }
  }

  return seeds;
}

// Starts a new simulation from the current letter contour.
async function startGrowth() {
  console.log('START clicked');
  updateLetterBoundary();

  if (letterBoundaryPoints.length === 0) {
    console.log('No boundary points found');
    micStatusText.textContent = 'No contour';
    return;
  }

  isGrowing = true;
  playElapsedStart = millis();
  playFrozenMs = null;
  pauseElapsedStart = null;
  branches = [];
  trailBuffer.clear();
  resetOccupancy(); // v4.0: forget previous trails for self-avoidance

  // Sparse vine look: far fewer starting tendrils than before (was 60/260) so each one reads as
  // its own distinct curling strand instead of blending into a dense mass.
  let seedLimit = mode === 'mouse' ? 12 : 22;
  let seedPoints = getUniformBoundarySeeds(letterBoundaryPoints, seedLimit);
  console.log('Starting growth with', seedPoints.length, 'branches');
  for (let i = 0; i < seedPoints.length; i++) {
    let point = seedPoints[i];
    let anchor = letterCenters[0] || letterCenter;

    // Find the letter center this boundary point "belongs to", so its branch curves inward
    // toward its own glyph rather than the center of the whole text block.
    // NOTE: this only compares horizontal (x) distance, ignoring y entirely. For a single line
    // of text that's fine, but with multi-line text (the textarea supports paragraphs) a point on
    // line 2 can be matched to a letter center on line 1 just because their x happens to be close,
    // giving that branch a center that is actually rows away — this can look like an anchor "from
    // problems" in the growth pattern for multi-line input.
    if (letterCenters.length > 1) {
      let nearestIndex = 0;
      let nearestDistance = Infinity;
      for (let j = 0; j < letterCenters.length; j++) {
        let dx = point.x - letterCenters[j].x;
        let dist = abs(dx);
        if (dist < nearestDistance) {
          nearestDistance = dist;
          nearestIndex = j;
        }
      }
      anchor = letterCenters[nearestIndex];
    }

    let dx = point.x - anchor.x;
    let dy = point.y - anchor.y;
    let distance = sqrt(dx * dx + dy * dy) || 1;
    let radialAngle = atan2(dy / distance, dx / distance);
    // Wide random offset from the purely radial direction (was radialAngle alone) — without this,
    // every tendril starts out pointing straight away from the letter's center, so the whole
    // growth always reads as a radially symmetric burst no matter how the branches curl afterward.
    // This lets tendrils set off in genuinely varied directions, some barely deviating from radial,
    // others heading almost sideways or back across the glyph.
    let seedAngle = radialAngle + random(-PI * 0.7, PI * 0.7);
    let newBranch = new Branch(point.x, point.y, seedAngle, null, 0, midLevel, anchor.x, anchor.y, trebleLevel);
    branches.push(newBranch);
  }

  startBtn.disabled = true;
  stopBtn.disabled = false;
  clearBtn.disabled = false;
  setLetterConfigurationLocked(true);
  exportBtn.disabled = false;

  // Activate either the selected audio file or the microphone, depending on what is available.
  if (mode === 'sound') {
    // One shared FFT analyser, created lazily on first use, then re-pointed at whichever source is
    // actually playing (file or mic) below — see the bass/mid/treble reads in draw().
    if (!fft) {
      fft = new p5.FFT(0.8, 256);
    }

    if (soundFile && typeof soundFile.isLoaded === 'function' && soundFile.isLoaded()) {
      try {
        fft.setInput(soundFile);
        if (typeof soundFile.play === 'function') {
          soundFile.play();
        }
        if (typeof soundFile.onended === 'function') {
          soundFile.onended(() => {
            if (isGrowing) {
              stopGrowth();
            }
          });
        }
        micActive = true;
        micIndicator.classList.add('active');
        micIndicator.classList.remove('ready');
        micIndicator.classList.remove('off');
        micStatusText.textContent = 'Playing file';
      } catch (e) {
        console.error('Audio file playback error:', e);
        micStatusText.textContent = 'File unavailable';
      }
    } else {
      try {
        micStatusText.textContent = 'Requesting mic...';
        if (!audioInput) audioInput = new p5.AudioIn();
        fft.setInput(audioInput);
        audioInput.start();
        micActive = true;
        micReadErrorLogged = false;
        micIndicator.classList.add('active');
        micIndicator.classList.remove('ready');
        micIndicator.classList.remove('off');
        micStatusText.textContent = 'Listening...';
      } catch (e) {
        console.error('Mic error:', e);
        micStatusText.textContent = 'Mic unavailable';
        micIndicator.classList.remove('active');
        micIndicator.classList.add('ready');
      }
    }
  }
}

// ===== Rendering helpers =====
// Disables every TEXT-block control that affects letter geometry/position (as opposed to just
// color) while growth is active, since changing them would reflow the visible text out from under
// branches that already grew from the old contour. Re-enabled only by clearGrowth() (i.e. the user
// must press Clear, not just Stop, before editing text/layout again).
function setLetterConfigurationLocked(isLocked) {
  if (letterInput) letterInput.disabled = isLocked;
  if (textAlignSelect) textAlignSelect.disabled = isLocked;
  if (fontFamilySelect) fontFamilySelect.disabled = isLocked;
  if (fontSizeSlider) fontSizeSlider.disabled = isLocked;
  if (trackingSlider) trackingSlider.disabled = isLocked;
  if (lineHeightSlider) lineHeightSlider.disabled = isLocked;
}


// Stops growth and restores editable controls.
function stopGrowth() {
  isGrowing = false;
  if (playElapsedStart !== null) playFrozenMs = millis() - playElapsedStart;
  pauseElapsedStart = millis();
  if (audioInput && micActive) {
    try {
      audioInput.stop();
      micActive = false;
    } catch (e) {
      console.error('Mic stop error:', e);
    }
  }

  if (soundFile && typeof soundFile.stop === 'function') {
    try {
      soundFile.stop();
    } catch (e) {
      console.error('Sound file stop error:', e);
    }
  }

  micIndicator.classList.remove('active');
  if (mode === 'sound') {
    micIndicator.classList.add('ready');
    micIndicator.classList.remove('off');
  } else {
    micIndicator.classList.remove('ready');
    micIndicator.classList.add('off');
  }
  micStatusText.textContent = 'Ready';
  startBtn.disabled = false;
  stopBtn.disabled = true;
  clearBtn.disabled = false;
}

// Clears current growth while keeping the current letter/settings.
function clearGrowth() {
  stopGrowth();
  // Clear is a full reset, not just a pause — hide both timers until the next Play.
  playElapsedStart = null;
  playFrozenMs = null;
  pauseElapsedStart = null;
  setLetterConfigurationLocked(false);
  branches = [];
  trailBuffer.clear();
  resetOccupancy(); // v4.0: forget previous trails for self-avoidance
  lastMouseX = null;
  lastMouseY = null;
  redrawCanvas();
}

// Repaints static content from the persistent trail buffer.
function redrawCanvas() {
  const theme = getThemeColors();
  const layout = getTextLayout();
  const activeTextColor = getCurrentTextColor();
  background(theme.background);
  push();
  tint(activeTextColor);
  image(trailBuffer, 0, 0, width, height);
  pop();

  fill(activeTextColor);
  applyTextFont(drawingContext);

  for (let i = 0; i < layout.lines.length; i++) {
    const line = layout.lines[i];
    const y = layout.lineYStart + i * layout.lineHeight;
    const lineWidth = getLineWidth(line);
    let currentX = getTextStartX(lineWidth);

    for (let j = 0; j < line.length; j++) {
      const char = line[j];
      const charWidth = textWidth(char);
      // Draw at the glyph's left edge (currentX), matching the LEFT text alignment p5 defaults to
      // (never overridden on this context) and matching how currentX/charWidth were laid out above.
      // Do NOT add charWidth/2 here — that would shift every glyph right by half of ITS OWN width,
      // which is a different amount per letter and breaks the uniform tracking between characters.
      text(char, currentX, y);
      currentX += charWidth + (char === ' ' ? tracking * 0.6 : tracking);
    }
  }
}

// ===== Export =====
// Exports a high-resolution snapshot as a PNG download.
function exportPNG() {
  // Render to an offscreen buffer at TRAIL_SCALE for cleaner output — kept equal to trailBuffer's own
  // resolution so it can be drawn into this export 1:1 below, with no extra resampling.
  let scale = TRAIL_SCALE;
  let exportGraphics = createGraphics(width * scale, height * scale);
  const theme = getThemeColors();
  const layout = getTextLayout();
  const activeTextColor = getCurrentTextColor();

  exportGraphics.background(theme.background);
  // trailBuffer is already baked at TRAIL_SCALE resolution, matching this export's own scale, so it
  // can be drawn in 1:1 without any extra resampling — same tint() trick as redrawCanvas()/draw().
  exportGraphics.push();
  exportGraphics.tint(activeTextColor);
  exportGraphics.image(trailBuffer, 0, 0, width * scale, height * scale);
  exportGraphics.pop();

  exportGraphics.fill(activeTextColor);
  // Match the vertical alignment set on the main canvas in setup() and on the contour buffer
  // in updateLetterBoundary(), so the exported PNG lines up with what's on screen.
  exportGraphics.textAlign(LEFT, CENTER);
  // applyTextFont() sets the font at the normal (unscaled) fontSize; it's immediately overridden below
  // with a fontSize * scale version so the exported glyphs are crisp at 2x resolution. The call above is
  // effectively redundant but harmless — kept because applyTextFont() is the single source of truth for
  // the font-family/weight string, avoided duplicating it here except for the size.
  applyTextFont(exportGraphics.drawingContext);
  exportGraphics.drawingContext.font = `${getSelectedFontSpec().weight} ${fontSize * scale}px ${getSelectedFontSpec().family}`;

  for (let i = 0; i < layout.lines.length; i++) {
    const line = layout.lines[i];
    const y = (layout.lineYStart + i * layout.lineHeight) * scale;
    const lineWidth = getLineWidth(line);
    let currentX = getTextStartX(lineWidth) * scale;

    for (let j = 0; j < line.length; j++) {
      const char = line[j];
      // Measure on the main canvas (font at the unscaled fontSize, same as getLineWidth()) and scale up.
      // exportGraphics.textWidth() would measure with the already-scaled font, so multiplying it by
      // scale again doubled the advance and pushed every letter after the first out of place.
      const charWidth = textWidth(char) * scale;
      // Same left-edge placement as redrawCanvas()/draw() — see note there.
      exportGraphics.text(char, currentX, y);
      currentX += charWidth + (char === ' ' ? tracking * 0.6 * scale : tracking * scale);
    }
  }

  let now = new Date();
  let dateStr = now.toISOString().split('T')[0];
  let timeStr = now.toTimeString().split(' ')[0].replace(/:/g, '-');
  if (exportGraphics) {
    saveCanvas(exportGraphics.canvas, `growing-letters_${dateStr}_${timeStr}`, 'png');
    exportGraphics.remove();
  }
}

// ===== Main draw loop =====
// p5 draw loop: renders text + segments and advances simulation.
// Formats a millisecond duration as "mm:ss" for the on-canvas session timers.
function formatElapsed(ms) {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return String(minutes).padStart(2, '0') + ':' + String(seconds).padStart(2, '0');
}

// Draws the "time since Play" / "time since Pause" readout in the top-left corner. Uses the neutral
// theme foreground color (not the user's chosen artistic text color) and a monospace font, so it reads
// as a diagnostic UI overlay distinct from the growing artwork, per the project's techno-minimal style.
function drawSessionTimers() {
  if (playElapsedStart === null && pauseElapsedStart === null) return;

  const theme = getThemeColors();
  const pad = 16;
  const lineHeight = 18;
  // Anchored to the bottom-right corner; stack upward so the last line drawn sits at the very bottom.
  let y = height - pad;

  push();
  noStroke();
  fill(theme.foreground);
  textFont('monospace');
  textSize(14);
  textAlign(RIGHT, BOTTOM);

  if (pauseElapsedStart !== null) {
    text('PAUSE ' + formatElapsed(millis() - pauseElapsedStart), width - pad, y);
    y -= lineHeight;
  }
  if (playElapsedStart !== null) {
    // While paused, playFrozenMs holds the elapsed time at the moment Pause was pressed, so this
    // stays fixed instead of continuing to climb (only ticks live while actually growing).
    const playMs = playFrozenMs !== null ? playFrozenMs : (millis() - playElapsedStart);
    text('PLAY  ' + formatElapsed(playMs), width - pad, y);
  }
  pop();
}

function draw() {
  const theme = getThemeColors();
  const layout = getTextLayout();
  const activeTextColor = getCurrentTextColor();
  background(theme.background);

  push();
  tint(activeTextColor);
  image(trailBuffer, 0, 0, width, height);
  pop();

  fill(activeTextColor);
  applyTextFont(drawingContext);

  for (let i = 0; i < layout.lines.length; i++) {
    const line = layout.lines[i];
    const y = layout.lineYStart + i * layout.lineHeight;
    const lineWidth = getLineWidth(line);
    let currentX = getTextStartX(lineWidth);

    for (let j = 0; j < line.length; j++) {
      const char = line[j];
      const charWidth = textWidth(char);
      // Same left-edge placement as redrawCanvas() — see note there.
      text(char, currentX, y);
      currentX += charWidth + (char === ' ' ? tracking * 0.6 : tracking);
    }
  }

  if (isGrowing) {
    // Control values are normalized to 0..1 and reused as growth intensity.
    let attractX = null, attractY = null;
    let bass = 0, mid = 0, treble = 0;

    // Sound mode: use the loaded file if present, otherwise fall back to microphone input. Both
    // branches now read bass/mid/treble from the shared FFT (pointed at whichever source is active —
    // see startGrowth()) instead of collapsing the whole spectrum into one loudness number, so
    // different kinds of sound actually produce visibly different growth (see Branch.update()).
    if (mode === 'sound' && micActive && soundFile && typeof soundFile.isLoaded === 'function' && soundFile.isLoaded()) {
      try {
        audioLevel = soundFile.getLevel();
        if (fft) {
          fft.analyze();
          bass = fft.getEnergy('bass') / 255;
          mid = fft.getEnergy('mid') / 255;
          treble = fft.getEnergy('treble') / 255;
        }
        if (audioLevel > 0.0001) {
          micStatusText.textContent = 'Playing file: ' + (audioLevel * 100).toFixed(0) + '%';
        }
      } catch (e) {
        console.error('File audio read error:', e);
        micStatusText.textContent = 'File unavailable';
      }
    } else if (mode === 'sound' && micActive && audioInput) {
      try {
        audioLevel = audioInput.getLevel();
        if (fft) {
          fft.analyze();
          bass = fft.getEnergy('bass') / 255;
          mid = fft.getEnergy('mid') / 255;
          treble = fft.getEnergy('treble') / 255;
        }
        if (audioLevel > 0.01) {
          micStatusText.textContent = 'Listening: ' + (audioLevel * 100).toFixed(0) + '%';
        }
      } catch (e) {
        if (!micReadErrorLogged) {
          console.error('Mic read error:', e);
          micReadErrorLogged = true;
        }
        micStatusText.textContent = 'Mic unavailable';
      }
    } else if (mode === 'mouse') {
      // Mouse mode: cursor position attracts branches; motion (speed since last frame) drives intensity.
      // NOTE: lastMouseX/lastMouseY are only reset to null in clearGrowth(), not in stopGrowth(). So if
      // the user Stops, moves the mouse elsewhere, then Starts again (without Clear), the very first
      // frame's `movement` distance is measured against a stale position from before the pause — this
      // can produce an artificial intensity spike on resume instead of reflecting real current motion.
      attractX = mouseX;
      attractY = mouseY;
      if (lastMouseX === null || lastMouseY === null) {
        currentAudioLevel = 0;
      } else {
        let movement = dist(mouseX, mouseY, lastMouseX, lastMouseY);
        currentAudioLevel = constrain(movement / 20, 0, 1);
      }
      lastMouseX = mouseX;
      lastMouseY = mouseY;
      // Mouse mode has no spectrum to split, so the single movement-based intensity drives all three
      // bands equally (same visual behavior as before this change).
      bass = mid = treble = currentAudioLevel;
    } else {
      currentAudioLevel = 0;
    }

    // Transient/peak detection (sound mode only): compares this frame's loudest band against a
    // slow-moving average of recent loudness. A sudden jump well above that average — a clap, a
    // drum hit, a hard consonant — reads as a "hit" and spikes transientLevel, which in turn fires a
    // short burst of extra branching in Branch.update(), independent of the steady bass/mid/treble
    // levels above. transientLevel decays by 15%/frame so each hit reads as a brief pop, not a hold.
    if (mode === 'sound') {
      let rawLevel = max(bass, mid, treble);
      smoothedLevel = lerp(smoothedLevel, rawLevel, 0.08);
      let spike = max(0, rawLevel - smoothedLevel - 0.08);
      transientLevel = max(transientLevel * 0.85, min(1, spike * 5));
    } else {
      transientLevel = 0;
    }

    bassLevel = bass;
    midLevel = mid;
    trebleLevel = treble;
    currentAudioLevel = max(bass, mid, treble);

    // Advance all active branches one simulation step.
    for (let branch of branches) {
      branch.update(attractX, attractY, bass, mid, treble, transientLevel);
    }

    // Keep branch list bounded to preserve performance over long sessions.
    // Cap lowered from 3000/2000 to 1800/1200: fewer simultaneously-active branches means fewer
    // Branch.update() calls and fewer new segments pushed per frame, at the cost of a somewhat
    // less densely bushy pattern once a session has been running for a while.
    branches = branches.filter(b => b.isActive);
    if (branches.length > 1800) branches = branches.slice(-1200);
  }

  drawSessionTimers();
}

// ===== Resize handling =====
// Handles p5 resize callback to keep canvas aligned with its container.
function windowResized() {
  const holder = document.getElementById('sketch-holder');
  const rect = holder.getBoundingClientRect();
  resizeCanvas(rect.width, rect.height);
  createTrailBuffer();
}
