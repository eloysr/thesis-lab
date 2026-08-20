/*
 * © 2026 Schultzschultz. Created for 'Schultzschultz Creative Coding Masterclass'.
 * For educational use only. All rights reserved.
 *
 * ----------
 * Multitouch
 * ----------
 *
 * This file is a demonstration of a multitouch  interaction implemented in p5.js.
 *
 * Controls:
 * - Touch with two fingers to create a stretch between the two touch points.
 * - Move the fingers apart or together to adjust the stretch.
 * - Release the fingers to finalize the stretch and make it permanent on the canvas.
 * - Click the "Upload Image" button to select and upload a new image from your device.
 * - Click the "Export PNG" button to save the current canvas as a PNG file with a timestamped filename.
 * - Click the "Transition Mode" button to enable smooth color transitions along the stretch, or click the "Transfer Mode" button to directly transfer colors from the origin points to the target points without a transition effect.
 *
 * Note: This file is designed for use on touch-enabled devices and doesn't work properly on non-touch devices.
 */

let imgOriginal;
let img;
let imgStretches;
let imgActiveStretch;
let imgTouchGUI;
let originP1, originP2, targetP1, targetP2;
let originColors = [];
let targetColors = [];
const stretchResolution = 2.0;
let transitionMode = false;
let transitionResolution = 5;
let offset;
const touchSize = 120;

// Preload assets before the sketch starts
function preload() {
  imgOriginal = loadImage("assets/example.png");
}

// Runs once when the sketch starts
function setup() {
  // Default full-window canvas.
  createCanvas(windowWidth, windowHeight);

  // Set up the image and the touch GUI.
  reset();
  imageMode(CENTER);
  imgTouchGUI = createGraphics(width, height);
  imgTouchGUI.stroke(255);
  imgTouchGUI.strokeWeight(3);
  imgTouchGUI.noFill();

  // Set the initial style for the stretch interaction based on the transition mode.
  setStyle(transitionMode ? "transition" : "transfer");
}

// Runs continuously (frame by frame)
function draw() {
  image(img, width / 2, height / 2);

  if (imgStretches != null) {
    image(imgStretches, width / 2, height / 2);
  }

  if (imgActiveStretch != null) {
    image(imgActiveStretch, width / 2, height / 2);
  }

  // Draw the GUI layer with the touch indicators using DIFFERENCE blend mode
  // to ensure they are visible on both light and dark backgrounds
  if (touches.length > 0) {
    blendMode(DIFFERENCE);
    image(imgTouchGUI, width / 2, height / 2);
    blendMode(BLEND);
  }
}

// Keeps the canvas size in sync with the browser window.
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  resizeImages();
  imgTouchGUI = createGraphics(width, height);
  imgTouchGUI.stroke(255);
  imgTouchGUI.strokeWeight(3);
  imgTouchGUI.noFill();
}

function touchMoved() {
  // Update the stretch interaction based on the current touch positions and redraw the active stretch layer to reflect any changes in the target points as the user moves their fingers on the screen.
  if (touches.length == 2) {
    updateTouch();
  }

  // Update the touch indicators on the GUI layer to reflect the current touch positions and interactions, providing visual feedback to the user about their touch inputs.
  updateTouchGUI();
}

function touchEnded() {
  // If there is an active stretch when the touch ends, draw it onto the imgStretches layer to make it permanent,
  // and then clear the imgActiveStretch layer and set it to null to prepare for the next stretch interaction.
  if (imgActiveStretch != null) {
    drawStretchTo(imgStretches, true);
    imgActiveStretch = null;
  }

  // Clear the GUI layer to remove any touch indicators from the screen when the touch interaction ends, providing a clean slate for the next interaction.
  imgTouchGUI.clear();

  // Reset the origin and target points for the stretch to null to prepare for the next stretch interaction.
  resetPoints();
}

function updateTouch() {
  // Calculate the direction vector from t1 to t2 and set its magnitude to half of the touch size
  // This ensures that the stretch will end at the edge of the touch circles, rather than overlapping them
  let t1 = createVector(touches[0].x, touches[0].y);
  let t2 = createVector(touches[1].x, touches[1].y);
  let dir = p5.Vector.sub(t2, t1).setMag(touchSize / 2);
  let p1 = p5.Vector.add(t1, dir);
  let p2 = p5.Vector.sub(t2, dir);

  if (originP1 == null) {
    // Initialize the origin and target points for the stretch based on the current touch positions,
    originP1 = createVector(p1.x, p1.y);
    originP2 = createVector(p2.x, p2.y);
    targetP1 = createVector(p1.x, p1.y);
    targetP2 = createVector(p2.x, p2.y);

    // Create a new graphics layer for the active stretch and set its stroke properties
    imgActiveStretch = createGraphics(img.width, img.height);
    imgActiveStretch.strokeCap(ROUND);
    imgActiveStretch.noFill();
  } else {
    // Update the target points for the stretch based on the current touch positions
    targetP1.set(p1.x, p1.y);
    targetP2.set(p2.x, p2.y);

    // Clear the imgActiveStretch layer and redraw the stretch based on the updated target points
    imgActiveStretch.clear();
    drawStretchTo(imgActiveStretch);
  }
}

