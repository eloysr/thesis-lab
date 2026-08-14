/*
 * © 2026 Schultzschultz. Created for 'Schultzschultz Creative Coding Masterclass'.
 * For educational use only. All rights reserved.
 *
 * ---------------------------------------------
 * Color – Modes, Interpolation and Transparency
 * ---------------------------------------------
 * 
 * This file is an example of how to use different color modes (RGB and HSB), 
 * interpolate between colors, and apply alpha transparency in p5.js.  
 *
 * What this file does:
 * - Displays a rectangle in the top-left quadrant that changes color based on the mouse position using RGB color mode.
 * - Displays a rectangle in the top-right quadrant that changes color based on the mouse position using HSB color mode.
 * - Displays a series of rectangles in the bottom half of the canvas that interpolate between two colors, with the number of steps determined by the mouse position.
 * - Displays two overlapping circles in the bottom-right quadrant, where one circle's alpha transparency changes based on the mouse position, demonstrating how colors blend with varying transparency.
 */


function setup() {
  // Create a canvas that fills the entire browser window.
  createCanvas(windowWidth, windowHeight);
}

function draw() {

  // Set background to black.
  background(0);

  // Display RGB color mode.
  displayRGB();

  // Display HSB color mode.
  displayHSB();

  // Display interpolation between two colors.
  displayInterpolation();

  // Display alpha transparency.
  displayAlpha();
}

// Display RGB color mode.
function displayRGB() {

  // Set color mode to RGB with a range of 0-255 for each component and alpha.
  colorMode(RGB, 255, 255, 255, 255);

  // Map mouseX to the red component and mouseY to the green component, while keeping blue constant.
  let r = map(mouseX, 0, width, 0, 255);
  let g = map(mouseY, 0, height, 0, 255);
  let b = 128;

  // Create a color object using the RGB values.
  let c = color(r, g, b);

  // Set the fill color to the created color and draw a rectangle in the top-left quadrant of the canvas.
  fill(c);
  noStroke();
  rect(0, 0, width / 2, height / 2);

  // Format the RGB values to display as text with 3 digits and no decimal places.
  let infoRed = nf(red(c), 3, 0);
  let infoGreen = nf(green(c), 3, 0);
  let infoBlue = nf(blue(c), 3, 0);

  // Convert RGB values to a hex color string.
  let infoHex = '#' + hex(int(r), 2) + hex(int(g), 2) + hex(int(b), 2);

  // Create a text string to display the RGB values and hex code.
  let txt = 'RGB\n' + 'R:  ' + infoRed + '\nG:  ' + infoGreen + '\nB:  ' + infoBlue + '\n' + infoHex;

  // Call the displayInfo function to show the RGB values on the canvas.
  displayInfo(0, 0, txt);
}

// Display HSB color mode.
function displayHSB() {

  // Set color mode to HSB with a range of 0-360 for hue and 0-100 for saturation, brightness, and alpha.
  colorMode(HSB, 360, 100, 100, 100);

  // Map mouseX to the hue component and mouseY to the brightness component, while keeping saturation constant.
  let h = map(mouseX, 0, width, 0, 360);
  let s = 90;
  let b = map(mouseY, 0, height, 100, 0);

  // Create a color object using the HSB values.
  let c = color(h, s, b);

  // Set the fill color to the created color and draw a rectangle in the top-right quadrant of the canvas.
  fill(c);
  noStroke();
  rect(width / 2, 0, width / 2, height / 2);

  // Format the HSB values to display as text with 3 digits and no decimal places.
  let infoHue = nf(hue(c), 3, 0);
  let infoSaturation = nf(saturation(c), 3, 0);
  let infoBrightness = nf(brightness(c), 3, 0);

  // Create a text string to display the HSB values.
  let txt = 'HSB\n' + 'H:  ' + infoHue + '\nS:  ' + infoSaturation + '\nB:  ' + infoBrightness;

  // Call the displayInfo function to show the HSB values on the canvas.
  displayInfo(width / 2, 0, txt);
}

// Display interpolation between two colors.
function displayInterpolation() {

  // Set color mode to RGB with a range of 0-255 for each component and alpha.
  colorMode(RGB, 255, 255, 255, 255);

  // Define two colors to interpolate between.
  let colorA = color(255, 60, 60);
  let colorB = color(60, 120, 255);

  // Map mouseX to determine the number of steps for interpolation, with a minimum of 2 and a maximum of 20.
  let steps = ceil(map(mouseX, 0, width, 2, 20));

  // Calculate the width of each rectangle based on the number of steps, ensuring they fill the bottom half of the canvas.
  let w = (width / 2) / steps;

  // Loop through the number of steps to create rectangles that interpolate between colorA and colorB.
  for (let i = 0; i < steps; i++) {

    // Calculate the interpolation amount as a value between 0 and 1 based on the current step.
    let amt = i / (steps - 1);

    // Use the lerpColor function to calculate the interpolated color between colorA and colorB based on the interpolation amount.
    let colorMix = lerpColor(colorA, colorB, amt);

    // Set the fill color to the interpolated color and draw a rectangle in the bottom half of the canvas for each step.
    fill(colorMix);
    noStroke();
    rect(w * i, height / 2, w + 1, height / 2);
  }

  // Call the displayInfo function to show the label "Interpolation" on the canvas.
  displayInfo(0, height / 2, 'Interpolation');

}

// Display alpha transparency.
function displayAlpha() {

  // Set color mode to RGB with a range of 0-255 for each component and alpha.
  colorMode(RGB, 255, 255, 255, 255);

  // Define two colors.
  let colorA = color(255, 60, 60);
  let colorB = color(60, 120, 255);

  // Map mouseX to the alpha component of colorB, allowing it to transition from fully transparent (0) to fully opaque (255) as the mouse moves across the canvas.
  let alpha = map(mouseX, 0, width, 0, 255);

  // Create a new color object 'c' that has the same red, green, and blue components as colorB but with the alpha value determined by the mouseX position.
  let c = color(red(colorB), green(colorB), blue(colorB), alpha);

  // Define the size of the circles to be drawn, which is set to 25% of the canvas height.
  let ellipseSize = height * 0.25;

  // Set the fill color to colorA and draw a circle in the bottom-right quadrant of the canvas.
  noStroke();
  fill(colorA);
  ellipse(width * 0.75 - ellipseSize * 0.3, height * 0.75, ellipseSize, ellipseSize);

  // Set the fill color to the new color 'c' (which has varying alpha) and draw a circle on top of the previous one, demonstrating the effect of alpha transparency as it blends with colorA.
  fill(c);
  ellipse(width * 0.75 + ellipseSize * 0.3, height * 0.75, ellipseSize, ellipseSize);

  // Call the displayInfo function to show the label "Alpha" on the canvas.
  displayInfo(width / 2, height / 2, 'Alpha');
}

// Function to display information text on the canvas at a specified position.
function displayInfo(x, y, txt) {

  // Set color mode to RGB with a range of 0-255 for each component and alpha.
  colorMode(RGB, 255, 255, 255, 255);

  // Set the fill color to white and disable stroke for the text.
  fill(255);
  noStroke();

  // Set the text size to 26 pixels and align the text to the left and top.
  textSize(16);
  textFont('monospace');
  textAlign(LEFT, TOP);

  // Display the provided text at the specified (x, y) coordinates, with an offset of 20 pixels to avoid overlapping with the shapes.
  text(txt, x + 20, y + 20);
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}