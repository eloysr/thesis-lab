/*
 * © 2026 Schultzschultz. Created for 'Schultzschultz Creative Coding Masterclass'.
 * For educational use only. All rights reserved.
 * 
 * ---------------------------------
 * Gamepad – Load, Configure and Use
 * ---------------------------------
 * 
 * This file is an example of how to work with gamepads in p5.js. 
 * It sets up a canvas and listens for gamepad input, allowing you 
 * to use a game controller to interact with the sketch.
 *
 * What this file does:
 * - Listens for gamepad connection and disconnection events.
 * - Updates the state of the gamepad each frame.
 * - Displays the current state of the gamepad on the canvas.
 * 
 * To use this file:
 * 1. Make sure you have a compatible game controller (e.g., DualSense PS5 controller).
 * 2. Connect the controller to your computer and press any button to activate it.
 * 3. Use the controller to interact with the letters on the canvas.
 *
 * Controls:
 * - Cross-Pad LEFT/RIGHT: Change the selected letter.
 * - Cross-Pad UP/DOWN: Select a letter.
 * 
 * – Triangle: Change letter style.
 * – Cross: Change font.
 * – Square: Change case.
 * – Circle: Change color.
 * – L-Joystick: Move selected letter.
 * – R-Joystick: Rotate/Scale selected letter.
 * – L1+R1: Create new letter.
 * – L2+R2: Animate letters.
 */


let dualSense;

// Runs once when the sketch starts
function setup() {

  // Default full-window canvas.
  createCanvas(windowWidth, windowHeight);

  // Create an instance of the DualSenseController class to manage gamepad input.
  dualSense = new DualSenseController();
  
  // Initialize the letters that will be displayed and interacted with in the sketch.
  initializeLetters();
}

// Runs continuously (frame by frame)
function draw() {

  // Clear the frame with a black background.
  background(0);

  // Update the state of the DualSense controller and update the letters accordingly.
  dualSense.update();
  updateLetters(dualSense);

  // Draw the letters on the canvas based on their current state (position, style, color, etc.).
  drawLetters();

  // Display the current state of the DualSense controller on the canvas, 
  // showing which buttons are pressed and the values of the axes.
  dualSense.display();
}

// Keeps the canvas size in sync with the browser window.
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}