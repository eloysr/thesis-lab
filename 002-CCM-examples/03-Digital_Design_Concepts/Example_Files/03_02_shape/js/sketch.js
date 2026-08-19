/*
 * © 2026 Schultzschultz. Created for 'Schultzschultz Creative Coding Masterclass'.
 * For educational use only. All rights reserved.
 *
 * ------------------------------
 * Shapes – Create and Manipulate
 * ------------------------------
 * 
 * This file is an example of how to create various shapes in p5.js and manipulate their parameters. 
 * It is demonstrating how different parameters affect the appearance of shapes and lines.
 *
 * What this file does:
 * - Creates a grid of panels, each demonstrating a different shape function
 * – Shows how to use stroke weight, stroke join, and stroke cap to affect the appearance of lines and shapes.
 * - Demonstrates how to use vertex(), bezierVertex(), and curveVertex() to create custom shapes and curves. 
 * - Uses mouse position to control parameters of the shapes, allowing for interactive exploration of how these parameters affect the visuals. 
 */


const cols = 3;
const rows = 3;
let panelWidth;
let panelHeight;
const margin = 20;
const fontSize = 16;
const white = '#ffffff';
const black = '#000000';
const grey = '#606060';

function setup() {
  createCanvas(windowWidth, windowHeight);

  // Calculate initial panel dimensions
  updatePanelSize();

  // Set global text properties
  textFont('monospace');
  textSize(fontSize);
}

function draw() {
  background(0);

  // Draw grid lines to separate panels
  displayPanelDividers();

  // Panel functions for each shape type, using mouse position to control parameters
  panel_point(0, 0, panelWidth, panelHeight);
  panel_rect(1 * panelWidth, 0, panelWidth, panelHeight);
  panel_ellipse(2 * panelWidth, 0, panelWidth, panelHeight);
  panel_strokeWeight(0, 1 * panelHeight, panelWidth, panelHeight);
  panel_strokeJoin(1 * panelWidth, 1 * panelHeight, panelWidth, panelHeight);
  panel_strokeCap(2 * panelWidth, 1 * panelHeight, panelWidth, panelHeight);
  panel_vertex(0, 2 * panelHeight, panelWidth, panelHeight);
  panel_bezierVertex(1 * panelWidth, 2 * panelHeight, panelWidth, panelHeight);
  panel_curveVertex(2 * panelWidth, 2 * panelHeight, panelWidth, panelHeight);
}

// Draw label with two lines of text in the top-left corner of a panel
function drawLabel(x, y, line1, line2) {
  push();
  textAlign(LEFT, TOP);
  noStroke();
  fill(white);
  text(line1, x + margin, y + margin);
  fill(grey);
  text(line2, x + margin, y + margin + fontSize * 1.5);
  pop();
}

// Panel function for point() demonstration, showing a grid of points with stroke weight based on distance to mouse
function panel_point(x, y, w, h) {

  // Normalized mouse position within the cell (0–1)
  let { mx, my } = normMouse(x, y);

  // Create a grid of points within the panel
  let cols_ = ceil(w / 40);
  let rows_ = ceil(h / 40);

  // Draw points with stroke weight based on distance to mouse
  // for (let i = 0; i < cols_; i++) {
  //   for (let j = 0; j < rows_; j++) {

  //     // Calculate point position
  //     let px = x + margin + i * ((w - margin * 2) / (cols_ - 1));
  //     let py = y + margin * 5 + j * ((panelHeight - margin * 6) / (rows_ - 1));

  //     // Distance from mouse to point
  //     let d = dist(mouseX, mouseY, px, py);

  //     // Map distance to stroke weight (closer = thicker)
  //     let strWeight = map(d, 0, 260, 1, 12);
  //     strWeight = constrain(strWeight, 1, 12);

  //     // Set stroke color and weight
  //     stroke(255);
  //     strokeWeight(strWeight);

  //     // Draw the point
  //     point(px, py);
  //   }
  // }

  // Label to display function name and parameter controls
  drawLabel(x, y, 'point()', 'mouseX proximity → size');
}

