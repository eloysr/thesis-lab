/*
 * © 2026 Schultzschultz. Created for 'Schultzschultz Creative Coding Masterclass'.
 * For educational use only. All rights reserved.
 * 
 * -----------------------------------
 * Video – Import, Display and Control
 * -----------------------------------
 * 
 * This file is an example of how to import, display, and control video playback in a p5.js sketch. 
 *
 * What this file does:
 * - Imports a video file and hides the default video element.
 * - Displays the video on the canvas.
 * - Provides controls for playback, speed, and volume.
 * - Allows scrubbing through the video with the mouse position.
 * - Toggles play/pause on mouse release.
 * 
 * Note: Make sure to place a video file named 'example.mp4' in the 'assets' folder for this sketch to work.
 * You can replace 'example.mp4' with any video file you have, just update the path in the preload function accordingly.
 */

let mask;
let video;

// Preload function to load the video before the sketch starts.
function preload() {
  video = createVideo('assets/example.mp4');
  mask = loadImage('assets/mask.png');

  // Hide the default video element.
  video.hide();
}

function setup() {
  createCanvas(windowWidth, windowHeight);

  // Resize the video size.
  // video.size(960, 540);

  // Playback
  // video.play(); // Start the video.
  // video.pause(); // Pause the video.
  // video.stop(); // Stop the video and reset to the beginning.
  video.loop(); // Start the video in a loop.
  // video.noLoop(); // Stop the video from looping.

  // Speed
  video.speed(1); // Normal speed
  // video.speed(0.5); // Half speed
  // video.speed(2); // Double speed

  // Audio (Volume) 
  video.volume(0); // Mute 
  // video.volume(0.5);
  // video.volume(1); // Full volume

}

function draw() {
  background('#FF00FF');
  
  // Display the video on the canvas at the current time.
  imageMode(CENTER);
  //image(video, mouseX, mouseY, video.width/3, video.height/3);
  let copy = video.get();
  copy.resize(mask.width, mask.height);

  // Apply the mask to the image. The mask controls which parts of the image are visible based on the brightness of the corresponding pixels in the mask image.
  // The mask should be a grayscale image where white areas reveal the image and black areas hide it
  //copy.mask(mask);

  // Scrub the video with the mouse position.
  //scrub();

  image(copy, width / 2, height / 2);

  // Function to display information about the video.
  displayInfo();
}

// Keeps the canvas size in sync with the browser window.
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

// Event handler for mouse release
function mouseReleased() {

  // check if the video is currently playing and toggle play/pause on mouse release.
  if (video.elt.paused) {
    video.play();
  } else {
    video.pause();
  }

}

// Function to display information about the video.
function displayInfo() {

  // Get the width and height of the video on the canvas.
  let videoWidth = video.width;
  let videoHeight = video.height;
  // Get the duration of the video in seconds.
  let videoDuration = video.duration(); 
  // Get the current time of the video in seconds.
  let videoCurrentTime = video.time(); 
  let videoPlaybackRate = video.elt.playbackRate;
  // Get whether the video is muted (true/false).
  let videoMuted = video.elt.muted; 
  // Get whether the video is paused (true/false).
  let videoPaused = video.elt.paused; 

  // Set text properties
  fill(255);
  noStroke();
  textSize(16);
  textFont('monospace');
  textAlign(LEFT, TOP);

  // Display the video dimensions in the top-left corner of the canvas.
  text('width: ' + videoWidth, 10, 10);
  text('height: ' + videoHeight, 10, 30);
  text('duration: ' + videoDuration.toFixed(2) + ' seconds', 10, 50);
  text('current time: ' + videoCurrentTime.toFixed(2) + ' seconds', 10, 70);
  text('playback rate: ' + videoPlaybackRate.toFixed(2) + 'x', 10, 90);
  text('muted: ' + videoMuted, 10, 110);
  text('paused: ' + videoPaused, 10, 130);
}

  // Scrub the video with the mouse position.
function scrub() {
  // Map the mouse's x position to the duration of the video to determine the current time.
  let t = map(mouseX, 0, width, 0, video.duration());
  video.time(t); // Set the video's current time based on the mouse position.

}