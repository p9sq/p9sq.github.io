# Challenge 29: Check Armstrong Number
def check_armstrong(number):
    num_digits = len(str(number))
    sum = 0
    temp = number
    while temp > 0:
        digit = temp % 10
        sum += digit ** num_digits
        temp //= 10
    return sum == number

number = int(input("Enter a number: "))
if check_armstrong(number):
    print("Armstrong Number")
else:
    print("Not an Armstrong Number")