/*
 * © 2026 Schultzschultz. Created for 'Schultzschultz Creative Coding Masterclass'.
 * For educational use only. All rights reserved.
 * 
 * ------------------------
 * Toolmaking Concepts
 * ------------------------
 * 
 * This sketch visualizes the key concepts and relationships of toolmaking. 
 * It features an interactive graph of concepts, a sidebar for detailed descriptions, 
 * and a legend to explore different clusters of ideas. 
 * 
 * The graph includes  core concepts and experiential principles, which can be toggled 
 * for display. Users can click on nodes to view their details in the sidebar, 
 * and drag nodes around for better visibility. The layout is responsive and adapts 
 * to different screen sizes.
 * 
 * Data is loaded from an external JSON file that defines the concepts, their clusters, 
 * relationships, and experiential principles. 
 */


let nodes = [];
let expNodes = [];
let allNodes = [];
let nodeMap = new Map();
let edges = [];
let expEdges = [];
let adj = {};
let activeId = null;
let hoveredId = null;
let expOn = false;
let toggleHitbox = null;
let legendHitboxes = [];
let hoveredLegendCluster = null;
let tagHitboxes = [];
let draggedNodeId = null;
let dragOffsetX = 0;
let dragOffsetY = 0;
let dragMoved = false;
let dragStartedOnActive = false;
let pressedNodeId = null;
let pressStartX = 0;
let pressStartY = 0;
let graphData = null;

const dragSelectThreshold = 2;

// Typography settings
const displayFont = "Helvetica";
const uiFont = "monospace";
const textBreakpoint = 900;
const nodeLabelTextSizeMin = 10;
const nodeLabelTextSizeMax = 12;
const headingTextSizeMin = 28;
const headingTextSizeMax = 34;
const uiLabelTextSizeMin = 10;
const uiLabelTextSizeMax = 12;
const emptyStateTextSizeMin = 11;
const emptyStateTextSizeMax = 11;
const bodyTextSizeMin = 16;
const bodyTextSizeMax = 18;
const talkingPointTextSizeMin = 12;
const talkingPointTextSizeMax = 14;
const fadedNodeAlpha = 0.18;

function getResponsiveTextSize(min, max) {
  return width < textBreakpoint ? min : max;
}

function preload() {
  graphData = loadJSON('assets/graph-data.json');
}

// Initializes the sketch state and sets up the canvas.
function setup() {
  initializeGraphState();
  createCanvas(windowWidth, windowHeight);
  pixelDensity(Math.min(window.devicePixelRatio || 1, 2));
}

// Draws the full frame, including panels, graph, sidebar, and cursor state.
function draw() {
  background(colors.bg);
  const layout = getLayout();
  updateDraggedNode(layout);
  resolveNodeOverlaps(layout);
  hoveredLegendCluster = findHoveredLegendCluster(layout);
  hoveredId = draggedNodeId ? draggedNodeId : findHoveredNode(mouseX, mouseY, layout);
  legendHitboxes = [];
  tagHitboxes = [];
  const focusId = hoveredId || activeId;

  drawPanels(layout);
  drawTitle(layout);
  drawLegend(layout);
  drawGraph(layout, focusId);
  drawSidebar(layout);
  updateCursor();
}

const graphState = {
  get nodeMap() {
    return nodeMap;
  },
  get adj() {
    return adj;
  },
  get fadedNodeAlpha() {
    return draggedNodeId ? 0.5 : fadedNodeAlpha;
  },
  get fadedEdgeAlpha() {
    return draggedNodeId ? 0.5 : 0.28;
  },
  get showAllEdgesDuringDrag() {
    return Boolean(draggedNodeId);
  },
  get highlightedCluster() {
    return hoveredLegendCluster;
  },
};

