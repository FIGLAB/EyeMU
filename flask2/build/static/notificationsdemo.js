showPredictDot = false;


const s = ( p ) => {
    // Setup the Processing Canvas
    windowWidth = p.windowWidth;
    windowHeight = p.windowHeight*.999;

    let width = windowWidth;
    let height = windowHeight;
    console.log("processing width and height", width, height);

    var instr_w = width/2
    var instr_h = height/5
    var instr_x = windowWidth/2 - instr_w/2;
    var instr_y = 7*windowHeight/10 - instr_h/2;

 // text drawn at width/2, 2*height/5

    p.setup = function (){
        var canv = p.createCanvas(windowWidth, windowHeight);
        canv.parent("p5jscanvasholder");

        p.strokeWeight( 1 );
        p.frameRate(60);

                    // Create the waypoints for the target dot to follow
        let w_op = [width/20, width/2, width*19/20];
        let h_op = [height/40, height/2, height*39/40];
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
        stillsTaken = 0;
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
        // Fill canvas same as background, Set fill-color to blue, and make stroke-color white
        p.background(240, 248, 255);
        p.fill( 0, 60, 90 );
        p.stroke(255);

        window.scrollBy(0,-1000); // Keep phone scrolled to bottom of page.

        if (done_with_training){
            p.textSize(30);
            p.text("\nTraining completed, tap to return to homepage", width/2, height/2);
            p.noLoop();
            return;
        }


        // Draw circle, with gradually oscillating radius
        p.fill(194, 21, 2); // dark red
        radius = radius + sin( p.frameCount / 8 )
        if (currentlyCollecting){
            p.fill(194, 21, 2);
            arbPoly(X,Y,constRadius/2, 8);
        } else{
            //////////////////// Notify user of the round
            p.textAlign(p.CENTER, p.CENTER);
            p.textSize(45);
            p.fill( 0, 101, 150 );
            if (calib_rounds < n_calib_rounds){
                // If we're in the center, show instructions on screen and send an alert
                if (calib_counter % nx_arr.length == 0 && movingsTaken == 0){
//                    p.text("\n\n" + instructions[calib_rounds], width/2, 2*height/5)
//                    if (calib_rounds < instructions_imgs.length){
//                        p.image(instructions_imgs[calib_rounds], instr_x, instr_y, instr_w, instr_h)
//                    }
                }

                p.text("Personalization Wizard\nInstructions: Track the ball with your eyes. \nWhen it turns blue, you're safe to blink.", width/2, height/5)
                p.text("Round: " + (calib_rounds+1) + "/" + n_calib_rounds + "\nTap to advance",
                            width/2,
                            height - (height - (instr_y + instr_h))/2 - 100)
            } else if (stillsDone){
                // Start training automatically
                stopped = false;
                p.text("\n\n\nTap to start training", width/2, 3*height/5);
            }
            p.fill(0, 121, 184); // Blue circle if all images taken (because of color blindness
            p.ellipse( X, Y, radius, radius);
        }

        if (rBB != undefined ){ // if the face has been detected, start the data collection
            // Unless eyes are too far off screen
            eyeExtremesX = lBB.slice(0,2).concat(rBB.slice(0,2))
            eyeExtremesY = lBB.slice(2,4).concat(rBB.slice(2,4))

            eyeExtremesX = eyeExtremesX.map(elem => elem/videoWidth)
            eyeExtremesY = eyeExtremesY.map(elem => elem/videoHeight)
            const margin = 0.025;


            // If the eyes are off-screen, notify the user and pause the collection
            if (Math.min(...eyeExtremesX) < margin*2 || Math.max(...eyeExtremesX) > (1.0 - margin*2) ||
                Math.min(...eyeExtremesY) < margin || Math.max(...eyeExtremesY) > (1.0-margin)){
                p.fill(255, 20, 20);
                p.ellipse( X, Y, radius, radius );
                p.text("Eyes are off-camera! \nData collection paused.", width/2, 3*height/5);
            } else if ((calib_rounds < n_calib_rounds) && !stopped){
                // Show that images are being taken before XY increments
                p.textSize(20);
//                p.fill(194, 21, 2);
//                arbPoly(X,Y,constRadius/2, 8);
                currentlyCollecting = true;
                p.fill(255,255,255);
                p.text(num_ims_along_line-movingsTaken, X, Y);
//                p.text(movingsTaken, X, Y);


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
                    // Store the last set of embeddings, eyeCorners, and head geoms
                    if (calib_counter % nx_arr.length == 0){
                        console.log("saving last set of embeddings in localstorage, calib_rounds is n", calib_rounds);
                        saveNthRoundinLS(calib_rounds - 1);
                        location.reload();
                    }


                    X = nx_arr[calib_counter % nx_arr.length];
                    Y = ny_arr[calib_counter % nx_arr.length];
                    nX = nx_arr[(calib_counter+1) % nx_arr.length];
                    nY = ny_arr[(calib_counter+1) % nx_arr.length];

                    // Moves faster in the y direction, but whatever. Too hard to fix
                    moveAmountPerFrame = [(nX-X)/numSteps , (nY-Y)/numSteps];
                    stopped = true;
                    stillsDone = false;
                    stillsTaken = 0;
                    user_readyforstills = false;
                }
            } else if (stopped){ // taking stills
                movingsTaken = 0;
                if (stillsTaken < num_ims_still && user_readyforstills){
                    if (p.frameCount % 3 == 0){ // take screenshot every N frames
                        eyeSelfie(false);
                        console.log("eyeSelfie at corner");
                        stillsTaken += 1;
                    } // Write number of photo and draw circle going around
                    p.textSize(20);
//                    p.fill(194, 21, 2);
//                    arbPoly(X,Y,constRadius/2, 8);
                    currentlyCollecting = true;
                    p.fill(255,255,255)
                    p.text(num_ims_still-stillsTaken, X, Y)

                    if (stillsTaken >= num_ims_still){
//                        p.fill(0, 121, 184); // Blue circle if all images taken (because of color blindness
//                        p.ellipse( X, Y, radius, radius);
                        currentlyCollecting = false;
                        stillsDone = true
                    }
                } else {
//                    p.fill(0, 121, 184); // Blue circle if all images taken (because of color blindness
//                    p.ellipse( X, Y, radius, radius);
                    currentlyCollecting = false;
                }
            } else {
                console.log("collection done, starting training")
                calib_counter = 0

                trainNatureRegHead(leftEyes_x, rightEyes_x, eyeCorners_x,screenXYs_y);
                done_with_training = true;

                downloadResultsFromKey(strName);
                clearCheckpoints();
            }
        }
    }

    p.touchEnded = function (){
        if (stopped && stillsDone){w
            stopped = false;
            stepsTaken = 0;
        } else if (stopped && !user_readyforstills){
            user_readyforstills = true;
        } else if (done_with_training){
            window.location.href = "../";
        }
    };

    function arbPoly(x, y, radius, npoints) {
      let angle = p.TWO_PI / npoints;
      p.beginShape();
      let start = 3.1415/8
      for (let a = start; a < (p.TWO_PI+start); a += angle) {
        let sx = x + cos(a) * radius;
        let sy = y + sin(a) * radius;
        p.vertex(sx, sy);
      }
      p.endShape(p.CLOSE);
    }
};








function notifStarter(){
    if (typeof(curPred) != 'undefined' || !AccelStarted){
        console.log("curPred undefined, notifs demo restarting")
        setTimeout(notifStarter, 400);
        return;
    }

    document.getElementById('accelbuttonholder').remove();
    let myp5 = new p5(s);
    console.log("Notif starting")

    // Remove ugly margin on edges of page. Small margins still exist oh well
    document.body.style.margin = "0px";
}



