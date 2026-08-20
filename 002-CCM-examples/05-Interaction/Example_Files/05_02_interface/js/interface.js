/*
 * © 2026 Schultzschultz. Created for 'Schultzschultz Creative Coding Masterclass'.
 * For educational use only. All rights reserved.
 * 
 * ---------------------------
 * Interface – Interface Class
 * ---------------------------
 *  * 
 * This file is the implementation of the Interface class, which manages all 
 * user interactions with the HTML controls (sliders, buttons, etc.) and updates 
 * the global variables in sketch.js accordingly. 
 * 
 * What this file does:
 * - Attaches event listeners to all HTML controls (sliders, buttons, etc.)
 * - Updates global variables in sketch.js when controls are used
 * - Manages the visibility of UI elements (like the Shuffle button for colors)
 * - Ensures that changes in the interface trigger a redraw of the canvas with the new settings
 * 
 * Note: The actual drawing and animation logic is in sketch.js. This file only handles the user interface and interaction.
 * */


class Interface {

  constructor() {
    // Shared reference to the canvas format dropdown label,
    // used by both the format selector and the swap button.
    this.csLabel = null;

    this.init();
  }

  // Attaches all event listeners to the HTML controls.
  init() {
    this._initCollapsible();
    this._initCanvasFormat();
    this._initSwap();
    this._initMargin();
    this._initTextInput();
    this._initTextSize();
    this._initTracking();
    this._initLineSpace();
    this._initColorMode();
    this._initLetterSpeed();
    this._initTypewriter();
    this._initTypingSpeed();
  }

  // Returns a human-readable label for a given format and swap state.
  // For example: '9x16' not swapped -> "9 × 16", swapped -> "16 × 9".
  _formatLabel(fmt, sw) {
    if (fmt === '1x1') return '1 × 1';
    if (fmt === '4x5') return sw ? '5 × 4' : '4 × 5';
    return sw ? '16 × 9' : '9 × 16';
  }

  // ––––– Interface ––––––––––––––––––––––––––––––––––––––––––––––––––

  // ––– Collapsible Sections (Button) –––
  // Toggle the visibility of the section body and rotate the arrow icon.
  _initCollapsible() {
    document.querySelectorAll('.section-header').forEach(function (header) {
      header.addEventListener('click', function () {
        var body = document.getElementById(header.dataset.target);
        var arrow = header.querySelector('.arrow');
        var isOpen = !body.classList.contains('hidden');
        body.classList.toggle('hidden', isOpen);   // Hide if open, show if hidden
        arrow.classList.toggle('open', !isOpen);   // Rotate the arrow icon accordingly
      });
    });
  }

  // ––––– Canvas ––––––––––––––––––––––––––––––––––––––––––––––––––

  // ––– Canvas format (Dropdown) –––
  // Allows the user to select the canvas aspect ratio (1x1, 4x5, or 9x16).
  _initCanvasFormat() {
    // The HTML uses a hand-built select (div-based) instead of a native <select>
    // so we can style it freely.
    var formatSel = document.getElementById('canvasFormatSel');
    var csSelected = formatSel.querySelector('.cs-selected'); // The visible "button" part
    this.csLabel = formatSel.querySelector('.cs-label');      // Text shown inside the button
    var csOptions = formatSel.querySelector('.cs-options');   // The dropdown list
    var csArrow = formatSel.querySelector('.cs-arrow');       // The chevron icon

    var self = this;

    // Opens the dropdown and marks the currently active option as selected.
    function openSelect() {
      csOptions.classList.add('open');
      csArrow.classList.add('open');
      formatSel.querySelectorAll('.cs-option').forEach(function (opt) {
        opt.classList.toggle('selected', opt.dataset.value === canvasFormat);
      });
    }

    // Closes the dropdown.
    function closeSelect() {
      csOptions.classList.remove('open');
      csArrow.classList.remove('open');
    }

    // Toggle dropdown open/close when the user clicks the visible button.
    csSelected.addEventListener('click', function (e) {
      e.stopPropagation(); // Prevent the document click handler from closing it immediately
      csOptions.classList.contains('open') ? closeSelect() : openSelect();
    });

    // When the user clicks an option: update the sketch variable and redraw.
    formatSel.querySelectorAll('.cs-option').forEach(function (opt) {
      opt.addEventListener('click', function (e) {
        e.stopPropagation();
        canvasFormat = opt.dataset.value; // Update the global sketch variable
        swapped = false;                  // Reset swap state when changing format
        self.csLabel.textContent = self._formatLabel(canvasFormat, false); // Update the button label
        closeSelect(); // Close the dropdown
        windowResized(); // Recalculate canvas size and redraw everything
      });
    });

    // Close the dropdown if the user clicks anywhere else on the page.
    document.addEventListener('click', closeSelect);
  }

