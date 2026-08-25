/*
 * © 2026 Schultzschultz. Created for 'Schultzschultz Creative Coding Masterclass'.
 * For educational use only. All rights reserved.
 * 
 * ----------
 * Export MP4
 * ----------
 * 
 * This file is a demonstration of how to export the canvas as a MP4 file. 
 * 
 * What this file does:
 * - Creates a canvas that resizes with the browser window and maintains a specific aspect ratio.
 * - Displays animated letters that scroll vertically in a loop, with staggered timing for a lively effect.
 * – Typewriter animation with configurable speed and pause duration, including a blinking cursor.
 * - Provides a function to export the animation as a MP4 video.
 * 
 * Note that the encoder used in this implementation is based on the HME (H264 MP4 Encoder) library, 
 * which needs to be included in the project for this code to work. 
 * See index.html for the script tag that imports the HME library.
 * */


// ––– Canvas –––
let canvasFormat = '9x16';             // Canvas Formats ('9x16' | '1x1' | '4x5')
let swapped = false;                   // Whether width and height are swapped (e.g. 9x16 → 16x9)
let canvasMargin = 100;                // Space (px) left around the canvas inside the browser window
const interfaceWidth = 330;            // Width reserved for the control panel (300px + margins)
let backgroundColor = '#000000';

// ––– Text –––
let txt = "----\\\\\\\\\\//////••••schultzschultz•master....class////2026---\\\\\\\\\\\\•••••---.....";
let letters = [];                      // Collection of all Letter objects
let txtMargin = 0.085;                 // Margin around the text (fraction of the canvas dimensions)
let txtSize = 0.2;                     // Font size (fraction of the canvas dimensions)
let lineSpace = 0.015;                 // Extra space between lines (fraction of the canvas dimensions)
let letterSpace = 0;                   // Extra space between letters (fraction of the canvas dimensions)
let letterHeight;                      // Computed pixel height of one letter
let colorCache = [];                   // Saved colors per letter
let colorMode = 'random';              // Color mode ('random' colors or 'bw' (black/white only))
let speedLetters = 120;                // Controls how fast each letter scrolls (higher = faster)
let font;                              // The loaded font object
let letterFrameIndex = 0;              // Global frame counter used to stagger each letter's animation start
let yLimit;                            // The vertical limit for placing letters, based on canvas height and margin

// ––– Typewriter –––
let typewriterActive = true;          // Whether the typewriter animation is active
let cursorX, cursorY;                  // Current position of the typewriter cursor
let speedTyping = 60;                  // Delay between each typed character (in milliseconds)
let nextActionAt = speedTyping * 4;    // Timestamp (ms) when the next typewriter action happens
let pauseDuration = speedTyping * 60;  // How long the typewriter pauses before deleting
let letterIndex = 0;                   // Which character in txt is being typed next
let typewriterState = "writing";       // Current phase ('writing' | 'waiting' | 'deleting')
let cursorOnOff = true;                // Toggles the blinking cursor on/off

// ––– Export Video –––
let recorder;                          // Global MP4Export instance

// ––– Interface –––
let ui;                                // Global Interface instance

// Runs once before the sketch starts
function preload() {
  font = loadFont("assets/Barlow-Bold.ttf");
}

// Runs once when the sketch starts
function setup() {

  // Calculate canvas dimensions based on the selected format and available window space
  let cnv = createCanvas(calcCanvasDimensions()[0], calcCanvasDimensions()[1]);

  // Set the text font for measuring and drawing letters.
  textFont(font);

  // Resets the canvas to its initial state. 
  // Called here in setup() to initialize everything, and also called later whenever the text changes or the canvas is resized.
  resetCanvas();

  // If the typewriter is off, show the full text immediately
  if (!typewriterActive) showAllText();

  // Build and wire up the control panel
  ui = new Interface();
  ui.init();

  // Create the MP4 recorder
  recorder = new MP4Export();
}

// Runs continuously (frame by frame)
function draw() {

  // Clear the frame with a black background.
  background(backgroundColor);

  // Update and draw each letter of letters[].
  for (let l of letters) {
    l.update();
    l.display();
  }

  if (typewriterActive) {
    // Draw the blinking typewriter cursor
    displayCursor();
    // Update the typewriter state machine (typing, waiting, deleting)
    updateTypewriter();
  }

   if (recorder.isRecording == true) {
    recorder.update();
  }
}

// ––––– CANVAS ––––––––––––––––––––––––––––––––––––––––––––––––––

