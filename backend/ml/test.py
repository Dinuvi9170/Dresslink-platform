import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import cv2
from sklearn.linear_model import LinearRegression
from scipy import ndimage
import os

# Print installed versions
print(f"NumPy version: {np.__version__}")
print(f"pandas version: {pd.__version__}")
print(f"scikit-learn version: {__import__('sklearn').__version__}")
print(f"OpenCV version: {cv2.__version__}")

# Create a simple test image
test_img = np.zeros((300, 300, 3), dtype=np.uint8)
test_img[100:200, 100:200] = [0, 255, 0]  # Green square

# Save the image
os.makedirs('test_output', exist_ok=True)
cv2.imwrite('test_output/test_image.png', test_img)

# Create a simple dataset
X = np.array([[1, 1], [1, 2], [2, 2], [2, 3]])
y = np.dot(X, np.array([1, 2])) + 3  # y = 1*x1 + 2*x2 + 3

# Train a simple model
model = LinearRegression()
model.fit(X, y)
print(f"Model coefficients: {model.coef_}")
print(f"Model intercept: {model.intercept_}")

# Make a prediction
test_prediction = model.predict(np.array([[3, 5]]))
print(f"Prediction for [3, 5]: {test_prediction[0]}")

print("Environment test completed successfully!")