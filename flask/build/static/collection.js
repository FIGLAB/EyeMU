// Eye saving variables
var leftEyeIms = [0];
var rightEyeIms = [0];
var webcamOffset = 100;
var newFrame

// x and y vects
var eyeData = [[],[]];
var eyeVals = [];
var headTilts =[];
var curLen = 0;

// Resize eyeballs to this size
var inx = 50;
var iny = 25;

// Canvas variables
var ctx;
var canvas;
var rBB;
var lBB;

// Machine learning things
var eyeModel;
var lr = .001;
var epochNums = 50;
var valsplit = .1;


const state = {
    backend: 'wasm',
    maxFaces: 1, // Only one mouse, after all
};

//Yaw is the angle in the x-z plane with the vertical axis at the origin
//Return is in radians. Turning the head left is a positive angle, right is a negative angle, 0 is head on.
function getFaceYaw(mesh){
    yaw=Math.atan((mesh[50][2]-mesh[280][2])/(mesh[50][0]-mesh[280][0]));
    return yaw;
}

//Pitch is the angle in the z-y plane with the horizontal axis at the origin
//Return is in radians. Turning the head up is a positive angle, down is a negative angle, 0 is head on.
function getFacePitch(mesh){
    //Use two points on forehead because it has a z normal vector
    pitch=Math.atan((mesh[10][2]-mesh[8][2])/(mesh[8][1]-mesh[10][1]));
    return pitch;
}

// Convenience function for finding the bounding box of an xy array
function maxminofXY(array){
    const xs = [];
    const ys = [];
    for (i = 0; i< array.length; i++){
        xs.push(array[i][0]);
        ys.push(array[i][1]);
    }
    const adj = 3;
    return [Math.min(...xs)-adj, Math.max(...xs)+adj,Math.min(...ys)-adj, Math.max(...ys)+adj];
}

function waitForIt(){
    if (document.body){
        main();
    } else {
        document.addEventListener("DOMContentLoaded", function(event) {
           console.log("DOM fully loaded and parsed");
           main();
        });
    }
}

async function setupCamera() {
  video = document.getElementById('video');
  const stream = await navigator.mediaDevices.getUserMedia({
    'audio': false,
    'video': {
      facingMode: 'user',
    },
  });
  video.srcObject = stream;

  return new Promise((resolve) => {
    video.onloadedmetadata = () => {
      resolve(video);
    };
  });
}

async function drawWebcam(){

    // Draw face onto canvas 2d context
    ctx.drawImage(video, 0, webcamOffset, videoWidth, videoHeight);
    newFrame = true;

    requestAnimationFrame(drawWebcam);
}


async function renderPrediction() {
    const predictions = await model.estimateFaces(video);

    if (predictions.length > 0) {
        // If we find a face, proceed with first and only prediction
        prediction = predictions[0];

        // Find the eyeboxes (you could index directly but it wouldn't be that much faster)
        right_eyebox = (prediction.annotations.rightEyeUpper0).concat(prediction.annotations.rightEyeLower0);
        left_eyebox = (prediction.annotations.leftEyeUpper0).concat(prediction.annotations.leftEyeLower0);

        // find bounding boxes
        rBB = maxminofXY(right_eyebox);
        lBB = maxminofXY(left_eyebox);
    }
//    requestAnimationFrame(renderPrediction);
    setTimeout(requestAnimationFrame(renderPrediction), 100);
};


async function drawCache(){
// Draw the eye cache
//        leftEyeIms.forEach(function (image, index){
            const tmpx = 0;
            const tmpy = 0;

            const image = leftEyeIms[0];
            const rimage = rightEyeIms[0];

            ctx.drawImage(image, tmpx, tmpy, inx, iny);
            ctx.drawImage(rimage, tmpx + 10 + inx, tmpy, inx, iny);

            // Show the label
            document.getElementById("lastXY").innerHTML = "last XY: " + eyeVals[eyeVals.length-1].toString();

            // Update main vector with the left and right pics, then the location
            tmpImage = tf.browser.fromPixels(
                    ctx.getImageData(tmpx,tmpy, inx, iny))
            tmpImage = tf.mean(tmpImage,2);
            eyeData[0].push(tf.div(tmpImage,tf.max(tmpImage)).dataSync());

            tmpImage = tf.browser.fromPixels(
                    ctx.getImageData(tmpx + 10 + inx ,tmpy, inx, iny))
            tmpImage = tf.mean(tmpImage,2);
            eyeData[1].push(tf.div(tmpImage,tf.max(tmpImage)).dataSync());
}

