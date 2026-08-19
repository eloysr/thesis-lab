/*
 * © 2026 Schultzschultz. Created for 'Schultzschultz Creative Coding Masterclass'.
 * For educational use only. All rights reserved.
 *
 * ---------------------
 * Coding Basics – Loops
 * ---------------------
 *
 * This file is an example of how to use loops in javascript.
 * A loop is a programming construct that allows you to repeat a block of code multiple times
 * until a specified condition is true.
 *
 * What this file does:
 * - It creates a grid of lines on the canvas.
 * - It highlights the grid cell that the mouse is currently over. *
 */

const backgroundColor = "#000000";
const lineColor = "#848484";
const rectColor = "#333333";

function setup() {
  createCanvas(windowWidth, windowHeight);
}

function draw() {
  background(0);

  stroke(lineColor);
  strokeWeight(1);

  // Manually creating a grid of lines on the canvas by drawing vertical and horizontal lines at regular intervals defined by gridSize.
  line(100, 0, 100, height);
  line(200, 0, 200, height);
  line(300, 0, 300, height);
  line(400, 0, 400, height);
  line(500, 0, 500, height);
  line(600, 0, 600, height);
  line(700, 0, 700, height);
  line(800, 0, 800, height);
  line(900, 0, 900, height);
  line(0, 100, width, 100);
  line(0, 200, width, 200);
  line(0, 300, width, 300);
  line(0, 400, width, 400);
  line(0, 500, width, 500);
  line(0, 600, width, 600);
  line(0, 700, width, 700);
  line(0, 800, width, 800);



  // These loops iterat through the width and height of the canvas in increments of gridSize,
  // drawing vertical and horizontal lines to create rid of lines on the canvas.
  // The first loop iterates through the width of the canvas in increments of gridSize.
  // The second loop iterates through the height of the canvas in increments of gridSize,

  // const gridSize = 100; // Set gridSize based on mouseX, with a default value of 50
  // stroke(lineColor);
  // strokeWeight(1);

  // for (let x = 0; x < width; x += gridSize) {
  //   line(x, 0, x, height);
  // }

  // for (let y = 0; y < height; y += gridSize) {
  //   line(0, y, width, y);
  // }

}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}