// Keeps the canvas size in sync with the browser window.
function windowResized() {

  // Recalculate canvas dimensions and resize the canvas to fit the new window size while maintaining the aspect ratio.
  resizeCanvas(calcCanvasDimensions()[0], calcCanvasDimensions()[1]);

  // Reset recomputes letterHeight and all layout metrics based on the new canvas size.
  resetCanvas();

  // If the typewriter is off, show the full text immediately
  if (!typewriterActive) showAllText();
}

// Calculates the pixel width and height the canvas should have,
// based on the selected format, swap state, and available window space.
function calcCanvasDimensions() {
  let ratio;
  if (canvasFormat === '1x1') {
    ratio = 1;
  } else if (canvasFormat === '4x5') {
    ratio = swapped ? 5 / 4 : 4 / 5;
  } else {
    ratio = swapped ? 16 / 9 : 9 / 16;
  }

  // Available space in the window, minus the panel and a small margin
  let availW = windowWidth - interfaceWidth - canvasMargin;
  let availH = windowHeight - canvasMargin;

  // Start with full available height, then scale width from ratio
  let h = availH;
  let w = floor(h * ratio);

  // If the canvas would be wider than available, constrain by width instead
  if (w > availW) {
    w = availW;
    h = floor(w / ratio);
  }

  return [floor(w), floor(h)];
}

// Resets the canvas to its initial state and restarts the typewriter from the beginning.
// Called when the text changes, the typewriter is re-enabled, or the canvas is resized.
function resetCanvas() {

  // Compute letter height from current canvas size
  letterHeight = int(min(width, height) * txtSize * 0.8);

  // Start cursor at the top left margin
  cursorX = width * txtMargin;
  cursorY = width * txtMargin;

  // Calculate the vertical limit for letters based on the canvas height and margin
  yLimit = height - width * txtMargin;

  // Clear all existing letters
  letters = [];

  // Reset which character in txt is being typed next
  letterIndex = 0;

  // Reset the global frame index for staggering letter animations
  letterFrameIndex = 0;

  // Start with the "writing" phase of the typewriter
  typewriterState = "writing";

  // Start typing after a short delay
  nextActionAt = speedTyping * 4;
}


// ––––– TEXT ––––––––––––––––––––––––––––––––––––––––––––––––––

// Calculates the position and width of a character, handling line breaks and auto-wrapping.
// Returns the next position (cx, cy) after placing this character, the character width (w), 
// whether this character is a newline or would overflow the canvas height limit.
function calcLetterPosition(l, cx, cy) {
  if (l === '\n') {
    let nextY = cy + letterHeight + min(width, height) * lineSpace;
    return { cx: width * txtMargin, cy: nextY, w: 0, isNewline: true, overflow: nextY + letterHeight > yLimit };
  }
  textSize(min(width, height) * txtSize);
  let w = int(textWidth(l.toUpperCase())) || 1;
  let nextX = cx;
  let nextY = cy;
  if (nextX + w > width - width * txtMargin) {
    nextX = width * txtMargin;
    nextY += letterHeight + min(width, height) * lineSpace;
  }
  return { cx: nextX, cy: nextY, w, isNewline: false, overflow: nextY + letterHeight > yLimit };
}

// Updates letter positions and sizes in-place after a layout change (e.g. text size slider).
// Preserves each letter's color and animation phase — only geometry is recalculated.
function repositionLetters() {

  // Recalculate letterHeight in case the text size or canvas size changed
  letterHeight = int(min(width, height) * txtSize * 0.8);

  // Start from the top left margin
  let cx = width * txtMargin;
  let cy = width * txtMargin;

  // index into letters[] — separate from i because newlines have no letter entry
  let li = 0;

  // Walk through txt, updating each existing letter's geometry in-place.
  for (let i = 0; i < txt.length && li < letters.length; i++) {

    // Calculate the new position for this character based on the current layout settings
    let pos = calcLetterPosition(txt.charAt(i), cx, cy);

    // Update cx and cy to the new position for this character
    cx = pos.cx;
    cy = pos.cy;

    // If this character would overflow the canvas height limit, move it far below the canvas so it's effectively hidden.
    if (pos.overflow) { cy = height + 1000; }
    if (pos.isNewline) continue;

    // Reuse the existing letter object — only update its geometry
    letters[li].updateGeometry(cx, cy);

    // Move cx to the position for the next character, based on this character's width and the letter spacing
    cx += pos.w + min(width, height) * letterSpace;

    // Move to the next letter in letters[]
    li++;
  }

  // Update the global cursor position so new letters appear in the right place.
  if (typewriterActive) {
    cursorX = cx;
    cursorY = cy;
  }
}

