/*
 * © 2026 Schultzschultz. Created for 'Schultzschultz Creative Coding Masterclass'.
 * For educational use only. All rights reserved.
 *
 * -----------
 * Fetch Image
 * -----------
 *
 * This sketch loads a random dog image from the Dog CEO API.
 *
 * What this file does:
 * - Fetches a random dog image.
 * - Shows a loading message until the image is ready, then draws it centered.
 */

// Stores the fetched dog image once it has finished loading.
let dogImage;

function setup() {
  createCanvas(windowWidth, windowHeight);

  // Request a random dog image URL, then load the image into p5.
  fetch("https://dog.ceo/api/breeds/image/random")
    .then((res) => res.json())
    .then((data) => {
      loadImage(data.message, (img) => {
        dogImage = img;
      });
    });
}

function draw() {
  background(0);

  // Keep showing feedback until the API image has finished loading.
  if (!dogImage) {
    text("Loading...", 20, 20);
    return;
  }

  // Scale the image to half the canvas width and draw it centered.
  dogImage.resize(width/2, 0);
  imageMode(CENTER);
  image(dogImage, width/2, height/2, dogImage.width, dogImage.height);
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}
