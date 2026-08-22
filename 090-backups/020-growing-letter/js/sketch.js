// Growing Letter - Interactive Sound/Mouse-Driven Organic Typography Growth
// eloy segura @ altura x
// Last updated: 2026-08-20 18:57:23

let canvas;
let letters = "A";
let mode = "sound";
let isGrowing = false;
let growthSpeed = 0.25;
let audioInput;
let soundFile;

let branches = [];
let letterBoundaryPoints = [];
let letterCenter = { x: 0, y: 0 };
let fontSize = 160;
let drawnSegments = [];
let currentAudioLevel = 0;

let letterInput, startBtn, stopBtn, clearBtn, exportBtn;
let fontSizeSlider, fontSizeValue;
let modeButtons = {};
let speedSlider, speedValue;
let micIndicator, micStatusText;
let timestamp;

let audioLevel = 0;
let audioContext;
let fft;
let micActive = false;
let fontSizeTimeout;
let lastMouseX = null;
let lastMouseY = null;
let micReadErrorLogged = false;

const BUILD_TIME = "2026-08-20 18:57:23";

class Branch {
  constructor(x, y, angle, parentAngle = null, generation = 0, audioLevel = 0) {
    this.x = x;
    this.y = y;
    this.prevX = x;
    this.prevY = y;

    if (parentAngle !== null) {
      this.angle = parentAngle + random(-0.25, 0.25);
    } else {
      this.angle = angle;
    }

    this.baseAngle = this.angle;
    this.distanceTraveled = 0;
    this.lastBranchDistance = 0;

    let baseInterval = random(35, 70);
    this.branchInterval = baseInterval / (1 + audioLevel * 25);
    this.speed = 1.0;

    this.waveOscillation = random(0.04, 0.12);
    this.wavePhase = random(TWO_PI);
    this.generation = generation;
    this.isActive = true;
    this.children = [];
  }

  update(attractX = null, attractY = null, audioLevel = 0) {
    if (!this.isActive) return;

    this.prevX = this.x;
    this.prevY = this.y;

    this.wavePhase += 0.12;
    let waveInfluence = sin(this.wavePhase) * this.waveOscillation;
    let currentAngle = this.baseAngle + waveInfluence;

    let radialAngle = atan2(this.y - letterCenter.y, this.x - letterCenter.x);
    let outwardAngle = radialAngle;

    if (attractX !== null && attractY !== null) {
      let dx = attractX - this.x;
      let dy = attractY - this.y;
      let distance = sqrt(dx * dx + dy * dy);

      if (distance > 10) {
        let targetAngle = atan2(dy, dx);
        currentAngle = lerp(currentAngle, targetAngle, 0.03 + this.generation * 0.01);
        this.baseAngle = lerp(this.baseAngle, targetAngle, 0.015 + this.generation * 0.005);
      }
    } else {
      currentAngle = lerp(currentAngle, outwardAngle, 0.10);
      this.baseAngle = lerp(this.baseAngle, outwardAngle, 0.05);
    }

    let maxSpeed = this.speed * growthSpeed * (1 + audioLevel * 0.6);
    this.x += cos(currentAngle) * maxSpeed;
    this.y += sin(currentAngle) * maxSpeed;
    this.distanceTraveled += maxSpeed;

    drawnSegments.push({
      x1: this.prevX,
      y1: this.prevY,
      x2: this.x,
      y2: this.y
    });

    let effectiveInterval = this.branchInterval / (1 + audioLevel * 15);
    let branchProgress = this.distanceTraveled - this.lastBranchDistance;
    let canBranchByDistance = branchProgress > effectiveInterval;
    let canBranchByImpulse = random() < (0.001 + audioLevel * 0.02);
    let shouldBranch = canBranchByDistance || canBranchByImpulse;

    if (shouldBranch) {
      if (this.children.length < 10 && this.generation < 5) {
        let branchSpread = this.generation === 0 ? PI / 5 : PI / 4;
        let childAngle = currentAngle + random(-branchSpread, branchSpread);
        let newBranch = new Branch(this.x, this.y, childAngle, currentAngle, this.generation + 1, audioLevel);
        this.children.push(newBranch);
        branches.push(newBranch);
        this.lastBranchDistance = this.distanceTraveled;
      }
    }

    if (this.x < -50 || this.x > width + 50 || this.y < -50 || this.y > height + 50) {
      this.isActive = false;
    }
  }
}

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

  letterInput.addEventListener('change', () => {
    letters = letterInput.value || 'A';
    updateLetterBoundary();
    if (!isGrowing) redrawCanvas();
  });

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

  speedSlider.addEventListener('input', (e) => {
    let sliderValue = parseFloat(e.target.value);
    growthSpeed = sliderValue * sliderValue;
    speedValue.textContent = sliderValue.toFixed(2);
  });

  modeButtons.sound.addEventListener('click', () => {
    mode = 'sound';
    updateModeButtons();
  });

  modeButtons.mouse.addEventListener('click', () => {
    mode = 'mouse';
    updateModeButtons();
  });

  updateModeButtons();
  updateTimestamp();

  if (width > 100 && height > 100) {
    updateLetterBoundary();
  }

  window.addEventListener('resize', () => {
    const rect = holder.getBoundingClientRect();
    resizeCanvas(rect.width, rect.height);
  });
}

