showPredictDot = false;


const s = ( p ) => {
    // Setup the Processing Canvas
    windowWidth = p.windowWidth;
    windowHeight = p.windowHeight*.999;

    let width = windowWidth;
    let height = windowHeight;
    console.log("processing width and height", width, height);

    var blankPNG = "data:image/png;base64, iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+P+/HgAFhAJ/wlseKgAAAABJRU5ErkJggg==";
    var bgImage;
    var notifs = [["Joe Momma", "icon1.png", "Get off your phone!", ""],
//                  ["Joe Momma", "'data:image/png;base64, "],
                ];
    // For each notification, we need:
//                app name, image icon filename, notif message, and optional photo

 // text drawn at width/2, 2*height/5

    p.setup = function (){
        var canv = p.createCanvas(windowWidth, windowHeight);
        canv.parent("p5jscanvasholder");

        p.strokeWeight( 1 );
        p.frameRate(60);

        // Load in the article background
        bgImage = p.loadImage('../static/notifdemo/nyt2.png');

        // Prepare the notif images by replacing strings with the image
        for (let i = 0; i< notifs.length; i++){
            for (ind of [1,3]){
                if (notifs[i][ind].length > 0){
                    notifs[i][ind] = p.loadImage("../static/notifdemo/" + notifs[i][ind]);
                } else{
                    notifs[i][ind] = blankPNG;
                }
            }
        }
        startNotifLoop();
    }

    // Main draw loop
    p.draw = function (){
        p.image(bgImage, 0, 0, windowWidth, windowWidth*2282/1170);
        p.fill( 0, 60, 90 );
        p.stroke(255);

//        drawNotif(0);
//        p.noLoop();
//
    }

    var topMargin = 10;
    var notifHeight = 150;
    var LRMargin = 10;

    function drawNotif(i){
        startY = topMargin + (notifHeight+topMargin)*i;
        curNotif = notifs[i];

        // Draw body
        p.fill("#00000010");
        p.rect(LRMargin, startY, windowHeight-2*LRMargin, notifHeight)
    }
};


var allNotifs = []
var notifHeight = 110;

var sentLeft = false;
var sentRight = false;
var pulled = false;
var pushed = false;



var defaultImPath = "../static/notifdemo/fakenotif2.png";
var slackpath = "../static/notifdemo/slacknotif.png";
var calpath = "../static/notifdemo/calendarnotif.png";
var apmuspath = "../static/notifdemo/applemusicnotif.png";
var apmus = "../static/notifdemo/apmus3.jpg";
var twostart = [calpath, slackpath]


function startNotifLoop(){
    for (let i = 0; i < 2; i++){

        let tmp = addNotif(twostart[i], i);
    }

    notifDetectLoop();
}

function notifDetectLoop(){

    // Left flick while top is focused,
    // Right flick while top is focused,
    // pull while top is focused,
    // push while full frame up


    // Focus the element that is in focus
    if (typeof(localPreds) != "undefined"){
        let eyeXY = getMeanEyeXY(localPreds.slice(3))
        if (eyeXY[1] < .2){
//            console.log(!allNotifs[0].hidden, !allNotifs[1].hidden)
            if (!allNotifs[0].hidden) allNotifs[0].focus();
            else if (!allNotifs[1].hidden) allNotifs[1].focus();
            else if (allNotifs.length > 2 && !allNotifs[2].hidden) allNotifs[2].focus();
        } else if (eyeXY[1] < .4){
            if (!allNotifs[0].hidden) allNotifs[1].focus();
        } else {
            if (document.activeElement != document.body){
                document.activeElement.blur();
            }
        }
    }


    // Detect the 4 actions
    if (lastGesture == 3 && document.activeElement  == allNotifs[0] && !sentLeft){
        sendLeft(0);
        sentLeft = true;
        console.log("sending left")
    } else if (lastGesture == 1 && document.activeElement  == allNotifs[1] && !sentRight){
        sendRight(1);
        sentRight = true;
        console.log("sending right")
    } else if (lastGesture == 5 && document.activeElement  == allNotifs[2] && !pulled){
        pulled = true;
        fullSizeApp()
        console.log("full")
    } else if (lastGesture == 6 && !pushed && pulled){
        pushed == true;
        unfullSizeApp();
        console.log("unfull")
    }


    // Reset the last gesture var if we triggered on it
    if (lastGesture != -1){
        lastGesture = -1;
    }

    setTimeout(notifDetectLoop, 50);
}


function addNotif(impath, i){
    let notification_elem = document.createElement("img");

    notification_elem.setAttribute("class", "top_notif");

    notification_elem.setAttribute("src", impath);
    notification_elem.setAttribute("tabindex", 0);
    notification_elem.width = window.innerWidth - 12*2;
    notification_elem.height = notifHeight;
    notification_elem.style.top = (notifHeight+10)*i + "px";
    notification_elem.style.position='absolute';

    // Log and add notification to body in a few seconds
    allNotifs.push(notification_elem);
    setTimeout(() => document.body.append(notification_elem), 1500*(i+1));
    return notification_elem
}


function sendLeft(i){
    allNotifs[i].style.animation = "slideoutleft 1s forwards";
    setTimeout(() => allNotifs[i].hidden = true, 1200);

    for (thing of allNotifs.slice(i+1)){
        thing.style.animation = "slideup 1s forwards";
//        setTimeout(() => thing.style.top = "0px", 1300);
//        thing.style.animation = "slideup 1s";
//        setTimeout(() => thing.style.top = "0px", 1000);
    }
}

function sendRight(i){
    allNotifs[i].style.animation = "slideoutright 1s forwards";
    setTimeout(() => allNotifs[i].hidden = true, 999);

    setTimeout(() => {
        notifHeight = 130;
        addNotif(apmuspath, 0);
        }, 1500);
}


var appIm = document.createElement("img");
appIm.setAttribute("class", "fullApp");

appIm.setAttribute("src", apmus);
appIm.width = window.innerWidth-2;
appIm.style.top = "0px";
appIm.height = window.innerWidth*2391/1170;
appIm.style.position='absolute';

function fullSizeApp(){
    document.body.append(appIm);
    setTimeout(() => allNotifs[2].hidden=true, 1000)
}

function unfullSizeApp(){
    appIm.style.animation = "unbloomImage .2s forwards";
}
//fullSizeApp()

//sendLeft(allNotifs[0]);

//sendLeft(allNotifs[0]);


// JS on the HTML page calls notifstarter, which calls p5js, which calls startnotifloop. Whew!
function notifStarter(){
    if (typeof(curPred) == 'undefined' || !AccelStarted){
//    if (!AccelStarted){
        console.log("curPred undefined, notifs demo restarting")
        setTimeout(notifStarter, 400);
        return;
    }

    document.getElementById('accelbuttonholder').remove();
    let myp5 = new p5(s);
    console.log("Notif starting")

    // Remove ugly margin on edges of page. Small margins still exist oh well
    document.body.style.margin = "0px";
    document.body.style.backgroundColor = "white";

    setTimeout(liveloop, 200);
}















