var n_calib_rounds = 1;

// equal collection ims at each point
var num_ims_per_location = 5;
var locations_traversed = 0;

// Global variables
var radius = 50.0;
var X, Y;
var nX, nY;
var delay = 16;

var moveDelay = 80;
var calib_counter = 0;
var calib_rounds = 0;
var train = true;

var nx_arr = [];
var ny_arr = [];

// state variables
var done_with_training = false;

// Live eval variables
var errorY = 0;
var errorX = 0;
var errorsX = [];
var errorsY = [];

// Setup the Processing Canvas
function setup(){
    createCanvas(windowWidth, windowHeight);

    strokeWeight( 1 );
    frameRate(60);
    X = width / 2;
    Y = height / 2;
    nX = X;
    nY = Y;

    let w_op = [width/10, width/2, 9*width/10];
    let h_op = [height/10, height/2, 9*height/10];
    nx_arr = [w_op[1], w_op[2], w_op[0], w_op[2], w_op[1], w_op[0], w_op[1], w_op[0], w_op[2], w_op[2]]
    ny_arr = [h_op[0], h_op[2], h_op[1], h_op[0], h_op[1], h_op[2], h_op[2], h_op[0], h_op[1], h_op[1]];

    //    ny_arr = [height/10, 9*height/10, height/2,height/10,height/2,9*height/10,9*height/10,height/10,height/2, height/2];
//    nx_arr = [width/2, 9*width/10, width/10,9*width/10,width/2,width/10,width/2,width/10,9*width/10, 9*width/10];
}

// Main draw loop
function draw(){
    // Fill canvas grey, Set fill-color to blue, and make stroke-color white
    background( 150 );
    fill( 0, 121, 184 );
    stroke(255);

    // If done with training, start evaluation
    if (done_with_training && curPred != undefined){
        // big blue circle for the user to track
        fill( 0, 121, 184 );
        radius = radius + sin( frameCount / 8);

        // Track circle to new destination
        X+=(nX-X)/delay;
        Y+=(nY-Y)/delay;

        // Draw target circle
        ellipse(X, Y, radius, radius);

        if(frameCount % (delay+moveDelay)==0){
            nX = nx_arr[calib_counter];
            nY = ny_arr[calib_counter];
            calib_counter = (calib_counter + 1) % 10;
        }

        // draw small orange circle for prediction
        fill(204, 102, 0);
        if (regression){
            let pred_X = curPred[0]*windowWidth;
            let pred_Y = curPred[1]*windowHeight;
            ellipse(pred_X, pred_Y, radius/2, radius/2);


            // If regression, track the error and write it to screen
            errorsX.push(Math.abs(X-pred_X))
            errorsY.push(Math.abs(Y-pred_Y))

            const moveAvg = 30 // trim errors if too long
            if (errorsX.length > moveAvg){ errorsX.shift(); }
            if (errorsY.length > moveAvg){ errorsY.shift(); }

            let average = (array) => array.reduce((a, b) => a + b) / array.length;
            errorX = average(errorsX)/windowWidth;
            errorY = average(errorsY)/windowHeight;

            // cm error calculated assuming iphone X
            let x_cm_error = errorX * 7.1;
            let y_cm_error = errorY * 14.4;

            // Writing error to the canvas
            fill(20)
            const spacing = 30;
            textSize(20);
            text("Assuming iPhone X screen size: 7.1 x 14.4 cm", 10, spacing);
            textSize(30);
            text("X % Error: " + nf(errorX*100,2,1) + "\t\tX cm error: " + nf(x_cm_error,1,2), 10, spacing*2);
            text("Y % Error: " + nf(errorY*100,2,1) + "\t\tY cm error: " + nf(y_cm_error,1,2), 10, spacing*3);
            text("X+Y % Error: " + nf(Math.sqrt(errorX*errorX + errorY*errorY)*100,2,1) +
                 "\tX+Y cm error: " + nf(Math.sqrt(x_cm_error*x_cm_error, y_cm_error*y_cm_error),1,2), 10, spacing*4);




        } else{
            const leftHalf = curPred[0] < 0.5;
            const topHalf = curPred[1] < 0.5;
            rect(leftHalf ? 0 : windowWidth/2, topHalf ? 0 : windowHeight/2, windowWidth/2, windowHeight/2);
        }

    } else if (rBB != undefined){  //
        if (calib_rounds < n_calib_rounds){
            radius = radius + sin( frameCount / 8 );

            // Track circle to new destination
            X+=(nX-X)/delay;
            Y+=(nY-Y)/delay;

            // Draw circle
            ellipse( X, Y, radius, radius );

            // Take a certain # of photos at each location if close enough
            if (((Math.abs(nX-X) + Math.abs(nY-Y)) < 50) &&
                 (leftEyes_x.length < (calib_counter + 8*calib_rounds)*num_ims_per_location)){
                eyeSelfie(false);
                console.log(leftEyes_x.length);
            }


            if(frameCount%moveDelay==0){
              nX = nx_arr[calib_counter];
              nY = ny_arr[calib_counter];
              calib_counter = calib_counter + 1;
              if (calib_counter > 9){
                calib_counter = 0;
                calib_rounds = calib_rounds + 1;
              }
            }
        }

        else{
            train = false;
            textSize(100);
            text('Training.....', width/3, height/2);

            console.log('calib done, training')
//            runPredsLive();

            console.log('backend is', tf.getBackend(), "before training")
//            trainNatureModel(leftEyes_x, rightEyes_x, eyeCorners_x,screenXYs_y);
            trainNatureRegHead(leftEyes_x, rightEyes_x, eyeCorners_x,screenXYs_y);

            eyeSelfie(true);
            noLoop();
        }
    }
}

// Reset errro tracking on-click
function mouseClicked() {
  errorxY = [0,0,0,0,0,0,0];
  errorxX = [0,0,0,0,0,0,0];
}


// Draw regression button
var regression = true;
function regr_class_toggle() {
    var x = document.getElementById("regtoggle");
    if (x.innerHTML === "<h4>Regression</h4>") {
        x.innerHTML = "<h4>Classification</h4>";
        x.style.background = "#2196F3";
        regression = false;
    } else {
        x.innerHTML = "<h4>Regression</h4>";
        x.style.background = "#ccc";
        regression = true;
    }
}