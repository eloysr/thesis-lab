/*
 * © 2026 Schultzschultz. Created for 'Schultzschultz Creative Coding Masterclass'.
 * For educational use only. All rights reserved.
 * 
 * -----------------------------------------------
 * P5.speech.js – Speech regognition and synthesis
 * -----------------------------------------------
 * 
 * This file is a demonstration of using the p5.speech.js library to create a visual 
 * representation of spoken words. 
 *
 * What this file does:
 * - Listens for speech input and recognizes spoken words in real-time.
 * - Displays each recognized word as a stylized text object on the canvas.
 * - Each word object has a random position, rotation, color, and a lifespan after 
 *   which it disappears. A "wiggle" animation makes them more dynamic.
 * - Allows clearing the screen with specific voice commands ("clear" or "löschen").
 *  
 * Note: Make sure to load the p5.speech.js library in your HTML file.
 * 
 * For more information on p5.speech.js, see: https://idmnyu.github.io/p5.js-speech/
 */


// Speech Recognition
const speechLanguage = 'en-EN';   // Language code (en-US for English, de-DE for German, etc.)
const clearCommands = ['clear'];  // Voice commands to clear the screen

// Timing
const minFramesBetweenWords = 15;  // Minimum frames between creating new word objects (15 frames ≈ 0.25s at 60fps)

// Word Object Appearance
const fontPath = "assets/Barlow-Bold.ttf";
const fontSizeShort = 256;  // Font size for words with 5 or fewer letters
const fontSizeLong = 192;   // Font size for words with more than 5 letters

// Position
const positionRangeX = 50;   // Random offset range from center (horizontal)
const positionRangeY = 50;   // Random offset range from center (vertical)

// Rotation & Wiggle
const rotationRange = Math.PI / 4;   // Maximum rotation angle difference between words (45 degrees)
const wiggleSpeedMin = 0.005;        // Minimum wiggle oscillation speed
const wiggleSpeedMax = 0.02;         // Maximum wiggle oscillation speed
const wiggleAmplitudeMin = 0.02;     // Minimum wiggle rotation amplitude (in radians)
const wiggleAmplitudeMax = 0.05;     // Maximum wiggle rotation amplitude (in radians)

// Lifespan & Animation
const lifespanMin = 800;       // Minimum lifespan in milliseconds
const lifespanMax = 1200;      // Maximum lifespan in milliseconds
const popInDuration = 100;     // Duration of pop-in animation in milliseconds
const popOutDuration = 300;    // Duration of pop-out animation in milliseconds

// Colors
const colors = [
  '#404040',  // Dark gray
  '#d5ff00',  // Lime yellow
  '#ffffff',  // White
  '#0064ff',  // Blue
  '#e0e0e0',  // Light gray
  '#ff64d5',  // Pink
];

let speechRec;                           // Speech recognition object
let wordObjects = [];                    // Array of all active word objects
let wordQueue = [];                      // Queue for words waiting to be created
let lastPhrase = "";                     // Last processed phrase (to detect new words)
let lastWordCreatedFrame = 0;            // Frame number when last word was created
let colorIndex = 0;                      // Current color index
let font;                                // Font object


// –––––––––––––––––––––––––––––––––––––––––––––––––––––––
// Preload and Setup - Runs once when the sketch starts

function preload() {
  // Load font (make sure the font file is in the correct path)
  font = loadFont(fontPath);
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  
  // Initialize cooldown so first word can be created immediately
  lastWordCreatedFrame = -minFramesBetweenWords;

  // Initialize speech recognition
  speechRec = new p5.SpeechRec(speechLanguage);
  speechRec.continuous = true;
  speechRec.interimResults = true;
  speechRec.onResult = onSpeech;
  
  // Reset phrase when recognition pauses
  speechRec.onEnd = function() {
    lastPhrase = "";
  };
  
  // Start listening
  speechRec.start();
}


// –––––––––––––––––––––––––––––––––––––––––––––––––––––––
// Draw - Runs continuously (frame by frame)

function draw() {
  // Clear the canvas with a black background
  background(0);
  
  // Process word queue: Create new word if enough time has passed
  if (wordQueue.length > 0) {
    let framesSinceLastWord = frameCount - lastWordCreatedFrame;
    
    if (framesSinceLastWord >= minFramesBetweenWords) {
      let nextWord = wordQueue.shift();
      wordObjects.push(new WordObject(nextWord));
      lastWordCreatedFrame = frameCount;
    } 
  }
  
  // Remove expired word objects
  wordObjects = wordObjects.filter(obj => obj.isAlive());
  
  // Update and display all word objects
  for (let obj of wordObjects) {
    obj.update();
    obj.display();
  }
  
  // Show hint when no words are on screen
  if (wordObjects.length === 0) {
    fill(255, 100);
    textSize(24);
    textAlign(CENTER, CENTER);
    text("Speak a word...", width/2, height/2);
  }
}