function updateTouchGUI() {
  // Clear the GUI layer before drawing the current touch indicators
  imgTouchGUI.clear();

  if (touches.length == 2) {
    let t1 = createVector(touches[0].x, touches[0].y);
    let t2 = createVector(touches[1].x, touches[1].y);
    let touchDistance = t1.dist(t2);

    // Touches
    if (touchDistance > touchSize) {
      // Calculate the direction vector from t1 to t2 and set its magnitude to half of the touch size
      // This ensures that the line will end at the edge of the touch circles, rather than overlapping them
      let dir = p5.Vector.sub(t2, t1).setMag(touchSize / 2);
      let p1 = p5.Vector.add(t1, dir);
      let p2 = p5.Vector.sub(t2, dir);

      // Draw the line between the two touches
      imgTouchGUI.line(p1.x, p1.y, p2.x, p2.y);

      // Touch circles
      imgTouchGUI.circle(t1.x, t1.y, touchSize);
      imgTouchGUI.circle(t2.x, t2.y, touchSize);
    } else {
      // In case the touches are close together, draw one circle instead of a line
      // Calculate the midpoint between the two touches for the circle position
      const midPoint = p5.Vector.lerp(t1, t2, 0.5);
      imgTouchGUI.circle(midPoint.x, midPoint.y, touchSize);
    }
  } else if (touches.length == 1) {
    // Draw a circle for the single touch if it's not over the interface to indicate the touch position
    if (mouseOverInterface(touches[0].x, touches[0].y) == false) {
      imgTouchGUI.circle(touches[0].x, touches[0].y, touchSize);
    }
  }
}

function drawStretchTo(imgLayer, finalize = false) {
  // Update the colors for the current stretch based on the current positions of the origin and target points
  updateStretchColors();

  // Loop through the colors for the stretch and draw them on the imgActiveStretch graphics layer based on the current positions of the origin and target points
  for (let i = 0; i < originColors.length; i++) {
    // Calculate the position along the origin and target line
    let t = (1.0 / originColors.length) * i;
    let tempOP = p5.Vector.lerp(originP1, originP2, t);
    let tempTP = p5.Vector.lerp(targetP1, targetP2, t);

    if (transitionMode) {
      // Calculate the number of steps for the stretch based on the distance between the temp origin and target points
      let steps = round(p5.Vector.dist(tempOP, tempTP));
      if (!finalize) {
        // If not finalizing the stretch, increase the number of steps based on the transition resolution
        // to create a smoother interaction during the stretch
        steps /= transitionResolution;
      }

      // Loop through the steps and draw points between the temp origin and target points
      // with colors that transition from the origin colors to the target colors
      // to create a smooth gradient effect along the stretch.
      for (let j = 0; j <= steps; j++) {
        // Calculate the color and position for the current step
        let t2 = (1.0 / steps) * j;
        let tempColor = lerpColor(originColors[i], targetColors[i], t2);
        let tempPos = p5.Vector.lerp(tempOP, tempTP, t2);

        // Use a stroke weight based on whether the stretch is being finalized or not to create a smoother transition effect
        imgLayer.strokeWeight(
          finalize
            ? stretchResolution
            : stretchResolution * transitionResolution,
        );
        imgLayer.stroke(tempColor);
        imgLayer.point(tempPos.x + offset.x, tempPos.y + offset.y);
      }
    } else {
      // Draw a line between the temp origin and target points with the color from the origin points
      imgLayer.strokeWeight(stretchResolution);
      imgLayer.stroke(originColors[i]);
      imgLayer.line(
        tempOP.x + offset.x,
        tempOP.y + offset.y,
        tempTP.x + offset.x,
        tempTP.y + offset.y,
      );
    }
  }
}

