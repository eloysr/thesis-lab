/*
 * © 2026 Schultzschultz. Created for 'Schultzschultz Creative Coding Masterclass'.
 * For educational use only. All rights reserved.
 *
 * ------------------------------------------
 * Typography - Contours, Paths, and Points
 * ------------------------------------------
 * 
 * This file is an example of how to visualize text in different ways using a custom font. 
 * It demonstrates how to extract and display contours, paths, and points from a given text.
 *
 * What this file does:
 * - It loads a custom font and displays the letter "R" in three different modes: contours, paths, and points.
 * - The user can switch between these modes by clicking the mouse.
 * - The user can change the displayed letter by pressing any key on the keyboard.
 * - The density of points and the simplification of contours can be adjusted by moving the mouse horizontally and vertically, respectively.
 * 
 * Note: Make sure to place a font file named "CourierPrime-Regular.ttf" in the 'assets' folder of your project for this code to work.  
 * You can replace it with any font file (.ttf, .otf) you have, just update the path in the preload function accordingly.
 */

let myFont;
let fontSize = 1000;
let myText = "R";
let activeMode = 0;
const modes = ["contours", "paths", "points"];
let dataInfo = "";

async function setup() {
  // Load the custom font asynchronously
  myFont = await loadFont("assets/CourierPrime-Regular.ttf");
  createCanvas(windowWidth, windowHeight);
}

function draw() {
  background(0);

  // Display the active mode and its corresponding text representation
  if (modes[activeMode] === "contours") {
    displayContours();
  } else if (modes[activeMode] === "paths") {
    displayPaths();
  } else {
    displayPoints();
  }

  // Function to display information about the text.
  displayInfo();
}

// Keeps the canvas size in sync with the browser window.
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

function displayContours() {

  // Set text properties
  textFont(myFont);
  textSize(fontSize);
  textAlign(CENTER, CENTER);

  // Set stroke color and weight for the contours
  stroke(0, 255, 255);
  strokeWeight(2);
  noFill();

  // sampleFactor controls the density of points sampled along the text contours
  let sampleFactor = map(mouseX, 0, width, 0.01, 0.2);

  // simplifyThreshold controls how much the contours are simplified.
  let simplifyThreshold = map(mouseY, 0, height, 0.01, 0.1);

  // Get the contours of the text using the custom font
  const contours = myFont.textToContours(myText, width / 2, height / 2, { sampleFactor: sampleFactor, simplifyThreshold: simplifyThreshold });

  // Draw each contour
  for (const contour of contours) {
    beginShape();
    for (const pt of contour) {
      vertex(pt.x, pt.y);

    }
    endShape(CLOSE);
  }

  // Update the dataInfo string 
  dataInfo = "";
  dataInfo += 'Sample factor: ' + sampleFactor.toFixed(3);
  dataInfo += '\nSimplify threshold: ' + simplifyThreshold.toFixed(3);
  dataInfo += '\nNumber of contours: ' + contours.length;
  for (let i = 0; i < contours.length; i++) {
    dataInfo += '\nContour ' + (i + 1) + ' points: ' + contours[i].length;
  }
}

