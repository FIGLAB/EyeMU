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


    // Create filter variables
//    filterList = ["blur(0px)", "hue-rotate(180deg)", "blur(5px)", "sepia(60%)",  "invert(100%)"];
    filterList = ["blur(0px) hue-rotate(0deg) sepia(0%) contrast(100%)",
    "blur(5px) hue-rotate(0deg) sepia(0%) contrast(100%)",
    "blur(0px) hue-rotate(180deg) sepia(0%) contrast(100%)",
    "blur(0px) hue-rotate(0deg) sepia(60%) contrast(100%)",
    "blur(0px) hue-rotate(0deg) sepia(0%) contrast(250%)",];



    numFilters = filterList.length

    // Remove ugly margin on edges of page. Small margins still exist oh well
    document.body.style.margin = "0px";

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
        let a = document.createElement("img")
        a.src = "data:image/png;base64," + imageGalleryIms[i];
        a.tabIndex = 1; // Allows the images to be focused

        // This class adds animations when they're focused on (eye gaze on them)
        a.classList.toggle("photogallery")

        a.onclick = () => {
                            elemsClicked[i] = !elemsClicked[i];
                            if (elemsClicked[i]){
                                // Remember initial y position
                                origScroll = window.scrollY;

                                console.log(i, 'selected');
                                a.style.transition = "all .3s ease";

                                a.style.position = "fixed";
                                a.style.display = "block";

                                a.style.maxWidth = "100%";
                                a.style.maxHeight = "100%";
                                a.style.height = "100%";
                                a.style.width = "100%";
                                a.style.margin = "auto";
                                a.style.zIndex = "2";

                                setTimeout(() => {
                                    a.style.top = "0px";
                                    a.style.left = "0px";
                                    a.style.bottom = "0px";
                                    a.style.right = "0px";
                                }, 100)

                                a.blur();

                                setTimeout(hideAll, 100);
                            } else{
                                setTimeout(() => window.scrollBy(0, origScroll - window.scrollY), 30);

                                console.log(i, 'deselected');
                                let tmp = a.style.filter;
                                a.removeAttribute("style")
                                a.style.filter = tmp;

                                setTimeout(() => {
                                    showAll();
                                    }, 20);
                            }
                          };
        im_container = document.createElement("div");
        im_container.classList.toggle("wackdiv");
        im_container.style.backgroundColor = divColors[i];
//        im_container.append(a)

        galleryDiv.append(im_container);


//        galleryDiv.append(a);

        galleryElements.push(a);
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


    var localPred = [0, 0];
    var steadyHistory = [];

    setInterval(() => {
        // Track rotateDegrees
        let oldZ = orient_short_history[0][updateRate/2]; // shorter history than the one provided
        let curZ = orient_short_history[0][updateRate-1];

        diff = (oldZ-curZ);

        let thresh = 15;
        if (diff > 180 && (360-diff > thresh && steady)){ // CCW
//            console.log("counterclockwise detected");
            steadyHistory.push(false);
            document.body.dispatchEvent(new KeyboardEvent('keydown',  {'key':'ArrowLeft'}));
//            steady = false;
        } else if (diff < 180 && diff > thresh && steady){
//            console.log("clockwise detected");
            steadyHistory.push(false);
            document.body.dispatchEvent(new KeyboardEvent('keydown',  {'key':'ArrowRight'}));
//            steady = false;
        } else {
//            console.log("calm detected");
            steadyHistory.push(true);
//            steady = true;
        }

        // Update steady variable
        if (steadyHistory.length > history_len/4){
            steadyHistory.shift();
        }
        steady = steadyHistory.every(elem => elem);



//        steady = Math.abs(diff) < 5;


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
            if (head_size_history[0]*1.2 < head_size_history[history_len-1] &&
                selectedElemIndex == -1){ // requires that nothing is clicked
    //            console.log("clicking element");
                document.activeElement.click();
            } else if (head_size_history[0] > 1.2*head_size_history[history_len-1]
                    && selectedElemIndex != -1){ // requires that something is clicked
    //            console.log('unclicking element');
                galleryElements[selectedElemIndex].click();
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


//            // Only focus if nothing is clicked
//            if (!elemsClicked.reduce((elem, acc) => elem || acc)){
//                galleryElements[col + row * 2].focus({preventScroll: true})
//            }
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