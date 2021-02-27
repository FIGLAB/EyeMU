// New eval that tests both gestures and eye tracking
var trialStarted = false; // concurrency

var gestureHistories = [];
var exposeArrays;

// Square grid variables
var galleryNumbers = [];
var galleryElements = [];

// Trial nonrandom variables
var trialList;
// Set up trial time variables
var trial_time = 20; // timeout variable in seconds
var trial_delay = 100 // loop delay in ms
var lastsecHistoryLen = 1500/trial_delay;
var startWindowIndex = 2;
//var num_repeats = trial_time*(lastsecHistoryLen);
var trialStartTime;
var num_repeats = trial_time*1000 / trial_delay;

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
        galleryNumbers.push(a)
        im_container.append(a)

//        galleryDiv.append(im_container);
        galleryElements.push(im_container);
        elemsClicked.push(false);
        elemsFilters.push(0);
    }

    let yea = document.createElement("h1");
    yea.style.textAlign = "center";
    yea.style.lineHeight = "100%";
    yea.innerHTML = "&nbsp<br>&nbsp<br> Perform a gesture.";
    galleryDiv.append(yea);

    // Add button to download gesture data
    let tmpbut1 = document.createElement("button");
    tmpbut1.addEventListener('click', function(){
        var link = document.createElement('a');
        link.href = makeTextFile(JSON.stringify(gestureHistories));
        link.target = '_blank';
        link.download = "gazel_gesturetrainer.json";
        link.click();
    });
    tmpbut1.style.height = "40px";
    tmpbut1.innerHTML = "Download Results";

    // end trial button
        let tmpbut2 = document.createElement("button");
    tmpbut2.addEventListener('click', function(){
        gestureHistories.push(exposeArrays);
//        var link = document.createElement('a');
//        link.href = makeTextFile(JSON.stringify(gestureHistories));
//        link.target = '_blank';
//        link.download = "gazel_gesturetrainer.json";
//        link.click();
    });
    tmpbut2.style.height = "40px";
    tmpbut2.innerHTML = "End trial and log data";

    galleryDiv.append(tmpbut1);
    galleryDiv.append(tmpbut2);

    // debug variables
    a = galleryDiv
}

function resetGridColors(){
    i = 0;
    for (let div of galleryNumbers){
        div.style.color = "black";
//        div.style.backgroundColor = divColors[i];
        galleryElements[i].style.backgroundColor = "grey";
        i++;
        div.innerHTML = "&nbsp";
    }
}

var lookup = [1, 3, 5, 7, 2, 4, 6, 8];
function setGridTextColorWhite(square_num){
    ind = lookup[square_num-1];
    galleryNumbers[ind-1].style.color = "white";
}

