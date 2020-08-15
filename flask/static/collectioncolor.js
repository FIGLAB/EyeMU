// Eye saving variables
var leftEyeIms = [0];
var rightEyeIms = [0];
var webcamOffset = 100;
var newFrame = true;

// x and y vects
var eyeData = [[],[]];
var eyeVals = [];
var eyePositions = [];
var headTilts =[];
var headSizes = [];
var headMeshes = [];

var head_top, head_left, head_bot, head_right;
var curLen = 0;

// Live prediction variables
var curEye = []
var curHeadTilt = [];
var curHeadSize = 0;
var curHeadMesh = [];
var prediction;


// Resize eyeballs to this size
var inx = 100;
var iny = 50;

// Canvas variables
var ctx2;
var videoCanvas;

var ctx;
var canvas;

var rBB;
var lBB;
var xScale;
var yScale;

// Machine learning things
var eyeModel;
var lr = .001;
var epochNums = 50;
var valsplit = .1;

//Tmps
var started = false;

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
};

function getFaceSize(bb){
    head_top = bb.topLeft[0];
    head_left = bb.topLeft[1];
    head_bot = bb.bottomRight[0];
    head_right = bb.bottomRight[1];

    return (head_bot-head_top)*(head_right-head_left)/(videoWidth*videoHeight)/3;
};


// Convenience function for finding the bounding box of an xy array.
// returns: [left, right, top, bottom]
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
      width: { ideal: 4096 },
      height: { ideal: 2160 }
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
    ctx2.drawImage(video, 0, 0, videoCanvas.width, videoCanvas.height);
    requestAnimationFrame(drawWebcam);
}

// Calls face mesh on the video and outputs the bounding boxes to global vars
async function renderPrediction() {
    const facepred = await fmesh.estimateFaces(videoCanvas);
//    const facepred = await fmesh.estimateFaces(video);

    if (facepred.length > 0) {
        // If we find a face, proceed with first and only prediction
        prediction = facepred[0];

        // Find the eyeboxes (you could index directly but it wouldn't be that much faster)
        right_eyebox = (prediction.annotations.rightEyeUpper0).concat(prediction.annotations.rightEyeLower0);
        left_eyebox = (prediction.annotations.leftEyeUpper0).concat(prediction.annotations.leftEyeLower0);

        // find bounding boxes [left, right, top, bottom]
        rBB = maxminofXY(right_eyebox);
        lBB = maxminofXY(left_eyebox);


        rBB[0] = rBB[0]*xScale;
        rBB[1] = rBB[1]*xScale;
        rBB[2] = rBB[2]*yScale;
        rBB[3] = rBB[3]*yScale;

        lBB[0] = lBB[0]*xScale;
        lBB[1] = lBB[1]*xScale;
        lBB[2] = lBB[2]*yScale;
        lBB[3] = lBB[3]*yScale;


        document.getElementById("videostats").innerHTML = "Video size: " + videoWidth + " x " + videoHeight + " eyeSize: " + Math.round(rBB[1]-rBB[0]) + " x " + Math.round(rBB[3]-rBB[2]);
    }
    setTimeout(requestAnimationFrame(renderPrediction), 100);
//    requestAnimationFrame(renderPrediction)
};

//Draws current eyes onto the canvas
async function drawCache(continuous){
        const tmpx = 0;
        const tmpy = 0;

        ctx.drawImage(leftEyeIms[0], tmpx, tmpy, inx, iny);
        ctx.drawImage(rightEyeIms[0], tmpx + 10 + inx, tmpy, inx, iny);
        newFrame = true;

        if (continuous){
            if (curEye.length == 2){ // Clean up memory
                curEye[0].dispose()
                curEye[1].dispose()
            }

            curEye = [tf.browser.fromPixels(
                    ctx.getImageData(tmpx,tmpy, inx, iny)),
                    tf.browser.fromPixels(
                    ctx.getImageData(tmpx + 10 + inx ,tmpy, inx, iny))]
        } else{
            // Update main vector with the left and right pics, then the location
            tmpImage = tf.browser.fromPixels(ctx.getImageData(tmpx,tmpy, inx, iny));
            eyeData[0].push(tmpImage);

            tmpImage = tf.browser.fromPixels(ctx.getImageData(tmpx + 10 + inx ,tmpy, inx, iny));
            eyeData[1].push(tmpImage);
        }
}

// extracts current eyes to a bitmap, as well as the headtilts and size
async function eyeSelfie(continuous){
        // Get bounding boxes of the eyes
        const wr = rBB[1]-rBB[0];
        const hr = rBB[3]-rBB[2];
        const wl = lBB[1]-lBB[0];
        const hl = lBB[3]-lBB[2];

        // store head yaw and pitch, also the ground truth dot location
        const nowVals = [X/screen.width, Y/screen.height];
        const nowPos = calib_counter-1; // To start at zero
        const nowHeadAngles = [getFacePitch(prediction.mesh), getFaceYaw(prediction.mesh)];
        const headSize = getFaceSize(prediction.boundingBox);
        const headMesh = JSON.parse(JSON.stringify(prediction.mesh));
//        const headSize = 0


        Promise.all([
            createImageBitmap(video,lBB[0], lBB[2], wl, hl),
            createImageBitmap(video,rBB[0], rBB[2], wr, hr)
        ]).then(function (eyeIms){
            leftEyeIms[0] = eyeIms[0];
            rightEyeIms[0] = eyeIms[1];

            if (continuous){
                curHeadTilt = nowHeadAngles;
                curHeadSize = headSize;
                curHeadMesh = headMesh;
            } else{
                eyeVals.push(nowVals);
                eyePositions.push(nowPos);
                headTilts.push(nowHeadAngles)
                headSizes.push(headSize)
                headMeshes.push(headMesh);
            }
            drawCache(continuous);
        });

    if (continuous){
        requestAnimationFrame(() => {eyeSelfie(continuous)});
    }
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
//    await tf.setBackend('webgl');

    // Set up camera
    await setupCamera();
    video.play();
    videoWidth = video.videoWidth;
    videoHeight = video.videoHeight;

    document.getElementById("videostats").innerHTML = videoWidth + " " + videoHeight;

    // Set up webcam canvas
    canvas = document.getElementById('eyecache');
    canvas.width = screen.width;
    canvas.height = 200;
    ctx = canvas.getContext('2d');


    videoCanvas = document.getElementById('streamcanvas');
    videoCanvas.width = 640;
    videoCanvas.height = 480;
    ctx2 = videoCanvas.getContext('2d');

    xScale = videoWidth/videoCanvas.width;
    yScale = videoHeight/videoCanvas.height;

    drawWebcam();
//    setTimeout((() => {eyeSelfie(true)}), 100);
    renderPrediction();
    console.log("after model load");
}