// Panel function for rect() demonstration, showing a rectangle with width and height based on mouseX and mouseY
function panel_rect(x, y, w, h) {

  // Normalized mouse position within the cell (0–1)
  let { mx, my } = normMouse(x, y);

  // Map mouseX and mouseY to rectangle width and height 
  let rectWidth = map(mx, 0, 1, 20, w * 0.4);
  let rectHeight = map(my, 0, 1, 20, h * 0.4);

  // Set stroke color and weight for the rectangle outline
  stroke(white);
  strokeWeight(2);
  noFill();

  // Set rectangle mode to CENTER so that the rectangle is drawn from its center point
  rectMode(CENTER);

  // The rectangle is drawn centered at (centerX, h * 0.55) with the calculated width and height
  rect(x + w / 2, y + h * 0.55, rectWidth, rectHeight);

  // Label to display function name and parameter controls
  drawLabel(x, y, 'rect()', 'mouseX → width   mouseY → height');
}

// Panel function for ellipse() demonstration, showing an ellipse with width and height based on mouseX and mouseY
function panel_ellipse(x, y, w, h) {

  // Normalized mouse position within the cell (0–1)
  let { mx, my } = normMouse(x, y);

  // Map mouseX and mouseY to ellipse width and height 
  let ellipseWidth = map(mx, 0, 1, 20, w * 0.4);
  let ellipseHeight = map(my, 0, 1, 20, h * 0.4);

  // Set stroke color and weight for the ellipse outline
  stroke(white);
  strokeWeight(2);
  noFill();

  // Set ellipse mode to CENTER so that the ellipse is drawn from its center point
  ellipseMode(CENTER);

  // The ellipse is drawn centered at (centerX, h * 0.55) with the calculated width and height
  ellipse(x + w / 2, y + h * 0.55, ellipseWidth, ellipseHeight);

  // Label to display function name and parameter controls
  drawLabel(x, y, 'ellipse()', 'mouseX → width   mouseY → height');
}

// Panel function for strokeWeight() demonstration, showing a series of horizontal lines with stroke weight and wave effect based on mouseY
function panel_strokeWeight(x, y, w, h) {

  // Normalized mouse position within the cell (0–1)
  let { mx, my } = normMouse(x, y);

  // Calculate the number of steps for the lines, and the vertical spacing between them
  let steps = 15;
  let step = (h - margin * 4.5) / steps;

  // Define minimum and maximum stroke weight for the lines, which will be mapped from the normalized mouse position
  let minWeight = 0.4;
  let maxWeight = 10;

  // Map mouseY to a wave amplitude that will be applied to the lines, creating a dynamic wavy effect that responds to user input
  let wave = map(my, 0, 1, 0, h * 0.2);

  // Set stroke color and properties for the lines
  stroke(white);
  noFill();
  strokeCap(SQUARE);

  // Draw a series of horizontal lines across the panel, with stroke weight and vertical position that vary based on their index in the sequence and the mouse position.
  for (let i = 0; i < steps; i++) {

    // Calculate a normalized value (t) for the current line, which ranges from 0 to 1 across the total number of steps.
    let t = i / (steps - 1);

    // Map the normalized value (t) to a stroke weight for the current line, creating a gradient effect.
    let strWeight = map(t, 0, 1, minWeight, maxWeight);

    // Calculate the Y position for the current line
    let tempY = y + margin * 4 + i * step;

    // Calculate a wave offset for the current line using a sine function, which creates a smooth oscillation effect.
    let waveShift = sin(t * PI) * wave;

    // Set the stroke weight for the current line
    strokeWeight(strWeight);

    // Draw a horizontal line across the panel at the calculated Y position.
    line(x + margin, tempY + waveShift, x + w - margin, tempY - waveShift);
  }

  // Label to display function name and parameter controls
  drawLabel(x, y, 'strokeWeight()', 'mouseY → wave');
}

