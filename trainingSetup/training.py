import tensorflow as tf
# import tensorflow.data as tfdata
from loadData import *
from trainingUtils import *
from tensorflow import keras

print("tf has CUDA", tf.test.is_built_with_cuda())

a = dataGenerator("filteredDataXYHW.txt")

model = makeModel()

# Training loop
epochs = 5
batchSize = 10
for i in range(epochs):
    a = dataGenerator("filteredDataXYHW.txt")
    model.fit(a, initial_epoch=i, batch_size=batchSize, verbose=True)

model.save("curModel")
