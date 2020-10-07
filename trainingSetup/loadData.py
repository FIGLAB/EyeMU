import json
# from PIL import Image, ImageDraw
import dlib
import cv2
import os
import subprocess as sp

filename = "00002/"

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


def getLineGenerator(filepath):
    with open(filepath, "r") as f:
        for line in f:
            tmp = line.strip()
            tmpVals = tmp.split(",")
            yield tmpVals



# getLineGenerator("filteredDataXYHW.txt")



detector = dlib.get_frontal_face_detector()
predictor = dlib.shape_predictor("shape_predictor_5_face_landmarks.dat")
def getEyeCorners(im):

    facerect = detector(im)
    if not facerect:
        return 0
    shape = predictor(im, facerect[0])
    pts = [[x.x, x.y] for x in shape.parts()]
    return pts

def eyeBoundsFromCorners(leftCorner, rightCorner, boundsIncrease = 4):
    eyeLen = leftCorner[0] - rightCorner[0]
    xshift = eyeLen // boundsIncrease
    eyeLen += 2 * xshift
    yshift = eyeLen // 2
    yref = (leftCorner[1] + rightCorner[1]) // 2

    return [[yref - yshift, rightCorner[0] - xshift], [yref + yshift, leftCorner[0] + xshift]]



def getEyeCrops(im, eyeCorners):
    left_leftcorn, left_rightcorn, right_rightcorn, right_leftcorn = eyeCorners

    l_topleft, l_botright = eyeBoundsFromCorners(left_leftcorn, left_rightcorn)
    r_topleft, r_botright = eyeBoundsFromCorners(right_leftcorn, right_rightcorn)

    cv2.circle(im, tuple(left_leftcorn), 1, (255,0,0),1)
    cv2.circle(im, tuple(left_rightcorn), 1, (255,0,0),1)
    cv2.circle(im, tuple(right_rightcorn), 1, (255,0,0),1)
    cv2.circle(im, tuple(right_leftcorn), 1, (255,0,0),1)

    l_eye = im[(l_topleft[0]):(l_botright[0]), (l_topleft[1]):(l_botright[1])]
    r_eye = im[(r_topleft[0]):(r_botright[0]), (r_topleft[1]):(r_botright[1])]

    return l_eye, r_eye


def dataGenerator(filepath):
    with open(filepath, "r") as f:
        for line in f:
            # unpack the line of data, load in the image
            tmp = line.strip()
            tmpVals = tmp.split(",")
            im = cv2.imread(tmpVals[0])

            print(tmpVals[0])

            # Extract the eye corners (xy, xy), and the eyeboxes
            eyeCorners = getEyeCorners(im)[:-1]
            if not eyeCorners:
                continue

            l_eye, r_eye = getEyeCrops(im, eyeCorners)

            yield eyeCorners, l_eye, r_eye

a = dataGenerator("filteredDataXYHW.txt")
