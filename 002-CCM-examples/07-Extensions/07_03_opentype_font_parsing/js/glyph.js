/*
 * © 2026 Schultzschultz. Created for 'Schultzschultz Creative Coding Masterclass'.
 * For educational use only. All rights reserved.
 *
 * -----------------------------------------------------
 * Opentype.js – Glyph, GlyphPath and GlyphPoint classes 
 * -----------------------------------------------------
 *
 * This file is the implementation of the  Glyph, GlyphPath, and GlyphPoint classes, 
 * which represent the structure of a font glyph and manage the interactive 
 * distortion effect.
 *
 * A Glyph represents a single character from the font, containing its outline data 
 * and methods to draw and update it. Each Glyph is made up of one or more GlyphPaths.
 * A GlyphPath represents one closed contour (sub-path) within a glyph outline.
 * Simple glyphs like 'I' have one GlyphPath; glyphs with counters like 'O' or 'B'
 * have two or more (outer shape + inner holes). Each GlyphPath consists of a 
 * sequence of GlyphPoint.
 * A GlyphPoint stores the data for a single node on a glyph contour, including its 
 * original font-space coordinates, the derived canvas position, and an animated push-away 
 * offset that is updated every frame based on the force field.
 *  
 * What this file does:
 * - Defines the Glyph, GlyphPath, and GlyphPoint classes that encapsulate the structure 
 *   and behavior of font glyphs.
 * - Manages the state of each glyph, including its outline data, canvas positions, 
 *   and push-away offsets.      
 * - Provides methods to draw the glyphs as filled shapes or outlines with point markers, 
 *   and to update their positions based on the interactive force field.
 * - These classes are used in the main sketch to create a dynamic interaction where glyph 
 *   points are repelled from the mouse cursor, allowing users to "push" on the letterforms.
 * 
 * Note: This file relies on the opentype.js library for parsing font data, and p5.js for drawing and vector math.
*/


// Represents a single character glyph, containing its outline data and methods to draw and update it.
class Glyph {

  // char: the character to display (e.g. 'A')
  // font: the active Font instance that provides the raw opentype data
  constructor(char, font) {
    this.char = char;
    this.data = font.data.charToGlyph(char); // Raw opentype.js glyph object
    this.advanceWidth = this.data.advanceWidth; // How far to move the cursor after this glyph
    this.paths = this.buildPaths(); // Parse the outline into an array of GlyphPath objects
  }

  // Splits the flat command list from opentype.js into individual contours.
  // A new contour starts with each 'M' (moveTo) command.
  buildPaths() {
    const commands = this.data.path.commands;
    const paths = [];
    let current = [];

    for (let cmd of commands) {
      if (cmd.type === 'M' && current.length > 0) {
        paths.push(new GlyphPath(current));
        current = [];
      }
      current.push(cmd);
    }

    if (current.length > 0) {
      paths.push(new GlyphPath(current));
    }

    return paths;
  }

  // Updates pt.position (canvas coords) for every anchor point.
  // Must be called once per frame before pushAway(), with the same
  // originX that will be used for drawing.
  setPositions(originX, baselineY, scale) {
    for (let path of this.paths) {
      for (let pt of path.points) {
        if (pt.type === 'Z') continue;
        // Anchor
        if (pt.x !== null) pt.position.set(originX + pt.x * scale, baselineY - pt.y * scale);
        // Control point 1 (C, Q)
        if (pt.x1 !== null) pt.position1.set(originX + pt.x1 * scale, baselineY - pt.y1 * scale);
        // Control point 2 (C only)
        if (pt.x2 !== null) pt.position2.set(originX + pt.x2 * scale, baselineY - pt.y2 * scale);
      }
    }
  }
  // Emits all vertices of a path as p5.js shape commands.
  // Uses pt.position (set by setPositions) plus pushAwayOffset.
  // 'Z' is skipped – closing is handled by endShape(CLOSE) / endContour().
  _emitPath(path) {
    for (let pt of path.points) {
      switch (pt.type) {
        case 'M': // MoveTo — starts a new sub-path (treated as a straight vertex here)
        case 'L': // LineTo — straight line to this point
          vertex(
            pt.position.x + pt.pushAwayOffset.x,
            pt.position.y + pt.pushAwayOffset.y
          );
          break;
        case 'C': // Cubic Bézier — two control points plus the anchor
          bezierVertex(
            pt.position1.x + pt.pushAwayOffset1.x, pt.position1.y + pt.pushAwayOffset1.y, // Control point 1
            pt.position2.x + pt.pushAwayOffset2.x, pt.position2.y + pt.pushAwayOffset2.y, // Control point 2
            pt.position.x + pt.pushAwayOffset.x, pt.position.y + pt.pushAwayOffset.y      // Anchor
          );
          break;
        case 'Q': // Quadratic Bézier — one control point plus the anchor
          quadraticVertex(
            pt.position1.x + pt.pushAwayOffset1.x, pt.position1.y + pt.pushAwayOffset1.y, // Control point
            pt.position.x + pt.pushAwayOffset.x, pt.position.y + pt.pushAwayOffset.y      // Anchor
          );
          break;
        case 'Z': // ClosePath — handled by endShape(CLOSE), so nothing to emit here
          break;
      }
    }
  }

