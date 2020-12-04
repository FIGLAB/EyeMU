import json

files = ["denise", "jane"]
data = []
for file in files:
    with open(file + ".json", "r") as f:
        data.append(json.load(f))


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

    print("Average x error:", tmp_avgx)
    print("Average y error:", tmp_avgy)
    print("Combined:", (tmp_avgx**2 + tmp_avgy**2)**.5)

    print()