function updateModeButtons() {
  if (mode === 'sound') {
    modeButtons.sound.classList.add('active');
    modeButtons.mouse.classList.remove('active');
  } else {
    modeButtons.mouse.classList.add('active');
    modeButtons.sound.classList.remove('active');
  }
}

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
      timestamp.textContent = `v1.0 · eloy segura @ altura x · built ${formatted}`;
    } else {
      timestamp.textContent = `v1.0 · eloy segura @ altura x · built ${BUILD_TIME}`;
    }
  } catch (e) {
    timestamp.textContent = `v1.0 · eloy segura @ altura x · built ${BUILD_TIME}`;
  }
}

function updateLetterBoundary() {
  if (width <= 100 || height <= 100) return;

  letterCenter.x = width / 2;
  letterCenter.y = height / 2;

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
    let density = pg.pixelDensity();
    let step = max(1, floor(density));
    let sourceWidth = floor(width * density);
    let sourceHeight = floor(height * density);
    let pixels = pg.drawingContext.getImageData(0, 0, sourceWidth, sourceHeight).data;
    letterBoundaryPoints = [];

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

function getUniformBoundarySeeds(points, maxSeeds = 260) {
  if (points.length <= maxSeeds) return points.slice();

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

  let seedPoints = getUniformBoundarySeeds(letterBoundaryPoints, 260);
  console.log('Starting growth with', seedPoints.length, 'branches');
  for (let i = 0; i < seedPoints.length; i++) {
    let point = seedPoints[i];
    let dx = point.x - letterCenter.x;
    let dy = point.y - letterCenter.y;
    let distance = sqrt(dx * dx + dy * dy) || 1;
    let radialAngle = atan2(dy / distance, dx / distance);
    let newBranch = new Branch(point.x, point.y, radialAngle, null, 0, currentAudioLevel);
    branches.push(newBranch);
  }

  startBtn.disabled = true;
  stopBtn.disabled = false;
  clearBtn.disabled = false;
  letterInput.disabled = true;
  fontSizeSlider.disabled = true;
  exportBtn.disabled = false;

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

function clearGrowth() {
  stopGrowth();
  branches = [];
  drawnSegments = [];
  lastMouseX = null;
  lastMouseY = null;
  redrawCanvas();
}

function redrawCanvas() {
  background(0);
  stroke(255);
  strokeWeight(0.8);
  for (let seg of drawnSegments) {
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

function exportPNG() {
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

function draw() {
  background(0);

  stroke(255);
  strokeWeight(0.8);
  for (let seg of drawnSegments) {
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
    let attractX = null, attractY = null;

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

    for (let branch of branches) {
      branch.update(attractX, attractY, currentAudioLevel);
    }

    branches = branches.filter(b => b.isActive);
    if (branches.length > 3000) branches = branches.slice(-2000);
  }
}

function windowResized() {
  const holder = document.getElementById('sketch-holder');
  const rect = holder.getBoundingClientRect();
  resizeCanvas(rect.width, rect.height);
}