// Builds node and edge models plus the lookup tables used by the sketch.
function initializeGraphState() {
  clusters = graphData.clusters;
  concepts = graphData.concepts;
  experiential = graphData.experiential;
  mechEdges = graphData.mechEdges;
  related = graphData.related;

  nodes = concepts.map((item) => new GraphNode(item));
  expNodes = experiential.map((item) => new GraphNode(item));
  allNodes = [...nodes, ...expNodes];
  nodeMap = new Map(allNodes.map((node) => [node.id, node]));
  edges = mechEdges.map(
    ([fromId, toId]) => new GraphEdge(fromId, toId, "mech"),
  );
  expEdges = [];
  expNodes.forEach((node) => {
    node.sources.forEach((sourceId) => {
      expEdges.push(new GraphEdge(sourceId, node.id, "exp"));
    });
  });

  adj = {};
  allNodes.forEach((node) => {
    adj[node.id] = [];
  });
  mechEdges.forEach(([fromId, toId]) => {
    adj[fromId].push(toId);
    adj[toId].push(fromId);
  });
  expNodes.forEach((node) => {
    node.sources.forEach((sourceId) => {
      adj[node.id].push(sourceId);
      adj[sourceId].push(node.id);
    });
  });

  activeId = null;
  hoveredId = null;
  expOn = false;
  toggleHitbox = null;
  legendHitboxes = [];
  hoveredLegendCluster = null;
  tagHitboxes = [];
  draggedNodeId = null;
  dragOffsetX = 0;
  dragOffsetY = 0;
  dragMoved = false;
  dragStartedOnActive = false;
  pressedNodeId = null;
  pressStartX = 0;
  pressStartY = 0;
}

// Computes responsive panel and graph measurements for the current viewport.
function getLayout() {
  const gutter = width < 960 ? 18 : 28;
  const sidebarWidth =
    width < 980
      ? constrain(width * 0.36, 280, 360)
      : constrain(width * 0.31, 320, 390);
  const graphWidth = width - sidebarWidth - gutter * 2;
  const graphHeight = height - gutter * 2;
  const graphPadding = width < 900 ? 28 : 42;

  return {
    gutter,
    graphX: gutter + graphPadding,
    graphY: gutter + graphPadding,
    graphWidth: graphWidth - graphPadding * 2,
    graphHeight: graphHeight - graphPadding * 2,
    sidebarX: width - sidebarWidth,
    sidebarY: 0,
    sidebarWidth,
    sidebarHeight: height,
    nodeRadius: width < 900 ? 14 : 18,
    expRadius: width < 900 ? 18 : 24,
    labelSize: getResponsiveTextSize(
      nodeLabelTextSizeMin,
      nodeLabelTextSizeMax,
    ),
    detailPadding: width < 900 ? 18 : 24,
  };
}

// Paints the graph area and the sidebar background panels.
function drawPanels(layout) {
  noStroke();
  fill(colors.bg);
  rect(0, 0, layout.sidebarX, height);

  fill(colors.panelDeep);
  rect(layout.sidebarX, 0, layout.sidebarWidth, layout.sidebarHeight);

  stroke(colors.border);
  line(layout.sidebarX, 0, layout.sidebarX, height);
}

// Draws the main title block in the top-left corner of the graph area.
function drawTitle(layout) {
  const titleX = layout.gutter + 18;
  const titleY = layout.gutter + 18;

  push();
  noStroke();
  fill(colors.text);
  textAlign(LEFT, TOP);
  textFont("Helvetica Bold");
  textSize(getResponsiveTextSize(headingTextSizeMin, headingTextSizeMax));
  textLeading(width < 900 ? 26 : 30);
  text("Toolmaking Concepts", titleX, titleY);
  pop();
}

