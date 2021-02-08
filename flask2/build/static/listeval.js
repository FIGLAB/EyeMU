// List eval that tests both gestures and eye tracking

var evalType = "list";
//var linebreakBetweenGestureName = false;
//var segmentsLabeledLinearly = true;

function createGalleryElems(){
    // Create the container that holds all the elements
    galleryDiv = document.createElement("div");
    galleryDiv.classList.toggle("galleryContainer");
    document.body.append(galleryDiv);

    // Add all images to the page
    galleryElements = [];
    elemsClicked = [];
    elemsFilters = [];

    for (let i = 0; i<6; i++){
        im_container = document.createElement("div");
        im_container.classList.toggle("listdiv");
        im_container.style.backgroundColor = divColors[i];

        a = document.createElement('div')
        a.classList.toggle("listdivtext");
        a.innerText = i;
        galleryNumbers.push(a)
        im_container.append(a)

        galleryDiv.append(im_container);
        galleryElements.push(im_container);
        elemsClicked.push(false);
        elemsFilters.push(0);
    }

    // debug variables
    a = galleryDiv
}

