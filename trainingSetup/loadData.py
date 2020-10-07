import json
# from PIL import Image, ImageDraw
from dlib import get_frontal_face_detector, shape_predictor
import cv2
import os
import subprocess as sp
import random
import tensorflow as tf
import numpy as np

# getValidFrames(subject)
# Given a directory, extract the frame paths and eye coordinates and screen max coords for images that pass the filter
def getValidFrames(subject):
    print("processing", subject, end="")
    # Open jsons, get image file paths, ground truths, and
    with open(subject + "dotInfo.json") as f:
        dotinfo = json.load(f)
        dotlocations = list(zip(dotinfo['XPts'], dotinfo['YPts'])) # xy of dot
        dottimes = dotinfo['Time']
    with open(subject + "screen.json") as f:
        tmp = json.load(f)
        orientations = tmp['Orientation']
        screenHW = list(zip(tmp['H'], tmp['W']))
    for r, d, f in os.walk(subject + "frames"):
        frames = f
        break
    frames.sort() # frame paths

    # Remove frame paths where the orientation is not portrait (!= 1)
    filteredFrames = []
    filteredDotSpots = []
    filteredDotTimes = []
    filteredHW = []
    for i, frame in enumerate(frames):
        if orientations[i] == 1:
            filteredFrames.append(subject + "frames/" + frame)
            filteredDotSpots.append(dotlocations[i])
            filteredDotTimes.append(round(dottimes[i],3))
            filteredHW.append(screenHW[i])

    print("     done with", len(filteredDotSpots), "samples")
    return filteredFrames, filteredDotTimes, filteredDotSpots, filteredHW

# unzips all .tar.gz files in a top level directory, then places them in /unzipped and deletes them
def untargz(dir):
    for r, d, f in os.walk(dir):
        files = f
        break
    files = [x for x in files if ".tar.gz" in x]
    filePaths = [dir+x for x in files if ".tar.gz" in x]
    os.makedirs(dir+"/unzipped", exist_ok=True)

    for i,file in enumerate(filePaths):
        print("unzipping", file, str(i+1) + "/" + str(len(files)))
        sp.run(["tar", "-xf", file, "-k", "-C", dir+"/unzipped"])
        sp.run(["rm", file])
    print('unzipping done \n')
    return dir + "unzipped/"

# Collates all the paths, XY spots, screen sizes of the valid files
def writeAllValid(unzippedDir):
    for r,d,f in os.walk(unzippedDir):
        dirs = d
        break

    dirs = [unzippedDir + x +"/" for x in dirs]
    with open("filteredDataXYHW.txt", 'w+') as f:
        for subjectDir in dirs:
            frames, times, spots, HWs = getValidFrames(subjectDir)
            for frame, time, spot, HW in zip(frames, times, spots, HWs):
                f.write(frame + ",")
                f.write(str(round(spot[0], 2)) + "," + str(round(spot[1], 2)) + ",")
                f.write(str(HW[0])+ "," + str(HW[1]) + ",")
                f.write(str(time) + "\n")

# testDir = "simulation/"
# unzipDir = untargz(testDir)
# allValid = writeAllValid(unzipDir)
# writeAllValid("simulation/unzipped/")


# initialize the eye detector models
detector = get_frontal_face_detector()
predictor = shape_predictor("shape_predictor_5_face_landmarks.dat")

# detects the face in an image using dlib facial recognition, then finds the eye corners and returns them
def getEyeCorners(im):
    facerect = detector(im)
    if not facerect:
        return 0
    shape = predictor(im, facerect[0])
    pts = [[x.x, x.y] for x in shape.parts()]
    return pts

# Gets the top left and bottom right cropping coordinates of a pair of eyecorners
def eyeBoundsFromCorners(leftCorner, rightCorner, boundsIncrease = 4):
    eyeLen = leftCorner[0] - rightCorner[0]
    xshift = eyeLen // boundsIncrease
    eyeLen += 2 * xshift
    yshift = eyeLen // 2
    yref = (leftCorner[1] + rightCorner[1]) // 2

    return [[yref - yshift, rightCorner[0] - xshift], [yref + yshift, leftCorner[0] + xshift]]