// Draws the cluster legend in the bottom-left corner of the graph area.
function drawLegend(layout) {
  const items = getLegendItems();
  const legendX = layout.gutter + 18;
  const legendHeight = items.length * 20;
  const legendY = height - layout.gutter - legendHeight - 18;
  const rowHeight = 20;
  const dotSize = 8;
  const toggleLabel = "Experiential Principles";
  const toggleY = legendY + legendHeight + 12;
  const toggleHovered =
    toggleHitbox &&
    mouseX >= toggleHitbox.x &&
    mouseX <= toggleHitbox.x + toggleHitbox.width &&
    mouseY >= toggleHitbox.y &&
    mouseY <= toggleHitbox.y + toggleHitbox.height;

  push();
  textAlign(LEFT, TOP);
  textFont(uiFont);
  textSize(getResponsiveTextSize(uiLabelTextSizeMin, uiLabelTextSizeMax));

  items.forEach((cluster, index) => {
    const y = legendY + index * rowHeight;
    const isHovered = hoveredLegendCluster === cluster.key;
    const displayLabel = cluster.label.toUpperCase();
    fill(cluster.color);
    circle(legendX + dotSize * 0.5, y + 6, dotSize);

    fill(isHovered ? colors.text : colors.textMid);
    text(displayLabel, legendX + 18, y);

    legendHitboxes.push({
      clusterKey: cluster.key,
      x: legendX,
      y: y - 2,
      width: 18 + textWidth(displayLabel),
      height: rowHeight,
    });
  });

  fill(expOn ? clusters.experiential.color : colors.textDim);
  circle(legendX + dotSize * 0.5, toggleY + 6, dotSize);

  fill(expOn || toggleHovered ? colors.text : colors.textMid);
  text(toggleLabel.toUpperCase(), legendX + 18, toggleY);
  pop();

  toggleHitbox = {
    x: legendX,
    y: toggleY - 2,
    width: 18 + textWidth(toggleLabel),
    height: rowHeight,
  };
}

// Returns the legend cluster entries in display order.
function getLegendItems() {
  return [
    { key: "maker", ...clusters.maker },
    { key: "material", ...clusters.material },
    { key: "process", ...clusters.process },
    { key: "system", ...clusters.system },
  ];
}

// Resolves which legend cluster label is currently hovered.
function findHoveredLegendCluster(layout) {
  const items = getLegendItems();
  const legendX = layout.gutter + 18;
  const legendHeight = items.length * 20;
  const legendY = height - layout.gutter - legendHeight - 18;
  const rowHeight = 20;

  push();
  textFont(uiFont);
  textSize(getResponsiveTextSize(uiLabelTextSizeMin, uiLabelTextSizeMax));

  for (let index = 0; index < items.length; index += 1) {
    const item = items[index];
    const y = legendY + index * rowHeight;
    const widthNeeded = 18 + textWidth(item.label.toUpperCase());
    const isHovered =
      mouseX >= legendX &&
      mouseX <= legendX + widthNeeded &&
      mouseY >= y - 2 &&
      mouseY <= y - 2 + rowHeight;

    if (isHovered) {
      pop();
      return item.key;
    }
  }

  pop();
  return null;
}

// Draws the graph in layers so focused or related elements are painted last.
function drawGraph(layout, focusId) {
  const visibleNodes = expOn ? allNodes : nodes;
  const visibleEdges = expOn ? [...edges, ...expEdges] : edges;
  const backgroundEdges = [];
  const foregroundEdges = [];
  const backgroundNodes = [];
  const foregroundNodes = [];

  visibleEdges.forEach((edge) => {
    if (isPriorityEdge(edge, focusId)) {
      foregroundEdges.push(edge);
    } else {
      backgroundEdges.push(edge);
    }
  });

  visibleNodes.forEach((node) => {
    if (isPriorityNode(node, focusId)) {
      foregroundNodes.push(node);
    } else {
      backgroundNodes.push(node);
    }
  });

  backgroundEdges.forEach((edge) => edge.draw(graphState, layout, focusId));
  backgroundNodes.forEach((node) => node.draw(graphState, layout, focusId));
  foregroundEdges.forEach((edge) => edge.draw(graphState, layout, focusId));
  foregroundNodes.forEach((node) => node.draw(graphState, layout, focusId));
}

// Returns whether a node should be painted in the foreground layer.
function isPriorityNode(node, focusId) {
  if (focusId) {
    const relatedIds = adj[focusId] || [];
    return node.id === focusId || relatedIds.includes(node.id);
  }

  return hoveredLegendCluster === node.cluster;
}

// Returns whether an edge should be painted in the foreground layer.
function isPriorityEdge(edge, focusId) {
  if (focusId) {
    return edge.fromId === focusId || edge.toId === focusId;
  }

  if (!hoveredLegendCluster) {
    return false;
  }

  const fromNode = nodeMap.get(edge.fromId);
  const toNode = nodeMap.get(edge.toId);
  return (
    fromNode?.cluster === hoveredLegendCluster ||
    toNode?.cluster === hoveredLegendCluster
  );
}

