var n_calib_rounds = 1;

// equal collection ims at each point
var num_ims_per_location = 5;
var locations_traversed = 0;

// Global variables
var radius = 50.0;
var X, Y;
var nX, nY;
var delay = 8;
//var moveDelay = num_ims_per_location*7;
var moveDelay = 40;
var calib_counter = 0;
var calib_rounds = 0;
var train = true;



var nx_arr = [];
var ny_arr = [];

// Done with training vars
var done_with_training = false;

// Setup the Processing Canvas
function setup(){
    createCanvas(windowWidth, windowHeight);

    strokeWeight( 1 );
    frameRate( 30 );
    X = width / 2;
    Y = height / 2;
    nX = X;
    nY = Y;

    nx_arr = [width/2, 9*width/10, width/10,9*width/10,width/2,width/10,width/2,width/10,9*width/10, 9*width/10];
    ny_arr = [height/10, 9*height/10, height/2,height/10,height/2,9*height/10,9*height/10,height/10,height/2, height/2];
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
        radius = radius + sin( frameCount / 4 );

        // Track circle to new destination
        X+=(nX-X)/delay;
        Y+=(nY-Y)/delay;

        // Draw circle
        ellipse(X, Y, radius, radius);

        if(frameCount % (delay+moveDelay)==0){
            nX = nx_arr[calib_counter];
            nY = ny_arr[calib_counter];
            calib_counter = calib_counter + 1;
            if (calib_counter > 9){
                calib_counter = 0;
                calib_rounds = calib_rounds + 1;
            }
        }

        // draw small orange circle for prediction
        fill(204, 102, 0);
        if (regression){
            ellipse(curPred[0]*windowWidth, curPred[1]*windowHeight, radius/2, radius/2);
        } else{
            const leftHalf = curPred[0] < 0.5;
            const topHalf = curPred[1] < 0.5;
            rect(leftHalf ? 0 : windowWidth/2, topHalf ? 0 : windowHeight/2, windowWidth/2, windowHeight/2);
        }


    } else if (rBB != undefined){  //
        if (calib_rounds < n_calib_rounds){
            radius = radius + sin( frameCount / 4 );

            // Track circle to new destination
            X+=(nX-X)/delay;
            Y+=(nY-Y)/delay;

            // Draw circle
            ellipse( X, Y, radius, radius );

            // Take a certain # of photos at each location
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