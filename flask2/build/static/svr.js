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

//Draw the prediction as an orange dot on the screen.
async function drawPrediction(predictedXY) {
    // Remove all existing predicdots
    const predicdots = document.getElementsByClassName('predicdot');
    if (predicdots.length > 0){
        predicdots[0].parentNode.removeChild(predicdots[0]);
    };

    //Generate prediction dot
    predX = Math.floor(predictedXY[0]*100);
    predY = Math.floor(predictedXY[1]*100);

    predX = Math.min(Math.max(predX, 0), 100);
    predY = Math.min(Math.max(predY, 0), 100);

    elem=document.createElement("div");
    elem.setAttribute("class", "predicdot");

    // Regression
    if (regression){
        elem.setAttribute("style", "left:"+ predX +"%;top:"+ predY +"%;");
    } else{
         // Classification, 3x3
         col_left = predX <= 33;
         col_right = predX >= 67;
         whichCol_Xcoord = col_left ? 5 : (col_right ? 95 : 50)

         row_top = predY <= 33;
         row_bot = predY >= 67;
         whichRow_Ycoord = row_top ? 5 : (row_bot ? 95 : 50);

        elem.setAttribute("style", "left:"+ whichCol_Xcoord +"%;top:"+ whichRow_Ycoord +"%;");
    }

    document.body.appendChild(elem);
};

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


async function runSVRlive(){
    if (curEyes[0] == undefined){
        console.log("curEyes undefined while running prediction, trying again")
        setTimeout(runSVRlive, 500);
        return
    }

    now = performance.now();
    pred = tf.tidy(() => {
                let curGeom = tf.tensor(faceGeom.getGeom()).reshape([1,4]);
                let embed = natureModelEmbeddings.predict([curEyes[0].div(255).sub(0.5).reshape([1, 128, 128, 3]), curEyes[1].div(255).sub(0.5).reshape([1, 128, 128, 3]), curEyes[2].reshape([1, 8]), curGeom]);
                embed[0] = embed[0].div(100);
                embed[1] = embed[1].div(10);
                embed = tf.concat(embed, 1);

                allFeatures = tf.concat([embed, curEyes[2].reshape([1,8]), curGeom], 1);
                allFeatures_mat = array2mat(allFeatures.arraySync());
                return [svr_x.predict(allFeatures_mat), svr_y.predict(allFeatures_mat)]
            })
//    console.log(pred)

    predictions[0] = pred[0];
    predictions[1] = pred[1];
    curPred = pred;

    drawPrediction(curPred)
//    console.log(curPred)

    setTimeout(runSVRlive, 100);
}

var w_op = [100/10, 100/2, 9*100/10];
var h_op = [100/10, 100/2, 9*100/10];
var nx_arr = [w_op[1], w_op[2], w_op[0], w_op[2], w_op[1], w_op[0], w_op[1], w_op[0], w_op[2], w_op[2]]
var ny_arr = [h_op[0], h_op[2], h_op[1], h_op[0], h_op[1], h_op[2], h_op[2], h_op[0], h_op[1], h_op[1]];
var targetNum = 0;
async function drawTargetDot(){
    const dot = document.getElementsByClassName('targetdot')[0];
//    dot.setAttribute("style", "left:"+ predX +"%;top:"+ predY +"%;");
    const nextTargetNum = (targetNum + 1) % ny_arr.length;

    dot.setAttribute("style", "left:" + nx_arr[targetNum] +"%; top:" + ny_arr[targetNum] + "%;");

    // Call self again after delay
    targetNum = nextTargetNum;
    setTimeout(drawTargetDot, 5000);
}

// Draw regression button
var regression = true;
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



//var thirdParty = {};
//protoQueryMooJo.apply(thirdParty);


async function main() {
    tf.setBackend('webgl');
    await tf.ready();

    // import custom model
    models = [];
    console.log("loading model");
//    await loadTFJSModel("/static/models/tfjsmodel2");
    await loadTFJSModel("/static/models/tfjsmodel3");
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

    // Load in face mesh model
    fmesh = await facemesh.load({maxFaces: state.maxFaces});

    // Set up camera
    await setupCamera();
    video.play();
    videoWidth = video.videoWidth;
    videoHeight = video.videoHeight;

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

    setTimeout(runSVRlive, 3000);
    drawTargetDot()
}