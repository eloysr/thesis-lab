/*
 * © 2026 Schultzschultz. Created for 'Schultzschultz Creative Coding Masterclass'.
 * For educational use only. All rights reserved.
 * 
 * ----------
 * Export SVG
 * ----------
 * 
 * This file is a demonstration of how to export the canvas as a SVG vector file. 
 * 
 * What this file does:
 * - Initializes the canvas and background drawing layer.
 * - Handles user interactions for drawing on the canvas and adjusting settings.
 * - Manages the grid of RasterPoint objects that create the pixelated effect.
 * - Provides functions for resetting the drawing, changing colors, adjusting grid size, and saving the canvas as an image.
 * – Exports the current canvas as a SVG file, preserving the vector quality of the raster points.
 */


const gridSizePreset = 75;
const gridSizeSteps = 25;
const gridSizeMin = gridSizeSteps * 2;
const gridSizeMax = gridSizeSteps * 6;
let gridSize = gridSizePreset;

const white = '#FFFFFF';
const black = '#000000';
let bgColor = white;
let brushColor = white;
let gridElementColor = black;

let bgDrawing;
let rasterPoints = [];
let gridXElements;
let gridYElements;

let myCanvas;

// Runs once when the sketch starts
function setup() {

  // Store the p5 instance so it can be used as a canvas context (same API as p5.Graphics).
  myCanvas = this;

  // Default full-window canvas.
  createCanvas(windowWidth, windowHeight);

  // Initialize the background drawing layer and raster points.
  reset();

  // Set image mode to center for easier handling of raster points.
  imageMode(CENTER);
}

// Runs continuously (frame by frame)
function draw() {

  // Draw the current state of the background drawing layer onto the canvas.
  image(bgDrawing, width / 2, height / 2);

  // Update the raster points based on the current state of the canvas.
  let tempScreen = get(0, 0, width, height);
  for (let x = 0; x < gridXElements; x++) {
    for (let y = 0; y < gridYElements; y++) {
      rasterPoints[x][y].update(tempScreen);
    }
  }

  background(bgColor);

  // Display the raster points.
  for (let x = 0; x < gridXElements; x++) {
    for (let y = 0; y < gridYElements; y++) {
      rasterPoints[x][y].display(myCanvas);
    }
  }
}

// Keeps the canvas size in sync with the browser window.
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

// Handle mouse interactions for drawing on the canvas, but only if not over the interface.
function mousePressed() {
  if (!mouseOverInterface()) {
    drawImg(mouseX, mouseY, pmouseX, pmouseY);
  }
}

// Handle mouse interactions for drawing on the canvas, but only if not over the interface.
function mouseDragged() {
  if (!mouseOverInterface()) {
    drawImg(mouseX, mouseY, pmouseX, pmouseY);
  }
}

// Check if the mouse is currently over any of the interface elements (toolbars).
function mouseOverInterface() {
  if (mouseX > width - 205 && mouseY < 70) {   // top-right toolbar area (205px wide, 70px tall)
    return true;
  } else if (mouseX > width - 70 && mouseY > height - 260) { // bottom-right toolbar area (70px wide, 260px tall)
    return true;
  } else {
    return false;
  }
}

// Draw on the background drawing layer.
function drawImg(x, y, px, py) {
  bgDrawing.stroke(brushColor);
  bgDrawing.strokeWeight(gridSize);
  bgDrawing.noFill();
  bgDrawing.line(x, y, px, py);
}

// Reset the background drawing layer and raster points to their initial state.
function reset() {

  // Create a new graphics layer for the background drawing, which allows us to keep the drawing persistent while we update and display the raster points on top of it.
  bgDrawing = createGraphics(width, height);
  bgDrawing.background(black);

  // Create the raster points based on the current grid size and canvas dimensions.
  createRasterPoints();

  // Set the initial brush color to white.
  brushColor = white;

  // Set the background color and update the visibility of the color toggle buttons.
  document.getElementById("colorToggleBlack").style.visibility = "visible";
  document.getElementById("colorToggleWhite").style.visibility = "hidden";
}