function updateStretchColors() {
  // Calculate the number of steps for the stretch based on the higher distance between the origin and target points
  // This ensures that the stretch will have a consistent density of colors, regardless of how far the points are apart
  const distanceOriginPoints = round(p5.Vector.dist(originP1, originP2));
  const distanceTargetPoints = round(p5.Vector.dist(targetP1, targetP2));
  const steps = max(distanceOriginPoints, distanceTargetPoints);

  // Clear the origin and target colors arrays before populating them with the new colors for the current stretch
  originColors = [];
  targetColors = [];

  for (let i = 0; i < steps; i++) {
    // Calculate the position along the line between the origin points and store the color from the image at that calculated position
    let t = (1.0 / steps) * i;
    let getX = round(lerp(originP1.x + offset.x, originP2.x + offset.x, t));
    let getY = round(lerp(originP1.y + offset.y, originP2.y + offset.y, t));
    originColors[i] = color(img.get(getX, getY));

    if (transitionMode) {
      // If in transition mode, also calculate the color for the target points based on the same number of steps as the origin points to ensure a smooth transition between the two
      getX = round(lerp(targetP1.x + offset.x, targetP2.x + offset.x, t));
      getY = round(lerp(targetP1.y + offset.y, targetP2.y + offset.y, t));
      targetColors[i] = color(img.get(getX, getY));
    }
  }
}

function reset() {
  clear();
  imgStretches = null;
  resizeImages();
  resetPoints();
}

function resizeImages() {
  img = imgOriginal.get(0, 0, imgOriginal.width, imgOriginal.height);
  let factor = max([
    windowWidth / imgOriginal.width,
    windowHeight / imgOriginal.height,
  ]);
  img.resize(imgOriginal.width * factor, imgOriginal.height * factor);
  if (imgStretches != null) {
    let imgStretchTemp = createGraphics(img.width, img.height);
    imgStretchTemp.image(
      imgStretches,
      0,
      0,
      imgStretchTemp.width,
      imgStretchTemp.height,
    );
    imgStretches.remove();
    imgStretches = null;
    imgStretches = imgStretchTemp;
  } else {
    imgStretches = createGraphics(img.width, img.height);
    imgStretches.strokeWeight(stretchResolution);
    imgStretches.strokeCap(ROUND);
    imgStretches.noFill();
  }
  offset = createVector(
    (img.width - windowWidth) / 2,
    (img.height - windowHeight) / 2,
  );
}

function resetPoints() {
  // Reset the origin and target points for the stretch to null to prepare for the next stretch interaction.
  originP1 = null;
  originP2 = null;
  targetP1 = null;
  targetP2 = null;
}

function uploadFile() {
  // Get the selected file from the file input element, create a URL for it, and load it as an image.
  // Once the image is loaded, revoke the URL to free up memory and call the prepareFile function
  // to process the image for display and interaction in the application.
  let selectedFile = document.getElementById("file-input");
  let myImageFile = selectedFile.files[0];
  let urlOfImageFile = URL.createObjectURL(myImageFile);
  imgOriginal = loadImage(urlOfImageFile, () => {
    URL.revokeObjectURL(urlOfImageFile);
    prepareFile();
  });
}

function prepareFile() {
  // Resize the original image to fit within the canvas while maintaining its aspect ratio.
  let factor = min(width / imgOriginal.width, height / imgOriginal.height);
  imgOriginal.resize(
    int(imgOriginal.width * factor),
    int(imgOriginal.height * factor),
  );
  // Set up the images and variables for the application based on the newly loaded image to prepare it for display and interaction.
  reset();
}

function setStyle(val) {
  if (val === "transition") {
    transitionMode = true;
    document.getElementById("transition").style.opacity = "1.0";
    document.getElementById("transfer").style.opacity = "0.3";
  } else if (val === "transfer") {
    transitionMode = false;
    document.getElementById("transition").style.opacity = "0.3";
    document.getElementById("transfer").style.opacity = "1.0";
  }
}

function exportPNG() {
  // Display the original image and any active stretches on the canvas to ensure they are included in the saved image,
  image(img, width / 2, height / 2);
  if (imgStretches != null) {
    image(imgStretches, width / 2, height / 2);
  }

  // Save the canvas as a PNG file with a timestamped filename to allow users to easily identify and organize their saved images based on when they were created.
  let timestamp =
    year() +
    "-" +
    month() +
    "-" +
    day() +
    "_" +
    hour() +
    "-" +
    minute() +
    "-" +
    second();
  save("IMG_" + timestamp + ".png");
}

function mouseOverInterface(x, y) {
  return (y < 70 && x > width - 205) || (x > width - 70 && y > height - 150);
}

// prevent zoom-to-tabs gesture in safari
document.addEventListener("gesturestart", function (e) {
  e.preventDefault();
  document.body.style.zoom = 0.99999;
});

// prevent zoom-to-tabs gesture in safari
document.addEventListener("gesturechange", function (e) {
  e.preventDefault();
  document.body.style.zoom = 0.99999;
});

// prevent zoom-to-tabs gesture in safari
document.addEventListener("gestureend", function (e) {
  e.preventDefault();
  document.body.style.zoom = 1.0;
});
