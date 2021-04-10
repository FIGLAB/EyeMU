// Set up trial time variables
var trial_delay = 100 // loop delay in ms
var lastsecHistoryLen = 1200/trial_delay;

// Gesture detection
var firstGest = -1;
var firstGaze = -1;

var head_size_history = [];
var localPreds = [];
var eyeXY;


var minGestWaitTime = 500;
var gestTime = performance.now();
var lastGestTime = performance.now();
var lastGesture = -1;

// Main loop of the trial running gesture detection and eye segmentation
function liveloop(){
    // If no curPred, restart yourself
    if (typeof(curPred) == "undefined"){
        console.log("live loop failed in livegestandgaze, restarting");
        setTimeout(liveloop, 500);
        return;
    }

    /////////////////////////////// Accel, head, and eye tracking
   // Accel gesture detection
    condensed_arrays = accelArrayHandler(orient_short_history);
    leftrightgesture = classify_leftright(condensed_arrays[0]);
    bfgesture = classify_backfront(condensed_arrays[1]);
    pageturngesture = classify_pageturn(condensed_arrays[2])

    gyro_steady = (leftrightgesture == 0) && (bfgesture == 0) && (pageturngesture == 0);
    // head pose gesture detection
    let pushpullgesture = 0;
    if (gyro_steady && prediction.faceInViewConfidence > .85){
        let cur_head_size = faceGeom.getGeom()[3];

        head_size_history.push(Math.sqrt(cur_head_size))
        if (head_size_history.length > lastsecHistoryLen){
            head_size_history.shift();
        }

        pushpullgesture = headsizeToGesture(head_size_history, 1.15);
    }
    head_steady = (pushpullgesture == 0);
    // Update eye tracking only when stable -- there's a little steady delay though
    if (gyro_steady && head_steady){
        localPreds.push([...curPred]);
        if (localPreds.length > lastsecHistoryLen){
            localPreds.shift();
        }
        eyeXY = getMeanEyeXY(localPreds.slice(3));
    }

    /////////////////////////////// Gesture detection
    all_gestures = [leftrightgesture, bfgesture, pushpullgesture, pageturngesture];
//    hist = [localPreds, orient_short_history, head_size_history, angaccel_short_history];
    // If all gestures is not all 0 and has no 99s (unsteady), a gesture is detected. Log it
    if (!all_gestures.every(elem => elem == 0 || elem == 99) && (sum(all_gestures) < 120)){
        gestTime = performance.now();

        gestAndName = gestureClassifier(all_gestures.slice());
//        eyeXY = getMeanEyeXY(localPreds.slice(3)) // Averaging predicted gaze XYs

        // Wait a bit after each gesture is detected to go again
        if (gestTime-lastGestTime > minGestWaitTime){
            lastGestTime = gestTime;
            lastGesture = gestAndName[0];

            console.log("Gesture Prediction: ", gestAndName[1]);
        }
    }

    setTimeout(() => liveloop(), trial_delay);
}

//function trialEndHandler(gestures, segment){
function gestureClassifier(gestHist){ // Both in [gestures, segment] format
    // Show detected text
    gestures = gestHist;
    detectedGesture = -1;


    // Get angular acceleration to case on which flicks gesture is being done
    angaccel = angaccel_short_history.map((arr) => arr.slice());
    const aa_hist_max = angaccel.map((histArr) => Math.max(...histArr.slice(histArr.length/4)))
    const aa_hist_min = angaccel.map((histArr) => Math.min(...histArr.slice(histArr.length/4)))
    const gap = [aa_hist_max[0] - aa_hist_min[0],
                 aa_hist_max[1] - aa_hist_min[1],
                 aa_hist_max[2] - aa_hist_min[2]];
    const gapAbs = [aa_hist_max[0] + aa_hist_min[0],
                 aa_hist_max[1] + aa_hist_min[1],
                 aa_hist_max[2] + aa_hist_min[2]];

    // Check for tilts, then for flicks case on which axis had highest angular accel,
    // then pull and push. Should also add page turn
    maxAccelAxis = argMax(gap);

    if (gestures[0] == -2){ // left tilt
        detectedGesture = 4;
    } else if (gestures[0] == 2){ // right tilt
        detectedGesture = 2;
    } else if (gestures[2] == 1){ // Pull
        detectedGesture = 5;
    } else if (gestures[2] == -1){ // Push away
        detectedGesture = 6;
    } else { // Flick detection
        switch(maxAccelAxis){
            case 0: // Forward
                if (gestures[1] == -1){
                    detectedGesture = 0;
                    break;
                }
            case 1: // Page turns
                if (gestures[3] == 1){
                    detectedGesture = 7;
                    break;
                } else if (gestures[3] == -1){
                    detectedGesture = 8;
                    break;
                }
            case 2: // Right and left flick
                if (gestures[0] == 1){
                    detectedGesture = 1;
                    break;
                } else if (gestures[0] == -1){
                    detectedGesture = 3;
                    break;
                }
        }
      }

    // Debug output to console
//    console.log("Gaze Prediction: ", segment);
//    let displayText = gestureNames[detectedGesture];
    return [detectedGesture, gestureNames[detectedGesture]];
}

// Get average of all recent eye positions then threshold it
function getMeanEyeXY(arr){
    acc = [0,0]
    arr.forEach((elem) =>{
        acc[0] += elem[0];
        acc[1] += elem[1];
    });
    acc[0] /= arr.length;
    acc[1] /= arr.length;

    return acc;
}

function argMax(array) {
  return array.map((x, i) => [x, i]).reduce((r, a) => (a[0] > r[0] ? a : r))[1];
}
