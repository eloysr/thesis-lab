/*
 * © 2026 Schultzschultz. Created for 'Schultzschultz Creative Coding Masterclass'.
 * For educational use only. All rights reserved.
 *
 * -----------------------------------
 * Export MP4 Record – MP4Export Class
 * -----------------------------------
 *
 * This file is the implementation of the MP4Export class, which manages the recording 
 * and exporting of the canvas animation as a MP4 video file.
 *
 * Key features of the MP4Export class:
 * - start(): Initializes the recording process, sets up the encoder, and manages the UI state.
 * - update(): Captures each frame of the animation by drawing the canvas onto an off-screen buffer and adding it to the encoder.
 * - stop(): Finalizes the recording, triggers a download of the video file, and resets the UI state.
 * - cancel(): Stops recording and discards the video without saving.
 * - setup(): Internal method to initialize the HME encoder with appropriate settings.
 *
 * Note that the encoder used in this implementation is based on the HME (H264 MP4 Encoder) library, 
 * which needs to be included in the project for this code to work. 
 * See index.html for the script tag that imports the HME library.
*/

class MP4Export {

  constructor() {
    this.encoder = null;   // The HME encoder instance
    this.isRecording = false;  // True while frames are being captured
    this.recordedFrameCount = 0;
    this.w = 1080;
    this.h = 1080;
    this.rate = 30;
  }

  // Triggered by a button click, which initializes the recording process and manages the UI state.
  async start() {


    // START ––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––
    // If you need to perform any additional setup or initialization 
    // before the setupRecord() method is called, you can do it here.

    // Update the UI to show recording controls and hide the export button
    ui.showRecordingUI();
    // END ––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––

    // Set up the encoder and start recording immediately
    await this.setup();

    if (this.encoder != null) {

      // Set the frame rate to match the encoder's settings for consistent recording quality
      frameRate(this.rate);

      // Set the isRecording flag to true to indicate that recording is in progress, and reset the recorded frame count
      this.isRecording = true;
      this.recordedFrameCount = 0;

      // Initialize the recording timer display in the UI
      ui.startRecTimer();

      // ––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––
      // If you need to perform any additional setup or initialization 
      // before the recording loop starts, you can do it here.

      // ...
      // ––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––

      // -> Start the recording loop, which will call update() on each frame to capture the animation

    } else {
      // If the encoder setup failed, reset the UI and state variables to allow for another attempt
      frameRate(60);
      this.isRecording = false;
      ui.showIdleUI();
      print('error: encoder setup could not be finished');
    }
  }

  // Called on each frame while recording is active.
  update() {

    if (!this.isRecording) return;

    // Temporary graphics buffer matching the encoder's dimensions
    let exportGraphic = createGraphics(this.encoder.width, this.encoder.height, P2D);
    exportGraphic.pixelDensity(1);
    exportGraphic.clear();

    // Draw the resized and repositioned canvas onto the buffer
    exportGraphic.background(backgroundColor);
    exportGraphic.image(get(), 0, 0, exportGraphic.width, exportGraphic.height);

    // Extract the pixel data from the buffer and add the frame to the encoder
    this.encoder.addFrameRgba(
      exportGraphic.drawingContext.getImageData(0, 0, exportGraphic.width, exportGraphic.height).data
    );

    // Increment the recorded frame count and update the recording timer display in the UI
    this.recordedFrameCount++;
    ui.updateRecTimer(this.recordedFrameCount);

    // Dispose of the buffer for memory cleanup
    exportGraphic.remove();
  }

  // Finalizes the recording and triggers a download.
  async stop() {


    // Set the isRecording flag to false to indicate that recording has stopped
    this.isRecording = false;

    // START ––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––
    // If you need to perform any additional operations after recording has stopped 
    // but before finalizing the video file, you can do it here.

    // Stop the recording timer in the UI
    ui.stopRecTimer();
    // END ––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––


    // Store a reference to the encoder instance before setting it to null, as we need it to finalize and trigger the download
    const _encoder = this.encoder;
    this.encoder = null;

    // Finalize the video file and trigger the download
    _encoder.finalize();
    const uint8Array = _encoder.FS.readFile(_encoder.outputFilename);
    const anchor = document.createElement('a');
    anchor.href = URL.createObjectURL(new Blob([uint8Array], { type: 'video/mp4' }));
    anchor.download = _encoder.outputFilename;
    anchor.click();

    // Clean up the encoder instance to free memory
    _encoder.delete();

    // Wait a moment to ensure the download has started before resetting the UI
    await new Promise(resolve => setTimeout(resolve, 1000));


    // START ––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––
    // If you need to perform any additional  cleanup or reset operations 
    // after the recording has finished, you can do it here.

    // Reset the frame rate to the default value and update the UI to show the export button again
    frameRate(60);
    ui.showIdleUI();

    // END ––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––

  }

  // Stops recording and discards the video without saving.
  async cancel() {

    // Set the isRecording flag to false to indicate that recording has stopped, and stop the recording timer in the UI
    this.isRecording = false;
    ui.stopRecTimer();

    // Store a reference to the encoder instance before setting it to null, as we need it to finalize and trigger the download
    const _encoder = this.encoder;
    this.encoder = null;

    // Finalize the encoder to ensure any resources are released, then delete the encoder instance to free memory
    try { _encoder.finalize(); } catch (e) { }
    _encoder.delete();

    // START ––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––
    // If you need to perform any additional cleanup or reset operations 
    // after the recording has been cancelled, you can do it here.

    // Reset the frame rate to the default value and update the UI to show the export button again
    frameRate(60);
    ui.showIdleUI();

    // END ––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––
  }

  // Initializes the HME encoder with settings such as output filename, dimensions, frame rate, and quality parameters.
  async setup() {
    // Generate a timestamp for the filename in the format "YYYY-MM-DD_HH-MM-SS"
    let timestamp = year() + '-' + month() + '-' + day() + '_' + hour() + '-' + minute() + '-' + second();
    await HME.createH264MP4Encoder().then(enc => {
      this.encoder = enc;
      this.encoder.outputFilename = 'runningLetters_' + timestamp;
      this.encoder.width = this.w;
      this.encoder.height = this.h;
      this.encoder.frameRate = this.rate;
      this.encoder.speed = 0;
      this.encoder.quantizationParameter = 10;
      this.encoder.groupOfPictures = 1;
      this.encoder.initialize();
    });
  }

}