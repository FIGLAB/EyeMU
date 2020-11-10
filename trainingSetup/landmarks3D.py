# import face_alignment
import cv2
import math
import mediapipe as mp

# //Yaw is the angle in the x-z plane with the vertical axis at the origin
# //Return is in radians. Turning the head left is a positive angle, right is a negative angle, 0 is head on.
def getYaw(facePoints):
    a = 50
    b = 280
    yaw=math.atan((facePoints[a].z-facePoints[b].z)/(facePoints[a].x-facePoints[b].x)) # Uses two cheek points
    return yaw

# //Pitch is the angle in the z-y plane with the horizontal axis at the origin
# //Return is in radians. Turning the head up is a positive angle, down is a negative angle, 0 is head on.
def getPitch(facePoints):
    a = 10
    b = 168
    # Use two points on forehead because it has a z normal vector
    pitch = math.atan((facePoints[a].z-facePoints[b].z)/(facePoints[a].y-facePoints[b].y))
    return -pitch

# // Roll is the angle in the x-y plane (face plane)
# // returns in radians.
def getRoll(facePoints):
    a = 151
    b = 6
    roll = math.atan2(facePoints[a].x-facePoints[b].x, facePoints[a].y-facePoints[b].y)

    if roll < 0:
        return roll % 3.14
    else:
        return 3.14 - roll


mp_face_mesh = mp.solutions.face_mesh
def runFaceMesh(imPath):
    # For static images:
    face_mesh = mp_face_mesh.FaceMesh(
        static_image_mode=True,
        max_num_faces=1,
        min_detection_confidence=0.5)

    image = cv2.imread(imPath)
    # Convert the BGR image to RGB before processing.
    results = face_mesh.process(cv2.cvtColor(image, cv2.COLOR_BGR2RGB))

    face_mesh.close()
    return results

def getYPR(imPath):
    landmarks = runFaceMesh(imPath)
    meshPoints = landmarks.multi_face_landmarks[0].landmark
    mediapipeResults = [getYaw(meshPoints), getPitch(meshPoints),
                        getRoll(meshPoints)]
    return mediapipeResults

def compare(preds, angles, ind):
    predYPR = [getYaw(preds[ind]), getPitch(preds[ind]), getRoll(preds[ind])]
    predYPR = [round(x, 4) for x in predYPR]
    print("predicted YPR: \t", predYPR)
    print("facemesh YPR: \t", [round(x,4) for x in angles[ind]])
    print()

# fa = face_alignment.FaceAlignment(face_alignment.LandmarksType._3D, flip_input=False, device='cpu')

allImPaths = ["andyfaceangles/" + name + ".PNG" for name in ['one', 'two', 'three', 'four']]
allYPRs = [getYPR(x) for x in allImPaths]

# yaw pitch roll
angles = [[-0.0119514518, 0.0081412053, -0.001885869],
          [ 0.0477603057, 0.5456582053, 0.0395602464],
          [-0.2717674276, 0.0724340367, -0.1382433023],
          [0.2503843238, -0.2095430583, 0.1116027060]]

for i,x in enumerate(allYPRs):
    print(x)
    print(angles[i])
    print()