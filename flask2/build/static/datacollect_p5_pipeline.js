//face mesh vars
var stopFacemesh = false;
    // eye image drawing zone
var ctx;
var canvas;
    // eye bounding boxes
var rBB;
var lBB;

// regression head training vars
var inx = 128;
var iny = 128;
var natureModelEmbeddings;

// x and y vects for collecting data for training
var embeddings_x = [];
var eyeCorners_x = [];
var faceGeom;
var faceGeom_x = [];

var screenXYs_y = [];

///////////////////////////////////////////////////////////////////////// Face Geometry functions

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


///////////////////////////////////////////////////////////////////////// face mesh functions
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
    return tmp
//    return [left, right, top, bottom, width, height]
}

// Calls face mesh on the video and outputs the eyes and face bounding boxes to global vars
async function renderPrediction() {
    const facepred = await fmesh.estimateFaces(video);

    if (facepred.length > 0) {
        // If we find a face, proceed with first and only prediction
        prediction = facepred[0];

        // Find the eyeboxes (you could index directly but it wouldn't be that much faster)
//        right_eyebox = (prediction.annotations.rightEyeUpper2).concat(prediction.annotations.rightEyeLower2);
//        left_eyebox = (prediction.annotations.leftEyeUpper2).concat(prediction.annotations.leftEyeLower2);

        // find bounding boxes [left, right, top, bottom]
//        rBB = maxminofXY(right_eyebox);
//        lBB = maxminofXY(left_eyebox);

        // find eye corners
        eyeCorners = getEyeCorners(prediction, videoHeight, videoWidth)

        // Get eye bounding boxes from eye corners
        h = videoHeight
        w = videoWidth
        lBB = eyeBoundsFromCorners([eyeCorners[0]*w, eyeCorners[1]*h], [eyeCorners[2]*w, eyeCorners[3]*h]);
        rBB = eyeBoundsFromCorners([eyeCorners[6]*w, eyeCorners[7]*h], [eyeCorners[4]*w, eyeCorners[5]*h]);

        // Get face geometry
        faceGeom.update(prediction);
    }

    if (!stopFacemesh){
//        setTimeout(requestAnimationFrame(renderPrediction), 100); // call self after 100 ms
    requestAnimationFrame(renderPrediction)
    }
};

function greyscaleImage(imTensor){
    return tf.tidy(() => {
        return imTensor.mean(2).reshape([inx, iny, 1]).tile([1,1,3]);
    });
}

//function greyscaleEyes(){
//    leftEyes_x.forEach((elem, ind) => {
//        tmp = elem.mean(2).reshape([inx, iny, 1]).tile([1,1,3]);
//        leftEyes_x[ind] = tmp
//    });
//
//    rightEyes_x.forEach((elem, ind) => {
//        tmp = elem.mean(2).reshape([inx, iny, 1]).tile([1,1,3]);
//        rightEyes_x[ind] = tmp
//    });
//    console.log("grescaling complete");
//

function gammaChangeIm(im, gamma){
    return tf.tidy(() => im.div(255).pow(1/gamma).mul(255));
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
    ctx.drawImage(video, lBB[0], lBB[2], lBB[4], lBB[5], // Source x,y,w,h
                        0, 0, inx, iny); // Destination x,y,w,h
    ctx.drawImage(video, rBB[0], rBB[2], rBB[4], rBB[5],
                       10 + inx, 0, inx, iny);


    // Experiment: add 3 sets of data: leftEyes_x.push(tf.tidy(() => leftEyes_x[i].div(255).pow(1.2).mul(255)));

    // Calculate X vect variables (embeddings, corners, face geom)
    let curGeom = faceGeom.getGeom();
    let curCorners = tf.tensor(eyeCorners);

    let tmpEmbeddings = tf.tidy(() => {
        let tmpleft = tf.browser.fromPixels(
                ctx.getImageData(0,0, inx, iny)).reverse(1)
        let tmpright = tf.browser.fromPixels(
                ctx.getImageData(10 + inx ,0, inx, iny))

        // EXPERIMENT: trying greyscale embeddings to see if they'll make  it more robust to lighting.
//        tmpleft = greyscaleImage(tmpleft)
//        tmpright = greyscaleImage(tmpright)

        return natureModelEmbeddings.predict([tmpleft.div(255).sub(0.5).reshape([1, inx, iny, 3]),
                                              tmpright.div(255).sub(0.5).reshape([1, inx, iny, 3]),
                                              curCorners.reshape([1,8]),
                                              tf.tensor(curGeom).reshape([1,4])])
    });

    // Add X vars to the accumulation arrays
    embeddings_x.push(tmpEmbeddings)
    eyeCorners_x.push(curCorners);
    faceGeom_x.push(curGeom);

    // Calculate and accumulate y vars
    const nowVals = [X/windowWidth, Y/windowHeight];
    screenXYs_y.push(nowVals);
}


