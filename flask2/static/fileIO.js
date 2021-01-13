//var LoadedData = [[], []];
//var loadEyeData;
//var expos;
//var tensorEyes = [[], []];

var x_vect;
var y_vect;
var embeddings_data = new Object();

window.onload = function yea() {
//    //FileReader reads data from Blob or File
//    var textFile = null;
//    var makeTextFile = function (text) {
//        var data = new Blob([text], {type: 'application/json'});
//
//        // If we are replacing a previously generated file we need to
//        // manually revoke the object URL to avoid memory leaks.
//        if (textFile !== null) { window.URL.revokeObjectURL(textFile);}
//
//        textFile = window.URL.createObjectURL(data);
//
//        // returns a URL you can use as a href
//        return textFile;
//    };

    var eyeDataDownloadButton = document.getElementById('eyeDataFile');
    if (eyeDataDownloadButton != null){
        eyeDataDownloadButton.addEventListener('click', function () {
            console.log('in eyedatadownload click');
            var link = document.createElement('a');
            link.target = '_blank';
            link.download = 'gazelData.json';
            link.href = makeTextFile(getUserDataAsString());
            link.click();
        }, false);
    }
}


function getUserDataAsString(){
    return tf.tidy(() => {
        let a = tf.stack(leftEyes_x).arraySync();
        let b = tf.stack(rightEyes_x).arraySync();
        let c = tf.stack(eyeCorners_x).arraySync();

        return JSON.stringify([a, b, c, faceGeom_x, screenXYs_y]);
    });
}


var expose;
var expose2;
function openFile(event) {
    var input = event.target;
    expose2 = input;

    // Read each and append all eye pics
    input.files.forEach(function (fileObject, ind){
        fileObject.text().then(fileContents => {
            parsedData = JSON.parse(fileContents);
            expose = parsedData
//            console.log(fileObject)

            fileName = input.files[ind].name;
            fileName = fileName.replace(".json", "").replace(" ", "");

            // If we're using embeddings directly, we have [xvect, yvect]
            if (parsedData.length == 2){
                embeddings_data[fileName] = parsedData;
            } else {
                // Assume [leftEyes_x, rightEyes_x, eyeCorners_x, faceGeom_x, screenXYs_y]
                leftEyes_x = tf.unstack(parsedData[0])
                rightEyes_x = tf.unstack(parsedData[1])
                eyeCorners_x = tf.unstack(parsedData[2])
                faceGeom_x = parsedData[3]
                screenXYs_y = parsedData[4]
            }
            console.log(fileName, " parsed");
        });
    });
}

function getLength(key){
    if (!localStorage.getItem(key)){ // Populate if empty
        return -1;
    }

    try{
        tmp = JSON.parse(localStorage.getItem(key))
    } catch{
        return -1;
    }

    return tmp.length;
}

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
//    console.log("after storage:", localStorage[key])




///////////////////////////////////////////////////////////////////////// Saving data vectors

var textFile = null;
// Create a text file out of text
function makeTextFile(text) {
        var data = new Blob([text], {type: 'application/json'});

        // If we are replacing a previously generated file we need to
        // manually revoke the object URL to avoid memory leaks.
        if (textFile !== null) { window.URL.revokeObjectURL(textFile);}

        textFile = window.URL.createObjectURL(data);

        // returns a URL you can use as a href
        return textFile;
};

function saveTensors(x_vector, y_vector){
    x_vect_as_array = x_vector.arraySync();
    y_vect_as_array = y_vector.arraySync();
    combined = JSON.stringify([x_vect_as_array, y_vect_as_array])

    var link = document.createElement('a');
    link.href = makeTextFile(combined);
    link.target = '_blank';
    link.download = "gazelEmbedsData.json";
    link.click();
}


// // Saving regression models from localstorage
function saveRegressionModels(){
    svr_x_str = localStorage.getItem("svr_x");
    svr_y_str = localStorage.getItem("svr_y");
    combined = JSON.stringify([svr_x_str, svr_y_str])

    var link = document.createElement('a');
    link.href = makeTextFile(combined);
    link.target = '_blank';
    link.download = "regressionmodels.json";
    link.click();
}

function downloadResults(){
    resultsStr = localStorage.getItem("results");

    var link = document.createElement('a');
    link.href = makeTextFile(resultsStr);
    link.target = '_blank';
    link.download = "GAZEL_results.json";
    link.click();
}