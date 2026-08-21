# Challenge 14: Find Factorial
number = int(input("Enter a number: "))

factorial = 1
for i in range(1, number + 1):
    factorial *= i

print("Factorial:", factorial)