// Updates the active drag target before the frame is rendered.
function updateDraggedNode(layout) {
  if (!draggedNodeId) {
    return;
  }

  const draggedNode = nodeMap.get(draggedNodeId);
  if (!draggedNode) {
    draggedNodeId = null;
    return;
  }

  draggedNode.dragToPointer(mouseX, mouseY, layout, dragOffsetX, dragOffsetY);
}

// Prevents visible nodes from overlapping by separating intersecting pairs.
function resolveNodeOverlaps(layout) {
  const visibleNodes = expOn ? allNodes : nodes;

  for (let iteration = 0; iteration < 2; iteration += 1) {
    for (let index = 0; index < visibleNodes.length; index += 1) {
      const currentNode = visibleNodes[index];
      currentNode.clampToGraph(layout);
      for (let otherIndex = index + 1; otherIndex < visibleNodes.length; otherIndex += 1) {
        currentNode.resolveOverlap(visibleNodes[otherIndex], layout);
      }
    }
  }
}

// Renders the sidebar detail panel for the currently selected node.
function drawSidebar(layout) {
  const selectedNode = activeId ? nodeMap.get(activeId) : null;
  const x = layout.sidebarX + layout.detailPadding;
  const y = layout.detailPadding + 18;
  const maxWidth = layout.sidebarWidth - layout.detailPadding * 2;

  if (!selectedNode) {
    push();
    textAlign(CENTER, CENTER);
    textFont(uiFont);
    textSize(
      getResponsiveTextSize(emptyStateTextSizeMin, emptyStateTextSizeMax),
    );
    fill(colors.textDim);
    text(
      "select a concept",
      layout.sidebarX + layout.sidebarWidth / 2,
      height / 2,
    );
    pop();
    return;
  }

  let cursorY = y;
  const title = selectedNode.label.replace(/\n/g, " ");
  const cluster = clusters[selectedNode.cluster];

  push();
  textAlign(LEFT, TOP);
  textFont(displayFont);
  textSize(getResponsiveTextSize(headingTextSizeMin, headingTextSizeMax));
  fill(colors.text);
  textLeading(34);
  text(title, x, cursorY, maxWidth);
  pop();
    cursorY += 100;

  cursorY = drawClusterTag(cluster, x, cursorY, maxWidth) + 22;
  cursorY =
    drawParagraph(selectedNode.desc, x, cursorY, maxWidth, {
      font: "Georgia",
      size: getResponsiveTextSize(bodyTextSizeMin, bodyTextSizeMax),
      leading: 26,
      color: colors.text,
      italic: false,
    }) + 12;

  if (selectedNode.isExperiential && selectedNode.talkingPoint) {
    stroke(colors.border);
    cursorY =
        drawParagraph(selectedNode.talkingPoint, x, cursorY, maxWidth, {
        font: "Georgia",
        size: getResponsiveTextSize(
          talkingPointTextSizeMin,
          talkingPointTextSizeMax,
        ),
        leading: 22,
        color: colors.textMid,
          italic: false,
      }) + 18;
  }

  stroke(colors.border);
  line(x, cursorY, x + maxWidth, cursorY);
  cursorY += 14;

  push();
  textAlign(LEFT, TOP);
  textFont(uiFont);
  textSize(getResponsiveTextSize(uiLabelTextSizeMin, uiLabelTextSizeMax));
  fill(colors.textDim);
  text(
    selectedNode.isExperiential ? "FEEDS FROM" : "CONNECTED CONCEPTS",
    x,
    cursorY,
  );
  pop();
  cursorY += 22;

  const relatedIds = getRelatedIds(selectedNode);
  drawTags(relatedIds, x, cursorY, maxWidth);
}

