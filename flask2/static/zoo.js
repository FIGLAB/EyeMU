showPredictDot = false;

function dotViz(){
    console.log("dotViz started")
    showPredictDot = true;
}

// Zoo #2, reading a passage and you get a text notification. Bring closer to your face to see more information
var initialHeadSize
var notification_elem
function zoomForMore(){

    // Create base content in page
    if (document.getElementsByTagName("p").length == 0){
        // Create some content
        contentElem = document.createElement("p");
        contentElem.innerHTML = "There are these two young fish swimming along, and they happen to meet an older fish swimming the other way, who nods at them and says, “Morning, boys, how's the water?” And the two young fish swim on for a bit, and then eventually one of them looks over at the other and goes, “What the hell is water?”"
        contentElem.innerHTML += "<br><img src='https://i.pinimg.com/236x/02/bb/f4/02bbf448aa65f7d261c8703f597e5884--clip-art.jpg'>"
        contentElem.style.fontSize = "300%";
        contentElem.style.margin = "5%";
        document.body.append(contentElem)

    }

    if (rBB == undefined){
        setTimeout(zoomForMore, 100);
        return;
    }

    console.log("Zoom For More demo started")

    // Create popup on screen
    notification_elem = document.createElement("p");
    notification_elem.setAttribute("class", "top_notif");
    notification_elem.innerHTML = "1 New Notification from Messages"
    notification_elem.style.fontSize = "150%"

    setTimeout(() => document.body.append(notification_elem), 1000);

    initialHeadSize = faceGeom.getGeom()[3]
    zoomedOnce = false;
    headBigger = false;
    headBiggerPrev = false;
    // Set up while loop to check headSize
    setInterval(() => {
        curHeadSize = faceGeom.getGeom()[3];
        headBiggerPrev = headBigger
        headBigger = curHeadSize > 1.5*initialHeadSize;

        // If user's face is closer, make the banner bigger
        if (headBiggerPrev != headBigger){
            console.log("trigger change")

            if (headBigger){
                notification_elem.setAttribute("class", "top_notif_selected")
                notification_elem.innerHTML = "1 New Notification from Messages <br> Jane: What's the name of that waffle shop on Craig Street?"
                zoomedOnce = true;
            } else if (zoomedOnce){
                notification_elem.setAttribute("class", "top_notif_deselected")
                notification_elem.innerHTML = "1 New Notification from Messages"
            }
        }

    }, 100);
}


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

