/*
 * © 2026 Schultzschultz. Created for 'Schultzschultz Creative Coding Masterclass'.
 * For educational use only. All rights reserved.
 * 
 * ---------------------------------
 * Gamepad – Load, Configure and Use
 * ---------------------------------
 * 
 * This file contains the Letter class and related functions for 
 * managing letters in the sketch. 
 */


let letters = [];
let activeLetter;
let activeLetterIndex = -1;
let motionEnabled = false;

const FONT_OPTIONS = [
  'Helvetica',
  'Georgia',
  'Times New Roman',
  'Palatino',
  'Garamond',
  'Courier New'
];
const LETTER_STYLES = ['normal', 'bold', 'italic'];
const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const MOVE_SPEED = 7;
const ROTATE_SPEED = 0.035;
const SCALE_SPEED = 1.6;
const MIN_LETTER_SIZE = 36;
const MAX_LETTER_SIZE = 420;
const MOTION_NOISE_SPEED = 0.015;
const MOTION_POSITION_RANGE = 32;
const MOTION_ROTATION_RANGE = 0.35;
const MOTION_SCALE_RANGE = 0.25;

// The letter class represents a letter with properties like position, size, color, 
// character, font, style, and angle. It also includes methods for cloning itself, 
// drawing with optional motion effects, and calculating its bounds for display purposes. 
class Letter {
  constructor(position, size, colorValue, character, font, style = 'normal', angle = 0) {
    this.position = position.copy();
    this.size = size;
    this.color = colorValue;
    this.character = character;
    this.font = font;
    this.style = style;
    this.angle = angle;
    this.noiseOffsetX = random(1000);
    this.noiseOffsetY = random(1000, 2000);
    this.noiseOffsetRotation = random(2000, 3000);
    this.noiseOffsetScale = random(3000, 4000);
  }

  clone() {
    const clone = new Letter(
      this.position.copy(),
      this.size,
      color(red(this.color), green(this.color), blue(this.color)),
      this.character,
      this.font,
      this.style,
      this.angle
    );

    return clone;
  }

  draw(isActive = false, motionTime = null) {
    const displayState = this.getDisplayState(motionTime);

    push();
    translate(displayState.position.x, displayState.position.y);
    rotate(displayState.angle);
    textAlign(CENTER, CENTER);
    textSize(displayState.size);
    textFont(this.font);
    textStyle(this.getTextStyleConstant());
    noStroke();
    fill(this.color);
    text(this.character, 0, 0);

    if (isActive) {
      const bounds = this.getBounds(displayState.size);
      noFill();
      stroke(255, 80);
      strokeWeight(1);
      rectMode(CENTER);
      rect(0, 0, bounds.width + 18, bounds.height + 18);
    }

    pop();
  }

  getBounds(displaySize = this.size) {
    push();
    textSize(displaySize);
    textFont(this.font);
    textStyle(this.getTextStyleConstant());
    const width = textWidth(this.character);
    const height = textAscent() + textDescent();
    pop();

    return { width, height };
  }

  getTextStyleConstant() {
    if (this.style === 'bold') {
      return BOLD;
    }

    if (this.style === 'italic') {
      return ITALIC;
    }

    return NORMAL;
  }

  getDisplayState(motionTime) {
    if (motionTime === null) {
      return {
        position: this.position.copy(),
        angle: this.angle,
        size: this.size
      };
    }

    const positionX = this.position.x + map(
      noise(this.noiseOffsetX + motionTime),
      0,
      1,
      -MOTION_POSITION_RANGE,
      MOTION_POSITION_RANGE
    );
    const positionY = this.position.y + map(
      noise(this.noiseOffsetY + motionTime),
      0,
      1,
      -MOTION_POSITION_RANGE,
      MOTION_POSITION_RANGE
    );
    const angle = this.angle + map(
      noise(this.noiseOffsetRotation + motionTime),
      0,
      1,
      -MOTION_ROTATION_RANGE,
      MOTION_ROTATION_RANGE
    );
    const sizeScale = 1 + map(
      noise(this.noiseOffsetScale + motionTime),
      0,
      1,
      -MOTION_SCALE_RANGE,
      MOTION_SCALE_RANGE
    );

    return {
      position: createVector(positionX, positionY),
      angle,
      size: max(MIN_LETTER_SIZE, this.size * sizeScale)
    };
  }
}

// Sets up the initial state of the letters in the sketch, 
// starting with a single letter in the center of the canvas.
function initializeLetters() {
  letters = [createLetter()];
  activeLetterIndex = 0;
  activeLetter = letters[activeLetterIndex];
}

