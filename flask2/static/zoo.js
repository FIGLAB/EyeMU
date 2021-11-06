showPredictDot = false;

function dotViz(){
    console.log("dotViz started")
    showPredictDot = true;
}

// Zoo #3, one-handed photo editing


var disText

function flashText(text){
//    console.log("before", disText.offsetWidth);
    disText.innerHTML = text;
//    console.log("after text", disText.offsetWidth);
    disText.style.left = (window.innerWidth/2 - disText.offsetWidth/2) + "px";
    disText.style.transition = "";
    disText.style.opacity = 1;
    console.log("visible'd");

    setTimeout(()=>{
        disText.style.transition = "all 1s cubic-bezier(.61,.03,.37,.14)";
        disText.style.opacity = 0;
        console.log("invisible'd");
    }, 50);
}


function clickIm(a){
    // Remember initial y position
    origScroll = window.scrollY;

    hideAll();
    a.style.opacity = 1;
    a.style.zIndex = 2;
    a.blur();


    a.style.transform = "";
    a.style.transform += "translateX(-" + a.offsetLeft + "px)";
    start = a.offsetTop
    end = (window.innerHeight - window.innerWidth)-2
    a.style.transform += " translateY(" + (end/2-start) + "px)";
    a.style.transform += " scale(3.05)";

    setTimeout(() => a.style.transition = "", 200);

    // Change document level details
    document.body.style.backgroundColor = "black";
    header.style.opacity = 0;
    footer.style.opacity = 0;
}
function unclickIm(a){
    a.style.transition = "all .2s ease";
    a.style.transform = "";
    a.zIndex = 1;
    let tmp = a.style.filter;
    a.style.filter = tmp;

    showAll()
    document.body.style.backgroundColor = "white";
    header.style.opacity = 1;
    footer.style.opacity = 1;
}


var bordWidth = 3;
function createGalIm(i){
        // Set up path and transition stuff
        let a = document.createElement("img")
        a.src = "/static/imagegallery/" + imageGalleryIms[i];
        a.tabIndex = 1; // Allows the images to be focused
        a.style.transition = "all .2s ease";
        a.style.position = "absolute";
        a.style.zIndex = 1;

        // Set the position
        let col = i % 3;
        let margin = 3
        let row = Math.trunc(i/3);
        a.width = Math.trunc(window.innerWidth/3 - margin*2/3);
//        a.width = Math.trunc(window.innerWidth/3 - margin*2/3) - bordWidth*2;
        a.height = a.width;
        a.style.left = col*margin + col*a.width + "px";
        a.style.top = (89 + row*margin + row*a.width) + "px";
//        a.style.left = col*margin + col*(a.width + bordWidth*2) + "px";
//        a.style.top = (89 + row*margin + row*(a.width + bordWidth*2)) + "px";
        a.style.transformOrigin = "top left";
//        a.style.padding = bordWidth + "px";
        a.style.outline = "none";
        a.style.outlineOffset = (-bordWidth) + "px";



        a.onclick = () => {
            elemsClicked[i] = !elemsClicked[i];
            if (elemsClicked[i]){
                console.log(i, 'selected');
                clickIm(a);
            } else{
                console.log(i, 'deselected');
                unclickIm(a);
            }
        };

        // Add padding, decrease width, add border
        a.onfocus = () => {
            a.style.outline = bordWidth + "px solid red";
        };
//
        a.onblur = () => {
            a.style.outline = "none";
        };




        document.body.append(a)

        galleryElements.push(a);
        elemsClicked.push(false);
        elemsFilters.push(0);
}

function hideAll(){
    galleryElements.forEach((elem,ind) => {
//        elem.hidden = !elemsClicked[ind];
        if (!elemsClicked[ind]){
            elem.style.opacity = 0.0;
        }
    });
}
function showAll(){
    galleryElements.forEach((elem,ind) => {
        if (!elemsClicked[ind]){
            elem.style.opacity = 1;
        }
//        elem.hidden = elemsClicked[ind];
    });
}