  // Draws this glyph as a filled shape.
  // The first path is the outer contour; subsequent paths are counter forms (holes)
  // handled via beginContour() / endContour().
  draw(originX, baselineY, scale) {
    beginShape();
    for (let i = 0; i < this.paths.length; i++) {
      if (i === 0) {
        this._emitPath(this.paths[i]);
      } else {
        beginContour();
        this._emitPath(this.paths[i]);
        endContour();
      }
    }
    endShape(CLOSE);
  }

  // Draws this glyph as an outline with point markers (for inspection).
  // On-curve points (M, L):         white square
  // Off-curve control points (C, Q): cyan circle + handle line to anchor
  drawOutline(originX, baselineY, scale) {
    const anchorSize = 10;
    const handleSize = 8;

    // --- Contour outlines (one beginShape per path) ---
    noFill();
    stroke(255);
    strokeWeight(1);
    for (let path of this.paths) {
      beginShape();
      this._emitPath(path);
      endShape(CLOSE);
    }

    // --- Point markers ---
    for (let path of this.paths) {
      let prevAX = null;
      let prevAY = null;

      for (let pt of path.points) {
        if (pt.type === 'Z') continue;

        const ax = pt.position.x + pt.pushAwayOffset.x;
        const ay = pt.position.y + pt.pushAwayOffset.y;

        if (pt.type === 'C') {
          const h1x = pt.position1.x + pt.pushAwayOffset1.x;
          const h1y = pt.position1.y + pt.pushAwayOffset1.y;
          const h2x = pt.position2.x + pt.pushAwayOffset2.x;
          const h2y = pt.position2.y + pt.pushAwayOffset2.y;

          // Handle lines
          stroke(0, 255, 0);
          noFill();
          if (prevAX !== null) line(prevAX, prevAY, h1x, h1y);
          line(ax, ay, h2x, h2y);

          // Control point circles
          noStroke();
          fill(0, 255, 0);
          circle(h1x, h1y, handleSize);
          circle(h2x, h2y, handleSize);


        } else if (pt.type === 'Q') {
          const h1x = pt.position1.x + pt.pushAwayOffset1.x;
          const h1y = pt.position1.y + pt.pushAwayOffset1.y;

          // Handle line
          stroke(0, 200, 255, 128);
          noFill();
          if (prevAX !== null) line(prevAX, prevAY, h1x, h1y);
          line(ax, ay, h1x, h1y);

          // Control point circle
          noStroke();
          fill(0, 200, 255);
          circle(h1x, h1y, handleSize);

        }

        // On-curve anchor: white square
        noStroke();
        fill(255);
        rectMode(CENTER);
        rect(ax, ay, anchorSize, anchorSize);

        prevAX = ax;
        prevAY = ay;
      }
    }

    rectMode(CORNER);
  }

  update(forceField, maxPush) {
    for (let path of this.paths) {
      for (let pt of path.points) {
        pt.applyPushAway(forceField, maxPush);
      }
      path.harmonize();
    }
  }
}


// Represents one closed contour (sub-path) within a glyph outline.
class GlyphPath {

  // commands: array of raw opentype.js path commands for this single contour
  constructor(commands) {
    // Convert each raw opentype command into a Point object for easier manipulation
    this.points = commands.map(cmd =>
      new GlyphPoint(cmd.type, cmd.x, cmd.y, cmd.x1, cmd.y1, cmd.x2, cmd.y2)
    );
  }

