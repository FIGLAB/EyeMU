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
        bgImage = p.loadImage('../static/notifdemo/nyt.jpg');

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

var ex;
var allNotifs = []
var notifHeight = 89;
function startNotifLoop(){
    for (let i = 0; i < 2; i++){
        let notification_elem = document.createElement("img");
        ex = notification_elem; // delete me

        notification_elem.setAttribute("class", "top_notif");

        notification_elem.setAttribute("src", "../static/notifdemo/notif1.png");
        notification_elem.width = window.innerWidth - 10*2;
        notification_elem.style.top = notifHeight*i + "px";
        notification_elem.style.position='absolute';

        allNotifs.push(notification_elem);

        setTimeout(() => document.body.append(notification_elem), 1000*(i+1));
    }
}

function sendLeft(i){
    allNotifs[i].style.animation = "slideoutleft 1s";
    for (thing of allNotifs.slice(i+1)){
        thing.style.animation = "slideup 1s";

        setTimeout(() => thing.style.top = "0px", 999);
    }

    setTimeout(() => allNotifs[i].hidden = true, 700);
}

document.body.onclick = () => {
    sendLeft(0);
};



//sendLeft(allNotifs[0]);



function notifStarter(){
//    if (typeof(curPred) != 'undefined' || !AccelStarted){
    if (!AccelStarted){
        console.log("curPred undefined, notifs demo restarting")
        setTimeout(notifStarter, 400);
        return;
    }

    document.getElementById('accelbuttonholder').remove();
    let myp5 = new p5(s);
    console.log("Notif starting")

    // Remove ugly margin on edges of page. Small margins still exist oh well
    document.body.style.margin = "0px";
}



