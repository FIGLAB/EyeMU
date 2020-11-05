// Data loading variables
var leftEyes_x = [];
var rightEyes_x = [];
var eyeCorners_x = [];
var faceGeom;
var faceGeom_x = [];
var screenXYs_y = [];

// Data expose
var x_vect;
var y_vect;

// Regularization vars
var ranges;
var mins_x;

// Regression head
var boostModel;



function assembleTensors(left, rights, eyeCorns, xys){
    leye_tensor = tf.tidy(() => tf.stack(leftEyes_x).div(255).sub(0.5))
    reye_tensor = tf.tidy(() => tf.stack(rightEyes_x).div(255).sub(0.5))
    eyeCorners_tensor = tf.tidy(() => tf.stack(eyeCorners_x))

    let embeddingFeatures = natureModelEmbeddings.outputShape.reduce((acc, curVal) => acc + curVal[1], 0);
         numFeatures = embeddingFeatures + 4 + 8; // 8 from eye corners

    x_vect = tf.tidy(() => {
            let embeds = natureModelEmbeddings.predict([leye_tensor, reye_tensor, eyeCorners_tensor]);
            embeds[0] = embeds[0].div(100);
            embeds[1] = embeds[1].div(10);
            embeds = tf.concat(embeds, 1); // Combine the embeddings horizontally, turn 8,4,2 into 14
            return tf.concat([embeds, eyeCorners_tensor, faceGeom_x],1);
    });
    y_vect = tf.tensor(screenXYs_y, [screenXYs_y.length, 2])

    return [x_vect, y_vect, numFeatures];
}

function getCMError(model, x, y){
    a = model.predict(x)
    b = a.sub(y)

    c = tf.split(b,2,1)
    d = tf.sqrt(c[0].mul(6.4).pow(2).add(c[1].mul(13.3).pow(2)))

    console.log("cm error on this data: ")
    d.mean().print()
}



function trainOnCurrentData() {
    console.log("training function started")

    natureModelEmbeddings = tf.model({inputs: naturemodel.inputs,
            outputs: [naturemodel.layers[29].output, naturemodel.layers[33].output, naturemodel.layers[36].output]});

    tmp = assembleTensors(leftEyes_x, rightEyes_x, eyeCorners_x,screenXYs_y);

    x_vect = tmp[0];
    y_vect = tmp[1];
    boostModel = natureModelFineTune(tmp[2]);


    // Experimental x y
    ranges = x_vect.max(1).sub(x_vect.min(1))
    ranges = tf.stack(Array(tmp[2]).fill(ranges)).transpose()

    mins_x = x_vect.min(1)
    mins_x = tf.stack(Array(tmp[2]).fill(mins_x)).transpose().neg()

    zeroToOne_x = x_vect.add(mins_x).div(ranges)
    x_vect = zeroToOne_x


    boostModel.compile({
      optimizer: tf.train.adam(0.001),
      loss: 'meanSquaredError',
      metrics: ['mae', 'mse']
    });

    let epochCount = 0;
    boostModel.fit(x_vect, y_vect, {
           epochs: 128,
           validationSplit: 0.1,
           callbacks: {
              onEpochEnd: async (batch, logs) => {
                      console.log(boostModel.predict(tf.randomNormal([1,numFeatures])).arraySync())
                      console.log(epochCount++, 'Loss: ' + logs.loss.toFixed(5));
              }
            }
    }).then( info => {
        console.log('Final accuracy', info.history);
        console.log("val mae", info.history['val_mae'][epochCount-1]);
        console.log("val mse", info.history['val_mse'][epochCount-1]);

        getCMError(boostModel, x_vect, y_vect);
    });
}

function testOnCurrentData(){
    tmp = assembleTensors(leftEyes_x, rightEyes_x, eyeCorners_x,screenXYs_y);

    x_vect = tmp[0];
    y_vect = tmp[1];


    // Experimental x y, use same mins and ranges from earlier
    zeroToOne_x = x_vect.add(mins_x).div(ranges)
    x_vect = zeroToOne_x

    getCMError(boostModel, x_vect, y_vect);
}

function getBaseline(){
    tmp = assembleTensors(leftEyes_x, rightEyes_x, eyeCorners_x,screenXYs_y);

    a = naturemodel.predict([leye_tensor, reye_tensor, eyeCorners_tensor])
    b = a.sub(y_vect)
    c = tf.split(b,2,1)

    d = tf.sqrt(c[0].mul(6.4).pow(2).add(c[1].mul(13.3).pow(2)))
    console.log("baseline cm error on this data: ")
    d.mean().print()
}