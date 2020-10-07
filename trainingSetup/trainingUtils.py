import numpy as np
from tensorflow import keras
from tensorflow.keras import layers
import tensorflow as tf
import tensorflow.keras.backend as K

def euclidean_distance_error(y_true, y_pred):
    return K.sqrt(K.sum(K.square(y_pred - y_true), axis=-1))


def makeModel():
    # Construct model architecture
    imx, imy = 128, 128

    # Define inputs
    inputLeftEye = keras.Input(shape=(imx, imy, 3))
    inputRightEye = keras.Input(shape=(imx, imy, 3))
    inputEyeCornerCoords = keras.Input(shape=(8))

    # Define normalization layer
    imNorm = layers.LayerNormalization(1)  # Normalize on a per-channel basis
    normedLeftEye = imNorm(inputLeftEye)
    normedRightEye = imNorm(inputRightEye)

    # Define conv layers
    conv1 = layers.Conv2D(filters=32, kernel_size=7, strides=2,
                          activation="relu")
    conv1_dropout = layers.Dropout(.02)
    avgpool1 = layers.AveragePooling2D()
    BN1 = layers.BatchNormalization(momentum=.9)

    conv2 = layers.Conv2D(filters=64, kernel_size=5, strides=2,
                          activation="relu")
    conv2_dropout = layers.Dropout(.02)
    avgpool2 = layers.AveragePooling2D()
    BN2 = layers.BatchNormalization(momentum=.9)

    conv3 = layers.Conv2D(filters=128, kernel_size=3, strides=1,
                          activation="relu")
    # Apply to the two eyes
    leftMid = conv3(
                BN2(avgpool2(conv2_dropout(conv2(
                BN1(avgpool1(conv1_dropout(conv1(normedLeftEye)))))))))
    rightMid = conv3(
                BN2(avgpool2(conv2_dropout(conv2(
                BN1(avgpool1(conv1_dropout(conv1(normedRightEye)))))))))

    # Define eye corner FCs
    FC1 = layers.Dense(128, activation="relu")
    FC2 = layers.Dense(16, activation="relu")
    FC3 = layers.Dense(16, activation="relu")
    # Apply to the eye vec
    eyeCornerMid = FC3(FC2(FC1(inputEyeCornerCoords)))

    # Define uniting layers
    FC4 = layers.Dense(8, activation="relu")
    FC4_dropout = layers.Dropout(.12)
    FC5 = layers.Dense(4, activation="relu")
    FC6 = layers.Dense(2)
    # Unite the three feature vecs
    flatten = layers.Flatten()
    tmpLeft = flatten(leftMid)
    tmpRight = flatten(rightMid)

    # tmpVec = tf.concat([tmpLeft,tmpRight], axis=1)
    # middleFeatureVec = tf.concat([tmpLeft,tmpRight,eyeCornerMid],axis=1)
    middleFeatureVec = layers.Concatenate()([tmpLeft, tmpRight, eyeCornerMid])

    # Apply final layers to the midpoint feature vector
    output = FC6(FC5(FC4_dropout(FC4(middleFeatureVec))))

    # Assign the model
    model = keras.Model(
        inputs=[inputLeftEye, inputRightEye, inputEyeCornerCoords],
        outputs=output, name="naturepapereyemodel")


    decayLearning = keras.optimizers.schedules.ExponentialDecay(initial_learning_rate=.016,
                                                                decay_steps=8000,
                                                                decay_rate=.64,
                                                                staircase=True)
    model.compile(
        loss = euclidean_distance_error,
        optimizer = keras.optimizers.Adam(learning_rate=decayLearning),
        metrics = [tf.keras.metrics.MeanSquaredError(), tf.keras.metrics.RootMeanSquaredError()]
    )

    return model