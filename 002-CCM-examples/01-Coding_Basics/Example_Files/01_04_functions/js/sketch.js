/*
 * © 2026 Schultzschultz. Created for 'Schultzschultz Creative Coding Masterclass'.
 * For educational use only. All rights reserved.
 * 
 * -------------------------
 * Coding Basics – Functions
 * -------------------------
 * 
 * This file is an example of how to use functions in javascript. 
 * 
 * Functions are reusable blocks of code that perform a specific task. 
 * They can take inputs, called parameters, and can return outputs. 
 * Functions help to organize code and make it more readable and maintainable.
 *
 * What this file does:
 * - It displays a greeting message in the center of the canvas.
 * - When the user clicks the mouse, the text color changes to a random color.
 */


const backgroundColor = '#000000';
const fontSize = 140;
let fontColor = '#FFFFFF';

// The setup function is called once when the program starts. 
function setup() {
  createCanvas(windowWidth, windowHeight);
}

// The draw function is called repeatedly in a loop. It is used to render the content on the canvas.
function draw() {
  // p5.js function to set the background color of the canvas. It clears the canvas and fills it with the specified color.
  background(backgroundColor);
  // custom function to display a greeting message
  displayGreeting('Alice');
}

// This function takes a name as an input parameter and displays a greeting message on the canvas
function displayGreeting(name) {
  fill(fontColor);
  textSize(fontSize);
  textAlign(CENTER, CENTER);
  text('Hey, ' + name + '!', width / 2, height / 2);
}

// This function is called when the mouse is released. It changes the font color to a random color.
function mouseReleased() {
  fontColor = getRandomColor();
}

// This function generates and returns a random color
function getRandomColor() {
  // Generate random values for red, green, and blue components
  // random() is a p5.js function that returns a random number 
  // between the specified range (lower and upper bound).
  const randomRed = random(0, 255);
  const randomGreen = random(0, 255);
  const randomBlue = random(0, 255);
  const randomColor = color(randomRed, randomGreen, randomBlue);
  return randomColor;
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}
