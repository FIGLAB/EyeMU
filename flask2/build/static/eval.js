// Eval.js runs the 9 locations on the screen and logs the error numbers. Any model can be used here.
var n_calib_rounds = 1;

// Global variables
var radius = 50.0;
var X, Y;
var nX, nY;
var delay = 16;

var moveDelay = 80;
var calib_counter = 0;

var nx_arr = [];
var ny_arr = [];

// Live eval variables
var errorY = 0;
var errorX = 0;
var errorsX = [];
var errorsY = [];

var errorTotals = [];

// average of array function
var average = (array) => array.reduce((a, b) => a + b) / array.length;
var sum = (array) => array.reduce((a, b) => a + b);

// Setup the Processing Canvas
function setup(){
    createCanvas(windowWidth, windowHeight);

    strokeWeight( 1 );
    frameRate(60);

    // Define the points on the screen to travel to
    let w_op = [width/10, width/2, 9*width/10];
    let h_op = [height/10, height/2, 9*height/10];
    nx_arr = [w_op[1], w_op[2], w_op[0], w_op[2], w_op[1], w_op[0], w_op[1], w_op[0], w_op[2]]
    ny_arr = [h_op[0], h_op[2], h_op[1], h_op[0], h_op[1], h_op[2], h_op[2], h_op[0], h_op[1]];


    // Starting location of the dot
    X = width / 2;
    Y = height / 2;
    nX = nx_arr[0];
    nY = ny_arr[0];
}

// Main draw loop
function draw(){
    // Fill canvas grey, Set fill-color to blue, and make stroke-color white
    background( 150 );
    fill( 0, 121, 184 );
    stroke(255);

    if (rBB != undefined){
        // big blue circle for the user to track
        fill( 0, 121, 184 );
        radius = radius + sin( frameCount / 8);

        // Track circle to new destination
        X+=(nX-X)/delay;
        Y+=(nY-Y)/delay;

        // Draw target circle
        ellipse(X, Y, radius, radius);

        if((frameCount % (delay+moveDelay) == 0) && (errorsX.length != 0)){
            // When moving to a new location, save a copy of the error array
            let errorsX_copy = Array.from(errorsX);
            let errorsY_copy = Array.from(errorsY);
            errorTotals.push([errorsX_copy, errorsY_copy]);
            console.log("new location, saved error array: ", average(errorsX_copy)/windowWidth, average(errorsY_copy)/windowHeight);

            // then reset the error arrays
            errorsX = [];
            errorsY = [];

            calib_counter = calib_counter + 1;
            nX = nx_arr[calib_counter];
            nY = ny_arr[calib_counter];
            // After one iteration through the on-screen positions, log the errors and stop looping
            if (calib_counter >= nx_arr.length){
                console.log("error totals length", errorTotals.length)
                let errorTotalsString = "Errors in predicted gaze location, normalized x and y:\n";

                // Iterate through totals and print off error
                // Order of the nx_arr is [2, 9, 4, 3, 5, 7, 8, 1, 6]
                let x_total = 0;
                let y_total = 0;
                let totalPoints = 0;
                [7, 0, 3, 2, 4, 8, 5, 6, 1].forEach((val, index, arr) => {
                    let x_err = average(errorTotals[val][0])/windowWidth;
                    let y_err = average(errorTotals[val][1])/windowHeight;
                    errorTotalsString += (index+1) + " " + x_err + " " + y_err + "\n"

                    x_total += x_err;
                    y_total += y_err;
                });
                errorTotalsString += "total " + x_total/9 + " "
                                               + y_total/9

                console.log(errorTotalsString);
                noLoop();
            }
        }

        // draw small orange circle to indicate prediction
        fill(204, 102, 0);
        let pred_X = curPred[0]*windowWidth;
        let pred_Y = curPred[1]*windowHeight;
        ellipse(pred_X, pred_Y, radius/2, radius/2);

        // If the circle is close to its next location, add up the error
        if ((Math.abs(nX-X) + Math.abs(nY-Y)) < 50){
            errorsX.push(Math.abs(X-pred_X))
            errorsY.push(Math.abs(Y-pred_Y))
        }

    }
}

function getAvgError(arr){

}

// Start over the evaluation round if clicked
function mouseClicked() {
    console.log("starting eval round again")
    X = width / 2;
    Y = height / 2;
    nX = nx_arr[0];
    nY = ny_arr[0];
    calib_counter = 0;

    loop();
}

