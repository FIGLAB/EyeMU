showPredictDot = false;


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


var inboxImPath = "../static/emaildemo/maininboxblank.png";
var threadImPath = "../static/emaildemo/thread.png";
var technewsPath = "../static/emaildemo/technewsBig.png";


var startString = "../static/emaildemo/";
var emailPaths = [
    "email0.png",
    "email1.png",
    "email2.png",
    "email3.png",
    "email4.png",
    "email5.png",
    "email6.png"
]
emailPaths = emailPaths.map((x) => startString + x)

var bigTechNewsPath = startString + "technews.png";
var inboxFoot = startString + "inboxfooter.png";
var inboxHead = startString + "inboxheader.png";
var threadPath = startString + "thread.png";


var header
var foot
var startedDemo = false;

function createHead(){
    header = document.createElement("img");
    header.setAttribute("src", inboxHead);
    header.width = window.innerWidth;
    header.style.position='absolute';
    header.style.zIndex = 4;
    document.body.append(header);
}

function createFoot(){
    foot = document.createElement("img");
    foot.setAttribute("src", inboxFoot);
    foot.width = window.innerWidth;
    foot.style.top = window.innerHeight-foot.height + "px";
    foot.style.position = 'absolute';
    foot.style.zIndex = 4;
    document.body.append(foot);

    // Fix top every once in a while
    setInterval(() => {
        foot.style.top = window.innerHeight-foot.height + "px";
    }, 100);
}

var emailHeight = 100;
var emailArr = [];
var triangleArr = [];
function createEmail(i){

//    startX = header.offsetHeight;
    startX = 130;

    let email = document.createElement("img");
    email.setAttribute("src", emailPaths[i]);
//    email.classList.push("email")
    email.setAttribute("tabindex", 0);
    email.width = window.innerWidth;
    email.style.position = "absolute";
    email.style.zIndex = 1;
    email.style.top = (startX + i*emailHeight) + "px";
    email.style.left = "0px";

    // Set transitions
    email.style.transition = "all .5s";

    document.body.append(email)
    emailArr.push(email)

    // Create drop down triangles
    let tri = document.createElement("div");
    tri.classList.add("rtriangle");
    tri.style.left = "9px";
    tri.style.top = (startX + i*emailHeight + emailHeight*.625) + "px";
    document.body.append(tri);
    triangleArr.push(tri);
}


var kicked = 0;

function kickRight(i){
    emailArr[i].style.transform += " translateX(700px) ";
    emailArr[i].style.opacity = 0;
    triangleArr[i].style.transform += " translateX(700px) ";
    triangleArr[i].style.opacity = 0;

    for (let j = i+1; j < emailArr.length; j++){
        emailArr[j].style.transform += " translateY(-" + emailHeight + "px) ";
        triangleArr[j].style.transform += " translateY(-" + emailHeight + "px) ";
    }
    kicked += 1;
}


function kickLeft(i){
    emailArr[i].style.transform += " translateX(-700px) ";
    emailArr[i].style.opacity = 0;
    triangleArr[i].style.transform += " translateX(-700px) ";
    triangleArr[i].style.opacity = 0;


    for (let j = i+1; j < emailArr.length; j++){
        emailArr[j].style.transform += " translateY(-" + emailHeight + "px) ";
        triangleArr[j].style.transform += " translateY(-" + emailHeight + "px) ";
    }
    kicked += 1;
}

function pullEmail(){
    // Create the tech view, make it transition to scale 1 from zero.
//    setTimeout(() => bigEmail.style.transform = "scale(1.0,1.0)", 300);
    bigEmail.style.transform = "scale(1.0)";
    bigEmail.style.opacity = 1.0;
}

function pushEmail(){
    bigEmail.style.transform = "scale(0.1) translateY(-1000px)";
    bigEmail.style.opacity = 0.0;
    emailArr[2].src = startString + "email2_read.png";
}

function tiltThread(){
    // Eventually make the email read
    setTimeout(() => emailArr[1].src = startString + "email1_read.png");

    // Slide the rest of the emails down
    for (let j = 2; j < emailArr.length; j++){
        emailArr[j].style.transform += " translateY(" + 350 + "px) ";
//        triangleArr[j].style.transition =
        triangleArr[j].style.transform += " translateY(" + 350 + "px) ";
    }

    // Show the thread, rotate the triangle
    triangleArr[1].style.transform += " rotate(90deg)";
    thread.style.top = (emailArr[1].offsetHeight + emailArr[1].offsetTop) + "px";
    thread.style.opacity = 1;
    thread.style.transform = "scaleY(1)";
}

