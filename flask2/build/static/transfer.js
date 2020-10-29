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

//function* x_generator(lefts, rights, corners){
//    const genBatchSize = 3;
//    for (let i = 0; i < (Math.trunc(lefts.length/genBatchSize) - 1); i++){
//        yield tf.tidy(() => [tf.stack(lefts.slice(i*genBatchSize, (i+1)*genBatchSize)).div(255).sub(0.5),
//               tf.stack(rights.slice(i*genBatchSize, (i+1)*genBatchSize)).div(255).sub(0.5),
//               tf.stack(corners.slice(i*genBatchSize, (i+1)*genBatchSize))])
//        console.log("x generator called")
//    }
//}
//
//function* y_generator(xys){
//    const genBatchSize = 3;
//    for (let i = 0; i < (Math.trunc(xys.length/genBatchSize) - 1); i++){
//        yield [tf.tensor(xys.slice(i*genBatchSize, (i+1)*genBatchSize))]
//    }
//}


function* x_generator(){
    let lefts = leftEyes_x;
    let rights = rightEyes_x;
    let corners = eyeCorners_x;

    const genBatchSize = 2;
    for (let i = 0; i < (Math.trunc(lefts.length/genBatchSize) - 1); i++){
        console.log(tf.memory());
        yield tf.tidy(() => [tf.stack(lefts.slice(i*genBatchSize, (i+1)*genBatchSize)).div(255).sub(0.5),
               tf.stack(rights.slice(i*genBatchSize, (i+1)*genBatchSize)).div(255).sub(0.5),
               tf.stack(corners.slice(i*genBatchSize, (i+1)*genBatchSize))]);
    }
}

function* y_generator(){
    let xys = screenXYs_y;

    const genBatchSize = 2;
    for (let i = 0; i < (Math.trunc(xys.length/genBatchSize) - 1); i++){
        yield [tf.tensor(xys.slice(i*genBatchSize, (i+1)*genBatchSize))];
    }
}


async function trainNatureRegHead(left_x, right_x, corn_x, screenxy_y){

    boostModel.compile({
      optimizer: tf.train.adam(0.001),
      loss: 'meanSquaredError',
      metrics: ['mae', 'mse']
    });

    leye_tensor = tf.tidy(() => tf.stack(left_x).div(255).sub(0.5))
    reye_tensor = tf.tidy(() => tf.stack(right_x).div(255).sub(0.5))
    eyeCorners_tensor = tf.tidy(() => tf.stack(corn_x))
    x_vect = await tf.tidy(() => natureModelEmbeddings.predict([leye_tensor, reye_tensor, eyeCorners_tensor]))
    console.log("embeddings extracted")
    y_vect = tf.tensor(screenxy_y, [screenxy_y.length, 2])

    x_vect.print();
    y_vect.print();

    let epochCount = 0;
    await boostModel.fit(x_vect, y_vect, {
               epochs: 100,
               batchSize: 20,
               validationSplit: 0.1,
               callbacks: {
          onEpochEnd: async (batch, logs) => {
                  console.log(boostModel.predict(tf.randomNormal([1,natureModelEmbeddings.outputShape[1]])).arraySync())
                  console.log(epochCount++, 'Loss: ' + logs.loss.toFixed(5));
          }
        }
        }).then(info => {
                // Give us the details of the training, and show the user
                console.log('Final accuracy', info.history);
                console.log( info.history['mae']);
                console.log("val mae", info.history['val_mae']);
                console.log("finished training the fine tuned google model")
                document.getElementById("trainingstate").innerHTML = "nature model calibration training done";

                console.log("test on random data after fitting")
                console.log(boostModel.predict(tf.randomNormal([1,natureModelEmbeddings.outputShape[1]])).arraySync())
                console.log("last layer weights after training: ")

               //  clean up memory
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

                tf.ENV.set('WEBGL_CPU_FORWARD', true);

                // Start the live testing loop
                done_with_training = true;
                curPred = [0.5, 0.5];
                eyeSelfie(true);
                setTimeout(runNaturePredsLive, 100);
                setTimeout(loop, 500);
        });
}