  // ––– Swap format (Button) –––
  // Swaps the canvas width and height (e.g. portrait 9x16 becomes landscape 16x9).
  _initSwap() {
    var self = this;
    document.getElementById('swapBtn').addEventListener('click', function () {
      if (canvasFormat === '1x1') return; // 1x1 is symmetrical — swapping has no effect
      swapped = !swapped; // Toggle the swap state
      self.csLabel.textContent = self._formatLabel(canvasFormat, swapped); // Update the dropdown button label
      windowResized(); // Recalculate canvas dimensions and redraw
    });
  }

  // ––– Margin (Slider) –––
  // Controls the whitespace between the text and the canvas edges.
  // Stored as 0.0–0.20; the slider shows the value × 100 (0–20).
  _initMargin() {
    var txtMarginSlider = document.getElementById('txtMarginSlider');
    var txtMarginVal = document.getElementById('txtMarginVal');
    txtMarginSlider.value = +(txtMargin * 100).toFixed(1); // Set slider to current value
    txtMarginVal.textContent = +(txtMargin * 100).toFixed(1); // Show the numeric label
    txtMarginSlider.addEventListener('input', function () {
      txtMargin = parseFloat(txtMarginSlider.value) / 100;
      txtMarginVal.textContent = txtMarginSlider.value;
      repositionLetters(); // Reposition all letters with the new margin
    });
  }

  // ––––– Text ––––––––––––––––––––––––––––––––––––––––––––––––––

  // ––– Text input (textarea) –––
  // The user types or pastes the text to display on the canvas.
  _initTextInput() {
    var txtInput = document.getElementById('txtInput');
    txtInput.value = txt; // Pre-fill with the default text from sketch.js
    txtInput.addEventListener('input', function () {
      txt = txtInput.value; // Update the global text variable
      if (typewriterActive) {
        resetCanvas(); // Typewriter on: restart the animation from the beginning
      } else {
        syncText(); // Typewriter off: update letters immediately without animation
      }
    });
  }

  // ––– Text size slider –––
  // Controls how large each letter is.
  // Stored as 0.05–0.50; the slider shows the value × 100 (5–50).
  _initTextSize() {
    var txtSizeSlider = document.getElementById('txtSizeSlider');
    var txtSizeVal = document.getElementById('txtSizeVal');
    txtSizeSlider.value = Math.round(txtSize * 100);
    txtSizeVal.textContent = Math.round(txtSize * 100);
    txtSizeSlider.addEventListener('input', function () {
      txtSize = parseInt(txtSizeSlider.value, 10) / 100;
      txtSizeVal.textContent = txtSizeSlider.value;
      repositionLetters(); // Recalculate letter sizes and positions
    });
  }

  // ––– Tracking slider (letter spacing) –––
  // Controls the extra horizontal space between letters.
  // Stored as 0.0–0.20; the slider shows the value × 100 (0–20).
  _initTracking() {
    var letterSpaceSlider = document.getElementById('letterSpaceSlider');
    var letterSpaceVal = document.getElementById('letterSpaceVal');
    letterSpaceSlider.value = +(letterSpace * 100).toFixed(1);
    letterSpaceVal.textContent = +(letterSpace * 100).toFixed(1);
    letterSpaceSlider.addEventListener('input', function () {
      letterSpace = parseFloat(letterSpaceSlider.value) / 100;
      letterSpaceVal.textContent = letterSpaceSlider.value;
      repositionLetters(); // Recalculate letter positions to apply the new tracking value
    });
  }

  // ––– Line space slider –––
  // Controls the extra vertical space between lines of text.
  // Stored as 0.0–0.10; the slider shows the value × 100 (0–10).
  _initLineSpace() {
    var lineSpaceSlider = document.getElementById('lineSpaceSlider');
    var lineSpaceVal = document.getElementById('lineSpaceVal');
    lineSpaceSlider.value = +(lineSpace * 100).toFixed(1);
    lineSpaceVal.textContent = +(lineSpace * 100).toFixed(1);
    lineSpaceSlider.addEventListener('input', function () {
      lineSpace = parseFloat(lineSpaceSlider.value) / 100;
      lineSpaceVal.textContent = lineSpaceSlider.value;
      repositionLetters(); // Recalculate letter positions to apply the new line spacing value
    });
  }

