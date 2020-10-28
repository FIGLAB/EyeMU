// Eye saving variables
var newFrame = true;

// x and y vects for training
var leftEyes_x = [];
var rightEyes_x = [];
var eyeCorners_x = [];
var screenXYs_y = [];

var curLen = 0;

// Live prediction variables
var curEyes = []
var prediction;

// Top left xy to draw the eyes at (debugging)
const tmpx = 0;
const tmpy = 0;

// Resize eyeballs to this size
var inx = 128;
var iny = 128;

// Canvas variables
var ctx2;
//var videoCanvas;

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
    backend: 'webgl',
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
// returns: [left, right, top, bottom, width, height]
function maxminofXY(array){
    const xs = [];
    const ys = [];
    for (i = 0; i< array.length; i++){
        xs.push(array[i][0]);
        ys.push(array[i][1]);
    }
    const adj = 3;
    tmp = [Math.min(...xs)-adj*3, Math.max(...xs)+adj*3,Math.min(...ys)-adj, Math.max(...ys)+adj];
    tmp.push(tmp[1]-tmp[0]); // Add width
    tmp.push(tmp[3]-tmp[2]); // Add height
    return tmp; // returns: [left, right, top, bottom, width, height]
}


// using [left, right, top, bottom] for the bounding box,
// returns [left_leftcorner, left_rightcorner], [right_rightcorner, right_leftcorner]
// The order is flipped because the data was aggregated and fed into the NN in that order

// x coordinates by size should be 1 2 4 3
function boundingBoxToEyeCorners(right_bb, left_bb, h, w){
    const leftY = (left_bb[2] + left_bb[3])/2/h
    const rightY = (right_bb[2] + right_bb[3])/2/h

    return [[[left_bb[1]/w, leftY], [left_bb[0]/w, leftY]],
                [[right_bb[0]/w, rightY], [right_bb[1]/w, rightY]]]
}

// pull true eye corner coordinates straight from the scaled-up face mesh
function getEyeCorners(eyePred, h, w){
    let mesh = eyePred.scaledMesh;
    const left_leftcorner = mesh[263].slice(0,2)
    const left_rightcorner = mesh[362].slice(0,2)
    const right_rightcorner = mesh[33].slice(0,2)
    const right_leftcorner = mesh[133].slice(0,2)

    return [left_leftcorner[0]/w, left_leftcorner[1]/h, left_rightcorner[0]/w, left_rightcorner[1]/h,
            right_rightcorner[0]/w, right_rightcorner[1]/h, right_leftcorner[0]/w, right_leftcorner[1]/h]
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
      width: { ideal: 1280 },
      height: { ideal: 1280 }
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

var now;
// Calls face mesh on the video and outputs the bounding boxes to global vars
async function renderPrediction() {
//    const facepred = await fmesh.estimateFaces(videoCanvas);
    const facepred = await fmesh.estimateFaces(video);


    if (facepred.length > 0) {
        // If we find a face, proceed with first and only prediction
        prediction = facepred[0];

        // Find the eyeboxes (you could index directly but it wouldn't be that much faster)
//        right_eyebox = (prediction.annotations.rightEyeUpper1).concat(prediction.annotations.rightEyeLower1);
//        left_eyebox = (prediction.annotations.leftEyeUpper1).concat(prediction.annotations.leftEyeLower1);
        right_eyebox = (prediction.annotations.rightEyeUpper2).concat(prediction.annotations.rightEyeLower2);
        left_eyebox = (prediction.annotations.leftEyeUpper2).concat(prediction.annotations.leftEyeLower2);

        // find bounding boxes [left, right, top, bottom]
        rBB = maxminofXY(right_eyebox);
        lBB = maxminofXY(left_eyebox);

        // find eye corners
        eyeCorners = getEyeCorners(prediction, videoHeight, videoWidth)

        document.getElementById("videostats").innerHTML = "Video size: " + videoWidth + " x " + videoHeight + " eyeSize: " + Math.round(rBB[1]-rBB[0]) + " x " + Math.round(rBB[3]-rBB[2]);
//        console.log("fmesh loop took", performance.now()-now)
    }

    setTimeout(requestAnimationFrame(renderPrediction), 100); // call self after 100 ms
};

// Draws the current eyes onto the canvas, directly from video streams
async function drawCache(continuous){
        // Get eye images from the video stream directly
        ctx.drawImage(video, lBB[0], lBB[2], lBB[4], lBB[5], // Source x,y,w,h
                        tmpx, tmpy, inx, iny); // Destination x,y,w,h
        ctx.drawImage(video, rBB[0], rBB[2], rBB[4], rBB[5],
                       tmpx + 10 + inx, tmpy, inx, iny);
        newFrame = true;
}


// extracts current eyes to a tensor, as well as the eye corners
async function eyeSelfie(continuous){
    // Wait to start if rBB not defined
    if (rBB == undefined){
        console.log("rBB undefined in eyeSelfie, trying again")
        setTimeout(function(){eyeSelfie(continuous)}, 500);
        return
    }

    // Draw from video onto canvas BEFORE you try to clip it out of the canvas
    drawCache(continuous);

    // If running continuously, update the curEyes and curCorners vec AS TENSORS, BUT THROW AWAY OLD VALS
    if (continuous){
        if (curEyes.length == 3){
            curEyes[0].dispose();
            curEyes[1].dispose();
            curEyes[2].dispose();
        }

        curEyes = tf.tidy(() => {
                    return [tf.browser.fromPixels(
                        ctx.getImageData(tmpx,tmpy, inx, iny)).reverse(1),
                   tf.browser.fromPixels(
                        ctx.getImageData(tmpx + 10 + inx ,tmpy, inx, iny)),
                   tf.tensor(eyeCorners)]})
    } else{ // If calling once, push the eyes, corners, and screenVals into a vector AS TENSORS
        // Add x vars
        let left = tf.tidy(() => {return tf.browser.fromPixels(
                    ctx.getImageData(tmpx,tmpy, inx, iny)).reverse(1)})
        let right = tf.tidy(() => {return tf.browser.fromPixels(
                    ctx.getImageData(tmpx + 10 + inx ,tmpy, inx, iny))})
        let tmpEyeCorn= tf.tensor(eyeCorners);

        leftEyes_x.push(left);
        rightEyes_x.push(right);
        eyeCorners_x.push(tmpEyeCorn);

        // Add y vars
        const nowVals = [X/windowWidth, Y/windowHeight];
        screenXYs_y.push(nowVals);
        // const nowPos = calib_counter-1; // This var is for classification. -1 To start at zero
    }


    if (continuous){
        requestAnimationFrame(() => {eyeSelfie(continuous)});
    }
}

async function collectmain() {
    fmesh = await facemesh.load({maxFaces: state.maxFaces});

//    console.log("start of collect main backend:", tf.getBackend())
//    setTimeout(() => tf.setBackend(state.backend), 300);



    // Set up camera
    await setupCamera();
    video.play();
    videoWidth = video.videoWidth;
    videoHeight = video.videoHeight;

    document.getElementById("videostats").innerHTML = videoWidth + " " + videoHeight;

    // Set up canvas to draw the eyes of the user (debugging feature)
    canvas = document.getElementById('eyecache');
    canvas.width = 300;
    canvas.height = 200;
    ctx = canvas.getContext('2d');


        // start in the eval loop
//    done_with_training = true;
//    curPred = [0,0];
//    renderPrediction();
//    setTimeout(function(){
//            eyeSelfie(true);
//        }
//        , 2000);
//    setTimeout(runNaturePredsLive, 3000);


        // start in training loop
    renderPrediction();

    console.log("collection color main complete");
}