function setGridColorAndText(square_num, text){
    ind = lookup[square_num-1];
    galleryElements[ind-1].style.backgroundColor = divColors[ind-1];
    galleryNumbers[ind-1].innerText = text;
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


    let instructions = document.getElementById('evalinstructions');
    instructions.innerHTML = "This page will detect gestures you make on the following page, then tell you what gesture it predicted."
    instructions.innerHTML += "<br><br>Tap to begin";


    // Set up trial starting condition (click) and removal of the button and instructions
    document.body.onclick = () => {
        if (typeof(curPred) != 'undefined' && AccelStarted && !trialStarted){
            document.getElementById('accelbuttonholder').remove();
            document.getElementById('evalinstructions').remove();

            startTrial();
            document.body.onclick = () => {
                if (typeof(curPred) != 'undefined' && AccelStarted && !trialStarted){
                    startTrial();
                } else if ((typeof(curPred) != 'undefined' && AccelStarted && trialStarted)){

                }
            };
        }
    };

    // Populate the screen with the boxes, and hide them
    createGalleryElems();
    toggleHide();

    // Create trialList if it doesn't exist yet
    if (!localStorage.getItem('trial_list')){

        // Construct the trials, shuffle them, then store them.
        let arr = [];
        for (let i = 0; i < gestureNames.length; i++){ // Gestures
            for(let j = 1; j <= 8; j++){ // "Quadrant"
                for (let k = 0; k < 2; k++){
                    arr.push([i,j]);
                }
            }
        }
        arr = shuffleArr(arr);

        strArr = JSON.stringify(arr);
        localStorage.setItem('trial_list', strArr)
        trialList = arr;
    } else{
        tmp = localStorage.getItem('trial_list');
        trialList = JSON.parse(tmp);
    }

//    startTrial();
    accelbuttonholder
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


// Find mode of the segments history
function getModeEyeSegment(arr){
    let hist = Array(8).fill(0);
    arr.forEach((elem) => {
        hist[elem-1] += 1;
    });

    mode = hist.map((x, i) => [x, i]).reduce((r, a) => (a[0] > r[0] ? a : r))[1] + 1;
    return mode;
}

// Get average of all recent eye positions then threshold it
function getMeanEyeSegment(arr){
    acc = [0,0]
    arr.forEach((elem) =>{
        acc[0] += elem[0];
        acc[1] += elem[1];
    });
    acc[0] /= arr.length;
    acc[1] /= arr.length;

    section = gaze2Section(acc)
    return section;
}


// Function that starts trials from clean slate, and resets variables
function startTrial(){
    trialStarted = true; // Make sure we don't start multiple trials

    // clear the accel history and gyro history before starting.
    // But not clear clear, just duplicate the last reading length times
    const latest = orient_short_history[0].length-1;
    orient_short_history = [1,2,3].map(
                    (elem, ind) => Array(histLen).fill(orient_short_history[ind][latest]));
    angaccel_short_history = [1,2,3].map((elem) => Array(histLen).fill(0))
    linaccel_short_history = [1,2,3].map((elem) => Array(histLen).fill(0))
    head_size_history = [];
    localPreds = [];


    // Generate which trial is next, display it in trialdisplay
    textElem = document.getElementById("trialdisplay");
    textElem.hidden = false;

    trialNum = (getLength('results') + 1) % trialList.length;

    targetGesture = trialList[trialNum][0];
    targetSquare = trialList[trialNum][1];

    textElem.innerHTML = "Starting...";

        // Start the trial after showing user target info
    // Delay start by less after a few trials
    delayedStart = 100;

    setTimeout(() => {
        // Hide trial instructions
//        console.log("Trial started, targets:", gestureNames[targetGesture], (targetSquare));
        textElem.hidden = true;

        // Show grid
        toggleHide();

        // Start trial loop
        trialStartTime = Date.now()
        trialLoop([targetGesture, targetSquare]);
    }, delayedStart);
}

// Main loop of the trial running gesture detection and eye segmentation
function trialLoop(targets){
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
            setGridTextColorWhite(targets[1]);
        }
    }

    /////////////////////////////// Gesture detection
    all_gestures = [leftrightgesture, bfgesture, pushpullgesture, pageturngesture];
    hist = [localPreds, orient_short_history, head_size_history, angaccel_short_history];
    exposeArrays = JSON.stringify([condensed_arrays, all_gestures, targets, hist])

//    gestureHistories.push(JSON.stringify([condensed_arrays, all_gestures, targets, hist]));

    console.log(all_gestures);
    // If all gestures is not all 0 and has no 99s (unsteady), a gesture is detected. Log it
    if (!all_gestures.every(elem => elem == 0 || elem == 99) && (sum(all_gestures) < 120)){
//    if (!all_gestures.every(elem => elem == 0) && all_gestures.every(elem => elem != 99)){
        segmentPrediction = getMeanEyeSegment(localPreds.slice(3)) // Averaging predicted gaze XYs

        console.log("Gaze Prediction: ", segmentPrediction);

        // Add to accel history
        //    condensed is lr, bf, then page turn
        //    detected [leftrightgesture, bfgesture, pushpullgesture, pageturngesture]
        //    target [targetgest, targetgaze;
        gestureHistories.push(JSON.stringify([condensed_arrays, all_gestures, targets, hist]));

        trialEndHandler([all_gestures, segmentPrediction], targets, hist);
    } else{
        if ((Date.now() - trialStartTime) > trial_time*1000){ // Timeout
            // Failed to detect gesture, but save eye position anyway
            segmentPrediction = getMeanEyeSegment(localPreds.slice(3))

            trialEndHandler([-1, segmentPrediction], targets, hist);
            return;
        } else{ // Otherwise, run the loop again
            setTimeout(() => trialLoop(targets), trial_delay);
        }
    }
}

function argMax(array) {
  return array.map((x, i) => [x, i]).reduce((r, a) => (a[0] > r[0] ? a : r))[1];
}

