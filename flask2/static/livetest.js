// Prediction vars
var rBB, lBB;
var prediction; // Face mesh predict() output
var output;

// Live vars
var curHeadSize;
var curHeadTilt;

//SVR vars
var svm_x;
var svm_y;


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
                                curEyes[2].reshape([1, 8]),
                                tf.tensor(faceGeom.getGeom()).reshape([1,4])])
//                                curEyes[2].reshape([1, 8])])
    })
    pred = pred.clipByValue(0.0, 1.0)
//    pred.print()

    predictions[0] = pred[0];
    predictions[1] = pred[1];
    curPred = pred.arraySync()[0];

    pred.dispose();
    setTimeout(runNaturePredsLive, 100);
}


async function main() {
    tf.setBackend('webgl');
    await tf.ready();
    collectmain();

    // import custom model
    models = [];
    console.log("loading model");
//    await loadTFJSModel("/static/models/tfjsmodel2");
    await loadTFJSModel("/static/models/tfjsmodel3");
    naturemodel = models[0];
    console.log('Successfully loaded model');

    // Resize the regression/classification toggle to look nice
    document.getElementById('regtoggle').style.width = windowWidth + "px"

    // start in the eval loop
    done_with_training = true;
    curPred = [0,0];
//    renderPrediction();
    setTimeout(function(){
            eyeSelfie(true);
        }, 2000);

    setTimeout(runNaturePredsLive, 3000);
}


