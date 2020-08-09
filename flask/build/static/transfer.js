// x and y vects
var eyeData = [[],[]];
var eyeVals = [];
var headTilts =[];
var headSizes = [];
var curLen = 0;


// Resize eyeballs to this size
var inx = 50;
var iny = 50;

// Machine learning things
var eyeModel;
var lr = .001;
var epochNums = 50;
var valsplit = .1;
var batchSize = 100;

// Current prediction
var curPred

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

//async function trainModel(){
//    console.log("in transfer, training model");
//    await tf.setBackend('webgl');
//
//    if (predictions[0].length == 0){
//        colorEyeData2tensor();
//    }
//    eyeModel = lastFewLayersModel();
//
//    // Display the learning rate and set the optimizer
//    console.log(lr);
//    dadam = tf.train.adam(lr);
//
//    eyeModel.compile({
//      optimizer: dadam,
//      loss: 'meanSquaredError',
//      metrics: ['mae', 'mse']
//    });
//
//    // x_vect is the left eye pred, right eye pred, head yaw and pitch, and headsize
//    x_vect = predictions[0]
//    if (x_vect[0].length != 7){
//        x_vect.forEach((item, index, arr) =>{
//            arr[index] = arr[index].concat(predictions[1][index], headTilts[index], headSizes[index])
//        });
//        x_vect = tf.tensor(x_vect, [x_vect.length, 2003])
//    }
//
//    y_vect = tf.tensor(eyeVals, [eyeVals.length, 2]);
//
//    epochCount = 0;
//
//    eyeModel.fit(x_vect, y_vect, {
//       epochs: epochNums,
//       batchSize: batchSize,
//       validationSplit: valsplit,
//       callbacks: {
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
//    console.log("after fit, ", tf.getBackend())
//    done_with_training = true;
//
//    x_vect.dispose();
//    y_vect.dispose();
//
//    startLivePrediction();
//    loop();
//
//     });
//
//}


async function trainModel(){
    console.log("in transfer, training model");

    if (predictions[0].length == 0){
        colorEyeData2tensor();
    }

//    eyeModel = regressionModel()
    eyeModel = lastFewLayersModel()
    dadam = tf.train.adam(lr);

    eyeModel.compile({
      optimizer: dadam,
      loss: 'meanSquaredError',
      metrics: ['mae', 'mse']
    });
    console.log("after model init");

    // x_vect is the left eye pred, right eye pred, head yaw and pitch, and headsize
//    let tmp_y = []
    let x_vect = predictions[0]
    if (x_vect[0].length != 7){
        x_vect.forEach((item, index, arr) =>{
            arr[index] = arr[index].concat(predictions[1][index], headTilts[index], headSizes[index])
//            tmp_y.push(eyeVals[index][0])
        });
        x_vect = tf.tensor(x_vect, [x_vect.length, 2003])
    }

//    y_vect = tf.tensor(tmp_y, [tmp_y.length, 1]);
    y_vect = tf.tensor(eyeVals, [eyeVals.length, 2]);
    console.log("after data processing");


    await tf.setBackend('wasm');

    console.log("before fit, ", tf.getBackend());
    epochCount = 0;
    eyeModel.fit(x_vect, y_vect, {
        epochs: epochNums,
        batchSize: batchSize,
        validationSplit: valsplit,
        callbacks: {
      onEpochEnd: async (batch, logs) => {
          console.log(epochCount++, 'Loss: ' + logs.loss.toFixed(5));
      }
    }
    }).then(info => {
   console.log('Final accuracy', info.history);
   console.log( info.history['mae']);
   console.log( info.history['val_mae']);
    console.log("boost training done");
    document.getElementById("trainingstate").innerHTML = "calib training done";

    console.log("after fit, ", tf.getBackend());
    tf.setBackend('webgl');
    done_with_training = true;

    x_vect.dispose();
    y_vect.dispose();

    done_with_training = true;
    curPred = [0.5, 0.5];

    setTimeout(startLivePrediction, 100);
    setTimeout(loop, 500);

     });

//    await tf.setBackend('webgl');
//    x_vect.dispose();
//    y_vect.dispose();

//    x_vect.forEach((item, index, arr) =>{
//        x_vect[index][2003] = eyeVals[index][1];
//    });
//    console.log("after data processing 2");
//    eyeModel2.fit(x_vect);
//    console.log("after model 2 fit");


//    done_with_training = true;
//    curPred = [0.5, 0.5]
//    setTimeout(startLivePrediction, 100);
//    setTimeout(loop, 500);

}

// Generate mobilenet predictions on our training data
function runPredsLive(){
    console.log(tf.memory());
    tmp1 = [];
    tmp2 = [];
    for (i = 0; i < eyeData[0].length; i++){
        tmp1.push(tf.tidy(() => {return eyeData[0][i].arraySync()}));
        tmp2.push(tf.tidy(() => {return eyeData[1][i].arraySync()}));
    }

    console.log(tf.memory());
    const t1 = tf.tensor(tmp1, [eyeData[0].length, inx, iny, 3])
    const t2 = tf.tensor(tmp2, [eyeData[1].length, inx, iny, 3])

    console.log(tf.memory());
    predictions[0] = tf.tidy(() => {return mobnet.infer(t1).div(10).arraySync()});
    predictions[1] = tf.tidy(() => {return mobnet.infer(t2).div(10).arraySync()});
    t1.dispose();
    t2.dispose();
}


async function startLivePrediction(){
    if (newFrame){
        curPred = tf.tidy(() => {
                temp_x = [].concat(mobnet.infer(curEye[0]).div(10).arraySync()[0],
                           mobnet.infer(curEye[1]).div(10).arraySync()[0],
                           curHeadTilt,
                           curHeadSize);
//                return [eyeModel.predict(tf.tensor(temp_x, [1, 2003])).arraySync()[0],.5];
                return eyeModel.predict(tf.tensor(temp_x, [1, 2003])).arraySync()[0];
//                tmp = [eyeModel.transform(temp_x),eyeModel2.transform(temp_x)];
//                return tmp
            });
        newFrame = false;
    }
        requestAnimationFrame(startLivePrediction);
}

async function main() {
    await tf.setBackend('wasm');
    await tf.ready();

    // Load mobilenet
    mobnet = await mobilenet.load();
    console.log('Successfully loaded model');

    waitForIt();
}


