

var fLeft;// = tf.zeros([1, 128,128, 3]);
var fRight;// = tf.zeros([1, 128,128, 3]);
var fEyeCorners;// = tf.zeros([1,8]);

async function main() {
//    await tf.setBackend('wasm');
    await tf.ready();

    // Make variables
    const n = 2
    fLeft = tf.randomNormal([n, 128,128, 3]);
    fRight = tf.randomNormal([n, 128,128, 3]);
    fEyeCorners = tf.randomNormal([n,8]);


    // Load custom model
    models = [];
    console.log("loading model");
    await loadModel("/static/models/naturemodel");
    model = models[0];
    console.log('Successfully loaded model');
    model.summary();



    model.predict([fLeft,fRight, fEyeCorners]).print();

    var fakeTrainLeft = tf.randomNormal([n, 128,128, 3]);
    var fakeTrainRight = tf.randomNormal([n, 128,128, 3]);
    var fakeTrainEye = tf.randomNormal([n,8]);
    var fakeTrainXY = tf.randomNormal([n,2]);

    // Compile the model
    model.compile({
      optimizer: tf.train.adam(),
      loss: 'meanSquaredError',
      metrics: ['mae', 'mse']
    });

    let epochCount = 0;
    await model.fit([fakeTrainLeft, fakeTrainRight, fakeTrainEye], fakeTrainXY, {
       epochs: 50,
       batchSize: 1,
       validationSplit: 0,
       callbacks: {
      onEpochEnd: async (batch, logs) => {
          console.log(epochCount++, 'Loss: ' + logs.loss.toFixed(5));
      }
    }
    })


    console.log("fitted!")


    model.predict([fLeft,fRight, fEyeCorners]).print();

}
main();


