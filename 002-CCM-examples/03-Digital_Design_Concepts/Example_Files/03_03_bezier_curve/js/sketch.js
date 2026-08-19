/*
 * © 2026 Schultzschultz. Created for 'Schultzschultz Creative Coding Masterclass'.
 * For educational use only. All rights reserved.
 * 
 * -----------------
 * Interactive Bezier Curve
 * -----------------
 * 
 *
 * This file is an interactive cubic Bézier curve visualizer built with p5.js.
 * What this file does:
 * - Renders a cubic Bézier curve with four draggable control points (red).
 * - Visualizes the De Casteljau construction at parameter t: green level-1 lerps, blue level-2 lerps, and the resulting white point on the curve.
 * - Animates t automatically over time using millis(); dragging the background scrubs t manually.
 * - Defaults to a clean view showing only the curve and endpoint tangent lines; holding space reveals the full De Casteljau construction.
 */

let curve;
let cleanView = true;

function setup() {
  createCanvas(windowWidth, windowHeight);
  curve = new BezierCurve();
  curve.initialize();
}

function draw() {
  background(0);
  curve.draw(cleanView);
  drawPanel();
}

function drawPanel() {
  const lines = [
    'drag anchors + handles',
    'hold space to toggle view',
    'scrub in background',
  ];

  textFont('monospace');
  textSize(16);
  textAlign(LEFT, TOP);
  noStroke();
  fill(255);

  const x = 24;
  const lineHeight = 26;
  lines.forEach((l, i) => text(l, x, 24 + i * lineHeight));
}

function keyPressed() {
  if (key === ' ') cleanView = false;
}

function keyReleased() {
  if (key === ' ') cleanView = true;
}

function mousePressed() {
  curve.mousePressed(mouseX, mouseY);
}

function mouseDragged() {
  curve.mouseDragged(mouseX, mouseY);
}

function mouseReleased() {
  curve.mouseReleased();
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  curve.initialize();
}

class DraggablePoint {
  constructor(x, y, drawDiameter = 18) {
    this.pos = createVector(x, y);
    this.hitDiameter = 24;
    this.drawDiameter = drawDiameter;
  }

  contains(x, y) {
    return dist(x, y, this.pos.x, this.pos.y) <= this.hitDiameter * 0.5;
  }

  draw(col) {
    noStroke();
    fill(col);
    circle(this.pos.x, this.pos.y, this.drawDiameter);
  }
}

class BezierCurve {
  constructor() {
    this.p0 = null;
    this.p1 = null;
    this.p2 = null;
    this.p3 = null;
    this.draggedPoint = null;
    this.scrubbing = false;
    this.scrubT = 0;
  }

  initialize() {
    this.p0 = new DraggablePoint(width * 0.2,  height * 0.5, 27);
    this.p1 = new DraggablePoint(width * 0.35, height * 0.2);
    this.p2 = new DraggablePoint(width * 0.65, height * 0.8);
    this.p3 = new DraggablePoint(width * 0.8,  height * 0.5, 27);
  }

  _drawCurveSegment(p0, p1, p2, p3, tStart, tEnd, col, weight) {
    const steps = 60;
    stroke(col);
    strokeWeight(weight);
    noFill();
    beginShape();
    for (let i = 0; i <= steps; i++) {
      const t = map(i, 0, steps, tStart, tEnd);
      vertex(
        bezierPoint(p0.x, p1.x, p2.x, p3.x, t),
        bezierPoint(p0.y, p1.y, p2.y, p3.y, t)
      );
    }
    endShape();
  }

  draw(clean) {
    const t = this.scrubbing ? this.scrubT : (millis() / 3000) % 1;

    const p0 = this.p0.pos;
    const p1 = this.p1.pos;
    const p2 = this.p2.pos;
    const p3 = this.p3.pos;

    if (clean) {
      // full white curve, endpoint tangent lines, white anchors
      this._drawCurveSegment(p0, p1, p2, p3, 0, 1, color(255), 3);
      stroke(255);
      strokeWeight(1.5);
      line(p0.x, p0.y, p1.x, p1.y);
      line(p2.x, p2.y, p3.x, p3.y);
      this.p0.draw(color(255));
      this.p1.draw(color(255));
      this.p2.draw(color(255));
      this.p3.draw(color(255));
      return;
    }

    // --- bezier curve: grey tail (t → 1), white head (0 → t) ---
    this._drawCurveSegment(p0, p1, p2, p3, t, 1, color(45), 3);
    this._drawCurveSegment(p0, p1, p2, p3, 0, t, color(255), 3);

    // --- level 0: red control polygon lines ---
    stroke(220, 60, 60);
    strokeWeight(1.5);
    line(p0.x, p0.y, p1.x, p1.y);
    line(p1.x, p1.y, p2.x, p2.y);
    line(p2.x, p2.y, p3.x, p3.y);

    // level 0 points (red, draggable)
    this.p0.draw(color(220, 60, 60));
    this.p1.draw(color(220, 60, 60));
    this.p2.draw(color(220, 60, 60));
    this.p3.draw(color(220, 60, 60));

    // --- level 1: lerp along level 0 edges (green) ---
    const q0 = p5.Vector.lerp(p0, p1, t);
    const q1 = p5.Vector.lerp(p1, p2, t);
    const q2 = p5.Vector.lerp(p2, p3, t);

    stroke(60, 200, 80);
    strokeWeight(1.5);
    line(q0.x, q0.y, q1.x, q1.y);
    line(q1.x, q1.y, q2.x, q2.y);

    noStroke();
    fill(60, 200, 80);
    circle(q0.x, q0.y, 18);
    circle(q1.x, q1.y, 18);
    circle(q2.x, q2.y, 18);

    // --- level 2: lerp along level 1 edges (blue) ---
    const r0 = p5.Vector.lerp(q0, q1, t);
    const r1 = p5.Vector.lerp(q1, q2, t);

    stroke(60, 130, 230);
    strokeWeight(1.5);
    line(r0.x, r0.y, r1.x, r1.y);

    noStroke();
    fill(60, 130, 230);
    circle(r0.x, r0.y, 18);
    circle(r1.x, r1.y, 18);

    // --- final point on the curve (white) ---
    const s = p5.Vector.lerp(r0, r1, t);
    noStroke();
    fill(255);
    circle(s.x, s.y, 21);
  }

  mousePressed(x, y) {
    const points = [this.p0, this.p1, this.p2, this.p3];
    this.draggedPoint = points.find((p) => p.contains(x, y)) ?? null;
    if (!this.draggedPoint) {
      this.scrubbing = true;
      this.scrubT = constrain(x / width, 0, 1);
    }
  }

  mouseDragged(x, y) {
    if (this.draggedPoint) {
      this.draggedPoint.pos.set(x, y);
    } else if (this.scrubbing) {
      this.scrubT = constrain(x / width, 0, 1);
    }
  }

  mouseReleased() {
    this.draggedPoint = null;
    this.scrubbing = false;
  }
}