var cur;
var origScroll;
var heightBounds;
var header;
var footer;
function imageGallery(){
    if (rBB == undefined || !AccelStarted){
        console.log("rBB undefined, image gallery restarting")
        setTimeout(imageGallery, 400);
        return;
    }
    console.log("image gallery starting")

    // Create filter variables
    filterList = ["hue-rotate(0deg) sepia(0%) contrast(100%)",
    "hue-rotate(30deg) sepia(0%) contrast(100%)",
    "hue-rotate(0deg) sepia(100%) contrast(100%)",
    "hue-rotate(0deg) sepia(0%) contrast(150%)",];
    filterNames = ["Original", "Color Swap", "Sepia", "Contrast Up"]

    numFilters = filterList.length

    disText = document.createElement("p");
    document.body.append(disText);
    disText.innerHTML = "";
    disText.style.position = "absolute";
    disText.style.color = "white";
    disText.style.fontSize = "2em";
    disText.style.zIndex = 10;
    disText.style.top = "10%";
    disText.style.left = (window.innerWidth/2 - disText.offsetWidth/2) + "px";
    disText.style.opacity = 0;


    // Reset the focused image when user scrolls
    window.onscroll = function (e) {
        document.activeElement.blur()
    }

    // Create the container that holds all the elements
//    galleryDiv = document.createElement("div");
//    galleryDiv.classList.toggle("galleryContainer");
//    document.body.append(galleryDiv);

    // set up header and footer
    header = document.createElement("img");
    header.src = "/static/imagegallery/header.jpg";
    header.style.left = "0px";
    header.style.top = "0px";
    header.style.position = "absolute";
    header.width = window.innerWidth;
    header.style.transition = "all .2s";
    header.style.zIndex = 4;
    document.body.append(header);

    footer = document.createElement("img");
    footer.src = "/static/imagegallery/footer.png";
    footer.width = window.innerWidth;
    footer.style.top = window.innerHeight-footer.height + "px";
    footer.style.left = 0;
    footer.style.position = 'absolute';
    footer.style.transition = "all .2s";
    footer.style.zIndex = 4;
    document.body.append(footer);

    // Fix footer top every once in a while
    setInterval(() => {
        footer.style.top = window.innerHeight-footer.height + "px";
    }, 100);

    // Add all images to the page
    galleryElements = [];
    elemsClicked = [];
    elemsFilters = [];
    imageGalleryIms = ["1.jpg", "2.png","3.png","4.jpg","5.jpg","6.jpg","7.jpg","8.jpg","9.jpg","10.jpg","11.jpg","12.jpg","13.jpg","14.png","15.png", "16.png"]


    for (let i = 0; i<imageGalleryIms.length; i++){
        createGalIm(i);
    }


    // Set up body
    document.body.style.backgroundColor = "white";
    document.body.style.transition = "all .2s";


    // Detect user focusing on a specific element
                // 2 elems per row:
    // Get middle coordinate
    let mid = Math.trunc(window.innerWidth/2);

    function cursorFocus(elem) {
      var x = window.scrollX, y = window.scrollY;
      elem.focus();
      window.scrollTo(x, y);
    }


    var history_len = 20;
    var head_size_history = [];
    var headSteady = true;
    var steady = true;


    var localPred = [0, 0];
    var steadyHistory = [];


    cur = galleryElements[0];
    gestDetectLoop();
}





var imClicked = false;
var curFocus;
var focusRegion;
function gestDetectLoop(){
    // Focus the element that is in focus
    let focusRegion;
    if (typeof(localPreds) != "undefined"){
        let eyeXY = getMeanEyeXY(localPreds.slice(6))
        let x = Math.trunc(eyeXY[0]*3);
        let y = Math.trunc((eyeXY[1]-.1)*5);

        x = Math.max(Math.min(x, 2), 0);
        y = Math.max(Math.min(y, 4), 0);
        focusRegion = [x,y];
//        console.log(x,y);

        if (!imClicked){
            let tmp = galleryElements[x + y * 3];
            if (typeof(tmp) != "undefined"){
                tmp.focus({preventScroll: true})
            }
        }
    }

    if (!imClicked && lastGesture == 5 && typeof(galleryElements[focusRegion[0] + focusRegion[1] * 3]) != "undefined"){
        curFocus = galleryElements[focusRegion[0] + focusRegion[1] * 3];
        curFocus.click();
        imClicked = true;
    } else if (imClicked){

        if (lastGesture == 6){
            curFocus.click();
            imClicked = false;
        } else if (lastGesture == 3 || lastGesture == 1){
            const selectedElemIndex = elemsClicked.findIndex(elem => elem);
            if (lastGesture == 3){
//                document.body.dispatchEvent(new KeyboardEvent('keydown',  {'key':'ArrowRight'}));
                elemsFilters[selectedElemIndex] = (elemsFilters[selectedElemIndex] + numFilters + 1) % numFilters;
            } else if (lastGesture == 1){
//                document.body.dispatchEvent(new KeyboardEvent('keydown',  {'key':'ArrowLeft'}));
                elemsFilters[selectedElemIndex] = (elemsFilters[selectedElemIndex] + numFilters - 1) % numFilters;
            }
            galleryElements[selectedElemIndex].style.filter = filterList[elemsFilters[selectedElemIndex]];
            flashText(filterNames[elemsFilters[selectedElemIndex]]);

        }
    }

//var gestureNames = ["Forward flick",
//"Right flick",
// "Right tilt",
// "Left flick",
//  "Left tilt",
//   "Pull close", 5
//    "Push away", 6
//    "Turn to right",
//     "Turn to left"];

    // Reset the last gesture var if we triggered on it
    if (lastGesture != -1){
        lastGesture = -1;
    }

    setTimeout(gestDetectLoop, 50);
}


//            // If left or right arrow, change filter number
//            if (event.key == "ArrowLeft"){
//                elemsFilters[selectedElemIndex] = (elemsFilters[selectedElemIndex] + numFilters - 1) % numFilters;
//            } else if (event.key == "ArrowRight"){
//                elemsFilters[selectedElemIndex] = (elemsFilters[selectedElemIndex] + numFilters + 1) % numFilters;
//            }
//
//            // Apply the filter to that element's CSS
//            galleryElements[selectedElemIndex].style.filter = filterList[elemsFilters[selectedElemIndex]];




var i;
function zooSelect(interactionNum){
//    i = interactionNum;
//    funcs = [dotViz, zoomForMore, imageGallery];
//    funcs[interactionNum-1]();
    imageGallery();

    setTimeout(liveloop, 400);
}


