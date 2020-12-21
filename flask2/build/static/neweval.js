// Zoo #3, one-handed photo editing
// 12/7 CLARIFICATION: I'm setting all the style in javascript so I can edit it more easily on my end. Should probably move to a CSS global, but this will never see the light of the public so w/e


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
}

function toggleHide(){
    galleryDiv.hidden = !galleryDiv.hidden;
}

var cur;
var origScroll;
var heightBounds;
function newEvalGrid(){
//    if (rBB == undefined || !AccelStarted){
//        console.log("rBB undefined, image gallery restarting")
//        setTimeout(imageGallery, 400);
//        return;
//    }
    console.log("image gallery starting")

    // temporary, while I'm debugging CSS stuff
    stopFacemesh = true;

    // Focus on window automatically
    window.focus();
    window.scrollTo(0,1);

    // Attach event handler to detect keypresses
    document.body.onkeydown = (event) => {
        console.log(event);
        if (elemsClicked.some(elem => elem)){
            // Find which painting is selected when the keypress happened
            const selectedElemIndex = elemsClicked.findIndex(elem => elem)
            console.log("currently selected", selectedElemIndex, "key is", event.key)

            // If left or right arrow, change filter number
            if (event.key == "ArrowLeft"){
                elemsFilters[selectedElemIndex] = (elemsFilters[selectedElemIndex] + numFilters - 1) % numFilters;
            } else if (event.key == "ArrowRight"){
                elemsFilters[selectedElemIndex] = (elemsFilters[selectedElemIndex] + numFilters + 1) % numFilters;
            }

            // Apply the filter to that element's CSS
            galleryElements[selectedElemIndex].style.filter = filterList[elemsFilters[selectedElemIndex]];
        }
    };

    // Populate the screen with the boxes
    createGalleryElems();

    toggleHide();



//    var history_len = 20;
//    var head_size_history = [];
//    var headSteady = true;
//    var steady = true;
//    var steadyLen = history_len*2;
//
//    var localPred = [0, 0];
//    var steadyHistory = [];
//
//    // set up the accel detection loop
//                // TODO: New idea involving using the half second old measurement
//            // make array orient_short_history - orient_short_history[0] or orient_short_history[len/2]
//            // classify each point as tilt left, tilt right, or steady
//            // remove duplicates and that'll be the measurement.
//            //
//            // Tilt right will be steady steady tilt_right tilt_right, once it hits all tilt-right then set the tilting variable and if its steady then add tilt
//            // flick right will be steady steady tilt_right tilt_right steady steady. complicated!
//
//            // Make this function run only when called, and only run for trial_time seconds. call a log functions after it finishes
//    setInterval(() => {
//
//
//
//
////        console.log("steady", steady, steadyHistory.length);
//        flicktiltzoom_state = [0, 0, 0];
//
//        // Track rotateDegrees
//        let oldZ = orient_short_history[0][updateRate/4]; // shorter history than the one provided
//        let curZ = orient_short_history[0][updateRate-1];
//        diff = (oldZ-curZ);
//
//        let thresh = 25; // degrees
//        if (diff > 180 && (360-diff > thresh)){ // CCW
//            if (steady){
//                steadyHistory.push(false);
//                console.log("flick left");
//            } else{
//                console.log("tilt left");
//            }
//        } else if (diff < 180 && diff > thresh){
//            if (steady){
//                steadyHistory.push(false);
//                console.log("flick right");
//            } else{
//                console.log("tilt right");
//            }
//        } else {
//            steadyHistory.push(true);
////            console.log("no motion")
//        }
//
//        // Track forward tilt
//        let oldfb = orient_short_history[1][updateRate/2]; // shorter history than the one provided
//        let newfb = orient_short_history[1][updateRate-1];
//        fbdiff = (oldfb-newfb);
//
//        let fbthresh = -30;
//        if (fbdiff < fbthresh){ // tilt down, towards user
//            console.log("forward tilt");
//            steadyHistory.push(false);
//        }  else {
//            steadyHistory.push(true);
////            console.log("no motion")
//        }
//
//
//        // Update steady variable
//        if (steadyHistory.length > steadyLen){
//            steadyHistory.shift();
//            steadyHistory.shift();
//        }
//        steady = steadyHistory.every(elem => elem);
//
//
//
//        if (steady){
//            // Track head size
//            let cur_face_geom = faceGeom.getGeom();
//            let cur_head_size = cur_face_geom[3];
//
//            head_size_history.push(cur_head_size)
//            if (head_size_history.length > history_len){
//                head_size_history.shift();
//            }
//
//
//            // if head has moved a lot in the last second, trigger a click
//            const selectedElemIndex = elemsClicked.findIndex(elem => elem)
//                // if old head size is smaller than the current it's a pull
//            if (head_size_history[0]*1.2 < head_size_history[history_len-1] &&
//                    selectedElemIndex == -1){ // requires that nothing is clicked
//                document.activeElement.click();
//                console.log("pull");
//                // Otherwise, it's a push
//            } else if (head_size_history[0] > 1.2*head_size_history[history_len-1]
//                    && selectedElemIndex != -1){ // requires that something is clicked
//                galleryElements[selectedElemIndex].click();
//                console.log("push");
//            }
//
//            if (head_size_history.length > 6){
//                let diff = head_size_history[history_len-1] - head_size_history[history_len-5];
//                headSteady = Math.abs(diff) < 0.01;
////                console.log("head steady", headSteady);
//            }
//        }
//
//
//
//
//
//        if (typeof(curPred) != 'undefined'){
//            if (steady && headSteady){
//                localPred = [curPred[0], curPred[1]];
//            }
//
//            actualX = window.scrollX + localPred[0]*innerWidth;
//            actualY = window.scrollY + localPred[1]*innerHeight;
////            console.log(curPred[0], curPred[1]);
////            console.log(actualX, actualY);
//
//
//            // Generate the top and bottom bounds of one elem in each row
//            heightBounds = [0.0];
//            for (let i = 2; i < galleryElements.length; i += 2){
//                heightBounds.push(galleryElements[i].offsetTop);
//            }
//
//            let row;
//            heightBounds.forEach((elem, ind) => {
//                if (actualY > elem){
//                    row = ind;
//                }
//            });
//
//            let mid = Math.trunc(window.innerWidth/2);
//            let col = actualX < mid ? 0 : 1
//        }
//    }, 100);

    cur = galleryElements[0];
}

