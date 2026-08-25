/*
 * © 2026 Schultzschultz. Created for 'Schultzschultz Creative Coding Masterclass'.
 * For educational use only. All rights reserved.
 *
 * -----------------------------------
 * Export MP4 Record – Interface Class
 * -----------------------------------
 *
 * This file is the implementation of the Interface class, which manages the user interface
 * elements related to recording and exporting the canvas animation as a MP4 video file.
 *
 * Key features of the Interface class:
 * - showRecordingUI(): Displays the UI elements relevant to the recording state and hides the export button.
 * - showIdleUI(): Resets the UI to the idle state, showing the export button and hiding recording controls.
 * - startRecTimer(): Initializes the recording timer display when recording starts.
 * - updateRecTimer(recordedFrames): Updates the recording timer display based on the number of frames recorded and the frame rate.
 * - stopRecTimer(): Resets the recording timer display when recording stops or is canceled.
 *
 * Note that this class interacts with DOM elements that must be present in the HTML file, such as buttons and status displays. 
 * See index.html for the relevant HTML structure.
*/

class Interface {

  constructor() {
    this.exportBtn = null;
    this.stopBtn   = null;
    this.cancelBtn = null;
    this.recStatus = null;
    this.recTimer  = null;
  }

  // Initializes references to the DOM elements used in the interface.
  // This method should be called after the DOM is fully loaded to ensure all elements are available 
  // Call it in sketch.js -> setup() 
  init() {
      this.exportBtn = document.getElementById('exportBtn');
      this.stopBtn   = document.getElementById('stopBtn');
      this.cancelBtn = document.getElementById('cancelBtn');
      this.recStatus = document.getElementById('recStatus');
      this.recTimer  = document.getElementById('recTimer');
  }

  // UI state management methods
  showRecordingUI() {
    this.exportBtn.disabled = true;
    this.exportBtn.style.display = 'none';
    this.stopBtn.style.display   = '';
    this.cancelBtn.style.display = '';
    this.recStatus.style.display = '';
  }

  // Resets the UI to the idle state, showing the export button and hiding recording controls.
  showIdleUI() {
    this.exportBtn.disabled = false;
    this.exportBtn.style.display = '';
    this.stopBtn.style.display   = 'none';
    this.cancelBtn.style.display = 'none';
    this.recStatus.style.display = 'none';
    this.stopRecTimer();
  }

  // Initializes the recording timer display when recording starts.
  startRecTimer() {
    if (this.recTimer) this.recTimer.textContent = '00:00';
  }

  // Updates the recording timer display 
  updateRecTimer(recordedFrames) {
    const totalSeconds = recordedFrames / recorder.rate;
    const mm = String(Math.floor(totalSeconds / 60)).padStart(2, '0');
    const ss = String(Math.floor(totalSeconds % 60)).padStart(2, '0');
    if (this.recTimer) this.recTimer.textContent = mm + ':' + ss;
  }

  // Resets the recording timer display when recording stops or is canceled.
  stopRecTimer() {
    if (this.recTimer) this.recTimer.textContent = '00:00';
  }

}