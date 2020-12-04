import json

files = ["denise", "jane"]
data = []
for file in files:
    with open(file + ".json", "r") as f:
        data.append(json.load(f))


# Trials have the format [Date.now(), [initial_width, initial_height], errorsX, errorsY, locations_acc]
normedErrors = []
for user_data in data:
    userErrors = []
    for trial_data in user_data:
        trial_w, trial_h = trial_data[1]

        avgErrorX = sum(trial_data[2])/len(trial_data[2])/trial_w
        avgErrorY = sum(trial_data[3])/len(trial_data[3])/trial_h

        userErrors.append([avgErrorX, avgErrorY])

