import json
import numpy as np
import os
import webarchive
import re
import json

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


# Import all webarchives in the directory
files = []
for r,d,f in os.walk("."):
    for file in f:
        if ".webarchive" in file:
            files.append(os.path.join(r, file))

# Webarchive format -> parsed JSON dictionaries
fileData = []
for file in files:
    tmp = webarchive.open(file)
    jsonStr = cleanhtml(tmp._main_resource.data.decode())
    # cleanhtml(a.main_resource.data.decode())
    try:
        jsonData = json.loads(jsonStr)
        for key in jsonData.keys():
            jsonData[key] = json.loads(jsonData[key])
        fileData.append(jsonData)
    except:
        print("Failed on " + file)

# Data format
# Dict with keys ['grid1_results', 'grid2_results', 'list1_results', 'list2_results'])

# Each eval key has 9 blocks (one per gesture), where each block is in the form
# [timestamp, detectedGestureAndGaze, targetGestureAndGaze, histories]
gestureNames = ["Forward flick", "Right flick", "Right tilt", "Left flick", "Left tilt", "Pull close", "Push away", "Turn to right", "Turn to left"]

# Histories is long, is arranged like this:
# [Head sizes, Eye embeddings + features, Gaze predictions, IMU, Gesture labels]
# IMU is [linear accel, angular accel, rotation]

firstdata = fileData[0]
eyeData = []
gestData = []
segmentData = []
for eval in firstdata.keys():

    for gestureBlock in firstdata[eval]:
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
                # print(eval)
                gestData.append(gestdetect_hist)
                eyeData.append(gazepreds_hist)
                segmentData.append(gaze)
            # Add to pandas dataframe


newGest = [0]*len(gestData)
newEyes = [0]*len(gestData)
# Stock the eyeData and gestData at the first unsteady
for i,gestSet in enumerate(gestData):
    for ind, elem in enumerate(gestSet):
        if (not all(x==0 for x in elem)):
            newGest[i] = gestData[i][:ind-1]
            newEyes[i] = eyeData[i][:ind-1]
    if type(newGest[i]) != list:
        newGest[i] = gestData[i]
        newEyes[i] = eyeData[i]
print("Len of gesture data and eye data (should match)", len(gestData), len(eyeData))
print("All gestures transferred over: ", not any(type(x) != list for x in newGest))

a = [len(x) for x in newEyes]
print(sorted(a))
a = [len(x) for x in eyeData]
print(sorted(a))

######### Clip at 0 and 1, then EWMA filter the eye predictions
clippedEyes = [np.clip(x, 0,1) for x in newEyes]
ewmaEyes = [EWMA(x) for x in clippedEyes]


######### Plot and score the eye predictions
def accScore(eyeAndSegment, name):
    eyeData, segmentData = eyeAndSegment
    if name == 'grid':
        mapping = {}


zippedEyes = zip(ewmaEyes, segmentData)
print("Accuracy score:", accScore(zippedEyes, 'grid'))
plotEyes(zippedEyes, True)










# # with open("flask2/data/grid1resultsandy.json", "r") as f:
# with open("flask2/data/list1resultsandy.json", "r") as f:
#     data = json.load(f)
# data = np.array(data)
#
#
# allEyes = []
# for gests in data:
#     for listsegs in gests:
#         tstamp = listsegs[0]
#         predGest, predSeg = listsegs[1]
#         targGest, targSeg = listsegs[2]
#         histories = listsegs[3]
#         eyePreds, gyrohist, headsizehist, angularhist = histories
#
#         allEyes.append([eyePreds,targSeg])
#
#
# plotEyes(allEyes)


