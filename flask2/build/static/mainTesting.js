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


// Assuming these are the x and y vectors, shuffle them by row to eliminate ordering effects
function shuffleTensorsTogether(x,y){
    return tf.tidy(() => {
        // Combines x and y, Assumes y is 2 cols
        let data = x.concat(y, 1);
//        console.log("shuffling", data.shape);
        let origShape = data.shape;

        // Shuffle the data using a tf util
        let dataArray = data.arraySync();
        tf.util.shuffle(dataArray);

        // turn it back into a tensor
        data = tf.tensor(dataArray).reshape(origShape);

        // split it back into x and y and return it
        x = data.gather([...Array(origShape[1]-2).keys()], 1)
        y = data.gather([origShape[1]-2, origShape[1]-1], 1)

        return [x,y];
    })
}


function assembleTensors(left, rights, eyeCorns, faceAngles, xys){
    natureModelEmbeddings = tf.model({inputs: naturemodel.inputs,
//            outputs: [naturemodel.layers[29].output, naturemodel.layers[33].output, naturemodel.layers[36].output]});
            outputs: [naturemodel.layers[29].output, naturemodel.layers[33].output]});

    return tf.tidy(() => {
        leye_tensor = tf.tidy(() => tf.stack(left).div(255).sub(0.5))
        reye_tensor = tf.tidy(() => tf.stack(rights).div(255).sub(0.5))
        eyeCorners_tensor = tf.tidy(() => tf.stack(eyeCorns))

        let embeddingFeatures = natureModelEmbeddings.outputShape.reduce((acc, curVal) => acc + curVal[1], 0);
        numFeatures = embeddingFeatures + 4 + 8; // 8 from eye corners

        x_vect = tf.tidy(() => {
//                let embeds = natureModelEmbeddings.predict([leye_tensor, reye_tensor, eyeCorners_tensor]);
//                embeds[0] = embeds[0].div(100);
//                embeds[1] = embeds[1].div(10);
    //            embeds[0] = embeds[0].div(10);
//                embeds = tf.concat(embeds, 1); // Combine the embeddings horizontally, turn 8,4,2 into 14
//                return tf.concat([embeds, eyeCorners_tensor, faceAngles],1);
                return tf.concat([ eyeCorners_tensor, faceAngles],1);
        });
        y_vect = tf.tensor(screenXYs_y, [screenXYs_y.length, 2])

        // Shuffle before sending them out.
        tmp = shuffleTensorsTogether(x_vect, y_vect);
        x_vect.dispose();
        y_vect.dispose();

        x_vect = tmp[0];
        y_vect = tmp[1];

        return [x_vect, y_vect, numFeatures];
    })
}

function getCMError(model, x, y){
    return tf.tidy(() => {
        a = model.predict(x)
        b = a.sub(y)

        c = tf.split(b,2,1)
        d = tf.sqrt(c[0].mul(6.4).pow(2).add(c[1].mul(13.3).pow(2)))

//        console.log("cm error on this data: ")
        d.mean().print()
        return d.mean().arraySync()
    });
}



function trainOnCurrentData() {
    console.log("training function started")

    let now = performance.now()
    tmp = assembleTensors(leftEyes_x, rightEyes_x, eyeCorners_x,faceGeom_x, screenXYs_y);

    x_vect = tmp[0];
    y_vect = tmp[1];
    boostModel = natureModelFineTune(tmp[2]);


    // Experimental x y
    ranges = tf.tidy(() => {tmp = x_vect.max(1).sub(x_vect.min(1));
        return tf.stack(Array(tmp[2]).fill(tmp)).transpose()
    });

    mins_x = x_vect.min(1)
    mins_x = tf.stack(Array(tmp[2]).fill(mins_x)).transpose().neg()

    zeroToOne_x = x_vect.add(mins_x).div(ranges)
    x_vect = zeroToOne_x

    console.log("data assembly took:", performance.now()-now)

    boostModel.compile({
      optimizer: tf.train.adam(0.001),
      loss: 'meanSquaredError',
      metrics: ['mae', 'mse']
    });

    let epochCount = 0;
    boostModel.fit(x_vect, y_vect, {
           epochs: 256,
           validationSplit: 0.1,
           callbacks: {
              onEpochEnd: async (batch, logs) => {
                      console.log(boostModel.predict(tf.randomNormal([1,numFeatures])).arraySync())
                      console.log(epochCount++, 'Loss: ' + logs.loss.toFixed(5));

                      tmp = shuffleTensorsTogether(x_vect, y_vect);
                      x_vect.dispose();
                      y_vect.dispose();

                      x_vect = tmp[0];
                      y_vect = tmp[1]

              }
            }
    }).then( info => {
        console.log('Final accuracy', info.history);
        console.log("val mae", info.history['val_mae'][epochCount-1]);
        console.log("val mse", info.history['val_mse'][epochCount-1]);

//        let sumErr = 0;
//        for (let i = 0; i< 10; i++){
//            sumErr += getCMError(boostModel, x_vect, y_vect)[0];
//        }
//        console.log("cm error after training: ", sumErr/10);
        testOnCurrentData();
    });
}

function testOnCurrentData(){
    console.log('testing function started')
//    getCMError(boostModel, x_vect, y_vect);
    let numTrials = 5;
    let sumErr = 0;
    tf.tidy(() => {
        for (let i = 0; i < numTrials; i++){
            tmp = assembleTensors(leftEyes_x, rightEyes_x, eyeCorners_x,faceGeom_x, screenXYs_y);


            x_vect = tmp[0];
            y_vect = tmp[1];


            // Experimental x y, use same mins and ranges from earlier
            zeroToOne_x = x_vect.add(mins_x).div(ranges)
            x_vect = zeroToOne_x
            sumErr += getCMError(boostModel, x_vect, y_vect);
        }
        console.log("cm error after training: ", sumErr/numTrials);
    })
}

function getBaseline(){
    tmp = assembleTensors(leftEyes_x, rightEyes_x, eyeCorners_x,faceGeom_x, screenXYs_y);
    tf.tidy(() => {
        a = naturemodel.predict([leye_tensor, reye_tensor, eyeCorners_tensor])
        b = a.sub(y_vect)
        c = tf.split(b,2,1)

        d = tf.sqrt(c[0].mul(6.4).pow(2).add(c[1].mul(13.3).pow(2)))
        console.log("baseline cm error on this data: ")
        d.mean().print()
    });
}