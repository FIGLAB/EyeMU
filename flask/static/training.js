// x and y vects
var eyeData = [[],[]];
var eyeVals = [];
var headTilts =[];
var headSizes = [];
var curLen = 0;

// Resize eyeballs to this size
var inx = 50;
var iny = 25;

// Machine learning things
var eyeModel;
var lr = .001;
var epochNums = 50;
var valsplit = .1;
var batchSizeVar = 500;

const state = {
    backend: 'webgl',
    maxFaces: 1, // Only one mouse, after all
};

function waitForIt(){
    if (document.body){
        main();
    } else {
        document.addEventListener("DOMContentLoaded", function(event) {
           console.log("DOM fully loaded and parsed");
           main();
        });
    }
}

async function trainModel(){
    console.log("training model");
    document.getElementById("trainingstate").innerHTML = "training...";

    // Init model
    eyeModel = makeModel();

    // Display the learning rate and set the optimizer
    console.log(lr);
    dadam = tf.train.adam(lr);

    // Compile the model
    eyeModel.compile({
      optimizer: dadam,
      loss: 'meanSquaredError',
      metrics: ['mae', 'mse']
    });

    // construct x_vect as the left eye ims and y_vect as the screen coordinates
    aa = tf.tensor(eyeData[0], [eyeData[0].length, iny, inx, 1]);
//    aa = tf.tensor(eyeData[1], [eyeData[1].length, iny, inx, 1]);
    bb = tf.tensor(eyeVals, [eyeVals.length, 2]);
    epochCount = 0;

    eyeModel.fit(aa, bb, {
       epochs: epochNums,
       batchSize: batchSizeVar,
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
    console.log("training done");
    document.getElementById("trainingstate").innerHTML = "training done";
     });
}

async function testModel(){
    const prediction = eyeModel.predict(tf.tensor(eyeData[0][eyeData[0].length-1], [1, iny, inx, 1]));
    prediction.print();
    document.getElementById("prediction").innerHTML = tf.mul(prediction,100).arraySync();
    myEyesAreUpHere(prediction)
}


async function main() {
//    await tf.setBackend(state.backend);
    await tf.setBackend(state.backend);
    while (tf.getBackend().localeCompare(state.backend) != 0){
        await tf.setBackend(state.backend);
        console.log('setting backend')
    }

    // Load in left and right model and store in models variable
    loadModel("/static/models/lefteye")
    loadModel("/static/models/righteye")
}


