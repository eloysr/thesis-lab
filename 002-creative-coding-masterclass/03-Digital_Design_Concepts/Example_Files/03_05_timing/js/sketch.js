/*
 * © 2026 Schultzschultz. Created for 'Schultzschultz Creative Coding Masterclass'.
 * For educational use only. All rights reserved.
 *
 * ---------------------------------------------
 * Timing – frameRate(), frameCount and millis()
 * ---------------------------------------------
 *
 * This file is an example of how to work with timing-related values in p5.js
 *
 * What this file does:
 * - Displays live timing information on screen, including the current frames per second, total frame count, and elapsed milliseconds.
 * - Reduces the frame rate when the mouse is pressed and restores it when released, showing how frame rate affects animation speed.
 * - Animates one circle using frameCount, so its movement depends on the number of rendered frames.
 * - Animates a second circle using millis(), so its movement depends on elapsed time rather than frame count.
 */

function setup() {
  createCanvas(windowWidth, windowHeight);
}

function draw() {
  background(0);

  adjustFramerate();
  animateCircles();
  displayInfo();
}

// Animate the two circles, one driven by frameCount, the other by millis()
function animateCircles() {
  fill(0);
  stroke(255);
  strokeWeight(2);

  let framesX = (frameCount * 10) % width;
  let framesY = height * 0.33;
  circle(framesX, framesY, 100);

  let timeX = (millis() * 0.6) % width;
  let timeY = height * 0.66;
  circle(timeX, timeY, 100);

  fill(255);
  noStroke(255);
  textAlign(CENTER, CENTER);
  text("frames", framesX, framesY);
  text("time", timeX, timeY);
}

// Display live timing information on screen
function displayInfo() {
  fill(255);
  textSize(16);
  textFont("monospace");
  textAlign(LEFT, TOP);
  let timingVariables =
    "frames per second: " +
    round(frameRate()) +
    "\n" +
    "frames: " +
    frameCount +
    "\n" +
    "milliseconds: " +
    round(millis());
  text(timingVariables, 20, 20);
}

// Decrease the frame rate while the mouse is pressed, restore it when released
function adjustFramerate() {
  if (mouseIsPressed) {
    frameRate(4);
  } else {
    frameRate(60);
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}
