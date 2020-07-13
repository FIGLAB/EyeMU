// x and y vects
var eyeData = [[],[]];
var eyeVals = [];
var headTilts =[];
var curLen = 0;

// Resize eyeballs to this size
var inx = 50;
var iny = 25;

// Machine learning things
var eyeModel;
var lr = .001;
var epochNums = 50;
var valsplit = .1;


//async function trainModel(){
//    console.log("training model");
//    document.getElementById("trainingstate").innerHTML = "training...";
//
//    // Init model
//    eyeModel = makeModel();
//
//    // Display the learning rate and set the optimizer
//    console.log(lr);
//    dadam = tf.train.adam(lr);
//
//    // Compile the model
//    eyeModel.compile({
//      optimizer: dadam,
//      loss: 'meanSquaredError',
//      metrics: ['mae', 'mse']
//    });
//
//    // construct x_vect as the left eye ims and y_vect as the screen coordinates
//    aa = tf.tensor(eyeData[0], [eyeData[0].length, iny, inx, 1])
//    bb = tf.tensor(eyeVals, [eyeVals.length, 2])
//
//    eyeModel.fit(aa, bb, {
//       epochs: epochNums,
//       batchSize: 100,
//       validationSplit: valsplit,
//       callbacks: {
//      onEpochEnd: async (batch, logs) => {
//        console.log('Loss: ' + logs.loss.toFixed(5));
//      }
//    }
//    }).then(info => {
//   console.log('Final accuracy', info.history);
//   console.log( info.history['mae']);
//   console.log( info.history['val_mae']);
//    console.log("training done");
//    document.getElementById("trainingstate").innerHTML = "training done";
//     });
//}

//async function testModel(){
//    const prediction = eyeModel.predict(tf.tensor(eyeData[0][eyeData[0].length-1], [1, iny, inx, 1]));
//    prediction.print();
//    document.getElementById("prediction").innerHTML = tf.mul(prediction,100).arraySync();
//    myEyesAreUpHere(prediction)
//}

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



async function main() {
    await tf.setBackend('wasm');

    // Load mobilenet
    net = await mobilenet.load();
    console.log('Successfully loaded model');

    // Make a prediction through the model on our image.
    const imgEl = document.getElementById('img');
    const result = await net.classify(imgEl);
    console.log(result);
}


