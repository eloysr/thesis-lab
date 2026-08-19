/*
 * © 2026 Schultzschultz. Created for 'Schultzschultz Creative Coding Masterclass'.
 * For educational use only. All rights reserved.
 * 
 * ----------------------------------------
 * Sound – Import, Playback, and Analysis
 * ----------------------------------------
 * 
 * This file is an example of how to import, play, and analyze sound in a p5.js sketch using the p5.sound library. * 
 *
 * What this file does:
 * - Preloads an audio file and sets up the sound analysis tools (FFT and Amplitude).
 * - Visualizes the playback progress, current amplitude level, precomputed amplitude shape, waveform, and frequency spectrum of the sound.
 * - Allows the user to start and pause playback by clicking on the canvas.
 * - Demonstrates various sound control functionalities such as volume, pan, playback rate, and looping.
 *  
 * Note: Make sure to place a audio file named 'example.wav' in the 'assets' folder for this sketch to work.
 * You can replace the file with any audio (mp3/wav) file you have, just update the path in the preload function accordingly.
 * Keep in mind that p5.sound is an add-on library for p5.js, so you need to include it in your HTML file to use the sound functionalities.
*/


let mySound;

let fft;
let amp;
let precomputedPeaks = [];
let amplitudeHistory = [];
let lastPlaybackTime = 0;
let isStarted = false;

// Preload function to load the audio before the sketch starts.
function preload() {
  mySound = loadSound('assets/example.wav');
}

function setup() {
  createCanvas(windowWidth, windowHeight);

  // Aanalysis with FFT (Fast Fourier Transform)
  fft = new p5.FFT(0.8, 2048);
  fft.setInput(mySound);

  // Amplitude analysis
  amp = new p5.Amplitude();
  amp.setInput(mySound);
  precomputedPeaks = mySound.getPeaks(2048); // Precompute the amplitude shape once, independent from live playback.

  // Playback
  // userStartAudio(); 
  // mySound.play(); // Start playing the sound.
  // mySound.pause(); // Pause the sound.
  // mySound.stop(); // Stop the sound and reset to the beginning.
  // mySound.loop(); // Start the sound in a loop.
  // mySound.noLoop(); // Stop the sound from looping.
  // mySound.isPlaying() // Check if the sound is currently playing (returns true or false).

  // Position und Timing
  // mySound.duration() // Get the total duration of the sound in seconds.
  // mySound.currentTime() // Get the current playback time of the sound in seconds.
  // mySound.jump(2) // Jump to a specific time in the sound.

  // Speed
  // mySound.rate(1); // Normal speed
  // mySound.rate(0.5); // Half speed
  // mySound.rate(2); // Double speed
  // mySound.rate(-1); // Reverse playback 

  // Audio (Volume) 
  // mySound.setVolume(0); // Mute 
  // mySound.setVolume(0.5);
  mySound.setVolume(3); // Full volume
  // mySound.pan(0) // Pan the sound left or right. Value ranges from -1 (full left) to 1 (full right), with 0 being centered.
}

function draw() {

  background(0);

  if (!isStarted) {
    displayStart();
    return; // Skip the rest of the draw loop until the sound is started.
  }

  // This function visualizes the playback progress.
  displayPlayback(50, 100, width - 100, 10);

  // This function visualizes the current amplitude level.
  displayAmplitude(50, 150, width - 100, 25);

  // This function visualizes the precomputed amplitude over the full file.
  displayAmplitudePrecomputed(50, 225, width - 100, 150);

  // This function visualizes the waveform of the sound
  displayWaveform(50, 425, width - 100, 200);

  // This function visualizes the frequency spectrum of the sound using FFT bins.
  displaySpectrum(50, 675, width - 100, 200);

}

// Keeps the canvas size in sync with the browser window.
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

// Event handler for mouse release
function mouseReleased() {
  if (!isStarted) {
    // This is necessary to enable audio playback in browsers that require user interaction before playing sound.
    userStartAudio();
    // mySound.play();
    mySound.loop();
    isStarted = true;
  } else {
    // Toggle playback on mouse press after the sound has started.
    if (mySound.isPlaying()) {
      mySound.pause();
    } else {
      mySound.play();
    }
  }
}

// This function displays a start message prompting the user to click to start the audio playback.
function displayStart() {
  fill(255);
  noStroke();
  textAlign(CENTER, CENTER);
  textSize(32);
  textFont('monospace');
  text('Click to start playback', width / 2, height / 2);
}

// This function visualizes the playback progress as a progress bar with time labels.
function displayPlayback(x, y, w, h) {
  // Get the total duration of the sound in seconds.
  const duration = mySound.duration();
  // Get the current playback time of the sound in seconds.
  const currentTime = mySound.currentTime();
  // Calculate the progress as a value between 0 and 1, ensuring it stays within bounds.
  const progress = duration > 0 ? constrain(currentTime / duration, 0, 1) : 0;
  // Determine if the sound is currently paused (started but not playing).
  const isPaused = isStarted && !mySound.isPlaying();

  // Draw the background of the progress bar.
  noStroke();
  fill(100);
  rect(x, y, w, h);

  // Draw the filled portion of the progress bar based on the current playback progress.
  fill(255);
  rect(x, y, w * progress, h);

  // Display the current time and total duration as text above the progress bar.
  fill(255);
  noStroke();
  textAlign(LEFT, BOTTOM);
  textSize(16);
  textFont('monospace');
  text(`${currentTime.toFixed(2)}s / ${duration.toFixed(2)}s`, x, y - 6);
  // If the sound is paused, display a "PAUSED" label on the right side of the progress bar.
  if (isPaused) {
    textAlign(RIGHT, BOTTOM);
    text('PAUSED', x + w, y - 6);
  }
}