// –––––––––––––––––––––––––––––––––––––––––––––––––––––––
// Event Handlers

// Called when speech is recognized
function onSpeech() {
  if (speechRec.resultValue) {
    let currentPhrase = speechRec.resultString;
    let currentWords = currentPhrase.split(' ');
    let lastWords = lastPhrase.split(' ');
    
    // Process only new words (not already in previous phrase)
    for (let i = lastWords.length; i < currentWords.length; i++) {
      let cleanWord = currentWords[i].trim().toLowerCase();
      
      // Check for clear commands
      if (clearCommands.includes(cleanWord)) {
        wordObjects = [];
        wordQueue = [];
        lastPhrase = "";
        lastWordCreatedFrame = -minFramesBetweenWords;
        return;
      } 
      
      // Add word to queue
      if (cleanWord.length > 0) {
        wordQueue.push(currentWords[i]);
      }
    }
    
    lastPhrase = currentPhrase;
  }
}

// Keeps the canvas size in sync with the browser window.
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}


// –––––––––––––––––––––––––––––––––––––––––––––––––––––––
// Word Object Class

class WordObject {
  constructor(word) {
    // Text
    this.word = word.toUpperCase();
    this.size = word.length <= 5 ? fontSizeShort : fontSizeLong;
    
    // Position (centered with small random offset)
    this.x = width / 2 + random(-positionRangeX, positionRangeX);
    this.y = height / 2 + random(-positionRangeY, positionRangeY);
    
    // Rotation (cumulative angle with random variation)
    let prevAngle = wordObjects.length === 0 ? 0 : wordObjects[wordObjects.length - 1].angle;
    this.angle = prevAngle + random(-rotationRange, rotationRange);
    
    // Layout
    this.yOffset = this.size * 0.15;  // Vertical text offset for better centering
    this.margin = this.size * 0.1;    // Margin around text
    
    // Wiggle animation (oscillating rotation)
    this.wiggleSpeed = random(wiggleSpeedMin, wiggleSpeedMax);
    this.wiggleAmplitude = random(wiggleAmplitudeMin, wiggleAmplitudeMax);
    this.wiggleOffset = random(Math.PI * 2);  // Random start phase (0 to 2π)
    
    // Lifespan
    this.createdAt = millis();
    this.lifespan = random(lifespanMin, lifespanMax);
    
    // Scale animation
    this.scale = 0;  // Start invisible for pop-in animation
    
    // Color (cycle through color palette)
    this.col = color(colors[colorIndex % colors.length]);
    colorIndex++;
    
    // Text color (black or white depending on background brightness)
    this.textColor = brightness(this.col) > 50 ? color(0) : color(255);
  }
  
  // Update scale based on lifespan (pop-in and pop-out animations)
  update() {
    let age = millis() - this.createdAt;
    let timeUntilDeath = this.lifespan - age;
    
    if (age < popInDuration) {
      // Pop-in animation using easeOutBack
      let progress = age / popInDuration;
      this.scale = easeOutBack(progress);
    } 
    else if (timeUntilDeath < popOutDuration) {
      // Pop-out animation using easeOutBack (reverse)
      let progress = timeUntilDeath / popOutDuration;
      this.scale = easeOutBack(progress);
    } 
    else {
      // Normal display
      this.scale = 1;
    }
  }
  
  // Draw the word object
  display() {
    push();
    translate(this.x, this.y);
    scale(this.scale);
    
    // Add oscillating wiggle to rotation
    let wiggle = sin(frameCount * this.wiggleSpeed + this.wiggleOffset) * this.wiggleAmplitude;
    rotate(this.angle + wiggle);
    
    // Measure text dimensions
    textFont(font);
    textSize(this.size);
    let txtWidth = textWidth(this.word);
    let txtHeight = (this.size * 0.9);
    
    // Draw background box
    fill(this.col);
    noStroke();
    rectMode(CENTER);
    rect(0, 0, txtWidth + this.margin * 2, txtHeight + this.margin);
    
    // Draw text
    fill(this.textColor);
    textAlign(CENTER, CENTER);
    text(this.word, 0, -this.yOffset);
    
    pop();
  }
  
  // Check if object should still be alive
  isAlive() {
    return millis() - this.createdAt < this.lifespan;
  }
}


// –––––––––––––––––––––––––––––––––––––––––––––––––––––––
// Helper Functions

// Easing function: Overshoots target then settles
function easeOutBack(x) {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * pow(x - 1, 3) + c1 * pow(x - 1, 2);
}