function displayPaths() {

  // Set text properties
  textFont(myFont);
  textSize(fontSize);
  textAlign(CENTER, CENTER);

  // Set stroke color and weight for the contours
  stroke(255, 128, 0);
  strokeWeight(2);
  noFill();

// Get the path commands of the text using the custom font
  const pathCommands = myFont.textToPaths(myText, width / 2, height / 2);

  // Draw the path commands
  beginShape();
  for (let i = 0; i < pathCommands.length; i++) {

    // Each command is an array where the first element is the command type (M, L, Q, C, Z) 
    // and the subsequent elements are the coordinates.
    const cmd = pathCommands[i];
    const type = cmd[0];

    // Handle each command type accordingly
    switch (type) {
      case 'M': {
        // Move to (start a new contour)
        const x = cmd[1];
        const y = cmd[2];
        endContour(); // In case we were already drawing
        beginContour();
        vertex(x, y);
        break;
      }
      case 'L': {
        // Line to
        const x = cmd[1];
        const y = cmd[2];
        vertex(x, y);
        break;
      }
      case 'Q': {
        // Quadratic bezier
        const cx = cmd[1];
        const cy = cmd[2];
        const x = cmd[3];
        const y = cmd[4];
        bezierOrder(2);
        bezierVertex(cx, cy);
        bezierVertex(x, y);
        break;
      }
      case 'C': {
        // Cubic bezier
        const cx1 = cmd[1];
        const cy1 = cmd[2];
        const cx2 = cmd[3];
        const cy2 = cmd[4];
        const x = cmd[5];
        const y = cmd[6];
        bezierOrder(3);
        bezierVertex(cx1, cy1);
        bezierVertex(cx2, cy2);
        bezierVertex(x, y);
        break;
      }
      case 'Z': {
        // Close path
        endContour(CLOSE);
        beginContour();
        break;
      }
    }
  }
  endContour();
  endShape();

  // Display the command type above the point
  for (let i = 0; i < pathCommands.length; i++) {
    const cmd = pathCommands[i];
    const type = cmd[0];
    textSize(14);
    fill(255, 128, 0);
    noStroke();
    text(type, cmd[1], cmd[2] - 15);
  }

  //Update the dataInfo string with the number of path commands
  dataInfo = "";
  dataInfo += 'Number of path commands: ' + pathCommands.length;
}

function displayPoints() {

    // Set text properties
  textFont(myFont);
  textSize(fontSize);
  textAlign(CENTER, CENTER);

   // Set stroke color and weight for the contours
  stroke(255, 110, 210, 180);
  strokeWeight(2);
  fill(255, 110, 210);

  // sampleFactor controls the density of points sampled along the text contours
  let sampleFactor = map(mouseX, 0, width, 0.01, 0.2);

  // simplifyThreshold controls how much the contours are simplified.
  let simplifyThreshold = map(mouseY, 0, height, 0.01, 0.1);

  // Get the points of the text using the custom font
  const points = myFont.textToPoints(myText, width / 2, height / 2, { sampleFactor: sampleFactor, simplifyThreshold: simplifyThreshold });

// Draw each point and its angle information
  for (const pt of points) {

    // Draw a small circle at the point's location
    angleMode(RADIANS);

    const angle = typeof pt.angle === "number" ? pt.angle : pt.alpha;
    const length = 12;

    circle(pt.x, pt.y, 4.25);
    line(
      pt.x,
      pt.y,
      pt.x + cos(angle) * length,
      pt.y + sin(angle) * length
    );
  }

  // Update the dataInfo string with the number of points and their angle information
  dataInfo = "";
  dataInfo += 'Sample factor: ' + sampleFactor.toFixed(3);
  dataInfo += '\nSimplify threshold: ' + simplifyThreshold.toFixed(3);
  dataInfo += '\nNumber of points: ' + points.length;

}

function displayInfo() {

  const functionName =
    modes[activeMode] === "contours"
      ? "textToContours()"
      : modes[activeMode] === "paths"
        ? "textToPaths()"
        : "textToPoints()";

  // Set text properties
  fill(255);
  noStroke();
  textSize(16);
  textFont('monospace');
  textAlign(LEFT, TOP);

  let explanation;
  if (modes[activeMode] === "contours") {
    explanation = "Returns an array of contours,\nwhere each contour is an array of points."
  } else if (modes[activeMode] === "paths") {
    explanation = "Returns an array of path commands\nincluding point type and coordinates";
  } else {
    explanation = "returns an array of points along the text shape, \nwith optional angle information for direction.";
  }

  text(functionName + "\n\n" + explanation + "\n\n" + dataInfo, 10, 10);

}

function mouseReleased() {
  activeMode = (activeMode + 1) % modes.length;
}

function keyReleased() {
  myText = key.toUpperCase();
}
