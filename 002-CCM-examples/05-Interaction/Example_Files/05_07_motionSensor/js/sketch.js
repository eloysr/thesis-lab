/*
 * © 2026 Schultzschultz. Created for 'Schultzschultz Creative Coding Masterclass'.
 * For educational use only. All rights reserved.
 *
 * -------------------------
 * p5.js iOS Motion Sensor
 * -------------------------
 *
 * A single ball steered by device tilt. Bounces off window edges.
 *
 * - requestMotionPermission(): iOS 13+ permission gate, called from the HTML button.
 */


// ── State ──────────────────────────────────────────────────────────────────

let permissionGranted = false; // true once the user approves motion access

// Ball position and velocity
let bx, by, vx, vy;

const BALL_RADIUS   = 60;
const GRAVITY_SCALE = 25.8;  // how strongly tilt steers the ball
const DAMPING       = 0.5; // energy kept on each edge bounce (0–1)


// ── p5.js lifecycle ────────────────────────────────────────────────────────

// Runs once when the sketch starts
function setup() {
  createCanvas(windowWidth, windowHeight);

  // Start the ball in the centre
  bx = width  / 2;
  by = height / 2;
  vx = 0;
  vy = 0;

  // On desktop / Android, motion access is immediate — hide the button.
  if (typeof DeviceMotionEvent.requestPermission !== 'function') {
    permissionGranted = true;
    hidePermissionOverlay();
  }
}

// Runs continuously (frame by frame)
function draw() {
  background(0);

  if (permissionGranted) {
    // rotationX: device tilted forward/back (nose down = positive → ball moves down)
    // rotationY: device tilted left/right   (right edge down = positive → ball moves right)
    const gx = map(rotationY, -90, 90, -GRAVITY_SCALE, GRAVITY_SCALE);
    const gy = map(rotationX, -90, 90, -GRAVITY_SCALE, GRAVITY_SCALE);

    vx += gx;
    vy += gy;

    bx += vx;
    by += vy;

    // Bounce off left / right edges
    if (bx - BALL_RADIUS < 0) {
      bx = BALL_RADIUS;
      vx = abs(vx) * DAMPING;
    } else if (bx + BALL_RADIUS > width) {
      bx = width - BALL_RADIUS;
      vx = -abs(vx) * DAMPING;
    }

    // Bounce off top / bottom edges
    if (by - BALL_RADIUS < 0) {
      by = BALL_RADIUS;
      vy = abs(vy) * DAMPING;
    } else if (by + BALL_RADIUS > height) {
      by = height - BALL_RADIUS;
      vy = -abs(vy) * DAMPING;
    }

    // Draw ball
    noStroke();
    fill(255);
    ellipse(bx, by, BALL_RADIUS * 2);

  } 
}

// Keeps the canvas size in sync with the browser window.
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}


// ── Permission ─────────────────────────────────────────────────────────────

// Must be called from a user-gesture handler (the HTML button onclick).
// iOS 13+ requires DeviceMotionEvent.requestPermission() inside a tap/click.
function requestMotionPermission() {
  if (typeof DeviceMotionEvent.requestPermission === 'function') {
    DeviceMotionEvent.requestPermission()
      .then(state => {
        if (state === 'granted') {
          permissionGranted = true;
          hidePermissionOverlay();
        }
      })
      .catch(console.error);
  } else {
    // Android / desktop — no prompt needed
    permissionGranted = true;
    hidePermissionOverlay();
  }
}

function hidePermissionOverlay() {
  const overlay = document.getElementById('permission-overlay');
  if (overlay) overlay.style.display = 'none';
}
