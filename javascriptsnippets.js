


var textFile = null;
// Create a text file that you can download, out of text
function makeTextFile(text) {
        let data = new Blob([text], {type: 'application/json'});

        // If we are replacing a previously generated file we need to
        // manually revoke the object URL to avoid memory leaks.
        if (textFile !== null) { window.URL.revokeObjectURL(textFile);}

        textFile = window.URL.createObjectURL(data);

        // returns a URL you can use as a href
        return textFile;
};

function downloadText(text){
    let link = document.createElement('a');
    link.href = makeTextFile(text);
    link.target = '_blank';
    link.download = "GAZEL_results.json";
    link.click();
}


///////////////////
function addToStorageArray(key, arr){
    if (!localStorage.getItem(key)){ // Populate if empty
        localStorage[key] = JSON.stringify([]);
    }

    try{
        tmp = JSON.parse(localStorage.getItem(key))
    } catch{
        tmp = []
    }

    tmp.push(arr);
    localStorage[key] = JSON.stringify(tmp);
}

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


/////////// One liners
var average = (array) => array.reduce((a, b) => a + b) / array.length;
var sum = (array) => array.reduce((a, b) => a + b);
var argMax = (array) => array.map((x, i) => [x, i]).reduce((r, a) => (a[0] > r[0] ? a : r))[1]
// Generate range
[...Array(10).keys]

// Iterating over array elems using of
for (thing of [1,2,3,4]){
    console.log(thing);
}
// Out: 1, 2, 3, 4

// Iterating over array indices using in
for (thing in [1,2,3,4]){
    console.log(thing);
}
// Out: 0, 1, 2, 3













