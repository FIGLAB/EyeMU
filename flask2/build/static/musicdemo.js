showPredictDot = false;

var startString = "../static/musicdemo/";

var maindisplay = startString + "maindisplay.png"
var americanpie = startString + "americanpie.png"
var redhot = startString + "redhot.png"
var thirdeyeblind = startString + "teb.png"
var thirdeyeblindBigVol = startString + "tebbigvol.png"
var thirdeyeblindlyricsPath = startString + "lyrics.png"

var songPaths = [americanpie, redhot, thirdeyeblind];
var songArr = [];

function createSong(i){
    let song = document.createElement("img");
    song.src = songPaths[i];

//    song.setAttribute("tabindex", 0);
    song.width = window.innerWidth;
    song.style.position = "absolute";
    song.style.zIndex = 1;
    song.style.top = "-40px";
    song.style.left = window.innerWidth*i + "px";

    // Set transitions
    song.style.transition = "all .5s";

    document.body.append(song)
    songArr.push(song)

}

function skip2NextSong(){
    for (let i = 0; i < songArr.length; i++){
        songArr[i].style.transform += " translateX(-" + window.innerWidth + "px) ";
    }
    thirdeyeblindlyrics.style.transform += " translateX(-" + window.innerWidth + "px) ";
}

function pullUpLyrics(){
    thirdeyeblindlyrics.style.transform += " translateY(-303px)";
    songArr[2].style.transform += " translateY(-303px)";
}

function pullDownLyrics(){
    thirdeyeblindlyrics.style.transform += " translateY(303px)";
    songArr[2].style.transform += " translateY(303px)";
}

function increaseVol(){
    songArr[2].src = thirdeyeblindBigVol;
}

//////////// Function for the volume slider
var volSlider;
//curVol = .4;
var volW = 290;
var curVol = 100
var increment = 30;

var bar1;
var bar2;
var circ;
var boxAround;
var lyricBox;
function createSlider(){
    bar1 = document.createElement("div");
    bar1.style.position = "absolute";
    bar1.style.backgroundColor = "#fff";
    bar1.style.height = "5px";
    bar1.style.top = "73px";
    bar1.style.left = "70px";
    bar1.style.width = curVol + 5 + "px";
    bar1.style.borderRadius = "10px";
    bar1.style.zIndex = 4;



    bar2 = document.createElement("div");
    bar2.style.position = "absolute";
    bar2.style.backgroundColor = "#c82b2b";
    bar2.style.height = "5px";
    bar2.style.top = "73px";
    bar2.style.left = 70 + curVol + "px";
    bar2.style.width = (volW - curVol) + "px";
    bar2.style.borderRadius = "10px";
    bar2.style.zIndex = 4;

    circ = document.createElement("div");
    circ.classList.add("dot");
    circ.style.height = "20px";
    circ.style.width = "20px";
    circ.style.left = (70 + curVol - 10) + "px";
    circ.style.top = (73 - 6.6) + "px";
    circ.style.zIndex = 6;


    // Add transitions and hide all
    circ.style.opacity = 0;
    bar1.style.opacity = 0;
    bar2.style.opacity = 0;

    circ.style.transition = "all .5s";
    bar1.style.transition = "all .3s";
    bar2.style.transition = "all .3s";

    document.body.append(bar1);
    document.body.append(bar2);
    document.body.append(circ);



    // Add box
    boxAround = document.createElement("div");
    boxAround.style.position = "absolute";
//    boxAround.style.backgroundColor = ;
    boxAround.style.height = "40px";
    boxAround.style.width = "370px";
    boxAround.style.left = 5 + "px";
    boxAround.style.top = 51 + "px";
    boxAround.style.zIndex = 6;

    boxAround.style.borderRadius = "10px";
    boxAround.style.border = "4px solid #1DB954";
    boxAround.style.transition = "all .2s";
    boxAround.style.opacity = 0;

    document.body.append(boxAround);

    // Add other box
    lyricBox = document.createElement("div");
    lyricBox.style.position = "absolute";
//    boxAround.style.backgroundColor = ;
    lyricBox.style.height = "20px";
    lyricBox.style.width = "80px";
    lyricBox.style.left = window.innerWidth/2 - 43 + "px";
    lyricBox.style.top = (778 - 73) + "px";
    lyricBox.style.zIndex = 6;

    lyricBox.style.borderRadius = "10px";
    lyricBox.style.border = "4px solid #1DB954";
    lyricBox.style.transition = "all .2s";
    lyricBox.style.opacity = 0;

    document.body.append(lyricBox);




    // Add transitions and hide all
    circ.style.opacity = 0;

}