// Syncs letters[] to the current txt string without recreating unchanged letters.
// Preserves colors and animation for letters that haven't changed.
function syncText() {

  // Build a flat list of visible characters (no newlines) from the new txt
  let newChars = [];
  for (let i = 0; i < txt.length; i++) {
    let c = txt.charAt(i);
    if (c !== '\n') newChars.push(c.toUpperCase());
  }

  // Find how many letters from the start are still the same (the "keep" prefix)
  // Remove everything after the last matching letter
  let keep = 0;
  while (keep < letters.length && keep < newChars.length &&
    letters[keep].l === newChars[keep]) {
    keep++;
  }
  letters.splice(keep);

  // Continue assigning myFrame from where the last kept letter left off
  letterFrameIndex = letters.length > 0 ? letters[letters.length - 1].myFrame + 10 : 0;

  // Start from the top left margin for the new layout
  let cx = width * txtMargin;
  let cy = width * txtMargin;

  // index into letters[] — separate from i because newlines have no letter entry
  let li = 0;

  // Walk through txt, updating kept letters' geometry or creating new ones
  for (let i = 0; i < txt.length; i++) {

    // Calculate the new position for this character based on the current layout settings
    let pos = calcLetterPosition(txt.charAt(i), cx, cy);

    // Update cx and cy to the new position for this character
    cx = pos.cx;
    cy = pos.cy;

    // If this character would overflow the canvas height limit, move it far below the canvas so it's effectively hidden.
    if (pos.overflow) { cy = height + 1000; }
    if (pos.isNewline) continue;

    if (li < letters.length) {
      // Reuse the existing letter object — only update its geometry
      letters[li].updateGeometry(cx, cy);
    } else {
      // Create a new letter object for this character
      let idx = letters.length;
      let newLetter = new Letter(txt.charAt(i), cx, cy, colorCache[idx]);
      letters.push(newLetter);
      // Cache the color for this letter index if it's not already cached
      if (colorCache[idx] === undefined) colorCache[idx] = newLetter.c;
    }

    // Move cx to the position for the next character, based on this character's width and the letter spacing
    cx += pos.w + min(width, height) * letterSpace;

    // Move to the next letter in letters[]
    li++;
  }

  // Update the global cursor position so new letters appear in the right place.
  cursorX = cx;
  cursorY = cy;

  // Update letterIndex so the typewriter continues from the right place if it's active.
  letterIndex = txt.length;
}


// Clears all existing letters and creates new ones for the entire txt string, 
// placing them according to the current layout settings.
function showAllText() {

  // Clear all existing letters
  letters = [];
  letterFrameIndex = 0;

  // Start from the top left margin
  let cx = width * txtMargin;
  let cy = width * txtMargin;

  // Walk through txt, creating a letter object for each character and placing it in the correct position.
  for (let i = 0; i < txt.length; i++) {

    // Calculate the new position for this character based on the current layout settings
    let pos = calcLetterPosition(txt.charAt(i), cx, cy);

    // Update cx and cy to the new position for this character
    cx = pos.cx;
    cy = pos.cy;

    // If this character would overflow the canvas height limit, move it far below the canvas so it's effectively hidden.
    if (pos.overflow) { cy = height + 1000; }
    if (pos.isNewline) continue;

    // Create a new letter object for this character
    let idx = letters.length;
    let newLetter = new Letter(txt.charAt(i), cx, cy, colorCache[idx]);
    letters.push(newLetter);

    // Re-anchor all myFrame values into the past so none is ahead of frameCount.
    newLetter.myFrame = frameCount - i * 7;

    // Cache the color for this letter index if it's not already cached
    if (colorCache[idx] === undefined) colorCache[idx] = newLetter.c;

    // Move cx to the position for the next character, based on this character's width and the letter spacing
    cx += newLetter.w + min(width, height) * letterSpace;
  }

  // Next letter created after this call continues the stagger
  letterFrameIndex = frameCount + 7;

  // Update letterIndex so the typewriter continues from the right place if it's active.
  letterIndex = txt.length;
}

// Assigns new random colors to all visible letters and updates colorCache.
function updateLetterColors() {
  colorCache = [];
  for (let i = 0; i < letters.length; i++) {
    letters[i].c = getRandomColor(0, 255);
    colorCache[i] = letters[i].c;
  }
}

