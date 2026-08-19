/*
 * © 2026 Schultzschultz. Created for 'Schultzschultz Creative Coding Masterclass'.
 * For educational use only. All rights reserved.
 * 
 * ----------------------------
 * Coding Basics – Conditionals
 * ----------------------------
 * 
 * This file is an example of how to use conditionals in javascript. 
 * A conditional is a statement that executes different code based on whether a specified condition is true or false.

 * What this file does:
 * - When the mouse is pressed, it draws a white circle at the mouse position.
 * - When the mouse is not pressed, it clears the canvas and fills it with a black background, and draws a white circle outline at the mouse position.
 */


const backgroundColor = '#000000';
const circleColor = '#FFFFFF';
const circleSize = 100;

function setup() {
  createCanvas(windowWidth, windowHeight);
}

function draw() {
  if (mouseIsPressed) {
    noStroke();
    fill(circleColor);
    ellipse(mouseX, mouseY, circleSize, circleSize);
  } else {
    background(backgroundColor);
    noFill();
    strokeWeight(2);
    stroke(circleColor);
    ellipse(mouseX, mouseY, circleSize, circleSize);
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}