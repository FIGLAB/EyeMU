//Backend code that coordinates the trials by block, and does all the timing and gesture detection.
//var gestureNames = ["Forward flick", "Right flick", "Right tilt", "Left flick", "Left tilt", "Pull close", "Push away"];
//var gestureNames = ["Forward flick", "Right flick", "Right tilt", "Left flick", "Left tilt", "Pull close", "Push away", "Turn to right", "Turn to left"];
var trialStarted = false; // concurrency

// Square grid variables
var galleryNumbers = [];
var galleryElements = [];

// Trial nonrandom variables
var trialBlockOrder;
var trialName;
var trialResultsKey;
var trialBlocksKey;
var trialBlockNum;
var currentBlockTrialNum;
var currentSegmentOrder = null;

// Set up trial time variables
var trial_time = 20; // timeout variable in seconds
var trial_delay = 100 // loop delay in ms
var lastsecHistoryLen = 1200/trial_delay;
var trialStartTime;
var num_repeats = trial_time*1000 / trial_delay;

// gaze target labelling
var lookup;
var divColors = ["#ef90c1","#ef9186", "#e94b95", "#eb624d", "#bb2d6b", "#d63422", "#801e48", "#9c2517"]

// Gesture detection
var firstGest = -1;
var firstGaze = -1;
var endTrialTap = false;

// Whole trial tracking
var track_embeds = [];
var track_accel_gyro = [[[], [], []], [[], [], []], [[], [], []]]; // Linear, Angular, then Gyro
var track_gaze = [];
var track_gestures = [];
var track_headsize = [];
var trackingOn = false;

function resetTracking(){
    track_embeds = [];
    track_accel_gyro = [[[], [], []], [[], [], []], [[], [], []]]; // Linear, Angular, then Gyro
    track_gaze = [];
    track_gestures = [];
    track_headsize = [];
}

function getTrackingHist(){
    return [track_headsize, track_embeds, track_gaze, track_accel_gyro, track_gestures];
}




var cur;
var origScroll;
var heightBounds;
function blockedEval(){
    if (typeof(curPred) == 'undefined' || !AccelStarted){
        console.log("curPred undefined or accel no started, image gallery restarting")
        setTimeout(blockedEval, 500);
        return;
    }
    console.log("image gallery starting")

//    // temporary, while I'm debugging CSS stuff
//    stopFacemesh = true;

    // Focus on window automatically
    window.focus();
    window.scrollTo(0,1);


    let instructions = document.getElementById('evalinstructions');
    instructions.innerHTML = "For each trial, you will be given a colored section of the screen to look at and a gesture to perform. After a gesture is detected, the trial will end, and a new one will start."
    instructions.innerHTML += "<br><br>Done loading, tap to begin";


    // Set up trial starting condition (click) and removal of the button and instructions
    document.body.onclick = () => {
        if (typeof(curPred) != 'undefined' && AccelStarted && !trialStarted){
            document.getElementById('accelbuttonholder').remove();
            document.getElementById('evalinstructions').remove();

            startTrial();
            document.body.onclick = () => {
                if (typeof(curPred) != 'undefined' && AccelStarted){
                    if (!trialStarted){
                        startTrial();
                    } else{
                        endTrialTap = true;
                    }
                }
            };
        }
    };

    // Fill out the lookup table.
    if (evalType == "list"){
        lookup = [1, 2, 3, 4, 5, 6];
    } else{
        lookup = [1, 3, 5, 7, 2, 4, 6, 8];
    }

    // Populate the screen with the boxes, and hide them
    createGalleryElems();
    toggleHide();

    accelbuttonholder
    cur = galleryElements[0]; // debuggery
}


////////////////////////// Convenience functions to light up individual squares.
function resetGridColors(){
    i = 0;
    for (let div of galleryNumbers){
        div.style.color = "black";
//        div.style.backgroundColor = divColors[i];
        galleryElements[i].style.backgroundColor = "grey";
        i++;
        if (evalType == "grid"){
            div.innerHTML = "&nbsp<br>&nbsp";
        } else{
            div.innerHTML = "&nbsp";
        }
    }
}

function setGridTextColorWhite(square_num){
    ind = lookup[square_num-1];
    galleryNumbers[ind-1].style.color = "white";
}