// Zoo #3, one-handed photo editing
// 12/7 CLARIFICATION: I'm setting all the style in javascript so I can edit it more easily on my end. Should probably move to a CSS global, but this will never see the light of the public so w/e
var cur;
var origScroll;
function imageGallery(){
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

    // Attach event handler to detect keypresses
    document.body.onkeydown = (event) => {
//        console.log(event);
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

    // Reset the focused image when user scrolls
    window.onscroll = function (e) {
        document.activeElement.blur()
    }

    // Focus on window automatically, fix scroll
    window.scrollBy(0, -1000);
    window.focus();

    // Create the container that holds all the elements
    galleryDiv = document.createElement("div");
    galleryDiv.classList.toggle("galleryContainer");
    document.body.append(galleryDiv);

    // Add all images to the page
    galleryElements = [];
    elemsClicked = [];
    elemsFilters = [];


    for (let i = 0; i<imageGalleryIms.length; i++){
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
        galleryDiv.append(a);

        galleryElements.push(a);
        elemsClicked.push(false);
        elemsFilters.push(0);
    }








    // Detect user focusing on a specific element
                // 2 elems per row:
    // Generate the top and bottom bounds of one elem in each row
    let heightBounds = [0.0];
    for (let i = 2; i < galleryElements.length; i += 2){
        heightBounds.push(galleryElements[i].offsetTop);
    }

    // Generate left and right bounds of the middle col
//    let midLeft = galleryElements[1].offsetLeft;
//    let midRight = midLeft + galleryElements[1].offsetWidth;
    let mid = Math.trunc(window.innerWidth/2);

    function cursorFocus(elem) {
      var x = window.scrollX, y = window.scrollY;
      elem.focus();
      window.scrollTo(x, y);
    }

    document.onmousemove = function (e){
    // Check which square is being looked at depending on the scroll index
        actualX = e.pageX;
        actualY = e.pageY;

        let row;
        heightBounds.forEach((elem, ind) => {
            if (actualY > elem){
                row = ind;
            }
        });
        let col = actualX < mid ? 0 : 1

        // Only focus if nothing is clicked
        if (!elemsClicked.reduce((elem, acc) => elem || acc)){
            galleryElements[col + row * 2].focus({preventScroll: true})
        }
    };

//                // 3 elems per row:
//    // Generate the top and bottom bounds of one elem in each row
//    let heightBounds = [0.0];
//    for (let i = 3; i < galleryElements.length; i += 3){
//        heightBounds.push(galleryElements[i].offsetTop);
//    }
//
//    // Generate left and right bounds of the middle col
//    let midLeft = galleryElements[1].offsetLeft;
//    let midRight = midLeft + galleryElements[1].offsetWidth;
//
//    document.onmousemove = function (e){
//    // Check which square is being looked at depending on the scroll index
//        actualX = e.pageX;
//        actualY = e.pageY;
//
//        let row;
//        heightBounds.forEach((elem, ind) => {
////            console.log(actualY, elem)
//            if (actualY > elem){
//                row = ind;
//            }
//        });
//        let col = actualX < midLeft ? 0 : (actualX > midRight ? 2 : 1)
//
//        // Only focus if nothing is clicked
//        if (!elemsClicked.reduce((elem, acc) => elem || acc)){
//            galleryElements[col + row * 3].focus()
//        }
//    };



    setInterval(() => {
        actualX = window.scrollX + curPred[0]*innerWidth;
        actualY = window.scrollY + curPred[1]*innerHeight;
        //document.body.dispatchEvent(new KeyboardEvent('keydown',  {'key':'whops'}));

        let row;
        heightBounds.forEach((elem, ind) => {
            if (actualY > elem){
                row = ind;
            }
        });
        let col = actualX < mid ? 0 : 1

        // Only focus if nothing is clicked
        if (!elemsClicked.reduce((elem, acc) => elem || acc)){
            galleryElements[col + row * 2].focus({preventScroll: true})
        }
    }, 50);
    cur = galleryElements[0];
}





var i;
function zooSelect(interactionNum){
    i = interactionNum;
    funcs = [dotViz, zoomForMore, imageGallery];
    funcs[interactionNum-1]();
}



imageGalleryIms =  ['iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAYAAABw4pVUAAAAo0lEQVR42u3RAQ0AAAjDMO5fNCCDkG4SmupdZwoQIAICRECACAgQAQECBIiAABEQIAICRECACIiAABEQIAICRECACIiAABEQIAICRECACIiAABEQIAICRECACIiAABEQIAICRECACIiAABEQIAICRECACIiAABEQIAICRECACIiAABEQIAICRECACIiAABEQIAICRECACAgQIEAEBIiAABGQ7w2x48edS3GF7AAAAABJRU5ErkJggg==', 'iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAYAAABw4pVUAAAAoElEQVR42u3RQQkAQAgAsPN9/fNZRNAaIluFReXvxxohRAhChCBECEKEIESIECEIEYIQIQgRghAhCEGIEIQIQYgQhAhBCEKEIEQIQoQgRAhCECIEIUIQIgQhQhCCECEIEYIQIQgRghCECEGIEIQIQYgQhCBECEKEIEQIQoQgBCFCECIEIUIQIgQhCBGCECEIEYIQIQgRIkQIQoQgRAhCrhvZEiHojxqGnQAAAABJRU5ErkJggg==', 'iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAYAAABw4pVUAAAAoElEQVR42u3RQQkAQAgAsPN9deyfTNAaIluFReXvxxohRAhChCBECEKEIESIECEIEYIQIQgRghAhCEGIEIQIQYgQhAhBCEKEIEQIQoQgRAhCECIEIUIQIgQhQhCCECEIEYIQIQgRghCECEGIEIQIQYgQhCBECEKEIEQIQoQgBCFCECIEIUIQIgQhCBGCECEIEYIQIQgRIkQIQoQgRAhCrhtK8N8NRvfS5gAAAABJRU5ErkJggg==', 'iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAYAAABw4pVUAAAAoElEQVR42u3RAQ0AMAgAoNv+KYxlHa3hHFQg8lc/1gghQhAiBCFCECIEIUKECEGIEIQIQYgQhAhBCEKEIEQIQoQgRAhCECIEIUIQIgQhQhCCECEIEYIQIQgRghCECEGIEIQIQYgQhCBECEKEIEQIQoQgBCFCECIEIUIQIgQhCBGCECEIEYIQIQhBiBCECEGIEIQIQYgQIUIQIgQhQhBy3QBHciqAmID/9gAAAABJRU5ErkJggg==', 'iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAYAAABw4pVUAAAAoElEQVR42u3RQQkAQAgAsPN9Pe0fQNAaIluFxc/qxxohRAhChCBECEKEIESIECEIEYIQIQgRghAhCEGIEIQIQYgQhAhBCEKEIEQIQoQgRAhCECIEIUIQIgQhQhCCECEIEYIQIQgRghCECEGIEIQIQYgQhCBECEKEIEQIQoQgBCFCECIEIUIQIgQhCBGCECEIEYIQIQgRIkQIQoQgRAhCrhu/pPKVlu8HUAAAAABJRU5ErkJggg==', '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'];