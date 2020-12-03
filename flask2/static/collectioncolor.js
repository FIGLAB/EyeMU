// x and y vects for collecting data for training
var leftEyes_x = [];
var rightEyes_x = [];
var eyeCorners_x = [];
var faceGeom;
var faceGeom_x = [];

var screenXYs_y = [];

// real-time testing variable
var curEyes = []
var prediction;

// Stopping facemesh for training
var stopFacemesh = false;

// Resize eyeballs to this size
var inx = 128;
var iny = 128;

// eye image drawing zone
var ctx;
var canvas;
// 2nd canvas for video stuff
var videoCanvas;
var videoCtx;

// eye bounding boxes
var rBB;
var lBB;




//Yaw is the angle in the x-z plane with the vertical axis at the origin
//Return is in radians. Turning the head left is a positive angle, right is a negative angle, 0 is head on.
function getFaceYaw(mesh){
    yaw=Math.atan((mesh[50][2]-mesh[280][2])/(mesh[50][0]-mesh[280][0])); // Uses two cheek points
    return yaw;
}

//Pitch is the angle in the z-y plane with the horizontal axis at the origin
//Return is in radians. Turning the head up is a positive angle, down is a negative angle, 0 is head on.
function getFacePitch(mesh){
    //Use two points on forehead because it has a z normal vector
    pitch=Math.atan((mesh[10][2]-mesh[168][2])/(mesh[168][1]-mesh[10][1]));
    return pitch;
};

// Roll is the angle in the x-y plane (face plane)
// returns in radians.
function getFaceRoll(mesh){
//    roll = Math.atan2(((mesh[280][0]-mesh[50][0]), mesh[50][1]-mesh[280][1]))
    let a = 151;
    let b = 6;
    roll = Math.atan2(mesh[a][0]-mesh[b][0], mesh[b][1]-mesh[a][1]);
    return roll;
}

function getFaceSize(bb){
    head_top = bb.topLeft[0];
    head_left = bb.topLeft[1];
    head_bot = bb.bottomRight[0];
    head_right = bb.bottomRight[1];

    return (head_bot-head_top)*(head_right-head_left)/(videoWidth*videoHeight);
}

class FaceGeometry{
    constructor(){
        this.numFeatures = 4;
    }

    update(fmeshOutput){
        let mesh = fmeshOutput.mesh;
        this.curYaw = getFaceYaw(mesh);
        this.curPitch = getFacePitch(mesh);
        this.curRoll = getFaceRoll(mesh);
        this.curFaceSize = getFaceSize(fmeshOutput.boundingBox);
    }

    getGeom(){
        return [this.curYaw, this.curPitch, this.curRoll, this.curFaceSize];
    }
}
faceGeom = new FaceGeometry();



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
      aspectRatio: 1.3333,
      width: { ideal: 1920 },
//      height: { ideal: 1708 }
//      height: { ideal: 1280 }
    },
  });
  video.srcObject = stream;

  return new Promise((resolve) => {
    video.onloadedmetadata = () => {
      resolve(video);
      setTimeout(drawCache, 2000); // Draw the first vid frame
    };
  });
}


var videoDivisor = 4; // How much to reduce the video by in the facemesh detection
// Assume leftcorner, rightcorner : (x,y) (x,y) for the corner format
function eyeBoundsFromCorners(leftCorner, rightCorner){
    eyeLen = leftCorner[0] - rightCorner[0]
    xshift = eyeLen / 5
    eyeLen += 2 * xshift;
    yshift = eyeLen / 2
    yref = (leftCorner[1] + rightCorner[1]) / 2

    tmp = [rightCorner[0] - xshift, leftCorner[0] + xshift, yref - yshift, yref + yshift]
    tmp.push(tmp[1]-tmp[0]); // Add width
    tmp.push(tmp[3]-tmp[2]); // Add height

    tmp.forEach((elem, ind) => {
        tmp[ind] = elem*videoDivisor;
    });

    return tmp
} // return [left, right, top, bottom, width, height]

