// New eval that tests both gestures and eye tracking

var gestureNames = ["Forward flick", "Right flick", "Right tilt", "Left flick", "Left tilt", "Pull", "Pull close, then push back"];
var trialStarted


function createGalleryElems(){
    // Create the container that holds all the elements
    galleryDiv = document.createElement("div");
    galleryDiv.classList.toggle("galleryContainer");
    document.body.append(galleryDiv);

    // Add all images to the page
    galleryElements = [];
    elemsClicked = [];
    elemsFilters = [];

    for (let i = 0; i<8; i++){
        im_container = document.createElement("div");
        im_container.classList.toggle("wackdiv");
        im_container.style.backgroundColor = divColors[i];

        a = document.createElement('div')
        a.classList.toggle("wackdivtext");
        a.innerText = (i%2)*4 + Math.trunc(i/2) + 1;
        im_container.append(a)

        galleryDiv.append(im_container);
        galleryElements.push(im_container);
        elemsClicked.push(false);
        elemsFilters.push(0);
    }

    // debug variables
    a = galleryDiv
}

function toggleHide(){
    galleryDiv.hidden = !galleryDiv.hidden;
}

var cur;
var origScroll;
var heightBounds;
function newEvalGrid(){
    if (typeof(curPred) == 'undefined' || !AccelStarted){
        console.log("curPred undefined or accel no started, image gallery restarting")
        setTimeout(newEvalGrid, 500);
        return;
    }
    console.log("image gallery starting")

//    // temporary, while I'm debugging CSS stuff
//    stopFacemesh = true;

    // Focus on window automatically
    window.focus();
    window.scrollTo(0,1);

    // Set up trial starting condition (click)
    document.body.onclick = () => {
        if (curPred != undefined && AccelStarted){
            startTrial();
        }
    };

    // Populate the screen with the boxes, and hide them
    createGalleryElems();
    toggleHide();

    startTrial();
    cur = galleryElements[0]; // debuggery
}


/////////////////////////////////////// Eye tracking
function gaze2Section(gaze_pred){
    actualX = window.scrollX + gaze_pred[0]*innerWidth;
    actualY = window.scrollY + gaze_pred[1]*innerHeight;

    // Generate the top and bottom bounds of one elem in each row
    heightBounds = [0.0];
    for (let i = 2; i < galleryElements.length; i += 2){
        heightBounds.push(galleryElements[i].offsetTop);
    }

    let row;
    heightBounds.forEach((elem, ind) => {
        if (actualY > elem){
            row = ind;
        }
    });

    let col = actualX < Math.trunc(window.innerWidth/2) ? 0 : 1

    // Calculate the section number and return it
    let section = col*4 + row + 1
    return section
}

// Function that starts trials from clean slate, and resets variables
function startTrial(){
    // Set up trial time variables
    trial_time = 10000; // timeout variable in ms
    trial_delay = 100
    lastsecHistoryLen = 1000/trial_delay;
    num_repeats = trial_time*(lastsecHistoryLen);
    repeat_counter = 0;


//    TODO: clear the accel history and gyro history before starting.
    // But not clear clear, just duplicate the last reading length times
    head_size_history = [];
    localPreds = [];
//    orient_short_history[0] and [1]

    // Generate which trial is next, display it in trialdisplay
    textElem = document.getElementById("trialdisplay");
    textElem.hidden = false;
    targetGesture = Math.trunc(Math.random()*7)
    targetSquare = Math.trunc(Math.random()*8)

    textElem.innerHTML = "";
    textElem.innerHTML += "Next trial:";
    textElem.innerHTML += "<br>Target gesture: " + gestureNames[targetGesture];
    textElem.innerHTML += "<br>Target square: " + (targetSquare+1);

        // Start the trial after showing user target info
    setTimeout(() => {
        console.log("Trial started, targets:", gestureNames[targetGesture], (targetSquare+1));
        textElem.hidden = true;
        toggleHide();
        trialLoop(num_repeats, [targetGesture, targetSquare]);
    }, 3000);
}

