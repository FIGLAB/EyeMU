//

// Orientation-exposing angles
var rotateDegrees;
var frontToBack;
var leftToRight;

// Storing orientation baseline angles
var Z_baseline = 0;
var FB_baseline = 0;
var LR_baseline = 0;
var thresh = 15;


// tracking accel over time: Z, FB, LR
var orient_short_history = [[], [], []];
var orient_long_history = [[], [], []];

// Convenience functions for arrays
var average = (array) => array.reduce((a, b) => a + b) / array.length;
var sum = (array) => array.reduce((a, b) => a + b);

// Display dot variables
var px = 50;
var py = 50;
var vx = 0.0;
var vy = 0.0;
var bounds = [2, 98];
var updateRate = 1/60;

function zeroAccel(){
    Z_baseline = rotateDegrees;
    FB_baseline = frontToBack;
    LR_baseline = leftToRight;

    px = 50;
    py = 50;
    vx = 0;
    vy = 0;
}

function getAccel(){
    DeviceMotionEvent.requestPermission().then(response => {
        if (response == 'granted') {
            console.log("accel perms granted")
            document.getElementById("accelPerms").innerHTML = "accel perms granted";

//            // Accelerometer permissions
//            window.addEventListener('devicemotion', (e) => {
//                // do something with e
//                //          console.log(e)
//            })

            // Magnetometer permissions
            window.addEventListener("deviceorientation", function(event) {
                // alpha: rotation around z-axis
                rotateDegrees = event.alpha;
                frontToBack = event.beta;
                leftToRight = event.gamma;

                updateBallAndText(rotateDegrees, frontToBack, leftToRight);

                // Add the angles to short history
                orient_short_history[0].push(rotateDegrees)
                orient_short_history[1].push(frontToBack)
                orient_short_history[2].push(leftToRight)
            }, true);

            // Hide button if granted permissions
            document.getElementById("accelPermsButton").setAttribute("hidden", true);

            // Run history function
            orientationCheckContinuous();
    }}).catch(console.error)
}


function orientationCheckContinuous(){
    for (let i=0; i< 3; i++){
        orient_long_history[i].push(average(orient_short_history[i]))
        orient_short_history[i] = [];
    }

    //
    if (orient_long_history)



    setTimeout(orientationCheckContinuous, 500);
}


function updateBallAndText(alpha, beta, gamma){
    // Calculate difference from baseline for each angle
    z_delta = (alpha-Z_baseline);
    fb_delta = (beta-FB_baseline);
    lr_delta = (gamma-LR_baseline);

    // Set text indicators of orientation angles
    document.getElementById("curOrientation").innerHTML =
                "z rotation: " + z_delta + "<br>" +
                "front to back: " + fb_delta + "<br>" +
                "left to right: " + lr_delta;

    // Show text indicators of orientation positions
    document.getElementById("dotLocation").innerHTML =
         (z_delta > thresh ? "Counterclockwise" : z_delta < -thresh ? "Clockwise" : "Centered") + "<br>" +
         (fb_delta > thresh ? "Backwards" : fb_delta < -thresh ? "Forward" : "Centered") + "<br>" +
         (lr_delta > thresh ? "Right tilt" : lr_delta < -thresh ? "Left tilt" : "Centered");

    // Update velocity
    vx = vx + lr_delta*updateRate*2;
    vy = vy + fb_delta*updateRate;


    // Update position and clip it to bounds
    px = px + vx*.5;
    if (px > bounds[1] || px < bounds[0]){
        px = Math.max(bounds[0], Math.min(bounds[1], px))
        vx = 0;
    }


    py = py + vy*.5;
    if (py > bounds[1] || py < bounds[0]){
        py = Math.max(bounds[0], Math.min(bounds[1], py))
        vy = 0;
    }

    ind_dot = document.getElementsByClassName("predicdot")[0]
    ind_dot.setAttribute('style', "left:" + (px) + "%;" +
                                  "top:" + (py) + "%;"
                        );
}