async function eyeSelfie(){
        if (started && newFrame){
            // Get bounding boxes of the eyes
            const wr = rBB[1]-rBB[0];
            const hr = rBB[3]-rBB[2];
            const wl = lBB[1]-lBB[0];
            const hl = lBB[3]-lBB[2];

            // store head yaw and pitch, also the ground truth dot location
            const nowVals = [x/100, y/100];
            const nowHeadAngles = [getFacePitch(prediction.mesh), getFaceYaw(prediction.mesh)];


            Promise.all([
                createImageBitmap(video,lBB[0], lBB[2], wl, hl),
                createImageBitmap(video,rBB[0], rBB[2], wr, hr)
            ]).then(function (eyeIms){
                leftEyeIms[0] = eyeIms[0];
                rightEyeIms[0] = eyeIms[1];
                eyeVals.push(nowVals);
                headTilts.push(nowHeadAngles)

                drawCache();
                dotgenerator();
                Lclicked();
            });

            newFrame = false;
        }
}

//async function trainModel(){
//    console.log("training model");
//    document.getElementById("trainingstate").innerHTML = "training...";
//
//    // Init model
//    eyeModel = makeModel();
//
//    // Display the learning rate and set the optimizer
//    console.log(lr);
//    dadam = tf.train.adam(lr);
//
//    // Compile the model
//    eyeModel.compile({
//      optimizer: dadam,
//      loss: 'meanSquaredError',
//      metrics: ['mae', 'mse']
//    });
//
//    // construct x_vect as the left eye ims and y_vect as the screen coordinates
//    aa = tf.tensor(eyeData[0], [eyeData[0].length, iny, inx, 1])
//    bb = tf.tensor(eyeVals, [eyeVals.length, 2])
//
//    eyeModel.fit(aa, bb, {
//       epochs: epochNums,
//       batchSize: 100,
//       validationSplit: valsplit,
//       callbacks: {
//      onEpochEnd: async (batch, logs) => {
//        console.log('Loss: ' + logs.loss.toFixed(5));
//      }
//    }
//    }).then(info => {
//   console.log('Final accuracy', info.history);
//   console.log( info.history['mae']);
//   console.log( info.history['val_mae']);
//    console.log("training done");
//    document.getElementById("trainingstate").innerHTML = "training done";
//     });
//}

//async function testModel(){
//    const prediction = eyeModel.predict(tf.tensor(eyeData[0][eyeData[0].length-1], [1, iny, inx, 1]));
//    prediction.print();
//    document.getElementById("prediction").innerHTML = tf.mul(prediction,100).arraySync();
//    myEyesAreUpHere(prediction)
//}

function getAccel(){
DeviceMotionEvent.requestPermission()
    .then(response => {
      if (response == 'granted') {
        window.addEventListener('devicemotion', (e) => {
          // do something with e
          console.log(e)
        })
      }
    })
    .catch(console.error)
}



async function main() {
//    await tf.setBackend(state.backend);
    await tf.setBackend(state.backend);
    while (tf.getBackend().localeCompare(state.backend) != 0){
        await tf.setBackend(state.backend);
        console.log('setting backend')
    }
    console.log("one " + tf.getBackend())

    model = await facemesh.load({maxFaces: state.maxFaces});
    console.log("two " + tf.getBackend())

    await tf.setBackend(state.backend);
    console.log("three " + tf.getBackend())
    // This above command takes forever

    // Set up camera
    await setupCamera();
    video.play();
    videoWidth = video.videoWidth;
    videoHeight = video.videoHeight;

    // Set up webcam canvas
    canvas = document.getElementById('eyecache');
    canvas.width = screen.width;
    canvas.height = 1000;
    ctx = canvas.getContext('2d');

    // set text options
    ctx.strokeStyle = "grey";
    ctx.font = '17pt Calibri';


    getAccel();
//    let acl = new Accelerometer({frequency: 60});
//
//    acl.addEventListener('reading', () => {
//      console.log("Acceleration along the X-axis " + acl.x);
//      console.log("Acceleration along the Y-axis " + acl.y);
//      console.log("Acceleration along the Z-axis " + acl.z);
//    });
//
//    acl.start();



    drawWebcam();
    setInterval(eyeSelfie, 100);
    renderPrediction();
    console.log("after model load");










}