  // Returns true if three points are approximately collinear (smooth node).
  // Uses the normalized cross product |sin(angle)| – scale-independent.
  // A threshold of 0.18 corresponds to ~10°.
  _isSmooth(p1, p2, p3) {
    const ax = p2.x - p1.x, ay = p2.y - p1.y;
    const bx = p3.x - p2.x, by = p3.y - p2.y;
    const lenA = Math.sqrt(ax * ax + ay * ay);
    const lenB = Math.sqrt(bx * bx + by * by);
    if (lenA < 0.001 || lenB < 0.001) return false;
    const sinAngle = Math.abs(ax * by - ay * bx) / (lenA * lenB);
    return sinAngle < 0.18; // ~10° tolerance
  }

  // After push-away offsets are applied, re-aligns control points at smooth nodes
  // to maintain G1 continuity. Anchors are never moved – only CPs are adjusted.
  harmonize() {
    // Build a flat node list: each CP and anchor becomes its own node.
    // type 'O' = off-curve CP, otherwise on-curve anchor.
    // pos   = current canvas position (basePos + offVec), mutable.
    // basePos = reference to the p5.Vector for the original canvas position.
    // offVec  = reference to the p5.Vector pushAwayOffset (we write here).
    const nodes = [];
    for (const pt of this.points) {
      if (pt.type === 'Z') continue;
      if (pt.type === 'C') {
        if (pt.x1 !== null) nodes.push({
          type: 'O',
          pos: { x: pt.position1.x + pt.pushAwayOffset1.x, y: pt.position1.y + pt.pushAwayOffset1.y },
          basePos: pt.position1,
          offVec: pt.pushAwayOffset1
        });
        if (pt.x2 !== null) nodes.push({
          type: 'O',
          pos: { x: pt.position2.x + pt.pushAwayOffset2.x, y: pt.position2.y + pt.pushAwayOffset2.y },
          basePos: pt.position2,
          offVec: pt.pushAwayOffset2
        });
        nodes.push({
          type: pt.type,
          pos: { x: pt.position.x + pt.pushAwayOffset.x, y: pt.position.y + pt.pushAwayOffset.y },
          basePos: pt.position,
          offVec: pt.pushAwayOffset
        });
      } else {
        nodes.push({
          type: pt.type,
          pos: { x: pt.position.x + pt.pushAwayOffset.x, y: pt.position.y + pt.pushAwayOffset.y },
          basePos: pt.position,
          offVec: pt.pushAwayOffset
        });
      }
    }

    const n = nodes.length;
    if (n < 2) return;

    // Move off-curve node `cp` so it lies on the line through anchor `anch`
    // in the direction from `refPos` (the opposite CP or anchor) to `anch`,
    // preserving the distance |anchor → cp|.
    const alignCP = (refPos, anch, cp) => {
      // Direction: from refPos through anch, extended
      const dx = anch.pos.x - refPos.x;
      const dy = anch.pos.y - refPos.y;
      const len = Math.sqrt(dx * dx + dy * dy);
      if (len < 0.001) return;
      const nx = dx / len, ny = dy / len;
      // Distance from anchor to cp (preserve)
      const dist = Math.sqrt(
        (cp.pos.x - anch.pos.x) ** 2 + (cp.pos.y - anch.pos.y) ** 2
      );
      // Place cp on the ray from anch in direction nx,ny (beyond anch, away from ref)
      const newX = anch.pos.x + nx * dist;
      const newY = anch.pos.y + ny * dist;
      cp.pos.x = newX;
      cp.pos.y = newY;
      cp.offVec.x = newX - cp.basePos.x;
      cp.offVec.y = newY - cp.basePos.y;
    };

    for (let i = 0; i < n; i++) {
      const node = nodes[i];
      const prev = nodes[(i - 1 + n) % n];
      const prev2 = nodes[(i - 2 + n) % n];
      const next = nodes[(i + 1) % n];
      const next2 = nodes[(i + 2) % n];

      // Skip off-curve nodes. Skip M – its junction is handled from C_last's perspective.
      if (node.type === 'O' || node.type === 'M') continue;

      const prevIsCP = prev.type === 'O';
      const prev2IsCP = prev2.type === 'O';

      // When next is M (closed-path wrap-around), look through M to the actual next node.
      // M and C_last share the same position, so using M.pos as a direction reference
      // would produce a zero-length vector and block all harmonization at the junction.
      const nextEff = next.type === 'M' ? next2 : next;
      const nextIsCP = nextEff.type === 'O';

      if (!prevIsCP && !nextIsCP) continue; // straight-to-straight: nothing to align

      // Case: O, O → Anchor → Anchor (two CPs arriving, followed by a straight segment)
      // Align the inner CP (prev) toward the straight segment if collinear.
      if (prevIsCP && prev2IsCP && !nextIsCP) {
        if (this._isSmooth(prev.basePos, node.basePos, nextEff.basePos)) {
          alignCP(nextEff.pos, node, prev);
        }
        continue;
      }

      // All remaining cases: _isSmooth decides whether to harmonize
      if (prevIsCP && nextIsCP) {
        // Curve ↔ Curve: align both CPs through anchor
        if (!this._isSmooth(prev.basePos, node.basePos, nextEff.basePos)) continue;
        alignCP(nextEff.pos, node, prev);
        alignCP(prev.pos, node, nextEff);
      } else if (prevIsCP) {
        // Curve → Straight (incl. CP → C → L and CP → C_last → M → L)
        if (!this._isSmooth(prev.basePos, node.basePos, nextEff.basePos)) continue;
        alignCP(nextEff.pos, node, prev);
      } else {
        // Straight → Curve (incl. M → L → CP and L → C → CP)
        if (!this._isSmooth(prev.basePos, node.basePos, nextEff.basePos)) continue;
        alignCP(prev.pos, node, nextEff);
      }
    }
  }

}