// This function visualizes the waveform of the sound using the FFT (Fast Fourier Transform) analysis.
function displayWaveform(x, y, w, h) {
  // Get the current waveform of the sound as an array of amplitude values. 
  // The values in the array range from -1 to 1, where -1 represents the minimum amplitude, 0 represents silence, and 1 represents the maximum amplitude.
  const wave = fft.waveform();

  // Draw a rectangle as the background for the waveform visualization.
  noFill();
  stroke(100);
  strokeWeight(1);
  rect(x, y, w, h);

  // Set the stroke color and weight for drawing the waveform.
  noFill();
  stroke(255);
  strokeWeight(3);

  // Loop through the waveform array and create a vertex for each amplitude value.
  // The x-coordinate is mapped to the index of the waveform array, and the y-coordinate is mapped to the amplitude value.
  beginShape();
  for (let i = 0; i < wave.length; i++) {
    const xPos = map(i, 0, wave.length - 1, x, x + w);
    const yPos = map(wave[i], -1, 1, y + h, y);
    vertex(xPos, yPos);
  }
  endShape();

  // Display a label for the waveform visualization above the rectangle.
  fill(255);
  noStroke();
  textAlign(LEFT, BOTTOM);
  textSize(16);
  textFont('monospace');
  text('Waveform (live)', x, y - 4);
}

// This function visualizes the frequency spectrum of the sound using the FFT (Fast Fourier Transform) analysis.
function displaySpectrum(x, y, w, h) {
  // Get the current frequency spectrum of the sound as an array of amplitude values for each frequency bin.
  const spectrum = fft.analyze();
  // Calculate the width of each frequency bin based on the total width of the visualization and the number of bins in the spectrum.
  const binWidth = w / spectrum.length;

  // Draw a rectangle as the background for the spectrum visualization.
  noFill();
  stroke(100);
  strokeWeight(1);
  rect(x, y, w, h);

  // Set the fill color for the spectrum bars and disable stroke for drawing the rectangles.
  noStroke();
  fill(255);

  // Loop through the spectrum array and draw a rectangle for each frequency bin.
  // The x-coordinate is determined by the index of the bin, and the height of the rectangle is mapped to the amplitude value of that bin.
  for (let i = 0; i < spectrum.length; i++) {
    const xPos = i * binWidth + x;
    const hPos = map(spectrum[i], 0, 255, 0, h);
    rect(xPos, y + h - hPos, binWidth, hPos);
  }

  // Display a label for the spectrum visualization.
  fill(255);
  noStroke();
  textAlign(LEFT, BOTTOM);
  textSize(16);
  textFont('monospace');
  text('Spectrum (live)', x, y - 4);
}

// This function visualizes the current amplitude (volume level) of the sound.
function displayAmplitude(x, y, w, h) {

  // Get the current amplitude level of the sound as a value between 0 and 1, where 0 represents silence and 1 represents maximum volume.
  const level = amp.getLevel();
  // Map the amplitude level to a width for the filled portion of the amplitude bar.
  const filledWidth = map(level, 0, 1, 0, w);

  // Draw a rectangle as the background for the amplitude visualization.
  noFill();
  stroke(100);
  strokeWeight(1);
  rect(x, y, w, h);

  // Draw a filled rectangle based on the current amplitude level to visually represent the volume.
  noStroke();
  fill(255);
  rect(x, y, filledWidth, h);

  // Display a label for the amplitude visualization.
  fill(255);
  noStroke();
  textAlign(LEFT, BOTTOM);
  textSize(16);
  textFont('monospace');
  text('Amplitude (live)', x, y - 4);
}


// This function visualizes precomputed amplitude peaks across the full audio file.
function displayAmplitudePrecomputed(x, y, w, h) {
  // Check if the precomputed peaks array is available and has data before attempting to visualize it.
  if (!precomputedPeaks || precomputedPeaks.length === 0) {
    return;
  }

  // Draw a rectangle as the background for the precomputed amplitude visualization.
  noFill();
  stroke(100);
  strokeWeight(1);
  rect(x, y, w, h);

  // Set the stroke color and weight for drawing the precomputed amplitude shape.
  stroke(255);
  strokeWeight(2);
  noFill();

  // Loop through the precomputed peaks array and create a vertex for each amplitude value.
  // The x-coordinate is mapped to the index of the peaks array, and the y-coordinate is mapped to the amplitude value.
  beginShape();
  for (let i = 0; i < precomputedPeaks.length; i++) {
    const xPos = map(i, 0, precomputedPeaks.length - 1, x, x + w);
    const yPos = map(precomputedPeaks[i], -1, 1, y + h, y);
    vertex(xPos, yPos);
  }
  endShape();

  // Display a label for the precomputed amplitude visualization.
  fill(255);
  noStroke();
  textAlign(LEFT, BOTTOM);
  textSize(16);
  textFont('monospace');
  text('Amplitude (full track)', x, y - 4);
}