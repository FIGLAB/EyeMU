//new p5();

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

// Images for instructions
var instructions_imgs = [];
var imPaths =  ["gaze_center.png",
                "gaze_tl.png",
                "gaze_tr.png",
                "gaze_bl.png",
                "gaze_br.png"];


var windowWidth;
var windowHeight;

const s = ( p ) => {
    // Setup the Processing Canvas
    windowWidth = p.windowWidth;
    let width = p.windowWidth;
    windowHeight = p.windowHeight;
    let height = p.windowHeight;

    var instr_w = width/2
    var instr_h = height/5
    var instr_x = windowWidth/2 - instr_w/2;
    var instr_y = 4*windowHeight/5 - instr_h/2;

 // text drawn at width/2, 2*height/5

    p.setup = function (){
        p.createCanvas(windowWidth, windowHeight);
        p.strokeWeight( 1 );
        p.frameRate(60);

                    // Create the waypoints for the target dot to follow
        let w_op = [width/10, width/2, width*9/10];
        let h_op = [height/20, height/2, height*19/20];
        //            // center,mid-right,topright,topleft, midleft, botleft, botright, mid-right again
        //    nx_arr = [w_op[1], w_op[2], w_op[2], w_op[0], w_op[0], w_op[0], w_op[2], w_op[2]]
        //    ny_arr = [h_op[1], h_op[1], h_op[0], h_op[0], h_op[1], h_op[2], h_op[2], h_op[1]];

                //center   botmid, botleft, mid left, topleft, topright, midright, botright
        nx_arr = [w_op[1], w_op[1], w_op[0], w_op[0], w_op[0],  w_op[2], w_op[2], w_op[2]]
        ny_arr = [h_op[1], h_op[2], h_op[2], h_op[1], h_op[0], h_op[0], h_op[1], h_op[2]]

        // Set initial target dot position
        X = nx_arr[calib_counter];
        Y = ny_arr[calib_counter];
        nX = nx_arr[(calib_counter+1) % 5];
        nY = ny_arr[(calib_counter+1) % 5];

        moveAmountPerFrame = [(nX-X)/numSteps , (nY-Y)/numSteps];

        // Start it in a stopped state
        stillsTaken = num_ims_still
        stopped = true;

        // Load instruction images
        imPaths.forEach((elem) => {
            instructions_imgs.push(p.loadImage("../static/instr_ims/" + elem));
        });

        calib_counter = howManyCheckpoints() * nx_arr.length;
        calib_rounds = Math.floor(calib_counter/nx_arr.length);
    }

    // Main draw loop
    p.draw = function (){
        // Fill canvas grey, Set fill-color to blue, and make stroke-color white
        p.background( 150 );
        p.fill( 0, 121, 184 );
        p.stroke(255);

        if (done_with_training){
            p.textSize(30);
            p.text("\nTraining completed, tap to return to homepage", width/2, height/2);

            p.noLoop();
            return;
        }

        // Give textual indicator to user of the round
        p.textAlign(p.CENTER, p.CENTER);
        p.textSize(45);
        p.fill( 0, 101, 150 );
        if (calib_rounds < n_calib_rounds){
            // If we're in the center, show instructions on screen and send an alert
            if (calib_counter % nx_arr.length == 0 && movingsTaken == 0){
                p.text("\n\n" + instructions[calib_rounds], width/2, 2*height/5)

                if (calib_rounds < instructions_imgs.length){
                    p.image(instructions_imgs[calib_rounds], instr_x, instr_y, instr_w, instr_h)
                }
            }

            p.text("Round: " + (calib_rounds+1) + "/" + n_calib_rounds + "\nTap to advance",
                        width/2,
                        height - (height - (instr_y + instr_h))/2)
            p.text("Instructions: Track the ball with your eyes. \nWhen it turns blue, you're safe to blink.", width/2, height/5)
        } else {
            // Start training automatically
            if (stillsDone){
                stopped = false;
                p.text("\n\n\nTap to start training", width/2, 3*height/5);
            }
        }

        // Draw circle, with gradually oscillating radius
//        fill( 0, 121, 184 ); // dark blue
        p.fill(194, 21, 2); // dark red
        radius = radius + sin( p.frameCount / 8 )
        p.ellipse( X, Y, radius, radius );

        if (rBB != undefined ){ // if the face has been detected, start the data collection
            // Unless eyes are too far off screen
            eyeExtremesX = lBB.slice(0,2).concat(rBB.slice(0,2))
            eyeExtremesY = lBB.slice(2,4).concat(rBB.slice(2,4))

            eyeExtremesX = eyeExtremesX.map(elem => elem/videoWidth)
            eyeExtremesY = eyeExtremesY.map(elem => elem/videoHeight)
            const margin = 0.025

            // If the eyes are off-screen, notify the user and pause the collection
            if (Math.min(...eyeExtremesX) < margin*2 || Math.max(...eyeExtremesX) > (1.0 - margin*2) ||
                Math.min(...eyeExtremesY) < margin || Math.max(...eyeExtremesY) > (1.0-margin)){
//                Math.min(...eyeExtremesY) < margin || Math.max(...eyeExtremesY) > (1.0-margin) ||
//                (typeof(prediction) != 'undefined' && prediction.faceInViewConfidence < 0.9)){
                p.fill(255, 20, 20);
                p.text("Eyes are off-camera! \nData collection paused.", width/2, 3*height/5);
            } else if ((calib_rounds < n_calib_rounds) && !stopped){
                // Show that images are being taken before XY increments
                p.textSize(20)
                p.fill(255,255,255)
                p.text(movingsTaken, X, Y);

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
            } else if (stopped){ // taking stills
                movingsTaken = 0;
                if (stillsTaken < num_ims_still){
                    if (p.frameCount % 2 == 0){ // take screenshot every N frames
                        eyeSelfie(false);
                        console.log("eyeSelfie at corner");
                        stillsTaken += 1;
                    } // Write number of photo and draw circle going around
                    p.textSize(20)
                    p.fill(255,255,255)
                    p.text(stillsTaken, X, Y)

                    if (stillsTaken >= num_ims_still){
                        p.fill(0, 121, 184); // Blue circle if all images taken (because of color blindness
                        p.ellipse( X, Y, radius, radius);
                        stillsDone = true

                        // Store the last set of embeddings, eyeCorners, and head geoms
                        if (calib_counter % nx_arr.length == 0){
                            console.log("saving last set of embeddings in localstorage, calib_rounds is n", calib_rounds);
                            saveNthRoundinLS(calib_rounds - 1);
                        }

//                                leftEyes_x.push(left);
//                                rightEyes_x.push(right);
//                                eyeCorners_x.push(tmpEyeCorn);
//                                faceGeom_x.push(faceGeom.getGeom());
//
//                                // Add y vars
//                                const nowVals = [X/windowWidth, Y/windowHeight];
//                                screenXYs_y.push(nowVals);
                    }
                } else if (stillsTaken >= num_ims_still){
                    p.fill(0, 121, 184); // Blue circle if all images taken (because of color blindness
                    p.ellipse( X, Y, radius, radius);
                    stillsDone = true
                }
            } else {
                console.log("collection done, starting training")

                // Reset canvas
                p.background( 150 );
                p.fill( 0, 121, 184 );
                p.stroke(255);
    -
                p.textSize(100);
                p.text('Training...', width/2, height/2);

    //            eyeSelfie(true); // called at the end of training as well
                calib_counter = 0

                trainNatureRegHead(leftEyes_x, rightEyes_x, eyeCorners_x,screenXYs_y);
                done_with_training = true;
                clearCheckpoints();

//                p.noLoop();
            }
        }
    }

    p.touchEnded = function (){
        if (stopped && stillsDone){
            stopped = false;
            stepsTaken = 0;
        } else if (done_with_training){
            window.location.href = "../";
        }
    };
};