function untiltThread(){
    // Slide the rest of the emails back up
    for (let j = 2; j < emailArr.length; j++){
        emailArr[j].style.transform += " translateY(-" + 350 + "px) ";
//        triangleArr[j].style.transition =
        triangleArr[j].style.transform += " translateY(-" + 350 + "px) ";
    }

    // Show the thread, rotate the triangle
    triangleArr[1].style.transform += " rotate(-90deg)";
//    thread.style.top = (emailArr[1].offsetHeight + emailArr[1].offsetTop) + "px";
    thread.style.opacity = 0;
    thread.style.transform = "scaleY(0)";
}

var bigEmail
var thread
function startEmailLoop(){
//    // Add header and footer to head and foot
    createHead();
    createFoot();

    // Create big email
    bigEmail = document.createElement("img");
    bigEmail.src = bigTechNewsPath;
    bigEmail.style.top = 0;
    bigEmail.style.left = 0;
    bigEmail.style.position = "absolute";
    bigEmail.style.zIndex = 5;
    bigEmail.width = window.innerWidth;
    bigEmail.style.transition = "all .2s";
    bigEmail.style.transform = "scale(0.1)";
    bigEmail.style.opacity = 0.0;
    document.body.append(bigEmail);



    // Add emails
    for (let i of Array(7).keys()){
        createEmail(i);
    }


    // Create thread
    thread = document.createElement("img");
    thread.src = threadPath;
    thread.style.left = window.innerWidth/8 + "px";
    thread.style.top = (emailArr[1].offsetHeight + emailArr[1].offsetTop) + "px";
    thread.style.position = "absolute";
    thread.width = window.innerWidth*7/8;
    thread.style.transition = "all 0.4s";
    thread.style.transform = "scaleY(0)";
    thread.style.transformOrigin = "0% 0%";
    thread.style.opacity = 0.0;
    document.body.append(thread);


    document.body.style.zoom = "1";
    gestDetectLoop();
    startedDemo = true;
    document.body.onclick = () => {
        if (startedDemo){
            location.reload();
        }
    };
}



var statemachine = 0;
function gestDetectLoop(){
    // flick right and left

    // Focus the element that is in focus
    let focusRegion;
    if (typeof(localPreds) != "undefined"){
        let eyeXY = getMeanEyeXY(localPreds.slice(5))
        focusRegion = Math.trunc((eyeXY[1]-.22)/.125);
        console.log(focusRegion)

        if (focusRegion < 0){
            focusRegion = 0;
        } else if (focusRegion > 3 && focusRegion < 6){
            focusRegion = 3;
        }
        focusRegion = focusRegion + kicked;


        if (statemachine != 1 && statemachine != 3){
            if (focusRegion <= 4){
                emailArr[focusRegion].focus()
                emailArr[focusRegion].style.zIndex = 2;
            } else if (document.activeElement != document.body){
                document.activeElement.style.zIndex = 1;
                document.activeElement.blur();
            }
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


    if (lastGesture == 5 && statemachine == 0){
        pullEmail()
        statemachine += 1;
    } else if (lastGesture == 6 && statemachine == 1){
        pushEmail()
        statemachine += 1;
    } else if (lastGesture == 1 && statemachine == 2){
        tiltThread()
        statemachine += 1;
    } else if (lastGesture == 3 && statemachine == 3){
        untiltThread()
        statemachine += 1;
    }  else if (lastGesture == 8 && statemachine > 3){
        if (focusRegion == 0 || focusRegion == 3){
            kickLeft(focusRegion);
            statemachine += 1;
        }
    }


    // Reset the last gesture var if we triggered on it
    if (lastGesture != -1){
        lastGesture = -1;
    }

    setTimeout(gestDetectLoop, 50);
}






// JS on the HTML page calls notifstarter, which calls p5js, which calls startnotifloop. Whew!
function emailStarter(){
    if (typeof(curPred) == 'undefined' || !AccelStarted){
//    if (!AccelStarted){
        console.log("curPred undefined, email demo restarting")
        setTimeout(emailStarter, 400);
        return;
    }

    document.getElementById('accelbuttonholder').remove();
    console.log("Email starting")

    // Remove ugly margin on edges of page. Small margins still exist oh well
    document.body.style.margin = "0px";
    document.body.style.backgroundColor = "white";

    setTimeout(liveloop, 200);
    setTimeout(startEmailLoop, 400);
}















