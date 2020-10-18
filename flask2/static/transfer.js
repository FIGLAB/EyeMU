// x and y vects
var eyeData = [[],[], []];
var eyeVals = [];
var headTilts =[];
var headSizes = [];
var curLen = 0;


// Resize eyeballs to this size
var inx = 128;
var iny = 128;

// Machine learning things
var eyeModel;
var lr = .001;
var epochNums = 50;
var valsplit = .1;
var batchSize = 100;

// Current prediction
var curPred
var doingClassification = false;
var expose;

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


async function trainNatureModel(left_x, right_x, corn_x, screenxy_y){
    console.log("training started")
    console.log(tf.memory())
    // Compile the model
    naturemodel.compile({
      optimizer: tf.train.adam(0.0042),
      loss: 'meanSquaredError',
      metrics: ['mae', 'mse']
    });



//    await tf.tidy(() => {
        tf.setBackend('webgl');
        leye_tensor = tf.stack(left_x).div(255).sub(0.5)
        reye_tensor = tf.stack(right_x).div(255).sub(0.5)
        eyeCorners_tensor = tf.stack(corn_x)
        y_vect = tf.tensor(screenxy_y, [screenxy_y.length, 2])
        console.log("data massaging done")


        let epochCount = 0;
//        await naturemodel.fit([eyeData[0], eyeData[1], eyeData[2]], y_vect, {
        await naturemodel.fit([leye_tensor, reye_tensor, eyeCorners_tensor], y_vect, {
               epochs: 15,
               batchSize: 10,
               validationSplit: 0.1,
               callbacks: {
          onEpochEnd: async (batch, logs) => {
                  console.log(epochCount++, 'Loss: ' + logs.loss.toFixed(5));
          }
        }
        }).then(info => {
                // Give us the details of the training, and show the user
               console.log('Final accuracy', info.history);
               console.log( info.history['mae']);
               console.log( info.history['val_mae']);
                console.log("boost training done");
                document.getElementById("trainingstate").innerHTML = "calib training done";

                // clean up memory
                console.log(tf.memory())
                leye_tensor.dispose()
                reye_tensor.dispose()
                eyeCorners_tensor.dispose()
                y_vect.dispose()

                left_x.forEach((item, index, arr) =>{
                    left_x[index].dispose();
                    right_x[index].dispose();
                    corn_x[index].dispose();
                })
                console.log(tf.memory())


                // Start the live testing loop
                done_with_training = true;
                curPred = [0.5, 0.5];
                eyeSelfie(true);
                setTimeout(runNaturePredsLive, 100);
                setTimeout(loop, 500);
        });
}

//async function trainModel(){
//    console.log("in transfer, training model");
//
//    if (predictions[0].length == 0){
//        colorEyeData2tensor();
//    }
//
//    dadam = tf.train.adam(lr);
//    if (doingClassification){
//        eyeModel = lastFewLayersClassificationModel()
//        eyeModel.compile({
//          optimizer: dadam,
//          loss: 'categoricalCrossentropy',
//          metrics: ['accuracy']
//        });
//    } else{
//        eyeModel = lastFewLayersModel()
//        eyeModel.compile({
//          optimizer: dadam,
//          loss: 'meanSquaredError',
//          metrics: ['mae', 'mse']
//        });
//    }
//
//    console.log("after model init");
//
//    // x_vect is the left eye pred, right eye pred, head yaw and pitch, and headsize
//    let x_vect = predictions[0]
//    if (x_vect[0].length != 7){
//        x_vect.forEach((item, index, arr) =>{
//            arr[index] = arr[index].concat(predictions[1][index], headTilts[index], headSizes[index])
////            tmp_y.push(eyeVals[index][0])
//        });
//        x_vect = tf.tensor(x_vect, [x_vect.length, 2051])
//    }
//
//    if (doingClassification){
//        y_vect = tf.oneHot(eyePositions, 9);
//    } else{
//        y_vect = tf.tensor(eyeVals, [eyeVals.length, 2]);
//    }
//
//
//    console.log("after data processing");
//    console.log(x_vect.arraySync());
//    console.log(y_vect.arraySync());
//
//
//    await tf.setBackend('wasm');
//
//    console.log("before fit, ", tf.getBackend());
//    epochCount = 0;
//    eyeModel.fit(x_vect, y_vect, {
//        epochs: epochNums,
//        batchSize: batchSize,
//        validationSplit: valsplit,
//        callbacks: {
//      onEpochEnd: async (batch, logs) => {
//          console.log(epochCount++, 'Loss: ' + logs.loss.toFixed(5));
//      }
//    }
//    }).then(info => {
//   console.log('Final accuracy', info.history);
//   console.log( info.history['mae']);
//   console.log( info.history['val_mae']);
//    console.log("boost training done");
//    document.getElementById("trainingstate").innerHTML = "calib training done";
//
//    console.log("after fit, ", tf.getBackend());
//    tf.setBackend('webgl');
//    done_with_training = true;
//
//    x_vect.dispose();
//    y_vect.dispose();
//
//    done_with_training = true;
//    curPred = [0.5, 0.5];
//
//    setTimeout(startLivePrediction, 100);
//    setTimeout(loop, 500);
//
//     });
//
//}