// Main loop of the trial running gesture detection and eye segmentation
function trialLoop(max_repeats, targets){
   // Accel gesture detection
    condensed_arrays = accelArrayHandler(orient_short_history);
    leftrightgesture = classify_leftright(condensed_arrays[0]);
    bfgesture = classify_backfront(condensed_arrays[1]);
    gyro_steady = (leftrightgesture == 0) && (bfgesture == 0);

    // head pose gesture detection
    let pushpullgesture = 0;
    if (gyro_steady && prediction.faceInViewConfidence > .85){
//        let cur_face_geom = faceGeom.getGeom();
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
        eye_segment = gaze2Section(curPred);
        localPreds.push(eye_segment);
        if (localPreds.length > lastsecHistoryLen){
            localPreds.shift();
        }

        console.log(localPreds); // debugging eye tracking as phone moves
    } else{
        console.log("not steady");
    }


    all_gestures = [leftrightgesture, bfgesture, pushpullgesture];
    // If all gestures is not all 0 and has no 99s (unsteady), a gesture is detected
    if (!all_gestures.every(elem => elem == 0) && all_gestures.every(elem => elem != 99)){
        console.log("all eyes:")
        console.log(localPreds.slice(3));
        segmentPrediction = getModeEyeSegment(localPreds.slice(3))
        console.log("all gestures + eyes", all_gestures,segmentPrediction); // take not most recent, but a few ago.
        trialEndHandler([all_gestures, segmentPrediction], targets);
    } else{
        repeat_counter += 1;
        if (repeat_counter < max_repeats){
            setTimeout(() => trialLoop(max_repeats, targets), trial_delay);
        } else{
            // Reset the counter, hide all the squares
            repeat_counter = 0;
            toggleHide();
            return;
        }
    }
}

//function trialEndHandler(gestures, segment){
function trialEndHandler(actual, target){ // Both in [gestures, segment] format

    // Show text box
    toggleHide();
    textElem = document.getElementById("trialdisplay");
    textElem.hidden = false;

    // Show actual text
    gestures = actual[0];
    segment = actual[1];
    let displayText = "";

    if (gestures[1] == -1){ // forward flick
        displayText = "Forward flick";
    } else if (gestures[0] == 1){ // right flick
        displayText = "Right flick";
    } else if (gestures[0] == 2){ // right tilt
        displayText = "Right tilt";
    } else if (gestures[0] == -1){ // left flick
        displayText = "Left flick";
    } else if (gestures[0] == -2){ // left tilt
        displayText = "Left tilt";
    } else if (gestures[2] == 1){ // Pull
        displayText = "Pull";
    } else if (gestures[2] == -1){ // pull, then push
        displayText = "Pull close, then push back";
    }
    textElem.innerHTML = "";
    textElem.innerHTML += "Detected gesture and gaze location:</h5>"
    textElem.innerHTML += "<br>Gesture: " + displayText;
    textElem.innerHTML += "<br>Gaze segment: " + segment;

    // Show target text
    textElem.innerHTML += "<br><br>";
    textElem.innerHTML += "Target gesture and segment:"
    textElem.innerHTML += "<br>Gesture: " + gestureNames[target[0]]
    textElem.innerHTML += "<br>Gaze segment: " + (target[1]+1);


}

/////////////////////////////////////// Accelerometer gesture detection
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

// Find mode of the segments history
function getModeEyeSegment(arr){
    let hist = Array(8).fill(0);
    arr.forEach((elem) => {
        hist[elem-1] += 1;
    });

    mode = hist.map((x, i) => [x, i]).reduce((r, a) => (a[0] > r[0] ? a : r))[1] + 1;
    return mode;
}

    // find the angle difference w/r/t the first element and remove duplicates
function modmod(a, n){ return a - Math.floor(a/n) * n }
function historyToCondensed(fullhist, threshold){
    // Find recent difference with past measurement
    diffs = fullhist.slice(fullhist.length/4);
    diffs.forEach((elem, i) => {
//      angle rotation math
        a = elem - fullhist[0];
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

    // threshold and remove duplicates
    lr_condensed = historyToCondensed(leftright_hist, 30);
    bf_condensed = historyToCondensed(backfront_hist, 30);

    return [lr_condensed, bf_condensed]
}

function classify_leftright(condensed){
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

/////////////////////////////////////// Push pull gesture detection
function headsizeToGesture(head_hist, threshold){
    // Get recent ratios to old head size
    diffs = head_hist.slice(head_hist.length/4);
    diffs.forEach((elem, i) => {
        diffs[i] = elem/head_hist[0];
    });

    // Threshold by ratio
    diff_classes = [];
    diffs.forEach((elem) => {
        diff_classes.push(elem > threshold ? 1 : (elem < 1/threshold ? -1 : 0));
    });

    condensed = arrayCondenser(diff_classes);

    // classify the head gesture
    let tmp = JSON.stringify(condensed);
    pull = (tmp == "[1]");
    pullpush = (tmp == "[0,1,0]");

    // If no normal gestures, make sure it's steady before returning 0
    if ((pull + pullpush) == 0){
        return (tmp != "[0]")*99
    }
    return pull*1 + pullpush*-1;
}




divColors = [
    "#ef90c1",
    "#ef9186",
    "#e94b95",
    "#eb624d",
    "#bb2d6b",
    "#d63422",
    "#801e48",
    "#9c2517"
]
