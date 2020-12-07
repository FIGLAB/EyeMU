// Resize eyeballs to this size
var inx = 128;
var iny = 128;

// Prediction vars
var rBB, lBB;
var prediction; // Face mesh predict() output
var output;

// Embeddings and other features
var curEyes = []
var natureModelEmbeddings;
var faceGeom;

//SVR vars
var svr_x;
var svr_y;

// Window stuff
var windowWidth = window.innerWidth;
var windowHeight = window.innerHeight;

// Show HTML prediction dot or p5js
var showPredictDot = true;


//Draw the prediction as an orange dot on the screen.
async function drawPrediction(predictedXY) {
    // Remove all existing predicdots
    const predicdots = document.getElementsByClassName('predicdot');
    if (predicdots.length > 0){
        predicdots[0].parentNode.removeChild(predicdots[0]);
    };

    // and regions
    const regions = document.getElementsByClassName('onscreenregion');
    if (regions.length > 0){
        regions[0].parentNode.removeChild(regions[0]);
    };

    //Generate prediction dot
    predX = Math.floor(predictedXY[0]*100);
    predY = Math.floor(predictedXY[1]*100);

    predX = Math.min(Math.max(predX, 0), 100);
    predY = Math.min(Math.max(predY, 0), 100);

    elem = document.createElement("div");
    elem.setAttribute("class", "predicdot");

    if (regression){
        elem.setAttribute("style", "left:"+ predX +"%;top:"+ predY +"%;");
    } else{
        // Dividing regions, by percentage
        let x_bounds = [25, 75];
        let y_bounds = [25, 75];

         // Classification, 3x3
         col_left = predX <= x_bounds[0];
         col_right = predX >= x_bounds[1];
         whichCol_Xcoord = col_left ? 5 : (col_right ? 95 : 50)

         row_top = predY <= y_bounds[0];
         row_bot = predY >= y_bounds[1];
         whichRow_Ycoord = row_top ? 5 : (row_bot ? 95 : 50);

        // Set dot and highlighted region lightup
        elem.setAttribute("style", "left:"+ whichCol_Xcoord +"%;top:"+ whichRow_Ycoord +"%;");

//        console.log("creating region")
        reg = document.createElement("div");
        reg.setAttribute("class", "onscreenregion");
        reg.setAttribute("style", "left:" + (col_left ? 0 : (col_right ? x_bounds[1] : x_bounds[0])) + "%;"
                               + " right:" + (col_left ? x_bounds[1] : (col_right ? 0 : x_bounds[0])) + "%;"

                               + " top:" + (row_top ? 0 : (row_bot ? y_bounds[1] : y_bounds[0])) + "%;"
                               + " bottom:" + (row_top ? y_bounds[1] : (row_bot ? 0 : y_bounds[0])) + "%;");
    }


    if (showPredictDot){
        document.body.appendChild(elem);
        if (!regression){
            document.body.appendChild(reg);
        }
    }
};

// For greying out images
function greyscaleImage(imTensor){
    return tf.tidy(() => {
        return imTensor.mean(2).reshape([inx, iny, 1]).tile([1,1,3]);
    });
}

async function runSVRlive(){
    if (curEyes[0] == undefined && !stopFacemesh){
        console.log("curEyes undefined while running prediction, trying again")
        setTimeout(runSVRlive, 500);
        return
    }

    pred = tf.tidy(() => {
                let curGeom = tf.tensor(faceGeom.getGeom()).reshape([1,4]);
                 // EXPERIMENT: Trying to greyscale images to increase accuracy
//                leye = greyscaleImage(curEyes[0])
//                reye = greyscaleImage(curEyes[1])
//                let embed = natureModelEmbeddings.predict([leye.div(255).sub(0.5).reshape([1, 128, 128, 3]), reye.div(255).sub(0.5).reshape([1, 128, 128, 3]), curEyes[2].reshape([1, 8]), curGeom]);
                let embed = natureModelEmbeddings.predict([curEyes[0].div(256).sub(0.5).reshape([1, 128, 128, 3]), curEyes[1].div(256).sub(0.5).reshape([1, 128, 128, 3]), curEyes[2].reshape([1, 8]), curGeom]);
                embed[0] = embed[0].div(100);
                embed[1] = embed[1].div(10);
                embed = tf.concat(embed, 1);

                allFeatures = tf.concat([embed, curEyes[2].reshape([1,8]), curGeom], 1);
                allFeatures_mat = array2mat(allFeatures.arraySync());
                return [svr_x.predict(allFeatures_mat), svr_y.predict(allFeatures_mat)]
            })

    let a = 0.5;
    curPred[0] = curPred[0]*(1-a) + pred[0]*a;
    curPred[1] = curPred[1]*(1-a) + pred[1]*a;

    curPred[0] = Math.max(0.05, Math.min(.95, curPred[0]))
    curPred[1] = Math.max(0.05, Math.min(.95, curPred[1]))

    drawPrediction(curPred)

    setTimeout(runSVRlive, 100);
}

