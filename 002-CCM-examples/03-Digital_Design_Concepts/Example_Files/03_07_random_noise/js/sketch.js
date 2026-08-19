/*
 * © 2026 Schultzschultz. Created for 'Schultzschultz Creative Coding Masterclass'.
 * For educational use only. All rights reserved.
 * 
 * --------------------
 * Randomness and Noise
 * --------------------
 * 
 * This file explores the concepts of randomness and Perlin noise. 
 * It compares how random values and noise values behave over time, and how they can be influenced.
 * 
 * What this file does:
 * - Generates three panels to visualize random values, noise values, and constrained noise values.
 * - Uses mouse input to control the amplitude of the y-values and the speed of the noise animation.
 * – Animates the noise values over time by incrementing an offset, creating a flowing effect.
 * 
 * Key concepts covered:
 * - random() function for generating random values.
 * - noise() function for generating Perlin noise values.
 * - Mapping mouse input to control visual parameters.
 * - Animating noise over time by incrementing an offset.
 */


const xStep = 50;
const noiseScale = 0.004;
const dotSize = 26;
const padding = 30;
let noiseOffset = 0;
let panelH;

// Runs once when the sketch starts
function setup() {

  // Default full-window canvas.
  createCanvas(windowWidth, windowHeight);

  // Calculate panel height based on the canvas height.
  panelH = height / 3;

  // Set up text properties for labels.
  textFont('monospace');
  textSize(16);
  textAlign(LEFT);
}

// Runs continuously (frame by frame)
function draw() {

  // Clear the frame with a black background.
  background(0);

  // Map mouseX to control the amplitude → vertical spread of the dots
  const amplitude = map(mouseY, 0, height, 8, height * 0.15);

  // Map mouseY to control the speed of the noise animation
  const speed = map(mouseX, 0, width, 0, 10);

  // Increment noiseOffset to animate the noise over time.
  noiseOffset += speed;

  displayLabels();

  // Display the three panels with their respective functions.
  displayRandom(amplitude);
  displayNoise(amplitude);
  displayNoiseConstrained(amplitude);
}

function displayLabels() {

  // ── Grid lines ──────────────────────────────────────────

  stroke(192);
  strokeWeight(1);
  line(0, panelH, width, panelH);
  line(0, panelH * 2, width, panelH * 2);

  stroke(64);
  strokeWeight(1);
  line(0, panelH * 0.5, width, panelH * 0.5);
  line(0, panelH * 1.5, width, panelH * 1.5);
  line(0, panelH * 2.5, width, panelH * 2.5);

  // ── Text ──────────────────────────────────────────────

  noStroke();
  fill(255);
  text('random', padding, panelH * 0 + padding * 1.5);
  text('noise', padding, panelH * 1 + padding * 1.5);
  text('noise constrained', padding, panelH * 2 + padding * 1.5);

  fill(128);
  text('mouseY → amplitude   mousePressed → fixed seed', padding, panelH * 0 + padding * 2.25);
  text('mouseX → speed   mouseY → amplitude', padding, panelH * 1 + padding * 2.25);
  text('mouseX → speed   mouseY → amplitude', padding, panelH * 2 + padding * 2.25);
}

function displayRandom(amplitude) {

  // White stroke and no fill for the dots
  stroke(255);
  strokeWeight(2);
  noFill();

  // Reset the random seed for consistent results while the mouse is pressed
  if (mouseIsPressed) {
    randomSeed(0);
  } else {
    randomSeed();
  }

  // Loop through x positions and draw dots with random y values
  for (let x = padding; x <= width - padding; x += xStep) {

    // Generate a random y value within the specified amplitude range
    const randomY = random(-amplitude, amplitude);

    // Center the y value around the middle of the panel and apply the random offset
    const y = panelH * 0.5 + randomY;

    // Draw the dot at the calculated position
    ellipse(x, y, dotSize);
  }
}

function displayNoise(amplitude) {

  // White stroke and no fill for the dots
  stroke(255);
  strokeWeight(2);
  noFill();

  // Loop through x positions and draw dots with noise-based y values
  for (let x = padding; x <= width - padding; x += xStep) {

    // Calculate the noise value for the current x position, incorporating the noiseOffset for animation
    const n = noise((x + noiseOffset) * noiseScale);

    // Map the noise value (0 to 1) to a y value within the specified amplitude range, centered around the middle of the panel
    const rawY = map(n, 0, 1, -amplitude, amplitude);

    // Draw the dot at the calculated position
    ellipse(x, panelH * 1.5 + rawY, dotSize);
  }
}

function displayNoiseConstrained(amplitude) {

  // White stroke and no fill for the dots
  stroke(255);
  strokeWeight(2);
  noFill();

  // Loop through x positions and draw dots with noise-based y values, constrained to the negative side
  for (let x = padding; x <= width - padding; x += xStep) {

    // Calculate the noise value for the current x position, incorporating the noiseOffset for animation
    const n = noise((x + noiseOffset) * noiseScale);

    // Map the noise value (0 to 1) to a y value within the specified amplitude range, centered around the middle of the panel
    const rawY = map(n, 0, 1, -amplitude, amplitude);

    // Constrain the y value to be between -amplitude and 0, so it only appears on the negative side
    const posY = constrain(rawY, -amplitude, 0);

    // Draw the dot at the calculated position
    ellipse(x, panelH * 2.5 + posY, dotSize);
  }


}

// Keeps the canvas size in sync with the browser window.
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);

  // Update panel height based on the new canvas height.
  panelH = height / 3;
}
