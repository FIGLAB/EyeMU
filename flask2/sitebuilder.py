from flask import Flask, render_template
from flask_flatpages import FlatPages
from flask_frozen import Freezer
import os, sys, datetime

from flask_cors import CORS


app = Flask(__name__)
app.config.from_object(__name__)
app.config['SEND_FILE_MAX_AGE_DEFAULT'] = 0
freezer = Freezer(app)


# CORS(app)



@app.route('/')
def index():
    return render_template("main.html")

# Records the training data and trains the regression models from embeddings
@app.route('/datacollection/')
def datacollect():
    return render_template("datacollection.html")

# Testing if I could import a tf-lite model into tfjs
@app.route('/tfimporttest/')
def tfimporttest():
    response = render_template("tfimporttest.html")
    # response.headers.add('Access-Control-Allow-Origin', '*')
    return response

# Fine-tuning original model, doesn't work on mobile due to RAM restrictions (?)
@app.route('/transfer/')
def transfer():
    return render_template("transfer.html")

# Tests the original model in real-time
@app.route('/test/')
def test():
    return render_template("livetest.html")

# Tests the original model, boosted with the regression model in real-time
@app.route('/svrtest/')
def svrtest():
    return render_template("svr.html")

# Evaluates performance of the regression model, then prints output.
@app.route('/eval/')
def eval():
    return render_template("neweval.html")
    # return render_template("eval.html")

# # new eval, combined gaze + gesture
# @app.route('/neweval/')
# def neweval():
#     pass

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

@app.route("/results/")
def results():
    # return render_template("results.html")
    return render_template("newresults.html")

# @app.route("/newresults/")
# def newresults():
#     pass

@app.route("/showresults/")
def showresults():
    return render_template("showresults.html")

@app.route("/testing/")
def testing():
    return render_template("mainTesting.html")



# interactions time!
@app.route('/zoo/1/')
def zoo1():
    return render_template("zoo.html", zooNum = 1)

@app.route('/zoo/notification/')
def zoo2():
    return render_template("zoo.html", zooNum = 2)

@app.route('/zoo/gallery/')
def zoo3():
    return render_template("zoo.html", zooNum = 3)



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
        # Builds the website into a static site and runs "firebase deploy" to update the site
        if len(sys.argv) > 2 and sys.argv[2] == "local":
            app.config["FREEZER_DESTINATION"] = "/firebase/public"
            freezer.freeze()
        else:
            print("Built at " + datetime.datetime.now().ctime())
            freezer.freeze()
    else:
        app.run(port=8000)