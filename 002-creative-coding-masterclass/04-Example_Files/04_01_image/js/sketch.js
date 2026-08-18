/*
 * © 2026 Schultzschultz. Created for 'Schultzschultz Creative Coding Masterclass'.
 * For educational use only. All rights reserved.
 * 
 * ----------------------------------------
 * Image – Import, Display and Manipulation
 * ----------------------------------------
 * 
 * This file is an example of how to import, display and manipulate images in p5.js. 
 * It demonstrates various techniques for working with images, including displaying them at 
 * different sizes and positions, applying filters and blend modes, and using masks.
 *
 * What this file does:
 * - Preloads an image and a mask before the sketch starts.
 * - Displays the image in various ways (original size, centered, scaled, as a subsection, fitted to the canvas).
 * - Applies a tint color to the image.
 * - Uses blend modes to change how the image interacts with the background.
 * - Applies filters to modify the appearance of the image.
 * - Uses a mask to control which parts of the image are visible. 
 * - Changes the background color based on the color of the pixel under the mouse cursor in the image.
 * 
 * Note: Make sure to place a image file named 'example.png' and 'mask.png' in the 'assets' folder for this sketch to work.
 * You can replace 'example.png' and 'mask.png' with any image file (png, jpeg) you have, just update the path in the preload function accordingly.
*/


let img;
let mask;

// Preload function to load the image before the sketch starts.
function preload() {
  // Load the image and create a p5.Image object.
  img = loadImage('/assets/example.png');
  mask = loadImage('/assets/mask.png');
}

function setup() {
  createCanvas(windowWidth, windowHeight);
}

function draw() {

  background('#FF0000');

  // Function to display the image at its original size in the top-left corner of the canvas.
  displayImageOriginal();

  // Function to display the image at its original size in the center of the canvas.
  //displayImageCentered();

  // Function to display the image at half its original size in the center of the canvas.
  // displayImageScaled();

  // Function to display a subsection of the image centered on the canvas.  
  // displayImageSubsection();

  // Function to display the image scaled to fit within the canvas while maintaining its aspect ratio.
  // displayImageFit();

  // Function to display the image with a tint color applied to it.
  // displayImageTint();

  // Function to display the image with a blend mode applied to it.
  //displayImageBlend();

  // Function to display the image with a filter applied to it.
  // displayImageFilter();

  // Function to display the image with a mask applied to it.
  //displayImageMasked();

  // Function to display information about the image.
  displayInfo();

  // Function to display the color of the pixel under the mouse cursor in the image.
  //displayPixelColor();
}

// Keeps the canvas size in sync with the browser window.
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

// Function to display the image at its original size in the top-left corner of the canvas.
function displayImageOriginal() {
  // Display the image at its original size in the top-left corner of the canvas.
  imageMode(CORNER);
  image(img, 0, 0);
}

// Function to display the image at its original size in the center of the canvas.
function displayImageCentered() {
  // Display the image at its original size in the center of the canvas.
  imageMode(CENTER);
  image(img, width / 2, height / 2);
}

// Function to display the image at half its original size in the center of the canvas.
function displayImageScaled() {
  // Display the image at half its original size in the center of the canvas.
  imageMode(CENTER);
  image(img, width / 2, height / 2, img.width / 2, img.height / 2);
}

// Function to display a subsection of the image centered on the canvas.
function displayImageSubsection() {

  imageMode(CENTER);

  // sx / sy : x/y-coordinate of the subsection in the source image
  let sx = 250;
  let sy = 50;

  // sWidth / sHeight : width / height of the subsection in the source image
  let sWidth = 300;
  let sHeight = 500;

  // Extract the top half as a new p5.Image.
  let subsection = img.get(sx, sy, sWidth, sHeight);

  // Draw the extracted subsection centered on the canvas.
  image(subsection, width / 2, height / 2, subsection.width, subsection.height);
}

// Function to display the image scaled to fit within the canvas while maintaining its aspect ratio.
function displayImageFit() {

  imageMode(CORNER);

  // Display the image scaled to fit within the canvas while maintaining its aspect ratio.
  // image(img, 0, 0, width, height, 0, 0, img.width, img.height, CONTAIN);

  // Display the image scaled to fill the entire canvas while maintaining its aspect ratio. Parts of the image may be cropped.
  image(img, 0, 0, width, height, 0, 0, img.width, img.height, COVER);
}

// Function to display the image with a tint color applied to it.
function displayImageTint() {
  imageMode(CENTER);

  // Display the image with a tint color applied to it.
  tint('#FF0000');

  image(img, width / 2, height / 2);

  // Reset tint to default (no tint) for subsequent drawing operations.
  noTint();
}

// Function to display the image with a blend mode applied to it.
function displayImageBlend() {

  background('#0000FF');

  imageMode(CENTER);

  // Display the image with a blend mode applied to it. The blend mode determines how the colors of the image interact with the colors of the background.
  // BlendModes: BLEND, DARKEST, LIGHTEST, DIFFERENCE, MULTIPLY, EXCLUSION, SCREEN, REPLACE, OVERLAY, HARD_LIGHT, SOFT_LIGHT, DODGE, BURN, ADD or NORMAL
  // blendMode(MULTIPLY);
  blendMode(DIFFERENCE);

  image(img, width / 2, height / 2);

  // Reset blend mode to default (BLEND) for subsequent drawing operations.
  noBlend();
}

// Function to display the image with a filter applied to it.
function displayImageFilter() {

  imageMode(CENTER);

  // Create a copy of the original image before applying the filter, so we can reset it later if needed.
  let copy = img.get();

  // Display the image with a filter applied to it. The filter modifies the appearance of the image based on the specified filter type and parameters.
  // Filters: THRESHOLD, GRAY, OPAQUE, INVERT, POSTERIZE, BLUR or ERODE
  copy.filter(BLUR, mouseX / 500);
  // img.filter(THRESHOLD, 0.35);
  // img.filter(GRAY);
  // img.filter(INVERT);
  // img.filter(POSTERIZE);

  image(copy, width / 2, height / 2);
}

// Function to display the image with a mask applied to it. The mask controls which parts of the image are visible based on the brightness of the corresponding pixels in the mask image.
function displayImageMasked() {

  // Create a copy of the original image before applying the filter, so we can reset it later if needed.
  let copy = img.get();

  // Apply the mask to the image. The mask controls which parts of the image are visible based on the brightness of the corresponding pixels in the mask image.
  // The mask should be a grayscale image where white areas reveal the image and black areas hide it
  copy.mask(mask);

  imageMode(CENTER);
  image(copy, width / 2, height / 2);
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

// Function to display the color of the pixel under the mouse cursor in the image.
function displayPixelColor() {

  // Get the color of the pixel at the mousePosition  relative to the image. 
  // The get() function returns an array containing the RGBA values of the pixel.
  let pixelColor = img.get(mouseX, mouseY);

  // Get the color of the pixel at the mouse position relative to the canvas. 
  // This will return the color of whatever is currently displayed at that position, which may be part of the image or the background.
  pixelColor = get(mouseX, mouseY);

  // Draw an ellipse at the mouse position with the color of the pixel under the mouse cursor.
  fill(pixelColor);
  stroke(128);
  strokeWeight(2);
  ellipseMode(CENTER);
  ellipse(mouseX, mouseY, 50, 50);
  fill(0);
  noStroke();
  textAlign(LEFT, CENTER);
  textSize(16);
  textFont('monospace');
  text(pixelColor, mouseX + 30, mouseY)
}