async function trainNatureModel(left_x, right_x, corn_x, screenxy_y){
//function trainNatureModel(left_x, right_x, corn_x, screenxy_y){
    console.log("training started")
    console.log("memory at beginning")
    console.log(tf.memory())

    // Compile the model
    naturemodel.compile({
      optimizer: tf.train.adam(0.00000000000000001),
      loss: 'meanSquaredError',
      metrics: ['mae', 'mse']
    });

        leye_tensor = tf.tidy(() => tf.stack(left_x).div(255).sub(0.5))
        reye_tensor = tf.tidy(() => tf.stack(right_x).div(255).sub(0.5))
        eyeCorners_tensor = tf.tidy(() => tf.stack(corn_x))
//        y_vect = tf.tidy(() => tf.tensor(screenxy_y, [screenxy_y.length, 2]))
        y_vect = tf.tensor(screenxy_y, [screenxy_y.length, 2])
        console.log("data massaging done")

        console.log("prediction before training: ")
        console.log(naturemodel.predict([tf.randomNormal([1,128,128,3]), tf.randomNormal([1,128,128,3]), tf.randomNormal([1,8])]).arraySync())
        console.log("last layer weights before training: ")
        naturemodel.layers[36].weights[0].val.print()
        naturemodel.layers[36].weights[1].val.print()

        let epochCount = 0;
//        naturemodel.fitDataset(ds, {
        await naturemodel.fit([leye_tensor, reye_tensor, eyeCorners_tensor], y_vect, {
//        naturemodel.fit([tf.randomNormal([1, 128,128, 3]), tf.randomNormal([1, 128,128, 3]), tf.randomNormal([1, 8])], tf.randomNormal([1, 2]), {
               epochs: 3,
               batchSize: 10,
//               validationSplit: 0.1,
               callbacks: {
          onEpochEnd: async (batch, logs) => {
                  console.log(naturemodel.predict([tf.randomNormal([1,128,128,3]), tf.randomNormal([1,128,128,3]), tf.randomNormal([1,8])]).arraySync())
                  console.log(epochCount++, 'Loss: ' + logs.loss.toFixed(5));
          }
        }
        }).then(info => {
                console.log("finished training")

                // Give us the details of the training, and show the user
               console.log('Final accuracy', info.history);
               console.log( info.history['mae']);
               console.log("val mae", info.history['val_mae']);
                console.log("nature training done");
                document.getElementById("trainingstate").innerHTML = "nature model calibration training done";

                console.log("test on random data after fitting")
                console.log(naturemodel.predict([tf.randomNormal([1,128,128,3]), tf.randomNormal([1,128,128,3]), tf.randomNormal([1,8])]).arraySync())
                console.log("last layer weights after training: ")
                naturemodel.layers[36].weights[0].val.print()
                naturemodel.layers[36].weights[1].val.print()

               //  clean up memory
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

                tf.ENV.set('WEBGL_CPU_FORWARD', true);
//                tf.setBackend('webgl');
//                console.log('backend is set to', tf.getBackend(), "after training")
                // Start the live testing loop
                done_with_training = true;
                curPred = [0.5, 0.5];
                eyeSelfie(true);
//                setTimeout(runNaturePredsLive, 100);
                setTimeout(loop, 500);
        });
    }

async function runNaturePredsLive(){
//    console.log(tf.memory());

    if (curEyes[0] == undefined){
        console.log("curEyes undefined while running prediction, trying again")
        setTimeout(runNaturePredsLive, 500);
        return
    }

    now = performance.now();
    pred = tf.tidy(() => {
        return boostModel.predict(natureModelEmbeddings.predict([curEyes[0].div(255).sub(0.5).reshape([1, 128, 128, 3]), curEyes[1].div(255).sub(0.5).reshape([1, 128, 128, 3]), curEyes[2].reshape([1, 8])]));

//        return naturemodel.predict([curEyes[0].div(255).sub(0.5).reshape([1, 128, 128, 3]),
//                                curEyes[1].div(255).sub(0.5).reshape([1, 128, 128, 3]),
//                                curEyes[2].reshape([1, 8])])
    })
    pred = pred.clipByValue(0.0, 1.0)
    pred.print()

    predictions[0] = pred[0];
    predictions[1] = pred[1];
    curPred = pred.arraySync()[0];

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

var boostModel
var natureModelEmbeddings; // Model for getting the embeddings from things
async function main() {
    tf.setBackend('webgl');
    await tf.ready();

    // Need to keep all computation in the GPU/webGL by removing forward CPU computation
    // True at least for iOS Safari
//    tf.ENV.set('WEBGL_CONV_IM2COL', false);
//    tf.ENV.set('WEBGL_CHECK_NUMERICAL_PROBLEMS', true);
//    tf.ENV.set('WEBGL_PACK_DEPTHWISECONV', true);



    tf.ENV.set('WEBGL_CPU_FORWARD', false);

    // import custom model
    models = [];
    console.log("loading model");
    await loadTFJSModel("/static/models/tfjsmodel");
    naturemodel = models[0];
    console.log('Successfully loaded model');

//    naturemodel.summary()
    // freeze the first 28 layers (up to the final dense ones), 29 leaves first dense also untrained
    for (let i = 0; i <= 36; i++){
        naturemodel.layers[i].trainable = false;
    }

    // Copy of original outputting embeddings
    natureModelEmbeddings = tf.model({inputs: naturemodel.inputs, outputs: naturemodel.layers[35].output});
    boostModel = natureModelFineTune(natureModelEmbeddings.outputShape[1])


//    for (let i = 0; i <= 36; i++){
//        console.log(i, naturemodel.layers[i].name)
//    }


    // Warm up the model
    let a = naturemodel.predict([tf.randomNormal([1, 128,128, 3]),
    tf.randomNormal([1, 128,128, 3]),
    tf.randomNormal([1,8])]);
    a.dataSync();
    a.dispose();


    waitForIt();
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