// Draws the colored cluster label chip used under the selected title.
function drawClusterTag(cluster, x, y) {
  push();
  textFont(uiFont);
  textSize(getResponsiveTextSize(uiLabelTextSizeMin, uiLabelTextSizeMax));
  const label = cluster.label.toUpperCase();
  const widthNeeded = textWidth(label) + 20;
  noStroke();
  fill(red(cluster.color), green(cluster.color), blue(cluster.color), 34);
  rect(x, y, widthNeeded, 20, 2);
  stroke(red(cluster.color), green(cluster.color), blue(cluster.color), 68);
  noFill();
  rect(x, y, widthNeeded, 20, 2);
  noStroke();
  fill(cluster.color);
  textAlign(LEFT, CENTER);
  text(label, x + 10, y + 11);
  pop();
  return y + 20;
}

// Wraps and draws a text block, then returns the next vertical cursor position.
function drawParagraph(content, x, y, maxWidth, options) {
  const lines = wrapText(content, maxWidth, options.font, options.size);
  push();
  textAlign(LEFT, TOP);
  textFont(options.font);
  textSize(options.size);
  textLeading(options.leading);
  if (options.italic) {
    textStyle(ITALIC);
  } else {
    textStyle(NORMAL);
  }
  fill(options.color);
  text(lines.join("\n"), x, y);
  pop();
  return y + lines.length * options.leading;
}

// Draws clickable relation tags and records their hit areas for interaction.
function drawTags(relatedIds, startX, startY, maxWidth) {
  let x = startX;
  let y = startY;
  const gap = 8;
  const rowHeight = 22;

  textFont(uiFont);
  textSize(getResponsiveTextSize(uiLabelTextSizeMin, uiLabelTextSizeMax));

  relatedIds.forEach((targetId) => {
    const targetNode = nodeMap.get(targetId);
    if (!targetNode) {
      return;
    }
    const label = targetNode.label.replace(/\n/g, " ");
    const tagWidth = textWidth(label) + 18;

    if (x + tagWidth > startX + maxWidth) {
      x = startX;
      y += rowHeight + gap;
    }

    const hovered =
      mouseX >= x &&
      mouseX <= x + tagWidth &&
      mouseY >= y &&
      mouseY <= y + rowHeight;
    const strokeColor = targetNode.isExperiential ? colors.exp : colors.border;
    const textColor = hovered ? strokeColor : colors.textMid;

    noFill();
    stroke(hovered ? strokeColor : colors.border);
    rect(x, y, tagWidth, rowHeight, 2);
    noStroke();
    fill(textColor);
    textAlign(LEFT, CENTER);
    text(label, x + 9, y + rowHeight / 2 + 0.5);

    tagHitboxes.push(
      new DetailTag(
        targetId,
        targetNode.isExperiential,
        x,
        y,
        tagWidth,
        rowHeight,
      ),
    );
    x += tagWidth + gap;
  });
}

// Breaks a paragraph into lines that fit a maximum rendered width.
function wrapText(content, maxWidth, fontName, fontSize) {
  textFont(fontName);
  textSize(fontSize);

  const lines = [];
  const paragraphs = content.split("\n");

  paragraphs.forEach((paragraph) => {
    const words = paragraph.trim().split(/\s+/).filter(Boolean);

    if (!words.length) {
      lines.push("");
      return;
    }

    let currentLine = "";

    words.forEach((word) => {
      const candidate = currentLine ? `${currentLine} ${word}` : word;
      if (textWidth(candidate) <= maxWidth) {
        currentLine = candidate;
      } else {
        if (currentLine) {
          lines.push(currentLine);
        }
        currentLine = word;
      }
    });

    if (currentLine) {
      lines.push(currentLine);
    }
  });

  return lines;
}

// Resolves which related node ids should appear in the sidebar.
function getRelatedIds(node) {
  if (node.isExperiential) {
    return node.sources;
  }

  const relatedIds = (related[node.id] || adj[node.id] || [])
    .filter((targetId) => !isExperiential(targetId))
    .slice(0, 5);
  const experientialParents = expNodes
    .filter((expNode) => expNode.sources.includes(node.id))
    .map((expNode) => expNode.id);
  return [...relatedIds, ...experientialParents];
}

