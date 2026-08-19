/*
 * © 2026 Schultzschultz. Created for 'Schultzschultz Creative Coding Masterclass'.
 * For educational use only. All rights reserved.
 * 
 * ---------
 * Debugging
 * ---------
 * 
 * This file is an example of how to bugfix a program. 
 * It contains an error that prevents it from running. 
 * Your task is to find the error and fix it.
 * 
 * Approach:
 * Copy the error message of the browser console (cmd + opt + c) and paste it to the chat.
 */


let anchors = [];
let myText = "shortcut your process and let your creativity flow";
let myTextIndex = 0;
let letterSize = 80;
let pX = 0;
let pY = 0;
let speed = 50;

function setup() {
  createCanvas(windowWidth, windowHeight);
  pixelDensity(displayDensity());
  textFont("sans-serif");
  textSize(letterSize);
  textAlign(CENTER, CENTER);
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

function draw() {
  background(0);

  if (mouseIsPressed) {
    const d = dist(pX, pY, mouseX, mouseY);
    if (d >= letterSize * 1.0) {
      pX = mouseX;
      pY = mouseY;
      setAnchor();
    }
  }

  noFill();
  stroke(255);
  strokeWeight(letterSize * 1.5);
  strokeJoin(ROUND);
  strokeCap(ROUND);
  drawingContext.miterLimit = 0;
  beginShape();
  for (let i = 0; i < anchors.length; i++) {
    const a = anchors[i];
    if (i === 0 || i === anchors.length - 1) {
      curveVertex(a.x, a.y);
    }
    curveVertex(a.x, a.y);
  }
  endShape();

  if (frameCount % speed === 0) {
    myTextIndex++;
    myTextIndex = myTextIndex % myText.length;
  }
  let charIndex = 0;
  for (let i = 0; i < anchors.length; i++) {
    const a = anchors[i];
    if (i > 2) {
      const b = anchors[i - 1];
      const c = anchors[i - 2];
      const d = anchors[i - 3];

      const charPos = (myTextIndex + charIndex) % myText.length;
      const myChar = myText.charAt(charPos);

      if (myChar !== " ") {
        ellipseMode(CENTER);
        push();
        const t = 1.0 - (1.0 / speed) * (frameCount % speed);
        const x = curvePoint(d.x, c.x, b.x, a.x, t);
        const y = curvePoint(d.y, c.y, b.y, a.y, t);
        translate(x, y);
        const tx = curveTangent(d.x, c.x, b.x, a.x, t);
        const ty = curveTangent(d.y, c.y, b.y, a.y, t);
        const a = atan2(ty, tx);
        rotate(a);
        fill(0);
        noStroke();
        text(myChar, 0, -letterSize / 12);
        pop();
      }



      charIndex++;
    }
  }
}

function mousePressed() {
  anchors = [];
  myTextIndex = 0;
  pX = mouseX;
  pY = mouseY;
}

function setAnchor() {
  if (anchors.length === 0) {
    anchors.push({ x: mouseX - 1, y: mouseY - 1});
    anchors.push({ x: mouseX, y: mouseY });
  } else {
    anchors[anchors.length - 1] = { x: mouseX - 1, y: mouseY - 1 };
  }
  anchors.push({ x: mouseX, y: mouseY+1 });
}



