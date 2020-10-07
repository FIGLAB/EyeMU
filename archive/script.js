// based on: https://codelabs.developers.google.com/codelabs/tensorflowjs-teachablemachine-codelab/index.html#3

/**********************************
 *                                *
 *       GLOBAL VARIABLES         *
 *                                *
**********************************/



let faceNet, mobileNet, webcam;

// The number of classes we want to predict.
const NUM_CLASSES = 9;

const webcamElement = document.getElementById('video');

// The dataset object where we will store activations.
const controllerDataset = new ControllerDataset(NUM_CLASSES);

// Reads an image from the webcam and associates it with a specific class
// index and adds it to the buffer.
var n_calib_rounds = 1;

var radius = 50.0;
var X, Y;
var nX, nY;
var delay = 20; //25
var moveDelay = 60; //120
var calib_counter = 0;
var calib_rounds = 0;

// for drawing the rectangle at prediction time
var rect_x, rect_y;

// at what stage are we at:
//  0: setting things up
//  1: collecting data
//  2: training
//  3: predicting
var app_stage = 0;

var nx_arr = [];
var ny_arr = [];

// abc123: automate it
const INPUT_SHAPE = 3*1280+1404;
const classNames = ['Zero', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight'];

/**********************************
 *                                *
 *       THE ACTUAL MODEL         *
 *                                *
**********************************/

// Define the topology of the model: two dense layers.
const model = tf.sequential();
model.add(tf.layers.dense(
    {units: 20, activation: 'sigmoid', inputShape: [INPUT_SHAPE]}));

// Now we flatten the output from the 2D filters into a 1D vector to prepare
// it for input into our last layer. This is common practice when feeding
// higher dimensional data to a final classification output layer.
// model.add(tf.layers.flatten());

// Our last layer is a dense layer which has 3 output units, one for each
// output class (i.e. 0, 1, 2).
model.add(tf.layers.dense({
  units: NUM_CLASSES,
  kernelInitializer: 'varianceScaling',
  activation: 'softmax'
}));

// Choose an optimizer, loss function and accuracy metric,
// then compile and return the model
// abc123: add ability to change the learning rate with something like
// getElementbyId() or something
const optimizer = tf.train.adam();
model.compile({
  optimizer: optimizer,
  loss: 'categoricalCrossentropy',
  metrics: ['accuracy'],
});

// model.summary();
console.log('created model...');

/**********************************
 *                                *
 *       HELPER FUNCTIONS         *
 *                                *
**********************************/

// Function to train the NN and display JS tensorboard
async function train() {
  console.log('starting training');
  const metrics = ['loss', 'val_loss', 'acc', 'val_acc'];
  const container = {
    name: 'Model Training', styles: { height: '1000px' }
  };
  const fitCallbacks = tfvis.show.fitCallbacks(container, metrics);
  
  // Train the model! Model.fit() will shuffle xs & ys so we don't have to.
  await model.fit(controllerDataset.xs, controllerDataset.ys, {
    batchSize: 32,
    epochs: 20,
    validationData: [controllerDataset.xs, controllerDataset.ys],
    callbacks: fitCallbacks
  });
  
  console.log('Finished training');
  app_stage = 3;
}

// Once the model is trained, look for the prediction
function doPrediction(activation) {

  // in case of true labels being known change the labels
  const labels = 0;

  // preds are the predictions by our model
  const preds = model.predict(activation).argMax(-1);

  return [preds, labels];
}

// Function to calculate and display the per class accuracy
async function showAccuracy(model, data) {
  const [preds, labels] = doPrediction(model, data);
  const classAccuracy = await tfvis.metrics.perClassAccuracy(labels, preds);
  const container = {name: 'Accuracy', tab: 'Evaluation'};
  tfvis.show.perClassAccuracy(container, classAccuracy, classNames);

  labels.dispose();
}

// Function to calculate and display the confusion matrix
async function showConfusion(model, data) {
  const [preds, labels] = doPrediction(model, data);
  const confusionMatrix = await tfvis.metrics.confusionMatrix(labels, preds);
  const container = {name: 'Confusion Matrix', tab: 'Evaluation'};
  tfvis.render.confusionMatrix(
      container, {values: confusionMatrix}, classNames);

  labels.dispose();
}

// Function to crop an image given a box, and resize it to img_size
function croppingResizing(img, box, img_size) {
  const boxes = [box]// await tf.tensor2d(box, [1, 4]);
  const boxInd = [0]//await tf.tensor1d([0], 'int32');
  const cropSize = [img_size, img_size]//await tf.tensor1d([128, 128], 'int32');

  return tf.image.cropAndResize(img.expandDims(0), boxes, boxInd, cropSize).squeeze([0]);
}

// Captures a frame from the webcam and extracts eyes, faces, face keypoints
async function getImage() {

  const img = await webcam.capture();
  
  const processedImg =
      tf.tidy(() => img.expandDims(0).toFloat().div(127).sub(1));
  // img.dispose();

  let [y1, x1, y2, x2] = [0, 0, 1, 1];
  let [eyeLeft_y1, eyeLeft_x1, eyeLeft_y2, eyeLeft_x2] = [0, 0, 1, 1];
  let [eyeRight_y1, eyeRight_x1, eyeRight_y2, eyeRight_x2] = [0, 0, 1, 1];

  let keypoints = [null];

  const predictions = await faceNet.estimateFaces(img);

  if (predictions.length > 0) {
    [y2, x2, y1, x1] = [predictions[0].boundingBox.bottomRight[0][1]/255, predictions[0].boundingBox.bottomRight[0][0]/255, predictions[0].boundingBox.topLeft[0][1]/255, predictions[0].boundingBox.topLeft[0][0]/255];

    keypoints = predictions[0].scaledMesh;

    [eyeLeft_y1, eyeLeft_x1, eyeLeft_y2, eyeLeft_x2] = [keypoints[46][1]/255, keypoints[46][0]/255, keypoints[188][1]/255, keypoints[188][0]/255];
    [eyeRight_y1, eyeRight_x1, eyeRight_y2, eyeRight_x2] = [keypoints[285][1]/255, keypoints[285][0]/255, keypoints[261][1]/255, keypoints[261][0]/255];

  }

  const processedImg = croppingResizing(img, [y1, x1, y2, x2], 32);
  const processedLeftEye = croppingResizing(img, [eyeLeft_y1, eyeLeft_x1, eyeLeft_y2, eyeLeft_x2], 32);
  const processedRightEye = croppingResizing(img, [eyeRight_y1, eyeRight_x1, eyeRight_y2, eyeRight_x2], 32);

  // console.log(processedImg.shape);

  // const canvas = await document.getElementById('thumb-face');
  
  // draw_img(canvas, processedImg, 128);

  // const canvasLeftEye = await document.getElementById('thumb-left-eye');
  
  // draw_img(canvasLeftEye, processedLeftEye, 64);

  // const canvasRightEye = await document.getElementById('thumb-right-eye');
  
  // draw_img(canvasRightEye, processedRightEye, 64);
  
  return [processedImg, processedLeftEye, processedRightEye, keypoints];
}

// Function to draw image `img` of size `img_size` to `canvas`
function draw_img(canvas, img, img_size) {
  
  const [out_width, out_height] = [img_size, img_size];
  const ctx = canvas.getContext('2d');
  
  const imageData = new ImageData(out_width, out_height);
  const data = img.dataSync();
  
  for (let i = 0; i < out_height * out_width; ++i) {
    const j = i * 4;
    imageData.data[j + 0] = data[i * 3 + 0];
    imageData.data[j + 1] = data[i * 3 + 1];
    imageData.data[j + 2] = data[i * 3 + 2];
    imageData.data[j + 3] = 255;
  }
  
  ctx.putImageData(imageData, 0, 0);
}

// Function to create `facemesh`, `mobilenet` models and start webcam
async function app() {
  console.log('Loading facemesh model..');

  // Load the model.
  faceNet = await facemesh.load({maxFaces: 1});
  console.log('Successfully loaded facemesh model');

  console.log('Loading mobilenet..');

  // Load the model.
  // abc123: need to specify inputRange?: [number, number] param
  mobileNet = await mobilenet.load({version: 2, alpha: 0.5}); // mobilenet v2
  console.log('Successfully loaded mobilenet');

  webcam = await tf.data.webcam(webcamElement, {resizeWidth: 256, resizeHeight: 256});

  await tf.nextFrame();
}

// Function to find the grid ID of the ball using row major from top left
function findGrid(X, Y) {
  const unit_x = width/3;
  const unit_y = width/3;
  return (Math.floor(Y/unit_y)*3)+Math.floor(X/unit_x);
}

/**********************************
 *                                *
 *          MAIN LOOP             *
 *                                *
**********************************/
// THE FUNCTION `setup` IS RAN ONCE IN THE BEGINNING
// THE FUNCTION `draw` STARTS LOOPING AT THE SAME TIME AS `setup`

// Setup the Processing Canvas
async function setup() {
  createCanvas(windowWidth, windowHeight);
  strokeWeight( 1 );
  frameRate( 30 );
  X = width / 2;
  Y = height / 2;
  nX = X;
  nY = Y;
  rect_x = width/6;
  rect_y = height/6;

  nx_arr = [width/2, 9*width/10, width/10,9*width/10,width/2,width/10,width/2,width/10,9*width/10];
  ny_arr = [height/10, 9*height/10, height/2,height/10,height/2,9*height/10,9*height/10,height/10,height/2];

  await app();
  console.log("canvas setup");

  // might want to add a button or something here
  app_stage = 1;


}

const addExample = async classId => {
  // Capture an image from the web camera.
  // abc123: should use processed input here
  
  const [face, leftEye, rightEye, mesh] = await getImage();
  
  // Get the intermediate activation of MobileNet 'conv_preds' and pass that
  // to the KNN classifier.
  const activationFace = mobileNet.infer(face, true).squeeze([0]); // output of shape [1280]
  const activationLeftEye = mobileNet.infer(leftEye, true).squeeze([0]);
  const activationRightEye = mobileNet.infer(rightEye, true).squeeze([0]);
  const activationMesh = tf.tensor(mesh).reshape([1404]);

  const activation = tf.concat([activationFace, activationLeftEye, activationRightEye, activationMesh]).expandDims(0);
  controllerDataset.addExample(activation, classId);

  console.log("Example added for "+classId);
};

// Main draw loop
async function draw(){
  
  // Fill canvas grey
  background( 100 );

  // Set fill-color to blue
  fill( 0, 121, 184 );

  // Set stroke-color white
  stroke(255); 

  if (app_stage==0) {
    textSize(100);
    text('Setting up...', width/3, height/2);
  }

  else if (app_stage==1) {
    if (calib_rounds < n_calib_rounds){
    
      radius = radius + sin( frameCount / 4 );

      // Track circle to new destination
      X+=(nX-X)/delay;
      Y+=(nY-Y)/delay;

      // Draw circle
      ellipse( X, Y, radius, radius );
      
      // some tf nextFrame to make sure the examples are added
      await addExample(findGrid(X, Y));
      await tf.nextFrame();
      await tf.nextFrame();

      if(frameCount%moveDelay==0){
        nX = nx_arr[calib_counter]; 
        nY = ny_arr[calib_counter]; 
        calib_counter = calib_counter + 1;
        if (calib_counter > 8){
          calib_counter = 0;
          calib_rounds = calib_rounds + 1;
          if (calib_rounds%2==0){
            nx_arr.reverse();
          }
          else{
            ny_arr.reverse();
          }
        }
      }
    
    } else {
      app_stage = 2;

      // nextFrame for breathing room
      await tf.nextFrame();
      await tf.nextFrame();

      await train();

      await tf.nextFrame();
      await tf.nextFrame();
    }
  }

  else if (app_stage==2) {
    textSize(100);
    text('Training...', width/3, height/2);
  }
  
  else if (app_stage==3) {
    // console.log('Predicting...');
    const [face, leftEye, rightEye, mesh] = await getImage();
    // Get the intermediate activation of MobileNet 'conv_preds' and pass that
    // to the KNN classifier.
    const activationFace = mobileNet.infer(face, true).squeeze([0]); // output of shape [1280]
    const activationLeftEye = mobileNet.infer(leftEye, true).squeeze([0]);
    const activationRightEye = mobileNet.infer(rightEye, true).squeeze([0]);
    const activationMesh = tf.tensor(mesh).reshape([1404]);

    const activation = tf.concat([activationFace, activationLeftEye, activationRightEye, activationMesh]).expandDims(0);

    const result = await doPrediction(activation);

    // visualizing the result
    const idx = result[0].dataSync()[0];
    console.log(idx);
    textSize(100);
    text('idx', width/3, height/2);
    const x_coord = (2*(idx%3))+1;
    const y_coord = (2*Math.floor(idx/3))+1;
    ellipse(x_coord*rect_x, y_coord*rect_y, 2*rect_x, 2*rect_y);

    // Give some breathing room by waiting for the next animation frame to
    // fire.
    await tf.nextFrame();
    await tf.nextFrame();
  }

  // in case app_stage takes some weird value for whatever reason
  else {
    textSize(100);
    text('Unknown...', width/3, height/2);
  }
  
}
