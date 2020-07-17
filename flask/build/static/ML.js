var models = [];
var predictions = [[], []];

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

// Save and load
async function saveModel(model){
    await model.save('downloads://my-model');
}


async function loadModel(path){
    // Don't know how to make the templating render this properly but it works
    const tmpmodel = await tf.loadLayersModel(window.location.origin + path + "/my-model.json").then((model) => {
    models.push(model);
    });
}

