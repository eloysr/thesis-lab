/*
 * © 2026 Schultzschultz. Created for 'Schultzschultz Creative Coding Masterclass'.
 * For educational use only. All rights reserved.
 *
 * --------------------
 * Export / Import JSON
 * --------------------
 *
 * This file is a demonstration of how to implement JSON export and import functionality
 * in a p5.js sketch. It allows you to save the current state of a grid-based pattern 
 * as a JSON file and load it back later.
 *
 * What this file does:
 * - Defines a grid of cells, each of which can contain one of several shapes.
 * - Allows the user to click on cells to cycle through different shapes.
 * - Provides functions to export the current grid state as a JSON file.
 * - Provides functions to import a grid state from a JSON file.
 * - Includes a reset function to clear the grid back to its initial state.
*/


// Grid configuration
let gridSize = 100;    // Size of each grid cell in pixels
let gridCols = 5;     // Number of columns in the grid
let gridRows = 5;     // Number of rows in the grid

// 2D array to store which shape is in each grid cell
// shapes[column][row] = shapeIndex (0-8)
let shapes = [];

// Array of all available shape types
// Each shape has an index (0-8) used in the shapes array
let shapeTypes = [
  'quadrat',           // 0: square
  'kreis',             // 1: circle
  'dreieck',           // 2: triangle
  'cross',             // 3: cross/plus sign
  'quartercircle0',    // 4: quarter circle at 0°
  'quartercircle90',   // 5: quarter circle rotated 90°
  'quartercircle180',  // 6: quarter circle rotated 180°
  'quartercircle270',  // 7: quarter circle rotated 270°
  'blank'              // 8: empty/no shape
];


// Runs once when the sketch starts
function setup() {
  // Default full-window canvas.
  createCanvas(windowWidth, windowHeight);

  // Initialize the grid with all cells set to blank
  resetGrid();
}

// Runs continuously (frame by frame)
function draw() {
  // Clear the frame with a black background
  background(0);

  push();

  // Center the grid on the canvas 
  translate(width / 2 - gridCols * gridSize / 2, height / 2 - gridRows * gridSize / 2);

  // Loop through each column
  for (let i = 0; i < gridCols; i++) {
    // Loop through each row
    for (let j = 0; j < gridRows; j++) {
      // Calculate position of this grid cell
      let x = i * gridSize;
      let y = j * gridSize;

      // Draw the grid cell outline
      noFill();           // No fill color
      stroke(64);         // Dark gray outline
      strokeWeight(1);    // Thin line
      rect(x, y, gridSize, gridSize);

      // Draw the shape inside this cell
      fill(255);          // White color for shapes
      noStroke();         // No outline for shapes
      drawShape(x, y, gridSize, shapes[i][j]);
    }
  }

  pop();

  // Draw the info text at the bottom left corner of the canvas
  displayInfo();
}

// Draws a shape at the given position based on the shape index

function drawShape(x, y, size, shapeIndex) {
  // Parameters:
  //   x, y: top-left corner of the grid cell
  //   size: size of the grid cell
  //   shapeIndex: which shape to draw (0-8)

  push();

  // Move origin to the center of the cell
  translate(x + size / 2, y + size / 2);

  // Make shape 95% of cell size to leave some padding
  let shapeSize = size * 0.95;

  // Draw different shapes based on the index
  switch (shapeIndex) {
    case 0: // Square
      rectMode(CENTER);  // Draw rectangle from center point
      rect(0, 0, shapeSize, shapeSize);
      break;
    case 1: // Circle
      circle(0, 0, shapeSize);
      break;
    case 2: // Triangle (pointing up)
      triangle(0, -shapeSize / 2, -shapeSize / 2, shapeSize / 2, shapeSize / 2, shapeSize / 2);
      break;
    case 3: // Cross (plus sign)
      rectMode(CENTER);
      let crossWidth = shapeSize * 0.33;
      rect(0, 0, crossWidth, shapeSize);    // Vertical bar
      rect(0, 0, shapeSize, crossWidth);     // Horizontal bar
      break;
    case 4: // Quarter circle at 0° (top-left)
      arc(-shapeSize / 2, -shapeSize / 2, shapeSize * 2, shapeSize * 2, 0, HALF_PI);
      break;
    case 5: // Quarter circle at 90° (top-right)
      arc(shapeSize / 2, -shapeSize / 2, shapeSize * 2, shapeSize * 2, HALF_PI, PI);
      break;
    case 6: // Quarter circle at 180° (bottom-right)
      arc(shapeSize / 2, shapeSize / 2, shapeSize * 2, shapeSize * 2, PI, PI + HALF_PI);
      break;
    case 7: // Quarter circle at 270° (bottom-left)
      arc(-shapeSize / 2, shapeSize / 2, shapeSize * 2, shapeSize * 2, PI + HALF_PI, TWO_PI);
      break;
    case 8: // Blank (no shape)
      // Draw nothing
      break;
  }

  pop();
}

