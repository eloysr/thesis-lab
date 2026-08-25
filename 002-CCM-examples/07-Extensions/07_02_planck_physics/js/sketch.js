/*
 * © 2026 Schultzschultz. Created for 'Schultzschultz Creative Coding Masterclass'.
 * For educational use only. All rights reserved.
 * 
 * --------------------------
 * Planck.js – Physics engine
 * --------------------------
 * 
 * This file is a demonstration of using the Planck.js physics engine in a p5.js sketch. 
 * It creates a dynamic scene where various shapes are attracted to the mouse position, 
 * and also attract each other, while being affected by gravity and collisions. 
 *
 * What this file does:
 * - Sets up a Planck.js physics world with boundaries.
 * - Creates multiple dynamic bodies with different shapes.
 * - Applies forces to bodies based on mouse input.
 * - Handles collisions and interactions between bodies.
 * - Renders the bodies using p5.js drawing functions.
 * 
 * Note: Make sure to load the Planck.js library in your HTML file.
 * 
 * For more information on Planck.js, see: https://piqnt.com/planck.js/
 */


let drawingLayer;

let world;
let physicsBodies = [];
let bounds = {};

let mouseFollowerX = 0;
let mouseFollowerY = 0;

// Global tuning variables
let TIME_STEP = 1 / 60;
let WORLD_SCALE = 30;
let GRAVITY_Y = 18;

let BODY_COUNT = 6;
let BODY_SIZE_FACTOR = 0.24; // 80% bigger than 10% of short window side

let PHYSICS_DENSITY = 1.0;
let PHYSICS_FRICTION = 0.35;
let PHYSICS_RESTITUTION = 0.2;
let PHYSICS_LINEAR_DAMPING = 0.16;
let PHYSICS_ANGULAR_DAMPING = 0.22;

let ATTRACTION_FORCE = 12;
let ATTRACTION_RADIUS_FACTOR = 0.55;
let MOUSE_FOLLOW_EASE = 0.18;
let INTER_OBJECT_ATTRACTION_FORCE = 12;
let INTER_OBJECT_ATTRACTION_RADIUS_FACTOR = 0.7;
let SCATTER_ATTEMPTS_PER_BODY = 40;

let BOUNDARY_THICKNESS = 40;

function setup() {
  createCanvas(windowWidth, windowHeight);
  drawingLayer = createGraphics(width, height);
  if (typeof planck === 'undefined') {
    noLoop();
    throw new Error('planck.min.js is not loaded. Please include libraries/planck.min.js before sketch.js.');
  }
  setupWorld();
}

function draw() {
  background(0);
  applyForces();
  world.step(TIME_STEP);
  drawingLayer.clear();
  drawBodies();
  image(drawingLayer, 0, 0, width, height);
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  drawingLayer = createGraphics(width, height);
  setupWorld();
}

function getBodySize() {
  return min(width, height) * BODY_SIZE_FACTOR;
}

function getAttractionRadius() {
  return min(width, height) * ATTRACTION_RADIUS_FACTOR;
}