var w_op = [100/10, 100/2, 9*100/10];
var h_op = [100/10, 100/2, 9*100/10];
var nx_arr = [w_op[1], w_op[2], w_op[0], w_op[2], w_op[1], w_op[0], w_op[1], w_op[0], w_op[2], w_op[2]]
var ny_arr = [h_op[0], h_op[2], h_op[1], h_op[0], h_op[1], h_op[2], h_op[2], h_op[0], h_op[1], h_op[1]];
var targetNum = 0;
var targetTimerLen = 10;
var targetTimerCount = 0;
async function drawTargetDot(){
    // Remove old target dots
    const targs = document.getElementsByClassName('targetdot');
    while (targs.length > 0){
        targs[0].parentNode.removeChild(targs[0]);
    };

    // Create a new one
    targDot = document.createElement("div");
    targDot.setAttribute("class", "targetdot");
    document.body.appendChild(targDot);

    // Set its location and add it to the body
    if (showPredictDot){
        targDot.setAttribute("style", "left:" + nx_arr[targetNum] +"%; top:" + ny_arr[targetNum] + "%;");
    } else{
        targDot.setAttribute("style", "left:" + "-10" +"%; top:" + "-10" + "%;");
    }

    // update target number if enough time has passed. This is to make the target dot reactive
    targetTimerCount += 1;
    let nextTargetNum;
    if (targetTimerCount % targetTimerLen == 0){
        nextTargetNum = (targetNum + 1) % ny_arr.length;
    } else{
        nextTargetNum = targetNum % ny_arr.length;
    }
    targetNum = nextTargetNum;


    // Call self again after delay
    setTimeout(drawTargetDot, 500);
}

// Draw regression button
var regression = false;
function regr_class_toggle() {
    var x = document.getElementById("regtoggle");
    if (x.innerHTML === "<h4>Regression</h4>") {
        x.innerHTML = "<h4>Classification</h4>";
        x.style.background = "#2196F3";
        regression = false;
    } else {
        x.innerHTML = "<h4>Regression</h4>";
        x.style.background = "#ccc";
        regression = true;
    }
}



async function main() {
    tf.setBackend('webgl');
    await tf.ready();

    await collectmain();

    // import custom model
    models = [];
    console.log("loading model");
//    await loadTFJSModel("/static/models/tfjsmodel2");
    await loadTFJSModel("/static/models/tfjsmodel4");
    naturemodel = models[0];
    console.log('Successfully loaded model');
    // Set up embeddings output
//    natureModelEmbeddings = tf.model({inputs: naturemodel.inputs,
//            outputs: [naturemodel.layers[29].output, naturemodel.layers[33].output, naturemodel.layers[36].output]});
    natureModelEmbeddings = tf.model({
        inputs: naturemodel.inputs,
        outputs: [naturemodel.layers[39].output, naturemodel.layers[43].output, naturemodel.layers[46].output]
    });

    // Load in SVR
    svr_x_str = localStorage.getItem("svr_x");
    svr_x = renewObject(JSON.parse(svr_x_str));

    svr_y_str = localStorage.getItem("svr_y");
    svr_y = renewObject(JSON.parse(svr_y_str));

    // Resize the regression/classification toggle to look nice
    const regtoggle = document.getElementById('regtoggle');
    if (regtoggle != undefined){
        regtoggle.style.width = windowWidth + "px"
    }

    // start the live loop
    done_with_training = true;
    curPred = [-1, -1];
    curPred2 = [-1, -1];
//    renderPrediction();
    setTimeout(function(){
            eyeSelfie(true);
        }, 2000);

    setTimeout(runSVRlive, 3000);

    drawTargetDot()

    console.log("regression loading done");
}

