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
var num_ims_along_line = 10;
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

// Error tracking
var errorsX = [];
var errorsY = [];

var tmpErrorX = [];
var tmpErrorY = [];

// Setup the Processing Canvas
function setup(){
    createCanvas(windowWidth, windowHeight);

    strokeWeight( 1 );
    frameRate(60);

    let w_op = [width/10, width/2, width*9/10];
    let h_op = [height/20, height/2, height*19/20];
            // center,mid-right,topright,topleft, midleft, botleft, botright, mid-right again
    nx_arr = [w_op[1], w_op[2], w_op[2], w_op[0], w_op[0], w_op[0], w_op[2], w_op[2]]
    ny_arr = [h_op[1], h_op[1], h_op[0], h_op[0], h_op[1], h_op[2], h_op[2], h_op[1]];

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

    // Give textual indicator to user of the round
    textAlign(CENTER, CENTER);
    textSize(35);
    if (calib_rounds < n_calib_rounds){
        text("\nLocation: " + (calib_counter+1) + "/" + nx_arr.length + "\nTap to advance", width/2, height/2)
    } else {
//        text("\n\n\nTap to start training", width/2, height/2);
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
    }

    // Draw target circle
    radius = radius + sin( frameCount / 8 );
    ellipse( X, Y, radius, radius );



    if (rBB != undefined && curPred != undefined && curPred[0] != -1){ // if the face has been detected, start the data collection
        let currentErrorX = abs(X - curPred[0]*windowWidth);
        let currentErrorY = abs(Y - curPred[1]*windowHeight);

        // Draw prediction circle
//        if (){
            fill(204, 102, 0);
            ellipse(curPred[0]*windowWidth, curPred[1]*windowHeight, radius/2, radius/2);
//        }
        if ((calib_rounds < n_calib_rounds) && !stopped){

            // record at even intervals along the line
//            if ((stepsTaken % steps_per_line_im) == 0){}

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
            if (stillsTaken < num_ims_still){
                if (frameCount % 5 == 0){ // take screenshot every N frames
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

            } else if (stillsTaken >= num_ims_still){
                fill( 0, 121, 20 ); // Green circle if all images taken
                ellipse( X, Y, radius, radius );


                if (!errorsAdded){
                    errorsX.push(average(tmpErrorX));
                    errorsY.push(average(tmpErrorY));
                    errorsAdded = true;

                    tmpErrorX = [];
                    tmpErrorY = [];
                }

            }
        }
    }
}

function touchStarted(){
    if (stopped){
        stopped = false;
        stepsTaken = 0;
    }
}







































//var n_calib_rounds = 1;
//
//// Global variables
//var radius = 50.0;
//var X, Y;
//var nX, nY;
//var delay = 16;
//
//var moveDelay = 80;
//var calib_counter = 0;
//
//var nx_arr = [];
//var ny_arr = [];
//
//// Live eval variables
//var errorY = 0;
//var errorX = 0;
//var errorsX = [];
//var errorsY = [];
//
//var errorTotals = [];
//
//
//
//// Setup the Processing Canvas
//function setup(){
//    createCanvas(windowWidth, windowHeight);
//
//    strokeWeight( 1 );
//    frameRate(60);
//
//    // Define the points on the screen to travel to
//    let w_op = [width/10, width/2, 9*width/10];
//    let h_op = [height/10, height/2, 9*height/10];
//    nx_arr = [w_op[1], w_op[2], w_op[0], w_op[2], w_op[1], w_op[0], w_op[1], w_op[0], w_op[2]]
//    ny_arr = [h_op[0], h_op[2], h_op[1], h_op[0], h_op[1], h_op[2], h_op[2], h_op[0], h_op[1]];
//
//
//    // Starting location of the dot
//    X = width / 2;
//    Y = height / 2;
//    nX = nx_arr[0];
//    nY = ny_arr[0];
//}
//
//// Main draw loop
//function draw(){
//    // Fill canvas grey, Set fill-color to blue, and make stroke-color white
//    background( 150 );
//    fill( 0, 121, 184 );
//    stroke(255);
//
//    if (rBB != undefined){
//        // big blue circle for the user to track
//        fill( 0, 121, 184 );
//        radius = radius + sin( frameCount / 8);
//
//        // Track circle to new destination
//        X+=(nX-X)/delay;
//        Y+=(nY-Y)/delay;
//
//        // Draw target circle
//        ellipse(X, Y, radius, radius);
//
//        if((frameCount % (delay+moveDelay) == 0) && (errorsX.length != 0)){
//            // When moving to a new location, save a copy of the error array
//            let errorsX_copy = Array.from(errorsX);
//            let errorsY_copy = Array.from(errorsY);
//            errorTotals.push([errorsX_copy, errorsY_copy]);
//            console.log("new location, saved error array: ", average(errorsX_copy)/windowWidth, average(errorsY_copy)/windowHeight);
//
//            // then reset the error arrays
//            errorsX = [];
//            errorsY = [];
//
//            calib_counter = calib_counter + 1;
//            nX = nx_arr[calib_counter];
//            nY = ny_arr[calib_counter];
//            // After one iteration through the on-screen positions, log the errors and stop looping
//            if (calib_counter >= nx_arr.length){
//                console.log("error totals length", errorTotals.length)
//                let errorTotalsString = "Errors in predicted gaze location, normalized x and y:\n";
//
//                // Iterate through totals and print off error
//                // Order of the nx_arr is [2, 9, 4, 3, 5, 7, 8, 1, 6]
//                let x_total = 0;
//                let y_total = 0;
//                let totalPoints = 0;
//                [7, 0, 3, 2, 4, 8, 5, 6, 1].forEach((val, index, arr) => {
//                    let x_err = average(errorTotals[val][0])/windowWidth;
//                    let y_err = average(errorTotals[val][1])/windowHeight;
//                    errorTotalsString += (index+1) + " " + x_err + " " + y_err + "\n"
//
//                    x_total += x_err;
//                    y_total += y_err;
//                });
//                errorTotalsString += "total " + x_total/9 + " "
//                                               + y_total/9
//
//                console.log(errorTotalsString);
////                try{
////                    document.getElementById("trainingstate").innerHTML = errorTotalsString;
////                } catch (Exception e) {
////                    console.log("trainingstate <p> not found");
////                }
//
//                noLoop();
//            }
//        }
//
//        // draw small orange circle to indicate prediction
//        fill(204, 102, 0);
//        let pred_X = curPred[0]*windowWidth;
//        let pred_Y = curPred[1]*windowHeight;
//        ellipse(pred_X, pred_Y, radius/2, radius/2);
//
//        // If the circle is close to its next location, start adding up the error
//        if ((Math.abs(nX-X) + Math.abs(nY-Y)) < 50){
//            errorsX.push(Math.abs(X-pred_X))
//            errorsY.push(Math.abs(Y-pred_Y))
//        }
//
//    }
//}
//
//
//// Start over the evaluation round if clicked
//function mouseClicked() {
//    console.log("starting eval round again")
//    X = width / 2;
//    Y = height / 2;
//    nX = nx_arr[0];
//    nY = ny_arr[0];
//    calib_counter = 0;
//
//    loop();
//}
//
