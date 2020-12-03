// Eval.js runs the 9 locations on the screen and logs the error numbers. Any model can be used here.
new p5();

// average of array function
var average = (array) => array.reduce((a, b) => a + b) / array.length;
var sum = (array) => array.reduce((a, b) => a + b);

// For turning off the SVR drawing
showPredictDot = false;

// Global variables
var radius = 50.0;
var X, Y;
var nX, nY;
var n_calib_rounds = 1;

// Timing of steps
var stopped = false;
var numSteps = 20;
var stepsTaken = 0;

// equal collection ims along each line
var num_ims_still = 10;
var stillsTaken = 0;
var delayFrames = 20;
var delay_frames_taken = 0;

// Step size in pixels
var moveAmountPerFrame = [];
var moveDelay = 80;
var calib_counter = 0;
var calib_rounds = 0;

var nx_arr = [];
var ny_arr = [];

// state variables
var done_with_training = false;

// Error tracking
var errorsX = [];
var errorsY = [];

var tmpErrorX = [];
var tmpErrorY = [];

// State tracking
var locations_acc = [];

var initial_width = window.innerWidth;
var initial_height = window.innerHeight;

// Setup the Processing Canvas
function setup(){
    createCanvas(windowWidth, windowHeight);

    strokeWeight( 1 );
    frameRate(60);

    let w_op = [width/10, width/2, width*9/10];
    let h_op = [height/20, height/2, height*19/20];
            // center,mid-right,topright, topmid, topleft, midleft, botleft, botmid botright, mid-right again
    nx_arr = [w_op[1], w_op[2], w_op[2], w_op[1], w_op[0], w_op[0], w_op[0], w_op[1], w_op[2]]
    ny_arr = [h_op[1], h_op[1], h_op[0], h_op[0], h_op[0], h_op[1], h_op[2], h_op[2], h_op[2]];

    X = nx_arr[calib_counter];
    Y = ny_arr[calib_counter];
    nX = nx_arr[(calib_counter+1) % 5];
    nY = ny_arr[(calib_counter+1) % 5];

    moveAmountPerFrame = [(nX-X)/numSteps , (nY-Y)/numSteps];


    // Start it in a stopped state
    stillsTaken = num_ims_still
    stopped = true;
    errorsAdded = true;
}

// Main draw loop
function draw(){
    // Fill canvas grey, Set fill-color to blue, and make stroke-color white
    background( 150 );
    fill( 0, 121, 184 );
    stroke(255);

    // Give textual indicator to user of the round
    textAlign(CENTER, CENTER);
    textSize(35);
    if (typeof(rBB) == 'undefined' || typeof(curPred) == 'undefined' || curPred[0] == -1){
        text("\n\nPlease wait, loading", width/2, height*2/3)
    } else if (errorsX.length == nx_arr.length){
        textSize(30);
        let errX_avg = nf(average(errorsX)/windowWidth, 1, 2)
        let errY_avg = nf(average(errorsY)/windowHeight, 1, 2)

        text("errorX: " +
                errX_avg, width/2, height/2);
        text("\n\nerrorY: " +
                errY_avg, width/2, height/2);
        text("\n\n\n\ncm X: " +
                6.3*errX_avg, width/2, height/2);
        text("\n\n\n\n\n\ncm Y: " +
                14.4*errY_avg, width/2, height/2);
        text("\n\n\n\n\n\n\n\ncm combined: " +
                nf(Math.sqrt(14.4*errY_avg*14.4*errY_avg + 6.3*errX_avg*6.3*errX_avg), 1, 2), width/2, height/2);

        // Each time eval is executed in full, store:
            // - Date/time
            // - window width/height,
            // - normalized x and y error for each location
            // - Pixel corrdinates of each xy location, in order
        addToStorageArray("eval", [Date.now(), [initial_width, initial_height], errorsX, errorsY, locations_acc]);

        text("Evaluation results saved at /results\nTap to return to the main page", width/2, height*4/5);
        noLoop();
    } else {
        text("\nLocation: " + (calib_counter) + "/" + (nx_arr.length) + "\nTap to advance", width/2, height*2/3);
    }

    // Draw target circle
    radius = radius + sin( frameCount / 8 );
    ellipse( X, Y, radius, radius );

    if (rBB != undefined){
        eyeExtremesX = lBB.slice(0,2).concat(rBB.slice(0,2))
        eyeExtremesY = lBB.slice(2,4).concat(rBB.slice(2,4))

        eyeExtremesX = eyeExtremesX.map(elem => elem/videoWidth)
        eyeExtremesY = eyeExtremesY.map(elem => elem/videoHeight)
        const margin = 0.025

        // If the eyes are off-screen, notify the user and pause the collection
        if (Math.min(...eyeExtremesX) < margin*2 || Math.max(...eyeExtremesX) > (1.0 - margin*2) ||
            Math.min(...eyeExtremesY) < margin || Math.max(...eyeExtremesY) > (1.0-margin) ||
            (typeof(prediction) != 'undefined' && prediction.faceInViewConfidence < 0.9)){
            fill(255, 20, 20);
            text("Eyes are off-camera! \nData collection paused.", width/2, 3*height/5);
        } else if (typeof(curPred) != 'undefined' && curPred[0] != -1){ // if the face has been detected, start the data collection
            let currentErrorX = abs(X - curPred[0]*windowWidth);
            let currentErrorY = abs(Y - curPred[1]*windowHeight);

            fill(204, 102, 0);
            ellipse(curPred[0]*windowWidth, curPred[1]*windowHeight, radius/2, radius/2);

            if ((calib_rounds < n_calib_rounds) && !stopped){
                // Track circle to new destination
                X += moveAmountPerFrame[0];
                Y += moveAmountPerFrame[1];
                stepsTaken += 1;

                // Take a certain # of photos at each location
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
            if (delay_frames_taken < delayFrames){
                delay_frames_taken += 1;
            } else if (stillsTaken < num_ims_still){
                if (frameCount % 2 == 0){ // take screenshot every N frames
//                    eyeSelfie(false);
                    console.log("eyeSelfie at corner");
                    stillsTaken += 1;
                } // Write number of photo and TODO: draw circle going around
                textSize(20)
                fill(255,255,255);
                text(stillsTaken, X, Y)

                tmpErrorX.push(currentErrorX);
                tmpErrorY.push(currentErrorY);
                errorsAdded = false;

                if (stillsTaken >= num_ims_still){
                    // Accumulate errors and reset the tmpErr tracking
                    errorsX.push(average(tmpErrorX));
                    errorsY.push(average(tmpErrorY));
                    errorsAdded = true;

                    tmpErrorX = [];
                    tmpErrorY = [];

                    // Remember the location
                    locations_acc.push([X,Y])
                }

            } else if (stillsTaken >= num_ims_still){
                fill( 0, 121, 20 ); // Green circle if all images taken
                ellipse( X, Y, radius, radius );
//                if (!errorsAdded){
//                    // Accumulate errors and reset the tmpErr tracking
//                    errorsX.push(average(tmpErrorX));
//                    errorsY.push(average(tmpErrorY));
//                    errorsAdded = true;
//
//                    tmpErrorX = [];
//                    tmpErrorY = [];
//
//                    // Remember the location
//                    locations_acc.push([X,Y])
//                }
            }
        }
        }
    }
}

function touchStarted(){
    if (stopped && stillsTaken >= num_ims_still){
        stopped = false;
        stepsTaken = 0;
        delay_frames_taken = 0;
    } else if (errorsX.length == nx_arr.length){
        location.href = "../";
    }
}





