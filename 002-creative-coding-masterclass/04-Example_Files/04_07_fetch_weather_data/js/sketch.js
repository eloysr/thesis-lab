/*
 * © 2026 Schultzschultz. Created for 'Schultzschultz Creative Coding Masterclass'.
 * For educational use only. All rights reserved.
 *
 * ------------------
 * Fetch Weather Data 
 * ------------------
 *
 * This sketch fetches the current temperature for a fixed location
 * using the Open-Meteo API and displays it on the canvas.
 *
 * What this file does:
 * - Requests the current temperature from the API of an online database (www.open-meteo.com).
 * - Shows a loading message until the data arrives, then renders the temperature and coordinates.
 */

let temp;
let lat = 50.1109;
let long = 8.6821;

function setup() {
  createCanvas(windowWidth, windowHeight);
  fetch(
    `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${long}&current=temperature_2m`,
  )
    .then((res) => res.json())
    .then((data) => {
      temp = data.current.temperature_2m;
    });
}

function draw() {
  background(0);
  fill(255);
  textAlign(CENTER, CENTER);

  if (temp === undefined) {
    text("Loading...", width / 2, height / 2);
    return;
  }
  textSize(72);
  text(temp + "°C", width / 2, height / 2 - 50);
  textSize(14);
  text("Latitude: " + lat + " / Longitude: " + long, width / 2, height / 2 + 20)
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}
