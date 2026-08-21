# Challenge 26: Find GCD
import math

def find_gcd(num1, num2):
    return math.gcd(num1, num2)

num1 = int(input("Enter the first number: "))
num2 = int(input("Enter the second number: "))
print("GCD:", find_gcd(num1, num2))