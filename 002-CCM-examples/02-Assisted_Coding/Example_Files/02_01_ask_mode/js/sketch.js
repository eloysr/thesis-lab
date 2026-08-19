/*
 * © 2026 Schultzschultz. Created for 'Schultzschultz Creative Coding Masterclass'.
 * For educational use only. All rights reserved.
 * 
 * --------
 * Ask Mode
 * --------
 * 
 * This file is an example of how to get to know unfamiliar code and understand what it does. 
 * 
 * Prompt:
Explain the following p5.js code to me as a beginner:
– I am a beginner.
– Explain slowly and without jargon, or explain technical terms in a simple way.
– First show me the big picture: What does the program do overall?
– Then explain each function individually and in the correct order.
– Especially explain how the functions are connected, who calls what, when, and why.
– Explain all important variables and how their values change.
– At the end, give me a short summary in 5 bullet points.
– After that, give me 3 small exercises to help me understand the code better.
 */

let imgOriginal;
let imgRasterized;

let gridSize = 10;
let gridSizes = [5, 10, 20, 25, 50, 100, 200, 250];

let horizontal = true;

function preload() {
  imgOriginal = loadImage("assets/example.png");
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  imageMode(CENTER);
  generateRasterizedImage();
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

function draw() {
  background(0);
  image(imgRasterized, width / 2, height / 2);
  setGridSize();
}

function generateRasterizedImage() {
  let cols = floor(imgOriginal.width / gridSize);
  let rows = floor(imgOriginal.height / gridSize);

  imgOriginal.loadPixels();

  let downscaleCopy = imgOriginal.get();
  downscaleCopy.resize(cols, rows);

  imgRasterized = createGraphics(imgOriginal.width, imgOriginal.height);
  imgRasterized.background(255);

  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      let xPos = (x + 0.5) * gridSize;
      let yPos = (y + 0.5) * gridSize;

      let col_rgb = downscaleCopy.get(x, y);
      let col_greyscale = (red(col_rgb) + green(col_rgb) + blue(col_rgb)) / 3;
      let value = col_greyscale / 255;

      xPos = ceil(xPos);
      yPos = ceil(yPos);
      let size = ceil(gridSize) + 1;

      let subGrid = 5;
      let resolution = subGrid + 1;
      let stepSize = size / (resolution - 1);
      let steps = round(value * (resolution - 1));
      let size2 = stepSize * steps;

      if (horizontal) {
        let newSize = size2;
        size2 = size;
        size = newSize;
      }

      imgRasterized.push();
      imgRasterized.rectMode(CENTER);
      imgRasterized.fill(0);
      imgRasterized.noStroke();
      imgRasterized.rect(xPos, yPos, size2, size);
      imgRasterized.pop();
    }
  }
}

function setGridSize() {
  let pgridSize = gridSize;
  let pHorizontal = horizontal;

  let index = round(map(mouseX, 0, width, 0, gridSizes.length - 1));
  gridSize = gridSizes[index];

  horizontal = mouseY < height / 2 ? true : false;

  if (gridSize != pgridSize || horizontal != pHorizontal) {
    generateRasterizedImage();
  }
}
