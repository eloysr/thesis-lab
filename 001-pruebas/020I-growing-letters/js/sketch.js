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
let textColorSwatches;
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

const BUILD_TIME = "2026-08-20 18:57:23";
const APP_VERSION = "v3.0";

// ===== Branch simulation =====
// Branch models one growing filament and optionally generates child branches.
class Branch {
  constructor(x, y, angle, parentAngle = null, generation = 0, audioLevel = 0, centerX = letterCenter.x, centerY = letterCenter.y) {
    this.x = x;
    this.y = y;
    this.prevX = x;
    this.prevY = y;
    this.centerX = centerX;
    this.centerY = centerY;

    // Root-like branch: starts with a small directional bias and becomes more curved as it grows.
    if (parentAngle !== null) {
      this.angle = parentAngle + random(-0.12, 0.12);
    } else {
      this.angle = angle;
    }

    this.baseAngle = this.angle;
    // How far this branch has traveled since it was created, and since it last spawned a child.
    // Used together with branchInterval below to decide when the next branching point occurs.
    this.distanceTraveled = 0;
    this.lastBranchDistance = 0;

    // Branching interval shrinks when control intensity increases.
    // audioLevel is 0..~1 here, so louder sound / faster mouse movement means children spawn sooner.
    // Widened from the original random(60, 120) so branches spawn children a bit less often —
    // this slows how fast the total branch/segment population grows in a long session (helps
    // performance) while keeping the same branching look, just slightly less dense over time.
    let baseInterval = random(80, 140);
    this.branchInterval = baseInterval / (1 + audioLevel * 25);
    this.speed = 0.9 + random(0.15, 0.5);

    // Organic wobble to mimic root tips and capillary motion.
    // wavePhase advances every frame (see update()) and waveOscillation scales how visible the wiggle is.
    this.waveOscillation = random(0.01, 0.045);
    this.wavePhase = random(TWO_PI);
    this.generation = generation; // 0 = seeded directly from the letter contour, increases with each child branch.
    this.isActive = true; // Set to false once the branch leaves the canvas bounds (see update()).
    this.children = [];
    this.curveBias = random(-0.15, 0.15); // Slight per-branch offset so radial/inward targets aren't perfectly aligned.
    this.tipSensitivity = random(0.8, 1.6); // Multiplies how strongly this branch steers toward its radial target.
    this.rootDominance = random(0.8, 1.5); // Multiplies rootBias; higher = branch holds its own direction more stubbornly.
    this.strokeWeight = 1.2 + random(0.0, 1.2) + this.generation * 0.12; // Slightly thicker for later generations.
  }

