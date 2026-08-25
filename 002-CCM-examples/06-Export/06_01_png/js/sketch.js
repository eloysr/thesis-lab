/*
 * © 2026 Schultzschultz. Created for 'Schultzschultz Creative Coding Masterclass'.
 * For educational use only. All rights reserved.
 * 
 * ----------
 * Export PNG
 * ----------
 * 
 * This file is a demonstration of how to export the canvas as a PNG image file. 
 *
 * What this file does:
 * - Loads an image and allows the user to smudge it using mouse interactions.
 * – Drag & Drop functionality allows users to load new images directly onto the canvas for editing.
 * - Users can adjust the smudge size using the mouse wheel.
 * - The canvas can be resized to fit the window, and users can drag and drop new images onto the canvas for editing.
 * - The current state of the canvas can be saved as a PNG image file with a timestamped filename.
 */


let imgOriginal; // The original image loaded from the assets folder or via drag-and-drop.
let imgCopy; // A copy of the original image that can be manipulated without altering the original.
let imgSmudge; // The canvas used for smudge effects.
let dragDropCanvas; // Reference to the canvas element for handling drag-and-drop events.
const smudgeSizePreset = 100;
let smudgeSize = smudgeSizePreset;
const smudgeSizeSteps = 25;
let smudgeTranslation;

// Loads files before the sketch starts.
function preload() {
  imgOriginal = loadImage('assets/example.png');
}

// Runs once when the sketch starts
function setup() {
  // Creates a canvas that fills the window and sets up a drop event listener to handle file drops, 
  // allowing users to drag and drop images onto the canvas for editing.
  dragDropCanvas = createCanvas(windowWidth, windowHeight);
  dragDropCanvas.drop(dropFile);
  
  imageMode(CENTER);
  ellipseMode(CENTER);
  setupImage();
}

// Runs continuously (frame by frame)
function draw() {
  if (!imgCopy || !imgSmudge) return;
  image(imgCopy, width / 2, height / 2);
  image(imgSmudge, width / 2, height / 2);
  drawCursor();
}

// Draws a custom cursor that indicates the smudge area by drawing an ellipse around the mouse position with a specific size and blending mode.
function drawCursor() {
  noFill();
  stroke(255);
  strokeWeight(2);
  blendMode(DIFFERENCE);
  ellipse(mouseX, mouseY, smudgeSize, smudgeSize);
  blendMode(BLEND);
}

// Keeps the canvas size in sync with the browser window.
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  resizeImages();
}

// Handles mouse dragging to create smudge effects by calling the smudgeColor function with the previous and current mouse positions.
function mouseDragged() {
  smudgeColor(pmouseX, pmouseY, mouseX, mouseY);
}

// Adjusts the smudge size based on mouse wheel input, allowing the user to increase or decrease the smudge size in defined steps.
function mouseWheel(event) {
  if (event.delta > 0) {
    smudgeSize = min(smudgeSize + smudgeSizeSteps, 500);
  } else {
    smudgeSize = max(smudgeSize - smudgeSizeSteps, smudgeSizeSteps);
  }
}

// Smudge function that takes the previous and current mouse positions, samples colors from the original image, and draws smudge points on the smudge canvas.
function smudgeColor(px, py, cx, cy) {
  if (cx > 0 && cx < width && cy > 0 && cy < height) {
    let steps = max(abs(px - cx), abs(py - cy));
    let lrp = (1.0 / steps);
    let s1 = imgCopy.get(px + smudgeTranslation.x, py + smudgeTranslation.y);
    let s2 = imgCopy.get(cx + smudgeTranslation.x, cy + smudgeTranslation.y);
    let c1 = color(red(s1), green(s1), blue(s1));
    let c2 = color(red(s2), green(s2), blue(s2));
    for (let i = 0; i < steps; i++) {
      let lrpV = lrp * i;
      let x = lerp(px, cx, lrpV);
      let y = lerp(py, cy, lrpV);
      let inter = lerpColor(c1, c2, lrp * i);
      imgSmudge.noFill();
      imgSmudge.strokeWeight(smudgeSize);
      imgSmudge.stroke(inter);
      imgSmudge.point(x + smudgeTranslation.x, y + smudgeTranslation.y);
    }
  }
}

// Initializes the smudge size and resets the smudge canvas, then resizes the original image and smudge canvas to fit the window.
function setupImage() {
  smudgeSize = smudgeSizePreset;
  imgSmudge = null;
  resizeImages();
}

// Resizes the original image to fit the window while maintaining aspect ratio, and updates the smudge canvas accordingly.
function resizeImages() {
  imgCopy = null;
  imgCopy = imgOriginal.get(0, 0, imgOriginal.width, imgOriginal.height);
  let factor = max([(width / imgOriginal.width), (height / imgOriginal.height)]);
  imgCopy.resize(ceil(imgOriginal.width * factor), ceil(imgOriginal.height * factor));
  if (imgSmudge != null) {
    let imgSmudgeTemp = createGraphics(imgCopy.width, imgCopy.height);
    imgSmudgeTemp.image(imgSmudge, 0, 0, imgSmudgeTemp.width, imgSmudgeTemp.height);
    imgSmudge.remove();
    imgSmudge = null;
    imgSmudge = imgSmudgeTemp;
    imgSmudgeTemp = null;
  } else {
    imgSmudge = createGraphics(imgCopy.width, imgCopy.height);
  }
  smudgeTranslation = createVector((imgCopy.width - width) / 2, (imgCopy.height - height) / 2);
}

// Handles dropped image files and loads them directly as p5.Image objects.
function dropFile(file) {
  if (file.type !== 'image') return;

  loadImage(file.data, function (loadedImage) {
    imgOriginal = loadedImage;
    setupImage();
  });
}

// Saves the current canvas as an image file with a timestamped filename.
function saveIMG() {

  // Creates a timestamp string in the format "YYYY-MM-DD_HH-MM-SS" to ensure that each saved image has a unique filename.
  let timestamp = year() + '-' + month() + '-' + day() + '_' + hour() + '-' + minute() + '-' + second();

  // Redraw images if you want the interface to disappear.
  // image(imgCopy, width / 2, height / 2);
  // image(imgSmudge, width / 2, height / 2);

  // Saves the canvas as a PNG image file. 
  save("IMG_" + timestamp + ".png");

  // You can change the format to "jpg" if you prefer JPEG images.
  // save("IMG_" + timestamp + ".jpg");

  // You can save a buffer image seperately.
  // imgSmudge.save("IMG_" + timestamp + ".png");

}