// Draw info text at bottom left
function displayInfo() {

  fill(255);
  noStroke();
  textFont('monospace');
  textSize(16);
  textAlign(LEFT, BOTTOM);

  let infoX = 30;
  let infoY = height - 30;
  let lineHeight = 25;

  text('Controls:', infoX, infoY - lineHeight * 3);
  text('Click grid cells to cycle through shapes', infoX, infoY - lineHeight * 2);
  text('Import/Export to save and load patterns', infoX, infoY - lineHeight);
  text('Reset to clear the grid', infoX, infoY);
}

// Called automatically when the mouse is clicked
// Cycles through shapes when clicking on a grid cell
function mousePressed() {
  // Calculate the offset of the centered grid
  let offsetX = width / 2 - gridCols * gridSize / 2;
  let offsetY = height / 2 - gridRows * gridSize / 2;

  // Convert mouse position to grid coordinates
  let gridX = floor((mouseX - offsetX) / gridSize);
  let gridY = floor((mouseY - offsetY) / gridSize);

  // Check if click is inside the grid
  if (gridX >= 0 && gridX < gridCols && gridY >= 0 && gridY < gridRows) {
    // Cycle to the next shape (wraps around using modulo)
    // Example: if current shape is 8, next will be (8+1) % 9 = 0
    shapes[gridX][gridY] = (shapes[gridX][gridY] + 1) % shapeTypes.length;
  }
}

// Keeps the canvas size in sync with the browser window.
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

// Exports the current grid state as a JSON file
// This allows you to save your pattern and load it later
function exportJSON() {
  // Create an object containing all the grid data
  let data = {
    gridSize: gridSize,
    gridCols: gridCols,
    gridRows: gridRows,
    shapes: shapes
  };

  // Convert the data object to a formatted JSON string
  // The "2" parameter adds nice indentation for readability
  let json = JSON.stringify(data, null, 2);

  // Create a download link and trigger the download
  let blob = new Blob([json], { type: 'application/json' });
  let url = URL.createObjectURL(blob);
  let a = document.createElement('a');
  a.href = url;
  a.download = 'grid-pattern.json';  // Default filename
  a.click();  // Trigger the download
  URL.revokeObjectURL(url);  // Clean up the temporary URL
}

// Imports a grid state from a JSON file
// Allows you to load a previously saved pattern
function importJSON() {
  // Create an invisible file input element
  let input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json';  // Only accept JSON files
  input.style.display = 'none';  // Make it invisible
  
  // Add to DOM (required for some browsers)
  document.body.appendChild(input);

  // Set up what happens when a file is selected
  input.addEventListener('change', function (event) {
    let file = event.target.files[0];  // Get the selected file
    
    if (file) {
      // FileReader allows us to read the file contents
      let reader = new FileReader();

      // Add error handler
      reader.onerror = function(e) {
        console.error('Error reading file:', e);
        alert('Error reading file.');
      };

      // Set up what happens when the file is loaded
      reader.onload = function (e) {
        try {
          // Parse the JSON text into a JavaScript object
          let data = JSON.parse(e.target.result);

          // Validate imported data
          if (!data.gridSize || !data.gridCols || !data.gridRows || !data.shapes) {
            alert('Invalid JSON format. Missing required fields.');
            return;
          }

          // Load all the values from the file
          gridSize = data.gridSize;
          gridCols = data.gridCols;
          gridRows = data.gridRows;
          shapes = data.shapes;

        } catch (error) {
          // If the JSON is invalid, show an error
          console.error('Error loading JSON file:', error);
          alert('Error loading file. Please check the JSON format.');
        }
      };

      // Start reading the file as text
      reader.readAsText(file);
    }
    
    // Clean up: remove the input element from DOM
    document.body.removeChild(input);
  });

  // Trigger the file selection dialog
  input.click();
}

// Resets the grid to its initial state
// All cells will be set to blank (no shape)
function resetGrid() {
  shapes = [];  // Clear the shapes array

  // Initialize the 2D array
  // Loop through each column
  for (let i = 0; i < gridCols; i++) {
    shapes[i] = [];  // Create a new array for this column

    // Loop through each row in this column
    for (let j = 0; j < gridRows; j++) {
      // Set to blank (last index in shapeTypes array)
      shapes[i][j] = shapeTypes.length - 1;  // 9 - 1 = 8 (blank)
    }
  }
}