///////////////////////////////////////////////////////////////////////// Saving data vectors

var textFile = null;
// Create a text file out of text
function makeTextFile(text) {
        var data = new Blob([text], {type: 'application/json'});

        // If we are replacing a previously generated file we need to
        // manually revoke the object URL to avoid memory leaks.
        if (textFile !== null) { window.URL.revokeObjectURL(textFile);}

        textFile = window.URL.createObjectURL(data);

        // returns a URL you can use as a href
        return textFile;
};

function saveTensors(x_vector, y_vector){
    x_vect_as_array = x_vector.arraySync();
    y_vect_as_array = y_vector.arraySync();
    combined = JSON.stringify([x_vect_as_array, y_vect_as_array])

    var link = document.createElement('a');
    link.href = makeTextFile(combined);
    link.target = '_blank';
    link.download = "gazelEmbedsData.json";
    link.click();
}

///////////////////////////////////////////////////////////////////////// regression head training function

// Training the mlweb regression head that takes in the embeddings, eye corners, and face geometry
async function trainNatureRegHead(){
    stopFacemesh = true;

    x_vect = await tf.tidy(() => {
            // TODO: Check if new model's embeddings need to be regularized at all
            // First embeds, range up to 300
            // 2nd embeds, range up to 50~
            embeds0 = tf.concat(embeddings_x.map(x => x[0])).div(100)
            embeds1 = tf.concat(embeddings_x.map(x => x[1])).div(10)
            embeds2 = tf.concat(embeddings_x.map(x => x[2]))

            // Combine the embeddings horizontally, turn 8,4,2 into 14
            embeds = tf.concat([embeds0, embeds1, embeds2], 1);
            return tf.concat([embeds, tf.stack(eyeCorners_x), tf.stack(faceGeom_x)],1);
    });

    console.log("embeddings extracted, x_vect shape: ", x_vect.shape)
    y_vect = tf.tensor(screenXYs_y, [screenXYs_y.length, 2])

    saveTensors(x_vect, y_vect);

    // Assemble the data into mlweb's format
    x_mat = array2mat(x_vect_as_array)
    console.log("x_vect assembled")

    tmp = y_vect.split(2, 1)
    ground_x = tmp[0]
    ground_y = tmp[1]

    ground_x = array2mat(ground_x.arraySync())
    ground_y = array2mat(ground_y.arraySync())
    console.log("y_vects assembled")

    // Model init and training
    svr_x = newModel();
    svr_x.train(x_mat, ground_x);

    svr_y = newModel();
    svr_y.train(x_mat, ground_y);
    console.log("x and y regression are trained")

    // Save model into localstorage
    exportWEBML()
    console.log("x and y regression are exported")

    // Restart the p5js canvas just to show that the training is done.
    loop();
}


async function main(){
    // Set up tensorflow backend
    tf.setBackend('webgl');
    await tf.ready();

    // Load in nature model
    models = [];
    console.log("loading model");
    await loadTFJSModel("/static/models/tfjsmodel3");
    naturemodel = models[0];
    console.log('Successfully loaded model');

    numLayers = naturemodel.layers.length-1
    for (let i = 0; i <= numLayers; i++){ // print layers and names for getting embeddings
        console.log(i, naturemodel.layers[i].name)
    }

    // Freeze the model's layers
    for (let i = 0; i <= numLayers; i++){
        naturemodel.layers[i].trainable = false;
    }

    // Create copy of model that outputs embeddings from the last three dense layers
    natureModelEmbeddings = tf.model({
        inputs: naturemodel.inputs,
        outputs: [naturemodel.layers[39].output, naturemodel.layers[43].output, naturemodel.layers[46].output]
    }); // outputs an 8 vec, 4 vec, and 2 vec. Operates at the same speed as only one output.


    // Load in facemesh model
    fmesh = await facemesh.load({maxFaces: 1});

    // Set up front-facing camera
    await setupCamera();
    video.play();
    videoWidth = video.videoWidth;
    videoHeight = video.videoHeight;

    // Set up canvas to draw the eyes of the user (debugging feature)
    canvas = document.getElementById('eyecache');
    canvas.width = 300;
    canvas.height = 200;
    ctx = canvas.getContext('2d');

    // Start the facemesh real-time looping
    renderPrediction();

    console.log("data collection pipeline set up");
}