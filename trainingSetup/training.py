import tensorflow as tf
# import tensorflow.data as tfdata
from loadData import *
from trainingUtils import *
from tensorflow import keras

print("tf has CUDA", tf.test.is_built_with_cuda())

# a = dataGenerator("filteredDataXYHW.txt")

model = makeModel()

# Training loop
epochs = 10
batchSize = 10
for i in range(epochs):
    a = dataGenerator("doubleFilteredData.txt", batchSize = batchSize)
    model.fit(a, verbose=True)


    # model.save("checkpoints/curModel" + str(i))



model.save("curModel")
# tfjs.converters.save_keras_model(model2, "tfjsmodel")