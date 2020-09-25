/**
 * @fileoverview CpuXenoEffects takes in image frame data and outputs
 * the results from the wasm-run Drishti CPU-based XenoRenderer graph. Also, it
 * will expect to have a GL canvas reference set, and it will render the xeno
 * effect texture directly to that canvas on process() or processGl() call.
 */
(function(scope) {
'use strict';

/**
 * A class for processing CPU image frames and rendering the desired
 * Xeno Effect directly to the GL-backed canvas provided.
 */
class DefaultDemoApi {
  constructor(module) {
    this.module_ = module;
    this.pixelsPtr_ = null;
    this.pixelsSize_ = 0;
  }

  /**
   * Takes a canvas (which should be able to be backed by a WebGL2 context), and
   * when the Webassembly module has loaded, this canvas will be attached to our
   * C++-side frame processor, which will render directly to it on frame output.
   * @param {!Canvas} canvas The canvas to be used for WebGL2 rendering of our
   *     Xeno Effect output.
   */
  setGlCanvas(canvas) {
    this.module_.canvas = this.canvas_ = canvas;
  }

  attachListener(stream, listener) {
    const packetListener = this.module_.PacketListener.implement(listener);
    this.module_.attachListener(stream, packetListener);
    return packetListener;
  }

  // Bindings into C++

  /**
   * For internal use, a helper function which sets up a special 'input' texture
   * and binds it to our WebAssembly GL canvas, so that JS WebGL calls can
   * interact directly with our C++ GL context, until unbound or replaced with
   * a new texture.
   * @return {boolean} success Returns false if our setup is not yet ready to
   *     attempt this. Returns true if we attempted to bind a texture to our
   *     GL canvas.
   */
  bindTextureToGlCanvas() {
    return this.module_.bindTextureToCanvas();
  }

  /**
   * Sets the subgraphs used by the main graph passed in setGraph() and must be
   * called before calling setGraph().
   * @param {!Array<!Uint8Array>} graphDataList An array of raw Drishti graph
   *   data, in raw text format (.pbtxt).
   */
  setSubgraphs(graphDataList) {
    this.module_.clearGraphs();
    for (const graphData of graphDataList) {
      this.module_.pushTextSubgraph(graphData);
    }
  }

  /**
   * Takes the raw data from a Drishti graph, and passes it to C++ to be run
   * over the video stream. Will replace the previously running Drishti graph,
   * if there is one.
   * @param {!Uint8Array} graphData The raw Drishti graph data, either in binary
   *     protobuffer format (.binarypb), or else in raw text format (.pbtxt).
   * @param {boolean} isBinary This should be set to true if the graph is in
   *     binary format, and false if it is in human-readable text format.
   */
  setGraph(graphData, isBinary) {
    if (isBinary) {
      this.module_.changeBinaryGraph(graphData);
    } else {
      this.module_.changeTextGraph(graphData);
    }
  }

  /**
   * Takes the relevant information from the JS image frame and hands it off
   * to C++ for processing the currently selected effect.
   * @param {!ImageData} imageData The raw image data for the current frame.
   * @param {number} timestamp The timestamp of the current frame, in ms.
   * @return {?MspfData} output The timing information, or null if no processing
   *     occurred.
   */
  process(imageData, timestamp) {
    /**
     * Typedef representing effect processing/rendering timing information.
     * - mspf: Debug data; an average of ms/frame over the last 10 frames.
     *
     * @typedef {{
     *   mspf: number,
     * }}
     */
    var MspfData;
    // We deal with only float offsets for now.
    return this.module_.process({width: imageData.width,
                                 height: imageData.height, timestamp});

  }

  /**
   * Takes the relevant information from the HTML5 video object and hands it off
   * to C++ for processing the currently selected effect.  Similar to process(),
   * but uses an OpenGL texture reference as the input mechanism, since WebGL
   * can directly push video data to texture.
   * @param {!HTMLVideoElement} video Reference to the video we wish to render
   *     an effect onto, at its current frame.
   * @param {number} timestamp The timestamp of the current frame, in ms.
   * @return {?MspfData} output The timing information, or null if no processing
   *     occurred.
   */
  processVideoGl(video, timestamp) {
    // We must create and bind the texture native-side so we have a GL name
    // for it, which is necessary if we want to manage it with C++ OpenGL
    // code Drishti-side (wrapped as a GpuBuffer object).
    if (!this.bindTextureToGlCanvas()) {
      return null;
    }
    // Grabbing the context can create it, so any WebGL calls should be made
    // *after* bindTextureToCanvas returns successfully.
    const gl =
        this.canvas_.getContext('webgl2') || this.canvas_.getContext('webgl');
    if (!gl) {
      alert('Failed to create WebGL canvas context when passing video frame.');
      return null;
    }
    // We assume that using the video object here is the quickest way to push
    // the video texture data into GPU memory, which makes sense, but this
    // assumption has not been tested.
    // TODO(tmullen): If you swap over to using a PBO, texSubImage2D might be
    //     faster here.
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, video);

    // const frameData = new this.module_.FrameDataGl();
    // frameData.width = video.videoWidth;
    // frameData.height = video.videoHeight;
    // frameData.timestamp = timestamp;
    // return this.module_.processGl(frameData);
    return this.module_.processGl({width: video.videoWidth, height: video.videoHeight, timestamp: timestamp});
  }

  processRawBytes(rawBytes) {
    return this.module_.processRawBytes(rawBytes);
  }

  getExifInfo(rawBytes) {
    return this.module_.getExifInfo(rawBytes);
  }
}

scope.DemoApiPromise = new Promise((resolve) => {
  // Passing Module as a parameter is a hack that grabs the js object generated
  // by the file loader, which must be included before this file.
  window.DemoModule(window.Module).then((module) => {
    resolve({
      api: new DefaultDemoApi(module),
      VideoProcessor: window.VideoProcessor,
    });
  });
});

})(self);