//function trialEndHandler(gestures, segment){
function trialEndHandler(detected, target, histories){ // Both in [gestures, segment] format

    // Show text box and download results button
    toggleHide();
    textElem = document.getElementById("trialdisplay");
    textElem.hidden = false;
    textElem.innerHTML = "Trial Complete<br>Tap to continue<hr><br>";



    if (detected[0] == -1){ // If no gesture triggered (timed out)
    } else{
        // Show detected text
        gestures = detected[0];
        segment = detected[1];
        detectedGesture = -1;
        let displayText = "";

        // Get angular acceleration to case on which gesture is being done
        angaccel = histories[3].map((arr) => arr.slice());
        const aa_hist_max = angaccel.map((histArr) => Math.max(...histArr.slice(histArr.length/startWindowIndex)))
        const aa_hist_min = angaccel.map((histArr) => Math.min(...histArr.slice(histArr.length/startWindowIndex)))
        const gap = [aa_hist_max[0] - aa_hist_min[0],
                     aa_hist_max[1] - aa_hist_min[1],
                     aa_hist_max[2] - aa_hist_min[2]];
        const gapAbs = [aa_hist_max[0] + aa_hist_min[0],
                     aa_hist_max[1] + aa_hist_min[1],
                     aa_hist_max[2] + aa_hist_min[2]];
        console.log("Accel max min gaps: ", gap);
        console.log("Accel gaps Absolute: ", gapAbs);
        console.log("max gap", argMax(gap));

        // Check for tilts, then for flicks case on which axis had highest angular accel,
        // then pull and push. Should also add page turn
        maxAccelAxis = argMax(gap);

        if (gestures[0] == -2){ // left tilt
            console.log("new left tilt");
            detectedGesture = 4;
        } else if (gestures[0] == 2){ // right tilt
            console.log("new right tilt");
            detectedGesture = 2;
        } else if (gestures[2] == 1){ // Pull
            console.log("new pull");
            detectedGesture = 5;
        } else if (gestures[2] == -1){ // Push away
            console.log("new push");
            detectedGesture = 6;
        } else { // Flick detection
            switch(maxAccelAxis){
                case 0: // Forward
                    if (gestures[1] == -1){
                        console.log("forward flick");
                        detectedGesture = 0;
                        break;
                    }
                case 1: // Page turns
                    if (gestures[3] == 1){
                        console.log("page turn to right");
                        detectedGesture = 7;
                        break;
                    } else if (gestures[3] == -1){
                        console.log("page turn to left");
                        detectedGesture = 8;
                        break;
                    }
                case 2: // Right and left flick
                    if (gestures[0] == 1){
                        console.log("right flick");
                        detectedGesture = 1;
                        break;
                    } else if (gestures[0] == -1){
                        console.log("left flick");
                        detectedGesture = 3;
                        break;
                    }
                default:
                    if (gestures[1] == -1){
                        console.log("forward flick");
                        detectedGesture = 0;
                    } else if (gestures[3] == 1){
                        console.log("page turn to right");
                        detectedGesture = 7;
                    } else if (gestures[3] == -1){
                        console.log("page turn to left");
                        detectedGesture = 8;
                    } else if (gestures[0] == 1){
                        console.log("right flick");
                        detectedGesture = 1;
                    } else if (gestures[0] == -1){
                        console.log("left flick");
                        detectedGesture = 3;
                    }
            }
        }

        displayText = gestureNames[detectedGesture];

//        textElem.innerHTML = "Trial #" + trialNum + " Results<br><hr>";
        textElem.innerHTML += "<br><br>Detected Gesture: " + displayText;
//        textElem.innerHTML += "<br>Gaze segment: " + segment;

        // Show target text
//        textElem.innerHTML += "<br><br>";
//        textElem.innerHTML += "Target gesture and gaze:"
//        textElem.innerHTML += "<br>Gesture: " + gestureNames[target[0]]
//        textElem.innerHTML += "<br>Gaze segment: " + (target[1]);

        // Add to results: [timestamp, detected, target, [gyro history, face dist history, and gaze history]]
        // Goes [gest, segment]          // for target, gest is 0-6 and seg is 0-7. Need to match detected to that
    }
    trialStarted = false;
}

// Shuffle an array
function shuffleArr(array) {
  var currentIndex = array.length, temporaryValue, randomIndex;

  // While there remain elements to shuffle...
  while (0 !== currentIndex) {

    // Pick a remaining element...
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex -= 1;

    // And swap it with the current element.
    temporaryValue = array[currentIndex];
    array[currentIndex] = array[randomIndex];
    array[randomIndex] = temporaryValue;
  }

  return array;
}

///////////////////////////// Download button for the gesture data


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



