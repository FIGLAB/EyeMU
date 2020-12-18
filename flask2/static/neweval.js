// Zoo #3, one-handed photo editing
// 12/7 CLARIFICATION: I'm setting all the style in javascript so I can edit it more easily on my end. Should probably move to a CSS global, but this will never see the light of the public so w/e


function hideAll(){
    galleryElements.forEach((elem,ind) => {
        elem.hidden = !elemsClicked[ind];
    });
}
function showAll(){
    galleryElements.forEach((elem,ind) => {
        elem.hidden = elemsClicked[ind];
    });
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








    // Detect user focusing on a specific element
                // 2 elems per row:
    let mid = Math.trunc(window.innerWidth/2);

    var history_len = 20;
    var head_size_history = [];
    var headSteady = true;
    var steady = true;
    var steadyLen = history_len*2;

    var localPred = [0, 0];
    var steadyHistory = [];

    // set up the accel detection loop
    setInterval(() => {
        console.log("steady", steady, steadyHistory.length);

        // Track rotateDegrees
        let oldZ = orient_short_history[0][updateRate/2]; // shorter history than the one provided
        let curZ = orient_short_history[0][updateRate-1];
        diff = (oldZ-curZ);

        let thresh = 25; // degrees
        if (diff > 180 && (360-diff > thresh)){ // CCW
            if (steady){
                steadyHistory.push(false);
                console.log("flick left");
            } else{
                console.log("tilt left");
            }
        } else if (diff < 180 && diff > thresh){
            if (steady){
                steadyHistory.push(false);
                console.log("flick right");
            } else{
                console.log("tilt right");
            }
        } else {
            steadyHistory.push(true);
//            console.log("no motion")
        }

        // Track forward tilt
        let oldfb = orient_short_history[1][updateRate/2]; // shorter history than the one provided
        let newfb = orient_short_history[1][updateRate-1];
        fbdiff = (oldfb-newfb);

        let fbthresh = -30;
        if (fbdiff < fbthresh){ // tilt down, towards user
            console.log("tilt forward");
            steadyHistory.push(false);
        }  else {
            steadyHistory.push(true);
//            console.log("no motion")
        }


        // Update steady variable
        if (steadyHistory.length > steadyLen){
            steadyHistory.shift();
            steadyHistory.shift();
        }
        steady = steadyHistory.every(elem => elem);



        if (steady){
            // Track head size
            let cur_face_geom = faceGeom.getGeom();
            let cur_head_size = cur_face_geom[3];

            head_size_history.push(cur_head_size)
            if (head_size_history.length > history_len){
                head_size_history.shift();
            }


            // if head has moved a lot in the last second, trigger a click
            const selectedElemIndex = elemsClicked.findIndex(elem => elem)
                // if old head size is smaller than the current it's a pull
            if (head_size_history[0]*1.2 < head_size_history[history_len-1] &&
                    selectedElemIndex == -1){ // requires that nothing is clicked
                document.activeElement.click();
                console.log("pull");
                // Otherwise, it's a push
            } else if (head_size_history[0] > 1.2*head_size_history[history_len-1]
                    && selectedElemIndex != -1){ // requires that something is clicked
                galleryElements[selectedElemIndex].click();
                console.log("push");
            }

            if (head_size_history.length > 6){
                let diff = head_size_history[history_len-1] - head_size_history[history_len-5];
                headSteady = Math.abs(diff) < 0.01;
//                console.log("head steady", headSteady);
            }
        }





        if (typeof(curPred) != 'undefined'){
            if (steady && headSteady){
                localPred = [curPred[0], curPred[1]];
            }

            actualX = window.scrollX + localPred[0]*innerWidth;
            actualY = window.scrollY + localPred[1]*innerHeight;
//            console.log(curPred[0], curPred[1]);
//            console.log(actualX, actualY);


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
            let col = actualX < mid ? 0 : 1

        }
    }, 50);

    cur = galleryElements[0];
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

//239, 144, 193
//233, 75, 149
//187, 45, 106
//128, 30, 72
//
//239, 144, 134
//235, 98, 77
//214, 52, 34
//156, 37, 23
//
//250, 221, 110


imageGalleryIms  = [
"iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAYAAABw4pVUAAAAoUlEQVR42u3RMQ0AMAgAsOH/mSUUIQFsENJaaNTPfqwRQoQgRAhChCBECEKECBGCECEIEYIQIQgRghCECEGIEIQIQYgQhCBECEKEIEQIQoQgBCFCECIEIUIQIgQhCBGCECEIEYIQIQhBiBCECEGIEIQIQQhChCBECEKEIEQIQhAiBCFCECIEIUIQghAhCBGCECEIEYIQIUKEIEQIQoQg5LoB5S1FEBz3FL0AAAAASUVORK5CYII=", // 1

"iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAYAAABw4pVUAAAAoElEQVR42u3RMQ0AMAgAsGF+N06RADYIaS00Kn8/1gghQhAiBCFCECIEIUKECEGIEIQIQYgQhAhBCEKEIEQIQoQgRAhCECIEIUIQIgQhQhCCECEIEYIQIQgRghCECEGIEIQIQYgQhCBECEKEIEQIQoQgBCFCECIEIUIQIgQhCBGCECEIEYIQIQhBiBCECEGIEIQIQYgQIUIQIgQhQhBy3QCowi4Efp22cgAAAABJRU5ErkJggg==", // 5

"iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAYAAABw4pVUAAAAoElEQVR42u3RAQ0AMAgAoFv3jaxkKa3hHFQg6mc/1gghQhAiBCFCECIEIUKECEGIEIQIQYgQhAhBCEKEIEQIQoQgRAhCECIEIUIQIgQhQhCCECEIEYIQIQgRghCECEGIEIQIQYgQhCBECEKEIEQIQoQgBCFCECIEIUIQIgQhCBGCECEIEYIQIQhBiBCECEGIEIQIQYgQIUIQIgQhQhBy3QD1hRgkYsz+CwAAAABJRU5ErkJggg==", // 2

"iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAYAAABw4pVUAAAAoElEQVR42u3RMQ0AMAgAsCF1P24RBDYIaS00Kn8/1gghQhAiBCFCECIEIUKECEGIEIQIQYgQhAhBCEKEIEQIQoQgRAhCECIEIUIQIgQhQhCCECEIEYIQIQgRghCECEGIEIQIQYgQhCBECEKEIEQIQoQgBCFCECIEIUIQIgQhCBGCECEIEYIQIQhBiBCECEGIEIQIQYgQIUIQIgQhQhBy3QBizQaQJ0gxFAAAAABJRU5ErkJggg==", // 6

"iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAYAAABw4pVUAAAAoElEQVR42u3RAQ0AMAgAoNvtgSxlTq3hHFQg6mc/1gghQhAiBCFCECIEIUKECEGIEIQIQYgQhAhBCEKEIEQIQoQgRAhCECIEIUIQIgQhQhCCECEIEYIQIQgRghCECEGIEIQIQYgQhCBECEKEIEQIQoQgBCFCECIEIUIQIgQhCBGCECEIEYIQIQhBiBCECEGIEIQIQYgQIUIQIgQhQhBy3QAe7erF6nB1cQAAAABJRU5ErkJggg==", // 3

"iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAYAAABw4pVUAAAAoElEQVR42u3RAQ0AMAgAoNvrBWxsO63hHFQgKn8/1gghQhAiBCFCECIEIUKECEGIEIQIQYgQhAhBCEKEIEQIQoQgRAhCECIEIUIQIgQhQhCCECEIEYIQIQgRghCECEGIEIQIQYgQhCBECEKEIEQIQoQgBCFCECIEIUIQIgQhCBGCECEIEYIQIQhBiBCECEGIEIQIQYgQIUIQIgQhQhBy3QDr89/VJHGWFAAAAABJRU5ErkJggg==", // 7

"iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAYAAABw4pVUAAAAoElEQVR42u3RAQ0AMAgAoFvkeYxlc63hHFQg6mc/1gghQhAiBCFCECIEIUKECEGIEIQIQYgQhAhBCEKEIEQIQoQgRAhCECIEIUIQIgQhQhCCECEIEYIQIQgRghCECEGIEIQIQYgQhCBECEKEIEQIQoQgBCFCECIEIUIQIgQhCBGCECEIEYIQIQhBiBCECEGIEIQIQYgQIUIQIgQhQhBy3QAvRb3ZJ/oxtgAAAABJRU5ErkJggg==", // 4

"iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAYAAABw4pVUAAAAoElEQVR42u3RAQ0AMAgAoJviCWxtV63hHFQgKn8/1gghQhAiBCFCECIEIUKECEGIEIQIQYgQhAhBCEKEIEQIQoQgRAhCECIEIUIQIgQhQhCCECEIEYIQIQgRghCECEGIEIQIQYgQhCBECEKEIEQIQoQgBCFCECIEIUIQIgQhCBGCECEIEYIQIQhBiBCECEGIEIQIQYgQIUIQIgQhQhBy3QCl/rhh1C1+twAAAABJRU5ErkJggg=="
]



//imageGalleryIms  = [
//    "iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAYAAABw4pVUAAAAoUlEQVR42u3RMQ0AMAgAsOH/mSUUIQFsENJaaNTPfqwRQoQgRAhChCBECEKECBGCECEIEYIQIQgRghCECEGIEIQIQYgQhCBECEKEIEQIQoQgBCFCECIEIUIQIgQhCBGCECEIEYIQIQhBiBCECEGIEIQIQQhChCBECEKEIEQIQhAiBCFCECIEIUIQghAhCBGCECEIEYIQIUKEIEQIQoQg5LoB5S1FEBz3FL0AAAAASUVORK5CYII=",
//        "iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAYAAABw4pVUAAAAoElEQVR42u3RAQ0AMAgAoBvg3W1qBK3hHFQgKn8/1gghQhAiBCFCECIEIUKECEGIEIQIQYgQhAhBCEKEIEQIQoQgRAhCECIEIUIQIgQhQhCCECEIEYIQIQgRghCECEGIEIQIQYgQhCBECEKEIEQIQoQgBCFCECIEIUIQIgQhCBGCECEIEYIQIQhBiBCECEGIEIQIQYgQIUIQIgQhQhBy3QB67/6xF8RI8AAAAABJRU5ErkJggg==",
//
//    "iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAYAAABw4pVUAAAAoElEQVR42u3RAQ0AMAgAoJvv+QxpCq3hHFQg6mc/1gghQhAiBCFCECIEIUKECEGIEIQIQYgQhAhBCEKEIEQIQoQgRAhCECIEIUIQIgQhQhCCECEIEYIQIQgRghCECEGIEIQIQYgQhCBECEKEIEQIQoQgBCFCECIEIUIQIgQhCBGCECEIEYIQIQhBiBCECEGIEIQIQYgQIUIQIgQhQhBy3QBltBaUYOKm/AAAAABJRU5ErkJggg==",
//        "iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAYAAABw4pVUAAAAoElEQVR42u3RAQ0AMAgAoFv1YSxrCK3hHFQg6mc/1gghQhAiBCFCECIEIUKECEGIEIQIQYgQhAhBCEKEIEQIQoQgRAhCECIEIUIQIgQhQhCCECEIEYIQIQgRghCECEGIEIQIQYgQhCBECEKEIEQIQoQgBCFCECIEIUIQIgQhCBGCECEIEYIQIQhBiBCECEGIEIQIQYgQIUIQIgQhQhBy3QB2Jxp8oFhErgAAAABJRU5ErkJggg==",
//
//
//    "iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAYAAABw4pVUAAAAoElEQVR42u3RAQ0AMAgAoBvoxaxoOK3hHFQg6mc/1gghQhAiBCFCECIEIUKECEGIEIQIQYgQhAhBCEKEIEQIQoQgRAhCECIEIUIQIgQhQhCCECEIEYIQIQgRghCECEGIEIQIQYgQhCBECEKEIEQIQoQgBCFCECIEIUIQIgQhCBGCECEIEYIQIQhBiBCECEGIEIQIQYgQIUIQIgQhQhBy3QDWKOgJmGHBugAAAABJRU5ErkJggg==",
//    "iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAYAAABw4pVUAAAAoUlEQVR42u3RAQ0AMAgAoFvlGewfwzpawzmoQFT+fqwRQoQgRAhChCBECEKECBGCECEIEYIQIQgRghCECEGIEIQIQYgQhCBECEKEIEQIQoQgBCFCECIEIUIQIgQhCBGCECEIEYIQIQhBiBCECEGIEIQIQQhChCBECEKEIEQIQhAiBCFCECIEIUIQghAhCBGCECEIEYIQIUKEIEQIQoQg5LoBpF7ZMYfHOFAAAAAASUVORK5CYII=",
//
//    "iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAYAAABw4pVUAAAAoElEQVR42u3RAQ0AMAgAoFvkAU1hc63hHFQg6mc/1gghQhAiBCFCECIEIUKECEGIEIQIQYgQhAhBCEKEIEQIQoQgRAhCECIEIUIQIgQhQhCCECEIEYIQIQgRghCECEGIEIQIQYgQhCBECEKEIEQIQoQgBCFCECIEIUIQIgQhCBGCECEIEYIQIQhBiBCECEGIEIQIQYgQIUIQIgQhQhBy3QDc58shd7zBogAAAABJRU5ErkJggg==",
//
//"iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAYAAABw4pVUAAAAoElEQVR42u3RAQ0AMAgAoJviCWxtV63hHFQgKn8/1gghQhAiBCFCECIEIUKECEGIEIQIQYgQhAhBCEKEIEQIQoQgRAhCECIEIUIQIgQhQhCCECEIEYIQIQgRghCECEGIEIQIQYgQhCBECEKEIEQIQoQgBCFCECIEIUIQIgQhCBGCECEIEYIQIQhBiBCECEGIEIQIQYgQIUIQIgQhQhBy3QCl/rhh1C1+twAAAABJRU5ErkJggg=="
//];