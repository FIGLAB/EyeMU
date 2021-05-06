## Welcome to the GAZEL repository!

This is the code for the GAZEL: Gaze+Accelerometer Interactions on Mobile Devices. We explored the combination of gaze-tracking and motion gestures on the phone to enable enhanced single-handed interaction with mobile devices. To allow for remote user studies, we built the majority of our calibration and user testing into a webapp based on Flask, a python web framework. This repo also contains the training scripts for our base CNN gaze-tracking model.


## Web Demo
To try out our site, go to "https://gazel.netlify.app/", which has a running copy of our current code. 
Most pages will have a camera permissions popup as well as a motion+acceleration permissions button. The button appears really small in Safari, but it's either in the top left or the middle of the screen. You'll need to accept both the camera and motion permissions for our site to work. 

- **To see a demo of our device-calibrated model**, click "Playground" or navigate to "https://gazel.netlify.app/svrtest/". This page also shows the facemesh model we're using to detect the head.

- **To calibrate your own model**, click "Personalize" on the front page. This page collects 5 rounds of data as you track the circle around the screen. The blue circle will turn into a red octagon when it's collecting, and it will alternate between stationary and moving data collection. After 5 rounds, the circle will stay in the middle of the screen. Tap to advance, wait for the last round of collection, then the personalized models will be stored in your localStorage. 

- **To test our gesture classifier**, go to "https://gazel.netlify.app/gestures/". The gestures are flick left/right (CW/CCW rotation, axis coming out of the phone screen), page turn left/right (turn one edge towards the other, axis running up the phone centerline), forward flick (tilt back the top of the phone), and push away/pull close (bring phone towards you or away).


## Building the webapp
All webapp files are located in the "flask2/" directory. We're using Python3.7, with the Flask and Flask-Frozen libraries. To host a local version of the site from the terminal, run "python sitebuilder.py". To build a set of static pages, run "python sitebuilder.py build". We're using Tensorflow.JS and MLweb to do the training and evaluation of ML models in-browser. 

Flask allows for separation of the JS and HTML files, which enables OOP-style web development, but it also makes it confusing to navigate the backend. To find the Javascript code behind an endpoint (like "/svrtest"), open sitebuilder.py and find the function which serves it. This will give you an HTML filename, which are all stored in "templates/". At the top, the HTML file will contain some <script> tags importing javascript files. These JS files are all stored in "static/", and they contain all the code running on the site. 

Reach out if you have any questions about code specifics. 


## Data Analysis 
All Jupyter notebooks used to load and train the offline models are in the "data/" directory. The data is split into calibration ("calibdata.pkl") and evaluation ("gazeldata.pkl"), and stored as Pandas Dataframes.


## Gaze-Tracking Base Model 
Our gaze-tracking pipeline consists of a large CNN followed by a smaller regression model. Our CNN is based off of the architecture in (https://www.nature.com/articles/s41467-020-18360-5). We trained our own model from scratch using the same GazeCapture dataset. The code for this training is located in "trainingSetup/"