  // ––– Text color (Radio buttons, Shuffle Button) –––
  // Two modes: 'bw' (black or white) and 'random' (colourful).
  // The Shuffle button is only visible in 'random' mode and assigns new random colors to all letters.
  _initColorMode() {
    var shuffleBtn = document.getElementById('shuffleColorsBtn');

    // Shows or hides the Shuffle button depending on the current color mode.
    function updateShuffleBtn() {
      shuffleBtn.classList.toggle('visible', colorMode === 'random');
    }

    // Wire up each radio button: update colorMode and reassign all letter colors.
    document.querySelectorAll('input[name="colorMode"]').forEach(function (radio) {
      if (radio.value === colorMode) radio.checked = true; // Pre-select the active mode
      radio.addEventListener('change', function () {
        colorMode = radio.value;
        updateLetterColors(); // Assign new colors to all visible letters
        updateShuffleBtn(); // Show or hide the Shuffle button based on the new color mode
      });
    });

    // Shuffle button: assigns a fresh set of random colors to all visible letters.
    shuffleBtn.addEventListener('click', function () {
      updateLetterColors(); // Assign new colors to all visible letters
    });

    updateShuffleBtn(); // Set the initial visibility of the Shuffle button
  }

  // ––– Letter animation speed slider –––
  // Controls how fast each letter scrolls through its tile.
  // Higher value = faster scroll. Range: 10–300 (frames per cycle).
  _initLetterSpeed() {
    var speedLettersSlider = document.getElementById('speedLettersSlider');
    var speedLettersVal = document.getElementById('speedLettersVal');
    speedLettersSlider.value = speedLetters;
    speedLettersVal.textContent = speedLetters;
    speedLettersSlider.addEventListener('input', function () {
      speedLetters = parseInt(speedLettersSlider.value, 10);
      speedLettersVal.textContent = speedLettersSlider.value;
      repositionLetters(); // Rebuild so new moveDuration is applied to all letters
    });
  }

  // ––––– Typewriter ––––––––––––––––––––––––––––––––––––––––––––––––––

  // ––– State (Toggle) –––
  // Switches the typewriter animation on or off.
  _initTypewriter() {
    var toggle = document.getElementById('typewriterToggle');
    var speedTypingRow = document.getElementById('speedTypingRow');
    var toggleStatus = document.getElementById('toggleStatus');

    // Updates the UI to reflect the current typewriterActive state.
    function updateTypewriterUI() {
      // Greys out the speed slider when the typewriter is off,
      speedTypingRow.classList.toggle('disabled', !typewriterActive);
      // Updates the status label.
      if (toggleStatus) toggleStatus.textContent = typewriterActive ? 'Active' : 'Inactive';
    }

    // Set the checkbox to match the sketch variable.
    toggle.checked = typewriterActive;
    updateTypewriterUI();

    toggle.addEventListener('change', function () {
      typewriterActive = toggle.checked;
      updateTypewriterUI(); // Update the UI to reflect the new state
      if (!typewriterActive) {
        showAllText(); // Show all text at once when typewriter is switched off
      } else {
        resetCanvas(); // Restart the animation from the beginning when switched on
      }
    });
  }

  // ––– Typing speed slider –––
  // Controls the delay between each character being typed.
  _initTypingSpeed() {
    var speedTypingSlider = document.getElementById('speedTypingSlider');
    var speedTypingVal = document.getElementById('speedTypingVal');
    var initSV = Math.max(1, Math.min(30, 31 - Math.round(speedTyping / 10)));
    speedTypingSlider.value = initSV; // Set slider position based on the current speedTyping value
    speedTypingVal.textContent = initSV; // Show the numeric label corresponding to the slider position
    speedTypingSlider.addEventListener('input', function () {
      var sv = parseInt(speedTypingSlider.value, 10);
      speedTyping = (31 - sv) * 10; // Convert slider position to millisecond delay
      pauseDuration = speedTyping * 60; // Pause before deleting scales with typing speed
      speedTypingVal.textContent = sv;
    });
  }

}