# Challenge 21: Calculated Area of a Circle
import math

def calculate_area(radius):
    return math.pi * radius ** 2

radius = float(input("Enter the radius of the circle: "))
print("Area of the circle:", calculate_area(radius))