function startTrial(){
    // Set up trial time variables
    trial_time = 10000;
    trial_delay = 100
    num_repeats = trial_time*(1000/trial_delay);
    repeat_counter = 0;

    // Call the trial handler
    toggleHide();
    trialLoop(num_repeats);
}

function arrayCondenser(arr){
    newArr = [arr[0]];
    for (let i = 1; i < arr.length; i++){
        if (arr[i] != arr[i-1]){ // If it's different, add it
            newArr.push(arr[i]);
        }
    }
    return newArr;
}

    // find the difference w/r/t the first element and remove duplicates
function historyToCondensed(fullhist, threshold){
    diffs = fullhist.slice(updateRate/4);
    diffs.forEach((elem, i) => diffs[i] = (elem - fullhist[0]));

    diff_classes = [];
    diffs.forEach((elem) => {
        diff_classes.push(elem > threshold ? 1 : (elem < -threshold ? -1 : 0));
    });
    condensed = arrayCondenser(diff_classes);
    return condensed;
}


    // make array orient_short_history - orient_short_history[0] or orient_short_history[len/2]
    // classify each point as tilt left, tilt right, or steady
    // remove duplicates and that'll be the measurement.
function accelArrayHandler(accel_history){
    // Make a copy so it won't shift as we're modifying it
    leftright_hist = accel_history[0].slice();
    backfront_hist = accel_history[1].slice();

    // threshold and remove duplicates
    lr_condensed = historyToCondensed(leftright_hist, 25);
    bf_condensed = historyToCondensed(backfront_hist, 30);

    return [lr_condensed, bf_condensed]
}

function classify_leftright(condensed){
    tmp = JSON.stringify(condensed);
    lef_tilt = tmp == "[-1]";
    lef_flick = tmp == "[0,-1,0]";

    right_flick = tmp == "[0,1,0]";
    right_tilt = tmp == "[1]";

    return lef_tilt*-2 + lef_flick*-1 + right_flick*1 + right_tilt*2
}

function classify_backfront(condensed){
    tmp = JSON.stringify(condensed);

    front_dip = tmp == "[0,1,0]";


    return front_dip
}



function trialLoop(max_repeats){
    repeat_counter += 1;

       // // Do accel detection stuff here
        // TODO: New idea involving using the half second old measurement
    // Tilt right will be steady steady tilt_right tilt_right, once it hits all tilt-right then set the tilting variable and if its steady then add tilt
    // flick right will be steady steady tilt_right tilt_right steady steady. complicated!

    condensed_arrays = accelArrayHandler(orient_short_history);
    leftrightgesture = classify_leftright(condensed_arrays[0]);
    bfgesture = classify_backfront(condensed_arrays[1]);
    console.log(bfgesture, condensed_arrays[1]);


    if (repeat_counter < max_repeats){
        setTimeout(() => trialLoop(max_repeats), trial_delay);
    } else{
        // Reset the counter, hide all the squares
        repeat_counter = 0;
        toggleHide();
        return;
    }
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