function setGridColorAndText(square_num, text){
    ind = lookup[square_num-1];
    galleryElements[ind-1].style.backgroundColor = divColors[ind-1];

    // Depending on the type of eval, add the text to the specific div but don't show it yet (set to bg color)
    if (evalType == "grid"){
        galleryNumbers[ind-1].innerHTML = text.replace(" ", "<br>");
    } else{
        galleryNumbers[ind-1].innerHTML = text;
    }
    galleryNumbers[ind-1].style.color = divColors[ind-1];
}

function toggleHide(){
    galleryDiv.hidden = !galleryDiv.hidden;
}


function setURLParam(key, val){
    var url = new URL(window.location);
    url.searchParams.set(key, val);
    history.pushState({}, null, url);
}

function getURLParam(key){
    var url = new URL(window.location);
    return url.searchParams.get(key);
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

    // Reset the first detections
    firstGest = -1;
    firstGaze = -1;

    // Generate which trial is next, display it in trialdisplay
    textElem = document.getElementById("trialdisplay");
    textElem.hidden = false;
    updateTrialFromURL();
//    console.log("past update trial from URL")

//    while (typeof(trialBlockOrder) == "undefined"){
//        console.log("AHHHH UNDEFINED");
//    }
    ldb.get(trialBlocksKey, function (tmplist) {
        console.log("block order set");
        trialBlockOrder = JSON.parse(tmplist);

        console.log("");
        console.log("Eval " + trialName + " starting block " + (trialBlockNum+1) + ", trial " + (1+currentBlockTrialNum));
        console.log(gestureNames);

        targetGesture = trialBlockOrder[trialBlockNum];
        targetSquare = currentSegmentOrder[currentBlockTrialNum]+1;
        textElem.innerHTML = "\"" + trialName + "\" Evaluation Trial<br>";
        textElem.innerHTML += "Block #" + (1+trialBlockNum) + ", ";
        textElem.innerHTML += "Trial #" + (1+currentBlockTrialNum) + "/" + currentSegmentOrder.length;
        textElem.innerHTML += "<br>Target gesture: " + gestureNames[targetGesture];
        textElem.innerHTML += "<br>Target square: " + (targetSquare);
    });


        // Start the trial after showing user target info
    delayedStart = 1000;
    setTimeout(() => {
        // Hide trial instructions
        console.log("Trial started, target gesture and segment:", gestureNames[targetGesture], (targetSquare));
        textElem.hidden = true;

        // Show grid
        toggleHide();
            // highlight one number
        resetGridColors();
        setGridColorAndText(targetSquare, gestureNames[targetGesture]);

        // Start trial loop
        trialStartTime = Date.now()
        trialLoop([targetGesture, targetSquare]);
    }, delayedStart);
}

// Main loop of the trial running gesture detection and eye segmentation
function trialLoop(targets){
    trackingOn = true; // Track while looping

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
//    hist = [localPreds, orient_short_history, head_size_history, angaccel_short_history];
    // If all gestures is not all 0 and has no 99s (unsteady), a gesture is detected. Log it
    if (!all_gestures.every(elem => elem == 0 || elem == 99) && (sum(all_gestures) < 120)){
        if (firstGest == -1){
            firstGest = all_gestures.slice();
            segmentPrediction = getMeanEyeSegment(localPreds.slice(3)) // Averaging predicted gaze XYs
            firstGaze = segmentPrediction
        }
    }

    // Data logging for gaze, gesture, headsize, and embeddings
    if (trackingOn){
        track_gaze.push([...curPred]);
        track_gestures.push([...all_gestures]);

        let tmpEmbeds = Array.from(allFeatures_mat.val)
        track_embeds.push(tmpEmbeds);
        track_headsize.push(head_size_history[head_size_history.length-1]);
    }

    if (endTrialTap){
//        hist = [localPreds, orient_short_history, head_size_history, angaccel_short_history];
        hist = getTrackingHist();
        endTrialTap = false;

        if (firstGaze == -1){
            firstGaze = getMeanEyeSegment(localPreds.slice(3)) // Averaging predicted gaze XYs
        }
        trialEndHandler([firstGest, firstGaze], targets, hist);
    } else{
        setTimeout(() => trialLoop(targets), trial_delay);
    }
}