// Create raster points based on the current grid size and canvas dimensions.
function createRasterPoints() {

  // Clear the existing raster points array before creating new ones.
  rasterPoints = [];

  // Calculate how many raster points we need in the x and y directions to cover the entire canvas, plus a buffer of 2 to ensure coverage even when the grid size changes.
  gridXElements = floor(width / gridSize) + 2;
  gridYElements = floor(height / gridSize) + 2;

  // Create a 2D array of RasterPoint objects, positioning them in a grid pattern across the canvas. Each RasterPoint is centered within its grid cell.
  for (let x = 0; x < gridXElements; x++) {

    // Initialize the sub-array for this column of raster points.
    rasterPoints[x] = [];

    // Loop through the y direction to create RasterPoint objects for each position in the grid.
    for (let y = 0; y < gridYElements; y++) {

      // Calculate the x and y position for this RasterPoint, centering it within its grid cell. 
      // The position is calculated based on the grid size and the total number of grid elements, ensuring that the points are evenly spaced across the canvas.
      let xPos = x * gridSize + ((width - (gridSize * gridXElements)) / 2) + (gridSize / 2);
      let yPos = y * gridSize + ((height - (gridSize * gridYElements)) / 2) + (gridSize / 2);

      // Create a new RasterPoint object at the calculated position and store it in the rasterPoints array.
      rasterPoints[x][y] = new RasterPoint(xPos, yPos);
    }
  }
}

// Toggle the brush color between black and white, and update the visibility of the corresponding color toggle buttons in the interface.
function setColor() {
  if (brightness(brushColor) > 0) {
    brushColor = black;
    document.getElementById("colorToggleBlack").style.visibility = "hidden";
    document.getElementById("colorToggleWhite").style.visibility = "visible";
  } else {
    brushColor = white;
    document.getElementById("colorToggleBlack").style.visibility = "visible";
    document.getElementById("colorToggleWhite").style.visibility = "hidden";
  }
}

// Adjust the grid size based on user input, ensuring it stays within defined minimum and maximum limits. 
// Update the visibility of the grid size adjustment buttons accordingly, and recreate the raster points to reflect the new grid size.
function setGridSize(value) {
  if (value == "+") {
    gridSize += gridSizeSteps;
  } else if (value == "-") {
    gridSize -= gridSizeSteps;
  } else {
    gridSize *= value;
    gridSize = round(gridSize / gridSizeSteps) * gridSizeSteps;
  }
  gridSize = constrain(gridSize, gridSizeMin, gridSizeMax);

  if (gridSize == gridSizeMin) {
    document.getElementById("gridMinus").style.opacity = "0.3"; // dimmed: at minimum, can't go smaller
  } else if (gridSize == gridSizeMax) {
    document.getElementById("gridPlus").style.opacity = "0.3";  // dimmed: at maximum, can't go larger
  } else {
    document.getElementById("gridMinus").style.opacity = "1.0"; // fully visible: within range
    document.getElementById("gridPlus").style.opacity = "1.0";
  }

  // Recreate the raster points to reflect the new grid size.
  createRasterPoints();
}

// Save the current canvas as a SVG vector file. 
function exportSVG() {

  // Create a new SVG graphics context with the same dimensions as the canvas, 
  // and set its background color to match the current background color of the sketch.
  let svgCanvas = createGraphics(round(width), round(height), SVG);
  svgCanvas.background(bgColor);

  // Loop through the raster points and display each one on the SVG canvas.
  for (let x = 0; x < gridXElements; x++) {
    for (let y = 0; y < gridYElements; y++) {
      rasterPoints[x][y].display(svgCanvas);
    }
  }

  // Generate a timestamp for the filename in the format "YYYY-MM-DD_HH-MM-SS" to ensure unique filenames for each export.
  let timestamp = year() + '-' + month() + '-' + day() + '_' + hour() + '-' + minute() + '-' + second();

  // Save the SVG canvas as a file.
  saveSVG(svgCanvas, 'gridPaint_' + timestamp + '.svg');
}

class RasterPoint {

