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


function greyscaleImage(imTensor){
    return tf.tidy(() => {
        return imTensor.mean(2).reshape([inx, iny, 1]).tile([1,1,3]);
    });
}

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
//    drawCache();

    // Calculate X vect variables (embeddings, corners, face geom)
    let curGeom = faceGeom.getGeom();
    let curCorners = tf.tensor(eyeCorners);

    let tmpEmbeddings = tf.tidy(() => {
        let tmpleft = tf.browser.fromPixels(
                ctx.getImageData(0,0, inx, iny)).reverse(1)
        let tmpright = tf.browser.fromPixels(
                ctx.getImageData(10 + inx ,0, inx, iny))

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



///////////////////////////////////////////////////////////////////////// regression head training function

// Training the mlweb regression head that takes in the embeddings, eye corners, and face geometry
async function trainNatureRegHead(){
    stopFacemesh = true;

    dataVecs = retrieveRoundsAsArrays()
    // Offer to save the embeddings data  //    saveTensors(x_vect, y_vect);

    // Assemble the data into mlweb's format
    x_vect_as_array = dataVecs[0]
    x_mat = array2mat(x_vect_as_array)
    console.log("x_vect assembled")

    ground_x = array2mat(dataVecs[1])
    ground_y = array2mat(dataVecs[2])
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
}


async function main(){
    // Set up tensorflow backend
    tf.setBackend('webgl');
    await tf.ready();

    // Load in nature model
    models = [];
    console.log("loading model");
    await loadTFJSModel("/static/models/tfjsmodel4");
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


    // Set up the camera and facemesh loop
    collectmain();

    console.log("data collection pipeline started");
}