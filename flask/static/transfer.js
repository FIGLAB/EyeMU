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

function trainModel(){
    console.log("in transfer");

    if (predictions[0].length == 0){
        colorEyeData2tensor();
    }
    eyeModel = lastFewLayersModel();

    // Display the learning rate and set the optimizer
    console.log(lr);
    dadam = tf.train.adam(lr);

    eyeModel.compile({
      optimizer: dadam,
      loss: 'meanSquaredError',
      metrics: ['mae', 'mse']
    });

    // x_vect is the left eye pred, right eye pred, head yaw and pitch, and headsize
    x_vect = predictions[0]
    if (x_vect[0].length != 7){
        x_vect.forEach((item, index, arr) =>{
            arr[index] = arr[index].concat(predictions[1][index], headTilts[index], headSizes[index])
        });
        x_vect = tf.tensor(x_vect, [x_vect.length, 2003])
    }

    y_vect = tf.tensor(eyeVals, [eyeVals.length, 2]);

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
    document.getElementById("trainingstate").innerHTML = "boost training done";
     });

    console.log(x_vect)
}






async function main() {
    await tf.setBackend('webgl');

    // Load mobilenet
    net = await mobilenet.load();
    console.log('Successfully loaded model');

    waitForIt();
}


