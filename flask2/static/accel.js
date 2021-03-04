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
var angaccel_short_history = [[], [], []];
var linaccel_short_history = [[], [], []];

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
var histLen = updateRate*1.5;

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
//                console.log(e)
                // Linear accel
                let linac = e.acceleration;
                updateTextLin(linac.x,linac.y,linac.z);
                linaccel_short_history[0].push(linac.x);
                linaccel_short_history[1].push(linac.y);
                linaccel_short_history[2].push(linac.z);




                // Angular Accel
                let rot = e.rotationRate
                updateTextRot(rot.alpha, rot.beta, rot.gamma)
                angaccel_short_history[0].push(rot.alpha)
                angaccel_short_history[1].push(rot.beta)
                angaccel_short_history[2].push(rot.gamma)
                if (angaccel_short_history[0].length > histLen){
                    angaccel_short_history.forEach(elem => {
                        elem.shift();
                    });
                    linaccel_short_history.forEach(elem =>{
                        elem.shift();
                    })
                }

                // Overall logging for eval
                if (typeof(trackingOn) != "undefined" && trackingOn){
                    track_accel_gyro[0][0].push(rot.alpha);
                    track_accel_gyro[0][1].push(rot.beta);
                    track_accel_gyro[0][2].push(rot.gamma);

                    track_accel_gyro[1][0].push(linac.x);
                    track_accel_gyro[1][1].push(linac.y);
                    track_accel_gyro[1][2].push(linac.z);
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
//                console.log("rotate", rotateDegrees);


                if (orient_short_history[0].length > histLen){
                    orient_short_history.forEach(elem => {
                        elem.shift();
                    });
                }
                // Logging for eval
                if (typeof(trackingOn) != "undefined" && trackingOn){
                    track_accel_gyro[2][0].push(rotateDegrees);
                    track_accel_gyro[2][1].push(frontToBack);
                    track_accel_gyro[2][2].push(leftToRight);
                }
            }, true);

            // Hide button if granted permissions
            document.getElementById("accelPermsButton").setAttribute("hidden", true);
    }}).catch(console.error)
}

var acc2 = [0,0,0];
var slow2 = 0.1;
function updateTextLin(x,y,z){
    acc2[0] += (x-acc2[0])*slow2;
    acc2[1] += (y-acc2[1])*slow2;
    acc2[2] += (z-acc2[2])*slow2;

    const elem = document.getElementById("curAccRate")
    if (elem != null){
        elem.innerHTML = "X Accel: " + acc2[0] + "<br>" +
                         "Y Accel: " + acc2[1] + "<br>" +
                         "Z Accel: " + acc2[2];
    }
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


/////////////////////////////////////// Accelerometer gesture detection for evaluation pages
var gestureNames = ["Forward flick", "Right flick", "Right tilt", "Left flick", "Left tilt", "Pull close", "Push away", "Turn to right", "Turn to left"];

// remove duplicate elements from array
function arrayCondenser(arr){
    newArr = [arr[0]];
    for (let i = 1; i < arr.length; i++){
        if (arr[i] != arr[i-1]){ // If it's different, add it
            newArr.push(arr[i]);
        }
    }
    return newArr;
}

    // find the angle difference w/r/t the first element and remove duplicates
function modmod(a, n){ return a - Math.floor(a/n) * n }
function historyToCondensed(fullhist, threshold){
    // Find recent difference with past measurement
    diffs = fullhist.slice(fullhist.length/2);
    first_elem = fullhist[0];
    diffs.forEach((elem, i) => {
//      angle rotation math
        a = elem - first_elem;
        a = modmod((a + 180), 360) - 180;
        diffs[i] = a;
    });

    // "binarize" differences and remove duplicates
    diff_classes = [];
    diffs.forEach((elem) => {
        diff_classes.push(elem > threshold ? 1 : (elem < -threshold ? -1 : 0));
    });
    condensed = arrayCondenser(diff_classes);
    return condensed;
}

function accelArrayHandler(accel_history){
    // Make a copy so it won't shift as we're modifying it
    leftright_hist = accel_history[0].slice();
    backfront_hist = accel_history[1].slice();
    pageturn_hist = accel_history[2].slice();

    // threshold and remove duplicates
    let thresh = 30
    lr_condensed = historyToCondensed(leftright_hist, thresh);
    bf_condensed = historyToCondensed(backfront_hist, thresh);
    page_condensed = historyToCondensed(pageturn_hist, thresh*1.5);

    return [lr_condensed, bf_condensed, page_condensed]
}

function classify_leftright(condensed){
//    console.log("Left right condensed", condensed);
    tmp = JSON.stringify(condensed);

    lef_tilt = tmp == "[1]";
    lef_flick = tmp == "[0,1,0]";
    right_flick = tmp == "[0,-1,0]";
    right_tilt = tmp == "[-1]";
     // If no normal gestures, make sure it's steady before returning 0
    if ((lef_tilt + lef_flick + right_flick + right_tilt) == 0){
        return (tmp != "[0]")*99
    }

    return lef_tilt*-2 + lef_flick*-1 + right_flick*1 + right_tilt*2;
}

function classify_backfront(condensed){
    tmp = JSON.stringify(condensed);

    front_dip = tmp == "[0,1,0]";
    back_dip = tmp == "[0,-1,0]";

    // If no normal gestures, make sure it's steady before returning 0
    if ((front_dip + back_dip) == 0){
        return (tmp != "[0]")*99
    }
    return front_dip*1 + back_dip*-1 ;
}

function classify_pageturn(condensed){
//    console.log("page turn condensed", condensed);
    tmp = JSON.stringify(condensed);

    turn_to_right = tmp == "[0,1,0]";
    turn_to_left = tmp == "[0,-1,0]";

    // If no normal gestures, make sure it's steady before returning 0
    if ((turn_to_right + turn_to_left) == 0){
        return (tmp != "[0]")*99
    }

    return turn_to_right*1 + turn_to_left*-1 ;
}

/////////////////////////////////////// Push pull gesture detection - uses linear accel
function headsizeToGesture(head_hist, threshold){
    // Get recent ratios to old head size
    headsizeHistLen = 1/2;
    diffs = head_hist.slice(head_hist.length*headsizeHistLen);
    first_elem = head_hist[0];
    diffs.forEach((elem, i) => {
        diffs[i] = elem/first_elem;
    });

    // Threshold by ratio
    diff_classes = [];
    diffs.forEach((elem) => {
        diff_classes.push(elem > threshold ? 1 : (elem < 1/threshold ? -1 : 0));
    });
    condensed = arrayCondenser(diff_classes);

    // Debug: Show max - min linear accels from a small snippet from the middle and end
    shortLen = 10
    let linacc_len = linaccel_short_history[0].length;
    diff = (sum(linaccel_short_history[2].slice(linacc_len-shortLen)) - sum(linaccel_short_history[2].slice(linacc_len*headsizeHistLen, linacc_len*headsizeHistLen+shortLen)))/shortLen
//    console.log("headsize condensed", condensed)
//    console.log("Diff:", diff)

    // classify the head gesture
    let tmp = JSON.stringify(condensed);
    pull = (tmp == "[1]");
    push = (tmp == "[-1]");

    // Check if the linear accel is up for the z axis (into the phone)
    if (!pull && !push){
        if (Math.abs(diff) > 1.5){ // May need to adjust here
            pull = (tmp == "[0,1]");
            push = (tmp == "[0,-1]");
        }
    }

    // If no normal gestures, make sure it's steady before returning 0
    if ((pull + push) == 0){
        return (tmp != "[0]")*99
    }
    return pull*1 + push*-1;
}