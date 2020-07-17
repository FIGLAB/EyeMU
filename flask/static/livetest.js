// Resize eyeballs to this size
var inx = 50;
var iny = 25;

// Drawing vars
var webcamOffset = 100;
var tmpx = 0;
var tmpy = 0;
var leftEye, rightEye;

// Prediction vars
var rBB, lBB;
var prediction; // Face mesh predict() output
var output;

const state = {
    backend: 'wasm',
    maxFaces: 1, // Only one mouse, after all
};

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


// Calculate head size as width*height of the face bounding box.
//Normalize head size by video capture, also since face mesh allows heads bigger than the screen so divide by a bit more to keep under 1.
function getFaceSize(pred){
    [head_top, head_left] =  prediction.boundingBox.topLeft[0];
    [head_bot, head_right] = prediction.boundingBox.bottomRight[0];
    return (head_bot-head_top)*(head_right-head_left)/(videoWidth*videoHeight)/3;
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



async function drawWebcam(){
    // Draw face onto canvas 2d context
    ctx.drawImage(video, 0, webcamOffset, videoWidth, videoHeight);

    requestAnimationFrame(drawWebcam);
}

async function drawEyes(){
    // Draw the two eyes
    const wr = rBB[1]-rBB[0];
    const hr = rBB[3]-rBB[2];
    const wl = lBB[1]-lBB[0];
    const hl = lBB[3]-lBB[2];
    ctx.drawImage(video, lBB[0], lBB[2], wl, hl, tmpx, tmpy, inx, iny)
    ctx.drawImage(video, rBB[0], rBB[2], wr, hr, tmpx + 10 + inx, tmpy, inx, iny)

    // Update their normed tensors
    leftEye = tf.browser.fromPixels(ctx.getImageData(tmpx,tmpy, inx, iny));
    leftEye = tf.mean(leftEye,2)
    leftEye = tf.div(leftEye, tf.max(leftEye))
    leftEye = leftEye.reshape([1,iny, inx, 1])
//        .dataSync();

    rightEye = tf.browser.fromPixels(ctx.getImageData(tmpx + 10 + inx ,tmpy, inx, iny))
    rightEye = tf.mean(rightEye,2)
    rightEye = tf.div(rightEye, tf.max(rightEye))
    rightEye = rightEye.reshape([1,iny, inx, 1])
//            .dataSync();

    requestAnimationFrame(drawEyes);
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

        // If all three models are loaded and the eye tensors are done processing, test our setup
        if (leftEye != undefined && models.length == 3){
            predictEyeLocation();
        }

    }
    // Slow down the face mesh loop to relieve stress on user's device
    setTimeout(requestAnimationFrame(renderPrediction), 100);
};


function predictEyeLocation(){
        // get yaw, pitch, and size
        const nowHeadAngles = [getFacePitch(prediction.mesh), getFaceYaw(prediction.mesh)];
        const headSize = getFaceSize(prediction)

        // Get right
        const lpred = models[0].predict(leftEye).arraySync()[0];
        const rpred = models[1].predict(rightEye).arraySync()[0];

        const dataVec = [].concat(lpred,
                                  rpred,
                                  nowHeadAngles,
                                  headSize)
        const dataTensor = tf.tensor(dataVec, [1,7])
        output = models[2].predict(dataTensor).arraySync();
        output = output[0];
        drawPrediction()
        console.log(output)

}

//Draw the prediction as an orange dot on the screen.
async function drawPrediction() {
    // Remove all existing predicdots
    const predicdots = document.getElementsByClassName('predicdot');
    if (predicdots.length > 0){
        predicdots[0].parentNode.removeChild(predicdots[0]);
        };

    //Generate prediction dot
    predX = Math.floor(output[0]*100);
    predY = Math.floor(output[1]*100);

    predX = Math.min(Math.max(predX, 0), 100);
    predY = Math.min(Math.max(predY, 0), 100);

    elem=document.createElement("div");
    elem.setAttribute("class", "predicdot");
    elem.setAttribute("style", "left:"+ predX +"%;top:"+ predY +"%;");
    document.body.appendChild(elem);
};



async function main() {
//    await tf.setBackend(state.backend);
    await tf.setBackend(state.backend);
    while (tf.getBackend().localeCompare(state.backend) != 0){
        await tf.setBackend(state.backend);
        console.log('setting backend')
    }

    // Load in face mesh model
    model = await facemesh.load({maxFaces: state.maxFaces});


    // Set up camera
    await setupCamera();
    video.play();
    videoWidth = video.videoWidth;
    videoHeight = video.videoHeight;

    // Set up webcam canvas
    canvas = document.getElementById('webcam');
    canvas.width = screen.width;
    canvas.height = 1000;
    ctx = canvas.getContext('2d');

    // Load in left and right model and store in models variable
    // Make sure boost loads in last with the awaits
    await loadModel("/static/models/lefteye")
    await loadModel("/static/models/righteye")
    loadModel("/static/models/boost")


    renderPrediction();
    drawWebcam();
    setInterval(drawEyes, 100);
}


