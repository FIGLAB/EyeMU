var n_calib_rounds = 3;

// Global variables
var radius = 50.0;
var X, Y;
var nX, nY;
var delay = 5; //25
var moveDelay = 50; //120
var calib_counter = 0;
var calib_rounds = 0;
var train = true;

var nx_arr = [];
var ny_arr = [];

// Setup the Processing Canvas
function setup(){
  createCanvas(windowWidth, windowHeight);
  strokeWeight( 1 );
  frameRate( 30 );
  X = width / 2;
  Y = height / 2;
  nX = X;
  nY = Y;

  nx_arr = [width/2, 9*width/10, width/10,9*width/10,width/2,width/10,width/2,width/10,9*width/10];
  ny_arr = [height/10, 9*height/10, height/2,height/10,height/2,9*height/10,9*height/10,height/10,height/2];
  
}

// Main draw loop
function draw(){
  
  // Fill canvas grey
  background( 100 );

  // Set fill-color to blue
  fill( 0, 121, 184 );

  // Set stroke-color white
  stroke(255); 
  
  if (calib_rounds < n_calib_rounds){
    
    radius = radius + sin( frameCount / 4 );

    // Track circle to new destination
    X+=(nX-X)/delay;
    Y+=(nY-Y)/delay;

    // Train here

    // Code stub for training calls

    // Draw circle
    ellipse( X, Y, radius, radius );

    if(frameCount%moveDelay==0){
      nX = nx_arr[calib_counter]; 
      nY = ny_arr[calib_counter]; 
      calib_counter = calib_counter + 1;
      if (calib_counter > 8){
        calib_counter = 0;
        calib_rounds = calib_rounds + 1;
        if (calib_rounds%2==0){
          nx_arr.reverse();
        }
        else{
          ny_arr.reverse();
        }
      }
    }
  
  }
  
  else{
    train = false;
    textSize(100);
    text('Training.....', width/3, height/2);
  }
  
}