// Calls face mesh on the video and outputs the eyes and face bounding boxes to global vars
async function renderPrediction() {
    const now = performance.now();
//    const facepred = await fmesh.estimateFaces(video);
    const facepred = await fmesh.estimateFaces(videoCanvas);

    if (facepred.length > 0) {
        // If we find a face, proceed with first and only prediction
        prediction = facepred[0];

        // Find the eyeboxes (you could index directly but it wouldn't be that much faster)
        right_eyebox = (prediction.annotations.rightEyeUpper1).concat(prediction.annotations.rightEyeLower1);
        left_eyebox = (prediction.annotations.leftEyeUpper1).concat(prediction.annotations.leftEyeLower1);

        // find eye corners
//        eyeCorners = getEyeCorners(prediction, videoHeight, videoWidth)
        eyeCorners = getEyeCorners(prediction, videoCanvas.height, videoCanvas.width)

        // Get eye bounding boxes from eye corners
//        h = videoHeight
//        w = videoWidth
        h = videoCanvas.height
        w = videoCanvas.width
        lBB = eyeBoundsFromCorners([eyeCorners[0]*w, eyeCorners[1]*h], [eyeCorners[2]*w, eyeCorners[3]*h]);
        rBB = eyeBoundsFromCorners([eyeCorners[6]*w, eyeCorners[7]*h], [eyeCorners[4]*w, eyeCorners[5]*h]);

        // Get face geometry
        faceGeom.update(prediction);

        elem = document.getElementById("videostats")
        if (elem != undefined){
            elem.innerHTML = ("eyebox size: " + Math.round(lBB[4]) + " x " + Math.round(lBB[5]));
        }

//        console.log("facemesh", performance.now()- now);
    }

    drawCache();

    if (!stopFacemesh){
        setTimeout(requestAnimationFrame(renderPrediction), 100); // call self after 100 ms
    }
};

// Draws the current eyes onto the canvas, directly from video streams
async function drawCache(){
        // Draw face onto reduced canvas
        videoCtx.drawImage(video, 0, 0, videoCanvas.width, videoCanvas.height);


        // Get eye images from the video stream directly
        if (typeof(lBB) != 'undefined'){
            ctx.drawImage(video, lBB[0], lBB[2], lBB[4], lBB[5], // Source x,y,w,h
                            0, 0, inx, iny); // Destination x,y,w,h
            ctx.drawImage(video, rBB[0], rBB[2], rBB[4], rBB[5],
                           10 + inx, 0, inx, iny);
        }
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
//    drawCache(continuous);

    // If running continuously, update the curEyes and curCorners vec AS TENSORS, BUT THROW AWAY OLD VALS
    if (continuous){
        if (curEyes.length == 3){
            curEyes[0].dispose();
            curEyes[1].dispose();
            curEyes[2].dispose();
        }

        curEyes = tf.tidy(() => {
                    return [tf.browser.fromPixels(
                        ctx.getImageData(0,0, inx, iny)).reverse(1),
                   tf.browser.fromPixels(
                        ctx.getImageData(10 + inx ,0, inx, iny)),
                   tf.tensor(eyeCorners)]})

    } else{ // If calling once, push the eyes, corners, and screenVals into a vector AS TENSORS
        // Add x vars
        let left = tf.tidy(() => {return tf.browser.fromPixels(
                    ctx.getImageData(0,0, inx, iny)).reverse(1)})
        let right = tf.tidy(() => {return tf.browser.fromPixels(
                    ctx.getImageData(10 + inx ,0, inx, iny))})
        let tmpEyeCorn= tf.tensor(eyeCorners);

        leftEyes_x.push(left);
        rightEyes_x.push(right);
        eyeCorners_x.push(tmpEyeCorn);
        faceGeom_x.push(faceGeom.getGeom());

        // Add y vars
        const nowVals = [X/windowWidth, Y/windowHeight];
        screenXYs_y.push(nowVals);
        // const nowPos = calib_counter-1; // This var is for classification. -1 To start at zero
    }


    if (continuous){
        requestAnimationFrame(() => {eyeSelfie(continuous)});
    }
}

const state = {
        backend: 'webgl',
        maxFaces: 1, // Only one mouse cursor, after all
};



async function collectmain() {
    fmesh = await facemesh.load({maxFaces: state.maxFaces});

    // Set up front-facing camera
    await setupCamera();
    video.play();
    videoWidth = video.videoWidth;
    videoHeight = video.videoHeight;

    // Set up canvas to draw the eyes of the user
    canvas = document.getElementById('eyecache');
    canvas.width = 300;
    canvas.height = 200;
    ctx = canvas.getContext('2d');

    // Set up second canvas to draw the video stream at a reduced size
    videoCanvas = document.createElement("canvas");
    videoCanvas.setAttribute("id", "facecanvas");
    videoCanvas.setAttribute("hidden", "true");
    document.body.appendChild(videoCanvas);

    videoCanvas.width = videoWidth/videoDivisor;
    videoCanvas.height = videoHeight/videoDivisor;
    videoCtx = videoCanvas.getContext('2d')

    // start training loop
//    setTimeout(renderPrediction, 2000);
    renderPrediction();
//    setTimeout(drawCache, 2000);

    console.log("collection color main complete");
}




