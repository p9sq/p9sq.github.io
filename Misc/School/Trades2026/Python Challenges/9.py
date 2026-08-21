# Challenge 9: Check if a Number is Prime
import math

number = int(input("Enter a number: "))

if number > 1:
    for i in range(2, int(math.sqrt(number)) + 1):
        if number % i == 0:
            print("Not Prime")
            break
    else:
        print("Prime")
else:
    print("Not Prime")