function smoothstep(edge0, edge1, x) {
  const t = constrain((x - edge0) / (edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
}

function toWorld(px, py) {
  return planck.Vec2(px / WORLD_SCALE, py / WORLD_SCALE);
}

function toPixels(worldVec) {
  return {
    x: worldVec.x * WORLD_SCALE,
    y: worldVec.y * WORLD_SCALE,
  };
}

function createBoundaries() {
  if (bounds.floor) {
    world.destroyBody(bounds.floor);
    world.destroyBody(bounds.left);
    world.destroyBody(bounds.right);
    world.destroyBody(bounds.top);
  }

  const thickness = BOUNDARY_THICKNESS;
  const wallThickness = thickness / WORLD_SCALE;

  bounds.floor = world.createBody();
  bounds.floor.createFixture(
    planck.Box(width / (2 * WORLD_SCALE), wallThickness / 2, toWorld(width / 2, height + thickness / 2), 0),
    { friction: PHYSICS_FRICTION, restitution: PHYSICS_RESTITUTION }
  );

  bounds.top = world.createBody();
  bounds.top.createFixture(
    planck.Box(width / (2 * WORLD_SCALE), wallThickness / 2, toWorld(width / 2, -thickness / 2), 0),
    { friction: PHYSICS_FRICTION, restitution: PHYSICS_RESTITUTION }
  );

  bounds.left = world.createBody();
  bounds.left.createFixture(
    planck.Box(wallThickness / 2, height / (2 * WORLD_SCALE), toWorld(-thickness / 2, height / 2), 0),
    { friction: PHYSICS_FRICTION, restitution: PHYSICS_RESTITUTION }
  );

  bounds.right = world.createBody();
  bounds.right.createFixture(
    planck.Box(wallThickness / 2, height / (2 * WORLD_SCALE), toWorld(width + thickness / 2, height / 2), 0),
    { friction: PHYSICS_FRICTION, restitution: PHYSICS_RESTITUTION }
  );
}

function addDynamicBody(px, py, type, sizePx) {
  const margin = sizePx;
  const spawnX = constrain(px, margin, width - margin);
  const spawnY = constrain(py, margin, height - margin);
  const body = world.createDynamicBody(toWorld(spawnX, spawnY));
  body.setLinearDamping(PHYSICS_LINEAR_DAMPING);
  body.setAngularDamping(PHYSICS_ANGULAR_DAMPING);

  let renderDef;
  if (type === 'box') {
    const w = sizePx;
    const h = sizePx;
    body.createFixture(planck.Box((w / 2) / WORLD_SCALE, (h / 2) / WORLD_SCALE), {
      density: PHYSICS_DENSITY,
      friction: PHYSICS_FRICTION,
      restitution: PHYSICS_RESTITUTION,
    });
    renderDef = { shape: 'box', w, h };
  } else if (type === 'triangle') {
    const side = sizePx;
    const h = side * sqrt(3) * 0.5;
    const triVerts = [
      planck.Vec2(0, (-2 * h / 3) / WORLD_SCALE),
      planck.Vec2((-side / 2) / WORLD_SCALE, (h / 3) / WORLD_SCALE),
      planck.Vec2((side / 2) / WORLD_SCALE, (h / 3) / WORLD_SCALE),
    ];
    body.createFixture(planck.Polygon(triVerts), {
      density: PHYSICS_DENSITY,
      friction: PHYSICS_FRICTION,
      restitution: PHYSICS_RESTITUTION,
    });
    renderDef = {
      shape: 'triangle',
      vertices: [
        { x: 0, y: -2 * h / 3 },
        { x: -side / 2, y: h / 3 },
        { x: side / 2, y: h / 3 },
      ],
    };
  } else {
    const r = sizePx * 0.5;
    body.createFixture(planck.Circle(r / WORLD_SCALE), {
      density: PHYSICS_DENSITY,
      friction: PHYSICS_FRICTION,
      restitution: PHYSICS_RESTITUTION,
    });
    renderDef = { shape: 'circle', r };
  }

  physicsBodies.push({ body, renderDef });
}

function getScatteredSpawnPoints(count, sizePx) {
  const points = [];
  const margin = sizePx * 0.8;
  const minDist = sizePx * 1.35;
  const minDistSq = minDist * minDist;

  for (let i = 0; i < count; i++) {
    let candidate = null;
    for (let attempt = 0; attempt < SCATTER_ATTEMPTS_PER_BODY; attempt++) {
      const x = random(margin, width - margin);
      const y = random(margin, height - margin);

      let overlaps = false;
      for (let j = 0; j < points.length; j++) {
        const dx = x - points[j].x;
        const dy = y - points[j].y;
        if (dx * dx + dy * dy < minDistSq) {
          overlaps = true;
          break;
        }
      }

      if (!overlaps) {
        candidate = { x, y };
        break;
      }
    }

    if (!candidate) {
      candidate = {
        x: random(margin, width - margin),
        y: random(margin, height - margin),
      };
    }

    points.push(candidate);
  }

  return points;
}

function applyForces() {

  mouseFollowerX = lerp(mouseFollowerX, mouseX, MOUSE_FOLLOW_EASE);
  mouseFollowerY = lerp(mouseFollowerY, mouseY, MOUSE_FOLLOW_EASE);

  const mouseFollowerWorld = toWorld(mouseFollowerX, mouseFollowerY);
  const attractionRadiusWorld = getAttractionRadius() / WORLD_SCALE;
  const interAttractionRadiusWorld = (min(width, height) * INTER_OBJECT_ATTRACTION_RADIUS_FACTOR) / WORLD_SCALE;

  for (const obj of physicsBodies) {
    const body = obj.body;
    const mass = body.getMass();
    const center = body.getWorldCenter();

    const toward = planck.Vec2(mouseFollowerWorld.x - center.x, mouseFollowerWorld.y - center.y);
    const dist = Math.sqrt(toward.x * toward.x + toward.y * toward.y);

    if (dist > 0.0001) {
      const normalized = constrain(dist / attractionRadiusWorld, 0, 1);
      const falloff = 1 - smoothstep(0, 1, normalized);
      const invDist = 1 / dist;
      const fx = toward.x * invDist * ATTRACTION_FORCE * falloff * mass;
      const fy = toward.y * invDist * ATTRACTION_FORCE * falloff * mass;
      body.applyForceToCenter(planck.Vec2(fx, fy), true);
    }
  }

  for (let i = 0; i < physicsBodies.length; i++) {
    for (let j = i + 1; j < physicsBodies.length; j++) {
      const bodyA = physicsBodies[i].body;
      const bodyB = physicsBodies[j].body;
      const posA = bodyA.getWorldCenter();
      const posB = bodyB.getWorldCenter();

      const delta = planck.Vec2(posB.x - posA.x, posB.y - posA.y);
      const dist = Math.sqrt(delta.x * delta.x + delta.y * delta.y);

      if (dist > 0.0001) {
        const normalized = constrain(dist / interAttractionRadiusWorld, 0, 1);
        const falloff = 1 - smoothstep(0, 1, normalized);
        if (falloff > 0) {
          const invDist = 1 / dist;
          const strength = INTER_OBJECT_ATTRACTION_FORCE * falloff;
          const fx = delta.x * invDist * strength;
          const fy = delta.y * invDist * strength;

          bodyA.applyForceToCenter(planck.Vec2(fx, fy), true);
          bodyB.applyForceToCenter(planck.Vec2(-fx, -fy), true);
        }
      }
    }
  }
}

function drawBodies() {
  drawingLayer.push();
  drawingLayer.stroke(0);
  drawingLayer.strokeWeight(8);
  drawingLayer.strokeJoin(ROUND);
  drawingLayer.fill(255);

  for (const obj of physicsBodies) {
    const pos = toPixels(obj.body.getPosition());
    const angle = obj.body.getAngle();

    drawingLayer.push();
    drawingLayer.translate(pos.x, pos.y);
    drawingLayer.rotate(angle);

    if (obj.renderDef.shape === 'box') {
      drawingLayer.rectMode(CENTER);
      drawingLayer.rect(0, 0, obj.renderDef.w, obj.renderDef.h);
    } else if (obj.renderDef.shape === 'triangle') {
      const v = obj.renderDef.vertices;
      drawingLayer.triangle(v[0].x, v[0].y, v[1].x, v[1].y, v[2].x, v[2].y);
    } else {
      drawingLayer.ellipse(0, 0, obj.renderDef.r * 2, obj.renderDef.r * 2);
    }
    drawingLayer.pop();
  }

  drawingLayer.pop();
}

function setupWorld() {
  physicsBodies = [];
  bounds = {};

  world = new planck.World(planck.Vec2(0, GRAVITY_Y / WORLD_SCALE));
  createBoundaries();

  const sizePx = getBodySize();
  const types = ['triangle', 'circle', 'box'];
  const points = getScatteredSpawnPoints(BODY_COUNT, sizePx);
  for (let i = 0; i < BODY_COUNT; i++) {
    const type = types[i % types.length];
    addDynamicBody(points[i].x, points[i].y, type, sizePx);
  }

  mouseFollowerX = width * 0.5;
  mouseFollowerY = height * 0.5;
}