let myp5 = new p5(s);


function checkpointTextify(){
    vects = tf.tidy(() => {
        // TODO: Check if new model's embeddings need to be regularized at all
        // First embeds, range up to 300
        // 2nd embeds, range up to 50~
        embeds0 = tf.concat(embeddings_x.map(x => x[0])).div(100)
        embeds1 = tf.concat(embeddings_x.map(x => x[1])).div(10)
        embeds2 = tf.concat(embeddings_x.map(x => x[2]))

        // Combine the embeddings horizontally, turn 8,4,2 into 14
        embeds = tf.concat([embeds0, embeds1, embeds2], 1);

        x_vect = tf.concat([embeds, tf.stack(eyeCorners_x), tf.stack(faceGeom_x)],1)

        // y_vect
        y_vect = tf.tensor(screenXYs_y, [screenXYs_y.length, 2])
        return [x_vect.arraySync(), y_vect.arraySync()];
    });

    return JSON.stringify(vects); // format is [x_vect, y_vect]
}

function cleanupAfterCheckpoint(){
    console.log(tf.memory());
    // x cleanup
    embeddings_x.forEach((elem) => {
        elem[0].dispose();
        elem[1].dispose();
        elem[2].dispose();
    });
    embeddings_x = [];

    eyeCorners_x.forEach((elem) => {
        elem.dispose()
    });

    faceGeom_x = [];

    // y cleanup
    screenXYs_y = [];
    console.log(tf.memory());
}

const strName = 'gazel_checkpoint';
function saveNthRoundinLS(n){
    strDataToAdd = checkpointTextify();

    if (n == 0){
        // If this is the first one, clear the checkpoints and set it
        localStorage.removeItem(strName);
        localStorage.setItem(strName, JSON.stringify([strDataToAdd]));
    } else{
        // Otherwise, add the string to the list of strings of data
        const tmp = JSON.parse(localStorage.getItem(strName));
        tmp.push(strDataToAdd);
        localStorage.setItem(strName, JSON.stringify(tmp));
    }

    cleanupAfterCheckpoint();
}

function clearCheckpoints(){
    localStorage.removeItem(strName);
}

function howManyCheckpoints(){
    let tmp = JSON.parse(localStorage.getItem(strName));
    if (tmp != null){ // if we have old checkpoints
        return tmp.length
    }
    return 0;
}

function retrieveRoundsAsArrays(){
    let tmp = JSON.parse(localStorage.getItem(strName));
    if (tmp != null){
        // if we have old checkpoints load them as arrays
        tmp.forEach((elem, ind) => {
            tmp[ind] = JSON.parse(elem);
        });
        return tmp
    }
}