// The updateLetters function handles user input from the game controller to 
// manipulate the active letter (e.g., moving, rotating, changing character/font/style/color).
function updateLetters(controller) {
  if (!activeLetter || !controller) {
    return;
  }

  const leftAxisX = applyDeadzone(controller.axes.leftX, controller.stickDeadzone);
  const leftAxisY = applyDeadzone(controller.axes.leftY, controller.stickDeadzone);
  const rightAxisX = applyDeadzone(controller.axes.rightX, controller.stickDeadzone);
  const rightAxisY = applyDeadzone(controller.axes.rightY, controller.stickDeadzone);

  activeLetter.position.x = constrain(
    activeLetter.position.x + leftAxisX * MOVE_SPEED,
    0,
    width
  );
  activeLetter.position.y = constrain(
    activeLetter.position.y + leftAxisY * MOVE_SPEED,
    0,
    height
  );
  activeLetter.angle += rightAxisX * ROTATE_SPEED;
  activeLetter.size = constrain(
    activeLetter.size - rightAxisY * SCALE_SPEED,
    MIN_LETTER_SIZE,
    MAX_LETTER_SIZE
  );

  if (controller.wasPressed('LEFT')) {
    stepCharacter(-1);
  }

  if (controller.wasPressed('RIGHT')) {
    stepCharacter(1);
  }

  if (controller.wasPressed('UP')) {
    stepActiveLetter(-1);
  }

  if (controller.wasPressed('DOWN')) {
    stepActiveLetter(1);
  }

  if (controller.wasPressed('CIRCLE')) {
    activeLetter.color = randomLetterColor();
  }

  if (controller.wasPressed('SQUARE')) {
    toggleCase();
  }

  if (controller.wasPressed('TRIANGLE')) {
    cycleStyle();
  }

  if (controller.wasPressed('CROSS')) {
    stepFont(1);
  }

  if (controller.wasComboPressed(['L1', 'R1'])) {
    cloneActiveLetter();
    controller.vibrate(1000);
  }

  if (controller.wasComboPressed(['L2', 'R2'])) {
    motionEnabled = !motionEnabled;
  }
}

// The drawLetters function renders all letters on the canvas, applying motion effects if enabled.
function drawLetters() {
  const motionTime = motionEnabled ? frameCount * MOTION_NOISE_SPEED : null;

  for (let index = 0; index < letters.length; index += 1) {
    const letter = letters[index];
    letter.draw(index === activeLetterIndex, motionTime);
  }
}

// Creates a new letter, optionally cloning from an existing letter. 
// If no source letter is provided, it creates a default letter in the center of 
// the canvas with random color and the character 'A'.
function createLetter(sourceLetter = null) {
  if (sourceLetter) {
    const nextLetter = sourceLetter.clone();
    return nextLetter;
  }

  return new Letter(
    createVector(width * 0.5, height * 0.5),
    120,
    randomLetterColor(),
    'A',
    FONT_OPTIONS[0]
  );
}

// Steps through the letters array to change the active letter based on the given 
// direction (-1 for previous, +1 for next).
function stepActiveLetter(direction) {
  if (letters.length === 0) {
    activeLetterIndex = -1;
    activeLetter = null;
    return;
  }

  activeLetterIndex = (activeLetterIndex + direction + letters.length) % letters.length;
  activeLetter = letters[activeLetterIndex];
}

// Clones the active letter, offsets its position by 10 pixels in both x and y directions, 
// and adds it to the letters array. The newly cloned letter becomes the active letter.
function cloneActiveLetter() {
  const nextLetter = activeLetter.clone();
  nextLetter.position.x = constrain(nextLetter.position.x + 10, 0, width);
  nextLetter.position.y = constrain(nextLetter.position.y + 10, 0, height);
  letters.push(nextLetter);
  activeLetterIndex = letters.length - 1;
  activeLetter = letters[activeLetterIndex];
}

// Steps through the alphabet to change the character of the active letter based on the 
// given direction (-1 for previous, +1 for next).
function stepCharacter(direction) {
  const upperCharacter = activeLetter.character.toUpperCase();
  const currentIndex = max(0, ALPHABET.indexOf(upperCharacter));
  const nextIndex = (currentIndex + direction + ALPHABET.length) % ALPHABET.length;
  const nextCharacter = ALPHABET.charAt(nextIndex);

  activeLetter.character = isUpperCase(activeLetter.character)
    ? nextCharacter
    : nextCharacter.toLowerCase();
}

// Steps through the letters array to change the active letter based on the given 
// direction (-1 for previous, +1 for next).
function stepFont(direction) {
  const currentIndex = FONT_OPTIONS.indexOf(activeLetter.font);
  const safeIndex = currentIndex === -1 ? 0 : currentIndex;
  const nextIndex = (safeIndex + direction + FONT_OPTIONS.length) % FONT_OPTIONS.length;
  activeLetter.font = FONT_OPTIONS[nextIndex];
}

// Toggles the case of the active letter's character between uppercase and lowercase.
function toggleCase() {
  activeLetter.character = isUpperCase(activeLetter.character)
    ? activeLetter.character.toLowerCase()
    : activeLetter.character.toUpperCase();
}

// Cycles through the LETTER_STYLES array to change the style 
// of the active letter based on the current style.
function cycleStyle() {
  const currentIndex = LETTER_STYLES.indexOf(activeLetter.style);
  const safeIndex = currentIndex === -1 ? 0 : currentIndex;
  const nextIndex = (safeIndex + 1) % LETTER_STYLES.length;
  activeLetter.style = LETTER_STYLES[nextIndex];
}

// Utility function to apply a deadzone to joystick input, returning 0 if 
// the input value is within the specified threshold.
function applyDeadzone(value, threshold) {
  return abs(value) > threshold ? value : 0;
}

// Utility function to check if a character is uppercase by comparing it to its uppercase version.
function isUpperCase(character) {
  return character === character.toUpperCase();
}

// Utility function to generate a random color with RGB values 
// between 80 and 255 for better visibility on a dark background.
function randomLetterColor() {
  return color(random(80, 255), random(80, 255), random(80, 255));
}