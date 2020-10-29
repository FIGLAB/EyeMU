var models = [];
var predictions = [[], []];
var tensorEyes;

function makeModel(){

    const model = tf.sequential({
        layers: [
        tf.layers.conv2d({inputShape: [iny, inx, 1], kernelSize: 3, filters: 8, activation: 'relu'}),
//        tf.layers.maxPooling2d({poolSize: 2}),
        tf.layers.maxPooling2d({poolSize: 3}),
        tf.layers.batchNormalization(),
        tf.layers.flatten(),
        tf.layers.dense({units: 20, activation: 'relu'}),
        tf.layers.dense({units: 2}),
        ]
    });

    model.summary();
    return model
}


function boostedModel(){
    const model = tf.sequential({
        layers: [
        tf.layers.dense({inputShape: [7], units: 100, activation: 'relu'}),
        tf.layers.dense({units: 50, activation: 'relu'}),
        tf.layers.dense({units: 2})
        ]
    });

    model.summary();
    return model
}

function natureModelFineTune(inElems){
    const model = tf.sequential({
        layers: [
//            tf.layers.dense({inputShape:[inElems], units:2, activation:'relu'}),
            tf.layers.dense({inputShape:[inElems], units:2}),
//            tf.layers.batchNormalization(),
//            tf.layers.dense({units:2}),
        ]
    })

    model.summary();
    return model
}

function recreateErrorModel(){
    const model = tf.sequential({
        layers: [
            tf.layers.dense({inputShape: [200], units:4}),
            tf.layers.batchNormalization(),
            tf.layers.reLU(),
            tf.layers.dense({units:4}),
            tf.layers.batchNormalization(),
            tf.layers.reLU(),
            tf.layers.dense({units:2}),
        ]
    });

    model.summary();
    return model
}

//naturemodel = tf.sequential({
//        layers: [
//            tf.layers.dense({inputShape: [200], units:4}),
//            tf.layers.batchNormalization(),
//            tf.layers.reLU(),
//            tf.layers.dense({units:4}),
//            tf.layers.batchNormalization(),
//            tf.layers.reLU(),
//            tf.layers.dense({units:2}),
//        ]
//});
//model.layers[0].trainable = false
//
//model.predict(tf.randomNormal([1,200])).print()
//model.compile({
//      optimizer: tf.train.sgd(0.0000268),
//      loss: 'meanSquaredError',
//      metrics: ['mae', 'mse']
//    });
//model.fit(tf.randomNormal([2,200]), tf.randomNormal([2,2]))


//tf.ENV.set('WEBGL_CPU_FORWARD', true);
//naturemodel.predict([tf.randomNormal([1,128,128,3]), tf.randomNormal([1,128,128,3]), tf.randomNormal([1,8])]).print()
//var epochCount = 0
//// Compile the model
//naturemodel.compile({
//  optimizer: tf.train.sgd(0.0000268),
//  loss: 'meanSquaredError',
//  metrics: ['mae', 'mse']
//});
//var n = 2;
//console.log(tf.memory())
//
//naturemodel.fit([tf.randomNormal([n,128,128,3]), tf.randomNormal([n,128,128,3]), tf.randomNormal([n,8])], [tf.randomNormal([n,2])], {
//       epochs: 3,
//       callbacks: {
//          onEpochEnd: async (batch, logs) => {
//                console.log('in batch predict ', naturemodel.predict([tf.randomNormal([1,128,128,3]),
//                                                tf.randomNormal([1,128,128,3]), tf.randomNormal([1,8])]).arraySync())
//                console.log(epochCount++, 'Loss: ' + logs.loss.toFixed(5));}
//                }
//     })
//
//naturemodel.predict([tf.randomNormal([1,128,128,3]), tf.randomNormal([1,128,128,3]), tf.randomNormal([1,8])]).print()









function lastFewLayersModel(){
    const model = tf.sequential({
        layers: [
        tf.layers.dense({inputShape: [2051], units: 2}),
        ]
    });

    model.summary();
    return model
}


function lastFewLayersClassificationModel(){
    const model = tf.sequential({
        layers: [
        tf.layers.dense({inputShape: [2051], units: 9, activation: 'softmax'}),
        ]
    });

    model.summary();
    return model
}


function rescaleIms(eyeImsArray){
    const shape = [eyeImsArray.length, iny, inx, 1]
    return tf.tensor(eyeImsArray, shape)
}

function eyeData2tensor(){
    console.log('conversion started');
    tensorEyes = [rescaleIms(eyeData[0]), rescaleIms(eyeData[1])];

    predictions[0] = models[0].predict(tensorEyes[0]).arraySync();
    predictions[1] = models[1].predict(tensorEyes[1]).arraySync();
    console.log('conversion done');
}


function rescaleColorIms(eyeImsArray){
    const shape = [eyeImsArray.length, iny, inx, 3]
    return tf.tensor(eyeImsArray, shape)
}

function colorEyeData2tensor(){
    console.log('conversion started');
    tensorEyes = [rescaleColorIms(eyeData[0]), rescaleColorIms(eyeData[1])];

    // Normalize the values
    predictions[0] = net.infer(tensorEyes[0]).div(10).arraySync();
    predictions[1] = net.infer(tensorEyes[1]).div(10).arraySync();
    console.log('conversion done');
}

// Save and load
async function saveModel(model){
    await model.save('downloads://my-model');
}


async function loadTFJSModel(path){
    // Don't know how to make the templating render this properly but it works
    const tmpmodel = await tf.loadLayersModel(window.location.origin + path + "/my-model.json").then((model) => {
    models.push(model);
    });
}

