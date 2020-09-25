var started = false;
var x = 0;
var y = 0;
var velX = 2;
var velY = 2;
var Lcount = 0;

function Lclicked(){
    Lcount++;
    counter=document.getElementById('ImageCounter')
    counter.innerHTML='Images This Session: ' + Lcount
}

function dotChangeXY(){
    x = Math.floor(Math.random()*100);
    y = Math.floor(Math.random()*100);
}

function dotStopper(){
    while (started){
        started = false;
    }
}

function dotgenerator() {
    const dots = document.getElementsByClassName('dot');
    if (dots.length == 0){
        // Spawn initial dot
        x = Math.floor(Math.random()*100);
        y = Math.floor(Math.random()*100);
        elem=document.createElement("div");
        elem.setAttribute("class", "dot");
        elem.setAttribute("style", "left:"+ x +"%;top:"+ y +"%;");
        document.body.appendChild(elem);
        started = true;
    } else{
        // Move the dot by its current velocity, bounding it
        elem = document.getElementsByClassName('dot')[0];
        if (x >= 95 || x < 0){
            velX = -velX;
            if (x > 50){ x = 94; }
            else { x = 0; }

        }
        if (y >= 95 || y < 0){
            velY = -velY;
            if (y > 50){ y = 94; }
            else { y = 0; }

        }

        // Add random noise to the dot
        x = x + velX + Math.floor(Math.random()*3) + 1;
        y = y + velY + Math.floor(Math.random()*3) - 1;

        elem.setAttribute("style", "left:"+ x +"%;top:"+ y +"%;");
    }
}
