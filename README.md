## Research repository for EyeMU Interactions: Gaze + IMU Gestures on Mobile Devices

This repository houses the code for the paper EyeMU Interactions: Gaze + IMU Gestures on Mobile Devices. We explored the combination of gaze-tracking and motion gestures on the phone to enable enhanced single-handed interaction with mobile devices. Please see our [open-access paper](https://dl.acm.org/doi/abs/10.1145/3462244.3479938) for further details, or [watch our video](https://www.youtube.com/watch?v=-HwcmWRAsaA)! This repository contains the code for:

- Generating a Flask webapp running our calibration and user testing webapps

- Training script for our base CNN gaze-tracking model.

![GAZEL](/media/gazel.gif)

## Building the webapp
All site files are located in the `flask2/` directory. We're using Python 3.7, with the Flask and Flask-Frozen libraries. 

First, set up a virtualenv and run 

    $ pip install Flask Flask-Frozen

Clone our github repo and navigate into the `flask2/` directory. 
To host a local version of the site from the terminal, run


    $ python sitebuilder.py


To build a set of static pages, run 

    $ python sitebuilder.py build

Flask allows for separation of the JS and HTML files, which enables OOP-style web development, but it also makes it confusing to navigate the backend. To find the Javascript code behind a web endpoint (like "/svrtest"), open `sitebuilder.py` and find the function which serves it. This will give you an HTML filename, which are all stored in `templates/`. At the top, the HTML file will contain `<script>` tags for importing JS files, which are all stored in `static/`.

## Web Demo
To try out our site, go to https://gazel.netlify.app/, which has a running copy of our current code. Our site works best on an iPhone 12 Pro.

Most pages will have a camera permissions popup as well as a motion+acceleration permissions button. The button appears in Safari in either in the top left or the middle of the screen. Both the camera and motion permissions are needed for this site to work. 

- **To see a demo of the device-calibrated model**, click "Playground" or navigate to https://gazel.netlify.app/svrtest/. This page also shows the facemesh model we're using to detect the head.

- **To calibrate a personal model**, click "Personalize" on the front page. This page collects 5 rounds of data as you track the circle around the screen. The blue circle will turn into a red octagon when it's collecting, and it will alternate between stationary and moving data collection. After 5 rounds, the circle will stay in the middle of the screen. Tap to advance, wait for the last round of collection, then the personalized models will be stored in the device's localStorage. 

- **To test the gesture classifier**, go to https://gazel.netlify.app/gestures/. The gestures are flick left/right (CW/CCW rotation, axis coming out of the phone screen), page turn left/right (turn one edge towards the other, axis running up the phone centerline), forward flick (tilt back the top of the phone), and push away/pull close (bring phone towards you or away).


## Data Analysis 
All Jupyter notebooks used to load and train the offline models are in the `data/` directory. The data is split into calibration (`calibdata.pkl`) and evaluation (`gazeldata.pkl`), and stored as Pandas Dataframes.


## Gaze-Tracking Base Model 
Our gaze-tracking pipeline consists of a large CNN followed by a smaller regression model. We trained our own model from scratch using the same GazeCapture dataset. The code for this training is located in `trainingSetup/`. Due to the large size of the dataset, it will have to be downloaded separately. 

## Reference

Andy Kong, Karan Ahuja, Mayank Goel, and Chris Harrison. 2021. EyeMU Interactions: Gaze + IMU Gestures on Mobile Devices. In <i>Proceedings of the 2021 International Conference on Multimodal Interaction</i> (<i>ICMI '21</i>). Association for Computing Machinery, New York, NY, USA, 577–585. DOI:https://doi.org/10.1145/3462244.3479938

BibTex Reference:
```
@inproceedings{10.1145/3462244.3479938,
author = {Kong, Andy and Ahuja, Karan and Goel, Mayank and Harrison, Chris},
title = {EyeMU Interactions: Gaze + IMU Gestures on Mobile Devices},
year = {2021},
isbn = {9781450384810},
publisher = {Association for Computing Machinery},
address = {New York, NY, USA},
url = {https://doi.org/10.1145/3462244.3479938},
doi = {10.1145/3462244.3479938},
booktitle = {Proceedings of the 2021 International Conference on Multimodal Interaction},
pages = {577–585},
numpages = {9},
keywords = {Smartphone camera, gesture recognition, accelerometer, gyroscope, computer vision, inertial measurement unit, eye tracking.},
location = {Montr\'{e}al, QC, Canada},
series = {ICMI '21}
}
```