# crops out the two eyes (with some margin) given two eye corners
def getEyeCrops(im, eyeCorners):
    left_leftcorn, left_rightcorn, right_rightcorn, right_leftcorn = eyeCorners

    l_topleft, l_botright = eyeBoundsFromCorners(left_leftcorn, left_rightcorn)
    r_topleft, r_botright = eyeBoundsFromCorners(right_leftcorn, right_rightcorn)

    # sanity check
    # cv2.circle(im, tuple(left_leftcorn), 1, (255,0,0),1)
    # cv2.circle(im, tuple(left_rightcorn), 1, (255,0,0),1)
    # cv2.circle(im, tuple(right_rightcorn), 1, (255,0,0),1)
    # cv2.circle(im, tuple(right_leftcorn), 1, (255,0,0),1)

    l_eye = im[(l_topleft[0]):(l_botright[0]), (l_topleft[1]):(l_botright[1])]
    r_eye = im[(r_topleft[0]):(r_botright[0]), (r_topleft[1]):(r_botright[1])]

    return l_eye, r_eye

# Creates a generator given a file with data paths listed in it
def dataGenerator(filepath):
    eyePicOutputSize = (128,128)

    with open(filepath, "r") as f:
        lines = f.read().split("\n")
    random.shuffle(lines) # data order randomization

    for line in lines:
        # unpack the line of data, load in the image
        tmp = line.strip()
        tmpVals = tmp.split(",")
        im = cv2.imread(tmpVals[0])
        if im is None:
            continue

        # Extract the eye corners (xy, xy)
        eyeCorners = getEyeCorners(im)[:-1]
        if not eyeCorners:
            continue

        # Extract eye boxes, resize to eyePicSize
        l_eye, r_eye = getEyeCrops(im, eyeCorners)
        l_eye = cv2.flip(l_eye, 1) # flip one eye crop horizontally to share NN weights
        l_eye = cv2.resize(l_eye, eyePicOutputSize).astype('float32')
        r_eye = cv2.resize(r_eye, eyePicOutputSize).astype('float32')

        # normalize eye images by subtracting mean and dividing by std, per color channel
        # UPDATE: May not have to do this by integrating into the pipeline

        # extract the dot ground truth, and normalize the xy of the dot location
        # dot is in XY, screen in HW (reversed)
        screen_h = float(tmpVals[3])
        screen_w = float(tmpVals[4])
        dot_X = float(tmpVals[1])/screen_w
        dot_Y = float(tmpVals[2])/screen_h

        # Normalize eye corners by the screen height and width
        eyeCorners = np.array([[x/screen_w, y/screen_h] for [x,y] in eyeCorners])


        # yield x (eye crops, eye corners) and y (normalized
        # outVec = [l_eye, r_eye, tf.convert_to_tensor(eyeCorners), tf.convert_to_tensor([dot_X, dot_Y])]
        # print(outVec)
        # yield outVec
        # print("left eye stats", l_eye.shape, l_eye.dtype)
        x_out = [tf.reshape(tf.convert_to_tensor(l_eye), (1,128,128,3)),
                 tf.reshape(tf.convert_to_tensor(r_eye), (1,128,128,3)),
                 eyeCorners.flatten().reshape((1,8))]

        # print((x_out[0].shape, x_out[1].shape, x_out[2].shape, np.array([dot_X, dot_Y])))
        yield (x_out, np.array([dot_X, dot_Y]))


# a = dataGenerator("filteredDataXYHW.txt")
# [x,y] = next(a)


def lastPreprocessStep(filepath):
    eyePicOutputSize = (128, 128)

    with open(filepath, "r") as f:
        lines = f.read().split("\n")