//function trialEndHandler(gestures, segment){
function trialEndHandler(detected, target, histories){ // Both in [gestures, segment] format
    trackingOn = false; // Turn off tracking

    // Show text box
    toggleHide();
    textElem = document.getElementById("trialdisplay");
    textElem.hidden = false;
//    textElem.innerHTML = "Trial #" + trialNum + " Complete<br><hr><br>Tap to continue";
    textElem.innerHTML = "Block #" + (trialBlockNum+1) + ", Trial #" + (currentBlockTrialNum+1) +  " Complete<br><hr><br>Tap to continue";

    if (detected[0] == -1){ // If no gesture triggered (timed out)
        console.log("before LS store in eval");
        checkLSsize();
        addToEvalResults(trialResultsKey, trialBlockNum, currentBlockTrialNum, [Date.now(), [-1, detected[1]], target, histories]);
        console.log("After LS store in eval");
        checkLSsize();
    } else{
        // Show detected text
        gestures = detected[0];
        detectedGesture = -1;


        // Get angular acceleration to case on which flicks gesture is being done
        angaccel = histories[3].map((arr) => arr.slice());
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
//            console.log("new left tilt");
            detectedGesture = 4;
        } else if (gestures[0] == 2){ // right tilt
//            console.log("new right tilt");
            detectedGesture = 2;
        } else if (gestures[2] == 1){ // Pull
//            console.log("new pull");
            detectedGesture = 5;
        } else if (gestures[2] == -1){ // Push away
//            console.log("new push");
            detectedGesture = 6;
        } else { // Flick detection
            switch(maxAccelAxis){
                case 0: // Forward
                    if (gestures[1] == -1){
//                        console.log("forward flick");
                        detectedGesture = 0;
                        break;
                    }
                case 1: // Page turns
                    if (gestures[3] == 1){
//                        console.log("page turn to right");
                        detectedGesture = 7;
                        break;
                    } else if (gestures[3] == -1){
//                        console.log("page turn to left");
                        detectedGesture = 8;
                        break;
                    }
                case 2: // Right and left flick
                    if (gestures[0] == 1){
//                        console.log("right flick");
                        detectedGesture = 1;
                        break;
                    } else if (gestures[0] == -1){
//                        console.log("left flick");
                        detectedGesture = 3;
                        break;
                    }
            }
          }

        // Pull out eye and gesture prediction
        let segment = detected[1];
        let displayText = gestureNames[detectedGesture];

        // Debug output to console
        console.log("Gaze Prediction: ", segment);
        console.log("Gesture Prediction: ", displayText);

        // Goes [gest, segment]          // for target, gest is 0-6 and seg is 0-7
        addToEvalResults(trialResultsKey, trialBlockNum, currentBlockTrialNum,
            // Add to results: [timestamp, detected, target, [gyro history, face dist history, and gaze history]]
            [Date.now(), [detectedGesture, segment], target, histories]);
        }


    setURLParam("trialnum", (currentBlockTrialNum + 1));
    trialStarted = false;
    resetTracking();
}

/////////////////////// Utils
function argMax(array) {
  return array.map((x, i) => [x, i]).reduce((r, a) => (a[0] > r[0] ? a : r))[1];
}

