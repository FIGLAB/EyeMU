/**
 * @fileoverview For demo purposes, handles the CPU video input processing,
 * and passes frames to a FrameProcessor, optionally passing the results to an
 * OutputProcessor, if specified.
 */

(function(scope) {
'use strict';

// How many frames to average at a time into our running ms/frame performance
// metrics.
const kMspfFramesToAverage = 10;

// Default camera width and height. Can be override in JSON by specifying
// camera.width and camera.height.
const DEFAULT_WIDTH = 640;
const DEFAULT_HEIGHT = 480;

/**
 * Simple demo class for processing user camera input as video, and passing all
 * frames, with associated timestamps, to be synchronously processed by a
 * frame processor. The resulting output may then be passed to an output
 * processor, if set.
 */
class VideoProcessor {
  /**
   * @param {number} downsampleFactor The factor by which we will downsample our
   *     video (displayed in full resolution on our 'output' canvas), when
   *     rendering it into our processing context for use with wasm-backed
   *     "FrameProcessor"s. The downsampling is handled at the JS layer, just
   *     using canvas rendering with whatever parameters are currently set.
   * @param {boolean} isFrontFacing Whether or not the camera video stream we
   *     require should be front-facing (facing the user on a mobile device).
   *     Otherwise, it is assumed to be back-facing (facing the environment on
   *     a mobile device). If front-facing, the input will be mirrored across
   *     the x-axis by default, if possible, since that's ideal behavior for the
   *     "selfie" use case.
   * @param {boolean} useGlCanvas Set this to true in order to render directly
   *     to the output canvas using openGL from the frame processor. Otherwise,
   *     rendering is assumed to be JS-side and *on top* of the initial video,
   *     which will be drawn into the canvas on every frame.
   * @param {boolean} useGpuInput Set this to true in order to pass through
   *     video frames directly into Drishti graph as GpuBuffer input. NOTE: To
   *     use this, currently downsampleFactor must be 1 and useGlCanvas must be
   *     true, since no preprocessing on video frames will occur.
   */
  constructor(
      config, downsampleFactor, isFrontFacing, useGlCanvas, useGpuInput) {
    this.config_ = config;
    this.downsampleFactor_ = downsampleFactor;
    this.processor_ = null;
    this.outputProcessor_ = null;
    this.isFrontFacing_ = isFrontFacing;
    this.useGlCanvas_ = useGlCanvas;
    this.cleanupStream = undefined;

    this.useGpuInput_ = useGpuInput;
    // Check useGpuInput assumptions here
    if (this.useGpuInput_) {
      if (!this.useGlCanvas_) {
        alert('useGlCanvas must be true for GL passthrough.');
        return null;
      }
      if (this.downsampleFactor_ != 1) {
        alert('downsampleFactor must be 1 for GL passthrough.');
        return null;
      }
      // Log a message that the Drishti graph must be set-up in order to help us
      // enable mirror mode.
      console.log(
          'Using GL passthrough pipeline; video mirroring must be ' +
          'enabled with special options in Drishti graph.');
    }

    // Setup timing parameters here
    this.frames_processed_ = 0;
    this.mspf_total_ = 0;
    this.current_mspf_ = -1;
    return this;
  }

  /**
   * Internal helper function to automatically zoom in to our demo display area.
   * @param {Element!} element The HTML Element (usually assumed to be a "div")
   *     to "zoom in" on (approximating the "double-tap-to-zoom" browser
   *     feature). We attempt to scale up the display of the parentNode of the
   *     given element to fill all of the window's space, using a css style
   *     transform and building in some padding to be scaled up as well.
   */
  autoZoomIn(element) {
    if (!element) {
      return;
    }
    const widthPadding = 0;
    // Large so Android UI bar doesn't cover us at start.
    const heightPadding = 0;
    const scale = Math.min(
        window.innerWidth / (element.clientWidth + widthPadding),
        window.innerHeight / (element.clientHeight + heightPadding));
    console.log('Scaling up to: ', scale);
    element.parentNode.style =
        'transform-origin: 0 0; transform: scale(' + scale + ');';
  }

  /**
   * For our demos, we often require Webgl2, so we add a helper function here so
   * we can first test for WebGL2 support, and if that is missing, instead of
   * proceeding with the demo, we replace the containing HTML element with an
   * informative error message instead, in particular targeting Safari users so
   * they know how to enable it (as it is not enabled by default).
   * @param {Element!} containerElement The HTML Element object which contains
   *     our demo code. Will be replaced by HTML displaying an informative error
   *     text message in the event that the WebGL2 check fails.
   */
  ensureWebGL2(containerElement) {
    const newCanvas = document.createElement('canvas');
    let gl = null;
    try {
      gl = newCanvas.getContext('webgl2');
    } catch (x) {
      gl = null;
    }
    if (!gl) {
      // Replace entire containerElement with error message.
      containerElement.parentNode.innerHTML =
          'WebGL2 did not initialize properly. If you are using Safari, ' +
          'please enable WebGL2 following the instructions below and then ' +
          'refresh the page<br/><br/>For iOS, go to Settings --> Safari --> ' +
          'Advanced --> Experimental Features, and enable WebGL 2.0<br/><br/>' +
          'For OSX, go to Safari --> Preferences --> Advanced, and enable ' +
          'Show Develop menu in menubar<br/><br/>Then, go to Develop --> ' +
          'Experimental Features, and enable WebGL 2.0';
    }
  }

  /**
   * Private helper function to initialize our output and input (downsampled)
   * canvases.
   * @param {number} width The width of the full-size output canvas.
   * @param {number} height The height of the full-size output canvas.
   */
  setupCanvases(width, height) {
    this.canvas_.width = width;
    this.canvas_.height = height;

    // We need to mirror our video output canvas context if not using GL
    // rendering.
    if (this.isFrontFacing_ && !this.useGlCanvas_) {
      const canvasContext = this.canvas_.getContext('2d');
      canvasContext.scale(-1, 1);
    }

    // If we expect our frame processor to handle rendering, we hand our output
    // canvas over to it.
    if (this.useGlCanvas_ && this.processor_ && this.processor_.setGlCanvas) {
      this.processor_.setGlCanvas(this.canvas_);
    }

    this.downsampleWidth_ = width / this.downsampleFactor_;
    this.downsampleHeight_ = height / this.downsampleFactor_;

    // Need a new OffscreenCanvas if downsample canvas was one.
    if (!this.downsampleCanvas_ ||
        typeof this.downsampleCanvas_ === 'OffscreenCanvas') {
      this.downsampleCanvas_ =
          new OffscreenCanvas(this.downsampleWidth_, this.downsampleHeight_);
    }

    this.downsampleCanvas_.width = this.downsampleWidth_;
    this.downsampleCanvas_.height = this.downsampleHeight_;

    // We want to mirror (across x-axis) our initial input from camera for a
    // better "selfie-mode" experience.
    if (this.isFrontFacing_) {
      const copyContext = this.downsampleCanvas_.getContext('2d');
      copyContext.scale(-1, 1);
    }

    // Auto-zoom-in to our demo area, if possible
    // The canvas's parentNode is the containing div for our demo.
    this.autoZoomIn(this.canvas_.parentNode);
  }

  /**
   * Sets up our canvases, camera/video, and then when those have loaded will
   * automatically start up our processing loop for every frame of the video.
   * @param {!HTMLCanvasElement} canvas the canvas to draw to.
   */
  initialize(canvas) {
    // NOTE: Video-related parameters here (and in demo.html) are *highly*
    // brittle, and editing them can cause camera video play to fail without
    // warning.
    this.canvas_ = document.getElementById('output');

    const kWidth = this.canvas_.width;
    const kHeight = this.canvas_.height;

    this.video_ = document.getElementsByClassName('video')[0];
    this.video_.width = kWidth;
    this.video_.height = kHeight;
    this.lastCurrentTime_ = 0.0;

    this.video_.addEventListener(
        'playing', event => this.getVideoSize(event), false);

    // Downsampling canvas is never drawn, so use OffscreenCanvas instead,
    // if it's available.  Note: It seems like on Safari, OffscreenCanvases
    // cannot return '2d' contexts, so we force Safari to use a regular 'canvas'
    // instead.
    const isSafari = navigator.vendor &&
        navigator.vendor.indexOf('Apple') > -1 && navigator.userAgent &&
        navigator.userAgent.indexOf('CriOS') === -1 &&
        navigator.userAgent.indexOf('FxiOS') === -1;
    if (typeof OffscreenCanvas === 'function' && !isSafari) {
      // We'll create this in setup step.
      this.downsampleCanvas_ = null;
    } else {
      this.downsampleCanvas_ = document.createElement('canvas');
    }

    const isIos = !!navigator.userAgent.match(/iPad/i) ||
                  !!navigator.userAgent.match(/iPhone/i);
    if (isSafari && isIos) {
      this.video_.width = 0;
      this.video_.height = 0;
      this.video_.style = "display: inline;";
    }

    window.onresize = event => this.autoZoomIn(this.canvas_.parentNode);

    this.setupCanvases(kWidth, kHeight);

    // If a source tag is provided, use that instead of camera as the video
    // source!  All other rendering/mirroring options should still apply.
    if (this.video_.currentSrc) {
      this.startVideo();
    } else {
      this.startCamera();
    }
  }

  startVideo() {
    this.onAcquiredUserMedia(null);
  }

  startCamera() {
    // Try to get back-facing camera, if possible.
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      // This can be worked around with legacy commands, but we choose not to
      // do so for this demo.
      alert('No navigator.mediaDevices.getUserMedia exists.');
    }

    const configWidth =
        (this.config_.camera && this.config_.camera.width) || DEFAULT_WIDTH;
    const configHeight =
        (this.config_.camera && this.config_.camera.height) || DEFAULT_HEIGHT;
    // The newest standardized way of attempting to grab video from camera.
    navigator.mediaDevices
        .getUserMedia({
          'audio': false,
          'video': {
            facingMode: this.isFrontFacing_ ? 'user' : 'environment',
            width: configWidth,
            height: configHeight,
          }
        })
        .then(event => this.onAcquiredUserMedia(event))
        .catch(e => {
          console.error('Failed to acquire camera feed: ' + e);
          alert('Failed to acquire camera feed: ' + e);
        });
  }

  stop() {
    if (this.cleanupStream) {
      this.cleanupStream();
      this.cleanupStream = undefined;
    }
  }

  /**
   * Sets the processor to be streamed video frames. The processor must
   * implement the function process(ImageData imageData, number timestamp),
   * returning output which will be sent to the OutputProcessor, if set.
   * @param{?FrameProcessor} frameProcessor The new FrameProcessor to which we
   *     will pass all our video frames and respective timestamps. If null, no
   *     frame processing will occur.
   */
  setFrameProcessor(frameProcessor) {
    this.processor_ = frameProcessor;
    // Let it know our mirror-ing preferences if GL-based
    if (this.useGlCanvas_ && this.processor_.setGlMirrorMode) {
      this.processor_.setGlMirrorMode(this.isFrontFacing_);
    }

    // Also setup output canvas for GL rendering, if possible.
    if (this.useGlCanvas_ && this.processor_.setGlCanvas && this.canvas_) {
      this.processor_.setGlCanvas(this.canvas_);
    }
  }

  /**
   * Sets the output processor, which will be directly streamed the output of
   * the frame processor, for synchronous processing. If this is null, the
   * output will simply be ignored.
   * @param{?OutputProcessor} outputProcessor The new OutputProcessor to which
   *     we will pass the result of our FrameProcessor, for further operations.
   *     If null, that step will be skipped.
   */
  setOutputProcessor(outputProcessor) {
    this.outputProcessor_ = outputProcessor;
  }

  /**
   * Will be called when the camera feed has been acquired. We then start
   * streaming this into our video object.
   * @param {!MediaStream} stream The video stream.
   */
  onAcquiredUserMedia(stream) {
    this.video_.srcObject = stream;
    if (stream) {
      this.cleanupStream = () => {
        stream.getTracks().forEach(function(track) {
          track.stop();
        });
      };
    }
    this.video_.onloadedmetadata = () => {
      this.video_.play();
      this.onPlay(0);
    };
  }

  /**
   * Will be called when the video feed begins to play. We then start our main
   * processing loop going.
   * @param {!Event} event The onPlay event.
   */
  onPlay(event) {
    if (this.useGpuInput_) {
      requestAnimationFrame(event => this.glPassthroughTick(event));
    } else {
      requestAnimationFrame(event => this.tick(event));
    }
  }

  /**
   * When the video triggers the onplaying event, we report the native video
   * size of the target video. This is then used to determine whether we process
   * in portrait or landscape orientation. Must remove itself to avoid a bug in
   * some browsers where the event gets repeatedly triggered.
   * @param {!Event} event The playing event.
   */
  getVideoSize(event) {
    const videoTarget = event.target;
    console.log(
        'Video size: ', videoTarget.videoWidth, videoTarget.videoHeight);
    // If we were in landscape instead of portrait orientation when using camera
    // then the videoWidth and videoHeight will now be swapped from what they
    // were before. If we are playing a video file, then this will be the native
    // resolution. In either case, we can just use these new values directly for
    // our base canvas size, and just re-setup everything else.
    this.setupCanvases(videoTarget.videoWidth, videoTarget.videoHeight);
  }

  /**
   * Records a ms/frame time measurement for live performance metrics--
   * specifically for profiling the main frame processing call of our
   * WebAssembly-backed FrameProcessor. Stores the result, averaged over every
   * kMspfFramesToAverage, into this.current_mspf_, for later use.
   * @param {number} timeDifference The time delta between start and finish of
   *     the frame processing call.
   */
  recordProcessCallMspf(timeDifference) {
    this.frames_processed_++;
    this.mspf_total_ += timeDifference;
    if (this.frames_processed_ >= kMspfFramesToAverage) {
      this.current_mspf_ = this.mspf_total_ / kMspfFramesToAverage;
      this.mspf_total_ = 0;
      this.frames_processed_ = 0;
    }
  }

  /**
   * The main loop of our demo, to be called on every frame.
   * @param {number} timestamp The timestamp of the video, ignored in favor of
   *     other methods of keeping time.
   */
  tick(timestamp) {
    if (this.video_.currentTime !== this.lastCurrentTime_ &&
        !this.video_.paused && !this.video_.ended) {
      this.lastCurrentTime_ = this.video_.currentTime;

      // Render the actual full-size video frame now, if we're rendering on top
      // of it later, instead of replacing it.
      if (!this.useGlCanvas_) {
        const canvasContext = this.canvas_.getContext('2d');
        if (this.isFrontFacing_) {
          canvasContext.drawImage(
              this.video_, -this.canvas_.width, 0, this.canvas_.width,
              this.canvas_.height);
        } else {
          canvasContext.drawImage(
              this.video_, 0, 0, this.canvas_.width, this.canvas_.height);
        }
      }

      // Downsample here into separate (non-visible) context.
      // TODO(tmullen): see if there's a faster way to extract this data.
      const copyContext = this.downsampleCanvas_.getContext('2d');
      let processFrame = (this.processor_ !== null);
      if (copyContext) {
        if (this.isFrontFacing_) {
          // For selfie-mode, our context is already x-flipped, so render with
          // respect to that.
          copyContext.drawImage(
              this.video_, -this.downsampleWidth_, 0, this.downsampleWidth_,
              this.downsampleHeight_);
        } else {
          copyContext.drawImage(
              this.video_, 0, 0, this.downsampleWidth_, this.downsampleHeight_);
        }
      } else {
        console.log('copyContext was not created successfully.');
        processFrame = false;
      }

      if (processFrame) {
        const startTime = performance.now();
        const result = this.processor_.process(
            copyContext.getImageData(
                0, 0, this.downsampleWidth_, this.downsampleHeight_),
            startTime);
        console.log('result', result);
        this.recordProcessCallMspf(performance.now() - startTime);
        if (this.outputProcessor_) {
          if (result) {
            result['currentMspf'] = this.current_mspf_;
          }
          this.outputProcessor_.process(result);
        }

        // We re-evaluate our autozoom logic after container size is updated for
        // first detection result.
        if (result && !this.first_output_) {
          this.autoZoomIn(this.canvas_.parentNode);
          this.first_output_ = true;
        }
      }
    }

    requestAnimationFrame(event => this.tick(event));
  }

  /**
   * The main loop of the video processor, when run in GL passthrough mode.
   * @param {number} timestamp The timestamp of the video, ignored in favor of
   *     other methods of keeping time.
   */
  glPassthroughTick(timestamp) {
    if (this.video_.currentTime !== this.lastCurrentTime_ &&
        !this.video_.paused && !this.video_.ended) {
      this.lastCurrentTime_ = this.video_.currentTime;
      if (this.processor_) {
        const startTime = performance.now();
        const result = this.processor_.processVideoGl(this.video_, startTime);
        this.recordProcessCallMspf(performance.now() - startTime);
        if (this.outputProcessor_) {
          if (result) {
            result['currentMspf'] = this.current_mspf_;
          }
          this.outputProcessor_.process(result);
        }
        // We re-evaluate our autozoom logic after container size is updated for
        // first detection result.
        if (result && !this.first_output_) {
          this.autoZoomIn(this.canvas_.parentNode);
          this.first_output_ = true;
        }
      }
    }
    requestAnimationFrame(event => this.glPassthroughTick(event));
  }
}

scope.VideoProcessor = VideoProcessor;
})(self);
