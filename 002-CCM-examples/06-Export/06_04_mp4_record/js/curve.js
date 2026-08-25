/*
 * © 2026 Schultzschultz. Created for 'Schultzschultz Creative Coding Masterclass'.
 * For educational use only. All rights reserved.
 *
 * -------------------------------
 * Export MP4 Record – Curve Class
 * -------------------------------
 *
 * This file is the implementation of the Curve class, which handles the creation and display of the curves drawn on the canvas.
 *
 * What this file does:
 * - Defines the Curve class, which manages the points, animation, and text rendering for each curve.
 * - Implements a follower system for smooth input, where the curve follows the mouse position with easing.
 * - Uses a Catmull-Rom spline approach to create smooth curves, converting them to Bézier for rendering.
 * - Fills the curve with text that animates along its length, using a masking technique to confine the text to the shape of the curve.
*/

class Curve {

  constructor(x, y, isStraightLine = false, preset = {}) {
    this.points = [{ x, y }];
    this.animationOffset = 0;
    this.isStraightLine = isStraightLine;
    this.isComplete = false;
    this.text = preset.text ?? "no text provided";
    this.color = preset.color ?? 255;
    this.lineWidth = preset.lineWidth ?? 80;
    this.letterHeightFactor = 1.0;
    this.letterSpacingFactor = 0.1;
    this.textSeparator = '  ';
    this.textAnimSpeed = 1.5;
    this.speed = random(0.5, 3);
    this._follower = { x, y };
    this._followerEasing = 0.15;
    this._textGfx = null;
    this._bufferWidth = 0;
    this._bufferHeight = 0;
  }

  addPoint(x, y, minDistance = 25) {
    const points = this.points;
    const last = points[points.length - 1];
    if (this.isStraightLine) {
      if (points.length === 1) points.push({ x, y });
      else points[1] = { x, y };
      return;
    }
    if (dist(x, y, last.x, last.y) >= minDistance) {
      points.push({ x, y });
      if (points.length >= 3) {
        this.applySmoothing();
      }
    }
  }

  applySmoothing() {
    const points = this.points;
    if (points.length < 3) return;
    const strength = 0.3;
    const idx = points.length - 2;
    if (idx > 0 && idx < points.length - 1) {
      const prev = points[idx - 1];
      const curr = points[idx];
      const next = points[idx + 1];
      points[idx] = {
        x: curr.x + (((prev.x + next.x) / 2) - curr.x) * strength,
        y: curr.y + (((prev.y + next.y) / 2) - curr.y) * strength
      };
    }
  }

  finish() {
    if (this.points.length >= 3) {
      this.applySmoothing();
    }
    this.isComplete = true;
  }

  display() {
    if (this.points.length < 2) return;

    const w = width;
    const h = height;

    // Draw curve stroke directly on canvas 
    stroke(this.color);
    strokeWeight(this.lineWidth);
    noFill();
    strokeCap(SQUARE);
    strokeJoin(ROUND);
    this._drawBezier();

    // Recreate buffer if canvas size has changed
    if (this._bufferWidth !== w || this._bufferHeight !== h) {
      if (this._textGfx) this._textGfx.remove();
      this._textGfx = createGraphics(w, h);
      this._bufferWidth = w;
      this._bufferHeight = h;
    }
    if (!this._textGfx) this._textGfx = createGraphics(w, h);

    // Draw text into buffer
    const tg = this._textGfx;
    tg.clear();
    const displayText = this.text.toUpperCase();
    if (this.points.length < 4) {
      this._drawLettersOnLine(displayText, tg);
    } else {
      this._drawLettersOnCurve(displayText, tg);
    }

    // Use curve shape as mask via destination-in
    tg.drawingContext.globalCompositeOperation = 'destination-in';
    tg.noFill();
    tg.stroke(255);
    tg.strokeWeight(this.lineWidth);
    tg.strokeCap(SQUARE);
    tg.strokeJoin(ROUND);
    this._drawBezier(tg);
    tg.drawingContext.globalCompositeOperation = 'source-over';

    // Draw masked text onto canvas 
    image(tg, 0, 0);
  }

  remove() {
    if (this._textGfx) { this._textGfx.remove(); this._textGfx = null; }
  }