// Returns a random color that is visually distinct from the background.
// In 'bw' mode, always returns black or white depending on background brightness.
function getRandomColor(minVal, maxVal) {

  // Precompute the opposite color based on background brightness
  let oppositeColor = brightness(backgroundColor) > 50 ? color(0) : color(255);

  // In 'bw' mode, skip random generation and return the opposite color for maximum contrast
  if (colorMode === 'bw') {
    return oppositeColor;
  }

  // Minimum color distance from background
  let minDistance = 100;

  // Keep generating random colors until we find one that is sufficiently different from the background.
  let c;
  do {
    c = color(random(minVal, maxVal), random(minVal, maxVal), random(minVal, maxVal));
  } while (colorDistance(c, backgroundColor) < minDistance);

  // 5% chance to force pure white/black — creates occasional bright highlights
  if (random(1) > 0.95) c = oppositeColor;

  return c;
}

// Returns the distance between two colors in RGB space.
function colorDistance(c1, c2) {
  let rDiff = red(c1) - red(c2);
  let gDiff = green(c1) - green(c2);
  let bDiff = blue(c1) - blue(c2);
  return sqrt(rDiff * rDiff + gDiff * gDiff + bDiff * bDiff);
}


// ––––– Typewriter ––––––––––––––––––––––––––––––––––––––––––––––––––

// Draws the blinking text cursor at the current cursor position.
function displayCursor() {

  // Toggle the cursor on/off every 30 frames to create a blinking effect.
  if (frameCount % 30 === 0) {
    cursorOnOff = !cursorOnOff;
  }

  // Skip drawing the cursor when it's toggled off
  if (!cursorOnOff) return;

  // Draw a simple vertical rectangle as the cursor, slightly taller than the letter height
  push();
  fill(255);
  noStroke();
  rect(cursorX, cursorY - 10, letterHeight * 0.1, letterHeight * 1.2);
  pop();
}

// Drives the typewriter state machine.
// States: "writing" types one letter, "waiting" pauses, "deleting" removes one letter.
function updateTypewriter() {
  // Check if it's time for the next typewriter action based on the current state and timing.
  if (millis() > nextActionAt) {
    if (typewriterState === "writing") {
      if (letterIndex < txt.length) {
        // Type the next character
        addLetter();
      } else {
        // All characters typed. Change state to pause before deleting
        typewriterState = "waiting";
        nextActionAt = millis() + pauseDuration;
      }
    } else if (typewriterState === "waiting") {
      if (letters.length > 0) {
        // Start erasing
        typewriterState = "deleting";
      } else {
        // Start typing again from the beginning
        typewriterState = "writing";
        letterIndex = 0;
        if (recorder.isRecording) {
          recorder.stop();
        }
      }
    } else if (typewriterState === "deleting" && speedTyping > 0) {
      // Erase the last letter
      removeLetter();
      if (letters.length == 0) {
        // All letters deleted. Change state to pause before typing again
        typewriterState = "waiting";
        nextActionAt = millis() + pauseDuration;
        
      }
    }
  }
}

// Adds one character from txt to the canvas at the current cursor position.
// Handles line breaks, auto-wrapping, and the canvas height limit.
function addLetter() {

  // Get the next character to type based on letterIndex, and calculate its position.
  let ch = txt.charAt(letterIndex);

  // Calculate the new position for this character based on the current layout settings
  let pos = calcLetterPosition(ch, cursorX, cursorY);

  // Canvas is full. Stop typing and wait before deleting
  if (pos.overflow) {
    if (typewriterActive) {
      typewriterState = "waiting";
      nextActionAt = millis() + pauseDuration;
    }
    letterIndex++;
    return;
  }

  // Update cursor position to the new position for this character
  cursorX = pos.cx;
  cursorY = pos.cy;

  if (pos.isNewline) {
    // For a newline, just move the cursor and schedule the next typewriter action without creating a letter.
    nextActionAt = millis() + speedTyping + int(random(-speedTyping * 1.2, speedTyping * 1.8));
  } else {

    // Create a new letter object for this character
    let idx = letters.length;
    let newLetter = new Letter(ch, cursorX, cursorY, colorCache[idx]);
    letters.push(newLetter);

    // Cache the color for this letter index if it's not already cached
    if (colorCache[idx] === undefined) colorCache[idx] = newLetter.c;

    // Move cx to the position for the next character, based on this character's width and the letter spacing
    cursorX += newLetter.w + min(width, height) * letterSpace;

    // Schedule the next typewriter action with a random delay around speedTyping, so the typing speed feels more natural and less robotic.
    nextActionAt = millis() + speedTyping + int(random(-speedTyping * 0.8, speedTyping * 1.2));
  }

  // Move to the next character in txt for the next typewriter action
  letterIndex++;
}