// Panel function for strokeJoin() demonstration, showing three shapes with different stroke joins and stroke weight based on mouseX
function panel_strokeJoin(x, y, w, h) {

  // Normalized mouse position within the cell (0–1)
  let { mx, my } = normMouse(x, y);

  // Center X position
  let centerY = y + h / 2;

  // Map mouseX to stroke weight for the shape outlines
  let strWeight = map(mx, 0, 1, 2, 25);

  // Size of the shapes, mapped from mouseY
  let shapeSize = h * 0.2;
  let shapeWidth = (w - margin * 2) / 3;

  // Set text properties for line labels

  textAlign(CENTER, TOP);

  // Starting X position for the first shape
  let tempX = x + margin + 0.5 * shapeWidth;

  // Set stroke color and weight for the shape outline
  noFill();
  strokeWeight(strWeight);
  stroke(white);

  // MITER stroke join creates a sharp corner, which can extend beyond the endpoint of the lines if the angle is acute and the stroke weight is large, resulting in a pointed tip at the join
  strokeJoin(MITER);

  // The shape is drawn with three vertices.
  // MITER join will create a sharp point at the top vertex where the two lines meet
  beginShape();
  vertex(tempX - shapeSize * 0.7, centerY + shapeSize * 0.6);
  vertex(tempX, centerY - shapeSize * 0.6);
  vertex(tempX + shapeSize * 0.7, centerY + shapeSize * 0.6);
  endShape();

  // Set fill color and no stroke for the info text 
  noStroke();
  fill(grey);

  // The label is positioned below the shape, with a margin to prevent overlap
  text('MITER', tempX, centerY + shapeSize);

  // Move to the next shape position
  tempX += shapeWidth;

  // Set stroke color and weight for the shape outline
  noFill();
  strokeWeight(strWeight);
  stroke(white);

  // BEVEL stroke join creates a beveled edge at the corner, which cuts off the corner of the shape at a diagonal, resulting in a flattened appearance at the join
  strokeJoin(BEVEL);

  // The shape is drawn with three vertices.
  // BEVEL join will create a flattened edge at the top vertex where the two lines meet, cutting off the point and creating a straight line between the outer edges of the lines
  beginShape();
  vertex(tempX - shapeSize * 0.7, centerY + shapeSize * 0.6);
  vertex(tempX, centerY - shapeSize * 0.6);
  vertex(tempX + shapeSize * 0.7, centerY + shapeSize * 0.6);
  endShape();

  // Set fill color and no stroke for the info text 
  noStroke();
  fill(grey);

  // The label is positioned below the shape, with a margin to prevent overlap
  text('BEVEL', tempX, centerY + shapeSize);

  // Move to the next shape position
  tempX += shapeWidth;

  // Set stroke color and weight for the shape outline
  noFill();
  strokeWeight(strWeight);
  stroke(white);

  // ROUND stroke join creates a rounded edge at the corner, which adds a semicircular curve to the corner of the shape, resulting in a smooth, rounded appearance at the join
  strokeJoin(ROUND);

  // The shape is drawn with three vertices.
  // ROUND join will create a rounded edge at the top vertex where the two lines meet, resulting in a smooth, curved appearance at the join
  beginShape();
  vertex(tempX - shapeSize * 0.7, centerY + shapeSize * 0.6);
  vertex(tempX, centerY - shapeSize * 0.6);
  vertex(tempX + shapeSize * 0.7, centerY + shapeSize * 0.6);
  endShape();

  // Set fill color and no stroke for the info text 
  noStroke();
  fill(grey);

  // The label is positioned below the shape, with a margin to prevent overlap
  text('ROUND', tempX, centerY + shapeSize);

  // Label to display function name and parameter controls
  drawLabel(x, y, 'strokeJoin()', 'mouseX → weight');
}

