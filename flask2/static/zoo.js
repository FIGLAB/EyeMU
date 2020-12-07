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


// Zoo #3, one-handed photo editing
// 12/7 CLARIFICATION: I'm setting all the style in javascript so I can edit it more easily on my end. Should probably move to a CSS global, but this will never see the light of the public so w/e
function imageGallery(){
    // temporary, while I'm debugging CSS stuff
    stopFacemesh = true;

    // Remove ugly margin on edges of page. Small margins still exist oh well
    document.body.style.margin = "0px";
    // Focus on window automatically
    window.focus();

    // Create the container that holds all the elements
    galleryDiv = document.createElement("div");
    galleryDiv.id = "galleryContainer";
    galleryDiv.style.width = window.innerWidth - 15 + "px";
    galleryDiv.style.overflow = "hidden";
    galleryDiv.style.lineHeight = "0px";
    document.body.append(galleryDiv);


    // Add all images to the page
    galleryElements = [];
    for (let i = 0; i<imageGalleryIms.length; i++){
        let a = document.createElement("img")
        a.src = "data:image/png;base64," + imageGalleryIms[i];
        a.style.width = "32.33%";
//        a.style.marginLeft = "0.5%";
//        a.style.marginRight = "0.5%";
//        a.style.marginTop = "0.5%";
        a.style.margin = "0.5%";
        a.style.marginBottom = "0.25%";

        a.tabIndex = 1; // Allows the images to be focused
        a.style.outline = 'none'; // Removes border from their being focused


        // Create animations when they're focused (eye gaze on them)
        a.style.transition = "all 0.4s ease";
        a.onfocus = () => {
                            a.style.borderRadius = "5%";
                            a.style.zIndex = "-1";
                            a.style.transform = "scale(1.5)";
                          };
        a.onblur = () => {
                            a.style.borderRadius = "";
                            a.style.transform = "";
                            a.style.zIndex = "";
                         };

        a.onclick = () => {
//                            console.log(a);
                          };

        // Add element to our internal list and the page
        galleryDiv.append(a);
        galleryElements.push(a);
    }

    // Reset the focused image when user scrolls
    window.onscroll = function (e) {
        document.activeElement.blur()
    }





    // Generate the top and bottom bounds of one elem in each row
    let heightBounds = [0.0];
    for (let i = 3; i < galleryElements.length; i += 3){
//        heightBounds.push([galleryElements[i].offsetTop, galleryElements[i].offsetTop + galleryElements[i].offsetHeight]);
        heightBounds.push(galleryElements[i].offsetTop);
    }

    // Generate left and right bounds of the middle col
    let midLeft = galleryElements[1].offsetLeft;
    let midRight = midLeft + galleryElements[1].offsetWidth;

    document.onmousemove = function (e){
    // Check which square is being looked at depending on the scroll index
//        actualX = window.scrollX + e.pageX;
//        actualY = window.scrollY + e.pageY;
        actualX = e.pageX;
        actualY = e.pageY;

        let row;
        heightBounds.forEach((elem, ind) => {
//            console.log(actualY, elem)
            if (actualY > elem){
                row = ind;
            }
        });
        let col = actualX < midLeft ? 0 : (actualX > midRight ? 2 : 1)

//        console.log(row, col);

        galleryElements[col + row * 3].focus()

    };

//    setInterval(() => {
//        actualX = window.scrollX + 5;
//        actualY = window.scrollY + 5;
//
//        let row = Math.trunc(actualY/squareSideLen);
//        let col = Math.trunc(actualX/squareSideLen);
//        console.log(row)
//
//
//
//
//    }, 100);

}




var i;
function zooSelect(interactionNum){
    i = interactionNum;
    funcs = [dotViz, zoomForMore, imageGallery];
    funcs[interactionNum-1]();
}



imageGalleryIms =  ['iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAYAAABw4pVUAAAAo0lEQVR42u3RAQ0AAAjDMO5fNCCDkG4SmupdZwoQIAICRECACAgQAQECBIiAABEQIAICRECACIiAABEQIAICRECACIiAABEQIAICRECACIiAABEQIAICRECACIiAABEQIAICRECACIiAABEQIAICRECACIiAABEQIAICRECACIiAABEQIAICRECACIiAABEQIAICRECACAgQIEAEBIiAABGQ7w2x48edS3GF7AAAAABJRU5ErkJggg==', 'iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAYAAABw4pVUAAAAoElEQVR42u3RQQkAQAgAsPN9/fNZRNAaIluFReXvxxohRAhChCBECEKEIESIECEIEYIQIQgRghAhCEGIEIQIQYgQhAhBCEKEIEQIQoQgRAhCECIEIUIQIgQhQhCCECEIEYIQIQgRghCECEGIEIQIQYgQhCBECEKEIEQIQoQgBCFCECIEIUIQIgQhCBGCECEIEYIQIQgRIkQIQoQgRAhCrhvZEiHojxqGnQAAAABJRU5ErkJggg==', 'iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAYAAABw4pVUAAAAoElEQVR42u3RQQkAQAgAsPN9deyfTNAaIluFReXvxxohRAhChCBECEKEIESIECEIEYIQIQgRghAhCEGIEIQIQYgQhAhBCEKEIEQIQoQgRAhCECIEIUIQIgQhQhCCECEIEYIQIQgRghCECEGIEIQIQYgQhCBECEKEIEQIQoQgBCFCECIEIUIQIgQhCBGCECEIEYIQIQgRIkQIQoQgRAhCrhtK8N8NRvfS5gAAAABJRU5ErkJggg==', 'iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAYAAABw4pVUAAAAoElEQVR42u3RAQ0AMAgAoNv+KYxlHa3hHFQg8lc/1gghQhAiBCFCECIEIUKECEGIEIQIQYgQhAhBCEKEIEQIQoQgRAhCECIEIUIQIgQhQhCCECEIEYIQIQgRghCECEGIEIQIQYgQhCBECEKEIEQIQoQgBCFCECIEIUIQIgQhCBGCECEIEYIQIQhBiBCECEGIEIQIQYgQIUIQIgQhQhBy3QBHciqAmID/9gAAAABJRU5ErkJggg==', 'iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAYAAABw4pVUAAAAoElEQVR42u3RQQkAQAgAsPN9Pe0fQNAaIluFxc/qxxohRAhChCBECEKEIESIECEIEYIQIQgRghAhCEGIEIQIQYgQhAhBCEKEIEQIQoQgRAhCECIEIUIQIgQhQhCCECEIEYIQIQgRghCECEGIEIQIQYgQhCBECEKEIEQIQoQgBCFCECIEIUIQIgQhCBGCECEIEYIQIQgRIkQIQoQgRAhCrhu/pPKVlu8HUAAAAABJRU5ErkJggg==', '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'];