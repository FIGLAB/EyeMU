//var LoadedData = [[], []];
//var loadEyeData;
//var expos;
//var tensorEyes = [[], []];

var x_vect;
var y_vect;
var embeddings_data = new Object();

window.onload = function yea() {
    //FileReader reads data from Blob or File
    var textFile = null;
    var makeTextFile = function (text) {
        var data = new Blob([text], {type: 'application/json'});

        // If we are replacing a previously generated file we need to
        // manually revoke the object URL to avoid memory leaks.
        if (textFile !== null) { window.URL.revokeObjectURL(textFile);}

        textFile = window.URL.createObjectURL(data);

        // returns a URL you can use as a href
        return textFile;
    };

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


var isArray = Array.isArray || function(value) {
  return {}.toString.call(value) !== "[object Array]"
};

function shuffle() {
  var arrLength = 0;
  var argsLength = arguments.length;
  var rnd, tmp;

  for (var index = 0; index < argsLength; index += 1) {
    if (!isArray(arguments[index])) {
      throw new TypeError("Argument is not an array.");
    }

    if (index === 0) {
      arrLength = arguments[0].length;
    }

    if (arrLength !== arguments[index].length) {
      throw new RangeError("Array lengths do not match.");
    }
  }

  while (arrLength) {
    rnd = Math.floor(Math.random() * arrLength);
    arrLength -= 1;
    for (argsIndex = 0; argsIndex < argsLength; argsIndex += 1) {
      tmp = arguments[argsIndex][arrLength];
      arguments[argsIndex][arrLength] = arguments[argsIndex][rnd];
      arguments[argsIndex][rnd] = tmp;
    }
  }
}


