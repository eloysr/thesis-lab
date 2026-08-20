/*
 * © 2026 Schultzschultz. Created for 'Schultzschultz Creative Coding Masterclass'.
 * For educational use only. All rights reserved.
 * 
 * ------------------------
 * Principles of Toolmaking
 * ------------------------
 */


let clusters = {};

const colors = {
  bg: '#000000',
  panel: '#000000',
  panelDeep: '#000000',
  border: '#333333',
  borderSoft: '#000000',
  amber: '#888888',
  amberDim: '#666666',
  text: '#e8e2d9',
  textMid: '#888888',
  textDim: '#444444',
  exp: '#ffffff',
  nodeFill: '#000000',
  expFill: '#000000',
};

function getDimmedColor(hexColor, dimFactor = 0.28) {
  const normalized = hexColor.replace('#', '');
  const redChannel = parseInt(normalized.slice(0, 2), 16);
  const greenChannel = parseInt(normalized.slice(2, 4), 16);
  const blueChannel = parseInt(normalized.slice(4, 6), 16);

  return color(
    redChannel * dimFactor,
    greenChannel * dimFactor,
    blueChannel * dimFactor,
  );
}

const graphSize = { width: 960, height: 700 };

let concepts = [];
let experiential = [];
let mechEdges = [];
let related = {};

// Represents one graph node and handles hit testing plus canvas drawing.
class GraphNode {
  // Copies raw node data into the instance and flags experiential nodes.
  constructor(data) {
    Object.assign(this, data);
    this.isExperiential = this.cluster === 'experiential';
  }

  // Returns the rendered node radius for the current layout.
  getRadius(layout) {
    return this.isExperiential ? layout.expRadius : layout.nodeRadius;
  }

  // Maps the node's stored graph coordinates into the current canvas layout.
  getScreenPosition(layout) {
    return {
      x: map(this.x, 0, graphSize.width, layout.graphX, layout.graphX + layout.graphWidth),
      y: map(this.y, 0, graphSize.height, layout.graphY, layout.graphY + layout.graphHeight),
    };
  }

  // Converts a screen position back into graph-space coordinates.
  setScreenPosition(screenX, screenY, layout) {
    this.x = map(
      screenX,
      layout.graphX,
      layout.graphX + layout.graphWidth,
      0,
      graphSize.width,
    );
    this.y = map(
      screenY,
      layout.graphY,
      layout.graphY + layout.graphHeight,
      0,
      graphSize.height,
    );
    this.clampToGraph(layout);
  }

  // Moves the node to the pointer while preserving the press offset.
  dragToPointer(pointerX, pointerY, layout, offsetX = 0, offsetY = 0) {
    this.setScreenPosition(pointerX - offsetX, pointerY - offsetY, layout);
  }

  // Keeps the node fully inside the graph drawing region.
  clampToGraph(layout) {
    const screenPoint = this.getScreenPosition(layout);
    const radius = this.getRadius(layout);
    const clampedX = constrain(
      screenPoint.x,
      layout.graphX + radius,
      layout.graphX + layout.graphWidth - radius,
    );
    const clampedY = constrain(
      screenPoint.y,
      layout.graphY + radius,
      layout.graphY + layout.graphHeight - radius,
    );

    this.x = map(
      clampedX,
      layout.graphX,
      layout.graphX + layout.graphWidth,
      0,
      graphSize.width,
    );
    this.y = map(
      clampedY,
      layout.graphY,
      layout.graphY + layout.graphHeight,
      0,
      graphSize.height,
    );
  }

  // Separates two overlapping nodes by pushing them apart in screen space.
  resolveOverlap(otherNode, layout, pushStrength = 0.5) {
    const point = this.getScreenPosition(layout);
    const otherPoint = otherNode.getScreenPosition(layout);
    const dx = point.x - otherPoint.x;
    const dy = point.y - otherPoint.y;
    const distance = sqrt(dx * dx + dy * dy) || 0.0001;
    const minDistance = this.getRadius(layout) + otherNode.getRadius(layout) + 10;

    if (distance >= minDistance) {
      return;
    }

    const overlap = (minDistance - distance) * pushStrength;
    const offsetX = (dx / distance) * overlap;
    const offsetY = (dy / distance) * overlap;

    this.setScreenPosition(point.x + offsetX, point.y + offsetY, layout);
    otherNode.setScreenPosition(otherPoint.x - offsetX, otherPoint.y - offsetY, layout);
  }

