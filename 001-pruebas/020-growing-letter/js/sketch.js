// Growing Letter - Interactive Sound/Mouse-Driven Organic Typography Growth
// eloy segura @ altura x

let canvas;
let letters = "A";
let mode = "sound";
let isGrowing = false;
let growthSpeed = 0.25;
let audioInput;
let soundFile;

// Growth system
let branches = [];
let letterBoundaryPoints = [];
let internalBoundaryPoints = [];
let letterCenter = { x: 0, y: 0 };
let fontSize = 160;
let drawnSegments = [];
let currentAudioLevel = 0;
let isUpdatingBoundary = false;

// UI Elements
let letterInput, startBtn, stopBtn, clearBtn, exportBtn;
let fontSizeSlider, fontSizeValue;
let modeButtons = {};
let speedSlider, speedValue;
let micIndicator, micStatusText;
let timestamp;

// Audio variables
let audioLevel = 0;
let audioContext;
let fft;
let micActive = false;

class Branch {
  constructor(x, y, angle, parentAngle = null, generation = 0, audioLevel = 0, isInternal = false) {
    this.x = x;
    this.y = y;
    this.prevX = x;
    this.prevY = y;
    this.audioLevel = audioLevel;
    this.isInternal = isInternal;
    
    if (parentAngle !== null) {
      this.angle = parentAngle + random(-0.3, 0.3);
    } else {
      this.angle = angle;
    }
    
    this.baseAngle = this.angle;
    this.distanceTraveled = 0;
    this.lastBranchDistance = 0;
    
    let baseInterval = random(30, 60);
    this.branchInterval = baseInterval / (1 + audioLevel * 25);
    
    if (isInternal) {
      this.branchInterval *= 10;
    }
    
    this.speed = isInternal ? 0.1 : 1.0;
    
    this.waveOscillation = random(0.05, 0.12);
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

    if (attractX !== null && attractY !== null) {
      let dx = attractX - this.x;
      let dy = attractY - this.y;
      let distance = sqrt(dx * dx + dy * dy);
      
      if (distance > 10) {
        let targetAngle = atan2(dy, dx);
        currentAngle = lerp(currentAngle, targetAngle, 0.03);
        this.baseAngle = lerp(this.baseAngle, targetAngle, 0.01);
      }
    }

    let maxSpeed = this.speed * growthSpeed;
    this.x += cos(currentAngle) * maxSpeed;
    this.y += sin(currentAngle) * maxSpeed;
    this.distanceTraveled += maxSpeed;

    drawnSegments.push({
      x1: this.prevX,
      y1: this.prevY,
      x2: this.x,
      y2: this.y,
      opacity: 255
    });

    let effectiveInterval = this.branchInterval / (1 + audioLevel * 15);
    
    if (this.distanceTraveled - this.lastBranchDistance > effectiveInterval) {
      if (this.children.length < 12 && this.generation < 5) {
        let childAngle = currentAngle + random(-PI / 2, PI / 2);
        let newBranch = new Branch(this.x, this.y, childAngle, currentAngle, this.generation + 1, audioLevel, this.isInternal);
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
  const audioFile = document.getElementById('audioFile');
  timestamp = document.getElementById('timestamp');

  letterInput.addEventListener('change', () => {
    letters = letterInput.value || 'A';
    updateLetterBoundary();
    if (!isGrowing) redrawCanvas();
  });

  fontSizeSlider.addEventListener('input', (e) => {
    fontSize = parseInt(e.target.value);
    fontSizeValue.textContent = fontSize;
    updateLetterBoundary();
    if (!isGrowing) redrawCanvas();
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

  audioFile.addEventListener('change', (e) => {
    if (e.target.files[0]) {
      stopGrowth();
      let file = e.target.files[0];
      let url = URL.createObjectURL(file);
      soundFile = createAudio();
      soundFile.src = url;
      micStatusText.textContent = 'File loaded';
    }
  });

  updateModeButtons();
  updateTimestamp();
  setInterval(updateTimestamp, 1000);

  if (width > 100 && height > 100) {
    updateLetterBoundary();
  }

  window.addEventListener('resize', () => {
    const rect = holder.getBoundingClientRect();
    resizeCanvas(rect.width, rect.height);
    if (width > 100 && height > 100) {
      updateLetterBoundary();
      if (!isGrowing) redrawCanvas();
    }
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

function updateTimestamp() {
  const now = new Date();
  const dateStr = now.toLocaleDateString('es-ES');
  const timeStr = now.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
  timestamp.textContent = `v1.0 · eloy segura @ altura x · ${dateStr} ${timeStr}`;
}

function updateLetterBoundary() {
  if (isUpdatingBoundary) return;
  if (width <= 100 || height <= 100) return;
  
  isUpdatingBoundary = true;

  try {
    let tempG = createGraphics(width, height);
    tempG.fill(255);
    tempG.textAlign(CENTER, CENTER);
    tempG.drawingContext.font = "bold " + fontSize + "px Helvetica";

    let totalWidth = 0;
    for (let i = 0; i < letters.length; i++) {
      let charWidth = tempG.textWidth(letters[i]);
      totalWidth += charWidth + 20;
    }

    let startX = (width - totalWidth) / 2;
    let currentX = startX;

    for (let i = 0; i < letters.length; i++) {
      let char = letters[i];
      let charWidth = tempG.textWidth(char);
      tempG.text(char, currentX + charWidth / 2, height / 2);
      currentX += charWidth + 20;
    }

    letterCenter.x = width / 2;
    letterCenter.y = height / 2;

    // Use canvas directly instead of creating large array
    let ctx = tempG.drawingContext;
    let imgData = ctx.getImageData(0, 0, width, height);
    let data = imgData.data;

    letterBoundaryPoints = [];
    internalBoundaryPoints = [];
    
    // Scan for edges directly without intermediate array
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        let idx = (y * width + x) * 4 + 3; // Alpha channel
        let currAlpha = data[idx] > 50;
        
        // Check if edge
        let upAlpha = data[((y - 1) * width + x) * 4 + 3] > 50;
        let downAlpha = data[((y + 1) * width + x) * 4 + 3] > 50;
        let leftAlpha = data[(y * width + (x - 1)) * 4 + 3] > 50;
        let rightAlpha = data[(y * width + (x + 1)) * 4 + 3] > 50;
        
        if (currAlpha && (!upAlpha || !downAlpha || !leftAlpha || !rightAlpha)) {
          // Count non-letter neighbors
          let nonLetterNeighbors = 0;
          for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
              if (dx === 0 && dy === 0) continue;
              let nidx = ((y + dy) * width + (x + dx)) * 4 + 3;
              if (data[nidx] <= 50) nonLetterNeighbors++;
            }
          }
          
          if (nonLetterNeighbors >= 1) {
            if (nonLetterNeighbors >= 5) {
              letterBoundaryPoints.push({ x, y });
            } else {
              internalBoundaryPoints.push({ x, y });
            }
          }
        }
      }
    }

    tempG.remove();
    console.log('✓ Letter boundary updated:', letterBoundaryPoints.length, 'external +', internalBoundaryPoints.length, 'internal');
  } catch (e) {
    console.error('Error in updateLetterBoundary:', e);
  } finally {
    isUpdatingBoundary = false;
  }
}

async function startGrowth() {
  // Ensure boundary is up-to-date
  updateLetterBoundary();
  
  if (letterBoundaryPoints.length === 0 && internalBoundaryPoints.length === 0) {
    console.warn('No boundary points found. Letter may be too small or invisible.');
    micStatusText.textContent = 'No contour detected';
    return;
  }

  console.log('Starting growth with', letterBoundaryPoints.length + internalBoundaryPoints.length, 'branches');
  
  isGrowing = true;
  branches = [];
  drawnSegments = [];

  let externalSampleRate = max(2, floor(letterBoundaryPoints.length / 600));
  for (let i = 0; i < letterBoundaryPoints.length; i += externalSampleRate) {
    let point = letterBoundaryPoints[i];
    let radialAngle = atan2(point.y - letterCenter.y, point.x - letterCenter.x);
    let newBranch = new Branch(point.x, point.y, radialAngle, null, 0, currentAudioLevel, false);
    branches.push(newBranch);
  }

  let internalSampleRate = max(2, floor(internalBoundaryPoints.length / 600));
  for (let i = 0; i < internalBoundaryPoints.length; i += internalSampleRate) {
    let point = internalBoundaryPoints[i];
    let radialAngle = atan2(point.y - letterCenter.y, point.x - letterCenter.x);
    let newBranch = new Branch(point.x, point.y, radialAngle, null, 0, currentAudioLevel, true);
    branches.push(newBranch);
  }

  startBtn.disabled = true;
  stopBtn.disabled = false;
  clearBtn.disabled = false;
  letterInput.disabled = true;
  fontSizeSlider.disabled = true;
  speedSlider.disabled = false;

  if (mode === 'sound') {
    try {
      micStatusText.textContent = 'Requesting mic...';
      
      if (!audioInput) {
        audioInput = new p5.AudioIn();
      }
      
      if (!fft) {
        fft = new p5.FFT(0.8, 256);
        fft.setInput(audioInput);
      }
      
      audioInput.start();
      micActive = true;
      
      micIndicator.classList.add('active');
      micStatusText.textContent = 'Listening...';
    } catch (e) {
      console.error('Microphone error:', e);
      micStatusText.textContent = 'Mic error';
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
      console.error('Stop error:', e);
    }
  }

  micIndicator.classList.remove('active');
  micStatusText.textContent = 'Ready';

  startBtn.disabled = false;
  stopBtn.disabled = true;
  clearBtn.disabled = false;
  letterInput.disabled = false;
  fontSizeSlider.disabled = false;
  exportBtn.disabled = false;
}

function clearGrowth() {
  stopGrowth();
  branches = [];
  drawnSegments = [];
  exportBtn.disabled = true;
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
  let exportWidth = width * scale;
  let exportHeight = height * scale;

  let exportGraphics = createGraphics(exportWidth, exportHeight);
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

  let startX = (exportWidth - totalWidth) / 2;
  let currentX = startX;

  for (let i = 0; i < letters.length; i++) {
    let char = letters[i];
    let charWidth = exportGraphics.textWidth(char);
    exportGraphics.text(char, currentX + charWidth / 2, exportHeight / 2);
    currentX += charWidth + 20 * scale;
  }

  let now = new Date();
  let dateStr = now.toISOString().split('T')[0];
  let timeStr = now.toTimeString().split(' ')[0].replace(/:/g, '-');
  let filename = `growing-letter_${dateStr}_${timeStr}.png`;

  exportGraphics.save(filename);
  exportGraphics.remove();
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
    let attractX = null;
    let attractY = null;

    if (mode === 'sound') {
      if (micActive && audioInput) {
        try {
          audioLevel = audioInput.getLevel();
          currentAudioLevel = audioLevel;
          
          if (fft) {
            let spectrum = fft.analyze();
            let energy = 0;
            for (let i = 0; i < spectrum.length; i++) {
              energy += spectrum[i];
            }
            energy = energy / spectrum.length / 255;
            audioLevel = max(audioLevel, energy);
            currentAudioLevel = audioLevel;
          }
          
          currentAudioLevel = min(1.0, audioLevel * 2.5);
          
          if (audioLevel > 0.008) {
            let percentage = min(100, (audioLevel * 100).toFixed(0));
            micStatusText.textContent = 'Listening: ' + percentage + '%';
          }
        } catch (e) {
          console.error('Audio error:', e);
        }
      }
    } else if (mode === 'mouse') {
      attractX = mouseX;
      attractY = mouseY;
      currentAudioLevel = 0;
    }

    for (let i = branches.length - 1; i >= 0; i--) {
      branches[i].update(attractX, attractY, currentAudioLevel);
    }

    branches = branches.filter(b => 
      !(b.x < -100 && b.y < -100 && b.x > width + 100 && b.y > height + 100)
    );

    if (branches.length > 3000) {
      branches = branches.slice(-2000);
    }
  }
}

function windowResized() {
  const holder = document.getElementById('sketch-holder');
  const rect = holder.getBoundingClientRect();
  resizeCanvas(rect.width, rect.height);
}