// Removes the last letter from the letters array and moves the cursor back.
function removeLetter() {

  if (letters.length > 0) {

    // Remove the last letter
    letters.splice(letters.length - 1, 1);

    if (letters.length > 0) {
      // Move cursor to the right edge of the now-last letter
      cursorX = letters[letters.length - 1].x + letters[letters.length - 1].w + min(width, height) * letterSpace;
      cursorY = letters[letters.length - 1].y;
    } else {
      // All letters gone — return cursor to the starting position
      cursorX = width * txtMargin;
      cursorY = width * txtMargin;
    }

  }

  // Schedule the next typewriter action with a random delay around speedTyping, so the deleting speed feels more natural and less robotic.
  nextActionAt = millis() + speedTyping + int(random(-speedTyping * 0.9, -speedTyping * 0.5));
}


// ––––– LETTER CLASS ––––––––––––––––––––––––––––––––––––––––––––––––––

// The Letter class represents a single character on the canvas, along with its animation state and graphics buffer.
class Letter {

  constructor(_l, _x, _y, _cachedColor = undefined) {

    // Store the character as uppercase
    this.l = String(_l).toUpperCase();

    // Calculate geometry and create the graphics buffer
    this.updateGeometry(_x, _y);

    // Stagger the animation so letters don't all move in sync
    this.myFrame = letterFrameIndex;
    letterFrameIndex += 7;

    // Background color for this tile
    this.bg = color(backgroundColor);

    // Use cached color to keep colors stable across changes or pick a new random color if no cache is provided.
    this.c = (_cachedColor !== undefined) ? _cachedColor : getRandomColor(0, 255);
  }

  // Recalculates geometry and graphics buffer based on current font size and canvas dimensions.
  updateGeometry(_x, _y) {

    // Position on the canvas
    this.x = _x;
    this.y = _y;

      // How many frames this letter takes to scroll (controls animation speed)
    this.moveDuration = max(1, int(random(1, 4)) * (310 - speedLetters));

    // Measure the pixel width of this character using the current font and size
    textSize(min(width, height) * txtSize);
    this.w = max(1, int(textWidth(this.l))); // At least 1px wide
    this.h = max(1, int(letterHeight));       // At least 1px tall

    // Vertical offset so the letter starts slightly below the tile bottom
    this.yOffset = int(this.h * 0.2);

    // Off-screen graphics buffer — we draw the letter here, then paste it onto the canvas
    this.pg = createGraphics(this.w, this.h);

    // Scroll animation: letter moves from start (below tile) to end (above tile)
    this.start = createVector(0, this.h - this.yOffset);
    this.end = createVector(0, -this.yOffset);
  }

  // Redraws this letter into its off-screen graphics buffer.
  update() {

    // Safety guard against zero-size tiles 
    if (this.w < 1 || this.h < 1) return;

    // Calculate scroll progress
    // Apply easing for smoother motion
    let elapsed = ((frameCount - this.myFrame) % this.moveDuration + this.moveDuration) % this.moveDuration;
    let t = map(elapsed, 0, this.moveDuration, 0, 1.0);
    let easeT = this.easeInOutQuint(t);

    // Current draw position within the tile
    let txtX = lerp(this.start.x, this.end.x, easeT);
    let txtY = lerp(this.start.y, this.end.y, easeT);

    // Fill the tile with background color, then draw the letter on top
    this.pg.background(this.bg);
    this.pg.fill(this.c);
    this.pg.textFont(font);
    this.pg.textSize(min(width, height) * txtSize);
    this.pg.textAlign(CENTER, CENTER);

    // Draw the letter multiple times at different vertical offsets — creates the looping scroll effect
    for (let py = -3; py <= 3; py++) {
      this.pg.text(this.l, txtX + this.w / 2, txtY + this.h * py - this.h / 2);
    }
  }

  // Pastes the pre-rendered graphics buffer onto the main canvas at this letter's position.
  display() {
    image(this.pg, this.x, this.y);
  }

  // Easing function: starts slow, accelerates, then slows down again.
  easeInOutQuint(t) {
    return t < 0.5 ? 16 * t * t * t * t * t : 1 + 16 * (--t) * t * t * t * t;
  }
}