// Panel function for strokeCap() demonstration, showing lines with different stroke caps and length based on mouseX
function panel_strokeCap(x, y, w, h) {

  // Normalized mouse position within the cell (0–1)
  let { mx, my } = normMouse(x, y);

  // Map mouseX to line length (0–1 mapped to 25–35% of panel width)
  let length_ = map(mx, 0, 1, 25, w * 0.35);

  // Center X position
  let centerX = x + w / 2;

  // stroke weight for the lines  based on dimension of the panel
  let strWeight = min(w, h) * 0.1;

  // Set text properties for line labels
  textAlign(CENTER, TOP);

  // Starting Y position for the first line, with margin from the top
  // let tempY = y + margin * 3 + panelHeight * 0.15;

  let tempY = y + h / 2 - panelHeight * 0.225 + margin;

  // SQUARE stroke cap extends the line with a square, so it appears longer than a BUTT cap at the same length parameter
  strokeCap(SQUARE);
  strokeWeight(strWeight);
  stroke(white);

  // The line is drawn from centerX - length_ to centerX + length_, but the SQUARE caps will extend beyond these points, creating a visual effect of a longer line
  line(centerX - length_, tempY, centerX + length_, tempY);

  // Label for SQUARE stroke cap
  noStroke();
  fill(grey);
  text('SQUARE', centerX, tempY + strWeight * 0.65);

  // Move down for the next line
  tempY += panelHeight * 0.225;

  // PROJECT stroke cap extends the line with a square, so it appears longer than the SQUARE cap at the same length parameter
  strokeCap(PROJECT);
  strokeWeight(strWeight);
  stroke(white);

  // The line is drawn from centerX - length_ to centerX + length_, but the PROJECT caps will extend beyond these points, creating a visual effect of a longer line
  line(centerX - length_, tempY, centerX + length_, tempY);

  // Label for PROJECT stroke cap
  noStroke();
  fill(grey);
  text('PROJECT', centerX, tempY + strWeight * 0.65);

  // Move down for the next line
  tempY += panelHeight * 0.225;

  // ROUND stroke cap extends the line with a semicircle, so it appears longer than the others at the same length parameter
  strokeCap(ROUND);
  strokeWeight(strWeight);
  stroke(white);

  // The line is drawn from centerX - length_ to centerX + length_, but the ROUND caps will extend beyond these points, creating a visual effect of a longer line
  line(centerX - length_, tempY, centerX + length_, tempY);

  // Label for ROUND stroke cap
  noStroke();
  fill(grey);
  text('ROUND', centerX, tempY + strWeight * 0.65);

  // Label to display function name and parameter controls
  drawLabel(x, y, 'strokeCap()', 'mouseX → length');
}

// Panel function for vertex() demonstration, showing a shape with a variable number of vertices based on mouseX
function panel_vertex(x, y, w, h) {

  // Normalized mouse position within the cell (0–1)
  let { mx, my } = normMouse(x, y);

  // Calculate the center of the panel for positioning the shape
  let centerX = x + w / 2;
  let centerY = y + h / 2 + margin * 0.5;

  // Calculate the radius for the shape, based on the smaller dimension of the panel
  let radians = min(w, h) * 0.25;

  // Map mouseX to the number of vertices for the shape (3–12)
  let sides = floor(map(mx, 0, 1, 3, 12));

  // Set stroke color and weight for the shape outline
  stroke(white);
  strokeWeight(2);
  noFill();

  // Draw a shape with the specified number of vertices, evenly spaced around a circle
  beginShape();
  for (let i = 0; i < sides; i++) {

    // Calculate the angle for the current vertex, starting from the top (TWO_PI / sides * i - HALF_PI)
    let angle = TWO_PI / sides * i - HALF_PI;

    // Calculate the x and y position of the vertex using cosine and sine functions, multiplied by the radius (radians) and offset by the center position
    let x = centerX + cos(angle) * radians;
    let y = centerY + sin(angle) * radians;

    // Add the vertex to the shape
    vertex(x, y);
  }
  // Close the shape to connect the last vertex back to the first
  endShape(CLOSE);

  // Set fill color and no stroke for the info text
  noStroke();
  fill(grey);

  // Set text properties for the label
  textAlign(CENTER, TOP);

  // The label is positioned below the shape, with a margin to prevent overlap
  text(sides + ' VERTICES', centerX, centerY + radians * 1.25);

  // Label to display function name and parameter controls
  drawLabel(x, y, 'vertex()', 'mouseX → corners');
}