  // Initialize a RasterPoint object with a position and an on/off state for its 3x3 neighborhood grid.
  constructor(x, y) {
    this.position = createVector(x, y);

    this.onOff = [];

    // 3 rows for the 3×3 neighborhood grid (left, center, right)
    for (let i = 0; i <= 2; i++) {
      this.onOff[i] = [];
    }

    // Brightness cutoff (0–100): above = "on", below = "off"
    this.threshold = 50;

    // Half a grid cell — fills exactly one quadrant
    this.elementSize = ceil(gridSize / 2);
  }

  // Update the on/off state of this RasterPoint based on the brightness of the pixels in its 3x3 neighborhood on the temporary screen image.
  update(tempScreen) {
    for (let y = -1; y <= 1; y++) {
      for (let x = -1; x <= 1; x++) {
        const pointColor = tempScreen.get(round((this.position.x + (gridSize * x))), round((this.position.y + (gridSize * y))));
        if (brightness(pointColor) >= this.threshold) {
          this.onOff[x + 1][y + 1] = true;
        } else {
          this.onOff[x + 1][y + 1] = false;
        }
      }
    }
  }

  // Display the RasterPoint on the canvas, using different shapes based on its on/off state and the state of its neighbors.
  display(context) {
    this.elementSize = gridSize / 2; // recalculate each frame in case gridSize changed

    context.push();
    context.ellipseMode(CENTER);
    context.translate(this.position.x, this.position.y);
    context.strokeWeight(2);
    context.stroke(gridElementColor);
    context.fill(gridElementColor);

    if (this.onOff[1][1]) { // this raster point is on

      // down right
      if (this.onOff[2][1] || this.onOff[2][2] || this.onOff[1][2]) {
        this.drawSquareCorner(context);
      } else {
        this.drawRoundCorner(context);
      }

      // down left
      context.rotate(radians(90));
      if (this.onOff[0][1] || this.onOff[0][2] || this.onOff[1][2]) {
        this.drawSquareCorner(context);
      } else {
        this.drawRoundCorner(context);
      }

      // up left
      context.rotate(radians(90));
      if (this.onOff[0][1] || this.onOff[0][0] || this.onOff[1][0]) {
        this.drawSquareCorner(context);
      } else {
        this.drawRoundCorner(context);
      }

      // up right
      context.rotate(radians(90));
      if (this.onOff[1][0] || this.onOff[2][0] || this.onOff[2][1]) {
        this.drawSquareCorner(context);
      } else {
        this.drawRoundCorner(context);
      }
    } else { // this raster point is off 

      // down right
      if (this.onOff[2][1] && this.onOff[1][2]) {
        this.drawInnerRound(context);
      }

      // down left
      context.rotate(radians(90));
      if (this.onOff[1][2] && this.onOff[0][1]) {
        this.drawInnerRound(context);
      }

      // up left 
      context.rotate(radians(90));
      if (this.onOff[0][1] && this.onOff[1][0]) {
        this.drawInnerRound(context);
      }

      // up right 
      context.rotate(radians(90));
      if (this.onOff[1][0] && this.onOff[2][1]) {
        this.drawInnerRound(context);
      }
    }
    context.pop();
  }

  drawSquareCorner(context) {
    context.rect(0, 0, this.elementSize, this.elementSize);
  }

  drawRoundCorner(context) {
    // 0.553 is the bezier handle ratio that approximates a quarter-circle
    context.beginShape();
    context.vertex(0, 0);
    context.vertex(this.elementSize, 0);
    context.bezierVertex(this.elementSize, this.elementSize * 0.553, this.elementSize * 0.553, this.elementSize, 0, this.elementSize);
    context.endShape(CLOSE);
  }

  drawInnerRound(context) {
    // 0.553 is the bezier handle ratio that approximates a quarter-circle
    context.beginShape();
    context.vertex(this.elementSize, 0);
    context.bezierVertex(this.elementSize, this.elementSize * 0.553, this.elementSize * 0.553, this.elementSize, 0, this.elementSize);
    context.vertex(this.elementSize, this.elementSize);
    context.endShape(CLOSE);
  }
}
