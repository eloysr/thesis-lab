/*
 * © 2026 Schultzschultz. Created for 'Schultzschultz Creative Coding Masterclass'.
 * For educational use only. All rights reserved.
 * 
 * ------------------------------------------------
 * Opentype.js – Font parsing and rendering library 
 * ------------------------------------------------
 * 
 * This file is a demonstration of using the opentype.js library to load a font, 
 * extract glyph data, and create an interactive visualization where the user 
 * can push and pull on the letterforms with the mouse.
 *
 * What this file does:
 * - Loads a font file and extracts glyph data using opentype.js.
 * - Displays the text on the canvas, with each letter represented as a Glyph object. 
 * - Implements a ForceField that repels glyph points away from the mouse cursor, 
 *   creating a distortion effect.
 * - Allows the user to resize the force field with the mouse wheel and see a visual 
 *   representation of it by holding the Space key.
 * - Handles window resizing to keep the text centered and properly scaled.
 * 
 * Note: Make sure to load the Opentype.js library in your HTML file.
 * 
 * For more information on opentype.js, see: https://opentype.js.org
 */


let backgroundColor = '#000000'; 
let txtColor = '#ffffff';
let txt = 'R';                 // Text to display (use \n for multiple lines, e.g. 'HEL\nLO')
let activeFont;                    // The loaded Font object
let lines = [];                    // 2D array of Glyph objects: lines[lineIndex][glyphIndex]

const fontSize = 350;              // Desired font size in canvas pixels
const maxPushFactor = 0.5;         // How far points can be pushed (as a fraction of cap height)
const lineHeightFactor = 1.0;      // Line spacing multiplier (1.0 = normal)

let scale;       // Converts font units to canvas pixels (fontSize/unitsPerEm)
let baselineY;   // Y position of the first baseline on the canvas
let lineHeight;  // Vertical distance between consecutive baselines in pixels

let forceField;  // The interactive ForceField that repels glyph points
let maxPush;     // Maximum displacement a point can be pushed, in pixels


// Runs once when the sketch starts
// (async function because we need to load the font data before we can create a Font object)
async function setup() {

  // Default full-window canvas.
  createCanvas(windowWidth, windowHeight);

  // Load the font file and wrap it in our Font class
  let data = await opentype.load('assets/strokeWeight-180.otf');
  activeFont = new Font(data);

  // Calculate how many pixels correspond to one font unit at our target fontSize
  scale = fontSize / activeFont.data.unitsPerEm;
  lineHeight = fontSize * lineHeightFactor;

  // Maximum push = a fraction of the capital letter height (in canvas pixels)
  maxPush = activeFont.capHeight * scale * maxPushFactor;

  // Split the text into rows and vertically center the block on the canvas
  const textRows = txt.split('\n');
  const totalTextHeight = ((textRows.length - 2) * activeFont.capHeight * scale);
  baselineY = height / 2 - totalTextHeight / 2;

  // Create a Glyph object for every character in every line
  for (let row of textRows) {
    let glyphs = [];
    for (let char of row.split('')) {
      glyphs.push(new Glyph(char, activeFont));
    }
    lines.push(glyphs);
  }

  // Start the force field at half the shorter canvas dimension
  forceField = new ForceField(min(width, height) * 0.5);

  // Calculate the initial canvas position for every glyph anchor and control point
  setGlyphPositions();
}

// Runs continuously (frame by frame)
function draw() {

  // Move the force field center to the current mouse position
  forceField.update(createVector(mouseX, mouseY));

  // Clear the frame with a black background.
  background(backgroundColor);

  // Hold Space to see the force field visualization
  if (keyIsDown(32)) forceField.display();

  // Safety check: skip if glyphs haven't been created yet
  if (lines.length === 0) return;

  // Apply push-away physics to every glyph point this frame
  for (let line of lines) {
    for (let glyph of line) {
      glyph.update(forceField, maxPush);
    }
  }

  // Hold Space = outline/debug view; otherwise draw filled white glyphs
  if (keyIsDown(32)) {
    displayGlyphs(true);
  } else {
    fill(txtColor);
    noStroke();
    displayGlyphs(false);
  }
}

// Draws all glyphs line by line, horizontally centered on the canvas.
// outline: pass true to draw the debug/wireframe view, false for filled shapes.
function displayGlyphs(outline = false) {
  for (let li = 0; li < lines.length; li++) {
    // Y coordinate of the baseline for this line
    const lineBaselineY = baselineY + li * lineHeight;
    // Start X so the entire line is centered horizontally
    let cursorX = width / 2 - totalWidth(lines[li], scale) / 2;
    for (let g of lines[li]) {
      if (outline) {
        g.drawOutline(cursorX, lineBaselineY, scale);
      } else {
        g.draw(cursorX, lineBaselineY, scale);
      }
      // Advance the cursor by this glyph's advance width (in canvas pixels)
      cursorX += g.advanceWidth * scale;
    }
  }
}

// Recalculates the canvas position of every anchor and control point for all glyphs.
// Call this after anything that changes the layout (window resize, font load, etc.).
function setGlyphPositions() {
  for (let li = 0; li < lines.length; li++) {
    const lineBaselineY = baselineY + li * lineHeight;
    let cursorX = width / 2 - totalWidth(lines[li], scale) / 2;
    for (let g of lines[li]) {
      g.setPositions(cursorX, lineBaselineY, scale);
      cursorX += g.advanceWidth * scale;
    }
  }
}

// Returns the total rendered width of a row of glyphs in canvas pixels.
// Used to center each line horizontally on the canvas.
function totalWidth(glyphs, scale) {
  return glyphs.reduce((sum, g) => sum + g.advanceWidth * scale, 0);
}

// Called automatically by p5.js when the user scrolls the mouse wheel.
// event.delta is positive when scrolling down, negative when scrolling up.
function mouseWheel(event) {
  forceField.resize(event.delta * -1);
  return false; // Prevent the browser from also scrolling the page
}

// Called automatically by p5.js when the browser window is resized.
// Resizes the canvas and recalculates all glyph positions for the new dimensions.
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  setGlyphPositions();
}
