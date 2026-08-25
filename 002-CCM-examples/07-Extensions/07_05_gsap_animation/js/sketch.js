/*
 * © 2026 Schultzschultz. Created for 'Schultzschultz Creative Coding Masterclass'.
 * For educational use only. All rights reserved.
 *
 * -------------------------
 * p5.js + GSAP Mini Examples
 * -------------------------
 *
 * This sketch shows how to use GSAP with minimal code inside p5.js.
 *
 * What this file does:
 * - setup(): Creates the canvas and registers 16 small GSAP animations.
 * - draw(): Renders the current animated values in a simple 4x4 grid.
 * - add(): Stores a demo object and lets GSAP tween its properties.
 * - windowResized(): Keeps the canvas matched to the browser window.
 * 
 * Note: Make sure to load the gsap.min.js library in your HTML file.
 * 
 * For more information on gsap.js, see: https://gsap.com
 * 
 */

let demos = [];

// Creates one demo object and attaches a looping GSAP tween to it.
function add(name, init, to) {
  let demo = { name, x: 0, y: 0, s: 1, r: 0, a: 1, h: 200, w: 56, hh: 56, ang: 0, shx: 0, shy: 0, sw: 1, ...init };
  demos.push(demo);
  gsap.to(demo, { repeat: -1, yoyo: true, ease: "sine.inOut", ...to });
}

// Creates the canvas and defines 16 short animation examples.
function setup() {
  createCanvas(windowWidth, windowHeight);
  colorMode(HSB, 360, 100, 100, 1);
  rectMode(CENTER);
  textAlign(CENTER, CENTER);
  textFont("monospace");

  add("move x", { x: -70 }, { x: 70, duration: 1.1 }); // Horizontal motion
  add("move y", { y: -45 }, { y: 45, duration: 0.9 }); // Vertical motion
  add("scale", { s: 0.45 }, { s: 1.35, duration: 0.8 }); // Size change
  add("rotate", {}, { r: PI, duration: 1.2 }); // Rotation
  add("fade", { a: 0.15 }, { a: 1, duration: 0.7 }); // Opacity fade
  add("color", { h: 20 }, { h: 320, duration: 1.4 }); // Hue shift
  add("stretch", { w: 26, hh: 82 }, { w: 92, hh: 26, duration: 0.9 }); // Width and height swap
  add("orbit", { ang: -PI }, { ang: PI, duration: 1.6, yoyo: false, repeatDelay: 0 }); // Circular path
  add("move xy", { x: -54, y: -34 }, { x: 54, y: 34, duration: 1 }); // Diagonal motion
  add("scale x2", { s: 0.25 }, { s: 1.55, duration: 0.6 }); // Strong scale change
  add("spin fast", { r: -PI }, { r: PI, duration: 0.45 }); // Faster rotation
  add("fade move", { x: -56, a: 0.1 }, { x: 56, a: 1, duration: 0.85 }); // Motion plus fade
  add("thin wide", { w: 18, hh: 18 }, { w: 98, hh: 18, duration: 0.75 }); // Horizontal line stretch
  add("tall thin", { w: 18, hh: 18 }, { w: 18, hh: 98, duration: 0.75 }); // Vertical line stretch
  add("shear x", { shx: -0.45 }, { shx: 0.45, duration: 1.05 }); // Horizontal skew
  add("shear y", { shy: -0.45 }, { shy: 0.45, duration: 1.05 }); // Vertical skew
}

// Draws each animated demo into a card-like cell.
function draw() {
  background(225, 35, 10);
  let cols = 4, rows = ceil(demos.length / cols), cw = width / cols, ch = height / rows;

  demos.forEach((d, i) => {
    let cx = cw * (i % cols + 0.5), cy = ch * (floor(i / cols) + 0.5);
    let bw = min(cw - 20, 180), bh = min(ch - 20, 180), rad = min(bw, bh) * 0.24;
    let ox = d.name === "orbit" ? cos(d.ang) * rad : d.x;
    let oy = d.name === "orbit" ? sin(d.ang) * rad : d.y;

    push();
    translate(cx, cy + 8);
    noFill();
    stroke(0, 0, 100);
    strokeWeight(1);
    rect(0, 0, bw, bh);
    noStroke();
    fill(0, 0, 100);
    textSize(13);
    text(d.name, 0, -bh * 0.34);
    translate(ox, oy);
    rotate(d.r);
    shearX(d.shx);
    shearY(d.shy);
    scale(d.s);
    noFill();
    stroke(d.name === "color" ? color(d.h, 80, 100, d.a) : color(0, 0, 100, d.a));
    strokeWeight(d.sw);
    rect(0, 0, d.w, d.hh);
    pop();
  });
}

// Keeps the canvas size in sync with the browser window.
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}
