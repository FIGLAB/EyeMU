new p5();

// datacollect_p5.js moves a circle around the screen, once per round for ~5 rounds, then does regression training on them.
var n_calib_rounds = 3;

// Global variables
var radius = 50.0;
var X, Y;
var nX, nY;

// Timing of steps
var stopped = false;
var numSteps = 40;
var stepsTaken = 0;

// equal collection ims along each line
var num_ims_along_line = 3;
var steps_per_line_im = Math.trunc(numSteps/num_ims_along_line);
var num_ims_still = 5;
var stillsTaken = 0;

// Step size in pixels
var moveAmountPerFrame = [];

var moveDelay = 80;
var calib_counter = 0;
var calib_rounds = 0;

var nx_arr = [];
var ny_arr = [];

// state variables
var done_with_training = false;

// Setup the Processing Canvas
function setup(){
    createCanvas(windowWidth, windowHeight);

    strokeWeight( 1 );
    frameRate(60);

    let w_op = [width/10, width/2, width*9/10];
    let h_op = [height/20, height/2, height*19/20];

    nx_arr = [w_op[1], w_op[2], w_op[2], w_op[0], w_op[0], w_op[2], w_op[2]]
    ny_arr = [h_op[1], h_op[1], h_op[0], h_op[0], h_op[2], h_op[2], h_op[1]];

    X = nx_arr[calib_counter];
    Y = ny_arr[calib_counter];
    nX = nx_arr[(calib_counter+1) % 5];
    nY = ny_arr[(calib_counter+1) % 5];

    moveAmountPerFrame = [(nX-X)/numSteps , (nY-Y)/numSteps];
}

// Main draw loop
function draw(){
    // Fill canvas grey, Set fill-color to blue, and make stroke-color white
    background( 150 );
    fill( 0, 121, 184 );
    stroke(255);

    if (done_with_training){
        textSize(30);
        text("\nTraining completed", width/2, height/2);

         setTimeout(() => window.location.href = "../svrtest", 1000);
        return
    }

    // Give textual indicator to user of the round
    textAlign(CENTER, CENTER);
    textSize(35);
    if (calib_rounds < n_calib_rounds){
        text("Round: " + (calib_rounds+1) + "/" + n_calib_rounds +
                "\nLocation: " + (calib_counter+1) + "/" + nx_arr.length + "\nTap to advance", width/2, height/2)
    } else {
        text("\n\n\nTap to start training", width/2, height/2);
    }


    radius = radius + sin( frameCount / 8 );
    // Draw circle
    ellipse( X, Y, radius, radius );

    if (rBB != undefined){ // if the face has been detected, start the data collection
        if ((calib_rounds < n_calib_rounds) && !stopped){


            // Track circle to new destination
            X += moveAmountPerFrame[0];
            Y += moveAmountPerFrame[1];
            stepsTaken += 1;

            if ((stepsTaken % steps_per_line_im) == 0){
                eyeSelfie(false);
                console.log("eyeSelfie along line");
//                console.log("eyeSelfie along line", X, Y);
            }

            // Take a certain # of photos at each location if close enough
    //        if ((Math.abs(nX-X) + Math.abs(nY-Y)) < 2){
            if (stepsTaken >= numSteps){
                stepsTaken = 0;
                calib_counter += 1;
                calib_rounds = Math.floor(calib_counter/nx_arr.length);

                X = nx_arr[calib_counter % nx_arr.length];
                Y = ny_arr[calib_counter % nx_arr.length];
                nX = nx_arr[(calib_counter+1) % nx_arr.length];
                nY = ny_arr[(calib_counter+1) % nx_arr.length];

                // Moves faster in the y direction, but whatever. Too hard to fix
                moveAmountPerFrame = [(nX-X)/numSteps , (nY-Y)/numSteps];
                stopped = true;
                stillsTaken = 0;
            }
        } else if (stopped){
            if (stillsTaken < num_ims_still){
                if (frameCount % 10 == 0){ // take screenshot every N frames
                    eyeSelfie(false);
                    console.log("eyeSelfie at corner");
                    stillsTaken += 1;
                } // Write number of photo and draw circle going around
                textSize(20)
                text(stillsTaken, X, Y)



            } else if (stillsTaken >= num_ims_still){
                fill( 0, 121, 20 );
                ellipse( X, Y, radius, radius );
            }
        } else{
            console.log("collection done, starting training")

            // Reset canvas
            background( 150 );
            fill( 0, 121, 184 );
            stroke(255);

            textSize(100);
            text('Training...', width/2, height/2);

//            eyeSelfie(true); // called at the end of training as well
            calib_counter = 0
            noLoop();

            trainNatureRegHead(leftEyes_x, rightEyes_x, eyeCorners_x,screenXYs_y);
            done_with_training = true;
        }
    }
}

function touchStarted(){
    if (stopped){
        stopped = false;
        stepsTaken = 0;
    }
}


// // Draw regression button
// var regression = true;
// function regr_class_toggle() {
//     var x = document.getElementById("regtoggle");
//     if (x.innerHTML === "<h4>Regression</h4>") {
//         x.innerHTML = "<h4>Classification</h4>";
//         x.style.background = "#2196F3";
//         regression = false;
//     } else {
//         x.innerHTML = "<h4>Regression</h4>";
//         x.style.background = "#ccc";
//         regression = true;
//     }
// }