# Challenge 16: Check Armstrong Number
number = int(input("Enter a number: "))
original_number = number
num_digits = len(str(number))
sum = 0

while number > 0:
    digit = number % 10
    sum += digit ** num_digits
    number //= 10

if sum == original_number:
    print("Armstrong Number")
else:
    print("Not an Armstrong Number")