/*
 * © 2026 Schultzschultz. Created for 'Schultzschultz Creative Coding Masterclass'.
 * For educational use only. All rights reserved.
 *
 * ------------------------------
 * Opentype.js – ForceField class 
 * ------------------------------
 *
 * This file is the implementation of the ForceField class, which manages the interactive
 * repulsion effect applied to glyph points based on the mouse position.
 *
 * A ForceField acts like a magnetic repulsion zone centered on the mouse.
 * It pushes glyph points away from its center, creating an interactive distortion effect.
 * The field has two zones:
 * - Inner zone (innerRadians): full push strength
 * - Outer zone (outerRadians): strength fades to zero toward the edge
 * 
 * What this file does:
 * - Defines the ForceField class that encapsulates the logic for the interactive distortion effect.
 * - Manages the state of the force field, including its position, size, and influence on glyph points.
 * - Provides methods to update, display, and calculate the influence of the force field.
 * - The ForceField is used in the main sketch to create a dynamic interaction where glyph points are repelled from the mouse cursor, allowing users to "push" on the letterforms.
*/

class ForceField {

  constructor(_radians) {
    this.visible = true;
    this.position = createVector(0, 0); // Current center of the field (tracks the mouse)
    this.color = '#0e04d5';           // Color used when drawing the field visualization
    this.contrast = 0.5;                // Ratio of inner radius to outer radius
    this.outerRadians = _radians;       // Outer edge: influence drops to 0 at this distance
    this.innerRadians = this.outerRadians * this.contrast; // Inner edge: full push strength
  }

  // Grows or shrinks the field based on mouse wheel input.
  // delta: scroll amount — positive when scrolling down, negative when scrolling up.
  resize(delta) {
    // Subtracting delta means scroll-up (negative) makes the field larger
    this.outerRadians = constrain(this.outerRadians - delta * 0.5, 50, min(width, height));
    // Always keep the inner radius proportional to the outer radius
    this.innerRadians = this.outerRadians * this.contrast;
  }

  // Moves the field center toward a new target position _p each frame.
  // For large jumps it snaps instantly; for small movements it eases smoothly.
  update(_p) {
    let distance = p5.Vector.dist(this.position, _p);
    let threshold = 10; // If the mouse moved more than this many pixels, snap directly
    if (distance > threshold) {
      this.position = _p.copy(); // Jump to the new position immediately
    } else {
      // Ease toward the target: cover 15% of the remaining distance each frame
      this.position = p5.Vector.lerp(this.position, _p, 0.15);
    }
  }

  // Draws the field as concentric colored circles (visible when the user holds Space).
  // Color blends from the field color at the center to the background color at the edge.
  display() {
    let steps = this.outerRadians / 4; // More steps = smoother gradient
    for (let i = 0; i < steps; i++) {
      // Radius for this circle, from outerRadians (large) down to 0 (tiny)
      let tempRadians = map(i, 0, steps, this.outerRadians, 0);
      // 0 = at the outer edge (background color), 1 = at the inner edge (field color)
      let interpolation = map(tempRadians, this.outerRadians, this.innerRadians, 0, 1);
      // Mix background and field color based on how deep inside the field we are
      let tempColor = lerpColor(color(backgroundColor), color(this.color), interpolation);
      fill(tempColor);
      noStroke();
      ellipse(this.position.x, this.position.y, tempRadians * 2, tempRadians * 2);
    }
  }

  // Returns a value from 0.0 to 1.0 representing how strongly the field affects a point.
  // 1.0 = inside the inner zone (full push), 0.0 = outside the outer zone (no push).
  getInfluence(point) {
    // Clamp the point to the canvas so out-of-bounds points are handled correctly
    point = createVector(constrain(point.x, 0, width), constrain(point.y, 0, height));
    let distance = p5.Vector.dist(this.position, point);
    // Map distance to influence: closer → stronger, farther → weaker
    let influence = map(distance, this.innerRadians, this.outerRadians, 1, 0);
    return constrain(influence, 0, 1); // Clamp so it never falls outside the 0–1 range
  }
}