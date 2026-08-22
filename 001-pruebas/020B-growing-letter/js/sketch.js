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
let audioInput;
let soundFile;

// Growth simulation data.
let branches = [];
let letterBoundaryPoints = [];
let letterCenters = [];
let letterCenter = { x: 0, y: 0 };
let fontSize = 160;
let drawnSegments = [];
let currentAudioLevel = 0;

// UI element references.
let letterInput, startBtn, stopBtn, clearBtn, exportBtn;
let fontSizeSlider, fontSizeValue;
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
const APP_VERSION = "v2.0";

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
    this.distanceTraveled = 0;
    this.lastBranchDistance = 0;

    // Branching interval shrinks when control intensity increases.
    let baseInterval = random(60, 120);
    this.branchInterval = baseInterval / (1 + audioLevel * 25);
    this.speed = 0.9 + random(0.15, 0.5);

    // Organic wobble to mimic root tips and capillary motion.
    this.waveOscillation = random(0.01, 0.045);
    this.wavePhase = random(TWO_PI);
    this.generation = generation;
    this.isActive = true;
    this.children = [];
    this.curveBias = random(-0.15, 0.15);
    this.tipSensitivity = random(0.8, 1.6);
    this.rootDominance = random(0.8, 1.5);
    this.strokeWeight = 1.2 + random(0.0, 1.2) + this.generation * 0.12;
  }

  update(attractX = null, attractY = null, audioLevel = 0) {
    if (!this.isActive) return;

    // Keep previous position so each update can draw one segment.
    this.prevX = this.x;
    this.prevY = this.y;

    this.wavePhase += 0.04 + this.generation * 0.01;
    let waveInfluence = sin(this.wavePhase) * this.waveOscillation;

    // Only branches created from the interior contour are allowed to grow inward.
    // Boundary seeds keep their natural radial spread, but their target is always shifted toward the center.
    let radialAngle = atan2(this.y - this.centerY, this.x - this.centerX);
    let inwardAngle = atan2(this.centerY - this.y, this.centerX - this.x);
    let radialTarget = (this.generation === 0) ? inwardAngle + this.curveBias : radialAngle + this.curveBias;

    let rootBias = (0.03 + this.generation * 0.01) * this.rootDominance;
    let currentAngle = this.baseAngle + waveInfluence;

    // In mouse mode, branch direction is attracted to the cursor but still keeps its inward radial spread.
    if (attractX !== null && attractY !== null) {
      let dx = attractX - this.x;
      let dy = attractY - this.y;
      let distance = sqrt(dx * dx + dy * dy);

      if (distance > 10) {
        let targetAngle = atan2(dy, dx);
        currentAngle = lerp(currentAngle, targetAngle, 0.01 + this.generation * 0.005);
        this.baseAngle = lerp(this.baseAngle, targetAngle, 0.008 + this.generation * 0.003);
      }
    }

    currentAngle = lerp(currentAngle, radialTarget, rootBias * this.tipSensitivity);
    this.baseAngle = lerp(this.baseAngle, radialTarget, rootBias * 0.75);

    // Growth speed scales with global slider and current control intensity.
    let maxSpeed = this.speed * growthSpeed * (1 + audioLevel * 0.4);
    this.x += cos(currentAngle) * maxSpeed;
    this.y += sin(currentAngle) * maxSpeed;
    this.distanceTraveled += maxSpeed;

    // Persist segment so the frame can be redrawn from history.
    drawnSegments.push({
      x1: this.prevX,
      y1: this.prevY,
      x2: this.x,
      y2: this.y,
      weight: this.strokeWeight
    });

    let effectiveInterval = this.branchInterval / (1 + audioLevel * 8);
    let branchProgress = this.distanceTraveled - this.lastBranchDistance;
    let canBranchByDistance = branchProgress > effectiveInterval;
    let canBranchByImpulse = random() < (0.0008 + audioLevel * 0.012);
    let shouldBranch = canBranchByDistance || canBranchByImpulse;

    // Create fewer, farther-spaced root branches to feel more dominant and separated.
    if (shouldBranch) {
      if (this.children.length < (this.generation < 2 ? 1 : 2) && this.generation < 6) {
        let spreadBase = this.generation === 0 ? PI / 12 : PI / 8;
        let branchSpread = spreadBase * (0.8 + random(0.6, 1.5));
        let childAngle = currentAngle + random(-branchSpread, branchSpread);
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

// ===== Setup and UI wiring =====
// Initializes canvas, captures DOM controls, and wires event handlers.
function setup() {
  const holder = document.getElementById('sketch-holder');
  const rect = holder.getBoundingClientRect();
  
  canvas = createCanvas(rect.width, rect.height);
  canvas.parent('sketch-holder');

  letterInput = document.getElementById('letterInput');
  startBtn = document.getElementById('startBtn');
  stopBtn = document.getElementById('stopBtn');
  clearBtn = document.getElementById('clearBtn');
  exportBtn = document.getElementById('exportBtn');
  fontSizeSlider = document.getElementById('fontSizeSlider');
  fontSizeValue = document.getElementById('fontSizeValue');
  speedSlider = document.getElementById('speedSlider');
  speedValue = document.getElementById('speedValue');
  modeButtons.sound = document.getElementById('modeSound');
  modeButtons.mouse = document.getElementById('modeMouse');
  micIndicator = document.getElementById('micIndicator');
  micStatusText = document.getElementById('micStatusText');
  timestamp = document.getElementById('timestamp');
  exportBtn.disabled = false;

  // Recompute contour and redraw when text changes.
  letterInput.addEventListener('change', () => {
    letters = letterInput.value || 'A';
    updateLetterBoundary();
    if (!isGrowing) redrawCanvas();
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

  startBtn.addEventListener('click', startGrowth);
  stopBtn.addEventListener('click', stopGrowth);
  clearBtn.addEventListener('click', clearGrowth);
  exportBtn.addEventListener('click', exportPNG);

  // Quadratic speed curve provides finer low-end control.
  speedSlider.addEventListener('input', (e) => {
    let sliderValue = parseFloat(e.target.value);
    growthSpeed = sliderValue * sliderValue;
    speedValue.textContent = sliderValue.toFixed(2);
  });

  // Toggle interaction mode to sound.
  modeButtons.sound.addEventListener('click', () => {
    mode = 'sound';
    updateModeButtons();
  });

  // Toggle interaction mode to mouse.
  modeButtons.mouse.addEventListener('click', () => {
    mode = 'mouse';
    updateModeButtons();
  });

  updateModeButtons();
  updateTimestamp();

  if (width > 100 && height > 100) {
    updateLetterBoundary();
  }

  // Keep canvas matched to container dimensions.
  window.addEventListener('resize', () => {
    const rect = holder.getBoundingClientRect();
    resizeCanvas(rect.width, rect.height);
  });
}

// ===== UI helpers =====
// Reflects active mode in the sidebar button styles.
function updateModeButtons() {
  if (mode === 'sound') {
    modeButtons.sound.classList.add('active');
    modeButtons.mouse.classList.remove('active');
  } else {
    modeButtons.mouse.classList.add('active');
    modeButtons.sound.classList.remove('active');
  }
}

// ===== Contour extraction =====
// Displays footer metadata with file last-modified when available.
async function updateTimestamp() {
  try {
    const response = await fetch('js/sketch.js', { method: 'HEAD' });
    const lastModified = response.headers.get('last-modified');
    if (lastModified) {
      const date = new Date(lastModified);
      const formatted = date.toLocaleString('en-US', { 
        year: 'numeric', 
        month: '2-digit', 
        day: '2-digit', 
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit', 
        hour12: false 
      });
      timestamp.textContent = `${APP_VERSION} · eloy segura @ altura x · built ${formatted}`;
    } else {
      timestamp.textContent = `${APP_VERSION} · eloy segura @ altura x · built ${BUILD_TIME}`;
    }
  } catch (e) {
    timestamp.textContent = `${APP_VERSION} · eloy segura @ altura x · built ${BUILD_TIME}`;
  }
}

// ===== Growth lifecycle =====
// Computes the center of each letter so growth can be radial relative to its own glyph.
function getLetterCenters() {
  let centers = [];
  if (!letters || letters.length === 0) {
    return [{ x: width / 2, y: height / 2 }];
  }

  let totalWidth = 0;
  for (let i = 0; i < letters.length; i++) {
    let charWidth = textWidth(letters[i]);
    totalWidth += charWidth + 20;
  }

  let startX = (width - totalWidth) / 2;
  let currentX = startX;

  for (let i = 0; i < letters.length; i++) {
    let char = letters[i];
    let charWidth = textWidth(char);
    centers.push({
      x: currentX + charWidth / 2,
      y: height / 2
    });
    currentX += charWidth + 20;
  }

  return centers;
}

// Rasterizes the current text and extracts edge pixels as growth seeds.
function updateLetterBoundary() {
  if (width <= 100 || height <= 100) return;

  letterCenter.x = width / 2;
  letterCenter.y = height / 2;
  letterCenters = getLetterCenters();

  // Draw text on an offscreen buffer to inspect alpha values.
  let pg = createGraphics(width, height);
  pg.fill(255);
  pg.textAlign(CENTER, CENTER);
  pg.drawingContext.font = "bold " + fontSize + "px Helvetica";

  let totalWidth = 0;
  for (let i = 0; i < letters.length; i++) {
    let charWidth = pg.textWidth(letters[i]);
    totalWidth += charWidth + 20;
  }

  let startX = (width - totalWidth) / 2;
  let currentX = startX;

  for (let i = 0; i < letters.length; i++) {
    let char = letters[i];
    let charWidth = pg.textWidth(char);
    pg.text(char, currentX + charWidth / 2, height / 2);
    currentX += charWidth + 20;
  }

  try {
    // Read pixels with density-aware dimensions to avoid retina offsets.
    let density = pg.pixelDensity();
    let step = max(1, floor(density));
    let sourceWidth = floor(width * density);
    let sourceHeight = floor(height * density);
    let pixels = pg.drawingContext.getImageData(0, 0, sourceWidth, sourceHeight).data;
    letterBoundaryPoints = [];

    // Edge detection: inside pixel with at least one transparent neighbor.
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
function getUniformBoundarySeeds(points, maxSeeds = 260) {
  if (points.length <= maxSeeds) return points.slice();

  // Shuffle first to avoid directional bias from scanline ordering.
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
  branches = [];
  drawnSegments = [];

  // Create one generation-0 branch per selected seed point, using a radial anchor per letter.
  let seedPoints = getUniformBoundarySeeds(letterBoundaryPoints, 260);
  console.log('Starting growth with', seedPoints.length, 'branches');
  for (let i = 0; i < seedPoints.length; i++) {
    let point = seedPoints[i];
    let anchor = letterCenters[0] || letterCenter;

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
  letterInput.disabled = true;
  fontSizeSlider.disabled = true;
  exportBtn.disabled = false;

  // Activate microphone only when sound mode is selected.
  if (mode === 'sound') {
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
      micStatusText.textContent = 'Listening...';
    } catch (e) {
      console.error('Mic error:', e);
      micStatusText.textContent = 'Mic unavailable';
    }
  }
}

// ===== Rendering helpers =====
// Stops growth and restores editable controls.
function stopGrowth() {
  isGrowing = false;
  if (audioInput && micActive) {
    try {
      audioInput.stop();
      micActive = false;
    } catch (e) {
      console.error('Mic stop error:', e);
    }
  }
  micIndicator.classList.remove('active');
  micStatusText.textContent = 'Ready';
  startBtn.disabled = false;
  stopBtn.disabled = true;
  clearBtn.disabled = false;
  letterInput.disabled = false;
  fontSizeSlider.disabled = false;
}

// Clears current growth while keeping the current letter/settings.
function clearGrowth() {
  stopGrowth();
  branches = [];
  drawnSegments = [];
  lastMouseX = null;
  lastMouseY = null;
  redrawCanvas();
}

// Repaints static content from persisted segment history.
function redrawCanvas() {
  background(0);
  stroke(255);
  for (let seg of drawnSegments) {
    strokeWeight(seg.weight || 0.8);
    line(seg.x1, seg.y1, seg.x2, seg.y2);
  }

  fill(255);
  textAlign(CENTER, CENTER);
  drawingContext.font = "bold " + fontSize + "px Helvetica";

  let totalWidth = 0;
  for (let i = 0; i < letters.length; i++) {
    let charWidth = textWidth(letters[i]);
    totalWidth += charWidth + 20;
  }

  let startX = (width - totalWidth) / 2;
  let currentX = startX;

  for (let i = 0; i < letters.length; i++) {
    let char = letters[i];
    let charWidth = textWidth(char);
    text(char, currentX + charWidth / 2, height / 2);
    currentX += charWidth + 20;
  }
}

// ===== Export =====
// Exports a high-resolution snapshot as a PNG download.
function exportPNG() {
  // Render to an offscreen buffer at 2x for cleaner output.
  let scale = 2;
  let exportGraphics = createGraphics(width * scale, height * scale);
  exportGraphics.background(0);
  exportGraphics.stroke(255);
  exportGraphics.strokeWeight(0.8 * scale);
  for (let seg of drawnSegments) {
    exportGraphics.line(seg.x1 * scale, seg.y1 * scale, seg.x2 * scale, seg.y2 * scale);
  }

  exportGraphics.fill(255);
  exportGraphics.textAlign(CENTER, CENTER);
  exportGraphics.drawingContext.font = "bold " + (fontSize * scale) + "px Helvetica";

  let totalWidth = 0;
  for (let i = 0; i < letters.length; i++) {
    let charWidth = exportGraphics.textWidth(letters[i]);
    totalWidth += charWidth + 20 * scale;
  }

  let startX = (width * scale - totalWidth) / 2;
  let currentX = startX;

  for (let i = 0; i < letters.length; i++) {
    let char = letters[i];
    let charWidth = exportGraphics.textWidth(char);
    exportGraphics.text(char, currentX + charWidth / 2, height * scale / 2);
    currentX += charWidth + 20 * scale;
  }

  let now = new Date();
  let dateStr = now.toISOString().split('T')[0];
  let timeStr = now.toTimeString().split(' ')[0].replace(/:/g, '-');
  if (exportGraphics) {
    saveCanvas(exportGraphics.canvas, `growing-letter_${dateStr}_${timeStr}`, 'png');
    exportGraphics.remove();
  }
}

// ===== Main draw loop =====
// p5 draw loop: renders text + segments and advances simulation.
function draw() {
  background(0);

  stroke(255);
  for (let seg of drawnSegments) {
    strokeWeight(seg.weight || 0.8);
    line(seg.x1, seg.y1, seg.x2, seg.y2);
  }

  fill(255);
  textAlign(CENTER, CENTER);
  drawingContext.font = "bold " + fontSize + "px Helvetica";

  let totalWidth = 0;
  for (let i = 0; i < letters.length; i++) {
    let charWidth = textWidth(letters[i]);
    totalWidth += charWidth + 20;
  }

  let startX = (width - totalWidth) / 2;
  let currentX = startX;

  for (let i = 0; i < letters.length; i++) {
    let char = letters[i];
    let charWidth = textWidth(char);
    text(char, currentX + charWidth / 2, height / 2);
    currentX += charWidth + 20;
  }

  if (isGrowing) {
    // Control values are normalized to 0..1 and reused as growth intensity.
    let attractX = null, attractY = null;

    // Sound mode: combine mic level and FFT energy for responsive dynamics.
    if (mode === 'sound' && micActive && audioInput) {
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
      // Mouse mode: cursor position attracts branches; motion drives intensity.
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
    branches = branches.filter(b => b.isActive);
    if (branches.length > 3000) branches = branches.slice(-2000);
  }
}

// ===== Resize handling =====
// Handles p5 resize callback to keep canvas aligned with its container.
function windowResized() {
  const holder = document.getElementById('sketch-holder');
  const rect = holder.getBoundingClientRect();
  resizeCanvas(rect.width, rect.height);
}
