import json
import numpy as np
import os
import webarchive
import re
import json
import pandas as pd

import matplotlib.pyplot as plt
import matplotlib

def cleanhtml(raw_html):
    cleanr = re.compile('<.*?>')
    cleantext = re.sub(cleanr, '', raw_html)
    return cleantext


def plotEyes(allEyes, trunc=False):
    clors = list(matplotlib.colors.TABLEAU_COLORS)
    ymult = 1
    # allSegs = [[] for i in range(6)]
    allSegs = [[] for i in range(8)]
    for i, (eyeset, seg) in enumerate(allEyes):
        # line = plt.plot([x[0] for x in eyeset], [ymult*(1-x[1]) for x in eyeset], '.', color=clors[seg % len(clors)])[0]
        # eyeset = eyeset[-7:]
        xavg = sum([x[0] for x in eyeset]) / len(eyeset)
        yavg = ymult * (1 - sum([x[1] for x in eyeset]) / len(eyeset))
        line = plt.plot(xavg, yavg, 'o', color=clors[seg % len(clors)])[0]

        # line = plt.plot([sum(x)/len(x) for x in eyeset], [ymult*sum(1-x[1])/len(x) for x in eyeset], '.', color=clors[seg % len(clors)])[0]
        allSegs[seg - 1].append((line, seg))

    oneOfEach = [x[0] for x in allSegs]

    plt.legend([x[0] for x in oneOfEach], [x[1] for x in oneOfEach],
               title="Section #")
    plt.xlim((0, 1.0))
    plt.ylim((0, ymult))

    # Draw locations of demarkation lines between list segments
    if len(allSegs) == 6:
        for i in range(1, 6):
            plt.hlines((ymult / 6) * (6 - i), 0, 1.0)
    else:
        for i in range(4):
            plt.hlines((ymult / 4) * i, 0, 1.0)

    plt.title(
        "On-screen gaze predictions for each section during evaluation")

def EWMA(lst, a=0.5):
    newLst = [[0,0]]
    for elem in lst:
        tmp = [newLst[-1][0]*a + elem[0]*(1-a), newLst[-1][1]*a + elem[1]*(1-a)]

        newLst.append(tmp)
    return newLst[1:]

######### Plot and score the eye predictions
def avgXYs(lst):
    if len(lst) == 0:
        return [0,0]
    return [sum([x[0] for x in lst])/len(lst),sum([x[1] for x in lst])/len(lst)]

def segmentDataAsCoordinates(segNum):
    return [(1 + (segNum-1)//4)/3, 1/8 + (((segNum-1) % 4) )/4]

def accScore(eyeAndSegment, name):
    eyeData, segmentData = eyeAndSegment
    if name == 'grid':
        def f(lst):
            x,y = lst
            # return int((y//.25 + 1)*((x > .5) + 1))
            return int(((y//.25)+1) + 4*(x > .5))
    else:
        def f(lst):
            x, y = lst
            return int(y//(1/6) + 1)

    # priorLen = 7
    guessedSegs = []
    avg_XY_arr = []
    # Calculate accuracy

    for trial in eyeData:
        avg_XY_arr.append(avgXYs(trial))
        guessedSegs.append(f(avg_XY_arr[-1]))

    # Get accuracy per segment
    perSegAcc = {i:[0,0] for i in range(1,9)} # correct, total
    for i,seg in enumerate(segmentData):
        perSegAcc[seg][1] += 1
        if guessedSegs[i] == seg:
            perSegAcc[seg][0] += 1

    # Calculate normalized error
    accErrorXY = [0,0]
    for i,seg in enumerate(segmentData):
        x,y = segmentDataAsCoordinates(seg)
        accErrorXY[0] += abs(avg_XY_arr[i][0] - x)
        accErrorXY[1] += abs(avg_XY_arr[i][1] - y)
    accErrorXY[0] /= len(segmentData)
    accErrorXY[1] /= len(segmentData)
    print("norm euclidean error:", round((accErrorXY[0]**2 +accErrorXY[1]**2)**.5,2) ,accErrorXY)

    matches = [x == y for (x, y) in zip(guessedSegs, segmentData)]
    return sum(matches)/len(matches), accErrorXY


# Data format
# Dict with keys ['grid1_results', 'grid2_results', 'list1_results', 'list2_results'])

# Each eval key has 9 blocks (one per gesture), where each block is in the form
# [timestamp, detectedGestureAndGaze, targetGestureAndGaze, histories]
gestureNames = ["Forward flick", "Right flick", "Right tilt", "Left flick", "Left tilt", "Pull close", "Push away", "Turn to right", "Turn to left"]

# Histories is long, is arranged like this:
# [Head sizes, Eye embeddings + features, Gaze predictions, IMU, Gesture labels]
# IMU is [linear accel, angular accel, rotation]


# Import all webarchives in the directory
files = []
for r,d,f in os.walk("."):
    for file in f:
        if ".webarchive" in file and 'archivedData' not in r:
            files.append(os.path.join(r, file))


# Webarchive format -> parsed JSON dictionaries
fileData = []
for file in files:
    tmp = webarchive.open(file)
    jsonStr = cleanhtml(tmp._main_resource.data.decode())
    try:
        jsonData = json.loads(jsonStr)
        for key in jsonData.keys():
            jsonData[key] = json.loads(jsonData[key])
        fileData.append(jsonData)
    except:
        print("Failed on " + file)
print("Successfully parsed " + str(len(fileData)) + " trials")


def getAccAndErr(data):
    eyeData = []
    gestData = []
    segmentData = []
    for eval in data.keys():
        for gestureBlock in data[eval]:
            for segment in gestureBlock:
                # Unpack each segment trial
                timestamp, detected, target, histories = segment

                # Get the ground truth gesture and square out
                gesture = target[0]
                gestureName = gestureNames[gesture]
                gaze = target[1]

                # Unpack the histories array
                headsize_hist, embeddings_hist, gazepreds_hist, IMU_hist, gestdetect_hist = histories

                if 'grid' in eval:
                    gestData.append(gestdetect_hist)
                    eyeData.append(gazepreds_hist)
                    segmentData.append(gaze)
                # Add to pandas dataframe

    newGest = [0]*len(gestData)
    newEyes = [0]*len(gestData)
    # Stop the eyeData and gestData at the first unsteady
    for i,gestSet in enumerate(gestData):
        for ind, elem in enumerate(gestSet):
            if (not all(x==0 for x in elem)):
                newGest[i] = gestData[i][:ind-1]
                newEyes[i] = eyeData[i][:ind-1]
        if type(newGest[i]) != list:
            newGest[i] = gestData[i]
            newEyes[i] = eyeData[i]

    ######### Clip at 0 and 1, then EWMA filter the eye predictions
    clippedEyes = [np.clip(x, 0.01, .99) for x in newEyes]
    ewmaEyes = [EWMA(x) for x in clippedEyes]
    acc, err = accScore([ewmaEyes, segmentData], 'grid')
    print("Accuracy score:", acc)
    print()
    return acc, err




# print("Len of gesture data and eye data (should match)", len(gestData), len(eyeData))
# print("All gestures transferred over: ", not any(type(x) != list for x in newGest))
#
# a = [len(x) for x in newEyes]
# print(sorted(a))
# a = [len(x) for x in eyeData]
# print(sorted(a))

# zippedEyes = zip(ewmaEyes, segmentData)
# plotEyes(zippedEyes, True)

errs = []
for data in fileData:
    _, err = getAccAndErr(data)
    errs.append(err)







