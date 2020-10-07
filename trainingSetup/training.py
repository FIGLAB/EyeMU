import tensorflow as tf
# import tensorflow.data as tfdata
from loadData import *
from trainingUtils import makeModel

a = dataGenerator("filteredDataXYHW.txt")

model = makeModel()

# Training loop
epochs = 10
for i in range(epochs):
    a = dataGenerator("filteredDataXYHW.txt")
    model.fit(a, epochs=1, batch_size=10, verbose=True)



# corn, reye, leye = next(a)
# outputShapes = ((128,128,3), (128,128,3))
# b = tf.data.Dataset.

# b = tf.data.Dataset.from_generator(lambda: next(a), ((tf.float32), (tf.float32)), output_shapes=outputShapes)
# for elem in b:
#     print(elem)
#     yea = elem
#     break