// Stores the data for a single node on a glyph contour, including its original
// font-space coordinates, the derived canvas position, and an animated push-away offset
// that is updated every frame based on the force field.
class GlyphPoint {

  // type:   'M' (moveTo), 'L' (lineTo), 'C' (cubicBezier), 'Q' (quadraticBezier), 'Z' (close)
  // x, y:   anchor coordinates in font units
  // x1, y1: first control point in font units  (curves only)
  // x2, y2: second control point in font units (cubic curves only)

  constructor(type, x, y, x1 = null, y1 = null, x2 = null, y2 = null) {
    this.type = type;
    this.x = x ?? null; // Anchor X in font units (null for 'Z' close commands)
    this.y = y ?? null; // Anchor Y in font units
    this.x1 = x1;       // Control point 1 X (null if not a curve)
    this.y1 = y1;
    this.x2 = x2;       // Control point 2 X (null if not a cubic curve)
    this.y2 = y2;

    // Canvas-space position of the anchor (recalculated each frame via setPositions)
    this.position = createVector(0, 0);
    // Push-away displacement for the anchor (grows toward the force direction each frame)
    this.pushAwayOffset = createVector(0, 0);

    // Canvas position and push-away offset for control point 1 (used by C and Q)
    this.position1 = createVector(0, 0);
    this.pushAwayOffset1 = createVector(0, 0);

    // Canvas position and push-away offset for control point 2 (cubic curves only)
    this.position2 = createVector(0, 0);
    this.pushAwayOffset2 = createVector(0, 0);
  }

  // Applies push-away force from a forceField to this point's anchor and
  // any control points. maxPush is the maximum displacement in canvas pixels.
  applyPushAway(forceField, maxPush) {
    if (this.type === 'Z') return;
    this._pushSingle(this.position, this.pushAwayOffset, forceField, maxPush);
    if (this.x1 !== null) this._pushSingle(this.position1, this.pushAwayOffset1, forceField, maxPush);
    if (this.x2 !== null) this._pushSingle(this.position2, this.pushAwayOffset2, forceField, maxPush);
  }

  // Pushes one canvas-space position away from the forceField
  // and smoothly lerps the result into targetOffset.
  _pushSingle(pos, targetOffset, forceField, maxPush) {
    let dir = p5.Vector.sub(pos, forceField.position);
    dir.normalize();
    let intensity = forceField.getInfluence(pos);
    dir.mult(maxPush * intensity);
    targetOffset.lerp(dir, 0.3);
  }
}