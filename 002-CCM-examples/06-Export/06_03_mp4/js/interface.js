/*
 * © 2026 Schultzschultz. Created for 'Schultzschultz Creative Coding Masterclass'.
 * For educational use only. All rights reserved.
 *
 * ----------------------------
 * Export MP4 – Interface Class
 * ----------------------------
 *
 * This file is the implementation of the Interface class, which manages the user 
 * interface elements related to the MP4 export functionality. 

 * What this file does:
 * - Defines the Interface class that encapsulates the UI logic for the MP4 export feature.
 * - Manages the state of the export button and the recording overlay to provide feedback to the user during the export process.
 *
 * Note that this class interacts with DOM elements that must be present in the HTML file, such as buttons and status displays. 
 * See index.html for the relevant HTML structure.
*/

class Interface {

  constructor() {
    this.panel   = null;   // The interface container element
    this.overlay = null;   // The record-overlay element
    this.exportBtn = null; // The export button
  }

  // Initializes references to the DOM elements used in the interface.
  // This method should be called after the DOM is fully loaded to ensure all elements are available 
  // Call it in sketch.js -> setup() 
  init() {
    this.panel   = document.getElementById('interface');
    this.overlay = document.getElementById('record-overlay');
    this._buildExportRow();
  }

  // Creates the export-button row and appends it to the panel.
  _buildExportRow() {
    const row = document.createElement('div');
    row.className = 'ctrl-row';

    this.exportBtn = document.createElement('button');
    this.exportBtn.className  = 'btn-outline';
    this.exportBtn.id         = 'exportBtn';
    this.exportBtn.textContent = 'export';
    this.exportBtn.addEventListener('click', () => recorder.start());

    row.appendChild(this.exportBtn);
    this.panel.appendChild(row);
  }

  // Switches the UI between "recording" and "idle" state.
  // Pass true to activate the overlay and disable the export button,
  // false to restore the UI after recording has finished.
  setRecording(isRecording) {
    if (isRecording) {
      this.exportBtn.disabled = true;
      this.overlay.classList.add('active');
    } else {
      this.exportBtn.disabled = false;
      this.overlay.classList.remove('active');
    }
  }
}
