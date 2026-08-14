/*
 * © 2026 Schultzschultz. Created for 'Schultzschultz Creative Coding Masterclass'.
 * For educational use only. All rights reserved.
 *
 * ---------------------
 * Matrix Transformation
 * ---------------------
 * 
 * This file is an example of how to use matrix transformations in p5.js. 
 * push() and pop() are used to save and restore the current drawing state, allowing for isolated transformations that do not affect other parts of the drawing.
 * Note that the transformations are applied in sequence, meaning that the order of translate(), rotate(), and scale() matters and will affect the final output.
 * 
 * What this file does:
 * - Draw three rectangles that are transformed based on the mouse position.
 * - The first rectangle is drawn after a translate() transformation.
 * – The second rectangle is drawn after a rotate() transformation.
 * – The third rectangle is drawn after a scale() transformation.
 * - The transformations are controlled by the mouse's X and Y positions.
 * - The user can also click and drag to move the rectangles around the canvas.
 */


const color1 = '#32c0ff';
const color2 = '#ff32ff';
const color3 = '#32ff80';
const rectSize = 300;

let xOffset = 0;
let yOffset = 0;

function setup() {
  // Create a canvas that fills the entire browser window.
  createCanvas(windowWidth, windowHeight);

  xOffset = width / 2;
  yOffset = height / 2;
}

function draw() {

  // Set the background color to black.
  background(0);

  // Map the mouse's X position to an angle between -PI and PI, and the Y position to a scaling factor between 0.2 and 2.5.
  // Note that the angle is in radians.
  let angle = map(mouseX, 0, width, -PI, PI);
  let scaling = map(mouseY, 0, height, 0.2, 2.5);

  // Draw a crosshair at the current translate origin for reference.
  displayCrosshair(xOffset, yOffset, 255);

  // Use push() to save the current drawing state before applying transformations.
  push();

  // Use translate() to move the origin. 
  translate(xOffset, yOffset);

  // Draw the first rectangle with the first color, and label it "translate".
  displayRect(color1);
  drawLabel("translate", -rectSize / 2, -rectSize / 2, color1);

  // Apply the rotate() transformation using the angle calculated from the mouse's X position.
  rotate(angle);

  // Draw the second rectangle with the second color, and label it "rotate".
  displayRect(color2);
  drawLabel("rotate", -rectSize / 2, -rectSize / 2, color2);

  // Apply the scale() transformation using the scaling factor calculated from the mouse's Y position.
  scale(scaling);

  // Draw the third rectangle with the third color, and label it "scale".
  displayRect(color3);
  drawLabel("scale", -rectSize / 2, -rectSize / 2, color3);

  // Use pop() to restore the previous drawing state, so that any transformations applied after this point will not affect the rectangles drawn above.
  pop();

  // Display the transformation information on the canvas, showing the current angle and scaling factor.
  displayInfo(angle, scaling, xOffset, yOffset);
}

// Draw a label with the specified text, position, and color.
function drawLabel(txt, x, y, col) {

  // Use push() and pop() to ensure that the text styling does not affect other parts of the drawing.
  push();

  // Apply the specified color and styling for the text label.
  noStroke();
  fill(col);
  textAlign(LEFT, BOTTOM);
  textSize(16);
  textFont('monospace');

  // Draw the text label at the specified position, slightly above the rectangle to avoid overlap.
  text(txt, x, y - 5);

  // Restore the previous drawing state after drawing the label.
  pop();
}

// Draw a rectangle centered at the origin with the specified color and size.
function displayRect(c) {

  // Use push() and pop() to ensure that the text styling does not affect other parts of the drawing.
  push();

  // Apply the specified color and styling for the rectangle.
  noFill();
  strokeWeight(2);
  stroke(c);

  // Set the rectangle mode to CENTER, so that rectangles are drawn from their center point.
  rectMode(CENTER);

  // Draw the rectangle at the origin (which has been translated to the center of the canvas), with the specified size.
  rect(0, 0, rectSize, rectSize);

  // Restore the previous drawing state after drawing the label.
  pop();
}

// Draw a crosshair at the specified position with the given color.
function displayCrosshair(x, y, col) {

  // Use push() and pop() to ensure that the text styling does not affect other parts of the drawing.
  push();

  // Apply the specified color and styling for the crosshair.
  noFill();
  stroke(col);

  // Draw two lines intersecting at the specified position to create a crosshair.
  line(x - 20, y, x + 20, y);
  line(x, y - 20, x, y + 20);

  // Restore the previous drawing state after drawing the label.
  pop();
}

// Display the transformation information on the canvas, showing the current angle and scaling factor.
function displayInfo(a, s, tx, ty) {

  // Set the text alignment to the top-left corner and apply the specified font size and styling for the information text.
  textAlign(LEFT, TOP);
  textSize(16);
  textFont('monospace');
  noStroke();

  // Create an array of entries to display the transformation information, including the label, color, and value for each transformation.
  let entries = [
    { label: "push()", col: 255, val: "" },
    { label: "  translate()", col: color1, val: nf(tx, 1, 0) + ", " + nf(ty, 1, 0) },
    { label: "  rotate()   ", col: color2, val: nf(degrees(a), 1, 1) + "°" },
    { label: "  scale()    ", col: color3, val: nf(s, 1, 2) },
    { label: "pop()", col: 255, val: "" },
  ];

  // Loop through the entries and display each one on the canvas with the specified color and value.
  for (let i = 0; i < entries.length; i++) {

    // Get the current entry from the array and apply the specified color and styling for the text.
    let e = entries[i];

    // Set the fill color for the text based on the entry's color property.
    fill(e.col);

    // Display the label and value for the current entry, with the value shown after an arrow if it exists.
    text(e.label + (e.val ? "  →  " + e.val : ""), 20, 24 * (i + 1)); 
  }

}

// Update the translation offsets based on the mouse movement when dragging, allowing the user to move the rectangles around the canvas.
function mouseDragged() {
  xOffset += movedX;
  yOffset += movedY;
}

// Keeps the canvas size in sync with the browser window.
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}