  update(attractX = null, attractY = null, audioLevel = 0) {
    if (!this.isActive) return;

    // Keep previous position so each update can draw one segment.
    this.prevX = this.x;
    this.prevY = this.y;

    // Advance the wobble clock; later generations wobble slightly faster.
    this.wavePhase += 0.04 + this.generation * 0.01;
    let waveInfluence = sin(this.wavePhase) * this.waveOscillation;

    // Only branches created from the interior contour are allowed to grow inward.
    // Boundary seeds keep their natural radial spread, but their target is always shifted toward the center.
    // radialAngle points AWAY from this branch's anchor center (outward spread for child branches, generation > 0).
    // inwardAngle points TOWARD the anchor center (used only for generation 0, the seeds planted on the letter contour,
    // so the very first filaments curve back into the glyph before fanning out).
    let radialAngle = atan2(this.y - this.centerY, this.x - this.centerX);
    let inwardAngle = atan2(this.centerY - this.y, this.centerX - this.x);
    let radialTarget = (this.generation === 0) ? inwardAngle + this.curveBias : radialAngle + this.curveBias;

    // rootBias is how strongly the branch is pulled toward radialTarget each frame (only used when there's no
    // mouse/audio attractor point below); it grows slightly with generation so child branches settle into their
    // spread direction faster than the root branch does.
    let rootBias = (0.03 + this.generation * 0.01) * this.rootDominance;
    let currentAngle = this.baseAngle + waveInfluence;

    // In mouse mode, filaments still aim toward the cursor but retain a soft organic drift.
    if (attractX !== null && attractY !== null) {
      let dx = attractX - this.x;
      let dy = attractY - this.y;
      let distance = sqrt(dx * dx + dy * dy);

      // Ignore the pull once the branch is very close to the cursor, so tips don't jitter in place around it.
      if (distance > 10) {
        let targetAngle = atan2(dy, dx);
        let organicOffset = sin(this.wavePhase * 1.2 + this.generation) * (0.22 + this.generation * 0.05);
        let mousePull = 0.12 + this.generation * 0.02;

        // lerp() here means the turn toward the cursor happens gradually over several frames, not instantly.
        currentAngle = lerp(currentAngle, targetAngle + organicOffset, mousePull);
        this.baseAngle = lerp(this.baseAngle, targetAngle + organicOffset * 0.5, mousePull * 0.75);
      }
    } else {
      // Sound mode (or no attractor): steer gently toward the precomputed radial/inward target instead of the cursor.
      currentAngle = lerp(currentAngle, radialTarget, rootBias * this.tipSensitivity);
      this.baseAngle = lerp(this.baseAngle, radialTarget, rootBias * 0.75);
    }

    // Growth speed scales with global slider and current control intensity (audioLevel or mouse-movement magnitude).
    let maxSpeed = this.speed * growthSpeed * (1 + audioLevel * 0.4);
    this.x += cos(currentAngle) * maxSpeed;
    this.y += sin(currentAngle) * maxSpeed;
    this.distanceTraveled += maxSpeed;

    // Bake this segment into the persistent trail buffer immediately — once drawn here it never needs
    // to be redrawn again (see the trailBuffer note at its declaration). Always stroked in plain white:
    // the buffer stays theme/color-agnostic, and the CURRENT text color is applied on top every frame
    // via tint() where trailBuffer is drawn (redrawCanvas/draw/exportPNG) — that's what lets toggling
    // Invert still recolor the whole accumulated trail live, exactly like before.
    const tctx = trailBuffer.drawingContext;
    tctx.strokeStyle = '#ffffff';
    tctx.lineCap = 'round';
    tctx.lineWidth = this.strokeWeight * TRAIL_SCALE;
    tctx.beginPath();
    tctx.moveTo(this.prevX * TRAIL_SCALE, this.prevY * TRAIL_SCALE);
    tctx.lineTo(this.x * TRAIL_SCALE, this.y * TRAIL_SCALE);
    tctx.stroke();

    // A branch can spawn a child either because it has traveled far enough since its last child
    // (canBranchByDistance) OR by a small random per-frame chance that increases with audioLevel
    // (canBranchByImpulse), so louder/faster input produces noticeably bushier growth.
    let effectiveInterval = this.branchInterval / (1 + audioLevel * 8);
    let branchProgress = this.distanceTraveled - this.lastBranchDistance;
    let canBranchByDistance = branchProgress > effectiveInterval;
    let canBranchByImpulse = random() < (0.0008 + audioLevel * 0.012);
    let shouldBranch = canBranchByDistance || canBranchByImpulse;

    // Create fewer, farther-spaced root branches to feel more dominant and separated.
    // Max generation trimmed from 6 to 5: each generation compounds the total branch population, so
    // one fewer level noticeably slows long-session growth in branch/segment count while still leaving
    // a visibly deep, layered structure.
    if (shouldBranch) {
      if (this.children.length < (this.generation < 2 ? 1 : 2) && this.generation < 5) {
        // Child branches aim close to perpendicular (90°) off the parent's current direction,
        // picking a side (left/right) at random and adding a small organic jitter around that
        // 90° mark — instead of a wide fan starting from 0°, which let children spawn almost
        // parallel to their parent just as often as at an angle. Applied the same way to every
        // generation, including the root branches seeded on the letter contour (generation 0).
        let jitterBase = PI / 12; // ~15° of organic wobble around the perpendicular angle
        let jitter = jitterBase * (0.8 + random(0.6, 1.5));
        let side = random() < 0.5 ? 1 : -1;
        let childAngle = currentAngle + side * (HALF_PI + random(-jitter, jitter));
        let newBranch = new Branch(this.x, this.y, childAngle, currentAngle, this.generation + 1, audioLevel, this.centerX, this.centerY);
        newBranch.strokeWeight = max(1.4, this.strokeWeight * 0.9);
        this.children.push(newBranch);
        branches.push(newBranch);
        this.lastBranchDistance = this.distanceTraveled;
      }
    }

    // Deactivate when branch exits drawing bounds.
    if (this.x < -80 || this.x > width + 80 || this.y < -80 || this.y > height + 80) {
      this.isActive = false;
    }
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
  textColorSwatches = Array.from(document.querySelectorAll('.color-swatch'));
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

  textColorSwatches.forEach((swatch) => {
    swatch.addEventListener('click', () => {
      if (isGrowing) return;
      textColor = swatch.dataset.color || '#ffffff';
      textColorAuto = false;
      textColorSwatches.forEach((button) => button.classList.toggle('active', button === swatch));
      updateLetterBoundary();
      if (!isGrowing) redrawCanvas();
    });
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

function toggleInvertColors() {
  invertColors = !invertColors;
  document.body.classList.toggle('invert-theme', invertColors);
  if (textColorAuto) {
    textColor = invertColors ? '#000000' : '#ffffff';
    textColorSwatches.forEach((button) => button.classList.toggle('active', button.dataset.color === textColor));
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

  // Mouse mode uses a lighter seed count to keep the motion responsive and less crowded.
  let seedLimit = mode === 'mouse' ? 60 : 260;
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
    let newBranch = new Branch(point.x, point.y, radialAngle, null, 0, currentAudioLevel, anchor.x, anchor.y);
    branches.push(newBranch);
  }

  startBtn.disabled = true;
  stopBtn.disabled = false;
  clearBtn.disabled = false;
  setLetterConfigurationLocked(true);
  exportBtn.disabled = false;

  // Activate either the selected audio file or the microphone, depending on what is available.
  if (mode === 'sound') {
    if (soundFile && typeof soundFile.isLoaded === 'function' && soundFile.isLoaded()) {
      try {
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
        if (!fft) {
          fft = new p5.FFT(0.8, 256);
          fft.setInput(audioInput);
        }
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
      const charWidth = exportGraphics.textWidth(char) * scale;
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

    // Sound mode: use the loaded file if present, otherwise fall back to microphone input.
    // currentAudioLevel is the value actually passed into Branch.update(); it amplifies the raw
    // audioLevel (RMS-ish amplitude from p5.sound) with a different multiplier per source, since
    // uploaded files and live mic input tend to read at different average loudness.
    if (mode === 'sound' && micActive && soundFile && typeof soundFile.isLoaded === 'function' && soundFile.isLoaded()) {
      try {
        audioLevel = soundFile.getLevel();
        currentAudioLevel = min(1.0, audioLevel * 6.0);
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
          let spectrum = fft.analyze();
          let energy = spectrum.reduce((a, b) => a + b, 0) / spectrum.length / 255;
          audioLevel = max(audioLevel, energy);
        }
        currentAudioLevel = min(1.0, audioLevel * 2.5);
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
    } else {
      currentAudioLevel = 0;
    }

    // Advance all active branches one simulation step.
    for (let branch of branches) {
      branch.update(attractX, attractY, currentAudioLevel);
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
