/*
 * © 2026 Schultzschultz. Created for 'Schultzschultz Creative Coding Masterclass'.
 * For educational use only. All rights reserved.
 *
 * ---------------------------------
 * Coding Basics - Classes & Objects
 * ---------------------------------
 *
 * This file is an example of how to use classes and objects.
 * A class is a blueprint for creating objects. An object is an instance of a class.
 * Classes can have properties (variables) and methods (functions).
 *
 * What this file does:
 * - It creates a bubble simulation where multiple bubbles move around the canvas.
 * - Each bubble has properties like position, size, speed, and color.
 * - The bubbles bounce off the edges of the canvas.
 * - You can toggle the movement of the bubbles by pressing the spacebar.
 * - You can change the speed and color of the bubbles by clicking the mouse.
 */

const bubbles = [];
const bubbleCount = 100;
const bubbleColors = [
  "#FF0000",
  "#FFFF00",
  "#00FF00",
  "#FF00FF",
  "#0000FF",
  "#FFFFFF",
];
const bubbleRadiusMin = 40;
const bubbleRadiusMax = 80;
const bubbleSpeedMax = 3;
let bubblesMoving = true;

function setup() {
  createCanvas(windowWidth, windowHeight);

  // Create a single bubble with specific properties and add it to the bubbles array.
  // const bubble = new Bubble(200, 100, 40, 2, 1, "#FFFFFF");
  // bubbles.push(bubble);

  // Create multiple bubble objects with random properties and add them to the bubbles array.
  for (let i = 0; i < bubbleCount; i++) {
    const bubble = createRandomBubble();
    bubbles.push(bubble);
  }
}

function draw() {
  background(0);

  // Loop through each bubble in the bubbles array and display it on the canvas.
  // If bubblesMoving is true, the bubble will move; otherwise, it will stay in place.
  for (const bubble of bubbles) {
    if (bubblesMoving) {
      bubble.move();
    }
    bubble.display();
  }
}



// Bubble class defines the properties and behaviors of each bubble in the simulation.
class Bubble {
  // The constructor initializes the bubble's position, size, speed, and color.
  constructor(x, y, radius, speedX, speedY, color) {
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.speedX = speedX;
    this.speedY = speedY;
    this.color = color;
  }

  // The move method updates the bubble's position based on its speed
  // and checks for collisions with the canvas edges.
  move() {
    // Update the bubble's position by adding the speed to the current position.
    this.x += this.speedX;
    this.y += this.speedY;

    // Check for collisions with the left and right edges of the canvas.
    if (this.x < this.radius || this.x > width - this.radius) {
      this.speedX *= -1;
    }

    // Check for collisions with the top and bottom edges of the canvas.
    if (this.y < this.radius || this.y > height - this.radius) {
      this.speedY *= -1;
    }
  }

  // The draw method renders the bubble on the canvas using its properties.
  display() {
    noStroke();
    fill(this.color);
    circle(this.x, this.y, this.radius * 2);
  }
}

// This function creates a bubble with random properties and returns it.
function createRandomBubble() {
  // Random x and y position within the canvas, leaving space for the radius.
  const x = random(bubbleRadiusMax, width - bubbleRadiusMax);
  const y = random(bubbleRadiusMax, height - bubbleRadiusMax);
  // Random radius between bubbleRadiusMin and bubbleRadiusMax.
  const radius = random(bubbleRadiusMin, bubbleRadiusMax);
  // Random horizontal and vertical speed
  const speedX = random(-bubbleSpeedMax, bubbleSpeedMax);
  const speedY = random(-bubbleSpeedMax, bubbleSpeedMax);
  // Random color from the bubbleColors array.
  const color = randomColor();
  // Create a new Bubble object with the random properties and return it.
  const randomBubble = new Bubble(x, y, radius, speedX, speedY, color);
  return randomBubble;
}

// This function returns a random color from the bubbleColors array.
function randomColor() {
  const randomIndex = int(random(bubbleColors.length));
  return bubbleColors[randomIndex];
}

// Toggle the movement of the bubbles when the spacebar is pressed.
function keyPressed() {
  if (key === " ") {
    bubblesMoving = !bubblesMoving;
  }
}

// When the mouse is released, change the speed and color of all bubbles.
function mouseReleased() {
  for (const bubble of bubbles) {
    bubble.speedX = random(-bubbleSpeedMax, bubbleSpeedMax);
    bubble.speedY = random(-bubbleSpeedMax, bubbleSpeedMax);
    bubble.color = randomColor();
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}