  followMouse(mx, my) {
    const d = dist(this._follower.x, this._follower.y, mx, my);
    if (d > 2) {
      this._follower.x = lerp(this._follower.x, mx, this._followerEasing);
      this._follower.y = lerp(this._follower.y, my, this._followerEasing);
    }
    const last = this.points[this.points.length - 1];
    const minDistance = 25;
    if (dist(this._follower.x, this._follower.y, last.x, last.y) >= minDistance) {
      this.addPoint(this._follower.x, this._follower.y);
    }
  }

  update() {
    this.animationOffset -= this.textAnimSpeed * this.speed;
  }

  _drawBezier(g = null) {
    const pts = this.points;
    if (pts.length < 2) return;
    const G = g || window;

    if (this.isStraightLine || pts.length === 2) {
      G.beginShape();
      G.noFill();
      G.vertex(pts[0].x, pts[0].y);
      G.vertex(pts[pts.length - 1].x, pts[pts.length - 1].y);
      G.endShape();
    } else {
      G.beginShape();
      G.noFill();
      G.vertex(pts[0].x, pts[0].y);
      const extended = Curve.calcExtensionPoints(pts);
      for (let i = 1; i < extended.length - 2; i++) {
        const bp = Curve.pointsToBezier(extended[i - 1], extended[i], extended[i + 1], extended[i + 2]);
        G.bezierVertex(bp.cp1x, bp.cp1y, bp.cp2x, bp.cp2y, extended[i + 1].x, extended[i + 1].y);
      }
      G.endShape();
    }
  }

  _drawLettersOnLine(displayText, g) {
    if (this.points.length < 2) return;

    g.textFont(font);
    g.textStyle(BOLD);
    const fSize = this.lineWidth * this.letterHeightFactor;
    g.textSize(fSize);
    g.textAlign(CENTER, CENTER);
    g.noStroke();
    g.fill(backgroundColor);

    const pts = this.points;
    let segments = [];
    let totalLength = 0;
    for (let i = 0; i < pts.length - 1; i++) {
      const p1 = pts[i];
      const p2 = pts[i + 1];
      const len = dist(p1.x, p1.y, p2.x, p2.y);
      segments.push({ start: createVector(p1.x, p1.y), end: createVector(p2.x, p2.y), length: len });
      totalLength += len;
    }
    if (totalLength <= 0) return;

    const repeatedText = Curve.repeatTextToFillLength(displayText, totalLength, fSize, g, this.textSeparator);
    const baseSpacing = this.letterSpacingFactor * this.lineWidth;
    let curLen = baseSpacing + (this.animationOffset || 0);

    for (let i = 0; i < repeatedText.length; i++) {
      const ch = repeatedText[i];
      const chW = ch === ' ' ? g.textWidth(ch) * 1.5 : g.textWidth(ch);
      const center = curLen + chW / 2;
      const pos = Curve.getPositionOnLine(segments, center, totalLength);
      if (pos) {
        const margin = 100;
        if (pos.x >= -margin && pos.x <= width + margin && pos.y >= -margin && pos.y <= height + margin) {
          g.push();
          g.translate(pos.x, pos.y);
          g.rotate(pos.angle);
          g.text(ch, 0, 0 - fSize * 0.15);
          g.pop();
        }
      }
      curLen += chW + baseSpacing;
    }
  }

  _drawLettersOnCurve(displayText, g) {
    if (this.points.length < 4) return;

    g.textFont(font);
    const fSize = this.lineWidth * this.letterHeightFactor;
    g.textSize(fSize);
    g.textAlign(CENTER, CENTER);
    g.noStroke();
    g.fill(backgroundColor);

    const pts = this.points;
    const extended = Curve.calcExtensionPoints(pts);
    let segments = [];
    let totalLength = 0;

    for (let i = 1; i < extended.length - 2; i++) {
      if (i >= 1 && i < pts.length) {
        const bp = Curve.pointsToBezier(extended[i - 1], extended[i], extended[i + 1], extended[i + 2]);
        const a = createVector(extended[i].x, extended[i].y);
        const b = createVector(bp.cp1x, bp.cp1y);
        const c = createVector(bp.cp2x, bp.cp2y);
        const d = createVector(extended[i + 1].x, extended[i + 1].y);
        const len = Curve.calcBezierLength([a, b, c, d], 20);
        segments.push({ a, b, c, d, len });
        totalLength += len;
      }
    }
    if (totalLength <= 0) return;

    const repeatedText = Curve.repeatTextToFillLength(displayText, totalLength, fSize, g, this.textSeparator);
    const baseSpacing = this.letterSpacingFactor * this.lineWidth;
    let curLen = baseSpacing + (this.animationOffset || 0);

    for (let i = 0; i < repeatedText.length; i++) {
      const ch = repeatedText[i];
      const chW = ch === ' ' ? g.textWidth(ch) * 1.5 : g.textWidth(ch);
      const center = curLen + chW / 2;

      if (center + chW / 2 < 0 || center - chW / 2 > totalLength) {
        curLen += chW + baseSpacing;
        continue;
      }

      const pos = Curve.getPositionAndAngleOnCurve(segments, center, totalLength);
      if (pos) {
        const margin = 200;
        if (pos.x >= -margin && pos.x <= width + margin && pos.y >= -margin && pos.y <= height + margin) {
          g.push();
          g.translate(pos.x, pos.y);
          g.rotate(pos.angle);
          g.text(ch, 0, 0 - fSize * 0.15);
          g.pop();
        }
      }
      curLen += chW + baseSpacing;
    }
  }

