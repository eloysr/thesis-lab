/*
 * © 2026 Schultzschultz. Created for 'Schultzschultz Creative Coding Masterclass'.
 * For educational use only. All rights reserved.
 *
 * -----------------
 * Font Export
 * -----------------
 *
 * This sketch creates a minimal OpenType font from a fixed character set.
 * Press X to export a font where each glyph is a randomly sized rectangle.
 *
 * What this file does:
 * - Creates one opentype.Glyph per character in the exported character set.
 * - Builds each glyph path as a randomly sized rectangle.
 * - Combines the glyphs into an opentype.Font with basic font metrics.
 * - Downloads the generated font as an OTF file when X is pressed.
 */

const charset = [
  ...new Set([
    "a",
    "b",
    "c",
    "d",
    "e",
    "f",
    "g",
    "h",
    "i",
    "j",
    "k",
    "l",
    "m",
    "n",
    "o",
    "p",
    "q",
    "r",
    "s",
    "t",
    "u",
    "v",
    "w",
    "x",
    "y",
    "z",
    "A",
    "B",
    "C",
    "D",
    "E",
    "F",
    "G",
    "H",
    "I",
    "J",
    "K",
    "L",
    "M",
    "N",
    "O",
    "P",
    "Q",
    "R",
    "S",
    "T",
    "U",
    "V",
    "W",
    "X",
    "Y",
    "Z",
    "0",
    "1",
    "2",
    "3",
    "4",
    "5",
    "6",
    "7",
    "8",
    "9",
  ]),
];

function setup() {
  createCanvas(windowWidth, windowHeight);
  noLoop();
  fill(255);
  textFont("monospace");
  textAlign(CENTER, CENTER);
}

function draw() {
  background(0);
  textSize(24);
  text("Font export", width / 2, height / 2 - 40);
  textSize(16);
  text("Click to export a font.", width / 2, height / 2);
}

function mouseReleased() {
  exportFont();
}

// Creates one glyph whose outline is a random rectangle inside the em box.
function createRandomRectGlyph(char) {
  const left = random(80, 220);
  const right = random(380, 620);
  const bottom = random(-80, 120);
  const top = random(520, 780);
  const path = new opentype.Path();

  // Draw the glyph outline as a closed rectangle from the random bounds.
  path.moveTo(left, bottom);
  path.lineTo(right, bottom);
  path.lineTo(right, top);
  path.lineTo(left, top);
  path.close();

  return new opentype.Glyph({
    name: char === " " ? "space" : char, // Use the literal character as the glyph name, except for the space glyph.
    unicode: char.codePointAt(0), // Map the glyph to the character's Unicode code point.
    advanceWidth: 600, // Set a fixed horizontal spacing for the exported glyph.
    xMin: left, // Store the left edge of the glyph bounds.
    yMin: bottom, // Store the bottom edge of the glyph bounds.
    xMax: right, // Store the right edge of the glyph bounds.
    yMax: top, // Store the top edge of the glyph bounds.
    path, // Attach the rectangle outline path to the glyph.
  });
}

// Builds the font and downloads it as an OTF file.
function exportFont() {
  if (typeof opentype === "undefined") {
    statusText = "opentype.js is not loaded.";
    redraw();
    return;
  }

  const glyphs = [
    new opentype.Glyph({
      name: ".notdef",
      advanceWidth: 600,
      path: new opentype.Path(),
    }),
  ];

  // Add one rectangle-based glyph for each exported character.
  for (let index = 0; index < charset.length; index++) {
    const char = charset[index];
    glyphs.push(createRandomRectGlyph(char));
  }

  // Turn the generated glyph collection into an exportable OpenType font.
  const font = new opentype.Font({
    familyName: "MinimalRectFont",
    styleName: "Regular",
    unitsPerEm: 1000,
    ascender: 800,
    descender: -200,
    glyphs,
  });

  font.download("MinimalRectFont.otf");
  statusText = "Exported MinimalRectFont.otf";
  redraw();
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  redraw();
}
