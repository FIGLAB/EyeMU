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

var now;
// Calls face mesh on the video and outputs the eyes and face bounding boxes to global vars
async function renderPrediction() {
    const facepred = await fmesh.estimateFaces(video);

    if (facepred.length > 0) {
        // If we find a face, proceed with first and only prediction
        prediction = facepred[0];

        // Find the eyeboxes (you could index directly but it wouldn't be that much faster)
        right_eyebox = (prediction.annotations.rightEyeUpper2).concat(prediction.annotations.rightEyeLower2);
        left_eyebox = (prediction.annotations.leftEyeUpper2).concat(prediction.annotations.leftEyeLower2);

        // find bounding boxes [left, right, top, bottom]
        rBB = maxminofXY(right_eyebox);
        lBB = maxminofXY(left_eyebox);

        // find eye corners
//        eyeCorners = getEyeCorners(prediction, videoHeight, videoWidth)

        // Get face geometry
        faceGeom.update(prediction);
        document.getElementById('RPY').innerHTML = "Roll: " + faceGeom.curRoll
                                                      + "<br>Pitch: " + faceGeom.curPitch
                                                      + "<br>Yaw: " + faceGeom.curYaw;

    }

    setTimeout(requestAnimationFrame(renderPrediction), 100); // call self after 100 ms
};

// Draws the current eyes onto the canvas, directly from video streams
async function drawCache(){
        // Get eye images from the video stream directly
//        ctx.drawImage(video, lBB[0], lBB[2], lBB[4], lBB[5], // Source x,y,w,h
//                        0, 0, inx, iny); // Destination x,y,w,h
//        ctx.drawImage(video, rBB[0], rBB[2], rBB[4], rBB[5],
//                       10 + inx, 0, inx, iny);
    ctx.drawImage(video, 10, 10, canvas.width, canvas.height)

    requestAnimationFrame(drawCache);
}

function saveCurrentCanvas(){
    var img = new Image();
    img.src = canvas.toDataURL();
    document.body.appendChild(img);

    console.log("roll: ", faceGeom.curRoll)
    console.log("pitch: ", faceGeom.curPitch)
    console.log("yaw: ", faceGeom.curYaw)
}


async function main() {
    await tf.setBackend('webgl')
    fmesh = await facemesh.load({maxFaces: 1});

    // Set up front-facing camera
    await setupCamera();
    video.play();
    videoWidth = video.videoWidth;
    videoHeight = video.videoHeight;

    // Set up canvas to draw the eyes of the user (debugging feature)
    canvas = document.getElementById('eyecache');
    canvas.width = videoWidth;
    canvas.height = videoHeight;
    ctx = canvas.getContext('2d');

    // start training loop
    renderPrediction();
    drawCache()
}