  static repeatTextToFillLength(originalText, targetLength, fSize, g = null, separator = ' ') {
    if (!originalText || targetLength <= 0) return originalText;
    const G = g || window;
    const savedSize = G.textSize();
    G.textSize(fSize);
    const baseW = G.textWidth(originalText);
    const sepW = G.textWidth(separator);
    G.textSize(savedSize);
    if (baseW <= 0) return originalText;
    const unitWidth = baseW + sepW;
    const base = Math.ceil(targetLength / unitWidth);
    const reps = Math.min(200, Math.max(30, base * 20));
    let result = '';
    for (let i = 0; i < reps; i++) {
      result += originalText;
      if (i < reps - 1) result += separator;
    }
    return result;
  }

  static getPositionOnLine(segments, targetLength, totalLength) {
    if (segments.length === 0) return null;

    if (targetLength < 0) {
      const seg = segments[0];
      const angle = atan2(seg.end.y - seg.start.y, seg.end.x - seg.start.x);
      return { x: seg.start.x - cos(angle) * (-targetLength), y: seg.start.y - sin(angle) * (-targetLength), angle };
    }
    if (targetLength > totalLength) {
      const seg = segments[segments.length - 1];
      const angle = atan2(seg.end.y - seg.start.y, seg.end.x - seg.start.x);
      const d = targetLength - totalLength;
      return { x: seg.end.x + cos(angle) * d, y: seg.end.y + sin(angle) * d, angle };
    }

    let acc = 0;
    for (const seg of segments) {
      if (acc + seg.length >= targetLength) {
        const t = constrain((targetLength - acc) / seg.length, 0, 1);
        return {
          x: lerp(seg.start.x, seg.end.x, t),
          y: lerp(seg.start.y, seg.end.y, t),
          angle: atan2(seg.end.y - seg.start.y, seg.end.x - seg.start.x)
        };
      }
      acc += seg.length;
    }
    const last = segments[segments.length - 1];
    return { x: last.end.x, y: last.end.y, angle: atan2(last.end.y - last.start.y, last.end.x - last.start.x) };
  }

  static getPositionAndAngleOnCurve(segments, targetLength, totalLength) {
    if (segments.length === 0) return null;

    if (targetLength < 0) {
      const seg = segments[0];
      const dir1 = Curve.getDirectionOnBezier(seg.a, seg.b, seg.c, seg.d, 0);
      const dir2 = Curve.getDirectionOnBezier(seg.a, seg.b, seg.c, seg.d, 0.1);
      const angle = atan2((dir1.y + dir2.y) / 2, (dir1.x + dir2.x) / 2);
      return { x: seg.a.x - cos(angle) * (-targetLength), y: seg.a.y - sin(angle) * (-targetLength), angle };
    }
    if (targetLength > totalLength) {
      const seg = segments[segments.length - 1];
      const dir1 = Curve.getDirectionOnBezier(seg.a, seg.b, seg.c, seg.d, 0.9);
      const dir2 = Curve.getDirectionOnBezier(seg.a, seg.b, seg.c, seg.d, 1.0);
      const angle = atan2((dir1.y + dir2.y) / 2, (dir1.x + dir2.x) / 2);
      const d = targetLength - totalLength;
      return { x: seg.d.x + cos(angle) * d, y: seg.d.y + sin(angle) * d, angle };
    }

    let acc = 0;
    for (const seg of segments) {
      if (acc + seg.len >= targetLength) {
        const t = constrain((targetLength - acc) / seg.len, 0, 1);
        const p = Curve.getPointOnBezier(seg.a, seg.b, seg.c, seg.d, t);
        const dir = Curve.getDirectionOnBezier(seg.a, seg.b, seg.c, seg.d, t);
        return { x: p.x, y: p.y, angle: atan2(dir.y, dir.x) };
      }
      acc += seg.len;
    }
    const last = segments[segments.length - 1];
    const dir = Curve.getDirectionOnBezier(last.a, last.b, last.c, last.d, 1.0);
    return { x: last.d.x, y: last.d.y, angle: atan2(dir.y, dir.x) };
  }

