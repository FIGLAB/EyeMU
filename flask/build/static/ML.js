function makeModel(){

    const model = tf.sequential({
        layers: [
        tf.layers.conv2d({inputShape: [iny, inx, 1], kernelSize: 3, filters: 8, activation: 'relu'}),
        tf.layers.batchNormalization(),
        tf.layers.maxPooling2d({poolSize: 2}),
        tf.layers.flatten(),
        tf.layers.dense({units: 100, activation: 'relu'}),
        tf.layers.dense({units: 2}),
        ]
    });

    model.summary();
    return model
}

async function saveModel(){
    await eyeModel.save('downloads://my-model');
}

async function loadModel(){
    // Don't know how to make the templating render this properly but it works
    eyeModel = await tf.loadLayersModel(window.location.origin + "/static/models/combined.json");
}