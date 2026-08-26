/*
 * © 2026 Schultzschultz. Created for 'Schultzschultz Creative Coding Masterclass'.
 * For educational use only. All rights reserved.
 * 
 * ------------------
 * ml5.js – Hand Pose
 * ------------------
 * 
 * This file is a demonstration of using the ml5.js HandPose model in a p5.js sketch. 
 * It tracks hand movements and gestures to interact with the sketch.
 *
 * What this file does:
 * - Sets up a webcam video feed.
 * - Loads the ml5.js HandPose model.
 * - Detects hand landmarks in real-time.
 * - Maps hand gestures to interactions with the sketch.
 * - Renders visual feedback based on hand movements.
 * - The sketch is designed to be interactive and responsive to hand gestures, 
 *   allowing users to control elements on the screen using their hands.
 * 
 * Controls:
 * - Move your hand in front of the webcam to see the hand tracking in action.
 * - Use specific gestures (like pinching fingers together) to trigger interactions.
 * - The sketch will respond to the position and movement of your hand, 
 *   creating a dynamic experience.
 * – Pinching your thumb and another finger (like the index finger) will change the 
 *   active letter displayed on the screen.
 * 
 * Note: Make sure to load the ml5.js library in your HTML file.
 * 
 * For more information on ml5.js, see: https://ml5js.org
 */


// Video and AI Model
let video;                        // Webcam video feed
let handPose;                     // ml5.handPose AI model
let hands = [];                   // Array storing detected hand data

// Text Settings
const letters = "ABCD";           // Available letters to display
let activeLetterIndex = 0;        // Which letter is currently active (0=A, 1=B, 2=C, 3=D)

// Visual Styling
const fontFamily = "helvetica";   // Font for drawing letters
const textSizeMin = 50;           // Smallest possible text size
const textSizeMax = 500;          // Largest possible text size
const textColor = '#eef5d3';    // Text color
const markerColor = '#0055ff';  // Color of finger markers (white)
const markerSize = 30;            // Size of finger markers in pixels

// Gesture Detection
const touchThreshold = 50;        // How close fingers must be to count as "touching" (in pixels)
let lastTouchState = [false, false, false, false];  // Remembers which fingers were touching last frame

// Video Display Transformation
// These help align the hand tracking with the video display
let videoScale = 1;               // How much the video is scaled
let videoOffsetX = 0;             // Horizontal offset of video
let videoOffsetY = 0;             // Vertical offset of video


// –––––––––––––––––––––––––––––––––––––––––––––––––––––––
// Setup - Runs once when the sketch starts

function setup() {
  // Default full-window canvas.
  createCanvas(windowWidth, windowHeight);
  
  // Set the text font for drawing letters
  textFont(fontFamily);

  // Start webcam capture and hide the default video element
  video = createCapture(VIDEO);
  video.hide();

  // Load the ml5.handPose model and start detection when ready
  handPose = ml5.handPose(video, modelReady);
}

// Called when the AI model has finished loading
function modelReady() {
  console.log("HandPose model loaded!");
  
  // Start detecting hands continuously
  handPose.detectStart(video, gotHands);
}

// Called every time new hand data is detected
function gotHands(results) {
  hands = results;  // Store the detected hands
}


// –––––––––––––––––––––––––––––––––––––––––––––––––––––––
// Draw - Runs continuously (frame by frame)

function draw() {
  // Clear the canvas with a black background
  background(0);

  // Draw the webcam video (mirrored and dimmed)
  drawVideoFeed();

  // Draw a marker on every detected hand keypoint
  drawAllHandKeypoints();

  // Draw the letter and finger markers
  drawCurrentLetter();
}


// –––––––––––––––––––––––––––––––––––––––––––––––––––––––
// Video Display

function drawVideoFeed() {
  push();  // Save drawing state
  
  // Mirror the video horizontally (like looking in a mirror)
  translate(width, 0);
  scale(-1, 1);
  
  // Apply an orange color filter to the video
  tint(255, 140, 0);
  
  // Calculate how to scale video to fill canvas while maintaining aspect ratio
  let videoAspect = video.width / video.height;
  let canvasAspect = width / height;
  let drawWidth, drawHeight;
  
  if (videoAspect > canvasAspect) {
    // Video is wider than canvas - fit to height
    drawHeight = height;
    drawWidth = height * videoAspect;
    videoOffsetX = (drawWidth - width) / 2;
    videoOffsetY = 0;
    videoScale = drawHeight / video.height;
  } else {
    // Video is taller than canvas - fit to width
    drawWidth = width;
    drawHeight = width / videoAspect;
    videoOffsetX = 0;
    videoOffsetY = (drawHeight - height) / 2;
    videoScale = drawWidth / video.width;
  }
  
  // Draw the video
  image(video, -videoOffsetX, -videoOffsetY, drawWidth, drawHeight);
  
  pop();  // Restore drawing state
}


// –––––––––––––––––––––––––––––––––––––––––––––––––––––––
// Hand Tracking & Letter Display

// Fingertip keypoint indices, in the same order as activeLetterIndex (0=index, 1=middle, 2=ring, 3=pinky)
const fingerKeypointIndices = [8, 12, 16, 20];