//// Generate mobilenet predictions on our training data
//function runPredsLive(){
//    console.log(tf.memory());
//    tmp1 = [];
//    tmp2 = [];
//    for (i = 0; i < eyeData[0].length; i++){
//        tmp1.push(tf.tidy(() => {return eyeData[0][i].arraySync()}));
//        tmp2.push(tf.tidy(() => {return eyeData[1][i].arraySync()}));
//    }
//
//    const t1 = tf.tensor(tmp1, [eyeData[0].length, inx, iny, 3]);
//    const t2 = tf.tensor(tmp2, [eyeData[1].length, inx, iny, 3]);
//
//    console.log(tf.memory());
//    predictions[0] = tf.tidy(() => {return mobnet.infer(t1, embedding = true).arraySync()});
//    predictions[1] = tf.tidy(() => {return mobnet.infer(t2, embedding = true).arraySync()});
//
//    console.log(tf.memory());
//    t1.dispose();
//    t2.dispose();
//}

async function runNaturePredsLive(){
//    console.log(tf.memory());

    pred = tf.tidy(() => {
        console.log("predicting")
        return naturemodel.predict([curEyes[0].reshape([1, 128, 128, 3]),
                                curEyes[1].reshape([1, 128, 128, 3]),
                                curEyes[2].reshape([1, 8])])
    })
    predictions[0] = pred[0];
    predictions[1] = pred[1];
    curPred = pred.arraySync()[0];
//    pred.print()
//    console.log(tf.memory());

    pred.dispose();
    setTimeout(runNaturePredsLive, 100);
}


//async function startLivePrediction(){
//    if (newFrame){
//        curPred = tf.tidy(() => {
//                temp_x = [].concat(mobnet.infer(curEye[0], embedding = true).arraySync()[0],
//                           mobnet.infer(curEye[1], embedding = true).arraySync()[0],
//                           curHeadTilt,
//                           curHeadSize);
//
//                if (doingClassification){
//                    const outputVec = eyeModel.predict(tf.tensor(temp_x, [1, 2051]));
//                    const ind = outputVec.argMax(1).arraySync()[0];
//                    expose = ind
////                    console.log(ind);
//                    return [nx_arr[ind]/screen.width, ny_arr[ind]/screen.height];
//                } else{
//                    const newPred = eyeModel.predict(tf.tensor(temp_x, [1, 2051])).arraySync()[0];
//
//                    return [curPred[0]+(newPred[0]-curPred[0])*.25,
//                                curPred[1]+(newPred[1]-curPred[1])*.25]
//                }
//            });
//        newFrame = false;
//    }
//        requestAnimationFrame(startLivePrediction);
//}

async function main() {
    await tf.setBackend('webgl');


    // import custom model
    models = [];
    console.log("loading model");
    await loadModel("/static/models/tfjsmodel");
    naturemodel = models[0];
    console.log('Successfully loaded model');
//    naturemodel.summary();

    waitForIt();
//    setTimeout(runNaturePredsLive, 3000);
//    speedCheck();

}

async function speedCheck(){
    var now;
    const n = 1
    fLeft = tf.randomNormal([n, 128,128, 3]);
    fRight = tf.randomNormal([n, 128,128, 3]);
    fEyeCorners = tf.randomNormal([n,8]);


        now = performance.now();
        naturemodel.predict([fLeft,fRight, fEyeCorners]).print();
        console.log(performance.now()-now);
    requestAnimationFrame(speedCheck());

}