// Returns the hovered graph node id, ignoring the sidebar region.
function findHoveredNode(px, py, layout = getLayout()) {
  if (px >= layout.sidebarX) {
    return null;
  }

  const candidates = expOn ? [...expNodes, ...nodes] : nodes;
  for (let index = 0; index < candidates.length; index += 1) {
    const node = candidates[index];
    if (node.containsPoint(px, py, layout)) {
      return node.id;
    }
  }
  return null;
}

// Switches the pointer cursor on when hovering interactive canvas elements.
function updateCursor() {
  const overTag = tagHitboxes.some((tag) => tag.contains(mouseX, mouseY));
  const overLegend = Boolean(hoveredLegendCluster);
  const overToggle =
    toggleHitbox &&
    mouseX >= toggleHitbox.x &&
    mouseX <= toggleHitbox.x + toggleHitbox.width &&
    mouseY >= toggleHitbox.y &&
    mouseY <= toggleHitbox.y + toggleHitbox.height;
  if (hoveredId || overTag || overToggle || overLegend) {
    cursor(HAND);
  } else {
    cursor(ARROW);
  }
}

// Handles clicks on sidebar tags or nodes and updates selection state.
function handlePress() {
  pressedNodeId = null;

  const hitToggle =
    toggleHitbox &&
    mouseX >= toggleHitbox.x &&
    mouseX <= toggleHitbox.x + toggleHitbox.width &&
    mouseY >= toggleHitbox.y &&
    mouseY <= toggleHitbox.y + toggleHitbox.height;
  if (hitToggle) {
    expOn = !expOn;
    if (!expOn && activeId && isExperiential(activeId)) {
      activeId = null;
    }
    return;
  }

  const hitTag = tagHitboxes.find((tag) => tag.contains(mouseX, mouseY));
  if (hitTag) {
    if (hitTag.isExperiential && !expOn) {
      expOn = true;
    }
    activeId = hitTag.targetId;
    return;
  }

  const hitNode = findHoveredNode(mouseX, mouseY);
  if (!hitNode) {
    activeId = null;
    draggedNodeId = null;
    return;
  }

  const hitNodeModel = nodeMap.get(hitNode);
  const layout = getLayout();
  const hitNodePosition = hitNodeModel.getScreenPosition(layout);
  pressedNodeId = hitNode;
  pressStartX = mouseX;
  pressStartY = mouseY;
  dragStartedOnActive = activeId === hitNode;
  draggedNodeId = hitNode;
  dragOffsetX = mouseX - hitNodePosition.x;
  dragOffsetY = mouseY - hitNodePosition.y;
  dragMoved = false;
}

// Identifies whether a node id belongs to the experiential layer.
function isExperiential(id) {
  return id.startsWith("exp_");
}

// Routes mouse presses into the sketch interaction handler.
function mousePressed() {
  handlePress();
}

// Drags the currently selected node while the pointer is moving.
function mouseDragged() {
  if (draggedNodeId && pressedNodeId) {
    dragMoved =
      dist(mouseX, mouseY, pressStartX, pressStartY) > dragSelectThreshold;
  }
}

// Clears drag state and only selects on a near-stationary press-release.
function mouseReleased() {
  if (pressedNodeId) {
    const releasedNodeId = findHoveredNode(mouseX, mouseY, getLayout());
    const shouldSelect = !dragMoved && releasedNodeId === pressedNodeId;

    if (shouldSelect) {
      activeId = dragStartedOnActive ? null : pressedNodeId;
    }
  }

  draggedNodeId = null;
  dragOffsetX = 0;
  dragOffsetY = 0;
  dragMoved = false;
  dragStartedOnActive = false;
  pressedNodeId = null;
  pressStartX = 0;
  pressStartY = 0;
}

// Keeps the sketch responsive when the browser window changes size.
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

// Stores a clickable sidebar tag area for relation navigation.
class DetailTag {
  // Captures the drawn tag bounds and the node it should activate.
  constructor(targetId, isExperiential, x, y, width, height) {
    this.targetId = targetId;
    this.isExperiential = isExperiential;
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
  }

  // Returns whether a pointer position falls inside this tag rectangle.
  contains(px, py) {
    return (
      px >= this.x &&
      px <= this.x + this.width &&
      py >= this.y &&
      py <= this.y + this.height
    );
  }
}
