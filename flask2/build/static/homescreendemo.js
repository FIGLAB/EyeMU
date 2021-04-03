showPredictDot = false;




var startString = "../static/homescreendemo/";
var bgPath = startString + "phonebg2.png";

var weatherPath = startString + "weather.jpg";
var calendarPath = startString +  "cal.jpg";

function createBG(){
    bg = document.createElement("img");
    bg.src = bgPath;
    bg.width = window.innerWidth;
    bg.style.position='absolute';
    bg.style.top = 0;
    bg.style.left = 0;
    bg.style.zIndex = 0;
    document.body.append(bg);
}

function createIconOutline(row, col){
    var inddot = document.createElement("div")
    inddot.classList.add("icon");

    inddot.style.left = (30 + 90*col - 8) + "px";
    inddot.style.top = (28 + 98*row - 8) + "px";

    document.body.append(inddot);
    return inddot
}


function lightUpIcon(row, col){
//    allIcons[col][row].style.borderColor = "#51a0d5ff";
    allIcons[col][row].style.borderColor = "#ff0000ff";
}

function lightDownIcon(row, col){
    allIcons[col][row].style.borderColor = "#00000000";
}

allIcons = [];
var weather;
var cal;

function startHomeLoop(){
//    // Add header and footer to head and foot
    createBG();


    for (let col in [0,1,2,3]){
        allIcons.push([]);
        for (let row in [0,1,2,3,4]){
            let tmpdot = createIconOutline(row, col);
            allIcons[col].push(tmpdot);
        }
    }


    // Add weather fullscreen
    weather = document.createElement("img");
    weather.src = weatherPath;
    weather.style.left = "135px";
    weather.style.top = "-250px";
    weather.style.position = "absolute";
    weather.width = window.innerWidth;
    weather.style.opacity = 0;
    weather.style.transition = "all 0.4s";
    weather.style.transform = "scale(0.1)";
    weather.style.zIndex = 4;
    document.body.append(weather);

    // Add calendar fullscreen
    calen = document.createElement("img");
    calen.src = calendarPath;
    calen.style.left = "-45px";
    calen.style.top = "-345px";
    calen.style.position = "absolute";
    calen.width = window.innerWidth;
    calen.style.opacity = 0;
    calen.style.transition = "all 0.4s";
    calen.style.transform = "scale(0.1)";
    calen.style.zIndex = 4;
    document.body.append(calen);


    document.body.style.zoom = "1";
    setTimeout(gestDetectLoop, 100);
    startedDemo = true;
    document.body.onclick = (e) => {
        var cursorX = e.pageX;
        var cursorY = e.pageY;
        console.log(cursorX, cursorY);
//        if (startedDemo){
//            location.reload();
//        }
    };
}


function bloomWeather(){
    weather.style.transform = "";
    weather.style.transform += " scale(1)";
    weather.style.transform += " translateX(-" + weather.offsetLeft + "px)";
    weather.style.transform += " translateY(" + abs(weather.offsetTop) + "px)";
    weather.style.opacity = 100;
}


function bloomCal(){
    calen.style.transform = "";
    calen.style.transform += " scale(1)";
    calen.style.transform += " translateX(" + (calen.getBoundingClientRect().left-85)+ "px)";
    calen.style.transform += " translateY(" + abs(calen.offsetTop) + "px)";
    calen.style.opacity = 100;
}

function unbloom(img){
    img.style.transform = "";
    img.style.transform += " scale(0.1)";
    img.style.opacity = 0;
}


var fullsized = 0;
var statemachine = 0;
function gestDetectLoop(){
    // Focus the element that is in focus
    let focusRegion;
    if (typeof(localPreds) != "undefined"){
        let eyeXY = getMeanEyeXY(localPreds.slice(5))
        let x = Math.trunc(eyeXY[0]/.25);
        let y = Math.trunc(eyeXY[1]*7);

        x = Math.max(Math.min(x, 3), 0);
        console.log(x,y);
        focusRegion = [x,y];

//        if (typeof(allIcons[y]) != "undefined" && typeof(allIcons[y][x]) != "undefined"){
//            lightUpIcon(y,x);
//            setTimeout(() => lightDownIcon(y,x), 200);
//        }

        // Turn off all other ones except the focusRegion one
        for (i of [0,1,2,3]){
            for (j of [0,1,2,3,4]){
                if (i == x && j == y){
                    if (typeof(allIcons[y]) != "undefined" && typeof(allIcons[y][x]) != "undefined"){
                        lightUpIcon(y,x);
                    }
                } else{
                    lightDownIcon(j,i);
                }
            }
        }

//        if (statemachine != 1 && statemachine != 3){
//            if (focusRegion <= 4){
//                emailArr[focusRegion].focus()
//                emailArr[focusRegion].style.zIndex = 2;
//            } else if (document.activeElement != document.body){
//                document.activeElement.style.zIndex = 1;
//                document.activeElement.blur();
//            }
//        }
    }

    if (fullsized == 0 && focusRegion[0] == 1 && focusRegion[1] == 0 && lastGesture == 5){ // calendar
        fullsized = 1;
        bloomCal();
    } else if (fullsized == 0 && focusRegion[0] == 3 && focusRegion[1] == 1 && lastGesture == 5){ // weather
        fullsized = 2;
        bloomWeather();
    } else if (fullsized == 1 && lastGesture == 6){
        unbloom(calen);
        fullsized = 0;
    } else if (fullsized == 2 && lastGesture == 6){
        unbloom(weather);
        fullsized = 0;
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




// JS on the HTML page calls notifstarter, which calls p5js, which calls startnotifloop. Whew!
function homescreenStarter(){
    if (typeof(curPred) == 'undefined' || !AccelStarted){
//    if (!AccelStarted){
        console.log("curPred undefined, home screen demo restarting")
        setTimeout(homescreenStarter, 400);
        return;
    }

    document.getElementById('accelbuttonholder').remove();
    console.log("Home screen starting")

    // Remove ugly margin on edges of page. Small margins still exist oh well
    document.body.style.margin = "0px";
    document.body.style.backgroundColor = "white";

    setTimeout(liveloop, 200);
    setTimeout(startHomeLoop, 400);
}