// Draw a small marker only on the thumb and the currently active finger, for every detected hand
function drawAllHandKeypoints() {
  fill(255, 255, 255, 150);
  noStroke();

  let selectedIndices = [4, fingerKeypointIndices[activeLetterIndex]];

  for (let hand of hands) {
    for (let i of selectedIndices) {
      let point = hand.keypoints[i];
      if (!point) continue;

      // Reuse the same scale/offset/mirror transform as the video feed
      let x = width - (point.x * videoScale - videoOffsetX);
      let y = point.y * videoScale - videoOffsetY;
      circle(x, y, 10);
    }
  }
}

function drawCurrentLetter() {
  // Exit if no hands are detected
  if (hands.length === 0) return;
  
  // Use the first detected hand
  let hand = hands[0];
  
  // Get the thumb tip position (keypoint 4 in the hand model)
  let thumb = hand.keypoints[4];
  if (!thumb) return;  // Exit if thumb is not detected
  
  // Define which finger corresponds to which letter
  // ml5.handPose keypoint indices: index=8, middle=12, ring=16, pinky=20
  let fingers = [
    { keypoint: hand.keypoints[8], letterIndex: 0 },   // Index finger = A
    { keypoint: hand.keypoints[12], letterIndex: 1 },  // Middle finger = B
    { keypoint: hand.keypoints[16], letterIndex: 2 },  // Ring finger = C
    { keypoint: hand.keypoints[20], letterIndex: 3 }   // Pinky finger = D
  ];
  
  // Check which fingers are touching the thumb
  detectFingerTouches(thumb, fingers);
  
  // Get the currently active finger
  let activeFinger = fingers[activeLetterIndex];
  if (!activeFinger.keypoint) return;
  
  // Convert hand coordinates to screen coordinates
  let positions = transformCoordinates(thumb, activeFinger.keypoint);
  
  // Calculate the size of the letter based on finger distance
  let letterSize = calculateLetterSize(positions.thumbX, positions.thumbY, 
                                       positions.fingerX, positions.fingerY);
  
  // Draw the letter between the two fingers
  drawLetter(positions, letterSize);
  
  // Draw white markers on the fingers
  drawFingerMarkers(positions);
}

// Detect which fingers are touching the thumb and update active letter
function detectFingerTouches(thumb, fingers) {
  let currentTouchState = [false, false, false, false];
  
  for (let i = 0; i < fingers.length; i++) {
    let finger = fingers[i];
    
    if (finger.keypoint) {
      // Calculate distance between thumb and this finger
      let distance = dist(thumb.x, thumb.y, finger.keypoint.x, finger.keypoint.y);
      
      // Check if finger is close enough to count as "touching"
      if (distance < touchThreshold) {
        currentTouchState[i] = true;
        
        // If this finger just started touching (wasn't touching last frame)
        if (!lastTouchState[i]) {
          // Change to this letter
          activeLetterIndex = finger.letterIndex;
        }
      }
    }
  }
  
  // Remember the current state for next frame
  lastTouchState = [...currentTouchState];
}

// Transform hand coordinates to match the video display
function transformCoordinates(thumb, finger) {
  // Apply scaling and offset, then mirror horizontally
  let thumbX = width - (thumb.x * videoScale - videoOffsetX);
  let thumbY = thumb.y * videoScale - videoOffsetY;
  let fingerX = width - (finger.x * videoScale - videoOffsetX);
  let fingerY = finger.y * videoScale - videoOffsetY;
  
  return { thumbX, thumbY, fingerX, fingerY };
}

// Calculate letter size based on distance between fingers
function calculateLetterSize(thumbX, thumbY, fingerX, fingerY) {
  let fingerDistance = dist(thumbX, thumbY, fingerX, fingerY);
  
  // Map the distance to a text size (closer = smaller, farther = bigger)
  let size = map(fingerDistance, 20, 400, textSizeMin, textSizeMax);
  
  // Make sure size stays within min/max bounds
  size = constrain(size, textSizeMin, textSizeMax);
  
  return size;
}

// Draw the active letter between the two fingers
function drawLetter(positions, letterSize) {
  // Calculate the midpoint between thumb and finger
  let midX = (positions.thumbX + positions.fingerX) / 2;
  let midY = (positions.thumbY + positions.fingerY) / 2;

  // Calculate the angle between thumb and finger so the letter follows the hand's tilt
  let angle = atan2(positions.fingerY - positions.thumbY, positions.fingerX - positions.thumbX);

  push();
  translate(midX, midY);
  rotate(angle);

  // Set text appearance
  fill(textColor);
  noStroke();
  textAlign(CENTER, CENTER);
  textSize(letterSize);

  // Draw the letter at the origin, already translated/rotated into place
  text(letters[activeLetterIndex], 0, 0);
  pop();
}

// Draw white circles on the thumb and active finger
function drawFingerMarkers(positions) {
  fill(markerColor);
  noStroke();
  circle(positions.thumbX, positions.thumbY, markerSize);
  circle(positions.fingerX, positions.fingerY, markerSize);
}


// –––––––––––––––––––––––––––––––––––––––––––––––––––––––
// Canvas Resize

// Keeps the canvas size in sync with the browser window.
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}