function showSlider(){
    circ.style.opacity = 1;
    bar1.style.opacity = 1;
    bar2.style.opacity = 1;
    boxAround.style.opacity = 1;
}

function hideSlider(){
    circ.style.opacity = 0;
    bar1.style.opacity = 0;
    bar2.style.opacity = 0;
    boxAround.style.opacity = 0;
}

function hlLyrics(){
    lyricBox.style.opacity = 1;
}

function unhLyrics(){
    lyricBox.style.opacity = 0;
}


function increaseVol(){
    curVol += increment;
    circ.style.transform += " translateX(" + increment + "px)";
    bar1.style.width = curVol + 5 + "px";

    bar2.style.width = volW - curVol + "px";
    bar2.style.left = 70 + curVol + "px";
}


var thirdeyeblindlyrics;
function startSongLoop(){
    // Add songs
    for (let i of Array(3).keys()){
        createSong(i);
    }

    // Add lyrics
    thirdeyeblindlyrics = document.createElement("img");
    thirdeyeblindlyrics.src = thirdeyeblindlyricsPath;
    thirdeyeblindlyrics.width = window.innerWidth;
    thirdeyeblindlyrics.style.position = "absolute";
    thirdeyeblindlyrics.style.zIndex = 1;
    thirdeyeblindlyrics.style.top = "303px";
    thirdeyeblindlyrics.style.left = window.innerWidth*2 + "px";
    thirdeyeblindlyrics.style.transition = "all .5s"; // Set transitions

    document.body.append(thirdeyeblindlyrics)


    // Make sliders
    createSlider();



    document.body.style.zoom = "1";
    gestDetectLoop();
//    startedDemo = true;
//    document.body.onclick = () => {
//        if (startedDemo){
//            location.reload();
//        }
//    };
}


var volLock = false;
var statemachine = 0;
function gestDetectLoop(){
    // flick right and left

    // Focus the element that is in focus
    let focusRegion;
    if (typeof(localPreds) != "undefined"){
        let eyeXY = getMeanEyeXY(localPreds.slice(5))

        if (eyeXY[1] < .15){
            showSlider();
        } else{
            hideSlider();
        }

        if (eyeXY[1] > .85 && statemachine == 2){
            hlLyrics();
        } else {
            unhLyrics();
        }
    }
//var gestureNames = ["Forward flick",
//"Right flick",
// "Right tilt",
// "Left flick",
//  "Left tilt",
//   "Pull close",
//    "Push away",
//    "Turn to right",
//     "Turn to left"];

    if (statemachine >= 4){
        console.log()
    }


    if (lastGesture == 1 && statemachine <= 1){
        skip2NextSong();
        statemachine += 1;
    } else if (lastGesture == 5 && (eyeXY[1] > .85) && statemachine==2){
        pullUpLyrics();
        statemachine += 1;
    } else if (lastGesture == 6  && statemachine==3){
        pullDownLyrics();
        statemachine += 1;
    } else if ((eyeXY[1] < .15) && lastGesture == 7 && statemachine>=4 && !volLock){
        if ((orient_short_history[0][histLen-1] > 25 && orient_short_history[0][histLen-1] < 180) ||
             orient_short_history[0][histLen-1] < 345 && orient_short_history[0][histLen-1] > 180){
            increaseVol();
            volLock = true;
            setTimeout(() => volLock = false, 400);
        }

    }


    // Reset the last gesture var if we triggered on it
    if (lastGesture != -1){

        lastGesture = -1;
    }

    setTimeout(gestDetectLoop, 50);
}




// JS on the HTML page calls notifstarter, which calls p5js, which calls startnotifloop. Whew!
function musicstarter(){
    if (typeof(curPred) == 'undefined' || !AccelStarted){
        console.log("curPred undefined, music demo restarting")
        setTimeout(musicstarter, 400);
        return;
    }

    document.getElementById('accelbuttonholder').remove();
    console.log("music starting")

    // Remove ugly margin on edges of page. Small margins still exist oh well
    document.body.style.margin = "0px";
    document.body.style.backgroundColor = "white";

    setTimeout(liveloop, 200);
    setTimeout(startSongLoop, 400);
}





