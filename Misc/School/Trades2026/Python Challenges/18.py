# Challenge 18: Reverse a Number
number = int(input("Enter a number: "))

reverse = 0
while number > 0:
    digit = number % 10
    number //= 10

print("Reverse:", reverse)