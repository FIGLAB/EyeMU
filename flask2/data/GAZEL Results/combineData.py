import os
import webarchive
import re
import json

def cleanhtml(raw_html):
    cleanr = re.compile('<.*?>')
    cleantext = re.sub(cleanr, '', raw_html)
    return cleantext


# Import all webarchives in the directory
files = []
for r,d,f in os.walk("."):
    for file in f:
        if "gazel_checkpoint" in file and 'archivedData' not in r:
            files.append(os.path.join(r, file))

jsonStrings = []
for file in files:
    with open(file, "r") as f:
        jsonStrings.append(json.loads(f.read()))

combinedJSON = []
for collectedSet in jsonStrings:
    for str in collectedSet:
        combinedJSON.append(str)

dumpedJSONs = json.dumps(combinedJSON)
with open("combinedGAZELCalibration", "w+") as f:
    f.write(dumpedJSONs)