  // Returns whether a pointer position lands inside this node's interactive area.
  containsPoint(px, py, layout) {
    const point = this.getScreenPosition(layout);
    const radius = this.getRadius(layout);
    return dist(px, py, point.x, point.y) <= radius + 6;
  }

  // Draws the node and its label using the current hover or selection state.
  draw(graphApp, layout, focusId) {
    const point = this.getScreenPosition(layout);
    const neighbors = focusId ? graphApp.adj[focusId] || [] : [];
    const isFocused = focusId === this.id;
    const isNeighbor = focusId ? neighbors.includes(this.id) : false;
    const clusterHighlighted =
      !focusId && graphApp.highlightedCluster === this.cluster;
    const clusterMuted =
      !focusId && graphApp.highlightedCluster && !clusterHighlighted;
    const shouldFade = focusId
      ? !isFocused && !isNeighbor
      : clusterMuted;
    const alpha = clusterMuted
      ? 1
      : shouldFade
        ? graphApp.fadedNodeAlpha
        : 1;
    const clusterColor = this.isExperiential ? colors.exp : clusters[this.cluster].color;
    const strokeColor = clusterMuted ? colors.border : clusterColor;
    const fillColor = clusterMuted
      ? colors.nodeFill
      : isFocused
        ? getDimmedColor(clusterColor)
        : this.isExperiential
          ? colors.expFill
          : colors.nodeFill;

    push();
    strokeWeight(isFocused || clusterHighlighted ? 2.5 : 1.5);
    stroke(red(strokeColor), green(strokeColor), blue(strokeColor), alpha * 255);
    fill(red(fillColor), green(fillColor), blue(fillColor));

    const radius = this.getRadius(layout);
    circle(point.x, point.y, radius * 2);

    if (clusterMuted) {
      pop();
      return;
    }

    const labelLines = this.label.split('\n');
    const labelY = point.y + radius + 20;

    noStroke();
    textAlign(CENTER, TOP);
    textFont(uiFont);
    textSize(layout.labelSize);
    fill(red(colors.textMid), green(colors.textMid), blue(colors.textMid), alpha * 255);
    if (isFocused || clusterHighlighted) {
      fill(red(colors.text), green(colors.text), blue(colors.text), 255);
    }
    for (let index = 0; index < labelLines.length; index += 1) {
      text(labelLines[index], point.x, labelY + index * (layout.labelSize + 3));
    }
    pop();
  }
}

// Represents a connection between two nodes and draws the matching line style.
class GraphEdge {
  // Stores the edge endpoints and whether it is a mechanical or experiential link.
  constructor(fromId, toId, type) {
    this.fromId = fromId;
    this.toId = toId;
    this.type = type;
  }

  // Draws the edge with highlight styling when one of its endpoints is focused.
  draw(graphApp, layout, focusId) {
    const fromNode = graphApp.nodeMap.get(this.fromId);
    const toNode = graphApp.nodeMap.get(this.toId);
    const fromPoint = fromNode.getScreenPosition(layout);
    const toPoint = toNode.getScreenPosition(layout);
    const isActive = focusId && (focusId === this.fromId || focusId === this.toId);

    if (focusId && !isActive && !graphApp.showAllEdgesDuringDrag) {
      return;
    }

    const baseColor = this.type === 'exp' ? colors.exp : colors.border;
    const activeColor = this.type === 'exp' ? colors.exp : colors.amber;
    const lineColor = isActive ? activeColor : baseColor;
    const alpha = focusId
      ? isActive
        ? 0.9
        : graphApp.fadedEdgeAlpha
      : this.type === 'exp'
        ? 0.18
        : 1;

    push();
    strokeWeight(isActive ? 1.8 : 1);
    stroke(red(lineColor), green(lineColor), blue(lineColor), alpha * 255);
    if (this.type === 'exp') {
      drawingContext.setLineDash([4, 5]);
    }
    line(fromPoint.x, fromPoint.y, toPoint.x, toPoint.y);
    drawingContext.setLineDash([]);
    pop();
  }
}