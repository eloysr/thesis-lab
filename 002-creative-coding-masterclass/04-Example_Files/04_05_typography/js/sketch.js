/*
 * © 2026 Schultzschultz. Created for 'Schultzschultz Creative Coding Masterclass'.
 * For educational use only. All rights reserved.
 * 
 * ------------------------------------------
 * Typography – Import Fonts and Display Text
 * ------------------------------------------
 * 
 * This file is an example of how to import and use custom fonts in a p5.js sketch, 
 * as well as how to display text with various properties such as size, alignment, and line spacing.
 *
 * What this file does:
 * - It loads a custom font from the 'assets' folder using the preload function.
 * - It sets up a canvas that fills the browser window.
 * - It displays a multi-line text string in the center of the canvas using the loaded font.
 * - It includes functionality to change the font to a random system font every 20 frames (commented out).
 * - It includes a function to draw a red rectangle around the text based on its dimensions (commented out).
 * - It allows the user to modify the displayed text by typing and using backspace, delete, enter, and space keys.
 * 
 * Note: Make sure to place a font file named "CourierPrime-Regular.ttf" in the 'assets' folder of your project for this code to work.  
 * You can replace it with any font file (.ttf, .otf) you have, just update the path in the preload function accordingly.
 */


let myFont;
let fontSize = 72;
let fontLeading = 84;
let myText = "A little knowledge\ncan go a long way.";
let systemFonts = [
  "Helvetica",
  "Arial",
  "Times New Roman",
  "Georgia",
  "Courier New",
  "Verdana",
  "Trebuchet MS",
  "Palatino",
  "Garamond",
  "Impact"
];

// Preload function to load the font before the sketch starts.
function preload() {
  // .ttf oder .otf
  myFont = loadFont("assets/CourierPrime-Regular.ttf");
}

function setup() {
  createCanvas(windowWidth, windowHeight);
}

function draw() {

  background(0);

  // Display the text box.
  // displayTextBox();

  // Function to display the text on the canvas with the specified properties.
  displayText();

  // Change the font every 20 frames.
  if (frameCount % 20 === 0) {
    // Change the font to a random system font from the list.
    // randomSystemFont();
  }

  // Function to display information about the text.
  displayInfo();
}

// Keeps the canvas size in sync with the browser window.
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

// Function to display the text on the canvas with the specified properties.
function displayText() {

  // Set the font for the text.
  textFont(myFont);
  // textFont('Helvetica'); // Alternative: Use a system font.

  // Set the font size for the text in pixel.
  textSize(fontSize);

  // Set the text horizontally and vertically alignment.
  textAlign(CENTER, CENTER);
  // textAlign(LEFT, TOP);
  // textAlign(RIGHT, BOTTOM);

  // Set the line spacing for the text in pixel.
  textLeading(fontLeading);

  // Set the fill color for the text.
  fill(255);

  // Display the text on the canvas.
  text(myText, width / 2, height / 2);
}

// Function to display a red rectangle around the text, based on its dimensions.
function displayTextBox() {

  // Set font and size first so measurements are accurate.
  textFont(myFont);
  textSize(fontSize);
  textLeading(fontLeading);

  // Split the text into lines based on newline characters.
  let lines = myText.split('\n');

  // The width of the box is the maximum width of any line of text.
  let boxWidth = max(lines.map(l => textWidth(l)));

  // The height of the box is the ascent plus descent of the font, plus additional space for each line of text.
  let boxHeight = textAscent() + textDescent() + (lines.length - 1) * fontLeading;

  // Set the fill color for the rectangle and draw it centered around the text.
  fill(255, 0, 0);
  rectMode(CENTER);
  rect(width / 2, height / 2, boxWidth, boxHeight);

}

// Function to randomly select a system font from the list.
function randomSystemFont() {
  myFont = random(systemFonts);
}

// Function to display information about the image.
function displayInfo() {

  // Returns the number of characters in the text, including spaces and newline characters.
  let numChars = myText.length;

  // Returns the character at the specified index (0-based).
  let charAtLastIndex = myText.charAt(numChars - 1);

  // Returns the number of lines in the text.
  let numLines = myText.split('\n').length;

  // Returns the width of the text in pixels.
  let myTextWidth = textWidth(myText);

  // Returns the ascent and descent of the font in pixels.
  let myTextAscent = textAscent(myText);
  let myTextDescent = textDescent(myText);

  // check if myFont is a p5.TextObject (custom font) or a string (system font) and get the font name accordingly.
  let fontName = myFont instanceof p5.Font ? myFont.font.names.fontFamily.en : myFont;

  // Set text properties
  fill(255);
  noStroke();
  textSize(16);
  textFont('monospace');
  textAlign(LEFT, TOP);

  // Display the image dimensions in the top-left corner of the canvas.
  text('Number of characters: ' + numChars, 10, 10);
  text('Last character: ' + charAtLastIndex, 10, 30);
  text('Number of lines: ' + numLines, 10, 50);
  text('Text width: ' + myTextWidth.toFixed(2) + ' px', 10, 70);
  text('Text ascent: ' + myTextAscent.toFixed(2) + ' px', 10, 90);
  text('Text descent: ' + myTextDescent.toFixed(2) + ' px', 10, 110);
  text('Font: ' + fontName, 10, 130);
}

// Function to handle key release events accordingly.
function keyReleased() {
  // Handle backspace, delete, enter, and space keys to modify the text.
  if (keyCode === BACKSPACE || keyCode === DELETE) {
    myText = myText.slice(0, -1);
    return;
  } else if (keyCode === ENTER || keyCode === RETURN) {
    myText += "\n";
    return;
  } else if (key === " ") {
    myText += " ";
    return;
  } else {
    myText += key;
  }
}