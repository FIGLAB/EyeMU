// Eye saving variables
var leftEyeIms = [0];
var rightEyeIms = [0];
var webcamOffset = 300;
var newFrame

// x and y vects
var eyeData = [[],[]];
var eyeVals = [];
var headTilts =[];
var headSizes = [];
var head_top, head_left, head_bot, head_right;
var curLen = 0;

// Live prediction variables
var curEye
var curHeadTilt = [];
var curHeadSize = 0;

// Resize eyeballs to this size
var inx = 50;
var iny = 50;

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

//Tmps
var started = false;

const state = {
    backend: 'wasm',
//    backend: 'webgl',
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



function waitForIt(){
    if (document.body){
        collectmain();
    } else {
        document.addEventListener("DOMContentLoaded", function(event) {
           console.log("DOM fully loaded and parsed");
           collectmain();
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
    const predictions = await fmesh.estimateFaces(video);

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
    setTimeout(requestAnimationFrame(renderPrediction), 100);
};


async function drawCache(continuous){
// Draw the eye cache
        const tmpx = 0;
        const tmpy = 0;

        const image = leftEyeIms[0];
        const rimage = rightEyeIms[0];

        ctx.drawImage(image, tmpx, tmpy, inx, iny);
        ctx.drawImage(rimage, tmpx + 10 + inx, tmpy, inx, iny);

        if (continuous){
            curEye = [tf.browser.fromPixels(
                    ctx.getImageData(tmpx,tmpy, inx, iny)),
                    tf.browser.fromPixels(
                    ctx.getImageData(tmpx + 10 + inx ,tmpy, inx, iny))]
        } else{
            // Update main vector with the left and right pics, then the location
            tmpImage = tf.browser.fromPixels(
                    ctx.getImageData(tmpx,tmpy, inx, iny))
            eyeData[0].push(tmpImage);

            tmpImage = tf.browser.fromPixels(
                    ctx.getImageData(tmpx + 10 + inx ,tmpy, inx, iny))
            eyeData[1].push(tmpImage);
        }
}



async function eyeSelfie(continuous){
        // Get bounding boxes of the eyes
        const wr = rBB[1]-rBB[0];
        const hr = rBB[3]-rBB[2];
        const wl = lBB[1]-lBB[0];
        const hl = lBB[3]-lBB[2];

        // store head yaw and pitch, also the ground truth dot location
//        const cur_calib = (((calib_counter-1) % nx_arr.length) + nx_arr.length) % nx_arr.length;
//        console.log(nx_arr[cur_calib]/screen.width, ny_arr[cur_calib]/screen.height);
//        console.log(X/screen.width, Y/screen.height);

//        const nowVals = [nx_arr[cur_calib]/screen.width, ny_arr[cur_calib]/screen.height];
        const nowVals = [X/screen.width, Y/screen.height];

        const nowHeadAngles = [getFacePitch(prediction.mesh), getFaceYaw(prediction.mesh)];
        const headSize = getFaceSize(prediction)
        // Normalize head size by video capture, also face mesh allows heads bigger than the screen so divide by a bit more to keep under 1.


        Promise.all([
            createImageBitmap(video,lBB[0], lBB[2], wl, hl),
            createImageBitmap(video,rBB[0], rBB[2], wr, hr)
        ]).then(function (eyeIms){
            leftEyeIms[0] = eyeIms[0];
            rightEyeIms[0] = eyeIms[1];

            if (continuous){
                curHeadTilt = nowHeadAngles;
                curHeadSize = headSize;
            } else{
                eyeVals.push(nowVals);
                headTilts.push(nowHeadAngles)
                headSizes.push(headSize)
            }
            drawCache(continuous);
        });

    if (continuous){
        requestAnimationFrame(() => {eyeSelfie(continuous)});
    }
}


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



async function collectmain() {
//    await tf.setBackend(state.backend);
    await tf.setBackend(state.backend);
    while (tf.getBackend().localeCompare(state.backend) != 0){
        await tf.setBackend(state.backend);
        console.log('setting backend')
    }

    fmesh = await facemesh.load({maxFaces: state.maxFaces});
    // This above command takes forever on webgl backend
    await tf.setBackend('webgl');

    // Set up camera
    await setupCamera();
    video.play();
    videoWidth = video.videoWidth;
    videoHeight = video.videoHeight;

    // Set up webcam canvas
    canvas = document.getElementById('eyecache');
    canvas.width = screen.width;
    canvas.height = 900;
    ctx = canvas.getContext('2d');

    drawWebcam();
//    eyeSelfie();
//    setInterval(eyeSelfie, 100);
    renderPrediction();
    console.log("after model load");
}


