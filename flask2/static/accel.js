//
var AccelStarted = false;

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
var angaccel_short_history = [[], [], []];

// Convenience functions for arrays
var average = (array) => array.reduce((a, b) => a + b) / array.length;
var sum = (array) => array.reduce((a, b) => a + b);

// Display dot variables
var px = 50;
var py = 50;
var vx = 0.0;
var vy = 0.0;
var bounds = [2, 98];
var updateRate = 60;

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
            AccelStarted = true;
            console.log("accel perms granted")
            let tmp = document.getElementById("accelPerms");
            if (tmp != null){
                document.getElementById("accelPerms").innerHTML = "accel perms granted";
            }

//            // Accelerometer permissions
            window.addEventListener('devicemotion', (e) => {
                // do something with e
//                          console.log(e)
                let rot = e.rotationRate
                updateTextRot(rot.alpha, rot.beta, rot.gamma)

                angaccel_short_history[0].push(rot.alpha)
                angaccel_short_history[1].push(rot.beta)
                angaccel_short_history[2].push(rot.gamma)
                if (angaccel_short_history[0].length > updateRate){
                    angaccel_short_history.forEach(elem => {
                        elem.shift();
                    });
                }
            })

            // Magnetometer permissions
            window.addEventListener("deviceorientation", function(event) {
                // alpha: rotation around z-axis
                rotateDegrees = event.alpha;
                frontToBack = event.beta;
                leftToRight = event.gamma;

                updateText(rotateDegrees, frontToBack, leftToRight);

                // Add the angles to short history
                orient_short_history[0].push(rotateDegrees)
                orient_short_history[1].push(frontToBack)
                orient_short_history[2].push(leftToRight)
//                console.log(orient_short_history[0]);
//                console.log(rotateDegrees);

                if (orient_short_history[0].length > updateRate){
                    orient_short_history.forEach(elem => {
                        elem.shift();
                    });
                }
            }, true);

            // Hide button if granted permissions
            document.getElementById("accelPermsButton").setAttribute("hidden", true);
    }}).catch(console.error)
}


function orientationCheckContinuous(){
    for (let i=0; i< 3; i++){
        orient_long_history[i].push(average(orient_short_history[i]))
        orient_short_history[i] = [];
    }

    //
//    if (orient_long_history)



    setTimeout(orientationCheckContinuous, 500);
}


var acc = [0, 0, 0];
var slow = .01;
function updateTextRot(a, b, g){
    acc[0] += (a-acc[0])*slow;
    acc[1] += (b-acc[1])*slow;
    acc[2] += (g-acc[2])*slow;

    const elem = document.getElementById("curRotRate")
    if (elem != null){
        elem.innerHTML = "z rrate: " + acc[0] + "<br>" +
                "front2back rrate: " + acc[1] + "<br>" +
                "left2right rotate rat: " + acc[2];
    }
}

function updateText(alpha, beta, gamma){
    // Calculate difference from baseline for each angle
    z_delta = (alpha-Z_baseline);
    fb_delta = (beta-FB_baseline);
    lr_delta = (gamma-LR_baseline);

    // Set text indicators of orientation angles

    const elem = document.getElementById("curOrientation")
    if (elem != null){
        elem.innerHTML = "z rotation: " + z_delta + "<br>" +
                "front to back: " + fb_delta + "<br>" +
                "left to right: " + lr_delta;
    }
}