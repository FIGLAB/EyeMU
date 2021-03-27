showPredictDot = false;


const s = ( p ) => {
    // Setup the Processing Canvas
    windowWidth = p.windowWidth;
    windowHeight = p.windowHeight*.999;

    let width = windowWidth;
    let height = windowHeight;
    console.log("processing width and height", width, height);

    var instr_w = width/2
    var instr_h = height/5
    var instr_x = windowWidth/2 - instr_w/2;
    var instr_y = 7*windowHeight/10 - instr_h/2;

 // text drawn at width/2, 2*height/5

    p.setup = function (){
        var canv = p.createCanvas(windowWidth, windowHeight);
        canv.parent("p5jscanvasholder");

        p.strokeWeight( 1 );
        p.frameRate(60);

    }

    // Main draw loop
    p.draw = function (){
        // Fill canvas same as background, Set fill-color to blue, and make stroke-color white
        p.background(240, 248, 255);
        p.fill( 0, 60, 90 );
        p.stroke(255);

        p.
    }

};








function notifStarter(){
    if (typeof(curPred) != 'undefined' || !AccelStarted){
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