function makeRandomArrayOfLen(n){
    let seglist = [...Array(n).keys()];
    shuffleArr(seglist);
    return seglist;
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

///////////////////////////////////// Trial updating
function updateTrialFromURL(){
//    console.log('eneterd trial from URL')
    ///////// Figure out which trial is next, check url and then go off the results.
    // Get trial name from the URL. If there isn't one, make it evalType + "1" by default
    let tmpname = getURLParam("name")
    if (tmpname == null){
        tmpname = evalType + "1";
        setURLParam("name", tmpname);
    }
    trialName = tmpname;

    // Get type of eval, grid or list
    let numTrialsPerBlock;
    if (trialName.slice(0,4) == "grid"){ // Grid has len 8
        numTrialsPerBlock = 8;
    } else{ // List has len 6
        numTrialsPerBlock = 6;
    }


    // Initialize results in localstorage if it doesn't exist.
    trialResultsKey = trialName + "_results";
    ldb.get(trialResultsKey, function (tmpres) {
        if (tmpres == null){
            let reslist = [];
            for (let i = 0; i < gestureNames.length; i++){
                reslist.push(makeRandomArrayOfLen(numTrialsPerBlock))
            }
            ldb.set(trialResultsKey, JSON.stringify(reslist));
        }
    });

//    tmpres = localStorage.getItem(trialResultsKey);
//    if (tmpres == null){
//        let reslist = [];
//        for (let i = 0; i < gestureNames.length; i++){
//            reslist.push(makeRandomArrayOfLen(numTrialsPerBlock))
//        }
//        localStorage.setItem(trialResultsKey, JSON.stringify(reslist));
//    }


    // Get trial block list. If there isn't one, make it
    trialBlocksKey = trialName + "_blockorder";
    ldb.get(trialBlocksKey, function (tmplist) {
        if (tmplist == null){
            let blocklist;
            blocklist = [...Array(gestureNames.length).keys()]; // 7 gestures
            shuffleArr(blocklist);
            ldb.set(trialBlocksKey, JSON.stringify(blocklist));
        }
    });
//    ldb.get(trialBlocksKey, function (tmplist) {
//        console.log("block order set");
//        trialBlockOrder = JSON.parse(tmplist);
//    });




//    tmplist = localStorage.getItem(trialBlocksKey);
//    if (tmplist == null){
//        let blocklist;
//        blocklist = [...Array(gestureNames.length).keys()]; // 7 gestures
//        shuffleArr(blocklist);
//        localStorage.setItem(trialBlocksKey, JSON.stringify(blocklist));
//
//        tmplist = localStorage.getItem(trialBlocksKey);
//    }
//    trialBlockOrder = JSON.parse(tmplist);

    // Get trial's current block from the url
    let tmpblock = parseInt(getURLParam("block"));
    if (isNaN(tmpblock)){
        tmpblock = 0;
        setURLParam("block", tmpblock);
    }
    trialBlockNum = tmpblock;

    // Get current block's grid num from url, or start it at 0 and re-generate if nonexistent
//    console.log("currentBlockTrialNum before setting frmo url param", currentBlockTrialNum);
    let tmptrialnum = parseInt(getURLParam("trialnum"));
    if (isNaN(tmptrialnum)){
        tmptrialnum = 0;
        setURLParam("trialnum", tmptrialnum);
    }
    currentBlockTrialNum = tmptrialnum;
//    console.log("currentBlockTrialNum after setting frmo url param", currentBlockTrialNum);


    // Index into randomly ordered list of squares to look at, or create it
    // We need to make a new one if it's empty, or
    if (currentSegmentOrder == null){
        currentSegmentOrder = makeRandomArrayOfLen(numTrialsPerBlock);
    }
    if (currentBlockTrialNum == currentSegmentOrder.length){ // Also create new segment list if trialnum has finished this block.
        trialBlockNum += 1;
        setURLParam("block", trialBlockNum);
        currentBlockTrialNum = 0;
        setURLParam("trialnum", currentBlockTrialNum);

        currentSegmentOrder = makeRandomArrayOfLen(numTrialsPerBlock);
    }

    // Redirect to main page if this eval set is done.
    if (trialBlockNum == gestureNames.length){
        window.location.href = "/results";
    }
}


////////////////////////////////////// Block based saving
function addToEvalResults(resultsKey, blocknum, trialnum, resultsArr){
//    if (!localStorage.getItem(resultsKey)){ // Populate if empty
//        console.log("adding to eval broken, key \"" + resultsKey + "\" is empty");
//    }
//
//    let tmp;
//    try{
//        tmp = JSON.parse(localStorage.getItem(resultsKey))
//    } catch{
//        console.log("adding to eval broken, key \"" + resultsKey + "\" is not parseable");
//    }
////    console.log("parsed eval key " + resultsKey + " as " + tmp)
//
//    tmp[blocknum][trialnum] = resultsArr;
//    localStorage[resultsKey] = JSON.stringify(tmp);

//ldb.get(trialResultsKey, function (value) {
//  console.log('And the value is', value);
//});


    ldb.get(resultsKey, function (savedArr) {
        // Check for null
        if (!savedArr){
            console.log("No data stored in " + resultsKey + " evaluation saving failed");
        }

        // Check for corruption
        let tmp;
        try{
            tmp = JSON.parse(savedArr);
        } catch{
            console.log("Data not parseable in " + resultsKey);
        }

//        Add to the results
        tmp[blocknum][trialnum] = resultsArr;
        ldb.set(resultsKey, JSON.stringify(tmp));
    });

}

/////////////////////////////////////// Eye tracking
function gaze2Section(gaze_pred){
    actualX = window.scrollX + gaze_pred[0]*innerWidth;
    actualY = window.scrollY + gaze_pred[1]*innerHeight;

    if (evalType == "grid"){
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
    } else{
        heightBounds = [0.0];
        for (let i = 1; i < galleryElements.length; i += 1){
            heightBounds.push(galleryElements[i].offsetTop);
        }

        let row;
        heightBounds.forEach((elem, ind) => {
            if (actualY > elem){
                row = ind;
            }
        });

        return row + 1;
    }
}

// Find mode of the segments history
function getModeEyeSegment(arr){
    let hist = Array(galleryElements.length).fill(0);
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

