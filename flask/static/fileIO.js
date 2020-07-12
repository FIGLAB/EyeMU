var LoadedData = [[], []];
var expos;

window.onload=function yea(){
    console.log('window loaded, in filesaveload');
    //FileReader reads data from Blob or File
    var textFile = null,
      makeTextFile = function (text) {
        var data = new Blob([text], {type: 'application/json'});

        // If we are replacing a previously generated file we need to
        // manually revoke the object URL to avoid memory leaks.
        if (textFile !== null) {
          window.URL.revokeObjectURL(textFile);
        }

        textFile = window.URL.createObjectURL(data);

        // returns a URL you can use as a href
        return textFile;
      };

    var eyeDataDownloadButton = document.getElementById('eyeDataFile');
    eyeDataDownloadButton.setAttribute('onclick', function () {
        console.log('in eyedatadownload');
        var link = document.createElement('a');
        link.setAttribute('download', 'eyeData.json');
        link.href = makeTextFile(JSON.stringify([eyeData,eyeVals]));
        document.body.appendChild(link);
        window.requestAnimationFrame(function () {
          var event = new MouseEvent('click');
          link.dispatchEvent(event);
          document.body.removeChild(link);
        });
    });

    eyeDataDownloadButton.addEventListener('click', function () {
        console.log('in eyedatadownload');
        var link = document.createElement('a');
        link.setAttribute('download', 'eyeData.json');
        link.href = makeTextFile(JSON.stringify([eyeData,eyeVals,headTilts]));
        document.body.appendChild(link);
        window.requestAnimationFrame(function () {
          var event = new MouseEvent('click');
          link.dispatchEvent(event);
          document.body.removeChild(link);
        });        
    }, false);
}



function openFile(event) {
    var input = event.target;

    // Read each and append all eye pics
    input.files.forEach(function (filename){
        const reader = new FileReader();
        reader.onload = function(){
            const loadEyeData=JSON.parse(reader.result);
            console.log(loadEyeData);

            // Convert all eye dicts into Float32 arrays
            for (i = 0; i < loadEyeData[0][0].length; i++){
                loadEyeData[0][0][i] = Object.values(loadEyeData[0][0][i]);
                loadEyeData[0][1][i] = Object.values(loadEyeData[0][1][i]);
            }

            eyeData[0] = eyeData[0].concat(loadEyeData[0][0]);
            eyeData[1] = eyeData[1].concat(loadEyeData[0][1]);
            eyeVals = eyeVals.concat(loadEyeData[1]);
            headTilts = headTilts.concat(loadEyeData[2]);

        };
        reader.readAsText(filename);
    });
}