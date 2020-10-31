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
            tf.layers.dense({inputShape:[inElems], units:8, activation:'relu'}),
            tf.layers.batchNormalization(),
            tf.layers.dense({units:2}),
//            tf.layers.dense({inputShape:[inElems], units:2}),

//            tf.layers.dense({units:2}),
        ]
    })

    model.summary();
    return model
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