// Panel function for vertex() demonstration, showing a shape with a variable number of vertices based on mouseX
function panel_bezierVertex(x, y, w, h) {

  // Normalized mouse position within the cell (0–1)
  let { mx, my } = normMouse(x, y);

  // Calculate the center of the panel for positioning the shape
  let centerX = x + w / 2;
  let centerY = y + h / 2;

  // Map mouseX and mouseY to control point offsets for the bezier curve
  let xOffset = map(mx, 0, 1, w * 0.25, -w * 0.25);
  let yOffset = map(my, 0, 1, h * 0.25, -h * 0.25);

  // Define the start and end points of the bezier curve, positioned within the panel with some margin
  let x0 = x + margin * 1.5;
  let y0 = centerY + h * 0.3;
  let x3 = x + w - margin * 1.5;
  let y3 = centerY - h * 0.2;

  // Calculate the control points for the bezier curve.
  // The first control point (cp1) is positioned along the horizontal line between the start and end points, with a fixed vertical position. 
  // The second control point (cp2) is offset from the center of the panel based on the mouse position, creating a dynamic curve that responds to user input.
  let cp1x = lerp(x0, x3, 0.447716);
  let cp1y = y0;
  let cp2x = centerX - xOffset;
  let cp2y = centerY - yOffset + h * 0.08;

  // Set stroke color and weight for the bezier curve
  stroke(white);
  strokeWeight(2);
  noFill();

  // Draw the bezier curve using the defined start point, control points, and end point
  beginShape();
  vertex(x0, y0);
  bezierVertex(cp1x, cp1y, cp2x, cp2y, x3, y3);
  endShape();

  // Display control points as small circles and lines for visual reference
  stroke(grey);
  strokeWeight(2);
  line(x0, y0, cp1x, cp1y);
  line(x3, y3, cp2x, cp2y);
  noStroke();
  fill(grey);
  ellipse(cp1x, cp1y, 5);
  ellipse(cp2x, cp2y, 5);

  // Display the start and end points of the bezier curve as small circles
  fill(white);
  noStroke();
  ellipse(x0, y0, 5);
  ellipse(x3, y3, 5);

  // Label to display function name and parameter controls
  drawLabel(x, y, 'bezierVertex()', 'mouse → control points');
}

// Panel function for curveVertex() demonstration, showing a curve with control points influenced by mouse position
function panel_curveVertex(x, y, w, h) {

  // Normalized mouse position within the cell (0–1)
  let { mx, my } = normMouse(x, y);

  // Vertical center of the panel, slightly below middle to leave room for label
  let centerY = y + h * 0.5;

  // 6 control points: index 0 and 5 are phantom points (not drawn).
  // They define the tangent direction at the curve endpoints.
  // Indices 2 and 3 are mouse-controlled.
  let numPts = 6;
  let pts = [];
  for (let i = 0; i < numPts; i++) {
    let t = i / (numPts - 1);
    pts.push({
      x: x + margin + t * (w - margin * 2),
      y: centerY + height * 0.1
    });
  }

  // mouseX controls the Y of point 2, mouseY controls the Y of point 3
  pts[2].y = map(mx, 0, 1, y + margin * 4, y + h - margin * 1.5);
  pts[3].y = map(my, 0, 1, y + margin * 4, y + h - margin * 1.5);

  // Draw guide lines between visible control points
  stroke(grey);
  strokeWeight(2);
  for (let i = 1; i < numPts - 2; i++) {
    line(pts[i].x, pts[i].y, pts[i + 1].x, pts[i + 1].y);
  }

  // Draw the Catmull-Rom curve through all control points
  stroke(white);
  strokeWeight(2);
  noFill();
  beginShape();
  for (let pt of pts) {
    curveVertex(pt.x, pt.y);
  }
  endShape();

  // Draw visible control points (skip phantom first and last)
  noStroke();
  for (let i = 1; i < numPts - 1; i++) {
    // Mouse-controlled points appear white, fixed points appear grey
    fill(i === 2 || i === 3 ? white : grey);
    ellipse(pts[i].x, pts[i].y, 6);
  }

  // Label to display function name and parameter controls
  drawLabel(x, y, 'curveVertex()', 'mouseX → pt.2   mouseY → pt.3');
}

// Draw lines to separate the panels
function displayPanelDividers() {
  stroke(32);
  strokeWeight(1);
  // Vertical lines 
  for (let c = 1; c < cols; c++) line(c * panelWidth, 0, c * panelWidth, height);
  // Horizontal lines
  for (let r = 1; r < rows; r++) line(0, r * panelHeight, width, r * panelHeight);
}

// Normalized mouse position within a panel (0–1)
function normMouse(x, y) {
  return {
    mx: constrain((mouseX - x) / panelWidth, 0, 1),
    my: constrain((mouseY - y) / panelHeight, 0, 1)
  };
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  updatePanelSize();
}

function updatePanelSize() {
  // Update panel dimensions based on current canvas size
  panelWidth = width / cols;
  panelHeight = height / rows;
}