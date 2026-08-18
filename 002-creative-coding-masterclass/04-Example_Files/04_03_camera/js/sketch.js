/*
 * © 2026 Schultzschultz. Created for 'Schultzschultz Creative Coding Masterclass'.
 * For educational use only. All rights reserved.
 * 
 * -----------------------------------–
 * Camera – Load, Display and Rasterize
 * -----------------------------------–
 *  
 * This file is an example of how to work with video capture, pixel manipulation, and rasterization techniques.
 * 
 * What this file does:
 * - Accesses the device's camera and captures video using createCapture().
 * - Displays the video feed on the canvas.
 * - Allows toggling between different rasterization styles that manipulate the video feed based on pixel brightness.   
 * - Displays information about the video capture such as width, height, and flipped status.
 *  
 * Controls:
 * - Left/Right Arrow Keys: Change the rasterization style. 
 * - Up/Down Arrow Keys: Adjust the grid size for rasterization.
 * - Mouse Click: Toggle the flipped property of the video capture.
 * 
 * Rasterization Styles:
 * 0: Original video feed.
 * 1: Rectangles with width based on pixel brightness.
 * 2: Points with stroke weight based on pixel brightness.
 * 3: Points with stroke color based on pixel color.
 * 4: Rectangles with a vertical gradient based on the colors of the pixels above and below.
 * 
 * --------------------------------------–--------
 * !!! Camera Access requires a Secure Context !!!
 *
 * Browsers only allow camera access when the page is served from a secure context (either https:// or http://localhost).
 * Opening index.html directly as a file:// URL will NOT work.
 *
 * To start a local web server, open a terminal in this project folder and run:
 * 
 * python3 -m http.server 8000
 *
 * Then open your browser and navigate to:
 *
 * http://localhost:8000
 *
 * The server runs as long as the terminal is open. Stop it at any time with Ctrl + C.
 */


let capture;
let gridSize = 15;
let style = 0;
let col;

function setup() {
  createCanvas(windowWidth, windowHeight);

  // Use the createCapture() function to access the device's camera and start capturing video.
  capture = createCapture(VIDEO);

  // Set the size of the video capture to 600x400 pixels, scaled by the display density.
  capture.size(600 * displayDensity(), 400 * displayDensity());

  // Use capture.hide() to remove the p5.Element object made using createCapture(). 
  // The video will instead be rendered as an image in draw().
  capture.hide();

  imageMode(CENTER);

  // Initialize the color for the rasterization styles.
  col = randomColor();
}

function draw() {

  // Set the background color to black.
  background(0);

  if (style == 0) {
    // Draw the video capture on the canvas.
    image(capture, width / 2, height / 2, capture.width, capture.height);
  } else {
    // Rasterize the video capture.
    rasterizeCapture();
  }

  // Show information about the video capture.
  displayInfo();

}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

function mousePressed() {
  // Toggle the flipped property of the video capture.
  capture.flipped = !capture.flipped;
}

function keyPressed() {
  // Change the rasterization style or grid size based on arrow key presses.
  if (keyCode === LEFT_ARROW) {
    style = (style - 1 + 5) % 5;
    col = randomColor();
  } else if (keyCode === RIGHT_ARROW) {
    style = (style + 1) % 5;
    col = randomColor();
  } else if (keyCode === UP_ARROW) {
    gridSize = constrain(gridSize + 5, 5, 100);
  } else if (keyCode === DOWN_ARROW) {
    gridSize = constrain(gridSize - 5, 5, 100);
  }
}

// Function to generate a random color in HSB mode and return it in RGB mode.
function randomColor() {
  colorMode(HSB, 360, 100, 100);
  let c = color(random(360), 100, 100);
  colorMode(RGB, 255, 255, 255);
  return c;
}

// Function to rasterize the video capture based on the selected style and grid size.
function rasterizeCapture() {

  // loadPixels() loads all pixels once into the RAM array capture.pixels[].
  // This is drastically faster than calling capture.get(x, y) per cell.
  capture.loadPixels();

  let capW = capture.width;
  let capH = capture.height;
  let xShift = (width - capW) / 2;
  let yShift = (height - capH) / 2;

  // Helper function: returns a color() from the pixel array for position (px, py).
  function getPixelColor(px, py) {
    let cx = constrain(floor(px), 0, capW - 1);
    let cy = constrain(floor(py), 0, capH - 1);
    let idx = (cy * capW + cx) * 4;
    return color(
      capture.pixels[idx],
      capture.pixels[idx + 1],
      capture.pixels[idx + 2]
    );
  }

  // Loop through the video capture in a grid pattern based on the grid size.
  for (let y = 0; y < capH; y += gridSize) {
    for (let x = 0; x < capW; x += gridSize) {

      // Get the color of the current pixel in the video capture.
      let tempCol = getPixelColor(x, y);

      // Map the brightness of the pixel color to a size for the rasterization styles.
      let tempSize = map(brightness(tempCol), 0, 100, 0, gridSize);
      tempSize = constrain(tempSize, 1, gridSize);

      // Draw different rasterization styles based on the selected style variable.
      if (style === 1) {
        // Draw rectangles with a width based on the brightness of the pixel color.
        rectMode(CENTER);
        noStroke();
        fill(col);
        rect(xShift + x + gridSize / 2, yShift + y + gridSize / 2, tempSize, gridSize);
      } else if (style === 2) {
        // Draw points with a stroke weight based on the brightness of the pixel color.
        stroke(col);
        strokeWeight(tempSize);
        point(xShift + x + gridSize / 2, yShift + y + gridSize / 2);
      } else if (style === 3) {
        // Draw points with a stroke weight based on the brightness of the pixel color.
        stroke(tempCol);
        strokeWeight(gridSize - 2);
        point(xShift + x + gridSize / 2, yShift + y + gridSize / 2);
      } else if (style === 4) {
        // Draw rectangles with a vertical gradient based on the colors of the pixels above and below.
        let tempCol1 = getPixelColor(x, y - gridSize / 2);
        let tempCol2 = getPixelColor(x, y + gridSize / 2);
        for (let i = 0; i < gridSize; i++) {
          let lerpStep = 1.0 / gridSize;
          let lerpCol = lerpColor(tempCol1, tempCol2, lerpStep * i);
          fill(lerpCol);
          noStroke();
          rect(xShift + x - gridSize / 2, yShift + (y - gridSize / 2) + i, gridSize, 1);
        }
      }

    }
  }
}

// Function to display information about the video.
function displayInfo() {

  // Get the width, height, and flipped properties of the video capture.
  let captureWidth = capture.width;
  let captureHeight = capture.height;
  let captureFlipped = capture.flipped;

  // Set text properties
  fill(255);
  noStroke();
  textSize(16);
  textFont('monospace');
  textAlign(LEFT, TOP);

  // Display the information on the canvas.
  text('width:   ' + captureWidth, 10, 10);
  text('height:  ' + captureHeight, 10, 30);
  text('flipped: ' + captureFlipped, 10, 50);
  text('style:   ' + style, 10, 70);
  text('grid:    ' + gridSize, 10, 90);
}