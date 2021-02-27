import json
import matplotlib.pyplot as plt
import matplotlib
import numpy as np

# with open("flask2/data/list1resultsandy.json", "r") as f:
with open("flask2/data/grid1resultsandy.json", "r") as f:
    data = json.load(f)
data = np.array(data)


allEyes = []
for gests in data:
    for listsegs in gests:
        tstamp = listsegs[0]
        predGest, predSeg = listsegs[1]
        targGest, targSeg = listsegs[2]
        histories = listsegs[3]
        eyePreds, gyrohist, headsizehist, angularhist = histories

        allEyes.append([eyePreds,targSeg])



clors = list(matplotlib.colors.TABLEAU_COLORS)
ymult = 1.8
# allSegs = [[] for i in range(6)]
allSegs = [[] for i in range(8)]
for i, (eyeset,seg) in enumerate(allEyes):
    # line = plt.plot([x[0] for x in eyeset], [ymult*(1-x[1]) for x in eyeset], '.', color=clors[seg % len(clors)])[0]
    xavg = sum([x[0] for x in eyeset])/len(eyeset)
    yavg = ymult*(1-sum([x[1] for x in eyeset])/len(eyeset))
    line = plt.plot(xavg, yavg, 'o', color=clors[seg%len(clors)])[0]

    # line = plt.plot([sum(x)/len(x) for x in eyeset], [ymult*sum(1-x[1])/len(x) for x in eyeset], '.', color=clors[seg % len(clors)])[0]
    allSegs[seg-1].append((line,seg))

oneOfEach = [x[0] for x in allSegs]

plt.legend([x[0] for x in oneOfEach], [x[1] for x in oneOfEach], title="Section #")
plt.xlim((0, 1.0))
plt.ylim((0, ymult))

# Draw locations of demarkation lines between list segments
if len(allSegs) == 6:
    for i in range(5):
        plt.hlines((ymult/6)*i, 0, 1.0)
else:
    for i in range(4):
        plt.hlines((ymult / 4) * i, 0, 1.0)



plt.title("On-screen gaze predictions for each section during list evaluation")







# hist = [localPreds, orient_short_history, head_size_history, angaccel_short_history];
# [Date.now(), [detectedGesture, segment], target, histories]

# parse jsons into errors
# Trials have the format [Date.now(), [initial_width, initial_height], errorsX, errorsY, locations_acc]
normedErrors = []
for user_data in data:
    userErrors = []
    for trial_data in user_data:
        trial_w, trial_h = trial_data[1]

        avgErrorX = sum(trial_data[2])/len(trial_data[2])/trial_w
        avgErrorY = sum(trial_data[3])/len(trial_data[3])/trial_h

        userErrors.append([avgErrorX, avgErrorY])

    avgXErrs = sum([x[0]/len(userErrors) for x in userErrors])
    avgYErrs = sum([x[1]/len(userErrors) for x in userErrors])

    # normedErrors.append(userErrors)
    normedErrors.append([avgXErrs, avgYErrs])

# multiply by screen size
# Hardcoded for now, iPhone SE and iPhone 8+
screen_sizes = [[5.0, 8.85], [6.8, 12.2]]
for i, userErrors in enumerate(normedErrors):
    print(files[i])
    tmp_avgx = userErrors[0]*screen_sizes[i][0]
    tmp_avgy = userErrors[1]*screen_sizes[i][1]

    print("Average x error:", round(tmp_avgx,2))
    print("Average y error:", round(tmp_avgy,2))
    print("Combined:", (tmp_avgx**2 + tmp_avgy**2)**.5)

    print()