  static calcExtensionPoints(pts) {
    if (pts.length < 2) return pts;
    const extended = [...pts];
    let startPt, endPt;
    const lastIdx = pts.length - 1;

    if (pts.length >= 3) {
      const p1 = pts[0], p2 = pts[1], p3 = pts[2];
      const t2 = { x: (p3.x - p1.x) * 0.5, y: (p3.y - p1.y) * 0.5 };
      const h2to1 = { x: p2.x - t2.x / 3, y: p2.y - t2.y / 3 };
      const dir = { x: h2to1.x - p1.x, y: h2to1.y - p1.y };
      startPt = { x: p1.x - dir.x * 2, y: p1.y - dir.y * 2 };
    } else {
      const dir = { x: pts[0].x - pts[1].x, y: pts[0].y - pts[1].y };
      startPt = { x: pts[0].x + dir.x, y: pts[0].y + dir.y };
    }

    if (pts.length >= 3) {
      const p1 = pts[lastIdx - 2], p2 = pts[lastIdx - 1], p3 = pts[lastIdx];
      const t2 = { x: (p3.x - p1.x) * 0.5, y: (p3.y - p1.y) * 0.5 };
      const h2to3 = { x: p2.x + t2.x / 3, y: p2.y + t2.y / 3 };
      const dir = { x: h2to3.x - p3.x, y: h2to3.y - p3.y };
      endPt = { x: p3.x - dir.x * 2, y: p3.y - dir.y * 2 };
    } else {
      const dir = { x: pts[lastIdx].x - pts[lastIdx - 1].x, y: pts[lastIdx].y - pts[lastIdx - 1].y };
      endPt = { x: pts[lastIdx].x + dir.x, y: pts[lastIdx].y + dir.y };
    }

    return [startPt, ...extended, endPt];
  }

  static pointsToBezier(p0, p1, p2, p3) {
    const tension = 0.5;
    const t1x = tension * (p2.x - p0.x);
    const t1y = tension * (p2.y - p0.y);
    const t2x = tension * (p3.x - p1.x);
    const t2y = tension * (p3.y - p1.y);
    return {
      cp1x: p1.x + t1x / 3,
      cp1y: p1.y + t1y / 3,
      cp2x: p2.x - t2x / 3,
      cp2y: p2.y - t2y / 3
    };
  }

  static calcBezierLength(bezierPts, samples = 20) {
    const [p0, p1, p2, p3] = bezierPts;
    let total = 0;
    let prev = createVector(p0.x, p0.y);
    for (let i = 1; i <= samples; i++) {
      const t = i / samples;
      const u = 1 - t;
      const curr = createVector(
        u * u * u * p0.x + 3 * u * u * t * p1.x + 3 * u * t * t * p2.x + t * t * t * p3.x,
        u * u * u * p0.y + 3 * u * u * t * p1.y + 3 * u * t * t * p2.y + t * t * t * p3.y
      );
      total += prev.dist(curr);
      prev = curr;
    }
    return total;
  }

  static getPointOnBezier(a, b, c, d, t) {
    const u = 1 - t;
    return {
      x: u * u * u * a.x + 3 * u * u * t * b.x + 3 * u * t * t * c.x + t * t * t * d.x,
      y: u * u * u * a.y + 3 * u * u * t * b.y + 3 * u * t * t * c.y + t * t * t * d.y
    };
  }

  static getDirectionOnBezier(a, b, c, d, t) {
    const u = 1 - t;
    return {
      x: -3 * u * u * a.x + 3 * u * u * b.x - 6 * u * t * b.x + 6 * u * t * c.x - 3 * t * t * c.x + 3 * t * t * d.x,
      y: -3 * u * u * a.y + 3 * u * u * b.y - 6 * u * t * b.y + 6 * u * t * c.y - 3 * t * t * c.y + 3 * t * t * d.y
    };
  }

}
