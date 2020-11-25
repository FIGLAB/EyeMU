new p5();

// datacollect_p5.js moves a circle around the screen, once per round for ~5 rounds, then does regression training on them.
var n_calib_rounds = 5;

// Global variables
var radius = 70.0;
var X, Y;
var nX, nY;

// Timing of steps
var stopped = false;
var numSteps = 40;
var stepsTaken = 0;

// equal collection ims along each line
var num_ims_along_line = 15;
var steps_per_line_im = Math.round(numSteps/num_ims_along_line);
var num_ims_still = 10;
var stillsTaken = 0;
var stillsDone = false;
var movingsTaken = 0;

// Step size in pixels
var moveAmountPerFrame = [];

var moveDelay = 80;
var calib_counter = 0;
var calib_rounds = 0;

var nx_arr = [];
var ny_arr = [];

// state variables
var done_with_training = false;

// Instructions array
movePositionString = "\n\n\n\n\nChange rooms, seating, or position \n(stand/sit in a different angle).\n\n\nThen, with your head facing\ntowards the "
endString = " corner\nof your phone, track the circle."
var alertShown = false;

var instructions = [
    "Face the center of your phone and \ntrack the circle with your eyes.",
    movePositionString + "top-left" + endString,
    movePositionString + "top-right" + endString,
    movePositionString + "bottom-left" + endString,
    movePositionString + "bottom-right" + endString
];

// Setup the Processing Canvas
function setup(){
    createCanvas(windowWidth, windowHeight);

    strokeWeight( 1 );
    frameRate(60);

    let w_op = [width/10, width/2, width*9/10];
    let h_op = [height/20, height/2, height*19/20];
//            // center,mid-right,topright,topleft, midleft, botleft, botright, mid-right again
//    nx_arr = [w_op[1], w_op[2], w_op[2], w_op[0], w_op[0], w_op[0], w_op[2], w_op[2]]
//    ny_arr = [h_op[1], h_op[1], h_op[0], h_op[0], h_op[1], h_op[2], h_op[2], h_op[1]];

            //center   botmid, botleft, mid left, topleft, topright, midright, botright
    nx_arr = [w_op[1], w_op[1], w_op[0], w_op[0], w_op[0],  w_op[2], w_op[2], w_op[2]]
    ny_arr = [h_op[1], h_op[2], h_op[2], h_op[1], h_op[0], h_op[0], h_op[1], h_op[2]]


    X = nx_arr[calib_counter];
    Y = ny_arr[calib_counter];
    nX = nx_arr[(calib_counter+1) % 5];
    nY = ny_arr[(calib_counter+1) % 5];

    moveAmountPerFrame = [(nX-X)/numSteps , (nY-Y)/numSteps];

    // Start it in a stopped state
    stillsTaken = num_ims_still
    stopped = true;
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

        noLoop();
        return;
    }

    // Give textual indicator to user of the round
    textAlign(CENTER, CENTER);
    textSize(45);
    fill( 0, 101, 150 );
    if (calib_rounds < n_calib_rounds){
        text("Round: " + (calib_rounds+1) + "/" + n_calib_rounds + "\nTap to advance", width/2, 4*height/5)


        // If we're in the center, show instructions on screen and send an alert
        if (calib_counter % nx_arr.length == 0 && movingsTaken == 0){
            text("\n\n" + instructions[calib_rounds], width/2, 2*height/5)
        }
        text("Instructions: Track the ball with your eyes. \nWhen it turns green, you're safe to blink.", width/2, height/5)
    } else {
        text("\n\n\nTap to start training", width/2, 3*height/5);
    }

//    fill( 0, 121, 184 ); // dark blue
    fill(194, 21, 2); // dark red


    // Draw circle, with gradually oscillating radius
    radius = radius + sin( frameCount / 8 )
    ellipse( X, Y, radius, radius );

    if (rBB != undefined ){ // if the face has been detected, start the data collection
        // Unless eyes are too far off screen
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
        } else if ((calib_rounds < n_calib_rounds) && !stopped){
            // Show that images are being taken before XY increments
            textSize(20)
            fill(255,255,255)
            text(movingsTaken, X, Y);

            // Track circle to new destination
            X += moveAmountPerFrame[0];
            Y += moveAmountPerFrame[1];
            stepsTaken += 1;

            // Take an eye pic at linear increments
            if ((stepsTaken % steps_per_line_im) == 0){
                eyeSelfie(false);
                movingsTaken += 1;
                console.log("eyeSelfie along line");
            }

            // If destination point is reached, move to stationary capture
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
                stillsDone = false;
                stillsTaken = 0;
            }
        } else if (stopped){
            movingsTaken = 0;
            if (stillsTaken < num_ims_still){
                if (frameCount % 1 == 0){ // take screenshot every N frames
                    eyeSelfie(false);
                    console.log("eyeSelfie at corner");
                    stillsTaken += 1;
                } // Write number of photo and draw circle going around
                textSize(20)
                fill(255,255,255)
                text(stillsTaken, X, Y)

            } else if (stillsTaken >= num_ims_still){
                fill(0, 121, 20); // Green circle if all images taken
                ellipse( X, Y, radius, radius);
                stillsDone = true
            }
        } else{
            console.log("collection done, starting training")

            // Reset canvas
            background( 150 );
            fill( 0, 121, 184 );
            stroke(255);
-
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

function touchEnded(){
    if (stopped){
        stopped = false;
        stepsTaken = 0;
    } else if (done_with_training){
        window.location.href = "../svrtest";
    }
}

