from flask import Flask, render_template
from flask_frozen import Freezer
import os, sys, datetime


app = Flask(__name__)
app.config.from_object(__name__)
app.config['SEND_FILE_MAX_AGE_DEFAULT'] = 0
freezer = Freezer(app)

@app.route('/')
def index():
    return render_template("main.html")

################# Data collection and calibration
# Records the training data and trains the regression models from embeddings
@app.route('/datacollection/')
def datacollect():
    return render_template("datacollection.html")

# Trains a model offline
@app.route('/offlinetraining/')
def offlinetraining():
    return render_template("mainTesting.html")

################# Live testing for debugging
# Tests the original model in real-time
@app.route('/uncalibtest/')
def uncalibtest():
    return render_template("livetest.html")

# Tests the original model, boosted with the regression model in real-time
@app.route('/svrtest/')
def svrtest():
    return render_template("svr.html")

# Tests the original model, boosted with the regression model in real-time
@app.route('/svreyesonly/')
def svreyesonly():
    return render_template("svreyesonly.html")

################# Prep for evaluating gaze + accel.
# Gesture detection standalone
@app.route('/gestures/')
def gestures():
    return render_template("gesturepractice.html")


################# Evaluation of gaze + acceleration together
# Evaluates performance of the regression model, then prints output.
@app.route('/grideval/')
def grideval():
    return render_template("evalgrid.html")

@app.route('/listeval/')
def listeval():
    return render_template("evallist.html")

################# Show results from the grid and list evaluations
@app.route("/results/")
def results():
    return render_template("blockresults.html")

############################ Misc showcases and debug screens.

# Just shows facemesh and yaw/pitch/roll calculations
@app.route('/facemeshdemo/')
def facemeshdemo():
    return render_template("facemeshdemo.html")

# Requests acceleration, then displays a dot indicating tilt degrees.
@app.route('/acceldemo/')
def acceldemo():
    return render_template("accel.html")

# shows where the face's angle is on-screen
@app.route('/faceangle/')
def faceangle():
    return render_template("faceangle.html")

@app.route("/testing/")
def testing():
    return render_template("mainTesting.html")



################### Applications/Interactions
@app.route('/zoo/1/')
def zoo1():
    return render_template("zoo.html", zooNum = 1)

@app.route('/zoo/notification/')
def zoo2():
    return render_template("zoo.html", zooNum = 2)

@app.route('/photos/')
def photos():
    return render_template("zoo.html", zooNum = 3)

@app.route('/notif/')
def notif():
    return render_template("notificationsdemo.html")

@app.route('/email/')
def email():
    return render_template("emaildemo.html")

@app.route('/homescreen/')
def homescreen():
    return render_template("homescreendemo.html")

@app.route('/music/')
def music():
    return render_template("musicdemo.html")


@app.after_request
def add_header(response):
    """
    Add headers to both force latest IE rendering engine or Chrome Frame,
    and also to cache the rendered page for 10 minutes.
    """
    response.headers['X-UA-Compatible'] = 'IE=Edge,chrome=1'
    response.headers['Cache-Control'] = 'public, max-age=0'
    return response



if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == "build":
        print("Built at " + datetime.datetime.now().ctime())
        freezer.freeze()
    else:
        app.run(port=8000)