// x and y vects
var eyeData = [[],[]];
var eyeVals = [];
var headTilts =[];
var headSizes = [];
var curLen = 0;

// Resize eyeballs to this size
var inx = 50;
var iny = 25;

// Machine learning things
var eyeModel;
var lr = .001;
var epochNums = 50;
var valsplit = .1;

function getAccel(){
DeviceMotionEvent.requestPermission()
    .then(response => {
      if (response == 'granted') {
        window.addEventListener('devicemotion', (e) => {
          // do something with e
          console.log(e)
        })
      }
    })
    .catch(console.error)
}



async function main() {
    await tf.setBackend('wasm');

    // Load mobilenet
    net = await mobilenet.load();
    console.log('Successfully loaded model');

//    // Make a prediction through the model on our image.
//    const imgEl = document.getElementById('img');
//    const result = await net.classify(imgEl);
//    console.log(result);
}


