/*
 * © 2026 Schultzschultz. Created for 'Schultzschultz Creative Coding Masterclass'.
 * For educational use only. All rights reserved.
 * 
 * -------------
 * Drag and Drop
 * -------------
 * 
 * This file is an example of how to implement drag and drop functionality in a p5.js sketch. 
 * It allows users to drag and drop an image file onto the canvas, which will then be displayed in the center of the canvas.
 *
 * What this file does:
 * - Loads an image file and displays it on the canvas.
 * - Allows users to drag and drop a new image file onto the canvas, which will replace the currently displayed image.
 * - Displays the width and height of the currently displayed image on the canvas.
 * 
 * Note: Make sure to place an image file named 'example.png' in the 'assets' folder for this sketch to work.
 * You can replace 'example.png' with any image file you have, just update the path in the preload function accordingly.
*/


let img;
let myCanvas;

// Preload function to load the image before the sketch starts.
function preload() {
  // Load the image and create a p5.Image object.
  img = loadImage('/assets/example.png');
}

function setup() {

  // Create a canvas and store the reference to it in the variable 'myCanvas'.
  myCanvas = createCanvas(windowWidth, windowHeight);

  // Set up the canvas to accept dropped files and specify the handler function for when a file is dropped.
  myCanvas.drop(handleDrop);

  // Set the image mode to CENTER so that the image is drawn from its center point.
  imageMode(CENTER);
}

function draw() {

  // Clear the canvas with a black background.
  background(0);

  // Display the image at its original size in the center of the canvas.
  image(img, width / 2, height / 2);

  // Function to display information about the image.
  displayInfo();

}

// Keeps the canvas size in sync with the browser window.
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

// Function to handle the dropped file and load it as an image.
function handleDrop(file) {
  if (file.type !== 'image') return;
  img = loadImage(file.data);
}

// Function to display information about the image.
function displayInfo() {

  // Display the width and height of the image on the canvas.
  let imgWidth = img.width;
  let imgHeight = img.height;

  // Set text properties
  fill(255);
  noStroke();
  textSize(16);
  textFont('monospace');
  textAlign(LEFT, TOP);

  // Display the image dimensions in the top-left corner of the canvas.
  text('image width: ' + imgWidth, 10, 10);
  text('image height: ' + imgHeight, 10, 30);
}