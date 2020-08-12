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


async function trainModel(){
    console.log("in transfer, training model");

    if (predictions[0].length == 0){
        colorEyeData2tensor();
    }

    eyeModel = lastFewLayersClassificationModel()
//    eyeModel = lastFewLayersModel()
    dadam = tf.train.adam(lr);

    eyeModel.compile({
      optimizer: dadam,
//      loss: 'meanSquaredError',
//      metrics: ['mae', 'mse']
      loss: 'categoricalCrossentropy',
      metrics: ['accuracy']
    });
    console.log("after model init");

    // x_vect is the left eye pred, right eye pred, head yaw and pitch, and headsize
    let x_vect = predictions[0]
    if (x_vect[0].length != 7){
        x_vect.forEach((item, index, arr) =>{
            arr[index] = arr[index].concat(predictions[1][index], headTilts[index], headSizes[index])
//            tmp_y.push(eyeVals[index][0])
        });
        x_vect = tf.tensor(x_vect, [x_vect.length, 2051])
    }

//    y_vect = tf.tensor(eyeVals, [eyeVals.length, 2]);
    y_vect = tf.oneHot(eyePositions, 9);

    console.log("after data processing");
    console.log(x_vect.arraySync());
    console.log(y_vect.arraySync());


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
    const t1 = tf.tensor(tmp1, [eyeData[0].length, inx, iny, 3]);
    const t2 = tf.tensor(tmp2, [eyeData[1].length, inx, iny, 3]);

    console.log(tf.memory());
//    predictions[0] = tf.tidy(() => {return mobnet.infer(t1).div(10).arraySync()});
    predictions[0] = tf.tidy(() => {return mobnet.infer(t1, embedding = true).arraySync()});
//    predictions[1] = tf.tidy(() => {return mobnet.infer(t2).div(10).arraySync()});
    predictions[1] = tf.tidy(() => {return mobnet.infer(t2, embedding = true).arraySync()});
    t1.dispose();
    t2.dispose();
}


async function startLivePrediction(){
    if (newFrame){
        curPred = tf.tidy(() => {
                temp_x = [].concat(mobnet.infer(curEye[0], embedding = true).arraySync()[0],
                           mobnet.infer(curEye[1], embedding = true).arraySync()[0],
                           curHeadTilt,
                           curHeadSize);
//                return eyeModel.predict(tf.tensor(temp_x, [1, 2051])).arraySync()[0];
                const outputVec = eyeModel.predict(tf.tensor(temp_x, [1, 2051]));
                const ind = outputVec.argMax(1).arraySync()[0];
                return [nx_arr[ind]/screen.width, ny_arr[ind]/screen.height];
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


