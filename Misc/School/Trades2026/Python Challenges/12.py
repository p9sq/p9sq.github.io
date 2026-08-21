# Challenge 12: Print Multiplication Table
number = int(input("Enter a number: "))
range_limit = int(input("Enter the range limit: "))

print("Multiplication Table for", number, ":")
for i in range(1, range_limit + 1):
    print(number, "x", i, "=", number * i)