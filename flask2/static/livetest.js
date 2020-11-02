// Resize eyeballs to this size
var inx = 50;
var iny = 25;

// Prediction vars
var rBB, lBB;
var prediction; // Face mesh predict() output
var output;

// Live vars
var curHeadSize;
var curHeadTilt;

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

    // Clean up
    if (leftEye != undefined){
        leftEye.dispose();
        rightEye.dispose();
    }

    // Update eye tensors
    leftEye = tf.tidy(() => {
        res = tf.browser.fromPixels(ctx.getImageData(tmpx,tmpy, inx, iny))
        res = tf.mean(res,2);
        return tf.div(res, tf.max(res)).reshape([1,iny, inx, 1]);
    });

    rightEye = tf.tidy(() => {
        res = tf.browser.fromPixels(ctx.getImageData(tmpx + 10 + inx ,tmpy, inx, iny))
        res = tf.mean(res,2);
        return tf.div(res, tf.max(res)).reshape([1,iny, inx, 1]);
    });

    //Update head angles and size
    curHeadSize = getFaceSize(prediction)
    curHeadTilt = [getFacePitch(prediction.mesh), getFaceYaw(prediction.mesh)];

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
////     Slow down the face mesh loop to relieve stress on user's device
    setTimeout(requestAnimationFrame(renderPrediction), 50);
//    requestAnimationFrame(renderPrediction);
};



function predictEyeLocation(){
        output = tf.tidy(() => {
            lefttmp = models[0].predict(leftEye).arraySync()[0];
            righttmp = models[1].predict(rightEye).arraySync()[0]

            dataVec = [].concat(lefttmp,
                                  righttmp,
                                  curHeadTilt,
                                  curHeadSize)
            dataTensor = tf.tensor(dataVec, [1,7])
            return models[2].predict(dataTensor).arraySync()[0];
        });


        drawPrediction()

        dataTensor.dispose()
}


async function runNaturePredsLive(){
//    console.log(tf.memory());

    if (curEyes[0] == undefined){
        console.log("curEyes undefined while running prediction, trying again")
        setTimeout(runNaturePredsLive, 500);
        return
    }

    now = performance.now();
    pred = tf.tidy(() => {
        return naturemodel.predict([curEyes[0].div(255).sub(0.5).reshape([1, 128, 128, 3]),
                                curEyes[1].div(255).sub(0.5).reshape([1, 128, 128, 3]),
                                curEyes[2].reshape([1, 8])])
    })
    pred = pred.clipByValue(0.0, 1.0)
    pred.print()

    predictions[0] = pred[0];
    predictions[1] = pred[1];
    curPred = pred.arraySync()[0];

    pred.dispose();
    setTimeout(runNaturePredsLive, 100);
}


async function main() {
    tf.setBackend('webgl');
    await tf.ready();

    // import custom model
    models = [];
    console.log("loading model");
    await loadTFJSModel("/static/models/tfjsmodel");
    naturemodel = models[0];
    console.log('Successfully loaded model');

    // Load in face mesh model
    fmesh = await facemesh.load({maxFaces: state.maxFaces});

    // Set up camera
    await setupCamera();
    video.play();
    videoWidth = video.videoWidth;
    videoHeight = video.videoHeight;
//    document.getElementById("videostats").innerHTML = videoWidth + " " + videoHeight;

    // Resize the regression/classification toggle to look nice
    document.getElementById('regtoggle').style.width = windowWidth + "px"

    // Set up canvas to draw the eyes of the user (debugging feature)
    canvas = document.getElementById('eyecache');
    canvas.width = 300;
    canvas.height = 200;
    ctx = canvas.getContext('2d');


        // start in the eval loop
    done_with_training = true;
    curPred = [0,0];
    renderPrediction();
    setTimeout(function(){
            eyeSelfie(true);
        }, 2000);
    setTimeout(runNaturePredsLive, 3000);
}


